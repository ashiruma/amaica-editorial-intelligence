/**
 * Unit Tests for Plagiarism & Text Similarity Detection Engine
 */

import { describe, it, expect } from "vitest";
import {
  PlagiarismEngine,
  calculateLevenshteinDistance,
  calculateLevenshteinSimilarity,
} from "@/lib/detectors/plagiarismEngine";

describe("Plagiarism & Text Similarity Engine", () => {
  it("calculates Levenshtein distance and similarity accurately", () => {
    expect(calculateLevenshteinDistance("Nairobi", "Nairobi")).toBe(0);
    expect(calculateLevenshteinSimilarity("Nairobi", "Nairobi")).toBe(100);

    const sim = calculateLevenshteinSimilarity(
      "Kakamega County approved the new transport bill.",
      "Kakamega County passed the new transport bill."
    );
    expect(sim).toBeGreaterThanOrEqual(80);
  });

  it("detects exact and paraphrased matches against ingested cluster source signals", () => {
    const clusterSources = [
      {
        url: "https://standardmedia.co.ke/article/2001557809",
        title: "Standard Media Wire",
        text: `Dancehall veteran Redsan addressed reports regarding past broadcast interactions during a radio interview in Nairobi.
The singer went on to clarify that there was no bad blood between him and radio presenters.
Production logistics for upcoming regional concerts across Western Kenya have been finalized by local event managers.`,
      },
    ];

    // Draft containing 1 exact match and 1 lightly paraphrased sentence
    const draftText = `Dancehall veteran Redsan addressed reports regarding past broadcast interactions during a radio interview in Nairobi.
The musician clarified that there was no lingering hostility between him and broadcast presenters.
Our independent reporting confirms that local fans are eagerly anticipating the tour.`;

    const result = PlagiarismEngine.scanClusterSources(draftText, clusterSources);

    expect(result.status).toBe("SUCCESS");
    expect(result.exactMatchCount).toBeGreaterThanOrEqual(1);
    expect(result.highlightedSpans.length).toBeGreaterThanOrEqual(1);

    const exactSpan = result.highlightedSpans.find((s) => s.type === "exact");
    expect(exactSpan).toBeDefined();
    expect(exactSpan?.similarityScore).toBe(100);
    expect(exactSpan?.sourceUrl).toBe("https://standardmedia.co.ke/article/2001557809");
  });

  it("reports zero plagiarism for completely original journalistic reporting", () => {
    const clusterSources = [
      {
        url: "https://example.com/source",
        title: "Source Desk",
        text: "The budget committee met on Monday to discuss agricultural subsidies for maize farmers in Trans Nzoia.",
      },
    ];

    const originalDraft = `Safaricom announced the expansion of fiber broadband coverage across Kakamega town yesterday.
Company engineers deployed new high-speed optical routes connecting commercial centers with residential suburbs.
Local business owners praised the telecommunications provider for improving digital payment uptime.`;

    const result = PlagiarismEngine.scanClusterSources(originalDraft, clusterSources);

    expect(result.exactMatchCount).toBe(0);
    expect(result.paraphrasedMatchCount).toBe(0);
    expect(result.highlightedSpans.length).toBe(0);
    expect(result.overallSimilarityPercent).toBeLessThan(10);
  });
});
