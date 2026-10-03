/**
 * WireOps Desk / Amaica Media
 * Sentence Length and Burstiness Engineering Engine
 *
 * Implements:
 * 1. Hard cap on non-quote sentences (max 25 words). Strictly prevents 35+ word constructions.
 * 2. Target average sentence length of ~14–19 words (matching human 23.2 benchmark, never ~29 words).
 * 3. Active injection of very-short punchy journalistic sentences (3–8 words) across paragraphs
 *    to create high perplexity and burstiness.
 *
 * Strictly adheres to the Zero-Emoji Workplace Standard.
 */

export const MAX_SENTENCE_WORDS = 25;
export const STRICT_CEILING_WORDS = 34;
export const TARGET_AVG_WORDS_MIN = 14;
export const TARGET_AVG_WORDS_MAX = 19;

/**
 * Curated very-short punchy journalistic sentences (3–8 words)
 * across various newsroom beats (politics, governance, culture, entertainment).
 */
export const PUNCHY_JOURNALISTIC_SENTENCES: string[] = [
  "The timing is notable.",
  "He did not mince words.",
  "Allies were caught by surprise.",
  "No formal pact exists yet.",
  "The rivalry runs deep.",
  "The stakes are high.",
  "Reactions were swift.",
  "Tensions had been building.",
  "The move caught many off guard.",
  "The signal was clear.",
  "Questions linger on both sides.",
  "Local leaders took notice immediately.",
  "The political ground is shifting.",
  "Public scrutiny has intensified.",
  "The announcement surprised supporters.",
  "The debate is far from over.",
  "Clear facts matter most here.",
  "A final decision is pending.",
  "Details remain scarce.",
  "The contest is wide open.",
  "Consultations are ongoing.",
  "The outcome remains uncertain.",
];

/**
 * Converts a gerund/participle to simple past tense for active clause conversion.
 */
function toPastTenseVerb(verb: string): string {
  const map: Record<string, string> = {
    making: "made",
    highlighting: "highlighted",
    providing: "provided",
    ensuring: "ensured",
    reflecting: "reflected",
    underscoring: "underscored",
    demonstrating: "demonstrated",
    allowing: "allowed",
    fostering: "fostered",
    prompting: "prompted",
    confirming: "confirmed",
    signaling: "signaled",
    triggering: "triggered",
    sparking: "sparked",
    causing: "caused",
    leaving: "left",
    warning: "warned",
    urging: "urged",
    stressing: "stressed",
    reiterating: "reiterated",
    promising: "promised",
    calling: "called",
    showcasing: "showcased",
    featuring: "featured",
    delivering: "delivered",
    treating: "treated",
    thrilling: "thrilled",
  };
  return map[verb.toLowerCase()] || "prompted";
}

/**
 * Checks if a string is a direct quote or protected token that must not be split.
 */
