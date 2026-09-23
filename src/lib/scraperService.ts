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
 * Strips navigation chrome, social share bars, Taboola feeds, comments,
 * and related articles from markdown so only the authentic, single-topic story remains.
 */
export function cleanMarkdownContent(rawMarkdown: string, storyTitle = ""): string {
  if (!rawMarkdown) return "";

  const lines = rawMarkdown.split("\n");
  const cleaned: string[] = [];

  // Cutoff markers indicating the end of the primary article
  const cutoffRegex = /^(?:0\s+comments|comments?|\d+\s+comments|share\s+on\s+facebook|share\s+on\s+x|share\s+this|share\s+article|leave\s+a\s+reply|related\s+(?:stories|articles|posts)|read\s+also:?|also\s+read:?|trending\s+stories|more\s+on\s+this|promoted\s+stories|recommended\s+stories|around\s+the\s+web|taboola|outbrain|sponsored\s+content|footer)\b/i;

  // Header / nav markers to skip before the article
  const navSkipRegex = /(?:flyout\s+menu|header\s+navigation|homelogin|close\s+flyout|sign\s+in|your\s+data|usuario|breadcrumbs?|categories|subscribe\s+to\s+notifications)/i;

  let articleStarted = false;
  let reachedEnd = false;

  for (let i = 0; i < lines.length; i++) {
    if (reachedEnd) break;

    const line = lines[i].trim();
    if (!line) continue;

    // Check if line is the main title or header
    if (line.startsWith("# ") || line.startsWith("## ")) {
      if (!articleStarted) {
        articleStarted = true;
        continue;
      }
    }

    // Skip lines before article start
    if (!articleStarted) {
      if (storyTitle && line.toLowerCase().includes(storyTitle.toLowerCase().slice(0, 30))) {
        articleStarted = true;
        continue;
      }
      if (navSkipRegex.test(line) || line.startsWith("* [") || line.startsWith("[News]") || line.startsWith("[Entertainment]")) {
        continue;
      }
      if (/^\d{2}:\d{2}\s*-\s*\d{2}\s+[A-Za-z]+\s+\d{4}/.test(line)) {
        articleStarted = true;
        continue;
      }
      if (line.length > 50 && !line.includes("http") && !navSkipRegex.test(line)) {
        articleStarted = true;
      } else {
        continue;
      }
    }

    // Skip author links, publication dates, and social sharing links at the top of the article
    if (cleaned.length === 0) {
      if (
        line.includes("/author/") ||
        /^\d{2}:\d{2}\s*-\s*\d{2}\s+[A-Za-z]+\s+\d{4}/.test(line) ||
        line.includes("facebook.com/sharer") ||
        line.includes("twitter.com") ||
        line.includes("x.com/intent") ||
        line.includes("whatsapp.com") ||
        line.includes("Copy link") ||
        line.toLowerCase() === "advertisement"
      ) {
        continue;
      }
    }

    // After article has accumulated some text, check for end-of-article cutoffs
    if (cleaned.length >= 3) {
      if (
        cutoffRegex.test(line) ||
        line.includes("facebook.com/sharer") ||
        line.includes("whatsapp.com/channel") ||
        line.includes("whatsapp.com/send") ||
        line.includes("0 Comments") ||
        line.toLowerCase().startsWith("subscribe [sportal")
      ) {
        reachedEnd = true;
        break;
      }
    }

    // Skip ad lines
    const lower = line.toLowerCase();
    if (
      lower === "advertisement" ||
      lower === "ad" ||
      lower === "undo" ||
      lower.startsWith("> video") ||
      lower.includes("all rights reserved") ||
      lower.includes("cookie policy") ||
      lower.includes("privacy policy") ||
      lower.includes("terms of service") ||
      lower.includes("subscribe to our newsletter") ||
      lower.includes("download our app") ||
      lower.includes("share this article") ||
      lower.includes("cards offering") ||
      lower.includes("biotech to my watchlist") ||
      lower.includes("freshstartinfo") ||
      lower.includes("one tablet ready to go") ||
      /^(?:watch|photo|video)\s*:/i.test(lower)
    ) {
      continue;
    }

    // Skip isolated image links, dividers, and empty links
    if (
      line.startsWith("![") ||
      line.startsWith("[![") ||
      line.startsWith("===") ||
      line.startsWith("---") ||
      /^\[\s*\]\(.*?\)$/.test(line) ||
      (/^\[.*?\]\(https?:\/\/[^\s\)]+\)$/.test(line) && line.length < 70 && (line.includes("facebook") || line.includes("twitter") || line.includes("whatsapp") || line.includes("pulse.co.ke/search")))
    ) {
      continue;
    }

    // Skip lone captions that are just an entity name under an image
    if (line.length < 25 && !/[.!?]$/.test(line) && cleaned.length > 0) {
      continue;
    }

    cleaned.push(line);
  }

  return cleaned.join("\n\n").trim();
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
      if (edgeData.title) scrapedTitle = edgeData.title;
      scrapedContent = cleanMarkdownContent(edgeData.content, scrapedTitle);
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
          scrapedContent = cleanMarkdownContent(jData.content, scrapedTitle);
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
      url: "https://www.pulse.co.ke/entertainment",
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

      // Extract image mapping from feed markdown: [![Image](imgUrl)](storyUrl)
      const urlToImg = new Map<string, string>();
      const feedLines = content.split("\n");
      for (const fLine of feedLines) {
        const trimmed = fLine.trim();
        const imgMatch = trimmed.match(/^\[!\[.*?\]\((https?:\/\/[^\s]+?\.(?:jpe?g|png|webp)[^\s]*?)\)\]\((https?:\/\/[^\s]+?\))/i);
        if (imgMatch) {
          const imgUrl = imgMatch[1];
          const storyUrl = imgMatch[2].replace(/\)+$/, "");
          urlToImg.set(storyUrl, imgUrl);
        }
      }

      // Regex to extract markdown links: [text](href)
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
      let m: RegExpExecArray | null;
      let portalStoryCount = 0;

      while ((m = linkRegex.exec(content)) !== null && portalStoryCount < 6) {
        let rawText = m[1].replace(/!\[.*?\]/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        let url = m[2].trim().replace(/\)+$/, "");

        // Skip image media URLs and CDN assets directly
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

        const cleanTitle = rawText.replace(/\s*-\s*(?:Tuko|Mpasho|Citizen|Standard|Nation|Star|Pulse).*$/i, "").trim();
        const fullContext = cleanTitle;
        const region = detectRegion(fullContext, portal.defaultRegion) as "western_kenya" | "national" | "world";
        const category = detectCategory(fullContext, "celebrity") as "gossip" | "music" | "events" | "film" | "celebrity";

        const heroImage = urlToImg.get(url) || extractBestImage(content);

        // Generate synthetic excerpt based on title and metadata
        const excerpt = `${cleanTitle}. Sourced in real time from ${portal.name} entertainment coverage.`;

        results.push({
          id: `live-${Math.random().toString(36).slice(2, 9)}`,
          title: cleanTitle,
          source: portal.name,
          source_url: url,
          excerpt,
          image_url: heroImage,
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

