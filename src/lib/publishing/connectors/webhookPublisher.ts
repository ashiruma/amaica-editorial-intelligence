/**
 * WireOps Desk / Amaica Media
 * Webhook Distribution Gateway Connector
 *
 * Dispatches verified journalistic dispatches to syndication partners,
 * downstream distribution feeds, or custom CMS endpoints.
 * Features:
 * 1. HMAC-SHA256 signature header (X-WireOps-Signature) for payload verification.
 * 2. ISO timestamp header (X-WireOps-Timestamp).
 * 3. Strict Zero-Emoji sanitization before dispatch.
 */

import { stripEmojis } from "@/lib/articleValidation";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

export interface WebhookConfig {
  webhookUrl: string;
  secretKey?: string;
  customHeaders?: Record<string, string>;
}

const STORAGE_KEY = "wireops_webhook_config";

export function getWebhookConfig(): WebhookConfig {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return { webhookUrl: "" };
    return JSON.parse(raw);
  } catch {
    return { webhookUrl: "" };
  }
}

export function saveWebhookConfig(config: Partial<WebhookConfig>): WebhookConfig {
  const current = getWebhookConfig();
  const updated: WebhookConfig = { ...current, ...config };
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

/**
 * Computes an HMAC-SHA256 signature string for an arbitrary payload.
 */
export async function computeHmacSignature(secret: string, payload: string): Promise<string> {
  if (
    typeof globalThis.crypto === "undefined" ||
    !globalThis.crypto.subtle ||
    typeof globalThis.crypto.subtle.importKey !== "function"
  ) {
    return `unsigned-${Date.now()}`;
  }

  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface WebhookPublishPayload {
  articleId: string;
  headline: string;
  lede?: string | null;
  body: string;
  byline?: string | null;
  category?: string | null;
  region?: string | null;
  hero_image_url?: string | null;
  publishedAt: string;
  contentHash?: string;
}

export interface WebhookPublishResult {
  success: boolean;
  status?: number;
  post_url?: string;
  error?: string;
}

/**
 * Dispatches an article payload to the configured webhook endpoint.
 */
export async function dispatchToWebhook(
  payload: WebhookPublishPayload,
  customConfig?: Partial<WebhookConfig>
): Promise<WebhookPublishResult> {
  const config = { ...getWebhookConfig(), ...customConfig };
  if (!config.webhookUrl) {
    return {
      success: false,
      error: "Webhook destination URL is not configured.",
    };
  }

  // 1. Strict Zero-Emoji Sanitization
  const sanitizedPayload: WebhookPublishPayload = {
    articleId: payload.articleId,
    headline: stripEmojis(payload.headline),
    lede: stripEmojis(payload.lede || ""),
    body: stripEmojis(payload.body),
    byline: stripEmojis(payload.byline || "WireOps Desk"),
    category: payload.category ? stripEmojis(payload.category) : undefined,
    region: payload.region ? stripEmojis(payload.region) : undefined,
    hero_image_url: payload.hero_image_url,
    publishedAt: payload.publishedAt || new Date().toISOString(),
    contentHash: payload.contentHash,
  };

  const payloadString = JSON.stringify(sanitizedPayload);
  const timestamp = new Date().toISOString();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-WireOps-Timestamp": timestamp,
    ...(config.customHeaders || {}),
  };

  if (config.secretKey) {
    const signature = await computeHmacSignature(config.secretKey, payloadString);
    headers["X-WireOps-Signature"] = `sha256=${signature}`;
  }

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers,
      body: payloadString,
    });

    if (response.ok) {
      return {
        success: true,
        status: response.status,
        post_url: config.webhookUrl,
      };
    }

    const text = await response.text().catch(() => "");
    return {
      success: false,
      status: response.status,
      error: `Webhook returned HTTP ${response.status}: ${text.substring(0, 200)}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to deliver payload to webhook endpoint.",
    };
  }
}
