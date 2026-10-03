/**
 * WireOps Desk: Live News Gatherer Service
 * Location: src/lib/ingestion/liveNewsGatherer.ts
 *
 * Ingests timely, authentic live stories focusing on Western Kenya
 * (Kakamega, Vihiga, Bungoma, Busia, Siaya) and Kenyan national beats.
 *
 * Resilience Strategy:
 * 1. Primary: Serverless aggregator endpoint (/api/live-feeds)
 * 2. Fallback: Jina Reader portal scraper
 * 3. Fallback: Resilient curated live wire leads
 */

import { supabase } from "@/integrations/supabase/client";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";
import { calculateTrendingVelocityScore, CURATED_TRENDING_LEADS, type TrendingWireLead } from "@/lib/editorial/wireRepurposingEngine";
import { scrapeKenyanEntertainmentPortals } from "@/lib/scraperService";
import {
  decodeHtmlEntities,
  purgePhotoArtifactsAndCaptions,
  purgeSyntheticFeedAttribution,
} from "@/lib/editorial/htmlEntityDecoder";

export interface DiscoveredWireStory {
  id: string;
  title: string;
  source: string;
  source_url: string;
  excerpt: string | null;
  image_url: string | null;
  region: string;
  category: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  highlights?: string[] | null;
  preview_summary?: string | null;
  trendingScore?: number;
}

const STORAGE_CACHE_KEY = "amaica_discovered_stories_cache";
const LAST_SCRAPE_KEY = "amaica_last_portal_scrape_time";

export class LiveNewsGatherer {
  /**
   * Primary entry point: gathers live stories across all channels with fallback
   */
  public static async gatherStories(options?: {
    beat?: string;
    region?: string;
    forceRefresh?: boolean;
    onProgress?: (message: string) => void;
  }): Promise<DiscoveredWireStory[]> {
    const onProgress = options?.onProgress;
    let gathered: DiscoveredWireStory[] = [];

    // Attempt 1: Serverless aggregator endpoint (/api/live-feeds)
    if (typeof process === "undefined" || process.env?.NODE_ENV !== "test") {
      try {
        onProgress?.("Connecting to live wire feeds...");
        const url = new URL("/api/live-feeds", typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
        if (options?.beat && options.beat !== "all") {
          url.searchParams.set("beat", options.beat);
        }
        if (options?.region && options.region !== "all") {
          url.searchParams.set("region", options.region);
        }
        url.searchParams.set("limit", "60");

        let signal: AbortSignal | undefined;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
          if (typeof AbortController !== "undefined") {
            const controller = new AbortController();
            if (typeof AbortSignal !== "undefined" && controller.signal instanceof AbortSignal) {
              signal = controller.signal;
            }
            timeoutId = setTimeout(() => {
              try { controller.abort(); } catch {}
            }, 6000);
          }
        } catch {}

        const fetchOptions: RequestInit = {
          headers: { Accept: "application/json" },
        };
        if (signal) {
          fetchOptions.signal = signal;
        }

        const res = await fetch(url.toString(), fetchOptions);
        if (timeoutId) clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.stories) && data.stories.length > 0) {
            gathered = data.stories.map((s: any) => {
              const cleanTitle = decodeHtmlEntities(s.title || "");
              const cleanExcerpt = s.excerpt
                ? purgeSyntheticFeedAttribution(purgePhotoArtifactsAndCaptions(decodeHtmlEntities(s.excerpt)))
                : null;
              return {
                id: s.id,
                title: cleanTitle,
                source: s.source,
                source_url: s.source_url,
                excerpt: cleanExcerpt,
                image_url: s.image_url,
                region: s.region || "national",
                category: s.category || "community",
                status: "new",
                published_at: s.published_at || new Date().toISOString(),
                created_at: s.created_at || new Date().toISOString(),
                highlights: [cleanExcerpt].filter(Boolean) as string[],
                preview_summary: cleanExcerpt,
                trendingScore: s.trendingScore ?? calculateTrendingVelocityScore(s),
              };
            });
            onProgress?.(`Gathered ${gathered.length} live stories from wire sources`);
          }
        }
      } catch (apiErr) {
        console.warn("Direct /api/live-feeds fetch fell back:", apiErr);
      }
    }

    // Attempt 2: Direct portal scraper via Jina Reader if serverless returned 0 (skip in unit tests)
    if (gathered.length === 0 && (typeof process === "undefined" || process.env?.NODE_ENV !== "test")) {
      try {
        onProgress?.("Scanning Kenyan entertainment and regional reference portals...");
        const portals = await scrapeKenyanEntertainmentPortals(onProgress);
        if (portals.length > 0) {
          gathered = portals.map((p) => ({
            id: p.id,
            title: p.title,
            source: p.source,
            source_url: p.source_url,
            excerpt: p.excerpt,
            image_url: p.image_url,
            region: p.region,
            category: p.category,
            status: "new",
            published_at: p.published_at || new Date().toISOString(),
            created_at: new Date().toISOString(),
            highlights: [p.excerpt],
            preview_summary: p.excerpt,
            trendingScore: calculateTrendingVelocityScore(p),
          }));
        }
      } catch (scrapeErr) {
        console.warn("Portal scraping fallback warning:", scrapeErr);
      }
    }

    // Attempt 3: If still empty, fall back to curated timely wire leads
    if (gathered.length === 0) {
      onProgress?.("Loading verified wire leads...");
      gathered = CURATED_TRENDING_LEADS.map((l) => ({
        id: l.id,
        title: l.title,
        source: l.source,
        source_url: l.source_url,
        excerpt: l.excerpt,
        image_url: l.image_url,
        region: l.region,
        category: l.category,
        status: "new",
        published_at: l.published_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        highlights: [l.excerpt],
        preview_summary: l.excerpt,
        trendingScore: l.trendingScore ?? calculateTrendingVelocityScore(l),
      }));
    }

    // Filter by beat or region if specified
    if (options?.region && options.region !== "all") {
      gathered = gathered.filter((s) => s.region === options.region);
    }
    if (options?.beat && options.beat !== "all") {
      if (options.beat === "western_kenya") {
        gathered = gathered.filter((s) => s.region === "kakamega" || s.region === "western_kenya");
      } else {
        gathered = gathered.filter((s) => s.category === options.beat);
      }
    }

    // Sort descending by trending score
    gathered.sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));

    // Cache to localStorage
    try {
      safeSetItem(STORAGE_CACHE_KEY, JSON.stringify(gathered));
      safeSetItem(LAST_SCRAPE_KEY, String(Date.now()));
    } catch {}

    // Asynchronously sync to Supabase discovered_stories table
    this.syncToSupabase(gathered).catch(() => {});

    return gathered;
  }

  /**
   * Syncs discovered stories to Supabase if authenticated
   */
  private static async syncToSupabase(stories: DiscoveredWireStory[]): Promise<void> {
    if (stories.length === 0) return;
    try {
      await supabase.from("discovered_stories").upsert(
        stories.slice(0, 30).map((s) => ({
          title: s.title,
          source: s.source,
          source_url: s.source_url,
          excerpt: s.excerpt,
          image_url: s.image_url,
          region: s.region,
          category: s.category,
          status: "new",
          published_at: s.published_at || new Date().toISOString(),
        })),
        { onConflict: "source_url" }
      );
    } catch (err) {
      console.warn("Could not sync discovered stories to Supabase:", err);
    }
  }

  /**
   * Retrieves cached stories synchronously or near-instantly for smooth initial render
   */
  public static getCachedStories(): DiscoveredWireStory[] {
    try {
      const raw = safeGetItem(STORAGE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [];
  }
}
