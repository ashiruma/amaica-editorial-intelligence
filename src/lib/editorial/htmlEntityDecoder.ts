/**
 * WireOps Desk / Amaica Media
 * HTML Entity Decoding and Content Artifact Purging Utility
 *
 * Provides:
 * 1. Comprehensive HTML entity decoding (named, numeric decimal, and hex)
 *    strictly preventing entity corruption like "&rsquo. S"
 * 2. Photo caption and credit metadata purging (PHOTO/@..., Photo by...)
 * 3. Synthetic feed attribution purging (news.google.com, rss feeds)
 *
 * Strictly adheres to the Zero-Emoji Workplace Standard.
 */

/**
 * Map of common named HTML entities to plain-text equivalents.
 */
const NAMED_HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&rsquo;": "'",
  "&lsquo;": "'",
  "&rdquo;": '"',
  "&ldquo;": '"',
  "&nbsp;": " ",
  "&mdash;": " — ",
  "&ndash;": " – ",
  "&hellip;": "...",
  "&trade;": "TM",
  "&copy;": "(c)",
  "&reg;": "(R)",
  "&cent;": "c",
  "&pound;": "PS",
  "&yen;": "Y",
  "&euro;": "EUR",
  "&bull;": "*",
  "&middot;": "*",
  "&prime;": "'",
  "&Prime;": '"',
  "&percnt;": "%",
};

/**
 * Comprehensively decodes all HTML entities from input text.
 * Handles:
 * - Pre-mangled entities from faulty regex splits (e.g. "&rsquo. S" -> "'s", "&rsquo." -> "'")
 * - Standard named entities (&rsquo;, &lsquo;, &rdquo;, &ldquo;, &quot;, &apos;, &amp;, &nbsp;, &mdash;, &ndash;, etc.)
 * - Unclosed named entities (&rsquo, &lsquo, &rdquo, &ldquo, &quot, &apos, &amp, &nbsp, &mdash, &ndash)
 * - Decimal numeric entities (&#39;, &#8217;, &#8216;, &#8220;, &#8221;, &#8212;, &#8211;, &#8230;, &#160;, etc.)
 * - Hexadecimal numeric entities (&#x27;, &#x2019;, &#x201C;, etc.)
 */
