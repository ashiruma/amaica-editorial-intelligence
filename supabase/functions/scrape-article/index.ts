import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// In-memory per-domain rate limiter (per edge instance).
const domainGate = new Map<string, { lastHit: number; minGapMs: number }>();
const DEFAULT_GAP_MS = 1500;
const MAX_GAP_MS = 60_000;

async function gateDomain(domain: string) {
  const now = Date.now();
  const g = domainGate.get(domain) || { lastHit: 0, minGapMs: DEFAULT_GAP_MS };
  const wait = g.lastHit + g.minGapMs - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, Math.min(wait, 8000)));
  g.lastHit = Date.now();
  domainGate.set(domain, g);
}

function bumpBackoff(domain: string) {
  const g = domainGate.get(domain) || { lastHit: Date.now(), minGapMs: DEFAULT_GAP_MS };
  g.minGapMs = Math.min(MAX_GAP_MS, Math.max(DEFAULT_GAP_MS, g.minGapMs * 2));
  domainGate.set(domain, g);
}

function resetBackoff(domain: string) {
  domainGate.set(domain, { lastHit: Date.now(), minGapMs: DEFAULT_GAP_MS });
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function isHomepageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    return !path || path === "";
  } catch {
    return false;
  }
}

async function scrapeDirect(url: string): Promise<{
  success: boolean;
  content: string;
  title?: string;
  image?: string;
  author?: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; AmaicaMediaBot/1.0; +https://amaicamedia.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (!html || html.length < 400) return null;

    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
      html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : undefined;

    const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i);
    const image = imageMatch ? imageMatch[1].trim() : undefined;

    const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+property=["']article:author["']\s+content=["'](.*?)["']/i);
    const author = authorMatch ? decodeEntities(authorMatch[1]).trim() : undefined;

    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "");

    const articleContainer = cleaned.match(/<article[\s\S]*?<\/article>/i) ||
      cleaned.match(/<div[^>]+(?:class|id)=["'][^"']*(?:article-body|entry-content|post-content|story-content|article-text|main-content)[^"']*["'][\s\S]*?<\/div>/i);

    const targetHtml = articleContainer ? articleContainer[0] : cleaned;
    const pMatches = targetHtml.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    const paragraphs = pMatches
      .map((p) => decodeEntities(p.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 35 && !p.toLowerCase().includes("copyright") && !p.toLowerCase().includes("subscribe") && !p.toLowerCase().includes("all rights reserved"));

    if (paragraphs.length >= 2) {
      return {
        success: true,
        content: paragraphs.join("\n\n"),
        title,
        image,
        author,
      };
    }
    return null;
  } catch (err) {
    console.warn("Direct scrape failed:", err);
    return null;
  }
}

async function scrapeJina(url: string): Promise<{
  success: boolean;
  content: string;
  title?: string;
  image?: string;
  author?: string;
  resolvedUrl?: string;
} | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      headers: { Accept: "application/json", "X-No-Cache": "true" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data?.content || data.content.length < 100) return null;

    // Check if input was a homepage that returned links instead of article text
    if (isHomepageUrl(url) || data.content.length < 300) {
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
      const domain = getDomain(url);
      const links: { text: string; url: string }[] = [];
      let m: RegExpExecArray | null;
      while ((m = linkRegex.exec(data.content)) !== null) {
        if (m[2].includes(domain) && m[1].trim().length > 25) {
          links.push({ text: m[1].trim(), url: m[2].trim() });
        }
      }
      const topLink = links.find((l) =>
        /\/entertainment\/|\/celebrities\/|\/gossip\/|\/showbiz\//i.test(l.url)
      ) || links[0];

      if (topLink) {
        console.log(`Jina resolved homepage to article: ${topLink.url}`);
        const subResult = await scrapeJina(topLink.url);
        if (subResult) {
          return { ...subResult, resolvedUrl: topLink.url };
        }
      }
    }

    const imgRegex = /!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/gi;
    let heroImg: string | undefined = data.image || undefined;
    let matchImg: RegExpExecArray | null;
    while ((matchImg = imgRegex.exec(data.content)) !== null) {
      const u = matchImg[2];
      if (/\.(?:jpeg|jpg|webp)(\?|$)/i.test(u) && !u.includes("logo") && !u.includes("icon") && !u.includes("badge")) {
        heroImg = u;
        break;
      }
    }

    // Clean markdown
    const lines = (data.content as string).split("\n");
    const cleanLines = lines.filter((l) => {
      const t = l.trim();
      if (!t || t.startsWith("![") || t.startsWith("[![") || t.startsWith("===") || t.startsWith("---")) return false;
      const low = t.toLowerCase();
      if (low.includes("all rights reserved") || low.includes("cookie policy") || low.includes("subscribe")) return false;
      return t.length > 25;
    });

    return {
      success: true,
      content: cleanLines.join("\n\n").trim(),
      title: data.title || undefined,
      image: heroImg,
      author: data.description?.slice(0, 100),
    };
  } catch (err) {
    console.warn("Jina scrape failed:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let url = "";
  let story_id: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    url = body.url;
    story_id = body.story_id;
    if (!url) {
      return new Response(JSON.stringify({ success: false, fallback: true, error: "Missing url", content: "" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domain = getDomain(url);
    const fullDomain = (() => { try { return new URL(url).hostname; } catch { return ""; } })();

    // Check blocklist
    const { data: blocked } = await supabase
      .from("scrape_blocklist")
      .select("domain")
      .or(`domain.eq.${domain},domain.eq.${fullDomain}`)
      .maybeSingle();

    if (blocked) {
      console.log(`Blocklisted domain skipped: ${domain}`);
      return new Response(JSON.stringify({
        success: false, fallback: true, error: "DOMAIN_BLOCKLISTED", content: "",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await gateDomain(domain);

    // 1. Direct HTTP scrape attempt FIRST (never blocked by Firecrawl backoff)
    const directResult = await scrapeDirect(url);
    if (directResult && directResult.content && directResult.content.length > 200) {
      resetBackoff(domain);
      if (story_id) {
        await supabase.from("discovered_stories").update({
          raw_content: directResult.content.slice(0, 10000),
          ...(directResult.image ? { image_url: directResult.image } : {}),
        }).eq("id", story_id);
      }
      return new Response(JSON.stringify({
        success: true,
        content: directResult.content.slice(0, 8000),
        method: "direct",
        title: directResult.title,
        image_url: directResult.image,
        author: directResult.author,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. High-reliability Jina Reader attempt (works for JS/Cloudflare, no credits needed)
    const jinaResult = await scrapeJina(url);
    if (jinaResult && jinaResult.content && jinaResult.content.length > 150) {
      resetBackoff(domain);
      if (story_id) {
        await supabase.from("discovered_stories").update({
          raw_content: jinaResult.content.slice(0, 10000),
          ...(jinaResult.image ? { image_url: jinaResult.image } : {}),
        }).eq("id", story_id);
      }
      return new Response(JSON.stringify({
        success: true,
        content: jinaResult.content.slice(0, 8000),
        method: "jina",
        title: jinaResult.title,
        image_url: jinaResult.image,
        author: jinaResult.author,
        resolved_url: jinaResult.resolvedUrl,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Firecrawl fallback (only if credits exist and domain not in backoff)
    const { data: existingFail } = await supabase
      .from("scrape_failures").select("fail_count, next_retry_at").eq("source_url", url).maybeSingle();
    if (existingFail?.next_retry_at && new Date(existingFail.next_retry_at) > new Date()) {
      return new Response(JSON.stringify({
        success: false, fallback: true, error: "BACKOFF_ACTIVE",
        retry_after: existingFail.next_retry_at, content: "",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({
        success: false, fallback: true, error: "FIRECRAWL_NOT_CONFIGURED", content: "",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let fcRes: Response;
    try {
      fcRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
        signal: AbortSignal.timeout(20000),
      });
    } catch (netErr) {
      console.warn(`Firecrawl network error for ${url}:`, netErr);
      bumpBackoff(domain);
      return new Response(JSON.stringify({ success: false, fallback: true, error: "NETWORK_ERROR", content: "" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fcData = await fcRes.json().catch(() => ({}));

    if (!fcRes.ok) {
      const errMsg = fcData?.error || `HTTP_${fcRes.status}`;
      bumpBackoff(domain);
      const failCount = (existingFail?.fail_count || 0) + 1;
      const backoffMs =
        fcRes.status === 402 ? 60 * 60_000 :
        fcRes.status === 403 ? 24 * 60 * 60_000 :
        Math.min(10 * 60_000, 15_000 * 2 ** Math.min(failCount, 5));

      await supabase.from("scrape_failures").upsert({
        source_url: url, domain,
        last_status_code: fcRes.status,
        last_error: String(errMsg).slice(0, 500),
        fail_count: failCount,
        last_failed_at: new Date().toISOString(),
        next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
        blocked: fcRes.status === 403,
      }, { onConflict: "source_url" });

      const errorCode =
        fcRes.status === 402 ? "CREDITS_EXHAUSTED" :
        fcRes.status === 403 ? "SOURCE_NOT_SUPPORTED" :
        fcRes.status === 429 ? "RATE_LIMITED" :
        `FIRECRAWL_${fcRes.status}`;

      return new Response(JSON.stringify({
        success: false, fallback: true, error: errorCode, status: fcRes.status, content: "",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const markdown: string = fcData.data?.markdown || fcData.markdown || "";
    const trimmed = markdown.slice(0, 8000);

    if (story_id) {
      await supabase.from("discovered_stories").update({ raw_content: trimmed }).eq("id", story_id);
    }

    resetBackoff(domain);
    return new Response(JSON.stringify({ success: true, content: trimmed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-article unexpected error:", e);
    return new Response(JSON.stringify({
      success: false, fallback: true,
      error: e instanceof Error ? e.message : "Unknown error", content: "",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
