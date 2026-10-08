/**
 * WireOps Desk / Amaica Media
 * Structured Editorial Brief Generator Test Suite
 * Location: src/test/editorialBriefGenerator.test.ts
 */

import { describe, it, expect } from "vitest";
import { EditorialBriefGenerator } from "@/lib/editorial/editorialBriefGenerator";
import type { StoryCluster, StorySignal } from "@/types/intelligence";

describe("EditorialBriefGenerator", () => {
  const mockCluster: StoryCluster = {
    id: "cluster-bungoma-sugar-202",
    story_code: "WOP-2026-0202",
    working_headline: "Bungoma Sugar Farmers Protest Delayed Payments Outside Factory",
    category: "agriculture",
    primary_location: "Bungoma",
    county: "Bungoma",
    geographic_relevance_score: 92,
    momentum_score: 85,
    status: "DEVELOPING",
    is_potential_exclusive: false,
    first_detected_at: "2026-10-08T09:00:00Z",
    last_signal_at: "2026-10-08T10:00:00Z",
    signal_count: 2,
    source_count: 2,
    independent_source_count: 2,
    created_at: "2026-10-08T09:00:00Z",
    updated_at: "2026-10-08T10:00:00Z",
  };

  const mockSignals: StorySignal[] = [
    {
      id: "sig-westfm-1",
      source_id: "src-westfm",
      cluster_id: mockCluster.id,
      external_url: "https://westfm.co.ke/news/sugar-protest",
      canonical_url: "https://westfm.co.ke/news/sugar-protest",
      raw_title: "Over 500 Cane Farmers Stage Sit-in at Nzoia Sugar Over KSh 200M Arrears",
      raw_text: "Angry farmers camped outside the factory gates in Bungoma demanding immediate disbursement of arrears.",
      excerpt: "Cane farmers stage sit-in demanding payments.",
      detected_at: "2026-10-08T09:15:00Z",
      content_hash: "hash-wf-1",
      lineage_type: "original_report",
      created_at: "2026-10-08T09:15:00Z",
    },
    {
      id: "sig-standard-2",
      source_id: "src-standard",
      cluster_id: mockCluster.id,
      external_url: "https://www.standardmedia.co.ke/article/sugar-row",
      canonical_url: "https://www.standardmedia.co.ke/article/sugar-row",
      raw_title: "Operations Stalled at Western Mill as Farmers Block Cane Trucks",
      raw_text: "Police were deployed to maintain peace as union representatives met with management.",
      excerpt: "Operations stalled as farmers block trucks.",
      detected_at: "2026-10-08T09:40:00Z",
      content_hash: "hash-std-2",
      lineage_type: "original_report",
      created_at: "2026-10-08T09:40:00Z",
    },
  ];

  it("structures newsroom briefing with separated categories", () => {
    const brief = EditorialBriefGenerator.generateBrief(mockCluster, mockSignals);

    expect(brief.whatHappened).toBe(mockCluster.working_headline);
    expect(brief.whereLocation).toBe("Bungoma");
    expect(brief.confirmedFacts.length).toBeGreaterThan(0);
    expect(brief.whyItMatters).toBeTruthy();
    expect(brief.amaicaRelevance).toContain("Amaica");
    expect(brief.recommendedAngles.length).toBeGreaterThan(0);
    expect(brief.investigativeQuestions.length).toBeGreaterThan(0);
  });
});
