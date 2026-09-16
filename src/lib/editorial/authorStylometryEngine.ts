/**
 * Amaica Media Editorial Intelligence Platform
 * Author Stylometry and Consistency Profile Service
 *
 * Tracks historical author metrics (sentence length, vocabulary diversity,
 * passive voice frequency, reading level) and provides an editorial consistency signal.
 */

import type { AuthorStyleProfile } from "@/types/editorialIntelligence";
import { splitSentences, calculateVocabularyDiversity } from "./aiPatternEngine";
import { calculateReadability } from "./grammarWritingEngine";

export function evaluateAuthorConsistency(
  text: string,
  authorProfile?: AuthorStyleProfile
): AuthorStyleProfile {
  const sentences = splitSentences(text);
  const words = text.split(/\s+/).filter(Boolean);
  const paragraphs = text.split(/\n\s*\n+/).filter(Boolean);

  const totalWords = words.length;
  const avgSentenceLength = sentences.length > 0 ? Number((totalWords / sentences.length).toFixed(1)) : 0;
  const avgParagraphLength = paragraphs.length > 0 ? Number((totalWords / paragraphs.length).toFixed(1)) : 0;
  const { ttr } = calculateVocabularyDiversity(words);
  const readability = calculateReadability(text);

  // Passive voice count approximation
  const passiveMatches = text.match(/\b(?:was|were|has been|have been|is being)\s+[a-z]+ed\b/gi) || [];
  const passiveVoiceRatio = Number((passiveMatches.length / Math.max(1, sentences.length)).toFixed(2));

  if (!authorProfile || authorProfile.articleCount < 2) {
    return {
      authorId: authorProfile?.authorId || "current-author",
      articleCount: (authorProfile?.articleCount || 0) + 1,
      avgSentenceLength,
      vocabularyDiversityTtr: ttr,
      passiveVoiceRatio,
      avgParagraphLength,
      commonPhrases: ["exclusive reporting", "confirmed to Amaica", "county officials"],
      readingLevelAvg: readability.fleschKincaidGradeLevel,
      consistencyVerdict: "insufficient_data",
      deviationNotes: ["Fewer than 2 historical articles recorded for author baseline profiling."],
    };
  }

  const deviationNotes: string[] = [];
  let deviationPoints = 0;

  // 1. Sentence length shift
  const sentenceDiff = Math.abs(avgSentenceLength - authorProfile.avgSentenceLength);
  if (sentenceDiff > 8) {
    deviationPoints += 30;
    deviationNotes.push(
      `Sentence length (${avgSentenceLength}w) differs substantially from author baseline (${authorProfile.avgSentenceLength}w).`
    );
  }

  // 2. Vocabulary diversity shift
  const ttrDiff = Math.abs(ttr - authorProfile.vocabularyDiversityTtr);
  if (ttrDiff > 0.15) {
    deviationPoints += 25;
    deviationNotes.push(
      `Vocabulary diversity (TTR ${(ttr * 100).toFixed(0)}%) varies from typical baseline (${(authorProfile.vocabularyDiversityTtr * 100).toFixed(0)}%).`
    );
  }

  // 3. Passive voice divergence
  const passiveDiff = Math.abs(passiveVoiceRatio - authorProfile.passiveVoiceRatio);
  if (passiveDiff > 0.3) {
    deviationPoints += 20;
    deviationNotes.push("Significant deviation in passive voice frequency compared to previous stories.");
  }

  let consistencyVerdict: AuthorStyleProfile["consistencyVerdict"] = "aligns_with_baseline";
  if (deviationPoints >= 50) {
    consistencyVerdict = "significant_deviation";
  } else if (deviationPoints >= 25) {
    consistencyVerdict = "moderate_variance";
  }

  if (deviationNotes.length === 0) {
    deviationNotes.push("Draft cadence and stylistic markers align closely with author's established historical voice.");
  }

  return {
    authorId: authorProfile.authorId,
    articleCount: authorProfile.articleCount + 1,
    avgSentenceLength,
    vocabularyDiversityTtr: ttr,
    passiveVoiceRatio,
    avgParagraphLength,
    commonPhrases: authorProfile.commonPhrases,
    readingLevelAvg: readability.fleschKincaidGradeLevel,
    consistencyVerdict,
    deviationNotes,
  };
}
