import { describe, it, expect } from "vitest";
import { StoryClusteringEngine } from "@/lib/clustering/storyClusteringEngine";
import { StorySignal, StoryCluster } from "@/types/intelligence";

describe("WireOps Desk: Multi-Source Story Clustering Engine", () => {
  const baseSignal1: StorySignal = {
    id: "sig-nation-barasa-roads",
    source_id: "src-nation-africa",
    external_url: "https://nation.africa/kenya/news/barasa-roads-kakamega",
    canonical_url: "https://nation.africa/kenya/news/barasa-roads-kakamega",
    raw_title: "Governor Barasa Launches Modernization Plan for Kakamega County Roads",
    raw_text: "Governor Fernandes Barasa announced that Kakamega County will upgrade forty-five kilometres of rural roads across Malava and Lurambi.",
    content_hash: "hash-barasa-001",
    lineage_type: "original_report",
    detected_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const baseSignal2: StorySignal = {
    id: "sig-standard-barasa-roads",
    source_id: "src-standard-media",
    external_url: "https://www.standardmedia.co.ke/western/barasa-road-tenders-kakamega",
    canonical_url: "https://www.standardmedia.co.ke/western/barasa-road-tenders-kakamega",
    raw_title: "Barasa Rolls Out Major Rural Road Upgrades in Kakamega Sub-Counties",
    raw_text: "Fernandes Barasa has commissioned thirty road projects across Lurambi and Malava in Kakamega County with county transport engineers on site.",
    content_hash: "hash-barasa-002",
    lineage_type: "original_report",
    detected_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const unrelatedSignal: StorySignal = {
    id: "sig-pulse-music",
    source_id: "src-pulse-live-kenya",
    external_url: "https://www.pulse.co.ke/music/concert-in-nairobi-weekend",
    canonical_url: "https://www.pulse.co.ke/music/concert-in-nairobi-weekend",
    raw_title: "Top Afrobeats Artists Slated to Perform at Nairobi Weekend Festival",
    raw_text: "Organizers have confirmed the festival line-up for the music concert in Nairobi.",
    content_hash: "hash-music-999",
    lineage_type: "original_report",
    detected_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  it("creates a new cluster from a solitary initial signal", () => {
    const res = StoryClusteringEngine.clusterSignal(baseSignal1, []);
    expect(res.isNewCluster).toBe(true);
    expect(res.cluster).toBeDefined();
    expect(res.cluster.working_headline).toBe(baseSignal1.raw_title);
    expect(res.cluster.county).toBe("Kakamega");
    expect(res.cluster.signal_count).toBe(1);
    expect(res.cluster.source_count).toBe(1);
    expect(res.cluster.status).toBe("SIGNAL");
  });

  it("merges a corroborating signal into the existing story cluster", () => {
    const initialCluster = StoryClusteringEngine.clusterSignal(baseSignal1, []).cluster;

    const res = StoryClusteringEngine.clusterSignal(baseSignal2, [initialCluster]);
    expect(res.isNewCluster).toBe(false);
    expect(res.cluster.id).toBe(initialCluster.id);
    expect(res.cluster.signal_count).toBe(2);
    expect(res.cluster.source_count).toBe(2);
    expect(res.cluster.status).toBe("DEVELOPING");
    expect(res.matchScore).toBeGreaterThanOrEqual(0.55);
  });

  it("refuses to merge unrelated stories into the cluster", () => {
    const initialCluster = StoryClusteringEngine.clusterSignal(baseSignal1, []).cluster;

    const res = StoryClusteringEngine.clusterSignal(unrelatedSignal, [initialCluster]);
    expect(res.isNewCluster).toBe(true);
    expect(res.cluster.id).not.toBe(initialCluster.id);
    expect(res.cluster.working_headline).toContain("Nairobi");
  });

  it("rejects clustering when signals exceed the 36-hour temporal window", () => {
    const oldSignal: StorySignal = {
      ...baseSignal2,
      published_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      detected_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    };

    const initialCluster = StoryClusteringEngine.clusterSignal(baseSignal1, []).cluster;
    const similarity = StoryClusteringEngine.calculateClusterSimilarity(
      oldSignal,
      ["Fernandes Barasa", "Kakamega"],
      initialCluster
    );

    expect(similarity).toBe(0.0);
  });

  it("automatically transitions cluster to VERIFIED when 3 independent sources corroborate", () => {
    const cluster1 = StoryClusteringEngine.clusterSignal(baseSignal1, []).cluster;
    const cluster2 = StoryClusteringEngine.clusterSignal(baseSignal2, [cluster1]).cluster;

    // Third independent signal from The Star
    const baseSignal3: StorySignal = {
      id: "sig-star-barasa-roads",
      source_id: "src-the-star",
      external_url: "https://www.the-star.co.ke/counties/kakamega-barasa-roads",
      canonical_url: "https://www.the-star.co.ke/counties/kakamega-barasa-roads",
      raw_title: "Kakamega County Assembly Debates Rural Road Modernization Program",
      raw_text: "MCAs in Kakamega have debated the infrastructure road project spearheaded by Governor Fernandes Barasa for Lurambi and Malava.",
      content_hash: "hash-barasa-003",
      lineage_type: "original_report",
      detected_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const res3 = StoryClusteringEngine.clusterSignal(baseSignal3, [cluster2]);
    expect(res3.cluster.signal_count).toBe(3);
    expect(res3.cluster.independent_source_count).toBeGreaterThanOrEqual(3);
    expect(res3.cluster.status).toBe("VERIFIED");
  });
});
