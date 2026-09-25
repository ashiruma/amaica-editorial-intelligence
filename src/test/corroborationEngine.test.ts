import { describe, it, expect } from "vitest";
import { CorroborationEngine } from "@/lib/verification/corroborationEngine";
import { StoryCluster, StorySignal } from "@/types/intelligence";

describe("WireOps Desk: Corroboration Engine & 3-Source Rule", () => {
  const dummyCluster: StoryCluster = {
    id: "cluster-test-001",
    story_code: "WOP-2026-1001",
    working_headline: "Kakamega Road Modernization Project Commences",
    category: "community",
    primary_location: "Kakamega",
    county: "Kakamega",
    town: "Lurambi",
    geographic_relevance_score: 95,
    momentum_score: 50,
    status: "DEVELOPING",
    is_potential_exclusive: false,
    first_detected_at: new Date().toISOString(),
    last_signal_at: new Date().toISOString(),
    signal_count: 3,
    source_count: 3,
    independent_source_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("verifies story cluster when 3 independent sources corroborate", () => {
    const independentSignals: StorySignal[] = [
      {
        id: "sig-1",
        source_id: "src-nation",
        external_url: "https://nation.africa/news/roads-kakamega",
        canonical_url: "https://nation.africa/news/roads-kakamega",
        raw_title: "Governor Barasa Launches Modernization Plan for Kakamega County Roads",
        raw_text: 'Governor Fernandes Barasa announced: "We will build forty-five kilometres of tarmac across Malava."',
        content_hash: "hash-1",
        lineage_type: "original_report",
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "sig-2",
        source_id: "src-standard",
        external_url: "https://www.standardmedia.co.ke/western/barasa-roads",
        canonical_url: "https://www.standardmedia.co.ke/western/barasa-roads",
        raw_title: "Barasa Rolls Out Major Rural Road Upgrades in Kakamega Sub-Counties",
        raw_text: 'Speaking at Lurambi, the county boss affirmed forty-five kilometres will be completed under phase one.',
        content_hash: "hash-2",
        lineage_type: "original_report",
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "sig-3",
        source_id: "src-star",
        external_url: "https://www.the-star.co.ke/counties/barasa-project",
        canonical_url: "https://www.the-star.co.ke/counties/barasa-project",
        raw_title: "Kakamega Assembly Passes Road Modernization Budget",
        raw_text: 'MCAs confirmed forty-five kilometres are funded under the new infrastructure vote.',
        content_hash: "hash-3",
        lineage_type: "original_report",
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    const res = CorroborationEngine.verifyCluster(dummyCluster, independentSignals);
    expect(res.isVerified).toBe(true);
    expect(res.status).toBe("verified");
    expect(res.ruleApplied).toBe("three_independent_sources");
    expect(res.independentSourceCount).toBeGreaterThanOrEqual(3);
    expect(res.confidenceScore).toBeGreaterThanOrEqual(70);
  });

  it("identifies circular copycat reporting and refuses verification", () => {
    // 3 blogs copying the exact same text with secondary citations
    const copycatSignals: StorySignal[] = [
      {
        id: "sig-c1",
        source_id: "src-blog1",
        external_url: "https://unverified-blog.co.ke/rumor",
        canonical_url: "https://unverified-blog.co.ke/rumor",
        raw_title: "Allegations surface in county tender committee",
        raw_text: "Unconfirmed claims indicate a dispute in the county tender committee yesterday evening.",
        content_hash: "hash-c1",
        lineage_type: "original_report",
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "sig-c2",
        source_id: "src-blog2",
        external_url: "https://viral-news.co.ke/tender-rumor",
        canonical_url: "https://viral-news.co.ke/tender-rumor",
        raw_title: "Tender committee dispute reported",
        raw_text: "According to reports by unverified-blog.co.ke, unconfirmed claims indicate a dispute in the county tender committee.",
        content_hash: "hash-c2",
        lineage_type: "syndicated_copy",
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "sig-c3",
        source_id: "src-blog3",
        external_url: "https://daily-buzz.co.ke/county-dispute",
        canonical_url: "https://daily-buzz.co.ke/county-dispute",
        raw_title: "Drama at county tender committee",
        raw_text: "As reported by unverified-blog.co.ke, unconfirmed claims indicate a dispute in the county tender committee.",
        content_hash: "hash-c3",
        lineage_type: "syndicated_copy",
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    const res = CorroborationEngine.verifyCluster(dummyCluster, copycatSignals);
    // Crucial check: 3 outlets, but 2 are circular copycats!
    expect(res.independentSourceCount).toBe(1);
    expect(res.isVerified).toBe(false);
    expect(res.status).toBe("unverified");
    expect(res.ruleApplied).toBe("insufficient_evidence");
  });

  it("flags status as disputed when outlets report conflicting key quantities", () => {
    const conflictingSignals: StorySignal[] = [
      {
        id: "sig-cf1",
        source_id: "src-nation",
        external_url: "https://nation.africa/crime-accident",
        canonical_url: "https://nation.africa/crime-accident",
        raw_title: "Two people confirmed dead in highway accident",
        raw_text: "Police confirmed 2 fatalities following the collision.",
        content_hash: "hash-cf1",
        lineage_type: "original_report",
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "sig-cf2",
        source_id: "src-standard",
        external_url: "https://standardmedia.co.ke/highway-tragedy",
        canonical_url: "https://standardmedia.co.ke/highway-tragedy",
        raw_title: "Twelve casualties feared after highway collision",
        raw_text: "Emergency responders reported 12 fatalities at the scene.",
        content_hash: "hash-cf2",
        lineage_type: "original_report",
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    const res = CorroborationEngine.verifyCluster(dummyCluster, conflictingSignals);
    expect(res.isVerified).toBe(false);
    expect(res.status).toBe("disputed");
    expect(res.discrepancies.length).toBeGreaterThan(0);
    expect(res.discrepancies[0].details).toContain("reports [2 fatalities]");
  });

  it("allows instant verification when official government portal confirms story", () => {
    const officialSignal: StorySignal[] = [
      {
        id: "sig-off",
        source_id: "src-kakamega-county",
        external_url: "https://kakamega.go.ke/press/road-contract-award",
        canonical_url: "https://kakamega.go.ke/press/road-contract-award",
        raw_title: "Official Press Release: Road Modernization Contract Awarded",
        raw_text: "The Kakamega County Government has officially gazetted and awarded road contracts across sub-counties.",
        content_hash: "hash-off",
        lineage_type: "original_report",
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    const res = CorroborationEngine.verifyCluster(dummyCluster, officialSignal);
    expect(res.isVerified).toBe(true);
    expect(res.status).toBe("verified");
    expect(res.ruleApplied).toBe("official_accountable_authority");
    expect(res.verificationRecord.verified_authority_name).toBe("kakamega.go.ke");
  });
});
