import { describe, it, expect } from "vitest";
import { StoryClusteringEngine } from "@/lib/clustering/storyClusteringEngine";
import { CorroborationEngine } from "@/lib/verification/corroborationEngine";
import { ResearchPacketBuilder } from "@/lib/verification/researchPacketBuilder";
import { synthesizeInvertedPyramidOffline } from "@/lib/writer/invertedPyramidEngine";
import { applyStylebookCorrections, auditKenyanStylebook } from "@/lib/editorial/kenyanStylebookEngine";
import { validatePreFlight } from "@/lib/publishing/preflightGatekeeper";
import { PublisherService } from "@/lib/publishing/publisherService";
import type { StorySignal, StoryCluster } from "@/types/intelligence";

describe("E2E Newsroom Intelligence & Production Pipeline", () => {
  it("executes the full lifecycle: Signals -> Cluster -> Corroboration -> Research -> Inverted Pyramid -> Stylebook -> Pre-Flight Gate -> Dispatch", async () => {
    // -------------------------------------------------------------------------
    // Step 1: Ingest 3 Independent Signals for a Western Kenya Event
    // -------------------------------------------------------------------------
    const signal1: StorySignal = {
      id: "sig-kakamega-1",
      source_id: "src-kakamega-gov",
      external_url: "https://kakamega.go.ke/news/dairy-subsidy-2026",
      canonical_url: "https://kakamega.go.ke/news/dairy-subsidy-2026",
      raw_title: "Kakamega County Approves KSh 50 Million Dairy Farming Subsidy",
      raw_text: `Kakamega Governor Fernandes Barasa on Monday approved KSh 50 million to subsidize dairy farming inputs across Malava sub-county.
"We are committed to delivering sustainable economic support directly to our sugarcane growers and dairy farmers," Barasa stated.`,
      content_hash: "hash-kakamega-1",
      lineage_type: "original_report",
      detected_at: new Date(Date.now() - 3600000).toISOString(),
      published_at: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date().toISOString(),
    };

    const signal2: StorySignal = {
      id: "sig-kakamega-2",
      source_id: "src-standard",
      external_url: "https://standardmedia.co.ke/western/dairy-grant",
      canonical_url: "https://standardmedia.co.ke/western/dairy-grant",
      raw_title: "Kakamega Dairy Farmers in Malava Applaud Governor Barasa Subsidy",
      raw_text: `Dairy farmer cooperatives in Malava, Kakamega celebrated the announcement of the 50 million shilling fund by Governor Fernandes Barasa.
"This subsidy arrives at an important time as our farmers prepare for the planting season," said Western regional agricultural coordinator John Omondi.`,
      content_hash: "hash-kakamega-2",
      lineage_type: "original_report",
      detected_at: new Date(Date.now() - 1800000).toISOString(),
      published_at: new Date(Date.now() - 1800000).toISOString(),
      created_at: new Date().toISOString(),
    };

    const signal3: StorySignal = {
      id: "sig-kakamega-3",
      source_id: "src-nation",
      external_url: "https://nation.africa/western/assembly-budget",
      canonical_url: "https://nation.africa/western/assembly-budget",
      raw_title: "Kakamega Assembly Clears Barasa Dairy Subsidy for Malava Farmers",
      raw_text: "The Kakamega County Assembly has cleared the supplementary expenditure for Governor Fernandes Barasa dairy farming program in Malava.",
      content_hash: "hash-kakamega-3",
      lineage_type: "original_report",
      detected_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // -------------------------------------------------------------------------
    // Step 2: Story Clustering Engine
    // -------------------------------------------------------------------------
    let clusters: StoryCluster[] = [];
    const res1 = StoryClusteringEngine.clusterSignal(signal1, clusters);
    clusters = [res1.cluster];

    const res2 = StoryClusteringEngine.clusterSignal(signal2, clusters);
    expect(res2.isNewCluster).toBe(false);
    clusters = [res2.cluster];

    const res3 = StoryClusteringEngine.clusterSignal(signal3, clusters);
    expect(res3.isNewCluster).toBe(false);
    clusters = [res3.cluster];

    const primaryCluster = res3.cluster;
    expect(primaryCluster.signal_count).toBe(3);
    expect(primaryCluster.county).toBe("Kakamega");

    // -------------------------------------------------------------------------
    // Step 3: Corroboration & Verification Scoring
    // -------------------------------------------------------------------------
    const corroboration = CorroborationEngine.verifyCluster(primaryCluster, [signal1, signal2, signal3]);
    expect(corroboration.isVerified).toBe(true);
    expect(corroboration.status).toBe("verified");
    expect(corroboration.independentSourceCount).toBe(3);
    expect(corroboration.confidenceScore).toBeGreaterThanOrEqual(70);

    // -------------------------------------------------------------------------
    // Step 4: Research Packet Generation
    // -------------------------------------------------------------------------
    const researchPacket = ResearchPacketBuilder.buildPacket(primaryCluster, [signal1, signal2, signal3]);
    expect(researchPacket.cluster_id).toBe(primaryCluster.id);
    expect(researchPacket.key_entities.some((e) => e.name.includes("Kakamega") || e.name.includes("Barasa"))).toBe(true);

    // -------------------------------------------------------------------------
    // Step 5: Inverted Pyramid Draft Generation
    // -------------------------------------------------------------------------
    const invertedArticle = synthesizeInvertedPyramidOffline({
      headline: primaryCluster.working_headline,
      region: "kakamega",
      category: "agriculture",
      researchPacket,
      quotes: [
        {
          speaker: "Governor Fernandes Barasa",
          title: "Governor of Kakamega County",
          quote: "We are committed to delivering sustainable economic support directly to our sugarcane growers and dairy farmers.",
        },
        {
          speaker: "John Omondi",
          title: "Western Regional Agricultural Coordinator",
          quote: "This subsidy arrives at an important time as our farmers prepare for the planting season.",
        },
      ],
    });

    expect(invertedArticle.headline).toBeTruthy();
    expect(invertedArticle.lede).toBeTruthy();
    expect(invertedArticle.wordCount).toBeGreaterThanOrEqual(200);

    // -------------------------------------------------------------------------
    // Step 6: Kenyan English Stylebook Normalization
    // -------------------------------------------------------------------------
    const normalizedHeadline = applyStylebookCorrections(invertedArticle.headline).correctedText;
    const normalizedLede = applyStylebookCorrections(invertedArticle.lede).correctedText;
    const normalizedBody = applyStylebookCorrections(invertedArticle.body).correctedText;

    const styleAudit = auditKenyanStylebook(normalizedBody);
    expect(styleAudit.score).toBeGreaterThanOrEqual(70);

    // -------------------------------------------------------------------------
    // Step 7: Pre-Flight Publishing Gatekeeper Check
    // -------------------------------------------------------------------------
    const editorUser = {
      id: "managing-editor-01",
      displayName: "Managing Desk Editor",
      roles: ["managing_editor"],
    };

    const preflight = validatePreFlight({
      article: {
        headline: normalizedHeadline,
        lede: normalizedLede,
        body: normalizedBody,
        byline: "WireOps Desk",
        category: "Agriculture",
        region: "western_kenya",
        template_type: "standard_news",
        min_word_count: 100,
        sources: [
          { id: signal1.id, name: "Kakamega County", url: signal1.external_url },
          { id: signal2.id, name: "The Standard", url: signal2.external_url },
        ],
      },
      user: editorUser,
      verificationStatus: corroboration.status,
      plagiarismScore: 3.5,
      aiConsensusScore: 10.0,
      isHumanCertified: true,
    });

    expect(preflight.passed).toBe(true);
    expect(preflight.checks.zeroEmoji.passed).toBe(true);
    expect(preflight.checks.verification.passed).toBe(true);
    expect(preflight.checks.roleAuthorization.passed).toBe(true);

    // -------------------------------------------------------------------------
    // Step 8: Multi-Channel Dispatch & Cryptographic Audit Logging
    // -------------------------------------------------------------------------
    const dispatchResponse = await PublisherService.publish({
      article: {
        id: primaryCluster.id,
        headline: normalizedHeadline,
        lede: normalizedLede,
        body: normalizedBody,
        byline: "WireOps Desk",
        category: "Agriculture",
        region: "western_kenya",
        min_word_count: 100,
        sources: [
          { id: signal1.id, name: "Kakamega County", url: signal1.external_url },
          { id: signal2.id, name: "The Standard", url: signal2.external_url },
        ],
      },
      channel: "internal",
      user: editorUser,
      verificationStatus: corroboration.status,
      plagiarismScore: 3.5,
      aiConsensusScore: 10.0,
      isHumanCertified: true,
    });

    expect(dispatchResponse.success).toBe(true);
    expect(dispatchResponse.auditRecord.articleContentHash).toHaveLength(64);
    expect(dispatchResponse.auditRecord.destinationChannel).toBe("internal");
    expect(dispatchResponse.auditRecord.editorId).toBe(editorUser.id);
  });
});
