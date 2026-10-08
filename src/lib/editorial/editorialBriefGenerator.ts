/**
 * WireOps Desk / Amaica Media
 * Structured Editorial Brief Generator
 * Location: src/lib/editorial/editorialBriefGenerator.ts
 *
 * Operational Standard: Strict Zero-Emoji Workplace Standard
 *
 * Mandate:
 * - Never represent AI inference as confirmed fact.
 * - Clearly separate: CONFIRMED, REPORTED, UNCONFIRMED, ANALYSIS, EDITORIAL QUESTION.
 * - Highlight verification gaps and recommended reporting angles tailored for Amaica Media.
 */

import {
  StoryCluster,
  StorySignal,
  EditorialBrief,
  StoryComparisonDossier,
} from "@/types/intelligence";
import { StoryComparisonEngine } from "@/lib/verification/storyComparisonEngine";
import { KenyanEntityExtractor } from "@/lib/clustering/entityExtractor";

export class EditorialBriefGenerator {
  /**
   * Generates a structured newsroom editorial briefing for any developing cluster.
   */
  public static generateBrief(
    cluster: StoryCluster,
    signals: StorySignal[]
  ): EditorialBrief {
    const comparison: StoryComparisonDossier = StoryComparisonEngine.compareSources(cluster, signals);
    const combinedText = [
      cluster.working_headline,
      ...(signals.map((s) => `${s.raw_title} ${s.raw_text || s.excerpt || ""}`)),
    ].join(" ");

    // Extract entities
    const entityResult = KenyanEntityExtractor.extractEntities(combinedText);
    const whoInvolved = entityResult.entities.slice(0, 6).map((e) => e.canonicalName);

    // Location & Timing
    const whereLocation = cluster.primary_location || cluster.county || "Western Kenya";
    const whenTime = cluster.first_detected_at
      ? new Date(cluster.first_detected_at).toLocaleDateString("en-KE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Developing";

    // Confirmed facts (corroborated by 2+ independent sources)
    const confirmedFacts: string[] = comparison.agreements.map((a) =>
      `[CONFIRMED] ${a.claimText} (Corroborated by: ${a.supportingSources.join(", ")})`
    );

    if (confirmedFacts.length === 0) {
      confirmedFacts.push(
        `[CONFIRMED] Core event reported in ${whereLocation} based on initial dispatch.`
      );
    }

    // Reported claims (single source or attributed claims)
    const reportedClaims: string[] = comparison.unconfirmed.slice(0, 5).map((u) =>
      `[REPORTED] ${u.claimText} (Reported by: ${u.sourceName})`
    );

    // Conflicting claims
    const conflictingClaims: string[] = comparison.conflicts.map((c) =>
      `[CONFLICT] ${c.topic}: ${c.editorialRecommendation}`
    );

    // Official statements
    const officialStatements: string[] = [];
    for (const src of comparison.sources) {
      if (src.tier === "TIER_1_OFFICIAL") {
        officialStatements.push(`[OFFICIAL STATEMENT] ${src.sourceName}: ${src.summary}`);
      }
    }
    if (officialStatements.length === 0) {
      officialStatements.push("[UNCONFIRMED] No official government, police, or judicial statement released yet.");
    }

    // Background & Context
    const backgroundContext: string[] = [
      `Geographic Jurisdiction: ${cluster.county || "Kakamega County"} with regional impact across Western Kenya.`,
      `Story Lifecycle Status: ${cluster.status} with an editorial momentum score of ${cluster.momentum_score}%.`,
      `Total Sources Monitored: ${comparison.sources.length} outlets covering the development.`,
    ];

    // Why it matters & Amaica relevance
    const whyItMatters = `Directly touches public interest and institutional accountability in ${whereLocation}. Public deserves verified, sober reporting without sensationalism.`;
    const amaicaRelevance = `Primary regional coverage priority for Amaica Media's Western Kenya audience, aligning with the Amaica Radio corridor reporting standards.`;

    // Recommended reporting angles
    const recommendedAngles = [
      `Factual lead focusing strictly on verified ground impacts in ${whereLocation}.`,
      `Examine accountability and public response from local leaders and county administration.`,
      `Investigate long-term structural or community remedies without sensationalizing.`,
    ];

    // Verification gaps & questions for editor
    const verificationGaps: string[] = comparison.unknown.map((u) =>
      `[VERIFICATION GAP] ${u.aspect}: ${u.reason}`
    );

    const investigativeQuestions: string[] = [
      `Has an on-the-ground official incident report or charge sheet been reviewed?`,
      `Have all directly affected or named parties been offered an explicit Right of Reply?`,
      `Are there conflicting numerical or casualty claims that require hedged reporting?`,
    ];

    return {
      id: `brief-${cluster.id}`,
      clusterId: cluster.id,
      whatHappened: cluster.working_headline,
      whereLocation,
      whenTime,
      whoInvolved,
      confirmedFacts,
      reportedClaims,
      unconfirmedElements: comparison.unconfirmed.slice(0, 4).map((u) => u.claimText),
      conflictingClaims,
      officialStatements,
      backgroundContext,
      whyItMatters,
      amaicaRelevance,
      recommendedAngles,
      verificationGaps,
      investigativeQuestions,
      generatedAt: new Date().toISOString(),
    };
  }
}
