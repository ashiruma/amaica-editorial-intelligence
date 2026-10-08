/**
 * WireOps Desk / Amaica Media
 * Multi-Source Story Comparison & Conflict Detection Engine
 * Location: src/lib/verification/storyComparisonEngine.ts
 *
 * Operational Standard: Strict Zero-Emoji Workplace Standard
 *
 * Compiles comprehensive StoryComparisonDossier:
 * - SOURCE A, B, C, OFFICIAL SOURCE: what each reports
 * - AGREEMENTS: claims supported by multiple independent sources
 * - CONFLICTS: claims that differ (e.g. casualty counts, financial figures, dates)
 * - UNCONFIRMED: single-source claims needing corroboration
 * - UNKNOWN: critical gaps that cannot currently be established
 *
 * MANDATE: The system must NEVER silently resolve contradictory facts.
 */

import {
  StoryCluster,
  StorySignal,
  StoryComparisonDossier,
  ConflictingClaimGroup,
  ConflictingClaimVariant,
  EditorialSourceTier,
} from "@/types/intelligence";
import { KenyanSourceRegistry } from "@/lib/ingestion/kenyanSourceRegistry";
import { ClaimExtractor } from "./claimExtractor";

export class StoryComparisonEngine {
  /**
   * Builds an in-depth multi-source comparison report for any story cluster.
   */
  public static compareSources(
    cluster: StoryCluster,
    signals: StorySignal[]
  ): StoryComparisonDossier {
    const clusterSignals = signals && signals.length > 0 ? signals : cluster.signals || [];

    // 1. Map individual reporting sources
    const sources = clusterSignals.map((sig) => {
      const domain = this.extractDomain(sig.external_url);
      const tier: EditorialSourceTier = KenyanSourceRegistry.getEditorialTier(domain);
      const cleanSummary = (sig.excerpt || sig.raw_text || sig.raw_title)
        .slice(0, 300)
        .replace(/\s+/g, " ")
        .trim();

      return {
        sourceName: sig.source?.name || domain,
        sourceDomain: domain,
        tier,
        reportedAt: sig.published_at || sig.detected_at,
        headline: sig.raw_title,
        summary: cleanSummary,
      };
    });

    // 2. Extract claims from each signal with source attribution
    const claimsBySource: Array<{
      sourceName: string;
      sourceDomain: string;
      tier: EditorialSourceTier;
      claims: string[];
      numbers: string[];
    }> = [];

    for (const sig of clusterSignals) {
      const domain = this.extractDomain(sig.external_url);
      const tier = KenyanSourceRegistry.getEditorialTier(domain);
      const fullText = `${sig.raw_title}. ${sig.raw_text || sig.excerpt || ""}`;
      const extracted = ClaimExtractor.extractClaims(fullText);

      // Extract raw numbers/metrics
      const numMatches = fullText.match(/\b\d+(?:,\d+)?(?:\.\d+)?\s*(?:people\s+injured|people\s+dead|people|fatalities|casualties|dead|injured|shillings?|ksh|kes|millions?|billions?|per cent|%)\b/gi) || [];

      claimsBySource.push({
        sourceName: sig.source?.name || domain,
        sourceDomain: domain,
        tier,
        claims: extracted.map((c) => c.text),
        numbers: Array.from(new Set(numMatches.map((n) => n.toLowerCase().trim()))),
      });
    }

    // 3. Detect Agreements (claims shared across independent sources)
    const agreements: Array<{ claimText: string; supportingSources: string[] }> = [];
    const claimCoverage = new Map<string, Set<string>>();

    for (const item of claimsBySource) {
      for (const claim of item.claims) {
        const norm = this.normalizeClaim(claim);
        if (norm.length < 20) continue;

        let matchedKey: string | null = null;
        for (const existingKey of claimCoverage.keys()) {
          if (this.calculateOverlap(norm, existingKey) > 0.65) {
            matchedKey = existingKey;
            break;
          }
        }

        if (matchedKey) {
          claimCoverage.get(matchedKey)!.add(item.sourceName);
        } else {
          claimCoverage.set(norm, new Set([item.sourceName]));
        }
      }
    }

    for (const [claimText, sourceSet] of claimCoverage.entries()) {
      if (sourceSet.size >= 2) {
        agreements.push({
          claimText: this.capitalize(claimText),
          supportingSources: Array.from(sourceSet),
        });
      }
    }

    // 4. Detect Conflicts (numerical metrics or incompatible claims)
    const conflicts: ConflictingClaimGroup[] = [];

    // Numerical contradictions
    if (claimsBySource.length >= 2) {
      const metricGroups = new Map<string, Array<{ sourceName: string; tier: EditorialSourceTier; metric: string }>>();

      for (const item of claimsBySource) {
        for (const num of item.numbers) {
          // Key by unit or metric category (e.g. injured vs dead vs shillings)
          const unit = num.replace(/^[\d,.]+\s*/, "").trim();
          if (!metricGroups.has(unit)) {
            metricGroups.set(unit, []);
          }
          metricGroups.get(unit)!.push({
            sourceName: item.sourceName,
            tier: item.tier,
            metric: num,
          });
        }
      }

      for (const [unit, entries] of metricGroups.entries()) {
        const distinctValues = Array.from(new Set(entries.map((e) => e.metric)));
        if (distinctValues.length > 1) {
          const variants: ConflictingClaimVariant[] = entries.map((e) => ({
            sourceName: e.sourceName,
            sourceTier: e.tier,
            claimText: `Reports ${e.metric}`,
            figureOrDate: e.metric,
          }));

          const hasOfficial = entries.some((e) => e.tier === "TIER_1_OFFICIAL");
          let rec = `Varying figures reported (${distinctValues.join(" vs ")}). Do not state one figure as established fact.`;
          if (hasOfficial) {
            rec += ` Attribute the official authority count explicitly while noting discrepancies in independent media reports.`;
          } else {
            rec += ` Attribute each figure to its respective outlet (e.g. 'Reports on ${unit} varied, with...').`;
          }

          conflicts.push({
            topic: `Discrepancy in ${unit} count`,
            variants,
            editorialRecommendation: rec,
          });
        }
      }
    }

    // 5. Unconfirmed Single-Source Claims
    const unconfirmed: Array<{ claimText: string; sourceName: string }> = [];
    for (const [claimText, sourceSet] of claimCoverage.entries()) {
      if (sourceSet.size === 1) {
        unconfirmed.push({
          claimText: this.capitalize(claimText),
          sourceName: Array.from(sourceSet)[0],
        });
      }
    }

    // 6. Unknown / Missing Information Gaps
    const unknown: Array<{ aspect: string; reason: string }> = [];
    const fullText = clusterSignals.map((s) => `${s.raw_title} ${s.raw_text || ""}`).join(" ").toLowerCase();

    if (!fullText.includes("police") && !fullText.includes("official") && !fullText.includes("statement") && !fullText.includes("spokesperson")) {
      unknown.push({
        aspect: "Official Authority Statement",
        reason: "No official police, county government, or institutional confirmation recorded yet.",
      });
    }

    if (!fullText.includes("cause") && (fullText.includes("fire") || fullText.includes("crash") || fullText.includes("accident") || fullText.includes("collapsed"))) {
      unknown.push({
        aspect: "Root Cause of Incident",
        reason: "Reports confirm incident occurred but root cause remains under ongoing investigation.",
      });
    }

    if (!fullText.includes("comment") && !fullText.includes("respond") && (fullText.includes("accused") || fullText.includes("alleged") || fullText.includes("probe"))) {
      unknown.push({
        aspect: "Subject Right of Reply",
        reason: "Accused or mentioned parties have not yet issued a verified response.",
      });
    }

    return {
      clusterId: cluster.id,
      workingHeadline: cluster.working_headline,
      sources,
      agreements,
      conflicts,
      unconfirmed: unconfirmed.slice(0, 8),
      unknown,
    };
  }

  private static extractDomain(urlStr: string): string {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, "");
    } catch {
      return "wire-feed";
    }
  }

  private static normalizeClaim(claim: string): string {
    return claim
      .toLowerCase()
      .replace(/["'”’.,!?]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private static calculateOverlap(a: string, b: string): number {
    const setA = new Set(a.split(" ").filter((w) => w.length > 3));
    const setB = new Set(b.split(" ").filter((w) => w.length > 3));
    if (setA.size === 0 || setB.size === 0) return 0;

    let match = 0;
    for (const w of setA) {
      if (setB.has(w)) match++;
    }
    return match / Math.max(setA.size, setB.size);
  }

  private static capitalize(s: string): string {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
