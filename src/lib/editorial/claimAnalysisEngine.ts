/**
 * Amaica Media Editorial Intelligence Platform
 * Fact and Claim Analysis Service
 *
 * Extracts and classifies claims (Factual Claim, Opinion, Prediction, Allegation, Quotation)
 * and assesses verification status (Source provided, Needs verification, Potentially unsupported).
 */

import type { ClaimItem, ClaimType, ClaimVerificationStatus } from "@/types/editorialIntelligence";
import { splitSentences } from "./aiPatternEngine";

const OPINION_MARKERS = [
  /\b(?:in my opinion|i believe|arguably|perhaps|undoubtedly|best ever|greatest of all time|disappointing|masterpiece|remarkable|stunning)\b/i,
];

const PREDICTION_MARKERS = [
  /\b(?:will|is expected to|plans to|projected to|anticipated to|aims to|poised to|could possibly|in the coming years)\b/i,
];

const ALLEGATION_MARKERS = [
  /\b(?:alleged|allegedly|accused of|claimed that|purportedly|suspected of|rumored to|unconfirmed reports)\b/i,
];

const ATTRIBUTION_VERBS = [
  /\b(?:said|told|confirmed|stated|explained|announced|noted|warned|reported)\s+([^,.]+)/i,
  /([^,.]+)\s+(?:said|told|confirmed|stated|explained|announced|noted|warned|reported)\b/i,
];

/**
 * Extracts and classifies journalistic claims across text.
 */
export function extractAndClassifyClaims(text: string): ClaimItem[] {
  if (!text) return [];
  const sentences = splitSentences(text);
  const claims: ClaimItem[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].trim();
    if (s.length < 15) continue;

    let claimType: ClaimType = "factual_claim";
    let status: ClaimVerificationStatus = "needs_verification";
    let attributedTo: string | undefined;
    let isProtectedFact = false;
    let notes = "Factual reporting statement.";

    // 1. Direct quotation check
    if (/^["'“‘]/.test(s) || /"[^"]{6,}"/i.test(s)) {
      claimType = "quotation";
      status = "source_provided";
      isProtectedFact = true;
      notes = "Verbatim direct quotation.";
      const attrMatch = s.match(/(?:said|told|stated|confirmed)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      if (attrMatch) attributedTo = attrMatch[1];
    }
    // 2. Allegation check
    else if (ALLEGATION_MARKERS.some((re) => re.test(s))) {
      claimType = "allegation";
      status = "needs_verification";
      notes = "Unverified claim or allegation requiring explicit secondary confirmation.";
    }
    // 3. Prediction check
    else if (PREDICTION_MARKERS.some((re) => re.test(s))) {
      claimType = "prediction";
      status = "needs_verification";
      notes = "Forward-looking projection or anticipated event.";
    }
    // 4. Opinion check
    else if (OPINION_MARKERS.some((re) => re.test(s))) {
      claimType = "opinion";
      status = "needs_verification";
      notes = "Subjective evaluation or commentator perspective.";
    }
    // 5. Standard factual claim check
    else {
      claimType = "factual_claim";
      isProtectedFact = /\b\d{4}\b|\b(?:Ksh|KES|\$)\b|\b\d+\s+(?:people|attendees|students|acts)\b/i.test(s);

      // Check attribution
      let hasNamedSource = false;
      for (const re of ATTRIBUTION_VERBS) {
        const m = s.match(re);
        if (m && m[1] && m[1].length > 2 && !/^(that|it|which|there)$/i.test(m[1].trim())) {
          hasNamedSource = true;
          attributedTo = m[1].trim();
          break;
        }
      }

      if (hasNamedSource) {
        status = "source_provided";
        notes = `Attributed to ${attributedTo}.`;
      } else if (/\b(?:sources say|reports indicate|word is)\b/i.test(s)) {
        status = "potentially_unsupported";
        notes = "Anonymous or vague attribution; lacks identified verifiable source.";
      } else {
        status = "needs_verification";
        notes = "Assertion presented as factual without explicit in-sentence citation.";
      }
    }

    claims.push({
      id: `claim-${i + 1}`,
      claimText: s,
      claimType,
      verificationStatus: status,
      attributedTo,
      isProtectedFact,
      notes,
    });
  }

  return claims;
}
