/**
 * Amaica Media Editorial Intelligence Platform
 * Grammar, Style, Clarity, and Readability Engine
 *
 * Provides independent editorial grammar analysis, style polishing,
 * active voice conversion, redundancy trimming, and Flesch-Kincaid readability scoring.
 */

import type {
  GrammarSuggestion,
  GrammarCategory,
  ReadabilityMetrics,
} from "@/types/editorialIntelligence";
import { splitSentences } from "./aiPatternEngine";

// Count syllables in an English word (approximation heuristic)
export function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean || clean.length <= 3) return 1;
  const cleaned = clean
    .replace(/(?:[^laeiouy]|ed|es|e)$/, "")
    .replace(/^y/, "");
  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

/**
 * Calculates Flesch-Kincaid Grade Level and Flesch Reading Ease.
 */
export function calculateReadability(text: string): ReadabilityMetrics {
  const sentences = splitSentences(text);
  const words = text.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const totalSentences = Math.max(1, sentences.length);

  if (totalWords === 0) {
    return {
      fleschKincaidGradeLevel: 0,
      fleschReadingEase: 100,
      readingTimeMinutes: 0,
      avgSyllablesPerWord: 0,
      complexWordPercentage: 0,
      gradeDescription: "Empty article",
    };
  }

  let totalSyllables = 0;
  let complexWordsCount = 0;

  for (const w of words) {
    const syl = countSyllables(w);
    totalSyllables += syl;
    if (syl >= 3) complexWordsCount++;
  }

  const wordsPerSentence = totalWords / totalSentences;
  const syllablesPerWord = totalSyllables / totalWords;

  // Flesch Reading Ease formula: 206.835 - 1.015 * (words/sentence) - 84.6 * (syllables/word)
  const readingEase = Math.round(
    Math.max(0, Math.min(100, 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord))
  );

  // Flesch-Kincaid Grade Level formula: 0.39 * (words/sentence) + 11.8 * (syllables/word) - 15.59
  const gradeLevel = Math.max(
    1,
    Number((0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59).toFixed(1))
  );

  const complexWordPct = Number(((complexWordsCount / totalWords) * 100).toFixed(1));
  const readingTime = Number((totalWords / 220).toFixed(1)); // Avg 220 wpm

  let gradeDescription = "Standard newsroom reading level";
  if (gradeLevel <= 6) gradeDescription = "Very easy (elementary level)";
  else if (gradeLevel <= 8) gradeDescription = "Conversational (middle school level)";
  else if (gradeLevel <= 11) gradeDescription = "Journalistic sweet spot (high school level)";
  else if (gradeLevel <= 14) gradeDescription = "Advanced / Academic level";
  else gradeDescription = "Dense academic / Legal prose";

  return {
    fleschKincaidGradeLevel: gradeLevel,
    fleschReadingEase: readingEase,
    readingTimeMinutes: Math.max(0.2, readingTime),
    avgSyllablesPerWord: Number(syllablesPerWord.toFixed(2)),
    complexWordPercentage: complexWordPct,
    gradeDescription,
  };
}

// Grammatical rules: Subject-Verb & Agreement
const GRAMMAR_RULES: {
  pattern: RegExp;
  replacement: string;
  explanation: string;
  issueType: string;
}[] = [
  {
    pattern: /\b(?:the group of [a-z]+|the team of [a-z]+)\s+are\b/gi,
    replacement: "is",
    explanation: "Collective noun phrases ('group of...', 'team of...') take singular verbs.",
    issueType: "Subject-Verb Agreement",
  },
  {
    pattern: /\b(?:he|she|it)\s+have\b/gi,
    replacement: "has",
    explanation: "Third-person singular pronouns require 'has', not 'have'.",
    issueType: "Subject-Verb Agreement",
  },
  {
    pattern: /\b(?:they|we)\s+was\b/gi,
    replacement: "were",
    explanation: "Plural pronouns require 'were', not 'was'.",
    issueType: "Subject-Verb Agreement",
  },
  {
    pattern: /\b(?:a)\s+([aeiou][a-z]+)\b/gi,
    replacement: "an $1",
    explanation: "Use 'an' before words beginning with a vowel sound.",
    issueType: "Article Usage",
  },
  {
    pattern: /\b(?:an)\s+([bcdfghjklmnpqrstvwxyz][a-z]+)\b/gi,
    replacement: "a $1",
    explanation: "Use 'a' before words beginning with a consonant sound.",
    issueType: "Article Usage",
  },
  {
    pattern: /\btheir\s+(is|are)\s+a\b/gi,
    replacement: "there $1 a",
    explanation: "Did you mean 'there' (existential) instead of 'their' (possessive)?",
    issueType: "Confused Words",
  },
  {
    pattern: /\bits\s+(a|an|the|very)\b/gi,
    replacement: "it's $1",
    explanation: "Use 'it's' as a contraction for 'it is'.",
    issueType: "Punctuation & Contraction",
  },
];

