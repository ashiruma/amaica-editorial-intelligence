/**
 * Amaica Media Editorial Intelligence Platform
 * Originality & Archive Similarity Engine
 *
 * Compares incoming draft text against internal newsroom archives
 * to identify exact duplication, near-duplicate overlap, and semantic similarity.
 */

import type { OriginalityReport, OriginalityMatch } from "@/types/editorialIntelligence";

interface ArchiveStory {
  id: string;
  title: string;
  content: string;
}

// Sample internal newsroom archive control entries
const INTERNAL_ARCHIVE: ArchiveStory[] = [
  {
    id: "arch-1",
    title: "Najib Balala Refutes Death Claims",
    content: "Former Tourism Cabinet Secretary Najib Balala has dismissed widespread social media reports claiming he had passed away, confirming he is alive and well.",
  },
  {
    id: "arch-2",
    title: "Kakamega Cultural Festival Set for Bukhungu",
    content: "The Kakamega Cultural Festival returns to Bukhungu Stadium with Sauti Sol headlining a 12-act lineup, organisers confirmed Thursday.",
  },
  {
    id: "arch-3",
    title: "Fally Ipupa Nairobi Concert Review",
    content: "Congolese rhumba maestro Fally Ipupa performed in Nairobi, delivering a live music set for fans alongside regional musicians.",
  },
];

/**
 * Calculates n-gram Jaccard similarity between two texts.
 */
function calculateJaccardSimilarity(textA: string, textB: string, n = 3): number {
  const wordsA = textA.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const wordsB = textB.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  if (wordsA.length < n || wordsB.length < n) return 0;

  const ngramsA = new Set<string>();
  for (let i = 0; i <= wordsA.length - n; i++) {
    ngramsA.add(wordsA.slice(i, i + n).join(" "));
  }

  const ngramsB = new Set<string>();
  for (let i = 0; i <= wordsB.length - n; i++) {
    ngramsB.add(wordsB.slice(i, i + n).join(" "));
  }

  let intersection = 0;
  for (const gram of ngramsA) {
    if (ngramsB.has(gram)) intersection++;
  }

  const union = ngramsA.size + ngramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Evaluates originality against the newsroom archive.
 */
export function checkOriginality(text: string, customArchive: ArchiveStory[] = INTERNAL_ARCHIVE): OriginalityReport {
  const clean = (text || "").trim();
  if (clean.length < 20) {
    return {
      originalityScore: 100,
      similarityType: "none",
      matches: [],
      summary: "Text too short for archive comparison.",
    };
  }

  const matches: OriginalityMatch[] = [];
  let highestSim = 0;

  for (const story of customArchive) {
    const sim = calculateJaccardSimilarity(clean, story.content);
    if (sim > 0.25) {
      if (sim > highestSim) highestSim = sim;
      matches.push({
        matchedArticleId: story.id,
        matchedArticleTitle: story.title,
        similarityPercentage: Math.round(sim * 100),
        matchingPassage: story.content.slice(0, 140) + "...",
      });
    }
  }

  // Exact duplicate check
  const isExactDuplicate = customArchive.some(
    (s) => s.content.trim().toLowerCase() === clean.toLowerCase()
  );

  if (isExactDuplicate) {
    return {
      originalityScore: 0,
      similarityType: "near_duplicate",
      matches,
      summary: "Exact duplicate of an existing internal newsroom story detected.",
    };
  }

  const originalityScore = Math.max(0, Math.round(100 - highestSim * 100));
  let similarityType: OriginalityReport["similarityType"] = "none";

  if (highestSim > 0.6) {
    similarityType = "near_duplicate";
  } else if (highestSim > 0.35) {
    similarityType = "semantic_similarity";
  } else if (highestSim > 0.2) {
    similarityType = "paraphrase";
  }

  let summary = "High originality. No significant internal archive duplication detected.";
  if (highestSim > 0.5) {
    summary = `High similarity detected (${Math.round(highestSim * 100)}% match) with published archive article.`;
  } else if (highestSim > 0.25) {
    summary = `Moderate thematic overlap (${Math.round(highestSim * 100)}% match) with existing newsroom coverage.`;
  }

  return {
    originalityScore,
    similarityType,
    matches,
    summary,
  };
}
