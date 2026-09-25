import { describe, it, expect } from "vitest";
import { ResearchPacketBuilder } from "@/lib/verification/researchPacketBuilder";
import { StoryCluster, StorySignal } from "@/types/intelligence";

describe("WireOps Desk: Research Dossier & Packet Builder", () => {
  const sampleCluster: StoryCluster = {
    id: "cluster-lugari-mill",
    story_code: "WOP-2026-4402",
    working_headline: "Kakamega County Commissions Lugari Maize Processing Plant",
    category: "agriculture",
    primary_location: "Lugari",
    county: "Kakamega",
    town: "Lugari",
    geographic_relevance_score: 95,
    momentum_score: 60,
    status: "VERIFIED",
    is_potential_exclusive: false,
    first_detected_at: new Date().toISOString(),
    last_signal_at: new Date().toISOString(),
    signal_count: 2,
    source_count: 2,
    independent_source_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleSignals: StorySignal[] = [
    {
      id: "sig-westfm-lugari",
      source_id: "src-westfm",
      external_url: "https://westfm.co.ke/news/lugari-mill-commissioning",
      canonical_url: "https://westfm.co.ke/news/lugari-mill-commissioning",
      raw_title: "Governor Barasa Opens Lugari Maize Mill for Western Farmers",
      raw_text: `Governor Fernandes Barasa officially commissioned the new facility in Lugari sub-county.
"This processing plant will eliminate post-harvest losses for our local farmers," said Governor Barasa.
The initiative complies with the County Governments Act 2012.`,
      content_hash: "hash-lugari-1",
      lineage_type: "original_report",
      detected_at: "2026-09-24T08:00:00Z",
      published_at: "2026-09-24T08:00:00Z",
      created_at: new Date().toISOString(),
    },
    {
      id: "sig-nation-lugari",
      source_id: "src-nation",
      external_url: "https://nation.africa/counties/lugari-processing-plant",
      canonical_url: "https://nation.africa/counties/lugari-processing-plant",
      raw_title: "Kakamega Inaugurates Lugari Food Value Addition Center",
      raw_text: `Lugari farmers welcomed the new grain mill in Kakamega.
Over 4,000 farmers across Lugari and Likuyani are expected to deliver produce.`,
      content_hash: "hash-lugari-2",
      lineage_type: "original_report",
      detected_at: "2026-09-24T10:00:00Z",
      published_at: "2026-09-24T10:00:00Z",
      created_at: new Date().toISOString(),
    },
  ];

  it("builds a complete structured research packet with all required dossiers", () => {
    const packet = ResearchPacketBuilder.buildPacket(sampleCluster, sampleSignals);

    expect(packet.id).toBe(`rp-${sampleCluster.id}`);
    expect(packet.cluster_id).toBe(sampleCluster.id);
    expect(packet.assembled_by_agent).toBe("research_dossier_assembler_v1");

    // Entities
    expect(packet.key_entities.length).toBeGreaterThan(0);
    const entityNames = packet.key_entities.map((e) => e.name);
    expect(entityNames).toContain("Fernandes Barasa");
    expect(entityNames).toContain("Lugari");
    expect(entityNames).toContain("Kakamega");

    // Chronological Timeline
    expect(packet.timeline.length).toBe(2);
    expect(new Date(packet.timeline[0].timestamp).getTime()).toBeLessThanOrEqual(
      new Date(packet.timeline[1].timestamp).getTime()
    );

    // Locked Direct Quotes
    expect(packet.direct_quotes.length).toBeGreaterThanOrEqual(1);
    expect(packet.direct_quotes[0].quote).toContain("This processing plant will eliminate post-harvest losses");
    expect(packet.direct_quotes[0].speaker).toContain("Governor Barasa");

    // Statutory Citations
    expect(packet.statutory_citations).toContain("County Governments Act 2012");
  });
});
