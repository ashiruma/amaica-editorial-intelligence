/**
 * Vercel Serverless Function: Live News Feeds Aggregator
 * Location: api/live-feeds.ts
 *
 * Fetches, parses, normalizes, and scores live news leads from Kenyan
 * reference RSS feeds and search streams with geographic intelligence
 * focused on Kakamega and Western Kenya.
 */

interface LiveFeedSource {
  name: string;
  url: string;
  defaultRegion: "kakamega" | "western_kenya" | "national" | "world";
  defaultCategory: string;
  weight: number;
}

const LIVE_FEEDS: LiveFeedSource[] = [
  {
    name: "Kakamega Live News",
    url: "https://news.google.com/rss/search?q=Kakamega+news&hl=en-KE&gl=KE&ceid=KE:en",
    defaultRegion: "kakamega",
    defaultCategory: "community",
    weight: 1.4,
  },
  {
    name: "Western Kenya Wire",
    url: "https://news.google.com/rss/search?q=Western+Kenya&hl=en-KE&gl=KE&ceid=KE:en",
    defaultRegion: "western_kenya",
    defaultCategory: "community",
    weight: 1.3,
  },
  {
    name: "Kenya Entertainment Wire",
    url: "https://news.google.com/rss/search?q=Kenya+entertainment&hl=en-KE&gl=KE&ceid=KE:en",
    defaultRegion: "national",
    defaultCategory: "celebrity",
    weight: 1.1,
  },
  {
    name: "Standard Media Headlines",
    url: "https://www.standardmedia.co.ke/rss/headlines.php",
    defaultRegion: "national",
    defaultCategory: "politics",
    weight: 1.2,
  },
  {
    name: "Standard Entertainment",
    url: "https://www.standardmedia.co.ke/rss/entertainment.php",
    defaultRegion: "national",
    defaultCategory: "celebrity",
    weight: 1.1,
  },
  {
    name: "Ghafla Kenya",
    url: "https://www.ghafla.com/ke/feed/",
    defaultRegion: "national",
    defaultCategory: "gossip",
    weight: 1.0,
  },
  {
    name: "Kenya National Breaking",
    url: "https://news.google.com/rss?hl=en-KE&gl=KE&ceid=KE:en",
    defaultRegion: "national",
    defaultCategory: "politics",
    weight: 1.0,
  },
];