export function decodeHtmlEntities(input: string): string {
  if (!input) return "";

  let text = input;

  // 1. Repair pre-mangled entity corruptions (e.g. &rsquo. S party -> Sifuna's party)
  text = text
    .replace(/&rsquo\.\s*S\b/g, "'s")
    .replace(/&rsquo\.\s*s\b/g, "'s")
    .replace(/&#8217\.\s*S\b/gi, "'s")
    .replace(/&#39\.\s*S\b/gi, "'s")
    .replace(/&lsquo\.\s*/g, "'")
    .replace(/&rsquo\.\s*/g, "'")
    .replace(/&rdquo\.\s*/g, '"')
    .replace(/&ldquo\.\s*/g, '"')
    .replace(/&quot\.\s*/g, '"')
    .replace(/&amp\.\s*/g, "& ")
    .replace(/&[a-zA-Z0-9#]+;?\.\s*([a-zA-Z])/g, "'$1");

  // 2. Decode decimal numeric entities (e.g. &#8217; -> ', &#8220; -> ", &#8221; -> ")
  text = text.replace(/&#(\d+);?/g, (_match, decStr) => {
    const code = parseInt(decStr, 10);
    if (isNaN(code)) return _match;
    // Map specific typographic quotes and punctuation
    if (code === 8217 || code === 8216 || code === 39) return "'";
    if (code === 8220 || code === 8221 || code === 34) return '"';
    if (code === 8212) return " — ";
    if (code === 8211) return " – ";
    if (code === 8230) return "...";
    if (code === 160) return " ";
    if (code === 37) return "%";
    try {
      return String.fromCharCode(code);
    } catch {
      return _match;
    }
  });

  // 3. Decode hexadecimal numeric entities (e.g. &#x2019; -> ')
  text = text.replace(/&#x([0-9a-fA-F]+);?/g, (_match, hexStr) => {
    const code = parseInt(hexStr, 16);
    if (isNaN(code)) return _match;
    if (code === 0x2017 || code === 0x2018 || code === 0x2019 || code === 0x27) return "'";
    if (code === 0x201c || code === 0x201d || code === 0x22) return '"';
    if (code === 0x2014) return " — ";
    if (code === 0x2013) return " – ";
    if (code === 0x2026) return "...";
    if (code === 0xa0) return " ";
    try {
      return String.fromCharCode(code);
    } catch {
      return _match;
    }
  });

  // 4. Decode named entities with semicolons
  for (const [entity, replacement] of Object.entries(NAMED_HTML_ENTITIES)) {
    const re = new RegExp(entity, "g");
    text = text.replace(re, replacement);
  }

  // 5. Decode unclosed named entities that occasionally appear in scraped HTML
  text = text
    .replace(/&rsquo(?![a-zA-Z0-9])/gi, "'")
    .replace(/&lsquo(?![a-zA-Z0-9])/gi, "'")
    .replace(/&rdquo(?![a-zA-Z0-9])/gi, '"')
    .replace(/&ldquo(?![a-zA-Z0-9])/gi, '"')
    .replace(/&quot(?![a-zA-Z0-9])/gi, '"')
    .replace(/&apos(?![a-zA-Z0-9])/gi, "'")
    .replace(/&nbsp(?![a-zA-Z0-9])/gi, " ")
    .replace(/&mdash(?![a-zA-Z0-9])/gi, " — ")
    .replace(/&ndash(?![a-zA-Z0-9])/gi, " – ")
    .replace(/&hellip(?![a-zA-Z0-9])/gi, "...")
    .replace(/&percnt(?![a-zA-Z0-9])/gi, "%")
    .replace(/&amp(?![a-zA-Z0-9])/gi, "&");

  // 6. Clean up spacing created by entities
  text = text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/([A-Za-z]+)\s+('(?:s|t|d|ll|re|ve|m))\b/gi, "$1$2");

  return text;
}

/**
 * Strips photo captions, photo credit lines, and photographer attribution tags
 * that leak from media article bodies (e.g. "PHOTO/@DrBKhalwale/X", "Photo by...", "FILE PHOTO:").
 */
export function purgePhotoArtifactsAndCaptions(input: string): string {
  if (!input) return "";

  // 0. Pre-scrub photo captions that precede legitimate body sentences in concatenated text
  let scrubbed = input.replace(
    /(?:^|\n+|(?<=[.!?]\s+))(?:\b[A-Z][^.\n]{0,180}?\b(?:during a past event|in this file photo|file photo|pictured above|seen here|seated during|attending|addresses|speaks at|courtesy)\b[^.\n]*?\.)?\s*(?:FILE\s+)?(?:PHOTO|Photo|IMAGE|Image)\s*[/|:@]\s*@?[A-Za-z0-9_./@-]+[.\s]*/gi,
    ""
  );

  // 1. Process paragraphs
  const paragraphs = scrubbed.split(/\n{2,}/);
  const cleanParagraphs: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Pattern A: Whole paragraph is a photo caption / photo credit
    // e.g. "Kakamega County Senator Boni Khalwale during a past event. PHOTO/@DrBKhalwale/X"
    // e.g. "PHOTO / COURTESY", "Photo by Dr Boni Khalwale", "FILE PHOTO: Safaricom CEO Peter Ndegwa"
    const isDedicatedPhotoCaption =
      /\b(?:PHOTO|Photo|IMAGE|Image)\s*[/|:@]\s*@?[A-Za-z0-9_./@-]+/i.test(trimmed) &&
      (
        /\b(?:during a past event|in this file photo|file photo|pictured above|seen here|speaks at|addresses|gestures during|arrives at|seated during|attending|courtesy|file)\b/i.test(trimmed) ||
        /^.{0,180}\b(?:PHOTO|Photo)\s*[/|:@]/i.test(trimmed)
      );

    if (isDedicatedPhotoCaption) {
      continue; // Drop the entire photo caption paragraph
    }

    // Pattern B: Paragraph starts with standalone Photo / Image credit
    if (/^(?:FILE\s+)?(?:PHOTO|Photo|IMAGE|Image)\s*[:/|]\s*[^.\n]+[.\n]?\s*$/i.test(trimmed)) {
      continue;
    }

    // Fast path: if paragraph contains no photo/image tokens, preserve as is
    if (!/\b(?:PHOTO|Photo|IMAGE|Image)\b/i.test(trimmed)) {
      cleanParagraphs.push(trimmed);
      continue;
    }

    // Pattern C: Sentence-level photo credit tags embedded in a legitimate paragraph
    // Strip the photo tag from the sentence, or strip the photo description sentence
    const sentences = trimmed.split(/(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Hon|Sen|Gov|Gen|Col|Capt|Lt)\.)(?<=[.!?]["'”’]?)\s+/);
    const retainedSentences: string[] = [];

    for (const sent of sentences) {
      const sTrim = sent.trim();
      if (!sTrim) continue;

      // Check if this single sentence is purely a photo caption
      if (
        /\b(?:PHOTO|Photo|IMAGE|Image)\s*[/|:@]\s*@?[A-Za-z0-9_./@-]+/i.test(sTrim) &&
        /\b(?:during a past event|in this file photo|file photo|pictured above|seen here|courtesy)\b/i.test(sTrim)
      ) {
        continue; // Drop this sentence
      }

      // Strip trailing photo credits: e.g. "... event. PHOTO/@DrBKhalwale/X" -> "... event."
      let cleanedSentence = sTrim
        .replace(/\s*\.?\s*\b(?:PHOTO|Photo|IMAGE|Image)\s*[/|:@]\s*@?[A-Za-z0-9_./@-]+/gi, ".")
        .replace(/\s*\[(?:Photo|PHOTO|Image|IMAGE):?\s*[^\]]+\]/gi, "")
        .replace(/\s*\((?:Photo|PHOTO|Image|IMAGE):?\s*[^)]+\)/gi, "")
        .replace(/\s*\b(?:Photo|PHOTO)\s+by\s+@?[A-Za-z0-9_./\s-]+(?:\/[A-Za-z]+)?\b/gi, "")
        .replace(/\.{2,}/g, ".")
        .trim();

      if (cleanedSentence.length > 5) {
        retainedSentences.push(cleanedSentence);
      }
    }

    if (retainedSentences.length > 0) {
      cleanParagraphs.push(retainedSentences.join(" "));
    }
  }

  return cleanParagraphs.join("\n\n").trim();
}

/**
 * Purges synthetic feed attribution artifacts from ledes and body paragraphs
 * (e.g. "following reports published by news.google.com earlier this week.").
 */
export function purgeSyntheticFeedAttribution(input: string): string {
  if (!input) return "";

  let cleaned = input;

  // 1. Purge synthetic feed attribution from ledes or sentences:
  // ", following reports published by news.google.com earlier this week."
  // ", following reports published by [domain] earlier this week."
  cleaned = cleaned.replace(
    /,\s*(?:following|according to|based on)?\s*reports published by (?:news\.google\.com|google\.com|[a-z0-9.-]+\.[a-z]{2,})(?:\s+(?:earlier this week|recently|today|yesterday|this week|on\s+[A-Za-z]+))?\.?/gi,
    "."
  );
  cleaned = cleaned.replace(
    /,\s*following reports published by [^.]+ earlier this week\.?/gi,
    "."
  );
  cleaned = cleaned.replace(
    /,\s*following reports published earlier this week\.?/gi,
    "."
  );
  cleaned = cleaned.replace(
    /\b(?:following|according to|based on)?\s*reports published by (?:news\.google\.com|google\.com|[a-z0-9.-]+\.[a-z]{2,})(?:\s+(?:earlier this week|recently|today|yesterday|this week|on\s+[A-Za-z]+))?\.?\s*/gi,
    ""
  );
  cleaned = cleaned.replace(
    /\bfollowing reports published by [^.]+ earlier this week\.?\s*/gi,
    ""
  );
  cleaned = cleaned.replace(
    /\bfollowing reports published earlier this week\.?\s*/gi,
    ""
  );

  // 2. Purge synthetic dispatches from feed domains
  cleaned = cleaned.replace(
    /\bdispatches confirmed by (?:news\.google\.com|google\.com|[a-z0-9.-]+\.[a-z]{2,})\b/gi,
    "dispatches confirmed by regional correspondents"
  );
  cleaned = cleaned.replace(
    /\bAccording to reporting published by (?:news\.google\.com|google\.com),?\s*/gi,
    "According to regional reports, "
  );
  cleaned = cleaned.replace(
    /\s*-\s*news\.google\.com\b/gi,
    ""
  );
  cleaned = cleaned.replace(
    /\s*\((?:via\s+)?news\.google\.com\)/gi,
    ""
  );
  cleaned = cleaned.replace(
    /\bnews\.google\.com\b/gi,
    "regional news reports"
  );

  // 3. Clean any punctuation glitches left by removal
  cleaned = cleaned
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\.{2,}/g, ".")
    .trim();

  return cleaned;
}
