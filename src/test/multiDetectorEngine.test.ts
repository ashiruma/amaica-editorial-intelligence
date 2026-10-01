/**
 * Unit Tests for Multi-Detector Provider Adapter Engine & Consensus Aggregator
 */

import { describe, it, expect } from "vitest";
import { calculateConsensus } from "@/lib/detectors/consensusAggregator";
import { MultiDetectorEngine } from "@/lib/detectors/multiDetectorEngine";
import type { DetectorAnalysisResponse } from "@/types/intelligence";

describe("Multi-Detector Engine & Consensus Aggregator", () => {
  it("TRANSPARENCY MANDATE: Unconfigured API keys return NOT_CONFIGURED with null score, never faked numbers", async () => {
    // When environment variables are missing, third-party adapters must report NOT_CONFIGURED
    const statuses = await MultiDetectorEngine.getStatuses();
    expect(statuses.length).toBeGreaterThanOrEqual(5);

    // Any unconfigured provider must have NOT_CONFIGURED status
    const copyleaksStatus = statuses.find((s) => s.providerName === "Copyleaks");
    if (copyleaksStatus && !copyleaksStatus.isConfigured) {
      expect(copyleaksStatus.status).toBe("NOT_CONFIGURED");
    }
  });

  it("calculates weighted consensus correctly across active providers", () => {
    const mockResponses: DetectorAnalysisResponse[] = [
      {
        providerName: "InternalEnsemble_v2_1",
        status: "SUCCESS",
        aiScore: 10,
        confidence: "high",
        latencyMs: 45,
      },
      {
        providerName: "Copyleaks",
        status: "SUCCESS",
        aiScore: 15,
        confidence: "high",
        latencyMs: 120,
      },
      {
        providerName: "WinstonAI",
        status: "NOT_CONFIGURED",
        aiScore: null,
        confidence: "low",
        latencyMs: 0,
      },
      {
        providerName: "GPTZero",
        status: "SERVICE_UNAVAILABLE",
        aiScore: null,
        confidence: "low",
        latencyMs: 500,
        errorMessage: "Network timeout",
      },
    ];

    const consensus = calculateConsensus(mockResponses);

    expect(consensus.activeProviderCount).toBe(2);
    expect(consensus.configuredProviderCount).toBe(3); // InternalEnsemble + Copyleaks + GPTZero
    expect(consensus.averageScore).toBe(13); // Math.round((10 + 15) / 2)
    expect(consensus.consensusSignal).toBe("CONFIRMED_HUMAN");
    expect(consensus.disagreement.hasDisagreement).toBe(false);
  });

  it("detects and flags significant detector divergence (disagreement) instead of averaging blindly", () => {
    const divergingResponses: DetectorAnalysisResponse[] = [
      {
        providerName: "InternalEnsemble_v2_1",
        status: "SUCCESS",
        aiScore: 12,
        confidence: "high",
        latencyMs: 40,
      },
      {
        providerName: "Copyleaks",
        status: "SUCCESS",
        aiScore: 82,
        confidence: "high",
        latencyMs: 250,
      },
    ];

    const consensus = calculateConsensus(divergingResponses);

    // Spread is 82 - 12 = 70 points (>= 35)
    expect(consensus.disagreement.hasDisagreement).toBe(true);
    expect(consensus.disagreement.spread).toBe(70);
    expect(consensus.consensusSignal).toBe("UNCERTAIN");
    expect(consensus.disagreement.explanation).toContain("Significant divergence observed");
  });

  it("returns INCONCLUSIVE when no active detectors are available", () => {
    const emptyResponses: DetectorAnalysisResponse[] = [
      {
        providerName: "Copyleaks",
        status: "NOT_CONFIGURED",
        aiScore: null,
        confidence: "low",
        latencyMs: 0,
      },
      {
        providerName: "GPTZero",
        status: "SERVICE_UNAVAILABLE",
        aiScore: null,
        confidence: "low",
        latencyMs: 10,
      },
    ];

    const consensus = calculateConsensus(emptyResponses);

    expect(consensus.consensusSignal).toBe("INCONCLUSIVE");
    expect(consensus.averageScore).toBeNull();
    expect(consensus.activeProviderCount).toBe(0);
  });
});