// Style rules: Passive voice to active voice
const PASSIVE_VOICE_RULES: {
  pattern: RegExp;
  replacement: string;
  explanation: string;
}[] = [
  {
    pattern: /\bwas announced by\s+([^,.]+)/gi,
    replacement: "$1 announced",
    explanation: "Convert passive voice into direct, active journalistic voice.",
  },
  {
    pattern: /\bwere confirmed by\s+([^,.]+)/gi,
    replacement: "$1 confirmed",
    explanation: "Active voice strengthens reporting clarity and attribution.",
  },
  {
    pattern: /\bhas been reported by\s+([^,.]+)/gi,
    replacement: "$1 reported",
    explanation: "Direct attribution is preferred in news writing.",
  },
  {
    pattern: /\bwas stated by\s+([^,.]+)/gi,
    replacement: "$1 stated",
    explanation: "Replace passive reporting with active sentence structure.",
  },
  {
    pattern: /\bwere revealed by\s+([^,.]+)/gi,
    replacement: "$1 revealed",
    explanation: "Active verbs deliver punchier news copy.",
  },
];

// Wordiness & fluff trimming
const WORDINESS_RULES: {
  pattern: RegExp;
  replacement: string;
  explanation: string;
}[] = [
  {
    pattern: /\bat this point in time\b/gi,
    replacement: "now",
    explanation: "Trim wordy throat-clearing: 'at this point in time' can be stated as 'now'.",
  },
  {
    pattern: /\bin order to\b/gi,
    replacement: "to",
    explanation: "'In order to' is redundant; use 'to'.",
  },
  {
    pattern: /\bdue to the fact that\b/gi,
    replacement: "because",
    explanation: "'Due to the fact that' is bureaucratic filler; use 'because'.",
  },
  {
    pattern: /\bfor the purpose of\b/gi,
    replacement: "to",
    explanation: "'For the purpose of' can be simplified to 'to'.",
  },
  {
    pattern: /\bwith the exception of\b/gi,
    replacement: "except for",
    explanation: "Simplify wordy prepositional phrase to 'except for'.",
  },
  {
    pattern: /\ba wide variety of\b/gi,
    replacement: "many",
    explanation: "Concise phrasing improves reading speed.",
  },
  {
    pattern: /\bhas the ability to\b/gi,
    replacement: "can",
    explanation: "'Has the ability to' is wordy; use 'can'.",
  },
  {
    pattern: /\bin the event that\b/gi,
    replacement: "if",
    explanation: "'In the event that' can simply be 'if'.",
  },
];

// Redundancy trimming
const REDUNDANCY_RULES: {
  pattern: RegExp;
  replacement: string;
  explanation: string;
}[] = [
  {
    pattern: /\bpast history\b/gi,
    replacement: "history",
    explanation: "History is inherently in the past; 'past history' is redundant.",
  },
  {
    pattern: /\bcompletely unanimous\b/gi,
    replacement: "unanimous",
    explanation: "Unanimous already means complete agreement.",
  },
  {
    pattern: /\bclose proximity\b/gi,
    replacement: "proximity",
    explanation: "Proximity means close; choose one.",
  },
  {
    pattern: /\bfuture plans\b/gi,
    replacement: "plans",
    explanation: "Plans are inherently forward-looking.",
  },
  {
    pattern: /\bfirst inaugural\b/gi,
    replacement: "inaugural",
    explanation: "Inaugural already denotes the first event.",
  },
  {
    pattern: /\bend result\b/gi,
    replacement: "result",
    explanation: "Results occur at the end; 'end result' is repetitive.",
  },
];

