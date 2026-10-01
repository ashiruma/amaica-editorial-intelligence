/**
 * Amaica Media / WireOps Desk
 * Anti-Hallucination Beat Consistency & Grounding Guard
 *
 * Deterministically audits generated or repurposed news drafts for:
 * 1. Thematic drift between lede and body/concluding paragraphs
 *    (e.g., George Ruto's Nganya transit story drifting into a music concert).
 * 2. Uncorroborated event/entity injection absent from primary evidence dossiers.
 * 3. Automatic repair and restoration of on-beat journalistic depth.
 *
 * Strictly adheres to Zero-Emoji Workplace Standard.
 */

import { StoryBeat, detectStoryBeat, extractSubjectFromTitle } from "@/lib/editorial/beatClassification";
import { generateContextualExpansionParagraphs } from "@/lib/editorial/contextualExpansions";
import { ResearchPacket } from "@/lib/verification/researchPacketBuilder";
import { stripEmojis } from "@/lib/articleValidation";

export interface BeatDriftViolation {
  paragraphIndex: number;
  detectedBeat: StoryBeat;
  expectedBeat: StoryBeat;
  sampleSnippet: string;
  reason: string;
}

export interface HallucinationAuditReport {
  passed: boolean;
  primaryBeat: StoryBeat;
  conclusionBeat: StoryBeat;
  driftViolations: BeatDriftViolation[];
  ungroundedClaims: string[];
  errors: string[];
  warnings: string[];
  cleanHeadline: string;
  cleanLede: string;
  repairedBody?: string;
  wasRepaired: boolean;
}

// Incompatible beat transitions that constitute confirmed hallucinations unless
// explicit primary facts corroborate the crossover.
const INCOMPATIBLE_BEAT_MAP: Partial<Record<StoryBeat, StoryBeat[]>> = {
  matatu_transport: ["music", "event", "comedy", "film"],
  tragedy_rescue: ["event", "comedy", "music", "film", "business_wealth"],
  crime_legal: ["event", "comedy", "music", "film"],
  politics_governance: ["music", "comedy", "film"],
  relationship: ["matatu_transport", "tragedy_rescue"],
};

// Explicit keywords that signal music concerts, festivals, or entertainment events
const CONCERT_EVENT_REGEX = /\b(music\s+concert|stadium\s+concert|live\s+concert|headline\s+show|tour\s+dates|tickets?\s+on\s+sale|gate\s+charges|music\s+festival|album\s+launch|recording\s+studio|hit\s+single|benga\s+night|gengetone\s+festival)\b/i;

// Explicit keywords for transit, nganyas, and matatus
const MATATU_TRANSIT_REGEX = /\b(nganya|nganyas|matatu|matatus|route\s+\d+|sacco|manamba|conductors?|ntsa|transit|fleet|super\s+metro|george\s+ruto)\b/i;

/**
 * Splits body text into clean paragraph strings.
 */
function extractBodyParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);
}

/**
 * Detects whether a paragraph introduces hallucinated concert or entertainment content
 * into an urban transit / matatu news article.
 */
