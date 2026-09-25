import { describe, it, expect } from "vitest";
import { ClaimExtractor } from "@/lib/verification/claimExtractor";

describe("WireOps Desk: Falsifiable Claim Extraction Engine", () => {
  it("extracts attributed direct quotations", () => {
    const text = `
      "We will not compromise on road safety standards across the county," stated Governor Barasa.
      The governor inspected the newly tarmacked section in Lurambi.
    `;

    const claims = ClaimExtractor.extractClaims(text);
    const quotes = claims.filter((c) => c.claimType === "quotation");

    expect(quotes.length).toBeGreaterThanOrEqual(1);
    expect(quotes[0].text).toContain("We will not compromise on road safety standards");
    expect(quotes[0].speakerOrSubject).toContain("Governor Barasa");
  });

  it("extracts numerical and financial evidence claims", () => {
    const text = `
      The County Assembly approved KSh 450 million for forty-five kilometres of feeder roads.
      Over 1,200 farmers will benefit from the new market access routes.
    `;

    const claims = ClaimExtractor.extractClaims(text);
    const numericalClaims = claims.filter((c) => c.numericalEvidence !== undefined);

    expect(numericalClaims.length).toBeGreaterThanOrEqual(1);
    const allEvidence = numericalClaims.map((c) => c.numericalEvidence);
    expect(allEvidence.some((e) => e?.toLowerCase().includes("ksh"))).toBe(true);
  });

  it("classifies high-risk allegations, arrests, and fatalities", () => {
    const text = `
      Two suspects were arrested and detained by DCI officers following an ongoing forensic audit into misappropriated funds.
    `;

    const claims = ClaimExtractor.extractClaims(text);
    const highRisk = claims.filter((c) => c.severity === "high_risk");

    expect(highRisk.length).toBeGreaterThanOrEqual(1);
    expect(highRisk[0].requiresOfficialCorroboration).toBe(true);
  });

  it("classifies sensitive governance and budgetary claims", () => {
    const text = `
      The tender was officially awarded following a gazetted notice published last week.
    `;

    const claims = ClaimExtractor.extractClaims(text);
    const sensitive = claims.filter((c) => c.severity === "sensitive");

    expect(sensitive.length).toBeGreaterThanOrEqual(1);
  });
});