const WESTERN_KEYWORDS = [
  "kakamega", "vihiga", "bungoma", "busia", "siaya", "trans nzoia", "nandi",
  "kisumu", "mumias", "webuye", "malava", "butere", "mbale", "kapsabet",
  "bukhungu", "luhya", "isukuti", "ingwe", "barasa", "natembeya", "otichilo",
  "lusaka", "wanga", "maragoli", "bukusu", "benga", "ohangla"
];

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripHtml(str: string): string {
  return decodeHtmlEntities(str.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function detectRegion(text: string, fallback: "kakamega" | "western_kenya" | "national" | "world"): "kakamega" | "western_kenya" | "national" | "world" {
  const lower = text.toLowerCase();
  if (lower.includes("kakamega") || lower.includes("bukhungu") || lower.includes("mumias") || lower.includes("malava") || lower.includes("butere")) {
    return "kakamega";
  }
  if (WESTERN_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "western_kenya";
  }
  return fallback;
}

function detectCategory(text: string, fallback: string): string {
  const lower = text.toLowerCase();
  if (/\b(governor|senator|mp|mca|politics|election|cabinet|ruto|raila|odm|uda|parliament|court|judge|protest|police|arrest|dci|eacc)\b/i.test(lower)) {
    return "politics";
  }
  if (/\b(album|song|music|singer|concert|benga|ohangla|track|artist|musician|hit|dj)\b/i.test(lower)) {
    return "music";
  }
  if (/\b(celebrity|wedding|divorce|dating|tiktok|influencer|scandal|gossip|udaku|cheating|baby mama)\b/i.test(lower)) {
    return "celebrity";
  }
  if (/\b(hospital|health|doctor|nurse|disease|outbreak|clinic)\b/i.test(lower)) {
    return "health";
  }
  if (/\b(school|university|kcse|student|teacher|education|kuccps)\b/i.test(lower)) {
    return "education";
  }
  if (/\b(maize|sugar|farming|farmer|cane|agriculture|harvest)\b/i.test(lower)) {
    return "agriculture";
  }
  if (/\b(football|afcon|fkf|gor mahia|afc leopards|athletics|marathon|sport)\b/i.test(lower)) {
    return "sports";
  }
  return fallback;
}

function calculateScore(title: string, excerpt: string, pubDate: string, weight: number): number {
  let score = 45;
  const ageHours = Math.max(0, (Date.now() - new Date(pubDate).getTime()) / (1000 * 3600));
  if (ageHours <= 3) score += 30;
  else if (ageHours <= 8) score += 20;
  else if (ageHours <= 24) score += 12;

  const combined = `${title} ${excerpt}`.toLowerCase();
  if (/\b(breaking|arrested|killed|probe|crisis|warning|clash|scandal|exclusive|investigation|unveils)\b/i.test(combined)) {
    score += 15;
  }
  if (/\b(kakamega|western kenya|bukhungu|mumias)\b/i.test(combined)) {
    score += 10;
  }

  return Math.min(100, Math.round(score * weight));
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=180");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  const { beat, region, limit = 50 } = req.query || {};
  const maxLimit = Math.min(100, Math.max(10, parseInt(String(limit), 10) || 50));

  try {
    const fetchPromises = LIVE_FEEDS.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(feed.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const xml = await response.text();
        const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
        const stories: any[] = [];

        for (const block of itemBlocks.slice(0, 20)) {
          const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
          const linkMatch =
            block.match(/<link>([\s\S]*?)<\/link>/i) ||
            block.match(/<link[^>]+href=["']([^"']+)["']/i);
          const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);
          const pubMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

          if (!titleMatch || !linkMatch) continue;

          let title = stripHtml(titleMatch[1]);
          // Clean publisher suffix e.g. " - Citizen Digital"
          const cleanTitle = title.replace(/\s*-\s*[A-Za-z0-9.]+\s*$/, "").trim();
          if (cleanTitle.length < 15 || cleanTitle.toLowerCase() === "google news") continue;

          const sourceUrl = decodeHtmlEntities(linkMatch[1]);
          const excerpt = descMatch ? stripHtml(descMatch[1]) : `${cleanTitle}. Reported via ${feed.name}.`;
          const pubDate = pubMatch ? new Date(pubMatch[1]).toISOString() : new Date().toISOString();

          // Extract thumbnail or image if present
          let imageUrl: string | null = null;
          const mediaMatch =
            block.match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
            block.match(/<enclosure[^>]+url=["']([^"']+)["']/i) ||
            block.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (mediaMatch) {
            imageUrl = mediaMatch[1];
          }

          const storyRegion = detectRegion(`${cleanTitle} ${excerpt}`, feed.defaultRegion);
          const category = detectCategory(`${cleanTitle} ${excerpt}`, feed.defaultCategory);
          const trendingScore = calculateScore(cleanTitle, excerpt, pubDate, feed.weight);

          const id = `live-${Math.abs(
            cleanTitle.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
          ).toString(36)}`;

          stories.push({
            id,
            title: cleanTitle,
            source: feed.name,
            source_url: sourceUrl,
            excerpt: excerpt.slice(0, 350),
            image_url: imageUrl,
            region: storyRegion,
            category,
            status: "new",
            published_at: pubDate,
            created_at: new Date().toISOString(),
            trendingScore,
          });
        }

        return stories;
      } catch (feedErr) {
        console.warn(`Feed error [${feed.name}]:`, feedErr);
        return [];
      }
    });

    const feedResults = await Promise.all(fetchPromises);
    const flattened: any[] = [];
    const seenTitles = new Set<string>();

    for (const batch of feedResults) {
      for (const item of batch) {
        const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
        if (seenTitles.has(norm)) continue;
        seenTitles.add(norm);
        flattened.push(item);
      }
    }

    // Filter by beat or region if requested
    let filtered = flattened;
    if (region && region !== "all") {
      filtered = filtered.filter((s) => s.region === region);
    }
    if (beat && beat !== "all") {
      if (beat === "western_kenya") {
        filtered = filtered.filter((s) => s.region === "kakamega" || s.region === "western_kenya");
      } else {
        filtered = filtered.filter((s) => s.category === beat);
      }
    }

    // Sort by trending score descending (highest velocity and recency first)
    filtered.sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));

    const finalStories = filtered.slice(0, maxLimit);

    return res.status(200).json({
      success: true,
      count: finalStories.length,
      timestamp: new Date().toISOString(),
      stories: finalStories,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Live Feeds Aggregator Error:", error);
    return res.status(500).json({ success: false, error: message });
  }
}
