/**
 * WireOps Desk / Amaica Media
 * Story Comparison & Non-Silent Conflict Handling Test Suite
 * Location: src/test/storyComparisonEngine.test.ts
 */

import { describe, it, expect } from "vitest";
import { StoryComparisonEngine } from "@/lib/verification/storyComparisonEngine";
import type { StoryCluster, StorySignal } from "@/types/intelligence";

describe("StoryComparisonEngine", () => {
  const mockCluster: StoryCluster = {
    id: "cluster-kakamega-fire-101",
    story_code: "WOP-2026-0101",
    working_headline: "Massive Fire Breaks Out at Kakamega Central Market",
    category: "community",
    primary_location: "Kakamega",
    county: "Kakamega",
    geographic_relevance_score: 95,
    momentum_score: 88,
    status: "DEVELOPING",
    is_potential_exclusive: false,
    first_detected_at: "2026-10-08T08:00:00Z",
    last_signal_at: "2026-10-08T08:45:00Z",
    signal_count: 3,
    source_count: 3,
    independent_source_count: 3,
    created_at: "2026-10-08T08:00:00Z",
    updated_at: "2026-10-08T08:45:00Z",
  };

  const mockSignals: StorySignal[] = [
    {
      id: "sig-standard-1",
      source_id: "src-standard",
      cluster_id: mockCluster.id,
      external_url: "https://www.standardmedia.co.ke/article/1",
      canonical_url: "https://www.standardmedia.co.ke/article/1",
      raw_title: "Traders Count Losses as Inferno Guts Kakamega Central Market",
      raw_text: "A fierce early morning inferno destroyed properties at Kakamega market. Red Cross officials reported 12 people injured during the stampede. County fire engines arrived an hour later.",
      excerpt: "Inferno guts Kakamega central market leaving 12 people injured.",
      detected_at: "2026-10-08T08:05:00Z",
      content_hash: "hash-std-1",
      lineage_type: "original_report",
      created_at: "2026-10-08T08:05:00Z",
    },
    {
      id: "sig-star-2",
      source_id: "src-thestar",
      cluster_id: mockCluster.id,
      external_url: "https://www.the-star.co.ke/news/2",
      canonical_url: "https://www.the-star.co.ke/news/2",
      raw_title: "Kakamega Central Market On Fire, Several Feared Injured",
      raw_text: "Witnesses said 15 people injured were rushed to Kakamega County General Teaching and Referral Hospital. The fire started at 4 am near the cereal section.",
      excerpt: "15 people injured were taken to hospital after Kakamega market blaze.",
      detected_at: "2026-10-08T08:15:00Z",
      content_hash: "hash-star-2",
      lineage_type: "original_report",
      created_at: "2026-10-08T08:15:00Z",
    },
    {
      id: "sig-county-official-3",
      source_id: "src-kakamega-county-portal",
      cluster_id: mockCluster.id,
      external_url: "https://kakamega.go.ke/press/market-fire",
      canonical_url: "https://kakamega.go.ke/press/market-fire",
      raw_title: "Official Statement on Kakamega Central Market Fire Incident",
      raw_text: "The County Government of Kakamega confirms the fire is now contained. County Emergency Services confirm 11 people injured and receiving medical attention. No fatalities recorded.",
      excerpt: "County confirms 11 people injured and fire contained.",
      detected_at: "2026-10-08T08:30:00Z",
      content_hash: "hash-official-3",
      lineage_type: "original_report",
      created_at: "2026-10-08T08:30:00Z",
    },
  ];

  it("extracts and identifies all reporting sources and their tiers", () => {
    const dossier = StoryComparisonEngine.compareSources(mockCluster, mockSignals);
    expect(dossier.sources.length).toBe(3);

    const official = dossier.sources.find((s) => s.sourceDomain.includes("kakamega.go.ke"));
    expect(official).toBeDefined();
    expect(official?.tier).toBe("TIER_1_OFFICIAL");
  });

  it("detects numerical conflicts non-silently without picking a figure", () => {
    const dossier = StoryComparisonEngine.compareSources(mockCluster, mockSignals);
    expect(dossier.conflicts.length).toBeGreaterThan(0);

    const casualtyConflict = dossier.conflicts.find((c) =>
      c.topic.toLowerCase().includes("injured")
    );
    expect(casualtyConflict).toBeDefined();
    expect(casualtyConflict?.editorialRecommendation).toContain("Varying figures reported");
    expect(casualtyConflict?.editorialRecommendation).toContain("Do not state one figure as established fact");
  });

  it("detects unconfirmed elements and unknowns (gaps)", () => {
    const dossier = StoryComparisonEngine.compareSources(mockCluster, mockSignals);
    expect(dossier.unknown.length).toBeGreaterThan(0);
    // Neither signal explicitly identified root cause
    const causeUnknown = dossier.unknown.find((u) => u.aspect.includes("Cause"));
    expect(causeUnknown).toBeDefined();
  });
});
