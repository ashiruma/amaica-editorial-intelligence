/**
 * WireOps Desk: Deterministic Verification Confidence Scorer
 * Location: src/lib/verification/confidenceScore.ts
 *
 * Computes an auditable 0-to-100 newsroom confidence score based on:
 * - Source Credibility Tiers (35%)
 * - Independent Corroboration Count (30%)
 * - Primary Documentation & On-Record Quotes (20%)
 * - Fact Consistency & Absence of Discrepancies (15%)
 */

import { SourceCredibilityTier } from "@/types/intelligence";

export interface ConfidenceFactors {
  sourceTierScore: number; // 0 to 1
  corroborationScore: number; // 0 to 1
  primaryEvidenceScore: number; // 0 to 1
  consistencyScore: number; // 0 to 1
}

export interface ConfidenceScoreBreakdown {
  score: number; // 0 to 100
  confidenceTier: "high_confidence" | "medium_confidence" | "low_confidence";
  factors: ConfidenceFactors;
  independentSourceCount: number;
  hasOfficialAuthority: boolean;
  isEligibleForPublish: boolean;
  explanation: string;
}

export class ConfidenceScorer {
  private static readonly SOURCE_TIER_WEIGHTS: Record<SourceCredibilityTier, number> = {
    official_source: 1.0,
    global_national_established: 0.90,
    regional_established: 0.85,
    trusted_local_source: 0.80,
    social_source: 0.35,
    unverified_source: 0.20,
    low_confidence_source: 0.10,
  };

  /**
   * Calculates newsroom confidence score
   */
  public static calculateConfidence(params: {
    sourceTiers: SourceCredibilityTier[];
    independentSourceCount: number;
    hasOfficialDocumentOrGazette?: boolean;
    hasNamedDirectQuotes?: boolean;
    unresolvedDiscrepancyCount?: number;
  }): ConfidenceScoreBreakdown {
    const {
      sourceTiers,
      independentSourceCount,
      hasOfficialDocumentOrGazette = false,
      hasNamedDirectQuotes = false,
      unresolvedDiscrepancyCount = 0,
    } = params;

    // 1. Source Tier Quality Score (Weight: 35%)
    let avgSourceScore = 0.20;
    if (sourceTiers.length > 0) {
      const sum = sourceTiers.reduce(
        (acc, tier) => acc + (this.SOURCE_TIER_WEIGHTS[tier] ?? 0.20),
        0
      );
      avgSourceScore = sum / sourceTiers.length;
    }

    // 2. Corroboration Count Score (Weight: 30%)
    let corroborationScore = 0.20;
    if (independentSourceCount >= 3) {
      corroborationScore = 1.0;
    } else if (independentSourceCount === 2) {
      corroborationScore = 0.65;
    } else if (independentSourceCount === 1) {
      corroborationScore = 0.30;
    }

    // 3. Primary Evidence & Quotes Score (Weight: 20%)
    let primaryEvidenceScore = 0.25;
    if (hasOfficialDocumentOrGazette) {
      primaryEvidenceScore = 1.0;
    } else if (hasNamedDirectQuotes) {
      primaryEvidenceScore = 0.80;
    }

    // 4. Consistency Score (Weight: 15%)
    let consistencyScore = 1.0;
    if (unresolvedDiscrepancyCount > 2) {
      consistencyScore = 0.0;
    } else if (unresolvedDiscrepancyCount > 0) {
      consistencyScore = 0.50;
    }

    // Composite Calculation (0 to 100)
    const rawScore =
      avgSourceScore * 35 +
      corroborationScore * 30 +
      primaryEvidenceScore * 20 +
      consistencyScore * 15;

    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    const hasOfficialAuthority =
      hasOfficialDocumentOrGazette || sourceTiers.includes("official_source");

    // Tier Classification
    let confidenceTier: "high_confidence" | "medium_confidence" | "low_confidence" = "low_confidence";
    if (finalScore >= 80) {
      confidenceTier = "high_confidence";
    } else if (finalScore >= 60) {
      confidenceTier = "medium_confidence";
    }

    // Eligibility check for publication
    const isEligibleForPublish =
      finalScore >= 70 && (independentSourceCount >= 3 || hasOfficialAuthority) && unresolvedDiscrepancyCount === 0;

    let explanation = `Confidence score ${finalScore}/100. `;
    if (isEligibleForPublish) {
      explanation += `Meets verification threshold with ${independentSourceCount} independent sources.`;
    } else if (unresolvedDiscrepancyCount > 0) {
      explanation += `Publication blocked: ${unresolvedDiscrepancyCount} conflicting discrepancy exists between reporting outlets.`;
    } else if (independentSourceCount < 3 && !hasOfficialAuthority) {
      explanation += `Publication blocked: Requires at least 3 independent sources or official authority backing (currently ${independentSourceCount}).`;
    } else {
      explanation += `Score below standard threshold of 70/100.`;
    }

    return {
      score: finalScore,
      confidenceTier,
      factors: {
        sourceTierScore: Math.round(avgSourceScore * 100) / 100,
        corroborationScore: Math.round(corroborationScore * 100) / 100,
        primaryEvidenceScore: Math.round(primaryEvidenceScore * 100) / 100,
        consistencyScore: Math.round(consistencyScore * 100) / 100,
      },
      independentSourceCount,
      hasOfficialAuthority,
      isEligibleForPublish,
      explanation,
    };
  }
}