export function isTransitToConcertHallucination(
  primaryBeat: StoryBeat,
  paragraphText: string,
  packet?: ResearchPacket
): boolean {
  if (primaryBeat !== "matatu_transport") {
    return false;
  }

  // If the paragraph explicitly talks about music concerts, album launches, or stadium gigs
  if (CONCERT_EVENT_REGEX.test(paragraphText)) {
    // Check if the primary evidence packet actually mentions concerts or music events
    if (packet) {
      const facts = ((packet as any).confirmed_facts || (packet as any).confirmedFacts || []).map((f: any) => typeof f === "string" ? f : f.fact || "");
      const claims = ((packet as any).claims || (packet as any).unverified_claims || []).map((c: any) => typeof c === "string" ? c : c.claimText || c.text || "");
      const packetText = [...facts, ...claims].join(" ");
      if (CONCERT_EVENT_REGEX.test(packetText)) {
        // Legitimate crossover corroborated by primary sources
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Audits an article for thematic drift and hallucinations across all paragraphs.
 */
export function auditArticleHallucinations(
  article: {
    headline: string;
    lede: string;
    body: string;
    category?: string | null;
  },
  packet?: ResearchPacket
): HallucinationAuditReport {
  const headline = stripEmojis(article.headline || "");
  const lede = stripEmojis(article.lede || "");
  const body = stripEmojis(article.body || "");

  const primaryBeat = detectStoryBeat(headline, lede, article.category);
  const paragraphs = extractBodyParagraphs(body);
  const driftViolations: BeatDriftViolation[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const ungroundedClaims: string[] = [];

  const incompatibleList = INCOMPATIBLE_BEAT_MAP[primaryBeat] || [];

  paragraphs.forEach((p, index) => {
    // 1. Direct George Ruto / Matatu -> Concert Hallucination check
    if (isTransitToConcertHallucination(primaryBeat, p, packet)) {
      const violation: BeatDriftViolation = {
        paragraphIndex: index,
        detectedBeat: "event",
        expectedBeat: primaryBeat,
        sampleSnippet: p.slice(0, 100) + (p.length > 100 ? "..." : ""),
        reason: "Urban transit / Nganya story drifted into unrelated music concert or entertainment event.",
      };
      driftViolations.push(violation);
      errors.push(
        `Critical Hallucination: Paragraph ${index + 1} pivots into music concert / festival content which contradicts the urban transport beat.`
      );
      return;
    }

    // 2. Thematic beat drift check
    const paraBeat = detectStoryBeat(p, "", null);
    if (paraBeat !== primaryBeat && incompatibleList.includes(paraBeat)) {
      // Check if evidence packet explicitly corroborates this crossover
      let corroboratedInDossier = false;
      if (packet) {
        const facts = ((packet as any).confirmed_facts || (packet as any).confirmedFacts || []).map((f: any) => typeof f === "string" ? f : f.fact || "");
        const claims = ((packet as any).claims || (packet as any).unverified_claims || []).map((c: any) => typeof c === "string" ? c : c.claimText || c.text || "");
        const dossierContent = [...facts, ...claims].join(" ").toLowerCase();
        if (paraBeat === "music" && /\b(song|album|music|singer|artist)\b/.test(dossierContent)) {
          corroboratedInDossier = true;
        }
      }

      if (!corroboratedInDossier) {
        driftViolations.push({
          paragraphIndex: index,
          detectedBeat: paraBeat,
          expectedBeat: primaryBeat,
          sampleSnippet: p.slice(0, 100) + (p.length > 100 ? "..." : ""),
          reason: `Beat transition from '${primaryBeat}' to incompatible '${paraBeat}'.`,
        });
        errors.push(
          `Thematic Drift: Paragraph ${index + 1} classified as '${paraBeat}' while story lede is firmly '${primaryBeat}'.`
        );
      }
    }
  });

  // 3. Grounding verification against ResearchPacket
  const confirmedFactsList = ((packet as any)?.confirmed_facts || (packet as any)?.confirmedFacts || []);
  if (packet && confirmedFactsList.length > 0) {
    // Check if concluding paragraph mentions specific events or assertions completely absent from dossier
    const lastPara = paragraphs[paragraphs.length - 1] || "";
    if (CONCERT_EVENT_REGEX.test(lastPara) && primaryBeat === "matatu_transport") {
      ungroundedClaims.push("Concluding paragraph references live music concert absent from verification dossier.");
    }
  }

  const conclusionBeat = paragraphs.length > 0
    ? detectStoryBeat(paragraphs[paragraphs.length - 1], "", null)
    : primaryBeat;

  const passed = driftViolations.length === 0 && ungroundedClaims.length === 0;

  return {
    passed,
    primaryBeat,
    conclusionBeat,
    driftViolations,
    ungroundedClaims,
    errors,
    warnings,
    cleanHeadline: headline,
    cleanLede: lede,
    wasRepaired: false,
  };
}

/**
 * Automatically repairs hallucinatory drift by removing offending paragraphs
 * and injecting strictly grounded, on-beat contextual depth.
 */
export function repairHallucinatoryDrift(
  article: {
    headline: string;
    lede: string;
    body: string;
    category?: string | null;
    region?: string | null;
  },
  packet?: ResearchPacket
): {
  headline: string;
  lede: string;
  body: string;
  repaired: boolean;
  repairLog: string[];
} {
  const audit = auditArticleHallucinations(article, packet);
  if (audit.passed) {
    return {
      headline: audit.cleanHeadline,
      lede: audit.cleanLede,
      body: article.body,
      repaired: false,
      repairLog: [],
    };
  }

  const paragraphs = extractBodyParagraphs(article.body);
  const repairLog: string[] = [];
  const offendingIndices = new Set(audit.driftViolations.map((v) => v.paragraphIndex));

  // Filter out hallucinated paragraphs
  const cleanParas = paragraphs.filter((p, idx) => {
    if (offendingIndices.has(idx)) {
      repairLog.push(`Removed hallucinatory paragraph ${idx + 1} (${p.slice(0, 60)}...)`);
      return false;
    }
    // Double check transit-to-concert
    if (isTransitToConcertHallucination(audit.primaryBeat, p, packet)) {
      repairLog.push(`Removed concert hallucination in paragraph ${idx + 1}`);
      return false;
    }
    return true;
  });

  // If paragraphs were removed, replenish with verified on-beat contextual expansions
  const candidateExpansions = generateContextualExpansionParagraphs(
    article.headline,
    article.region || "national",
    article.category || "general",
    cleanParas.join(" ")
  );

  let needed = Math.max(0, 4 - cleanParas.length);
  for (const exp of candidateExpansions) {
    if (needed <= 0 && cleanParas.length >= 4) break;
    // Ensure the expansion itself does not violate the primary beat
    if (!isTransitToConcertHallucination(audit.primaryBeat, exp, packet)) {
      cleanParas.push(exp);
      repairLog.push(`Appended beat-grounded contextual paragraph for '${audit.primaryBeat}'`);
      needed--;
    }
  }

  const repairedBody = cleanParas.join("\n\n");

  return {
    headline: audit.cleanHeadline,
    lede: audit.cleanLede,
    body: repairedBody,
    repaired: true,
    repairLog,
  };
}
