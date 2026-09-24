/**
 * WireOps Desk - WordPress Connector & Publishing Gateway
 *
 * Provides end-to-end integration with WordPress.com and self-hosted WordPress sites.
 * Features:
 * 1. Automatic Zero-Emoji payload sanitization ("NO EMOJIs anywhere in my work").
 * 2. Primary push via Supabase Edge Function ('publish-wordpress').
 * 3. Direct client-side REST API fallback when Supabase host is offline/unreachable.
 * 4. Diagnostics & Connection health check tester.
 */

import { supabase } from "@/integrations/supabase/client";
import { stripEmojis } from "@/lib/articleValidation";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

export interface WordPressConfig {
  siteUrl: string;
  type: "wordpress_com" | "self_hosted";
  apiKey?: string;
  username?: string;
  defaultStatus: "pending" | "draft" | "publish";
}

const STORAGE_KEY = "wireops_wordpress_config";

export const DEFAULT_WP_CONFIG: WordPressConfig = {
  siteUrl: "theashirumanow.wordpress.com",
  type: "wordpress_com",
  defaultStatus: "pending",
};

export function getWordPressConfig(): WordPressConfig {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WP_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      siteUrl: (parsed.siteUrl || DEFAULT_WP_CONFIG.siteUrl).trim(),
      type: parsed.type === "self_hosted" ? "self_hosted" : "wordpress_com",
      apiKey: parsed.apiKey || "",
      username: parsed.username || "",
      defaultStatus: parsed.defaultStatus || "pending",
    };
  } catch {
    return { ...DEFAULT_WP_CONFIG };
  }
}

export function saveWordPressConfig(config: Partial<WordPressConfig>): WordPressConfig {
  const current = getWordPressConfig();
  const updated: WordPressConfig = {
    ...current,
    ...config,
    siteUrl: (config.siteUrl ?? current.siteUrl).trim().replace(/^https?:\/\//i, "").replace(/\/+$/, ""),
  };
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export interface WordPressTestResult {
  ok: boolean;
  status: number;
  message: string;
  latencyMs: number;
  siteName?: string;
}

/**
 * Pings the configured WordPress endpoint to verify connectivity and credentials.
 */
export async function testWordPressConnection(customConfig?: Partial<WordPressConfig>): Promise<WordPressTestResult> {
  const config = { ...getWordPressConfig(), ...customConfig };
  const startTime = Date.now();
  const cleanSite = (config.siteUrl || DEFAULT_WP_CONFIG.siteUrl).replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  try {
    if (config.type === "wordpress_com") {
      const url = `https://public-api.wordpress.com/rest/v1.1/sites/${encodeURIComponent(cleanSite)}`;
      const headers: Record<string, string> = {};
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey.trim()}`;
      }

      const res = await fetch(url, { headers });
      const latencyMs = Date.now() - startTime;
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          ok: true,
          status: res.status,
          message: `Successfully connected to WordPress.com site: ${data.name || cleanSite}`,
          siteName: data.name,
          latencyMs,
        };
      } else {
        return {
          ok: false,
          status: res.status,
          message: data.message || `WordPress.com responded with HTTP ${res.status}`,
          latencyMs,
        };
      }
    } else {
      // Self-Hosted WordPress REST API
      const base = cleanSite.startsWith("http") ? cleanSite : `https://${cleanSite}`;
      const url = `${base}/wp-json/wp/v2/settings`;
      const headers: Record<string, string> = {};
      if (config.username && config.apiKey) {
        headers["Authorization"] = `Basic ${btoa(`${config.username.trim()}:${config.apiKey.trim()}`)}`;
      }

      const res = await fetch(url, { headers });
      const latencyMs = Date.now() - startTime;
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          ok: true,
          status: res.status,
          message: `Connected to self-hosted WordPress site: ${data.title || cleanSite}`,
          siteName: data.title,
          latencyMs,
        };
      } else {
        // Fallback check on public endpoint
        const pubRes = await fetch(`${base}/wp-json/wp/v2/posts?per_page=1`);
        if (pubRes.ok) {
          return {
            ok: true,
            status: pubRes.status,
            message: `Connected to self-hosted WordPress API (${cleanSite}). Note: Authenticated post publishing requires valid Application Password.`,
            latencyMs,
          };
        }
        return {
          ok: false,
          status: res.status,
          message: data.message || `Self-hosted WordPress responded with HTTP ${res.status}`,
          latencyMs,
        };
      }
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      ok: false,
      status: 0,
      message: err?.message || "Network request failed. Ensure CORS or domain connectivity is accessible.",
      latencyMs,
    };
  }
}

