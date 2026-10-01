/**
 * WireOps Desk / Amaica Media
 * Professional Editorial Paraphraser Precision Tool
 *
 * Provides multi-mode journalistic rewriting (Journalistic, Compact, Formal, Background)
 * with strict quote preservation, entity locking, and explicit source citation injection.
 */

import { extractProtectedFacts, restoreFact } from "./factLockingEngine";
import { applyStylebookCorrections } from "./kenyanStylebookEngine";

export type ParaphraseMode = "journalistic" | "compact" | "formal" | "background";
export type ParaphraseScope = "sentence" | "paragraph" | "article";

export interface SourceAttributionInput {
  sourceName: string;
  sourceUrl?: string;
  isDirectStatement?: boolean;
}

export interface ParaphraseRequest {
  text: string;
  mode?: ParaphraseMode;
  scope?: ParaphraseScope;
  sourceAttribution?: SourceAttributionInput;
  preserveQuotes?: boolean;
}

export interface ParaphraseResult {
  originalText: string;
  paraphrasedText: string;
  mode: ParaphraseMode;
  scope: ParaphraseScope;
  wordsBefore: number;
  wordsAfter: number;
  compressionRatio: number; // e.g. 0.85 = 15% reduction
  quotesPreserved: number;
  attributionInjected: boolean;
  changesSummary: string[];
}

/**
 * Counts words in a string.
 */
function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Replaces common wordy phrases with concise, journalistic equivalents.
 */
const CONCISE_REPLACEMENTS: [RegExp, string][] = [
  [/\bat the present time\b/gi, "currently"],
  [/\bat this point in time\b/gi, "now"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bin order to\b/gi, "to"],
  [/\bin the event that\b/gi, "if"],
  [/\bfor the purpose of\b/gi, "for"],
  [/\bwith regard to\b/gi, "regarding"],
  [/\bwith reference to\b/gi, "regarding"],
  [/\bin spite of the fact that\b/gi, "although"],
  [/\ba large number of\b/gi, "many"],
  [/\ba substantial amount of\b/gi, "much"],
  [/\bconduct an investigation into\b/gi, "investigate"],
  [/\bmake an announcement regarding\b/gi, "announce"],
  [/\bcome to an agreement\b/gi, "agree"],
  [/\bhas the capability to\b/gi, "can"],
  [/\bheld a meeting\b/gi, "met"],
  [/\bput an end to\b/gi, "end"],
  [/\btake into consideration\b/gi, "consider"],
  [/\bprovide assistance to\b/gi, "assist"],
];

/**
 * Converts passive voice constructions into active journalistic voice.
 */
const ACTIVE_VOICE_CONVERSIONS: [RegExp, string][] = [
  [/\bwas seen by\b/gi, "was spotted by"],
  [/\bwas confirmed by\b/gi, "confirmed by"],
  [/\bwas organized by\b/gi, "organized by"],
  [/\bit was reported that\b/gi, "reports indicate that"],
  [/\bit was revealed that\b/gi, "investigations revealed that"],
  [/\bit was stated by\b/gi, "stated by"],
];

/**
 * Paraphrases a sentence or paragraph according to the specified mode.
 */