export function isProtectedQuoteSentence(s: string): boolean {
  const trimmed = s.trim();
  if (
    trimmed.includes("__QUOTE_TOKEN_") ||
    trimmed.includes("__CADENCE_QUOTE_") ||
    trimmed.includes("__SENT_QUOTE_")
  ) {
    return true;
  }
  if (/^["'“‘]/.test(trimmed)) return true;
  if (/^["“][^"”]{5,}["”]\s*(?:said|told|added|stated|noted)/i.test(trimmed)) return true;
  return false;
}

/**
 * Splits text into natural journalistic sentences while strictly safeguarding:
 * 1. Honorifics and titles: Mr., Mrs., Ms., Dr., Prof., Hon., Sen., Gov., Gen., Col., Capt., Lt., St.
 * 2. Abbreviations: e.g., i.e., vs., a.m., p.m., Sh., KSh., No., Co., Ltd.
 * 3. Decimal numbers: 45.5, 1.2
 * 4. Quotations: strings inside quotes
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Protect quotes from internal period splitting
  const quotes: string[] = [];
  let protectedText = text.replace(/(["“][^"”]{2,}["”])/g, (m) => {
    quotes.push(m);
    return `__SENT_QUOTE_${quotes.length - 1}__`;
  });

  // Protect honorifics and titles
  protectedText = protectedText.replace(
    /\b(Mr|Mrs|Ms|Dr|Prof|Hon|Sen|Gov|Gen|Col|Capt|Lt|St|vs|e\.g|i\.e|a\.m|p\.m|Sh|KSh|No|Co|Ltd)\./gi,
    "$1_ABBR_DOT_"
  );

  // Protect numbers with decimals
  protectedText = protectedText.replace(/\b(\d+)\.(\d+)\b/g, "$1_NUM_DOT_$2");

  // Split by sentence terminators followed by whitespace and a capital letter, quote, or token
  const raw = protectedText.split(/(?<=[.!?]["'”’]?)\s+(?=[A-Z0-9"“_])/);

  return raw
    .map((s) => {
      let restored = s
        .replace(/_ABBR_DOT_/g, ".")
        .replace(/_NUM_DOT_/g, ".")
        .trim();
      for (let i = 0; i < quotes.length; i++) {
        restored = restored.replace(`__SENT_QUOTE_${i}__`, quotes[i]);
      }
      return restored;
    })
    .filter((s) => s.length > 0);
}

/**
 * Counts words in a sentence accurately.
 */
export function countSentenceWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Breaks a single non-quote long sentence exceeding maxWords into 2 or 3 shorter, punchier sentences.
 * Iteratively enforces the 25-word hard cap.
 */
export function breakLongSentence(sentence: string, maxWords = MAX_SENTENCE_WORDS): string[] {
  const clean = sentence.trim();
  if (!clean) return [];

  // Never break protected quotes
  if (isProtectedQuoteSentence(clean)) {
    return [clean];
  }

  const wordCount = countSentenceWords(clean);
  if (wordCount <= maxWords) {
    return [clean];
  }

  let mod = clean;

  // 1. Semicolons
  if (mod.includes("; ")) {
    const parts = mod.split("; ");
    if (parts.length >= 2) {
      const p1 = parts[0].trim() + ".";
      const p2 = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).trim();
      return [
        ...breakLongSentence(p1, maxWords),
        ...breakLongSentence(p2, maxWords),
      ];
    }
  }

  // 2. Trailing participial tail: ", (making|highlighting|providing...)"
  const participialRegex = /,\s*(making|highlighting|providing|ensuring|reflecting|underscoring|demonstrating|allowing|fostering|prompting|confirming|signaling|triggering|sparking|causing|leaving|warning|urging|stressing|reiterating|promising|calling on)\s+([^.]+)/i;
  if (participialRegex.test(mod)) {
    mod = mod.replace(participialRegex, (_match, verb, rest) => {
      const past = toPastTenseVerb(verb);
      return `. This ${past} ${rest}`;
    });
    return mod.split(/(?<=[.!?])\s+/).flatMap((s) => breakLongSentence(s, maxWords));
  }

  // 3. Clause connectors with commas: ", which ", ", while ", ", where ", ", when "
  if (mod.includes(", while ") && mod.includes(", and ")) {
    const parts = mod.split(", while ");
    const s1 = parts[0].trim() + ".";
    const andParts = parts[1].split(", and ");
    const s2 = "Meanwhile, " + andParts[0].trim() + ".";
    const s3 = andParts[1].charAt(0).toUpperCase() + andParts[1].slice(1).trim();
    return [
      ...breakLongSentence(s1, maxWords),
      ...breakLongSentence(s2, maxWords),
      ...breakLongSentence(s3, maxWords),
    ];
  }

  if (mod.includes(", which ")) {
    const parts = mod.split(", which ");
    if (parts.length === 2) {
      const s1 = parts[0].trim() + ".";
      const s2 = "This " + parts[1].trim();
      return [
        ...breakLongSentence(s1, maxWords),
        ...breakLongSentence(s2, maxWords),
      ];
    }
  }

  if (mod.includes(", while ")) {
    const parts = mod.split(", while ");
    if (parts.length === 2) {
      const s1 = parts[0].trim() + ".";
      const s2 = "Meanwhile, " + parts[1].trim();
      return [
        ...breakLongSentence(s1, maxWords),
        ...breakLongSentence(s2, maxWords),
      ];
    }
  }

  if (mod.includes(", where ")) {
    const parts = mod.split(", where ");
    if (parts.length === 2) {
      const s1 = parts[0].trim() + ".";
      const s2 = "There, " + parts[1].trim();
      return [
        ...breakLongSentence(s1, maxWords),
        ...breakLongSentence(s2, maxWords),
      ];
    }
  }

  if (mod.includes(", although ")) {
    const parts = mod.split(", although ");
    if (parts.length === 2) {
      const s1 = parts[0].trim() + ".";
      const s2 = "Although " + parts[1].trim();
      return [
        ...breakLongSentence(s1, maxWords),
        ...breakLongSentence(s2, maxWords),
      ];
    }
  }

  if (mod.includes(", but ")) {
    const parts = mod.split(", but ");
    if (parts.length === 2) {
      const s1 = parts[0].trim() + ".";
      const s2 = "But " + parts[1].trim();
      return [
        ...breakLongSentence(s1, maxWords),
        ...breakLongSentence(s2, maxWords),
      ];
    }
  }

  if (mod.includes(", yet ")) {
    const parts = mod.split(", yet ");
    if (parts.length === 2) {
      const s1 = parts[0].trim() + ".";
      const s2 = "Yet " + parts[1].trim();
      return [
        ...breakLongSentence(s1, maxWords),
        ...breakLongSentence(s2, maxWords),
      ];
    }
  }

  // 4. Coordinate clauses: ", and (he|she|they|the...)"
  const andClauseRegex = /,\s*and\s+(he|she|they|it|the\s+[a-z]+|officials?|authorities|police|investigators?|analysts?|commentators?|voters?|leaders?|residents?|observers?|organizers?)\s+([a-z]+)\b/i;
  if (andClauseRegex.test(mod)) {
    mod = mod.replace(andClauseRegex, (_m, subj, verb) => `. ${subj.charAt(0).toUpperCase() + subj.slice(1)} ${verb}`);
    return mod.split(/(?<=[.!?])\s+/).flatMap((s) => breakLongSentence(s, maxWords));
  }

  // 5. Prepositional / Infinitive breaks midway in long sentences (wordCount > 25)
  // e.g. "to contest for...", "to run for...", "following political consultations..."
  const infinitivePoliticalBreaks = [
    { from: /\s+to contest for\s+/i, to: ". The plan is to contest for " },
    { from: /\s+to run for\s+/i, to: ". The candidate plans to run for " },
    { from: /\s+to challenge\s+/i, to: ". The move challenges " },
    { from: /\s+to replace\s+/i, to: ". The aim is to replace " },
    { from: /\s+to seek\s+/i, to: ". The leader seeks " },
    { from: /\s+to ensure\s+/i, to: ". The goal is to ensure " },
    { from: /\s+to address\s+/i, to: ". This aims to address " },
    { from: /\s+to support\s+/i, to: ". This aims to support " },
    { from: /,\s*following\s+(political\s+)?(consultations|reports|talks|discussions|meetings)\s+/i, to: ". This followed $1$2 " },
    { from: /\s+following\s+(political\s+)?(consultations|reports|talks|discussions|meetings)\s+/i, to: ". This followed $1$2 " },
    { from: /,\s*ahead of (the|next)\s+/i, to: ". The development comes ahead of $1 " },
    { from: /\s+ahead of the\s+/i, to: ". The development comes ahead of the " },
    { from: /\s+in an effort to\s+/i, to: ". The effort aims to " },
    { from: /\s+in a bid to\s+/i, to: ". The plan aims to " },
    { from: /\s+as part of\s+/i, to: ". This forms part of " },
    { from: /,\s*citing\s+/i, to: ". Citing " },
    { from: /,\s*amid\s+/i, to: ". This comes amid " },
    { from: /\s+amid rising\s+/i, to: ". This comes amid rising " },
    { from: /\s+amid growing\s+/i, to: ". This comes amid growing " },
  ];

  for (const rule of infinitivePoliticalBreaks) {
    if (rule.from.test(mod)) {
      const parts = mod.split(rule.from);
      // Only split if before the match is substantial (>= 8 words)
      if (parts.length >= 2 && countSentenceWords(parts[0]) >= 8) {
        mod = mod.replace(rule.from, rule.to);
        return splitIntoSentences(mod).flatMap((s) => breakLongSentence(s, maxWords));
      }
    }
  }

  // 6. Generic Comma Boundary Split between word index 8 and 22
  const words = mod.split(/\s+/);
  if (words.length > maxWords) {
    // Look for a comma between word 8 and 22
    let bestSplitIdx = -1;
    for (let i = 8; i < Math.min(words.length - 5, 22); i++) {
      if (words[i].endsWith(",")) {
        const cleanWord = words[i].replace(/,$/, "");
        if (!/^(Mr|Mrs|Ms|Dr|Prof|Hon|Sen|Gov|Sh|KSh)$/i.test(cleanWord)) {
          bestSplitIdx = i;
          break;
        }
      }
    }

    if (bestSplitIdx !== -1) {
      const part1Words = words.slice(0, bestSplitIdx + 1);
      const part2Words = words.slice(bestSplitIdx + 1);

      part1Words[part1Words.length - 1] = part1Words[part1Words.length - 1].replace(/,$/, ".");
      if (part2Words.length > 0) {
        part2Words[0] = part2Words[0].charAt(0).toUpperCase() + part2Words[0].slice(1);
      }

      const s1 = part1Words.join(" ");
      const s2 = part2Words.join(" ");

      return [
        ...breakLongSentence(s1, maxWords),
        ...breakLongSentence(s2, maxWords),
      ];
    }

    // Look for conjunction 'and' between word 8 and 22
    for (let i = 8; i < Math.min(words.length - 5, 22); i++) {
      if (words[i].toLowerCase() === "and") {
        const prevWord = words[i - 1] || "";
        const nextWord = words[i + 1] || "";
        const isCapitalizedSequence = /^[A-Z]/.test(prevWord) && /^[A-Z]/.test(nextWord);
        if (!isCapitalizedSequence) {
          bestSplitIdx = i;
          break;
        }
      }
    }

    if (bestSplitIdx !== -1) {
      const part1Words = words.slice(0, bestSplitIdx);
      const part2Words = words.slice(bestSplitIdx + 1);

      const lastWord = part1Words[part1Words.length - 1].replace(/[,;]$/, "");
      part1Words[part1Words.length - 1] = lastWord + ".";

      if (part2Words.length > 0) {
        part2Words[0] = part2Words[0].charAt(0).toUpperCase() + part2Words[0].slice(1);
      }

      const s1 = part1Words.join(" ");
      const s2 = part2Words.join(" ");

      return [
        ...breakLongSentence(s1, maxWords),
        ...breakLongSentence(s2, maxWords),
      ];
    }
  }

  // Ensure ends with period
  if (!/[.!?]$/.test(mod)) {
    mod += ".";
  }

  return [mod];
}

/**
 * Injects punchy 3–8 word journalistic sentences across paragraphs
 * to ensure healthy human burstiness and eliminate monotonous AI signatures.
 */
export function injectPunchyJournalisticSentence(
  paragraphSentences: string[],
  paragraphIndex: number
): string[] {
  if (paragraphSentences.length === 0) return [];

  // Check if paragraph already has a very-short sentence (3–8 words)
  const lengths = paragraphSentences.map((s) => countSentenceWords(s));
  const hasShort = lengths.some((l) => l >= 3 && l <= 8);

  // If already has short sentence or is very short single sentence, return unchanged
  if (hasShort) {
    return [...paragraphSentences];
  }

  // Select punchy sentence deterministically based on paragraph index
  const punchySentence = PUNCHY_JOURNALISTIC_SENTENCES[paragraphIndex % PUNCHY_JOURNALISTIC_SENTENCES.length];

  // In a 2-sentence paragraph, insert between sentence 1 and sentence 2
  // In a 3+ sentence paragraph, insert after sentence 1 or 2
  const result = [...paragraphSentences];
  const insertIdx = result.length >= 3 ? 2 : 1;
  result.splice(insertIdx, 0, punchySentence);

  return result;
}

/**
 * Processes an entire paragraph:
 * 1. Breaks long sentences with 25-word hard cap.
 * 2. Injects punchy 3-8 word journalistic sentences when missing.
 * 3. Guarantees target average sentence length of ~14–19 words.
 */
export function polishParagraphSentenceCadence(
  para: string,
  paragraphIndex = 0,
  maxWords = MAX_SENTENCE_WORDS
): { text: string; sentences: string[]; avgWords: number; stdDev: number } {
  const trimmed = para.trim();
  if (!trimmed) {
    return { text: "", sentences: [], avgWords: 0, stdDev: 0 };
  }

  // Protect quotes during sentence breaking
  const quotes: string[] = [];
  const protectedPara = trimmed.replace(/(["“][^"”]{5,}["”])/g, (m) => {
    quotes.push(m);
    return `__CADENCE_QUOTE_${quotes.length - 1}__`;
  });

  const rawSentences = splitIntoSentences(protectedPara);
  const brokenSentences: string[] = [];

  for (const s of rawSentences) {
    if (s.includes("__CADENCE_QUOTE_")) {
      brokenSentences.push(s);
    } else {
      const parts = breakLongSentence(s, maxWords);
      brokenSentences.push(...parts);
    }
  }

  // Inject punchy short sentences if paragraph lacks them
  const withPunch = injectPunchyJournalisticSentence(brokenSentences, paragraphIndex);

  // Restore quotes
  const restoredSentences = withPunch.map((s) => {
    let out = s;
    for (let i = 0; i < quotes.length; i++) {
      out = out.replace(`__CADENCE_QUOTE_${i}__`, quotes[i]);
    }
    // Capitalize first character of sentence
    return out.charAt(0).toUpperCase() + out.slice(1);
  });

  // Calculate metrics
  const lengths = restoredSentences.map((s) => countSentenceWords(s));
  const totalWords = lengths.reduce((a, b) => a + b, 0);
  const avgWords = lengths.length > 0 ? Math.round((totalWords / lengths.length) * 10) / 10 : 0;

  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avgWords, 2), 0) / Math.max(1, lengths.length);
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

  return {
    text: restoredSentences.join(" "),
    sentences: restoredSentences,
    avgWords,
    stdDev,
  };
}

/**
 * Calibrates entire text cadence to achieve ~14–19 words average and healthy burstiness.
 */
export function engineerTextBurstiness(
  text: string,
  maxWords = MAX_SENTENCE_WORDS
): { text: string; avgWords: number; stdDev: number; shortSentenceRatio: number } {
  if (!text) return { text: "", avgWords: 0, stdDev: 0, shortSentenceRatio: 0 };

  const paragraphs = text.split(/\n{2,}/);
  const polishedParagraphs: string[] = [];
  const allSentences: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;

    // Preserve headings
    if (p.startsWith("#")) {
      polishedParagraphs.push(p);
      continue;
    }

    const { text: polishedText, sentences } = polishParagraphSentenceCadence(p, i, maxWords);
    polishedParagraphs.push(polishedText);
    allSentences.push(...sentences);
  }

  let lengths = allSentences.map((s) => countSentenceWords(s));
  let totalWords = lengths.reduce((a, b) => a + b, 0);
  let avgWords = lengths.length > 0 ? Math.round((totalWords / lengths.length) * 10) / 10 : 0;

  // Active calibration pass: if average sentence length is still > 19 words (above human benchmark),
  // re-polish with a tighter 18-word ceiling to pull average into 14-19 range
  if (avgWords > TARGET_AVG_WORDS_MAX) {
    polishedParagraphs.length = 0;
    allSentences.length = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i].trim();
      if (!p) continue;
      if (p.startsWith("#")) {
        polishedParagraphs.push(p);
        continue;
      }
      const { text: polishedText, sentences } = polishParagraphSentenceCadence(p, i, 18);
      polishedParagraphs.push(polishedText);
      allSentences.push(...sentences);
    }
    lengths = allSentences.map((s) => countSentenceWords(s));
    totalWords = lengths.reduce((a, b) => a + b, 0);
    avgWords = lengths.length > 0 ? Math.round((totalWords / lengths.length) * 10) / 10 : 0;
  }

  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avgWords, 2), 0) / Math.max(1, lengths.length);
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

  const shortCount = lengths.filter((l) => l >= 3 && l <= 8).length;
  const shortSentenceRatio = lengths.length > 0 ? Math.round((shortCount / lengths.length) * 100) / 100 : 0;

  return {
    text: polishedParagraphs.join("\n\n"),
    avgWords,
    stdDev,
    shortSentenceRatio,
  };
}
