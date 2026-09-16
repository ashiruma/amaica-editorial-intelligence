/**
 * Amaica Media Editorial Intelligence Platform
 * Structural, Semantic Repetition & Predictability Forensic Engine
 *
 * Implements Level 5 (Structural Patterns), Level 7 (Semantic Patterns),
 * and Level 9 (Paraphrase & AI-Assistance Signals).
 */

import type {
  StructuralAnalysisReport,
  SemanticRepetitionReport,
  TransitionAnalysisReport,
  PredictabilityReport,
} from "@/types/editorialIntelligence";

/**
 * Analyzes article discourse flow and detects boilerplate templates
 */
export function analyzeStructuralPatterns(text: string): StructuralAnalysisReport {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const firstPara = paragraphs[0]?.toLowerCase() || "";
  const lastPara = paragraphs[paragraphs.length - 1]?.toLowerCase() || "";

  // Evaluate Intro Pattern
  let introPattern: StructuralAnalysisReport["introPattern"] = "generic";
  if (
    /^(?:in today's rapidly evolving|in the modern era of|delving into the|it is important to remember that)/i.test(
      firstPara
    )
  ) {
    introPattern = "formulaic_ai_hook";
  } else if (
    /\b(?:nairobi|kenya|on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|police|court|yesterday|today)\b/i.test(
      firstPara
    )
  ) {
    introPattern = "journalistic_lede";
  } else if (/^(?:this paper examines|the following analysis delves into)/i.test(firstPara)) {
    introPattern = "academic";
  }

  // Evaluate Conclusion Pattern
  let conclusionPattern: StructuralAnalysisReport["conclusionPattern"] = "none";
  if (
    /\b(?:in conclusion|to conclude|ultimately|all in all|as we look to the future)\b/i.test(lastPara)
  ) {
    conclusionPattern = "summary_takeaway";
  } else if (
    /\b(?:serves as a reminder|underscores the need for|poised to shape)\b/i.test(lastPara)
  ) {
    conclusionPattern = "formulaic_moral";
  } else if (lastPara.length > 0 && lastPara.length < 200) {
    conclusionPattern = "natural_kicker";
  }

  // Detect boilerplate formulaic sequence (Intro -> Background -> Response -> Impact)
  const flowStages: string[] = [];
  paragraphs.forEach((p, idx) => {
    const pLow = p.toLowerCase();
    if (idx === 0) flowStages.push("Lead In");
    else if (pLow.startsWith("## background") || pLow.includes("prior to this")) flowStages.push("Context");
    else if (pLow.startsWith("## official response") || pLow.includes("stated in a media briefing"))
      flowStages.push("Response / Quotes");
    else if (pLow.startsWith("## why it matters") || pLow.includes("demonstrates the growing"))
      flowStages.push("Analytical Deduction");
    else flowStages.push(`Section ${idx + 1}`);
  });

  const boilerplateFlowDetected =
    introPattern === "formulaic_ai_hook" ||
    (flowStages.includes("Analytical Deduction") && introPattern === "formulaic_ai_hook") ||
    conclusionPattern === "formulaic_moral";

  let structuralPredictabilityScore = 25;
  if (introPattern === "formulaic_ai_hook") structuralPredictabilityScore += 35;
  if (conclusionPattern === "summary_takeaway" || conclusionPattern === "formulaic_moral")
    structuralPredictabilityScore += 30;
  if (boilerplateFlowDetected) structuralPredictabilityScore += 10;

  return {
    introPattern,
    conclusionPattern,
    boilerplateFlowDetected,
    flowStages,
    structuralPredictabilityScore: Math.min(100, structuralPredictabilityScore),
  };
}

/**
 * Analyzes semantic repetition, concept echo, and paraphrase transformations
 */
