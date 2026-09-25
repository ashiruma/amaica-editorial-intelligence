/**
 * WireOps Desk: Independent Source Corroboration Engine
 * Location: src/lib/verification/corroborationEngine.ts
 *
 * Enforces the 3-Independent-Sources Rule, detects factual contradictions,
 * and compiles auditable VerificationRecords for story clusters.
 */

import {
  StoryCluster,
  StorySignal,
  VerificationRecord,
  VerificationRuleApplied,
  VerificationStatus,
  SourceCredibilityTier,
} from "@/types/intelligence";
import { SyndicateDetector } from "@/lib/clustering/syndicateDetector";
import { KenyanSourceRegistry } from "@/lib/ingestion/kenyanSourceRegistry";
import { ConfidenceScorer } from "./confidenceScore";
import { ClaimExtractor } from "./claimExtractor";

export interface CorroborationResult {
  isVerified: boolean;
  status: VerificationStatus;
  ruleApplied: VerificationRuleApplied;
  confidenceScore: number;
  independentSourceCount: number;
  discrepancies: Array<{ claim: string; conflictingSources: string[]; details: string }>;
  verificationRecord: VerificationRecord;
}

export class CorroborationEngine {
  /**
   * Main verification analysis for a story cluster
   */
  public static verifyCluster(
    cluster: StoryCluster,
    signals: StorySignal[]
  ): CorroborationResult {
    const discrepancies: Array<{ claim: string; conflictingSources: string[]; details: string }> = [];

    // 1. Identify distinct reporting source domains
    const domains = new Set<string>();
    for (const sig of signals) {
      try {
        const domain = new URL(sig.external_url).hostname.replace(/^www\./, "");
        domains.add(domain);
      } catch {
        domains.add("unknown");
      }
    }

    // 2. Filter for genuinely independent sources using SyndicateDetector
    const independentDomains = new Set<string>();
    for (const sig of signals) {
      const sigDomain = this.extractDomain(sig.external_url);
      const otherSignals = signals
        .filter((s) => s.id !== sig.id)
        .map((s) => ({
          domain: this.extractDomain(s.external_url),
          text: s.raw_text || "",
          title: s.raw_title,
        }));

      const independence = SyndicateDetector.analyzeSignalIndependence(
        sig.raw_text || sig.raw_title,
        sigDomain,
        otherSignals
      );

      if (independence.independenceScore >= 0.7) {
        independentDomains.add(sigDomain);
      }
    }

    const independentSourceCount = Math.max(1, independentDomains.size);

    // 3. Resolve source credibility tiers
    const sourceTiers: SourceCredibilityTier[] = Array.from(independentDomains).map((domain) =>
      KenyanSourceRegistry.getCredibilityTier(domain)
    );

    // 4. Check for official authorities
    const officialSources = Array.from(independentDomains).filter(
      (d) => KenyanSourceRegistry.getCredibilityTier(d) === "official_source"
    );
    const hasOfficialAuthority = officialSources.length > 0;
    const officialAuthorityName = hasOfficialAuthority ? officialSources[0] : null;

    // 5. Cross-check claims for conflicting facts across signals
    this.detectFactualDiscrepancies(signals, discrepancies);

    // 6. Check for named direct quotes or official documents
    let hasNamedQuotes = false;
    let hasOfficialDocument = hasOfficialAuthority;

    for (const sig of signals) {
      const text = `${sig.raw_title} ${sig.raw_text || ""}`;
      const claims = ClaimExtractor.extractClaims(text);
      if (claims.some((c) => c.claimType === "quotation")) {
        hasNamedQuotes = true;
      }
      if (
        text.toLowerCase().includes("gazette notice") ||
        text.toLowerCase().includes("court ruling") ||
        text.toLowerCase().includes("press release")
      ) {
        hasOfficialDocument = true;
      }
    }

    // 7. Calculate deterministic confidence score
    const confidenceBreakdown = ConfidenceScorer.calculateConfidence({
      sourceTiers,
      independentSourceCount,
      hasOfficialDocumentOrGazette: hasOfficialDocument,
      hasNamedDirectQuotes: hasNamedQuotes,
      unresolvedDiscrepancyCount: discrepancies.length,
    });

    // 8. Determine rule applied and verification status
    let ruleApplied: VerificationRuleApplied = "insufficient_evidence";
    let isVerified = false;
    let status: VerificationStatus = "unverified";

    if (discrepancies.length > 0) {
      status = "disputed";
      ruleApplied = "insufficient_evidence";
      isVerified = false;
    } else if (hasOfficialAuthority || hasOfficialDocument) {
      ruleApplied = "official_accountable_authority";
      isVerified = true;
      status = "verified";
    } else if (independentSourceCount >= 3 && confidenceBreakdown.score >= 70) {
      ruleApplied = "three_independent_sources";
      isVerified = true;
      status = "verified";
    } else if (independentSourceCount === 1) {
      status = "unverified";
      ruleApplied = "insufficient_evidence";
      isVerified = false;
    } else {
      status = "under_investigation";
      ruleApplied = "insufficient_evidence";
      isVerified = false;
    }

    const verificationRecord: VerificationRecord = {
      id: `ver-${cluster.id}`,
      cluster_id: cluster.id,
      is_verified: isVerified,
      verification_status: status,
      rule_applied: ruleApplied,
      independent_sources_count: independentSourceCount,
      confidence_score: confidenceBreakdown.score,
      verified_authority_name: officialAuthorityName,
      verified_authority_document_url: null,
      unresolved_discrepancies: discrepancies,
      verification_notes: confidenceBreakdown.explanation,
      verified_at: new Date().toISOString(),
    };

    return {
      isVerified,
      status,
      ruleApplied,
      confidenceScore: confidenceBreakdown.score,
      independentSourceCount,
      discrepancies,
      verificationRecord,
    };
  }

  /**
   * Scans signals for conflicting numerical figures or assertions
   */
  private static detectFactualDiscrepancies(
    signals: StorySignal[],
    discrepancies: Array<{ claim: string; conflictingSources: string[]; details: string }>
  ) {
    if (signals.length < 2) return;

    // Numerical figures comparison (e.g. death tolls or monetary values)
    const numbersFound: Array<{ domain: string; numbers: string[]; text: string }> = [];

    for (const sig of signals) {
      const text = `${sig.raw_title} ${sig.raw_text || ""}`;
      const numMatches = text.match(/\b\d+(?:,\d+)?\s*(?:people|fatalities|casualties|dead|shillings?|millions?)\b/gi) || [];
      if (numMatches.length > 0) {
        numbersFound.push({
          domain: this.extractDomain(sig.external_url),
          numbers: numMatches.map((n) => n.toLowerCase().trim()),
          text,
        });
      }
    }

    // If different outlets report conflicting quantities
    if (numbersFound.length >= 2) {
      const first = numbersFound[0];
      for (let i = 1; i < numbersFound.length; i++) {
        const other = numbersFound[i];
        // Check if there is a conflict in recorded key figures
        const conflict = first.numbers.some(
          (num) => other.numbers.length > 0 && !other.numbers.includes(num)
        );
        if (conflict && first.domain !== other.domain) {
          discrepancies.push({
            claim: "Key numerical metric contradiction",
            conflictingSources: [first.domain, other.domain],
            details: `'${first.domain}' reports [${first.numbers.join(", ")}] while '${other.domain}' reports [${other.numbers.join(", ")}].`,
          });
          break;
        }
      }
    }
  }

  private static extractDomain(urlStr: string): string {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, "");
    } catch {
      return "unknown";
    }
  }
}
