import { describe, it, expect } from "vitest";
import { DetectorProviderRegistry } from "@/lib/providers/detectorProvider";

describe("WireOps Desk: Multi-Detector Provider Engine", () => {
  const sampleArticle = `
    The Kakamega County Government has launched an extensive infrastructure modernization program
    aimed at upgrading feeder roads across Malava, Lurambi, and Shinyalu sub-counties.
    Speaking during the commissioning ceremony on Thursday, local leaders emphasized that the
    initiative will substantially reduce transit times for agricultural produce heading to regional markets.
    According to official expenditure documents tabled before the County Assembly, the first phase
    will cover forty-five kilometres of all-weather roads with construction slated to commence immediately.
  `;

  it("executes local internal ensemble and returns valid diagnostic signals", async () => {
    const res = await DetectorProviderRegistry.analyzeInternalEnsemble({
      text: sampleArticle,
    });

    expect(res.status).toBe("SUCCESS");
    expect(res.providerName).toBe("InternalEnsemble_v2.1");
    expect(typeof res.aiScore).toBe("number");
    expect(res.aiScore).toBeGreaterThanOrEqual(0);
    expect(res.aiScore).toBeLessThanOrEqual(100);
    expect(["low", "medium", "high"]).toContain(res.confidence);
  });

  it("strictly reports NOT_CONFIGURED when third-party detector keys are missing (no fake mock scores)", async () => {
    // 1. Copyleaks
    const copyleaksRes = await DetectorProviderRegistry.analyzeCopyleaks({
      text: sampleArticle,
    });
    expect(copyleaksRes.status).toBe("NOT_CONFIGURED");
    expect(copyleaksRes.aiScore).toBeNull();
    expect(copyleaksRes.errorMessage).toContain("COPYLEAKS_API_KEY is not configured");

    // 2. Winston AI
    const winstonRes = await DetectorProviderRegistry.analyzeWinston({
      text: sampleArticle,
    });
    expect(winstonRes.status).toBe("NOT_CONFIGURED");
    expect(winstonRes.aiScore).toBeNull();

    // 3. GPTZero
    const gptZeroRes = await DetectorProviderRegistry.analyzeGPTZero({
      text: sampleArticle,
    });
    expect(gptZeroRes.status).toBe("NOT_CONFIGURED");
    expect(gptZeroRes.aiScore).toBeNull();

    // 4. Sapling AI
    const saplingRes = await DetectorProviderRegistry.analyzeSapling({
      text: sampleArticle,
    });
    expect(saplingRes.status).toBe("NOT_CONFIGURED");
    expect(saplingRes.aiScore).toBeNull();

    // 5. ZeroGPT
    const zeroGptRes = await DetectorProviderRegistry.analyzeZeroGPT({
      text: sampleArticle,
    });
    expect(zeroGptRes.status).toBe("NOT_CONFIGURED");
    expect(zeroGptRes.aiScore).toBeNull();
  });

  it("aggregates newsroom consensus across active providers and calculates average score without error", async () => {
    const consensus = await DetectorProviderRegistry.runAllDetectors(sampleArticle);

    expect(consensus).toBeDefined();
    expect(consensus.results.length).toBe(6);
    expect(consensus.activeProviderCount).toBeGreaterThanOrEqual(1);
    expect(typeof consensus.averageScore).toBe("number");
    expect(["consensus_human", "consensus_ai", "detector_disagreement", "inconclusive"]).toContain(
      consensus.consensusSignal
    );
    expect(consensus.timestamp).toBeTruthy();
  });
});
