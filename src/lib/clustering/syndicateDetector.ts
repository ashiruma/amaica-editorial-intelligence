/**
 * WireOps Desk: Syndicate & Cross-Outlet Copycat Detector
 * Location: src/lib/clustering/syndicateDetector.ts
 *
 * Enforces the core journalistic distinction:
 * POPULARITY != VERIFICATION
 * VIRAL != TRUE
 * COPIED != INDEPENDENT
 *
 * Detects circular reporting, press release syndication, and aggregator copycats
 * to ensure that three aggregators copying the same blog post count as exactly
 * ONE source.
 */

export interface SyndicateAnalysisResult {
  isSyndicatedCopy: boolean;
  copiedSourceDomain?: string;
  independenceScore: number; // 1.0 = completely independent, 0.0 = verbatim copycat
  matchedSentencesCount: number;
  reason: string;
}

export class SyndicateDetector {
  private static readonly SECONDARY_ATTRIBUTION_PATTERNS = [
    /according to (?:reports by|an article by|a report on)\s+([a-z0-9.-]+)/i,
    /(?:as )?reported by\s+([a-z0-9.-]+)/i,
    /as revealed by\s+([a-z0-9.-]+)/i,
    /in an exclusive by\s+([a-z0-9.-]+)/i,
    /speaking to\s+([a-z0-9.-]+)/i,
    /quoted by\s+([a-z0-9.-]+)/i,
    /first reported on\s+([a-z0-9.-]+)/i,
  ];

  /**
   * Compares a candidate story signal against an established cluster of signals
   * to determine if it is an independent report or merely a copycat/syndication.
   */
  public static analyzeSignalIndependence(
    candidateText: string,
    candidateDomain: string,
    existingSignals: Array<{ domain: string; text: string; title: string }>
  ): SyndicateAnalysisResult {
    if (!candidateText || candidateText.trim().length === 0) {
      return {
        isSyndicatedCopy: false,
        independenceScore: 1.0,
        matchedSentencesCount: 0,
        reason: "Insufficient text for syndicate comparison.",
      };
    }

    const candidateLower = candidateText.toLowerCase();

    // 1. Check for explicit secondary attribution in text
    for (const pattern of this.SECONDARY_ATTRIBUTION_PATTERNS) {
      const match = candidateLower.match(pattern);
      if (match && match[1]) {
        const citedOutlet = match[1].toLowerCase().replace(/^www\./, "");
        // Check if the cited outlet is one of the existing signals or a known media domain
        const matchedExisting = existingSignals.find(
          (s) => s.domain.toLowerCase().includes(citedOutlet) || citedOutlet.includes(s.domain.toLowerCase())
        );

        if (matchedExisting) {
          return {
            isSyndicatedCopy: true,
            copiedSourceDomain: matchedExisting.domain,
            independenceScore: 0.1,
            matchedSentencesCount: 0,
            reason: `Explicit secondary citation: Story cites '${matchedExisting.domain}' as the source of facts.`,
          };
        }
      }
    }

    // 2. Sentence-level verbatim overlap analysis
    const candidateSentences = this.splitIntoSentences(candidateText);
    if (candidateSentences.length === 0) {
      return {
        isSyndicatedCopy: false,
        independenceScore: 1.0,
        matchedSentencesCount: 0,
        reason: "No measurable sentences found.",
      };
    }

    let highestOverlapDomain: string | undefined;
    let maxMatchedSentences = 0;

    for (const existing of existingSignals) {
      if (existing.domain.toLowerCase() === candidateDomain.toLowerCase()) continue;
      if (!existing.text || existing.text.trim().length === 0) continue;

      const existingLower = existing.text.toLowerCase();
      let matches = 0;

      for (const sentence of candidateSentences) {
        // Only inspect substantial sentences (> 30 characters)
        if (sentence.length < 30) continue;
        if (existingLower.includes(sentence.toLowerCase())) {
          matches++;
        }
      }

      if (matches > maxMatchedSentences) {
        maxMatchedSentences = matches;
        highestOverlapDomain = existing.domain;
      }
    }

    const overlapRatio = maxMatchedSentences / Math.max(1, candidateSentences.length);

    // Overlap thresholds
    if (overlapRatio >= 0.5 || maxMatchedSentences >= 4) {
      return {
        isSyndicatedCopy: true,
        copiedSourceDomain: highestOverlapDomain,
        independenceScore: Math.max(0.0, Math.round((1 - overlapRatio) * 100) / 100),
        matchedSentencesCount: maxMatchedSentences,
        reason: `Verbatim overlap: ${maxMatchedSentences} sentences (${Math.round(overlapRatio * 100)}%) copied from '${highestOverlapDomain}'.`,
      };
    }

    if (overlapRatio >= 0.25 || maxMatchedSentences >= 2) {
      return {
        isSyndicatedCopy: true,
        copiedSourceDomain: highestOverlapDomain,
        independenceScore: 0.4,
        matchedSentencesCount: maxMatchedSentences,
        reason: `Partial syndication: Substantial shared passages with '${highestOverlapDomain}'.`,
      };
    }

    return {
      isSyndicatedCopy: false,
      independenceScore: 1.0,
      matchedSentencesCount: 0,
      reason: "Independent reporting: Original sentence structures and quotes.",
    };
  }

  /**
   * Helper to clean and split text into normalized sentences
   */
  private static splitIntoSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);
  }
}