/**
 * Runs independent grammar, style, and clarity analysis across text.
 */
export function analyzeGrammarAndStyle(text: string): {
  suggestions: GrammarSuggestion[];
  readability: ReadabilityMetrics;
} {
  const suggestions: GrammarSuggestion[] = [];
  const readability = calculateReadability(text);
  let suggestionCount = 0;

  // 1. Grammar checks
  for (const rule of GRAMMAR_RULES) {
    let match: RegExpExecArray | null;
    const re = new RegExp(rule.pattern.source, "gi");
    while ((match = re.exec(text)) !== null) {
      suggestionCount++;
      const orig = match[0];
      const repl = orig.replace(rule.pattern, rule.replacement);
      suggestions.push({
        id: `gram-${suggestionCount}`,
        category: "grammar",
        issueType: rule.issueType,
        originalText: orig,
        suggestedRevision: repl,
        explanation: rule.explanation,
        startOffset: match.index,
        endOffset: match.index + orig.length,
        status: "pending",
      });
    }
  }

  // 2. Passive voice checks
  for (const rule of PASSIVE_VOICE_RULES) {
    let match: RegExpExecArray | null;
    const re = new RegExp(rule.pattern.source, "gi");
    while ((match = re.exec(text)) !== null) {
      suggestionCount++;
      const orig = match[0];
      const repl = orig.replace(rule.pattern, rule.replacement);
      suggestions.push({
        id: `style-passive-${suggestionCount}`,
        category: "style",
        issueType: "Passive Voice",
        originalText: orig,
        suggestedRevision: repl,
        explanation: rule.explanation,
        startOffset: match.index,
        endOffset: match.index + orig.length,
        status: "pending",
      });
    }
  }

  // 3. Wordiness checks
  for (const rule of WORDINESS_RULES) {
    let match: RegExpExecArray | null;
    const re = new RegExp(rule.pattern.source, "gi");
    while ((match = re.exec(text)) !== null) {
      suggestionCount++;
      const orig = match[0];
      const repl = orig.replace(rule.pattern, rule.replacement);
      suggestions.push({
        id: `style-wordy-${suggestionCount}`,
        category: "clarity",
        issueType: "Wordy Phrasing",
        originalText: orig,
        suggestedRevision: repl,
        explanation: rule.explanation,
        startOffset: match.index,
        endOffset: match.index + orig.length,
        status: "pending",
      });
    }
  }

  // 4. Redundancy checks
  for (const rule of REDUNDANCY_RULES) {
    let match: RegExpExecArray | null;
    const re = new RegExp(rule.pattern.source, "gi");
    while ((match = re.exec(text)) !== null) {
      suggestionCount++;
      const orig = match[0];
      const repl = orig.replace(rule.pattern, rule.replacement);
      suggestions.push({
        id: `style-redundant-${suggestionCount}`,
        category: "style",
        issueType: "Redundant Phrase",
        originalText: orig,
        suggestedRevision: repl,
        explanation: rule.explanation,
        startOffset: match.index,
        endOffset: match.index + orig.length,
        status: "pending",
      });
    }
  }

  // 5. Overly long compound sentences (> 34 words)
  const sentences = splitSentences(text);
  for (const s of sentences) {
    const words = s.split(/\s+/).filter(Boolean);
    if (words.length >= 35) {
      const idx = text.indexOf(s);
      suggestionCount++;
      suggestions.push({
        id: `clarity-len-${suggestionCount}`,
        category: "clarity",
        issueType: "Overly Long Sentence",
        originalText: s.slice(0, 60) + "...",
        suggestedRevision: "Consider splitting into two distinct sentences.",
        explanation: `Sentence contains ${words.length} words. Long compound sentences increase cognitive load and hinder mobile readability.`,
        startOffset: idx >= 0 ? idx : 0,
        endOffset: idx >= 0 ? idx + s.length : 0,
        status: "pending",
      });
    }
  }

  return { suggestions, readability };
}
