import { describe, it, expect } from "vitest";
import { PlagiarismProviderRegistry } from "@/lib/providers/plagiarismProvider";

describe("WireOps Desk: Plagiarism Provider Engine", () => {
  const referenceStories = [
    {
      url: "https://www.standardmedia.co.ke/western/article/1",
      title: "Kakamega County Approves Road Modernization Plan",
      text: "The Kakamega County Assembly has approved an extensive infrastructure modernisation budget. Speaking during the commissioning ceremony on Thursday, local leaders emphasized that the initiative will substantially reduce transit times for agricultural produce heading to regional markets.",
    },
    {
      url: "https://nation.africa/kenya/news/article/2",
      title: "Western Kenya Maize Farmers Urge Price Stabilization",
      text: "Maize farmers across Bungoma, Trans Nzoia, and Kakamega have petitioned the National Cereals and Produce Board regarding purchase prices.",
    },
  ];

  it("detects high similarity and highlights exact overlapping sentences", () => {
    const draftWithPlagiarizedCopy = `
      The Kakamega County Assembly has approved an extensive infrastructure modernisation budget.
      Speaking during the commissioning ceremony on Thursday, local leaders emphasized that the initiative will substantially reduce transit times for agricultural produce heading to regional markets.
      This is a vital development for farmers across the region.
    `;

    const result = PlagiarismProviderRegistry.checkLocalClusterSimilarity(
      draftWithPlagiarizedCopy,
      referenceStories
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.providerName).toBe("LocalClusterNGramScanner_v1");
    expect(result.overallSimilarityPercent).toBeGreaterThan(40);
    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    expect(result.matches[0].matchedUrl).toBe("https://www.standardmedia.co.ke/western/article/1");
    expect(result.matches[0].matchedSnippets.length).toBeGreaterThan(0);
  });

  it("reports near-zero similarity for completely original reporting", () => {
    const originalText = `
      Butere sub-county cultural elders convened yesterday morning to inaugurate the annual
      folklore symposium, drawing historians and youth leaders from across the sugar belt.
      Key discussions centred on documenting traditional dispute resolution mechanisms.
    `;

    const result = PlagiarismProviderRegistry.checkLocalClusterSimilarity(
      originalText,
      referenceStories
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.overallSimilarityPercent).toBeLessThan(15);
  });

  it("transparently reports NOT_CONFIGURED when third-party plagiarism key is missing", async () => {
    const res = await PlagiarismProviderRegistry.checkCopyleaksPlagiarism(
      "Sample text for plagiarism scan"
    );

    expect(res.status).toBe("NOT_CONFIGURED");
    expect(res.overallSimilarityPercent).toBeNull();
    expect(res.errorMessage).toContain("COPYLEAKS_API_KEY is not configured");
  });
});
