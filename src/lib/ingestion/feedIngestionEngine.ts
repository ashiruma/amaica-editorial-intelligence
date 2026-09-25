/**
 * WireOps Desk: Feed Ingestion & Signal Normalizer Engine
 * Location: src/lib/ingestion/feedIngestionEngine.ts
 *
 * Ingests external news feeds (RSS 2.0, Atom, JSON), normalizes them with
 * strict SSRF security, extracts metadata, checks deduplication hashes,
 * and emits typed StorySignal records.
 */

import { StorySignal, SignalLineageType } from "@/types/intelligence";
import { SSRFHardenedScraper } from "@/lib/scraper/ssrfHardenedScraper";
import { KenyanSourceRegistry } from "./kenyanSourceRegistry";

export interface FeedItemRaw {
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate?: string;
  author?: string;
  imageUrl?: string;
}

export interface IngestionResult {
  sourceDomain: string;
  totalItemsFound: number;
  newSignals: StorySignal[];
  duplicateCount: number;
  errors: string[];
}

export class FeedIngestionEngine {
  /**
   * Fetches and ingests signals from an external RSS/Atom feed URL
   */
  public static async ingestFeed(
    feedUrl: string,
    existingHashes: Set<string> = new Set()
  ): Promise<IngestionResult> {
    const errors: string[] = [];
    const newSignals: StorySignal[] = [];
    let duplicateCount = 0;

    // 1. Fetch feed XML securely with SSRF hardening
    const scrapeRes = await SSRFHardenedScraper.scrapeUrl(feedUrl);
    if (!scrapeRes.success || !scrapeRes.data) {
      return {
        sourceDomain: this.extractDomain(feedUrl),
        totalItemsFound: 0,
        newSignals: [],
        duplicateCount: 0,
        errors: [scrapeRes.error || "Failed to fetch feed"],
      };
    }

    const domain = scrapeRes.data.sourceDomain;
    const sourceProfile = KenyanSourceRegistry.findByDomain(domain);

    // 2. Parse feed XML
    const rawItems = this.parseFeedXml(scrapeRes.data.bodyText || "");

    // 3. Process items into signals
    for (const item of rawItems) {
      if (!item.link || !item.title) continue;

      const contentHash = SSRFHardenedScraper.computeHash(
        `${item.title.trim()}|${item.link.trim()}`
      );

      if (existingHashes.has(contentHash)) {
        duplicateCount++;
        continue;
      }

      // Determine lineage
      const lineageType = this.determineLineage(item, sourceProfile?.syndication_tendency ?? 0.2);

      const signal: StorySignal = {
        id: `sig-${contentHash}`,
        source_id: sourceProfile?.id || `src-${domain}`,
        external_url: item.link,
        canonical_url: item.link,
        raw_title: item.title,
        raw_text: item.content || item.description || null,
        excerpt: item.description || null,
        hero_image_url: item.imageUrl || null,
        author_name: item.author || null,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        detected_at: new Date().toISOString(),
        content_hash: contentHash,
        lineage_type: lineageType,
        created_at: new Date().toISOString(),
      };

      newSignals.push(signal);
      existingHashes.add(contentHash);
    }

    return {
      sourceDomain: domain,
      totalItemsFound: rawItems.length,
      newSignals,
      duplicateCount,
      errors,
    };
  }

  /**
   * Parses RSS 2.0 and Atom XML strings into normalized raw items
   */
  public static parseFeedXml(xml: string): FeedItemRaw[] {
    const items: FeedItemRaw[] = [];

    // RSS 2.0 items
    const rssItemMatches = xml.match(/<item\b[^>]*>([\s\S]*?)<\/item>/gi) || [];
    for (const itemBlock of rssItemMatches) {
      const title = this.extractXmlTag(itemBlock, "title");
      const link = this.extractXmlTag(itemBlock, "link");
      const description = this.extractXmlTag(itemBlock, "description");
      const content = this.extractXmlTag(itemBlock, "content:encoded") || description;
      const pubDate = this.extractXmlTag(itemBlock, "pubDate");
      const author = this.extractXmlTag(itemBlock, "dc:creator") || this.extractXmlTag(itemBlock, "author");

      // Extract image enclosure
      const enclosureMatch = itemBlock.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
      const mediaMatch = itemBlock.match(/<media:content[^>]+url=["']([^"']+)["']/i);
      const imageUrl = enclosureMatch?.[1] || mediaMatch?.[1];

      if (title && link) {
        items.push({
          title: this.cleanCdata(title),
          link: this.cleanCdata(link).trim(),
          description: description ? this.cleanCdata(description) : undefined,
          content: content ? this.cleanCdata(content) : undefined,
          pubDate: pubDate ? this.cleanCdata(pubDate) : undefined,
          author: author ? this.cleanCdata(author) : undefined,
          imageUrl: imageUrl ? this.cleanCdata(imageUrl) : undefined,
        });
      }
    }

    // Atom entries
    if (items.length === 0) {
      const atomEntryMatches = xml.match(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi) || [];
      for (const entryBlock of atomEntryMatches) {
        const title = this.extractXmlTag(entryBlock, "title");
        // Link in atom can be <link href="..." />
        const linkHrefMatch = entryBlock.match(/<link[^>]+href=["']([^"']+)["']/i);
        const link = linkHrefMatch ? linkHrefMatch[1] : this.extractXmlTag(entryBlock, "link");
        const summary = this.extractXmlTag(entryBlock, "summary") || this.extractXmlTag(entryBlock, "content");
        const updated = this.extractXmlTag(entryBlock, "updated") || this.extractXmlTag(entryBlock, "published");
        const author = this.extractXmlTag(entryBlock, "name");

        if (title && link) {
          items.push({
            title: this.cleanCdata(title),
            link: this.cleanCdata(link).trim(),
            description: summary ? this.cleanCdata(summary) : undefined,
            pubDate: updated ? this.cleanCdata(updated) : undefined,
            author: author ? this.cleanCdata(author) : undefined,
          });
        }
      }
    }

    return items;
  }

  /**
   * Identifies whether an article is likely secondary or syndicated copy
   */
  public static determineLineage(
    item: FeedItemRaw,
    outletSyndicationTendency: number
  ): SignalLineageType {
    const textToCheck = `${item.title} ${item.description || ""} ${item.content || ""}`.toLowerCase();

    // Check for syndication markers
    const syndicationMarkers = [
      "according to reports by",
      "as reported by",
      "sourced from",
      "quoted by",
      "in an interview with",
      "wire report",
      "kna reports",
    ];

    const hasMarker = syndicationMarkers.some((m) => textToCheck.includes(m));

    if (hasMarker || outletSyndicationTendency > 0.4) {
      return "syndicated_copy";
    }

    return "original_report";
  }

  private static extractXmlTag(xmlBlock: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const match = xmlBlock.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private static cleanCdata(text: string): string {
    return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
  }

  private static extractDomain(urlStr: string): string {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, "");
    } catch {
      return "unknown";
    }
  }
}