export interface PublishPayload {
  headline: string;
  lede?: string;
  body: string;
  byline?: string;
  hero_image_url?: string | null;
  category?: string | null;
  status?: "pending" | "draft" | "publish";
}

export interface PublishResult {
  success: boolean;
  post_url?: string;
  post_id?: string;
  error?: string;
  channel: "supabase_edge" | "direct_client";
}

/**
 * Publishes an article to WordPress with zero emojis and resilient failover.
 */
export async function publishArticleToWordPress(payload: PublishPayload): Promise<PublishResult> {
  const config = getWordPressConfig();

  // 1. Strict Zero-Emoji Sanitization ("NO EMOJIs anywhere in my work")
  const cleanHeadline = stripEmojis(payload.headline);
  const cleanLede = stripEmojis(payload.lede || "");
  const cleanBody = stripEmojis(payload.body);
  const cleanByline = stripEmojis(payload.byline || "WireOps Desk");
  const postStatus = payload.status || config.defaultStatus || "pending";

  // 2. Primary Channel: Attempt Supabase Edge Function ('publish-wordpress')
  try {
    const { data, error } = await supabase.functions.invoke("publish-wordpress", {
      body: {
        headline: cleanHeadline,
        lede: cleanLede,
        body: cleanBody,
        byline: cleanByline,
        hero_image_url: payload.hero_image_url,
        category: payload.category,
        status: postStatus,
        site_id: config.siteUrl,
      },
    });

    if (!error && data?.success && data?.post_url) {
      return {
        success: true,
        post_url: data.post_url,
        post_id: String(data.post_id || ""),
        channel: "supabase_edge",
      };
    }
    if (error) {
      console.warn("Supabase publish-wordpress edge function failed, evaluating fallback:", error);
    }
  } catch (cloudErr) {
    console.warn("Supabase host unreachable or function error:", cloudErr);
  }

  // 3. Fallback Channel: Direct REST API if API Key is configured in settings
  if (config.apiKey) {
    try {
      const cleanSite = config.siteUrl.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

      if (config.type === "wordpress_com") {
        // Direct to WordPress.com REST API
        const paragraphs = cleanBody
          .split(/\n\n+/)
          .map((p) => `<p>${p.replace(/^#+\s*/, "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
          .join("\n");
        const bylineHtml = cleanByline ? `<p><em>By ${cleanByline}</em></p>` : "";
        const ledeHtml = cleanLede ? `<p><strong>${cleanLede}</strong></p>` : "";
        const content = `${bylineHtml}${ledeHtml}${paragraphs}`;

        const postRes = await fetch(`https://public-api.wordpress.com/rest/v1.2/sites/${encodeURIComponent(cleanSite)}/posts/new`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: cleanHeadline,
            content,
            status: postStatus,
          }),
        });

        const postJson = await postRes.json();
        if (postRes.ok && postJson?.URL) {
          return {
            success: true,
            post_url: postJson.URL,
            post_id: String(postJson.ID),
            channel: "direct_client",
          };
        }
      } else if (config.type === "self_hosted" && config.username) {
        // Direct to Self-Hosted WordPress REST API
        const base = cleanSite.startsWith("http") ? cleanSite : `https://${cleanSite}`;
        const paragraphs = cleanBody
          .split(/\n\n+/)
          .map((p) => `<p>${p.replace(/^#+\s*/, "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
          .join("\n");
        const bylineHtml = cleanByline ? `<p><em>By ${cleanByline}</em></p>` : "";
        const ledeHtml = cleanLede ? `<p><strong>${cleanLede}</strong></p>` : "";
        const content = `${bylineHtml}${ledeHtml}${paragraphs}`;

        const postRes = await fetch(`${base}/wp-json/wp/v2/posts`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${config.username.trim()}:${config.apiKey.trim()}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: cleanHeadline,
            content,
            status: postStatus === "pending" ? "draft" : postStatus,
          }),
        });

        const postJson = await postRes.json();
        if (postRes.ok && (postJson?.link || postJson?.guid?.rendered)) {
          return {
            success: true,
            post_url: postJson.link || postJson.guid?.rendered,
            post_id: String(postJson.ID || postJson.id),
            channel: "direct_client",
          };
        }
      }
    } catch (directErr: any) {
      console.warn("Direct WordPress fallback failed:", directErr);
    }
  }

  return {
    success: false,
    error: `WordPress publish failed. Verify WORDPRESS_COM_API_KEY in Supabase secrets, or configure your WordPress API Key in WireOps Admin Settings. Target site: ${config.siteUrl}`,
    channel: "supabase_edge",
  };
}
