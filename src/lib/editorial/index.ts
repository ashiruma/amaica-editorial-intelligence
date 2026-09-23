/**
 * Amaica Media Editorial Intelligence Platform
 * Unified Orchestrator & Public API
 */

import type { CompleteEditorialIntelligencePayload, AuthorStyleProfile } from "@/types/editorialIntelligence";
import { runEnsembleAiDetection, AI_MODEL_VERSION } from "./aiPatternEngine";
import { analyzeGrammarAndStyle } from "./grammarWritingEngine";
import { evaluateNewsroomQuality } from "./newsroomQualityEngine";
import { extractProtectedFacts, verifyFactPreservation } from "./factLockingEngine";
import { extractAndClassifyClaims } from "./claimAnalysisEngine";
import { checkOriginality } from "./originalityEngine";
import { evaluateAuthorConsistency } from "./authorStylometryEngine";
import { checkStyleGuide } from "./styleGuideEngine";
import { performEditorialRewrite } from "./editorialRewriteEngine";

export * from "./aiPatternEngine";
export * from "./forensicsClassifierAbstraction";
export * from "./structuralSemanticEngine";
export * from "./grammarWritingEngine";
export * from "./newsroomQualityEngine";
export * from "./factLockingEngine";
export * from "./claimAnalysisEngine";
export * from "./originalityEngine";
export * from "./authorStylometryEngine";
export * from "./styleGuideEngine";
export * from "./editorialRewriteEngine";
export * from "./batchForensicsEngine";
export * from "./wireRepurposingEngine";
export * from "./editorialComplianceEngine";
export * from "./policyGovernanceEngine";
export * from "@/types/editorialIntelligence";

/**
 * Executes full asynchronous Editorial Intelligence Analysis across all 9 engines.
 */
export async function analyzeArticleIntelligence(
  text: string,
  headline?: string,
  authorProfile?: AuthorStyleProfile
): Promise<CompleteEditorialIntelligencePayload> {
  const clean = (text || "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const characterCount = clean.length;

  // Language heuristic (detect Swahili keywords vs English)
  let language: "en" | "sw" | "en-KE" = "en";
  if (/\b(?:habari|mwanasiasa|mkutano|wakenya|serikali|polisi|jijini|kaunti|uchaguzi)\b/i.test(clean)) {
    language = "sw";
  } else if (/\b(?:ksh|kes|benga|ohangla|matatu|boda boda|harambee|wananchi|shamba)\b/i.test(clean)) {
    language = "en-KE";
  }

  // Tier 1: Fast Analysis (Grammar, Readability, Style Guide)
  const { suggestions, readability } = analyzeGrammarAndStyle(clean);
  const styleGuideViolations = checkStyleGuide(clean);

  // Tier 2: Deep Analysis (AI Patterns, Newsroom Quality, Facts & Claims, Originality)
  const aiReport = runEnsembleAiDetection(clean);
  const newsroomScorecard = evaluateNewsroomQuality(
    clean,
    headline,
    suggestions.length,
    readability.fleschReadingEase
  );
  const lockedFacts = extractProtectedFacts(clean);
  const factLockReport = verifyFactPreservation(clean, clean);
  const claims = extractAndClassifyClaims(clean);
  const originality = checkOriginality(clean);
  const evaluatedAuthorProfile = evaluateAuthorConsistency(clean, authorProfile);

  return {
    id: `intel-${Date.now()}`,
    analyzedAt: new Date().toISOString(),
    modelVersion: AI_MODEL_VERSION,
    wordCount,
    characterCount,
    language,
    readingMetrics: readability,
    aiReport,
    grammarSuggestions: suggestions,
    newsroomScorecard,
    factLockReport,
    claims,
    originality,
    styleGuideViolations,
    authorProfile: evaluatedAuthorProfile,
  };
}
