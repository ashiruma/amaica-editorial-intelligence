/**
 * WireOps Desk: Research Dossier & Evidence Packet Builder
 * Location: src/lib/verification/researchPacketBuilder.ts
 *
 * Compiles a structured, locked ResearchPacket from a StoryCluster,
 * its signals, extracted claims, and verification records before drafting begins.
 */

import {
  ResearchPacket,
  StoryCluster,
  StorySignal,
  EntityProfile,
  TimelineEvent,
  ConfirmedFact,
} from "@/types/intelligence";
import { KenyanEntityExtractor } from "@/lib/clustering/entityExtractor";
import { ClaimExtractor } from "./claimExtractor";

export class ResearchPacketBuilder {
  private static readonly STATUTORY_PATTERNS = [
    /\b(?:Constitution of Kenya(?:,?\s*2010)?)\b/i,
    /\b(?:County Governments Act(?:,?\s*2012)?)\b/i,
    /\b(?:National Transport and Safety Authority Act|NTSA Act)\b/i,
    /\b(?:Public Procurement and Asset Disposal Act)\b/i,
    /\b(?:Penal Code(?:,?\s*Cap\s*63)?)\b/i,
    /\b(?:Ethics and Anti-Corruption Commission Act)\b/i,
    /\b(?:Traffic Act(?:,?\s*Cap\s*403)?)\b/i,
  ];

  /**
   * Assembles a structured ResearchPacket for an editorial cluster
   */
  public static buildPacket(
    cluster: StoryCluster,
    signals: StorySignal[]
  ): ResearchPacket {
    const combinedText = [
      cluster.working_headline,
      ...signals.map((s) => `${s.raw_title} ${s.raw_text || ""}`),
    ].join("\n\n");

    // 1. Key Entities
    const entityResult = KenyanEntityExtractor.extractEntities(combinedText);
    const keyEntities: EntityProfile[] = entityResult.entities.map((e) => ({
      name: e.canonicalName,
      role: e.category === "person" ? "Public Figure" : e.category === "institution" ? "State Institution" : "Location",
      organization: e.category === "institution" ? e.canonicalName : undefined,
      isOfficialAuthority: e.category === "institution" || e.canonicalName.includes("Governor"),
      mentionCount: e.relevanceWeight,
    }));

    // 2. Chronological Timeline
    const timeline: TimelineEvent[] = signals
      .map((s) => ({
        timestamp: s.published_at || s.detected_at,
        eventDescription: s.raw_title,
        sourceUrl: s.external_url,
        sourceDomain: this.extractDomain(s.external_url),
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // 3. Claims & Quotes Extraction
    const allClaims = ClaimExtractor.extractClaims(combinedText);

    // Direct quotes
    const directQuotes: Array<{ quote: string; speaker: string; sourceDomain: string }> = [];
    for (const c of allClaims) {
      if (c.claimType === "quotation" && c.speakerOrSubject) {
        directQuotes.push({
          quote: c.text,
          speaker: c.speakerOrSubject,
          sourceDomain: signals[0] ? this.extractDomain(signals[0].external_url) : "wireops",
        });
      }
    }

    // Confirmed Facts vs Unverified Claims
    const confirmedFacts: ConfirmedFact[] = [];
    const unverifiedClaims: string[] = [];

    for (const c of allClaims) {
      if (c.claimType === "quotation") continue;

      // Check how many signals mention this claim's keywords
      const claimKeywords = c.text.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      let mentioningSignalsCount = 0;

      for (const sig of signals) {
        const sigText = `${sig.raw_title} ${sig.raw_text || ""}`.toLowerCase();
        const matches = claimKeywords.filter((kw) => sigText.includes(kw));
        if (matches.length >= 2) {
          mentioningSignalsCount++;
        }
      }

      if (mentioningSignalsCount >= 2 || !c.requiresOfficialCorroboration) {
        confirmedFacts.push({
          fact: c.text,
          corroboratingSources: signals.slice(0, mentioningSignalsCount).map((s) => this.extractDomain(s.external_url)),
          confidence: mentioningSignalsCount >= 3 ? 0.95 : 0.80,
        });
      } else {
        unverifiedClaims.push(c.text);
      }
    }

    // 4. Statutory & Regulatory Citations
    const statutoryCitations: string[] = [];
    for (const pattern of this.STATUTORY_PATTERNS) {
      const match = combinedText.match(pattern);
      if (match && !statutoryCitations.includes(match[0])) {
        statutoryCitations.push(match[0]);
      }
    }

    const now = new Date().toISOString();

    return {
      id: `rp-${cluster.id}`,
      cluster_id: cluster.id,
      key_entities: keyEntities,
      timeline,
      confirmed_facts: confirmedFacts,
      unverified_claims: unverifiedClaims,
      direct_quotes: directQuotes,
      statutory_citations: statutoryCitations,
      assembled_by_agent: "research_dossier_assembler_v1",
      created_at: now,
      updated_at: now,
    };
  }

  private static extractDomain(urlStr: string): string {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, "");
    } catch {
      return "unknown";
    }
  }
}
