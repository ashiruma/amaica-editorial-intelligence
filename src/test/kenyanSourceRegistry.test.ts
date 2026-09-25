import { describe, it, expect } from "vitest";
import { KenyanSourceRegistry } from "@/lib/ingestion/kenyanSourceRegistry";

describe("WireOps Desk: Kenyan Source Registry", () => {
  it("loads configured newsroom sources with complete metadata", () => {
    const all = KenyanSourceRegistry.getAllSources();
    expect(all.length).toBeGreaterThanOrEqual(10);

    for (const src of all) {
      expect(src.id).toBeTruthy();
      expect(src.name).toBeTruthy();
      expect(src.domain).toBeTruthy();
      expect(src.homepage_url.startsWith("http")).toBe(true);
      expect(src.credibility_tier).toBeTruthy();
      expect(Array.isArray(src.primary_topics)).toBe(true);
    }
  });

  it("prioritizes Western Kenya and Kakamega regional coverage", () => {
    const westernSources = KenyanSourceRegistry.getWesternKenyaSources();
    expect(westernSources.length).toBeGreaterThanOrEqual(5);

    const domains = westernSources.map((s) => s.domain);
    expect(domains).toContain("kakamega.go.ke");
    expect(domains).toContain("vihiga.go.ke");
    expect(domains).toContain("bungoma.go.ke");
    expect(domains).toContain("busia.go.ke");
    expect(domains).toContain("siaya.go.ke");
    expect(domains).toContain("westfm.co.ke");
  });

  it("identifies official government and regulatory authorities", () => {
    const official = KenyanSourceRegistry.getOfficialSources();
    const domains = official.map((s) => s.domain);

    expect(domains).toContain("kakamega.go.ke");
    expect(domains).toContain("kenyalaw.org");
    expect(domains).toContain("dci.go.ke");
    expect(domains).toContain("eacc.go.ke");

    for (const src of official) {
      expect(src.credibility_tier).toBe("official_source");
      expect(src.ai_confidence_score).toBeGreaterThanOrEqual(0.95);
    }
  });

  it("resolves credibility tiers accurately by domain", () => {
    expect(KenyanSourceRegistry.getCredibilityTier("nation.africa")).toBe(
      "global_national_established"
    );
    expect(KenyanSourceRegistry.getCredibilityTier("kakamega.go.ke")).toBe(
      "official_source"
    );
    expect(KenyanSourceRegistry.getCredibilityTier("pulse.co.ke")).toBe(
      "regional_established"
    );
    expect(KenyanSourceRegistry.getCredibilityTier("unknown-blog-123.com")).toBe(
      "unverified_source"
    );
  });
});
