// Utilities for scraping, content extraction, and article presentation for Amaica Media

export const WESTERN_KENYA_TOWNS = [
  "kakamega", "kisumu", "bungoma", "vihiga", "busia", "siaya", "homa bay", "migori",
  "kisii", "mumias", "webuye", "malava", "butere", "mbale", "kapsabet", "eldoret",
  "kitale", "nandi", "trans nzoia", "luo", "luhya", "benga", "ohangla", "isukuti",
  "ingwe", "prince indah", "emma jalamo", "musa jakadalla", "steve kay", "osogo winyo",
  "tony nyadundo", "bukhungu", "ciala resort", "dunga hill", "rusinga", "lake region",
];

export const GOSSIP_KEYWORDS = [
  "udaku", "gossip", "rumour", "rumor", "scandal", "dating", "affair", "breakup",
  "broken up", "ex-lover", "ex-wife", "ex-husband", "alleged", "allegedly", "spotted with",
  "spotted", "drama", "beef", "feud", "shade", "exposed", "leak", "leaked",
  "secret lover", "baby mama", "baby daddy", "cheating", "side chick", "chapo",
  "spill the tea", "calling out", "clash", "caught", "relationship", "romance",
  "clapped back", "clapback", "unfollows", "unfollowed", "sparking split rumours",
];

export function isGossipContent(text: string, category?: string | null): boolean {
  if (category && category.toLowerCase() === "gossip") return true;
  const lower = text.toLowerCase();
  return GOSSIP_KEYWORDS.some((k) => lower.includes(k));
}

export function isWesternKenyaGossip(text: string, region?: string | null, category?: string | null): boolean {
  const isWest = region === "western_kenya" || detectRegion(text) === "western_kenya";
  const isGossip = isGossipContent(text, category);
  return isWest && isGossip;
}

export function detectCategory(
  text: string,
  fallback = "celebrity"
): "gossip" | "music" | "events" | "film" | "celebrity" {
  const lower = text.toLowerCase();
  if (isGossipContent(lower)) {
    return "gossip";
  }
  // 1. Film & Screen Acting (Strict: avoid matching common words like 'series' or 'play' alone)
  if (
    /\b(movie|cinema|film|thespian|screenplay|nollywood|showmax|netflix|box office|theatrical release)\b/i.test(lower) ||
    /\b(actor|actress|cast member)\b/i.test(lower) ||
    /\b(?:television|tv|web)\s+series\b/i.test(lower)
  ) {
    return "film";
  }
  // 2. Music & Recording releases (Strict: avoid matching standalone 'single' or 'track')
  if (
    /\b(music album|new song|hit song|songs?|benga|ohangla|isukuti|gengetone|hitmaker|vocalist|discography|spotify|boomplay|recording studio|music video|ep release|soundtrack)\b/i.test(lower) ||
    /\b(singer|rapper)\b/i.test(lower) ||
    /\b(?:hit|new)\s+(?:single|track)\b/i.test(lower)
  ) {
    return "music";
  }
  // 3. Events & Live Concerts
  if (
    /\b(concert|music festival|live performance|entry fee|tickets on sale|gate charges|headline show|tour dates|live stage|extravaganza)\b/i.test(lower)
  ) {
    return "events";
  }
  return (fallback as "gossip" | "music" | "events" | "film" | "celebrity") || "celebrity";
}

export function detectRegion(text: string, fallback = "national"): "western_kenya" | "national" | "world" {
  const lower = text.toLowerCase();
  if (WESTERN_KENYA_TOWNS.some((t) => lower.includes(t))) {
    return "western_kenya";
  }
  if (fallback === "world") {
    const kenyaTerms = ["kenya", "kenyan", "nairobi", "mombasa", "nakuru", "gengetone"];
    return kenyaTerms.some((t) => lower.includes(t)) ? "national" : "world";
  }
  return fallback as "western_kenya" | "national" | "world";
}

export function calculateReadTime(text: string): string {
  const words = (text.trim().match(/\b[\w'’-]+\b/g) || []).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return "Just now";
    const mins = Math.floor(diffMs / (60 * 1000));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export function getShareUrls(headline: string, url: string) {
  const encodedTitle = encodeURIComponent(headline);
  const encodedUrl = encodeURIComponent(url);
  const waMessage = encodeURIComponent(`*${headline}*\nRead more on Amaica Media: ${url}`);

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${waMessage}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=AmaicaMedia`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };
}
