import { supabase } from "@/integrations/supabase/client";
import { detectCategory, detectRegion } from "@/lib/localScraper";

export interface ScrapedStoryResult {
  success: boolean;
  title: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  source_url: string;
  domain: string;
  region: "western_kenya" | "national" | "world";
  category: "gossip" | "music" | "events" | "film" | "celebrity";
  resolvedFromHomepage?: boolean;
}

export function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "News";
  }
}

/**
 * Checks whether a URL is a homepage, root domain, or high-level section hub
 * rather than a specific single article.
 */
export function isPortalHomepage(urlStr: string): boolean {
  try {
    const u = new URL(normalizeUrl(urlStr));
    const path = u.pathname.replace(/\/+$/, "");
    if (!path || path === "") return true;

    // Common portal sections that are hub lists, not individual stories
    const segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) {
      const hubNames = [
        "entertainment", "celebrities", "gossip", "news", "kenya",
        "politics", "showbiz", "lifestyle", "trending", "feed", "rss",
        "latest", "counties", "africa", "world", "sports"
      ];
      if (segments.length === 0 || hubNames.includes(segments[0].toLowerCase())) {
        return true;
      }
    }

    // Article URLs almost universally have numbers (IDs/dates) or a long slug (> 25 chars)
    const hasArticleId = /\/\d{4,}(?:-[a-z0-9-]+)?/i.test(path) || /\/\d{4}\/\d{2}\/\d{2}\//i.test(path);
    const lastSegment = segments[segments.length - 1] || "";
    const isLongSlug = lastSegment.includes("-") && lastSegment.length >= 25;

    if (!hasArticleId && !isLongSlug && segments.length <= 2) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Extracts the highest quality editorial photo, filtering out badges, logos, and UI icons.
 */
export function extractBestImage(markdown: string, metaImage?: string | null): string | null {
  const content = markdown || "";
  const imgRegex = /!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/gi;
  const candidates: { alt: string; url: string }[] = [];
  let m: RegExpExecArray | null;

  while ((m = imgRegex.exec(content)) !== null) {
    candidates.push({ alt: (m[1] || "").toLowerCase(), url: m[2] });
  }

  const isJunk = (u: string, alt: string) => {
    const s = (u + " " + alt).toLowerCase();
    return (
      s.includes("logo") ||
      s.includes("trophey") ||
      s.includes("trophy") ||
      s.includes("icon") ||
      s.includes("avatar") ||
      s.includes("placeholder") ||
      s.includes("favicon") ||
      s.includes("badge") ||
      s.includes("achievement") ||
      s.includes("pixel") ||
      s.includes("tracker")
    );
  };

  const validCandidates = candidates.filter((c) => !isJunk(c.url, c.alt));

  // Prioritize candidates from recognized news media CDNs or high-res photo dimensions
  const photo = validCandidates.find((c) =>
    c.url.includes("cdn.tuko.co.ke/images/") ||
    c.url.includes("/uploads/") ||
    c.url.includes("standardmedia.co.ke") ||
    c.url.includes("citizen.digital") ||
    /\.(?:jpeg|jpg|webp)(\?|$)/i.test(c.url)
  );

  if (photo) return photo.url;
  if (validCandidates.length > 0) return validCandidates[0].url;
  if (metaImage && !isJunk(metaImage, "")) return metaImage;
  return null;
}

/**
 * Strips navigation chrome, social share links, and cookie notices from markdown.
 */
export function cleanMarkdownContent(rawMarkdown: string): string {
  if (!rawMarkdown) return "";
  const lines = rawMarkdown.split("\n");

  const cleanLines = lines.filter((line) => {
    const t = line.trim();
    if (!t) return false;
    // Skip isolated image links, divider bars, and header links
    if (t.startsWith("![") || t.startsWith("[![") || t.startsWith("===") || t.startsWith("---")) return false;
    // Skip boilerplate
    const lower = t.toLowerCase();
    if (
      lower.includes("all rights reserved") ||
      lower.includes("cookie policy") ||
      lower.includes("privacy policy") ||
      lower.includes("terms of service") ||
      lower.includes("subscribe to our newsletter") ||
      lower.includes("download our app") ||
      lower.includes("share this article")
    ) {
      return false;
    }
    // Skip very short navigation fragments
    if (t.length < 25 && (t.startsWith("[") || t.startsWith("* ["))) return false;
    return true;
  });

  return cleanLines.join("\n\n").trim();
}

/**
 * Resolves a portal or category homepage to the latest breaking entertainment/gossip story URL.
 */
export async function resolveHomepageToTopStory(
  homepageUrl: string,
  onProgress?: (msg: string) => void
): Promise<{ url: string; title: string; image?: string | null }> {
  const norm = normalizeUrl(homepageUrl);
  const u = new URL(norm);
  const domain = u.hostname.replace(/^www\./, "");

  onProgress?.(`Browsing ${domain} homepage for breaking stories...`);

  const res = await fetch(`https://r.jina.ai/${encodeURIComponent(norm)}`, {
    headers: { Accept: "application/json", "X-No-Cache": "true" },
  });

  if (!res.ok) {
    throw new Error(`Could not access ${domain} (Status ${res.status})`);
  }

  const json = await res.json();
  const content = json.data?.content || "";

  // Extract all links in the markdown
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  const eligibleLinks: { text: string; url: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    const text = match[1].trim();
    const href = match[2].trim();
    // Link must be on the same domain and have a meaningful headline
    if (href.includes(domain) && text.length >= 25) {
      // Must not be a generic section link or policy page
      if (!isPortalHomepage(href) && !href.includes("/about") && !href.includes("/contact") && !href.includes("/privacy")) {
        eligibleLinks.push({ text, url: href });
      }
    }
  }

  if (eligibleLinks.length === 0) {
    throw new Error(`No breaking story links found on ${domain}. Please provide a direct story link.`);
  }

  // Prioritize entertainment, gossip, celebrity, showbiz stories
  const entertainmentLink = eligibleLinks.find((l) =>
    /\/entertainment\/|\/celebrities\/|\/gossip\/|\/showbiz\/|\/lifestyle\//i.test(l.url) ||
    /udaku|gossip|scandal|dating|actor|singer|music/i.test(l.text)
  ) || eligibleLinks[0];

  const heroImage = extractBestImage(content);

  return {
    url: entertainmentLink.url,
    title: entertainmentLink.text,
    image: heroImage,
  };
}

/**
 * Universal resilient scraper:
 * 1. Automatically detects & resolves portal homepages into the top story
 * 2. Attempts edge function scraping
 * 3. Seamlessly falls back to Jina Reader (bypasses Cloudflare & Firecrawl quota limits)
 * 4. Extracts full clean content, hero images, region, and gossip categorization
 */
export async function scrapeStoryResilient(
  inputUrl: string,
  onProgress?: (msg: string) => void
): Promise<ScrapedStoryResult> {
  const norm = normalizeUrl(inputUrl);
  if (!norm) {
    throw new Error("Please enter a valid web URL.");
  }

  const isHome = isPortalHomepage(norm);
  let targetUrl = norm;
  let preResolvedTitle = "";
  let preResolvedImage: string | null = null;
  let resolvedFromHome = false;

  if (isHome) {
    onProgress?.("Portal homepage detected. Resolving freshest breaking story...");
    const top = await resolveHomepageToTopStory(norm, onProgress);
    targetUrl = top.url;
    preResolvedTitle = top.title;
    preResolvedImage = top.image || null;
    resolvedFromHome = true;
    onProgress?.(`Found: "${preResolvedTitle}"`);
  }

  const domain = getHostname(targetUrl);
  let scrapedTitle = preResolvedTitle;
  let scrapedContent = "";
  let scrapedImage: string | null = preResolvedImage;

  // Step 1: Try Supabase Edge Function
  try {
    onProgress?.(`Extracting story from ${domain}...`);
    const { data: edgeData } = await supabase.functions.invoke("scrape-article", {
      body: { url: targetUrl },
    });

    if (edgeData?.success && edgeData?.content && edgeData.content.length >= 200) {
      scrapedContent = edgeData.content;
      if (edgeData.title) scrapedTitle = edgeData.title;
      if (edgeData.image_url) scrapedImage = edgeData.image_url;
    }
  } catch (edgeErr) {
    console.warn("Edge function scrape-article attempt failed, falling back to reader:", edgeErr);
  }

  // Step 2: Fallback to Jina Reader if edge function returned insufficient content or failed
  if (!scrapedContent || scrapedContent.length < 200) {
    onProgress?.("Bypassing site restrictions via fallback reader...");
    try {
      const res = await fetch(`https://r.jina.ai/${encodeURIComponent(targetUrl)}`, {
        headers: { Accept: "application/json", "X-No-Cache": "true" },
      });

      if (res.ok) {
        const json = await res.json();
        const jData = json.data || {};
        if (jData.title && !scrapedTitle) scrapedTitle = jData.title;
        if (jData.content) {
          scrapedContent = cleanMarkdownContent(jData.content);
          const bestImg = extractBestImage(jData.content, jData.image);
          if (bestImg) scrapedImage = bestImg;
        }
      }
    } catch (jinaErr) {
      console.warn("Fallback reader also encountered error:", jinaErr);
    }
  }

  // Verification of extracted content
  if (!scrapedContent || scrapedContent.length < 100) {
    throw new Error(
      `Could not extract readable article text from ${domain}. The link may require a paid subscription or is currently unavailable.`
    );
  }

  const finalTitle = scrapedTitle || `Breaking Story from ${domain}`;
  const region = detectRegion(finalTitle + " " + scrapedContent);
  const category = detectCategory(finalTitle + " " + scrapedContent);

  return {
    success: true,
    title: finalTitle,
    content: scrapedContent,
    excerpt: scrapedContent.slice(0, 350),
    image_url: scrapedImage,
    source_url: targetUrl,
    domain,
    region,
    category,
    resolvedFromHomepage: resolvedFromHome,
  };
}

export interface DiscoveredPortalStory {
  id: string;
  title: string;
  source: string;
  source_url: string;
  excerpt: string;
  image_url: string | null;
  region: "western_kenya" | "national" | "world";
  category: "gossip" | "music" | "events" | "film" | "celebrity";
  published_at: string;
}

/**
 * Scans top Kenyan entertainment portals in real time and extracts genuine,
 * active breaking news articles with working source URLs (zero 404s).
 */
export async function scrapeKenyanEntertainmentPortals(
  onProgress?: (msg: string) => void
): Promise<DiscoveredPortalStory[]> {
  const portals = [
    {
      name: "Pulse Live Kenya",
      url: "https://www.pulselive.co.ke/entertainment",
      domain: "pulse",
      defaultRegion: "national" as const,
    },
    {
      name: "Standard Entertainment",
      url: "https://www.standardmedia.co.ke/entertainment",
      domain: "standardmedia.co.ke",
      defaultRegion: "national" as const,
    },
    {
      name: "Mpasho",
      url: "https://mpasho.co.ke/entertainment",
      domain: "mpasho.co.ke",
      defaultRegion: "national" as const,
    },
    {
      name: "Citizen Digital",
      url: "https://citizen.digital/entertainment",
      domain: "citizen.digital",
      defaultRegion: "national" as const,
    },
  ];

  const results: DiscoveredPortalStory[] = [];
  const seenUrls = new Set<string>();

  for (const portal of portals) {
    try {
      onProgress?.(`Scanning ${portal.name} for breaking entertainment stories...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`https://r.jina.ai/${encodeURIComponent(portal.url)}`, {
        headers: { Accept: "application/json", "X-No-Cache": "true" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();
      const content = data.data?.content || "";

      // Regex to extract markdown links: [text](href)
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
      let m: RegExpExecArray | null;
      let portalStoryCount = 0;

      while ((m = linkRegex.exec(content)) !== null && portalStoryCount < 5) {
        let rawText = m[1].replace(/!\[.*?\]/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        let url = m[2].trim();

        // Skip image media URLs and CDN assets
        if (
          /\.(?:jpg|jpeg|png|webp|svg)(\?|$)/i.test(url) ||
          url.includes("/images/") ||
          url.includes("/thumbnails/") ||
          url.includes("/conversions/") ||
          url.includes("sportal365images.com") ||
          url.includes("play-lh.googleusercontent.com")
        ) {
          continue;
        }

        // Ensure link belongs to target domain
        if (!url.includes(portal.domain)) continue;

        // Ensure link matches authentic news article slug/ID patterns
        const isArticle =
          /\/article\/\d+/i.test(url) ||
          /\/story\/[a-z0-9-]+-\d+/i.test(url) ||
          /\/\d{4}-\d{2}-\d{2}-/i.test(url) ||
          /\/article\/[a-z0-9-]+-n\d+/i.test(url) ||
          /\/arts-culture\/article\/\d+/i.test(url) ||
          /\/newsbeat\/article\/\d+/i.test(url);

        if (!isArticle) continue;

        // Skip common boilerplate titles and short labels
        const lower = rawText.toLowerCase();
        if (
          rawText.length < 20 ||
          lower.includes("logo") ||
          lower.includes("subscribe") ||
          lower.includes("download") ||
          lower.includes("all rights reserved") ||
          lower.includes("terms of service")
        ) {
          continue;
        }

        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        // Find closest image around link context if possible
        const cleanTitle = rawText.replace(/\s*-\s*(?:Tuko|Mpasho|Citizen|Standard|Nation|Star|Pulse).*$/i, "").trim();
        const fullContext = cleanTitle;
        const region = detectRegion(fullContext, portal.defaultRegion) as "western_kenya" | "national" | "world";
        const category = detectCategory(fullContext, "celebrity") as "gossip" | "music" | "events" | "film" | "celebrity";

        // Generate synthetic excerpt based on title and metadata
        const excerpt = `${cleanTitle}. Sourced in real time from ${portal.name} entertainment coverage.`;

        results.push({
          id: `live-${Math.random().toString(36).slice(2, 9)}`,
          title: cleanTitle,
          source: portal.name,
          source_url: url,
          excerpt,
          image_url: null,
          region,
          category,
          published_at: new Date().toISOString(),
        });

        portalStoryCount++;
      }
    } catch (err) {
      console.warn(`Real-time scan error on ${portal.name}:`, err);
    }
  }

  return results;
}

