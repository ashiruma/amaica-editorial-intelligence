/**
 * Amaica Media / WireOps Desk
 * Unified Article Generation & Repurposing Pipeline
 *
 * Provides a clean interface for generating and repurposing news articles
 * with strict Inverted Pyramid structure, anti-hallucination checks,
 * prompt sandboxing, and compliance validation.
 */

import {
  generateInvertedPyramidArticle,
  synthesizeInvertedPyramidOffline,
  InvertedPyramidInput,
  InvertedPyramidArticle,
} from "@/lib/writer/invertedPyramidEngine";
import {
  auditArticleHallucinations,
  repairHallucinatoryDrift,
  HallucinationAuditReport,
} from "@/lib/writer/hallucinationGuard";
import { ensureEditorialCompliance, ComplianceResult } from "@/lib/editorial/editorialComplianceEngine";
import { stripEmojis, countWords } from "@/lib/articleValidation";

export interface ArticleGenerationOptions extends InvertedPyramidInput {
  enforceMinimumWords?: boolean; // Default true (>= 700 words)
  strictNoHallucinations?: boolean; // Default true
}

export interface GeneratedArticleResult {
  headline: string;
  lede: string;
  body: string;
  fullText: string;
  wordCount: number;
  paragraphCount: number;
  compliance: ComplianceResult;
  hallucinationAudit: HallucinationAuditReport;
  success: boolean;
}

/**
 * Universal article generation entry point.
 * Directs incoming requests through prompt sandboxing, Inverted Pyramid structure,
 * and hallucination guards.
 */
export async function generateArticle(options: ArticleGenerationOptions): Promise<GeneratedArticleResult> {
  const article = await generateInvertedPyramidArticle(options);

  // Run compliance checks
  const compliance = ensureEditorialCompliance({
    headline: article.headline,
    lede: article.lede,
    body: article.body,
    region: options.region,
    category: options.category || article.primaryBeat,
    sources: options.researchPacket ? options.researchPacket.sources.map(s => ({
      url: s.url,
      title: s.sourceName,
      notes: [{ text: `Tier ${s.tier} source`, section: "Verification Dossier" }],
    })) : [],
  });

  // Verify anti-hallucination guard
  let finalAudit = article.hallucinationAudit;
  let finalBody = compliance.body;

  if (!finalAudit.passed) {
    const repaired = repairHallucinatoryDrift(
      {
        headline: compliance.headline,
        lede: compliance.lede,
        body: compliance.body,
        category: options.category || article.primaryBeat,
        region: options.region,
      },
      options.researchPacket
    );
    finalBody = repaired.body;
    finalAudit = auditArticleHallucinations(
      {
        headline: compliance.headline,
        lede: compliance.lede,
        body: finalBody,
        category: options.category || article.primaryBeat,
      },
      options.researchPacket
    );
  }

  const finalHeadline = stripEmojis(compliance.headline);
  const finalLede = stripEmojis(compliance.lede);
  const finalFullText = `${finalHeadline}\n\n${finalLede}\n\n${finalBody}`;

  return {
    headline: finalHeadline,
    lede: finalLede,
    body: finalBody,
    fullText: finalFullText,
    wordCount: countWords(finalFullText),
    paragraphCount: finalBody.split(/\n\s*\n/).filter(p => p.trim().length > 0).length + 1,
    compliance,
    hallucinationAudit: finalAudit,
    success: compliance.approvable && finalAudit.passed,
  };
}

export {
  generateInvertedPyramidArticle,
  synthesizeInvertedPyramidOffline,
  auditArticleHallucinations,
  repairHallucinatoryDrift,
};