export function analyzeSemanticRepetition(text: string): SemanticRepetitionReport {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  const repeatedConcepts: SemanticRepetitionReport["repeatedConcepts"] = [];
  let redundantDetected = false;

  // Compare sentence pairs for semantic concept overlap
  for (let i = 0; i < sentences.length; i++) {
    const wordsA = new Set(
      sentences[i]
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length >= 4)
    );

    for (let j = i + 1; j < sentences.length; j++) {
      const wordsB = new Set(
        sentences[j]
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length >= 4)
      );

      // Jaccard similarity of non-trivial words
      let intersection = 0;
      wordsA.forEach((w) => {
        if (wordsB.has(w)) intersection++;
      });
      const union = new Set([...wordsA, ...wordsB]).size;
      const sim = union > 0 ? intersection / union : 0;

      if (sim >= 0.45 && wordsA.size >= 4) {
        repeatedConcepts.push({
          concept: Array.from(wordsA).filter((w) => wordsB.has(w)).join(", "),
          sentenceA: sentences[i],
          sentenceB: sentences[j],
          similarity: Number((sim * 100).toFixed(1)),
        });
        if (sim >= 0.6) redundantDetected = true;
      }
    }
  }

  // Paraphrase transformation score
  let paraphraseTransformationScore: SemanticRepetitionReport["paraphraseTransformationScore"] = "low";
  if (repeatedConcepts.length >= 3 || redundantDetected) {
    paraphraseTransformationScore = "high";
  } else if (repeatedConcepts.length >= 1) {
    paraphraseTransformationScore = "medium";
  }

  const semanticRepetitionScore = Math.min(100, Math.round(repeatedConcepts.length * 28));

  return {
    semanticRepetitionScore,
    repeatedConcepts: repeatedConcepts.slice(0, 5),
    paraphraseTransformationScore,
    redundantExplanationDetected: redundantDetected,
  };
}

/**
 * Analyzes overused transitions relative to article volume
 */
export function analyzeTransitions(text: string): TransitionAnalysisReport {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);

  const TRANSITION_LIST = [
    "furthermore",
    "moreover",
    "additionally",
    "in conclusion",
    "consequently",
    "subsequently",
    "nevertheless",
    "nonetheless",
    "on the other hand",
    "in essence",
    "it is important to note",
    "it is worth noting",
    "as such",
  ];

  const detectedTransitions: { phrase: string; count: number }[] = [];
  let totalMatches = 0;

  TRANSITION_LIST.forEach((tr) => {
    const reg = new RegExp(`\\b${tr}\\b`, "gi");
    const m = text.match(reg);
    if (m && m.length > 0) {
      detectedTransitions.push({ phrase: tr, count: m.length });
      totalMatches += m.length;
    }
  });

  const densityPer100Words = Number(((totalMatches / wordCount) * 100).toFixed(2));
  const frequencyPercent = Number(((totalMatches / (wordCount / 15)) * 100).toFixed(1)); // Sentence-relative estimate

  let status: TransitionAnalysisReport["status"] = "normal";
  if (densityPer100Words >= 1.8 || totalMatches >= 4) {
    status = "high";
  } else if (densityPer100Words >= 0.9 || totalMatches >= 2) {
    status = "elevated";
  }

  return {
    frequencyPercent,
    densityPer100Words,
    status,
    detectedTransitions,
  };
}

/**
 * Evaluates Linguistic Predictability & Burstiness Profile
 */
export function evaluatePredictabilityAndBurstiness(
  text: string,
  variance: number,
  stdDev: number
): PredictabilityReport {
  // Burstiness variation profile
  let burstinessProfile: PredictabilityReport["burstinessProfile"] = "medium_variation";
  if (stdDev < 4.5 || variance < 20) {
    burstinessProfile = "low_variation"; // Robotic uniform cadence
  } else if (stdDev > 9.0 && variance > 60) {
    burstinessProfile = "high_variation"; // Natural human burstiness
  }

  // Linguistic phrase predictability
  let predictabilityHits = 0;
  const commonTiers = [
    /delivering an evening of/i,
    /featured a blend of/i,
    /stated in a media briefing/i,
    /demonstrates the growing/i,
    /testament to/i,
    /vital digital platform/i,
    /vital role in/i,
    /growing importance of/i,
  ];

  commonTiers.forEach((pat) => {
    if (pat.test(text)) predictabilityHits += 1;
  });

  const phrasePredictabilityIndex = Math.min(100, Math.round(predictabilityHits * 22 + (stdDev < 5 ? 25 : 0)));
  const perplexityScore = Math.max(12, Math.round(75 - phrasePredictabilityIndex * 0.45));
  const burstinessScore = Math.min(100, Math.round(stdDev * 8.5));

  return {
    perplexityScore,
    burstinessScore,
    burstinessProfile,
    phrasePredictabilityIndex,
  };
}