function paraphraseSegment(
  segment: string,
  mode: ParaphraseMode
): { text: string; changes: string[] } {
  const changes: string[] = [];

  // Protect quotes: quotes are NEVER rewritten
  const quotes: string[] = [];
  let working = segment.replace(/(["“][^"”]{4,}["”])/g, (m) => {
    quotes.push(m);
    return `__QUOTE_${quotes.length - 1}__`;
  });

  if (mode === "compact") {
    for (const [re, rep] of CONCISE_REPLACEMENTS) {
      if (re.test(working)) {
        working = working.replace(re, rep);
        changes.push(`Tightened phrasing: replaced wordy phrase with '${rep}'`);
      }
    }
  } else if (mode === "journalistic") {
    // Apply active voice and tighten
    for (const [re, rep] of ACTIVE_VOICE_CONVERSIONS) {
      if (re.test(working)) {
        working = working.replace(re, rep);
        changes.push(`Active voice: '${rep}'`);
      }
    }
    for (const [re, rep] of CONCISE_REPLACEMENTS.slice(0, 8)) {
      if (re.test(working)) {
        working = working.replace(re, rep);
        changes.push(`Journalistic conciseness: '${rep}'`);
      }
    }
  } else if (mode === "formal") {
    // Elevate colloquial terms to statutory / formal terms
    working = working
      .replace(/\bgave money to\b/gi, "disbursed funds to")
      .replace(/\btalked about\b/gi, "addressed")
      .replace(/\bgot in touch with\b/gi, "contacted")
      .replace(/\bstarted\b/gi, "initiated")
      .replace(/\blooked into\b/gi, "inquired into");
    changes.push("Applied formal administrative vocabulary");
  } else if (mode === "background") {
    // Frame with context-setting introductory clause if not present
    if (!working.toLowerCase().startsWith("contextually") && !working.toLowerCase().startsWith("records show")) {
      working = working.replace(/^([A-Z])/, "Historically, $1");
      changes.push("Added background framing");
    }
  }

  // Restore quotes
  for (let i = 0; i < quotes.length; i++) {
    working = working.replace(`__QUOTE_${i}__`, quotes[i]);
  }

  return { text: working, changes };
}

/**
 * Executes a precision journalistic paraphrase.
 */
export function executeParaphrase(request: ParaphraseRequest): ParaphraseResult {
  const {
    text,
    mode = "journalistic",
    scope = "paragraph",
    sourceAttribution,
    preserveQuotes = true,
  } = request;

  if (!text || text.trim().length === 0) {
    throw new Error("Cannot paraphrase empty text.");
  }

  const wordsBefore = countWords(text);
  const initialFacts = extractProtectedFacts(text);
  const quotesCount = initialFacts.filter((f) => f.type === "quotation").length;

  const changesSummary: string[] = [];

  // Break text according to scope
  let workingText = text;

  if (scope === "sentence") {
    const { text: resText, changes } = paraphraseSegment(workingText, mode);
    workingText = resText;
    changesSummary.push(...changes);
  } else {
    const paragraphs = workingText.split(/\n{2,}/).filter(Boolean);
    const transformed: string[] = [];

    for (const p of paragraphs) {
      const { text: resP, changes } = paraphraseSegment(p, mode);
      transformed.push(resP);
      changesSummary.push(...changes);
    }
    workingText = transformed.join("\n\n");
  }

  // Apply Kenyan stylebook
  const { correctedText: styledText } = applyStylebookCorrections(workingText);
  workingText = styledText;

  // Restore any missing facts
  const currentFacts = extractProtectedFacts(workingText);
  for (const initial of initialFacts) {
    if (!currentFacts.some((cf) => cf.value.toLowerCase() === initial.value.toLowerCase())) {
      workingText = restoreFact(workingText, initial);
    }
  }

  // Inject source attribution if specified
  let attributionInjected = false;
  if (sourceAttribution && sourceAttribution.sourceName) {
    const name = sourceAttribution.sourceName;
    const attributionClause = sourceAttribution.isDirectStatement
      ? `according to an official statement issued by ${name}`
      : `according to verified reporting by ${name}`;

    // Append smoothly to the first paragraph
    const paras = workingText.split(/\n{2,}/);
    if (paras.length > 0 && !paras[0].toLowerCase().includes(name.toLowerCase())) {
      paras[0] = `${paras[0].replace(/\.?$/, "")}, ${attributionClause}.`;
      workingText = paras.join("\n\n");
      attributionInjected = true;
      changesSummary.push(`Injected formal source attribution: ${attributionClause}`);
    }
  }

  const wordsAfter = countWords(workingText);
  const compressionRatio = wordsBefore > 0 ? Number((wordsAfter / wordsBefore).toFixed(2)) : 1.0;

  return {
    originalText: text,
    paraphrasedText: workingText,
    mode,
    scope,
    wordsBefore,
    wordsAfter,
    compressionRatio,
    quotesPreserved: quotesCount,
    attributionInjected,
    changesSummary,
  };
}
