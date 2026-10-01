/**
 * WireOps Desk / Amaica Media
 * Ghost CMS Publishing Gateway Connector
 *
 * Integrates directly with Ghost Admin API v3/v4/v5.
 * Features:
 * 1. Native Web Crypto JWT generator (HS256) matching Ghost Admin API specs.
 * 2. Strict Zero-Emoji payload sanitization.
 * 3. Tag and excerpt formatting.
 * 4. Fallback and connection health check diagnostics.
 */

import { stripEmojis } from "@/lib/articleValidation";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

export interface GhostConfig {
  siteUrl: string;
  adminApiKey: string; // format: id:secret (secret is 64 hex chars)
  defaultStatus: "draft" | "published" | "scheduled";
}

const STORAGE_KEY = "wireops_ghost_config";

export const DEFAULT_GHOST_CONFIG: GhostConfig = {
  siteUrl: "",
  adminApiKey: "",
  defaultStatus: "draft",
};

export function getGhostConfig(): GhostConfig {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GHOST_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      siteUrl: (parsed.siteUrl || "").trim().replace(/\/+$/, ""),
      adminApiKey: (parsed.adminApiKey || "").trim(),
      defaultStatus: parsed.defaultStatus || "draft",
    };
  } catch {
    return { ...DEFAULT_GHOST_CONFIG };
  }
}

export function saveGhostConfig(config: Partial<GhostConfig>): GhostConfig {
  const current = getGhostConfig();
  const updated: GhostConfig = {
    ...current,
    ...config,
    siteUrl: (config.siteUrl ?? current.siteUrl).trim().replace(/\/+$/, ""),
  };
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

/**
 * Encodes a string or buffer into base64url format.
 */
function toBase64Url(buffer: Uint8Array | string): string {
  const base64 =
    typeof buffer === "string"
      ? btoa(buffer)
      : btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generates an HS256-signed JWT for Ghost Admin API authentication.
 */
export async function generateGhostToken(adminApiKey: string): Promise<string> {
  const parts = adminApiKey.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid Ghost Admin API Key format. Expected '{id}:{secret}'.");
  }
  const [id, secretHex] = parts;
  if (!secretHex || secretHex.length !== 64) {
    throw new Error("Invalid Ghost Admin Secret. Expected 64-character hexadecimal string.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT", kid: id };
  const payload = {
    iat: now,
    exp: now + 300, // 5 minutes validity
    aud: "/admin/",
  };

  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Convert hex secret to Uint8Array
  const match = secretHex.match(/.{1,2}/g);
  if (!match) throw new Error("Could not parse Ghost Admin secret hex string.");
  const secretBytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));

  if (
    typeof globalThis.crypto === "undefined" ||
    !globalThis.crypto.subtle ||
    typeof globalThis.crypto.subtle.importKey !== "function"
  ) {
    throw new Error("Web Crypto API is not available in the current runtime environment.");
  }

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = toBase64Url(new Uint8Array(signatureBuffer));
  return `${unsignedToken}.${signatureB64}`;
}

export interface GhostPublishPayload {
  headline: string;
  lede?: string | null;
  body: string;
  byline?: string | null;
  hero_image_url?: string | null;
  tags?: string[];
  status?: "draft" | "published" | "scheduled";
}

export interface GhostPublishResult {
  success: boolean;
  post_url?: string;
  post_id?: string;
  error?: string;
}

/**
 * Publishes an article to Ghost CMS using the Admin API.
 */
export async function publishToGhost(
  payload: GhostPublishPayload,
  customConfig?: Partial<GhostConfig>
): Promise<GhostPublishResult> {
  const config = { ...getGhostConfig(), ...customConfig };
  if (!config.siteUrl || !config.adminApiKey) {
    return {
      success: false,
      error: "Ghost CMS site URL and Admin API Key must be configured.",
    };
  }

  // 1. Strict Zero-Emoji Sanitization
  const cleanHeadline = stripEmojis(payload.headline);
  const cleanLede = stripEmojis(payload.lede || "");
  const cleanBody = stripEmojis(payload.body);
  const cleanByline = stripEmojis(payload.byline || "WireOps Desk");

  // Convert body to clean HTML
  const paragraphs = cleanBody
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/^#+\s*/, "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("\n");
  const bylineHtml = cleanByline ? `<p><em>By ${cleanByline}</em></p>` : "";
  const ledeHtml = cleanLede ? `<p><strong>${cleanLede}</strong></p>` : "";
  const htmlContent = `${bylineHtml}${ledeHtml}${paragraphs}`;

  try {
    const token = await generateGhostToken(config.adminApiKey);
    const apiUrl = `${config.siteUrl.replace(/\/+$/, "")}/ghost/api/admin/posts/`;

    const tags = (payload.tags || []).map((t) => ({ name: stripEmojis(t) }));
    const postStatus = payload.status || config.defaultStatus || "draft";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Ghost ${token}`,
        "Content-Type": "application/json",
        "Accept-Version": "v5.0",
      },
      body: JSON.stringify({
        posts: [
          {
            title: cleanHeadline,
            html: htmlContent,
            status: postStatus,
            custom_excerpt: cleanLede || undefined,
            feature_image: payload.hero_image_url || undefined,
            tags,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data?.posts?.[0]) {
      const post = data.posts[0];
      return {
        success: true,
        post_url: post.url || `${config.siteUrl}/p/${post.id}/`,
        post_id: post.id,
      };
    }

    const errMsg =
      data?.errors?.[0]?.message ||
      `Ghost Admin API responded with HTTP ${response.status}`;
    return {
      success: false,
      error: errMsg,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to dispatch post to Ghost Admin API.",
    };
  }
}

/**
 * Health check diagnostics for Ghost Admin API connection.
 */
export async function testGhostConnection(customConfig?: Partial<GhostConfig>): Promise<{
  ok: boolean;
  status: number;
  message: string;
  latencyMs: number;
}> {
  const config = { ...getGhostConfig(), ...customConfig };
  const startTime = Date.now();

  if (!config.siteUrl || !config.adminApiKey) {
    return {
      ok: false,
      status: 0,
      message: "Site URL and Admin API Key are required to test Ghost connection.",
      latencyMs: 0,
    };
  }

  try {
    const token = await generateGhostToken(config.adminApiKey);
    const apiUrl = `${config.siteUrl.replace(/\/+$/, "")}/ghost/api/admin/site/`;

    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Ghost ${token}`,
        "Accept-Version": "v5.0",
      },
    });

    const latencyMs = Date.now() - startTime;
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        message: `Successfully connected to Ghost publication: ${data?.site?.title || config.siteUrl}`,
        latencyMs,
      };
    }

    return {
      ok: false,
      status: res.status,
      message: data?.errors?.[0]?.message || `Ghost responded with HTTP ${res.status}`,
      latencyMs,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      message: err?.message || "Network error while connecting to Ghost site.",
      latencyMs: Date.now() - startTime,
    };
  }
}
