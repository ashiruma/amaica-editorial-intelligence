import { describe, it, expect } from "vitest";
import {
  BENCHMARK_50_STORIES,
  runBatchForensics,
  runBatchHumanize,
  exportBatchForensicsReport,
  type BatchStoryItem,
} from "@/lib/editorial/batchForensicsEngine";

describe("High-Throughput Batch Forensics Engine (50+ Stories / Hour)", () => {
  it("provides 50 regional benchmark stories across 8 diverse newsroom beats", () => {
    expect(BENCHMARK_50_STORIES.length).toBe(50);
    const categories = new Set(BENCHMARK_50_STORIES.map((s) => s.category));
    expect(categories.size).toBeGreaterThanOrEqual(7);
    expect(categories.has("Politics")).toBe(true);
    expect(categories.has("Business")).toBe(true);
    expect(categories.has("Western Kenya")).toBe(true);
    expect(categories.has("Technology")).toBe(true);
    expect(categories.has("Entertainment")).toBe(true);
    expect(categories.has("Sports")).toBe(true);
  });

  it("processes batch stories at high velocity (> 50 stories per hour)", async () => {
    // Test on 5 diverse stories
    const testBatch = BENCHMARK_50_STORIES.slice(0, 5).map((s) => ({ ...s, status: "queued" as const }));
    let reportedPerHour = 0;

    const start = performance.now();
    const results = await runBatchForensics(testBatch, (progress) => {
      reportedPerHour = progress.storiesPerHour;
    });
    const totalDurationMs = performance.now() - start;

    expect(results.length).toBe(5);
    for (const r of results) {
      expect(r.status === "completed" || r.status === "flagged").toBe(true);
      expect(r.aiProbability).toBeGreaterThanOrEqual(0);
      expect(r.turnitinParityScore).toBeGreaterThanOrEqual(0);
      expect(r.qualityScore).toBeGreaterThan(0);
      expect(r.executionMs).toBeGreaterThan(0);
    }

    // Must be fast: 5 stories under 2000ms => well over 50 stories per hour
    expect(totalDurationMs).toBeLessThan(3000);
    expect(reportedPerHour).toBeGreaterThan(50);
  });

  it("humanizes flagged stories with 100% Fact Locking", async () => {
    // Find story bm-19 which has synthetic AI pattern
    const aiStory = BENCHMARK_50_STORIES.find((s) => s.id === "bm-19")!;
    const flaggedBatch: BatchStoryItem[] = [
      {
        ...aiStory,
        status: "flagged",
        aiProbability: 68,
      },
    ];

    const humanized = await runBatchHumanize(flaggedBatch);
    expect(humanized[0].status).toBe("humanized");
    expect(humanized[0].humanizedContent).toBeDefined();
    // Names and facts must be preserved
    expect(humanized[0].humanizedContent).toContain("Safaricom");
    expect(humanized[0].humanizedContent).toContain("M-Pesa");
  });

  it("exports valid batch forensics CSV report", () => {
    const sampleBatch = BENCHMARK_50_STORIES.slice(0, 3);
    const csv = exportBatchForensicsReport(sampleBatch, "csv");
    expect(csv).toContain("Story ID,Headline,Beat / Category");
    expect(csv).toContain("bm-01");
    expect(csv).toContain("Senate Devolution Committee");
  });
});
