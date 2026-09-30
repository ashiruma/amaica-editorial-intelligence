/**
 * Amaica Media / WireOps Desk
 * Editorial Beat Classification & Topic Detection
 *
 * Categorizes headlines, ledes, and articles into deterministic journalistic beats
 * to maintain strict thematic consistency across all editorial pipelines.
 */

export type StoryBeat =
  | "matatu_transport"
  | "tragedy_rescue"
  | "politics_governance"
  | "business_wealth"
  | "relationship"
  | "comedy"
  | "music"
  | "film"
  | "crime_legal"
  | "event"
  | "celebrity_general";

/**
 * Extracts the primary individual or entity name from a headline.
 */
export function extractSubjectFromTitle(title: string): string {
  const cleanTitle = title
    .replace(/^(?:WATCH|EXCLUSIVE|UPDATE|JUST IN|PHOTOS|BREAKING):\s*/i, "")
    .trim();

  // "Name: Rest of title" format
  const colonMatch = cleanTitle.match(/^([^:]+):/);
  if (colonMatch && colonMatch[1].trim().split(/\s+/).length <= 4) {
    return colonMatch[1].trim();
  }

  // "Name reveals / says / denies / opens up"
  const verbMatch = cleanTitle.match(
    /^([A-Z][a-zA-Z0-9'’]+(?:\s+[A-Z][a-zA-Z0-9'’]+){0,3})\s+(?:reveals?|says?|denies?|opens? up|breaks?|speaks?|addresses?|mourns?|shares?|slams?|defends?|reacts?|announces?|confirms?|clarifies?|refutes?|drops?|releases?)\b/i
  );
  if (verbMatch) {
    return verbMatch[1].trim();
  }

  return "";
}

/**
 * Accurately detects the true editorial beat and topic of a story
 * so that expansions, background notes, and commentary stay 100% on topic.
 */
export function detectStoryBeat(title: string, body = "", category?: string | null): StoryBeat {
  const combined = `${title} ${body} ${category || ""}`.toLowerCase();
  const titleLower = title.toLowerCase();

  // If title explicitly signals a relationship / fallout / dating story, prioritize relationship beat
  if (
    /\b(relationship|breakup|split|dating|ex-girlfriend|ex-boyfriend|marriage|divorce|infidelity|cheating|fallout|lover|romance|affair)\b/i.test(
      titleLower
    )
  ) {
    return "relationship";
  }

  // 1. Drowning, search and rescue, river recovery, fatal accidents
  if (
    /\b(drown(?:ed|ing)?|river\s+rescue|body\s+(?:retrieved|recovered)|recovery\s+operation|volunteer\s+divers?|search\s+and\s+rescue|fatal\s+(?:accident|crash)|road\s+crash|perished|succumbed|burial|autopsy)\b/i.test(
      combined
    )
  ) {
    return "tragedy_rescue";
  }

  // 2. Matatu culture, nganyas, urban transport, transit fleet & SACCOs
  if (
    /\b(nganya|nganyas|matatu|matatus|manamba|conductors?|logistics|fleet|route \d+|sacco|transit|super metro|customised matatu|customized matatu|pimp my ride|98 logistics|moneyfest|george ruto)\b/i.test(
      combined
    )
  ) {
    return "matatu_transport";
  }

  // 3. Politics, civic leadership, aspirants, elections & county governance
  if (
    /\b(aspirant|women rep|mp\b|governor|senator|mca|politics|political|parliament|county assembly|ruto|raila|rigathi|gachagua|cleophas malala|odm|uda|jubilee|elections?|ballot|constituency|civic leadership|devolution)\b/i.test(
      combined
    )
  ) {
    return "politics_governance";
  }

  // 4. Crime / Legal / Controversies / Police / Court / DCI
  if (
    /\b(court|police|arrest|arrested|lawsuit|sued|judge|bail|charges|investigation|fraud|assault|dpp|dci|remanded|pleaded?|custody)\b/i.test(
      combined
    )
  ) {
    return "crime_legal";
  }

  // 5. High-net-worth gifts, luxury acquisitions, wealth displays & entrepreneurship
  if (
    /\b(rolls royce|luxury|billionaire|millionaire|sh\d+(?:\s*(?:m|b|million|billion))?|sh140m|iphone \d+|chivayo|wealth|fortune|extravagant|lavish|car collection|fleet of cars|gifting spree)\b/i.test(
      combined
    )
  ) {
    return "business_wealth";
  }

  // 6. Comedy & stand-up / satire / TikTok skits / viral humor
  if (
    /\b(comedian|comedy|skit|skits|satire|stand-up|funny|punchline|parody|comic|hilariously|tiktok live|chizi nation|baba rio|prank|meme|laughter)\b/i.test(
      combined
    )
  ) {
    return "comedy";
  }

  // 7. Relationship / Breakup / Domestic disputes / Dating
  if (
    /\b(relationship|breakup|split|dating|ex-girlfriend|ex-boyfriend|marriage|divorce|infidelity|cheating|altercation|domestic|toxic|lover|romance|affair|partner|fianc[ée])\b/i.test(
      combined
    )
  ) {
    return "relationship";
  }

  // 8. Film, TV, theatre, cinema & screen acting (STRICT: Never trigger on standalone 'series' or 'play')
  if (
    category === "film" ||
    /\b(film|movie|cinema|thespian|screenplay|nollywood|showmax|netflix|box office|theatrical release|film festival|screening|premiere)\b/i.test(combined) ||
    /\b(actor|actress)\b/i.test(combined) ||
    /\b(?:television|tv|web)\s+series\b/i.test(combined)
  ) {
    return "film";
  }

  // 9. Music releases, albums, songs, recording artists (STRICT: Never trigger on standalone 'single' or 'track')
  if (
    category === "music" ||
    /\b(music album|new song|hit song|songs?|benga|gengetone|ohangla|afrobeats|recording studio|boomplay|spotify|hitmaker|vocalist|discography|singer|rapper|hip-hop)\b/i.test(
      title
    ) ||
    /\b(?:hit|new)\s+(?:single|track)\b/i.test(combined)
  ) {
    return "music";
  }

  // 10. Genuine live events / concerts (ONLY if explicit ticket/concert/festival keywords)
  if (
    category === "events" ||
    /\b(festival|concert|stadium concert|live concert|tickets? on sale|gate charges|headline show|tour dates|live stage)\b/i.test(
      combined
    )
  ) {
    return "event";
  }

  return "celebrity_general";
}
