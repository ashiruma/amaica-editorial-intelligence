/**
 * WireOps Desk: SSRF-Hardened Newsroom Scraper Service
 * Location: src/lib/scraper/ssrfHardenedScraper.ts
 *
 * Enforces:
 * - Pre-flight SSRF validation via SSRFValidator
 * - Redirect-hop revalidation (max 3 redirects)
 * - 8-second request timeout via AbortController
 * - 2MB response size limit
 * - Content-Type whitelisting
 * - Clean metadata, HTML text, and hero image extraction
 */

import { SSRFValidator } from "./ipValidator";

export interface ScrapedArticleData {
  url: string;
  canonicalUrl: string;
  title: string;
  author?: string;
  publishedDate?: string;
  excerpt?: string;
  bodyText: string;
  heroImageUrl?: string;
  contentHash: string;
  sourceDomain: string;
}

export interface HardenedScrapeResult {
  success: boolean;
  data?: ScrapedArticleData;
  error?: string;
  statusCode?: number;
  durationMs: number;
}

export class SSRFHardenedScraper {
  private static readonly MAX_REDIRECTS = 3;
  private static readonly TIMEOUT_MS = 8000;
  private static readonly MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB

  private static readonly ALLOWED_CONTENT_TYPES = [
    "text/html",
    "application/xhtml+xml",
    "application/xml",
    "text/xml",
    "application/rss+xml",
    "application/atom+xml",
    "application/json",
  ];

  /**
   * Scrapes an external article URL with strict SSRF defense.
   */
  public static async scrapeUrl(rawUrl: string): Promise<HardenedScrapeResult> {
    const startTime = Date.now();

    // 1. Initial SSRF check
    const validation = SSRFValidator.validateUrl(rawUrl);
    if (!validation.isValid) {
      return {
        success: false,
        error: `SSRF Blocked: ${validation.reason}`,
        durationMs: Date.now() - startTime,
      };
    }

    let currentUrl = validation.sanitizedUrl!;
    let redirectCount = 0;

    try {
      while (redirectCount <= this.MAX_REDIRECTS) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        const response = await fetch(currentUrl, {
          method: "GET",
          headers: {
            "User-Agent": "WireOpsNewsBot/2.0 (+https://wireops-desk.vercel.app/bot)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          redirect: "manual", // Handle redirects manually to re-verify destination IPs
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check for redirects (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          redirectCount++;
          if (redirectCount > this.MAX_REDIRECTS) {
            return {
              success: false,
              error: `Scrape error: Exceeded maximum allowed redirects (${this.MAX_REDIRECTS})`,
              durationMs: Date.now() - startTime,
            };
          }

          const locationHeader = response.headers.get("location");
          if (!locationHeader) {
            return {
              success: false,
              error: "Redirect status received without Location header",
              durationMs: Date.now() - startTime,
            };
          }

          // Resolve relative redirect against current URL
          const resolvedRedirectUrl = new URL(locationHeader, currentUrl).toString();

          // CRITICAL: Re-validate redirect destination for SSRF!
          const redirectValidation = SSRFValidator.validateUrl(resolvedRedirectUrl);
          if (!redirectValidation.isValid) {
            return {
              success: false,
              error: `SSRF Redirect Blocked: Target '${resolvedRedirectUrl}' rejected: ${redirectValidation.reason}`,
              durationMs: Date.now() - startTime,
            };
          }

          currentUrl = redirectValidation.sanitizedUrl!;
          continue;
        }

        if (!response.ok) {
          return {
            success: false,
            statusCode: response.status,
            error: `HTTP Error ${response.status}: ${response.statusText}`,
            durationMs: Date.now() - startTime,
          };
        }

        // Validate Content-Type
        const contentType = response.headers.get("content-type") || "";
        const isAllowedType = this.ALLOWED_CONTENT_TYPES.some((t) =>
          contentType.toLowerCase().includes(t)
        );

        if (!isAllowedType) {
          return {
            success: false,
            error: `Disallowed Content-Type: '${contentType}'. Scraper accepts only HTML/XML/JSON.`,
            durationMs: Date.now() - startTime,
          };
        }

        // Read body with byte size limit
        const rawText = await response.text();
        if (rawText.length > this.MAX_BODY_BYTES) {
          return {
            success: false,
            error: `Response body exceeded size cap of 2MB (received ${rawText.length} bytes)`,
            durationMs: Date.now() - startTime,
          };
        }

        // Parse HTML content
        const parsedData = this.parseHtml(rawText, currentUrl);

        return {
          success: true,
          statusCode: response.status,
          data: parsedData,
          durationMs: Date.now() - startTime,
        };
      }

      return {
        success: false,
        error: "Too many redirects",
        durationMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isAbort = err instanceof Error && err.name === "AbortError";

      return {
        success: false,
        error: isAbort ? "Request timed out after 8 seconds" : errorMsg,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Extracts journalistic text and metadata from HTML content
   */
  public static parseHtml(html: string, sourceUrl: string): ScrapedArticleData {
    const urlObj = new URL(sourceUrl);
    const domain = urlObj.hostname.replace(/^www\./, "");

    // Title extraction
    const titleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:title["']\s+content=["'](.*?)["']/i) ||
      html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? this.decodeHtmlEntities(titleMatch[1]).trim() : "Wire Lead";

    // Excerpt / Description extraction
    const descMatch =
      html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const excerpt = descMatch ? this.decodeHtmlEntities(descMatch[1]).trim() : undefined;

    // Hero image extraction
    const imgMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i);
    let heroImageUrl: string | undefined;
    if (imgMatch && imgMatch[1]) {
      try {
        heroImageUrl = new URL(imgMatch[1], sourceUrl).toString();
      } catch {
        heroImageUrl = imgMatch[1];
      }
    }

    // Author extraction
    const authorMatch =
      html.match(/<meta\s+name=["']author["']\s+content=["'](.*?)["']/i) ||
      html.match(/rel=["']author["'][^>]*>(.*?)<\/a>/i);
    const author = authorMatch ? this.decodeHtmlEntities(authorMatch[1]).trim() : undefined;

    // Published date extraction
    const dateMatch =
      html.match(/<meta\s+property=["']article:published_time["']\s+content=["'](.*?)["']/i) ||
      html.match(/<time[^>]*datetime=["'](.*?)["']/i);
    const publishedDate = dateMatch ? dateMatch[1] : undefined;

    // Body extraction: strip script, style, and comments
    let cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");

    // Extract paragraphs
    const paragraphMatches = cleanHtml.match(/<p\b[^>]*>(.*?)<\/p>/gis) || [];
    const paragraphs = paragraphMatches
      .map((p) => p.replace(/<[^>]+>/g, " ").trim())
      .map((p) => this.decodeHtmlEntities(p))
      .filter((p) => p.length > 25); // Ignore navigation crumbs

    const bodyText = paragraphs.join("\n\n");

    // Compute simple hash for deduplication
    const contentHash = this.computeHash(`${title}|${bodyText.slice(0, 500)}`);

    return {
      url: sourceUrl,
      canonicalUrl: sourceUrl,
      title,
      author,
      publishedDate,
      excerpt,
      bodyText,
      heroImageUrl,
      contentHash,
      sourceDomain: domain,
    };
  }

  /**
   * Deterministic 64-bit string hash for deduplication
   */
  public static computeHash(input: string): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) + hash) + input.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }

  private static decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");
  }
}
