/**
 * WireOps Desk / Amaica Media
 * Security Input Sanitizer & XSS Defense Engine
 *
 * Operational Standard: Zero-Emoji Workplace Standard
 * Defenses:
 * 1. Strips executable script tags and embedded active content.
 * 2. Purges DOM event handlers (onclick, onerror, onload, etc.).
 * 3. Strips javascript: and dangerous URI schemes.
 * 4. Enforces Zero-Emoji standards on sanitized text.
 * 5. Escapes untrusted user input for safe HTML insertion.
 */

import { stripEmojis } from "@/lib/articleValidation";

export interface SanitizationOptions {
  stripAllHtml?: boolean;
  allowSafeFormatting?: boolean; // allow <p>, <strong>, <em>, <a>, <blockquote>
  stripEmojisFlag?: boolean;
}

const DANGEROUS_TAG_REGEX = /<\s*\/?\s*(?:script|iframe|object|embed|applet|base|link|meta|style|form|input|button)\b[^>]*>/gi;
const INLINE_EVENT_HANDLER_REGEX = /\s+on[a-z0-9_-]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /(?:href|src|action)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi;
const DATA_HTML_PROTOCOL_REGEX = /(?:href|src)\s*=\s*(?:'data:text\/html[^']*'|"data:text\/html[^"]*"|data:text\/html[^\s>]+)/gi;

/**
 * Escapes HTML characters for safe text insertion.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes raw HTML input to prevent Cross-Site Scripting (XSS).
 */
export function sanitizeHtml(
  rawInput: string,
  options: SanitizationOptions = { allowSafeFormatting: true, stripEmojisFlag: true }
): string {
  if (!rawInput) return "";

  let cleaned = rawInput;

  // 1. Strip script tags with content inside
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Strip dangerous HTML elements
  cleaned = cleaned.replace(DANGEROUS_TAG_REGEX, "");

  // 3. Strip inline event handlers (onerror, onload, onclick, etc.)
  cleaned = cleaned.replace(INLINE_EVENT_HANDLER_REGEX, "");

  // 4. Strip javascript: and data:text/html URI schemes
  cleaned = cleaned.replace(JAVASCRIPT_PROTOCOL_REGEX, "");
  cleaned = cleaned.replace(DATA_HTML_PROTOCOL_REGEX, "");

  // 5. If stripAllHtml requested, remove all tags
  if (options.stripAllHtml) {
    cleaned = cleaned.replace(/<[^>]*>/g, "");
  }

  // 6. Enforce Zero-Emoji standard
  if (options.stripEmojisFlag !== false) {
    cleaned = stripEmojis(cleaned);
  }

  return cleaned.trim();
}

/**
 * Validates whether an untrusted input contains dangerous executable injection tokens.
 */
export function detectMaliciousTokens(input: string): {
  isMalicious: boolean;
  detectedThreats: string[];
} {
  if (!input) return { isMalicious: false, detectedThreats: [] };

  const threats: string[] = [];

  if (/<script/i.test(input)) {
    threats.push("Script Tag Injection");
  }
  if (INLINE_EVENT_HANDLER_REGEX.test(input)) {
    threats.push("DOM Event Handler Injection");
  }
  if (/javascript:/i.test(input)) {
    threats.push("JavaScript URI Scheme");
  }
  if (/<iframe/i.test(input)) {
    threats.push("IFrame Element Injection");
  }
  if (/document\.(?:cookie|location|domain)/i.test(input)) {
    threats.push("DOM Document Property Access");
  }

  return {
    isMalicious: threats.length > 0,
    detectedThreats: threats,
  };
}
