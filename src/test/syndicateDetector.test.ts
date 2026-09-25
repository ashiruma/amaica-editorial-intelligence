import { describe, it, expect } from "vitest";
import { SyndicateDetector } from "@/lib/clustering/syndicateDetector";

describe("WireOps Desk: Syndicate & Copycat Detector", () => {
  const existingSignals = [
    {
      domain: "nation.africa",
      title: "Governor Barasa Launches Modernization Plan for Kakamega Roads",
      text: "The Kakamega County Assembly has approved an extensive infrastructure modernisation budget. Speaking during the commissioning ceremony on Thursday, local leaders emphasized that the initiative will substantially reduce transit times for agricultural produce heading to regional markets. The first phase covers forty-five kilometres of all-weather roads.",
    },
  ];

  it("detects explicit secondary citations referencing another outlet", () => {
    const copycatText = `
      A major infrastructure push is underway in Western Kenya, according to reports by nation.africa.
      County officials confirmed funds have been allocated for road modernisations.
    `;

    const res = SyndicateDetector.analyzeSignalIndependence(
      copycatText,
      "random-blog.com",
      existingSignals
    );

    expect(res.isSyndicatedCopy).toBe(true);
    expect(res.copiedSourceDomain).toBe("nation.africa");
    expect(res.independenceScore).toBeLessThanOrEqual(0.2);
    expect(res.reason).toContain("Explicit secondary citation");
  });

  it("detects verbatim sentence copying across outlets", () => {
    const verbatimCopyText = `
      The Kakamega County Assembly has approved an extensive infrastructure modernisation budget.
      Speaking during the commissioning ceremony on Thursday, local leaders emphasized that the initiative will substantially reduce transit times for agricultural produce heading to regional markets.
      The first phase covers forty-five kilometres of all-weather roads.
    `;

    const res = SyndicateDetector.analyzeSignalIndependence(
      verbatimCopyText,
      "tuko.co.ke",
      existingSignals
    );

    expect(res.isSyndicatedCopy).toBe(true);
    expect(res.copiedSourceDomain).toBe("nation.africa");
    expect(res.independenceScore).toBeLessThanOrEqual(0.3);
    expect(res.matchedSentencesCount).toBeGreaterThanOrEqual(2);
  });

  it("confirms genuine independent reporting from a competing outlet", () => {
    const independentReportingText = `
      Governor Fernandes Barasa presided over the rollout of new rural tarmac tenders in Lurambi.
      Local civil society representatives attending the town hall praised the transparency measures introduced by the county tender committee.
      Contractors are scheduled to mobilize heavy equipment by next Tuesday morning.
    `;

    const res = SyndicateDetector.analyzeSignalIndependence(
      independentReportingText,
      "standardmedia.co.ke",
      existingSignals
    );

    expect(res.isSyndicatedCopy).toBe(false);
    expect(res.independenceScore).toBe(1.0);
    expect(res.matchedSentencesCount).toBe(0);
  });
});
