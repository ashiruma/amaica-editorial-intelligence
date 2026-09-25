import { describe, it, expect } from "vitest";
import { ConfidenceScorer } from "@/lib/verification/confidenceScore";

describe("WireOps Desk: Verification Confidence Scorer", () => {
  it("calculates high confidence score for 3+ established sources with named quotes", () => {
    const res = ConfidenceScorer.calculateConfidence({
      sourceTiers: [
        "global_national_established",
        "global_national_established",
        "regional_established",
      ],
      independentSourceCount: 3,
      hasNamedDirectQuotes: true,
      hasOfficialDocumentOrGazette: false,
      unresolvedDiscrepancyCount: 0,
    });

    expect(res.score).toBeGreaterThanOrEqual(80);
    expect(res.confidenceTier).toBe("high_confidence");
    expect(res.isEligibleForPublish).toBe(true);
    expect(res.explanation).toContain("Meets verification threshold");
  });

  it("blocks publication for single unverified source", () => {
    const res = ConfidenceScorer.calculateConfidence({
      sourceTiers: ["unverified_source"],
      independentSourceCount: 1,
      hasNamedDirectQuotes: false,
      hasOfficialDocumentOrGazette: false,
      unresolvedDiscrepancyCount: 0,
    });

    expect(res.score).toBeLessThan(50);
    expect(res.confidenceTier).toBe("low_confidence");
    expect(res.isEligibleForPublish).toBe(false);
    expect(res.explanation).toContain("Requires at least 3 independent sources");
  });

  it("blocks publication when unresolved discrepancies exist", () => {
    const res = ConfidenceScorer.calculateConfidence({
      sourceTiers: [
        "global_national_established",
        "global_national_established",
        "regional_established",
      ],
      independentSourceCount: 3,
      hasNamedDirectQuotes: true,
      unresolvedDiscrepancyCount: 1,
    });

    expect(res.isEligibleForPublish).toBe(false);
    expect(res.explanation).toContain("Publication blocked");
    expect(res.explanation).toContain("conflicting discrepancy exists");
  });

  it("permits official authority fast-path with high confidence", () => {
    const res = ConfidenceScorer.calculateConfidence({
      sourceTiers: ["official_source"],
      independentSourceCount: 1,
      hasOfficialDocumentOrGazette: true,
      hasNamedDirectQuotes: true,
      unresolvedDiscrepancyCount: 0,
    });

    expect(res.hasOfficialAuthority).toBe(true);
    expect(res.isEligibleForPublish).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(75);
  });
});
