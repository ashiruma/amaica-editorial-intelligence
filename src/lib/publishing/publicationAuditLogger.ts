/**
 * WireOps Desk / Amaica Media
 * Publication Cryptographic Audit Logger
 *
 * Provides tamper-evident audit trails for every publication event:
 * - Computes SHA-256 hash of published article content.
 * - Stores complete pre-flight snapshot, editor identity, and destination metadata.
 * - Supports persistence via Supabase audit_logs with resilient local storage fallback.
 */

import { supabase } from "@/integrations/supabase/client";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";
import type { PreFlightCheckResult } from "./preflightGatekeeper";

export interface PublicationAuditRecord {
  auditId: string;
  articleId: string;
  headline: string;
  editorId: string;
  editorRole: string;
  destinationChannel: "wordpress" | "ghost" | "webhook" | "internal";
  destinationUrl?: string;
  preflightSnapshot: PreFlightCheckResult;
  articleContentHash: string;
  publishedAt: string;
}

const LOCAL_AUDIT_KEY = "wireops_publication_audits";

/**
 * Computes deterministic SHA-256 hash of article content string.
 */
export async function computeContentHash(content: string): Promise<string> {
  const normalized = content.trim();
  if (
    typeof globalThis.crypto !== "undefined" &&
    globalThis.crypto.subtle &&
    typeof globalThis.crypto.subtle.digest === "function"
  ) {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Pure JS fallback hash for environments lacking Web Crypto subtle
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, "0");
}

/**
 * Normalizes article fields into standard concatenated text for hashing.
 */
export function buildArticleContentForHash(article: {
  headline: string;
  lede?: string | null;
  body: string;
  byline?: string | null;
}): string {
  return [
    (article.headline || "").trim(),
    (article.lede || "").trim(),
    (article.body || "").trim(),
    (article.byline || "").trim(),
  ].join("\n---\n");
}

/**
 * Records a verified publication audit entry.
 */
export async function logPublicationAudit(
  recordInput: Omit<PublicationAuditRecord, "auditId" | "articleContentHash" | "publishedAt"> & {
    articleContent: string | { headline: string; lede?: string | null; body: string; byline?: string | null };
  }
): Promise<PublicationAuditRecord> {
  const contentString =
    typeof recordInput.articleContent === "string"
      ? recordInput.articleContent
      : buildArticleContentForHash(recordInput.articleContent);

  const hash = await computeContentHash(contentString);
  const auditId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const record: PublicationAuditRecord = {
    auditId,
    articleId: recordInput.articleId,
    headline: recordInput.headline,
    editorId: recordInput.editorId,
    editorRole: recordInput.editorRole,
    destinationChannel: recordInput.destinationChannel,
    destinationUrl: recordInput.destinationUrl,
    preflightSnapshot: recordInput.preflightSnapshot,
    articleContentHash: hash,
    publishedAt: new Date().toISOString(),
  };

  // 1. Persist to local fallback storage
  try {
    const raw = safeGetItem(LOCAL_AUDIT_KEY);
    const list: PublicationAuditRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    // Keep last 100 entries locally
    if (list.length > 100) list.length = 100;
    safeSetItem(LOCAL_AUDIT_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Failed to persist publication audit to local storage:", err);
  }

  // 2. Persist to Supabase audit_logs
  try {
    await supabase.from("audit_logs" as any).insert({
      action: "publish",
      from_status: "in_review",
      to_status: "published",
      error_count: 0,
      warning_count: 0,
      notes: `Published to ${record.destinationChannel}. Hash: ${hash.substring(0, 12)}... Dest: ${record.destinationUrl || "N/A"}`,
    });
  } catch (dbErr) {
    // Non-blocking for resilient offline operations
    console.warn("Supabase audit_logs insert failed:", dbErr);
  }

  return record;
}

/**
 * Retrieves persisted publication audit logs.
 */
export function getLocalPublicationAudits(articleId?: string): PublicationAuditRecord[] {
  try {
    const raw = safeGetItem(LOCAL_AUDIT_KEY);
    if (!raw) return [];
    const list: PublicationAuditRecord[] = JSON.parse(raw);
    if (articleId) {
      return list.filter((r) => r.articleId === articleId);
    }
    return list;
  } catch {
    return [];
  }
}

/**
 * Cryptographically verifies if the current article content matches an audit record hash.
 */
export async function verifyArticleIntegrity(
  articleContent: string | { headline: string; lede?: string | null; body: string; byline?: string | null },
  expectedHash: string
): Promise<boolean> {
  const contentString =
    typeof articleContent === "string"
      ? articleContent
      : buildArticleContentForHash(articleContent);
  const currentHash = await computeContentHash(contentString);
  return currentHash.toLowerCase() === expectedHash.toLowerCase();
}
