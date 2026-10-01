/**
 * WireOps Desk / Amaica Media
 * Plagiarism & Text Similarity Detection Engine
 *
 * Implements:
 * - N-gram word shingling (5-gram window)
 * - Levenshtein sentence edit-distance
 * - Overlap classification: Exact Match (Red), Paraphrased Match (Yellow)
 * - Scanning against active story cluster source signals and Turnitin/Copyleaks APIs
 */

import { PlagiarismProviderRegistry } from "@/lib/providers/plagiarismProvider";
import type {
  PlagiarismCheckResponse,
  PlagiarismMatch,
} from "@/types/intelligence";

export interface HighlightedSpan {
  type: "exact" | "paraphrased";
  text: string;
  sourceUrl?: string;
  sourceTitle?: string;
  similarityScore: number;
}

export interface PlagiarismScanResult extends PlagiarismCheckResponse {
  exactMatchCount: number;
  paraphrasedMatchCount: number;
  highlightedSpans: HighlightedSpan[];
}

/**
 * Calculates Levenshtein distance between two strings.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Normalized Levenshtein similarity percentage (0 - 100).
 */
export function calculateLevenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 100;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const dist = calculateLevenshteinDistance(a, b);
  return Math.max(0, Math.round(((maxLen - dist) / maxLen) * 100));
}

export class PlagiarismEngine {
  /**
   * Scans a draft against ingested source signals within a story cluster.
   */
  public static scanClusterSources(
    draftText: string,
    clusterSources: Array<{ url: string; title: string; text: string }>
  ): PlagiarismScanResult {
    const rawCheck = PlagiarismProviderRegistry.checkLocalClusterSimilarity(
      draftText,
      clusterSources
    );

    const highlightedSpans: HighlightedSpan[] = [];
    let exactCount = 0;
    let paraphrasedCount = 0;

    const draftSentences = draftText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);

    for (const sent of draftSentences) {
      let bestMatch: {
        sourceUrl: string;
        sourceTitle: string;
        score: number;
        type: "exact" | "paraphrased";
      } | null = null;

      for (const src of clusterSources) {
        if (!src.text) continue;
        const srcLower = src.text.toLowerCase();
        const sentLower = sent.toLowerCase();

        // Check for exact substring match
        if (srcLower.includes(sentLower)) {
          bestMatch = {
            sourceUrl: src.url,
            sourceTitle: src.title,
            score: 100,
            type: "exact",
          };
          break;
        }

        // Check for high Levenshtein similarity against source sentences
        const srcSentences = src.text
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 20);

        for (const srcSent of srcSentences) {
          const sim = calculateLevenshteinSimilarity(sent, srcSent);
          if (sim >= 85) {
            bestMatch = {
              sourceUrl: src.url,
              sourceTitle: src.title,
              score: sim,
              type: "exact",
            };
            break;
          } else if (sim >= 65 && (!bestMatch || sim > bestMatch.score)) {
            bestMatch = {
              sourceUrl: src.url,
              sourceTitle: src.title,
              score: sim,
              type: "paraphrased",
            };
          }
        }
        if (bestMatch && bestMatch.type === "exact") break;
      }

      if (bestMatch) {
        if (bestMatch.type === "exact") exactCount++;
        else paraphrasedCount++;

        highlightedSpans.push({
          type: bestMatch.type,
          text: sent,
          sourceUrl: bestMatch.sourceUrl,
          sourceTitle: bestMatch.sourceTitle,
          similarityScore: bestMatch.score,
        });
      }
    }

    return {
      ...rawCheck,
      exactMatchCount: exactCount,
      paraphrasedMatchCount: paraphrasedCount,
      highlightedSpans,
    };
  }

  /**
   * Scans a draft against Copyleaks/Turnitin API if configured.
   */
  public static async scanThirdPartyApi(text: string): Promise<PlagiarismCheckResponse> {
    return PlagiarismProviderRegistry.checkCopyleaksPlagiarism(text);
  }
}
