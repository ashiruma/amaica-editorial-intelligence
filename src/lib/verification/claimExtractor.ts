/**
 * WireOps Desk: Falsifiable Claim Extraction Engine
 * Location: src/lib/verification/claimExtractor.ts
 *
 * Extracts testable factual claims, financial figures, official statements,
 * quotations, and legal allegations from news text, categorizing risk severity.
 */

import { ClaimType } from "@/types/intelligence";

export type ClaimSeverity = "routine" | "sensitive" | "high_risk";

export interface ExtractedClaim {
  id: string;
  text: string;
  claimType: ClaimType;
  severity: ClaimSeverity;
  speakerOrSubject?: string;
  numericalEvidence?: string;
  requiresOfficialCorroboration: boolean;
}

export class ClaimExtractor {
  // Regex patterns for high-risk legal and crime actions
  private static readonly HIGH_RISK_PATTERNS = [
    /\b(?:arrested|apprehended|detained|taken into custody)\b/i,
    /\b(?:charged with|pleaded not guilty|indicted|arraigned in court)\b/i,
    /\b(?:embezzled|misappropriated|looted|fraud|bribe|extortion|graft)\b/i,
    /\b(?:killed|shot dead|fatalities|death toll|succumbed|murdered)\b/i,
    /\b(?:eacc investigation|dci probe|forensic audit|sacked for corruption)\b/i,
  ];

  // Regex patterns for sensitive claims (budgets, contracts, official policy changes)
  private static readonly SENSITIVE_PATTERNS = [
    /\b(?:allocated|budgeted|expenditure|tender awarded|contract signed)\b/i,
    /\b(?:impeachment|ousted|cabinet reshuffle|interdicted|suspended from office)\b/i,
    /\b(?:ban announced|directive issued|gazetted notice|revoked licence)\b/i,
  ];

  // Numerical figures (KSh currency, kilometres, metric units)
  private static readonly NUMERICAL_PATTERNS = [
    /\b(?:ksh|kes|shillings?)\s*[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|trillion))?\b/i,
    /\b[\d,]+(?:\.\d+)?\s*(?:million|billion|trillion)\s*shillings?\b/i,
    /\b\d+(?:,\d+)?\s*(?:kilometres?|km|tonnes?|acres?|people|passengers?|vehicles?)\b/i,
    /\b\d{1,3}%\b/,
  ];

  // Direct quotation patterns
  private static readonly QUOTE_PATTERNS = [
    /["“]([^"”]{10,250})["”]\s*(?:said|stated|remarked|noted|declared|emphasized|warned|explained)\s+([^,.\n]+)/i,
    /([^,.\n]+)\s+(?:said|stated|remarked|noted|declared|emphasized|warned|explained)\s*:\s*["“]([^"”]{10,250})["”]/i,
  ];

  /**
   * Main claim extraction method
   */
  public static extractClaims(text: string): ExtractedClaim[] {
    if (!text || typeof text !== "string") return [];

    const claims: ExtractedClaim[] = [];
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);

    let claimIdx = 0;

    // 1. Extract direct quotes first
    for (const qPattern of this.QUOTE_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(qPattern.source, "gi");
      while ((match = regex.exec(text)) !== null) {
        claimIdx++;
        const quoteText = match[1] && match[1].length > 10 ? match[1] : match[2];
        const speaker = match[1] && match[1].length > 10 ? match[2] : match[1];

        claims.push({
          id: `claim-q-${claimIdx}`,
          text: `"${quoteText.trim()}"`,
          claimType: "quotation",
          severity: this.evaluateSeverity(quoteText),
          speakerOrSubject: speaker?.trim(),
          requiresOfficialCorroboration: false,
        });
      }
    }

    // 2. Extract sentence-level factual and legal claims
    for (const sentence of sentences) {
      // Skip if this sentence is purely a quote we already parsed
      if (claims.some((c) => c.text.includes(sentence) || sentence.includes(c.text.replace(/["”]/g, "")))) {
        continue;
      }

      const severity = this.evaluateSeverity(sentence);
      const numericalMatch = this.findNumericalEvidence(sentence);

      // Determine claim type
      let claimType: ClaimType = "fact";
      if (severity === "high_risk") {
        claimType = sentence.toLowerCase().includes("alleged") || sentence.toLowerCase().includes("claimed")
          ? "allegation"
          : "fact";
      } else if (sentence.toLowerCase().includes("according to") || sentence.toLowerCase().includes("reported")) {
        claimType = "attributed_claim";
      }

      // Check if sentence makes a substantive assertion (contains figures, legal actions, or key policy)
      const isSubstantive =
        severity !== "routine" ||
        numericalMatch !== undefined ||
        sentence.length > 40;

      if (isSubstantive) {
        claimIdx++;
        claims.push({
          id: `claim-s-${claimIdx}`,
          text: sentence,
          claimType,
          severity,
          numericalEvidence: numericalMatch,
          requiresOfficialCorroboration: severity === "high_risk",
        });
      }
    }

    return claims;
  }

  /**
   * Evaluates severity of a claim based on high-risk and sensitive lexicons
   */
  public static evaluateSeverity(text: string): ClaimSeverity {
    for (const pattern of this.HIGH_RISK_PATTERNS) {
      if (pattern.test(text)) return "high_risk";
    }
    for (const pattern of this.SENSITIVE_PATTERNS) {
      if (pattern.test(text)) return "sensitive";
    }
    return "routine";
  }

  private static findNumericalEvidence(text: string): string | undefined {
    for (const pattern of this.NUMERICAL_PATTERNS) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return undefined;
  }
}
