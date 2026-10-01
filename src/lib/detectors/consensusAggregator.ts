/**
 * WireOps Desk / Amaica Media
 * AI Detection Consensus Aggregator
 *
 * NON-NEGOTIABLE TRANSPARENCY MANDATE:
 * Never average fake numbers. Only average configured, active third-party detectors.
 * If detectors disagree significantly (e.g., Detector A: 18%, Detector B: 65%),
 * the engine flags DETECTOR_DISAGREEMENT and displays the divergence transparently
 * rather than fabricating a misleading single average.
 */

import type {
  DetectorAnalysisResponse,
  ConsensusSignal,
} from "@/types/intelligence";

export interface DetectorDisagreementReport {
  hasDisagreement: boolean;
  variance: number;
  highestProvider: { name: string; score: number } | null;
  lowestProvider: { name: string; score: number } | null;
  spread: number; // difference between highest and lowest
  explanation: string;
}

export interface AggregatedConsensus {
  consensusSignal: ConsensusSignal;
  configuredProviderCount: number;
  activeProviderCount: number;
  averageScore: number | null;
  weightedScore: number | null;
  disagreement: DetectorDisagreementReport;
  results: DetectorAnalysisResponse[];
  timestamp: string;
}

/**
 * Calculates consensus and detects inter-detector divergence.
 */
export function calculateConsensus(
  results: DetectorAnalysisResponse[]
): AggregatedConsensus {
  const configured = results.filter((r) => r.status !== "NOT_CONFIGURED");
  const successful = results.filter(
    (r) => r.status === "SUCCESS" && typeof r.aiScore === "number"
  );

  if (successful.length === 0) {
    return {
      consensusSignal: "INCONCLUSIVE",
      configuredProviderCount: configured.length,
      activeProviderCount: 0,
      averageScore: null,
      weightedScore: null,
      disagreement: {
        hasDisagreement: false,
        variance: 0,
        highestProvider: null,
        lowestProvider: null,
        spread: 0,
        explanation: "No third-party or local detector providers returned active scores.",
      },
      results,
      timestamp: new Date().toISOString(),
    };
  }

  const scores = successful.map((r) => r.aiScore as number);
  const sum = scores.reduce((a, b) => a + b, 0);
  const averageScore = Math.round(sum / scores.length);

  // Provider weightings: calibrated local ensemble + established third-party services
  const weights: Record<string, number> = {
    InternalEnsemble_v2: 1.2,
    InternalEnsemble_v2_1: 1.2,
    Copyleaks: 1.1,
    GPTZero: 1.1,
    WinstonAI: 1.0,
    SaplingAI: 0.9,
    ZeroGPT: 0.8,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const r of successful) {
    const w = weights[r.providerName] ?? 1.0;
    weightedSum += (r.aiScore as number) * w;
    totalWeight += w;
  }

  const weightedScore = Math.round(weightedSum / totalWeight);

  // Disagreement analysis
  let minScore = scores[0];
  let maxScore = scores[0];
  let minProv = successful[0];
  let maxProv = successful[0];

  for (const r of successful) {
    const s = r.aiScore as number;
    if (s < minScore) {
      minScore = s;
      minProv = r;
    }
    if (s > maxScore) {
      maxScore = s;
      maxProv = r;
    }
  }

  const spread = maxScore - minScore;
  const hasDisagreement = scores.length >= 2 && spread >= 35;

  let disagreementExplanation = "Detectors demonstrate reasonable consensus.";
  if (hasDisagreement) {
    disagreementExplanation = `Significant divergence observed: ${maxProv.providerName} flagged ${maxScore}% while ${minProv.providerName} reported ${minScore}% (spread of ${spread} points). Editorial review required.`;
  }

  // Consensus signal mapping
  let consensusSignal: ConsensusSignal = "UNCERTAIN";
  if (hasDisagreement) {
    consensusSignal = "UNCERTAIN";
  } else if (weightedScore <= 15) {
    consensusSignal = "CONFIRMED_HUMAN";
  } else if (weightedScore <= 35) {
    consensusSignal = "LIKELY_HUMAN";
  } else if (weightedScore >= 75) {
    consensusSignal = "CONFIRMED_SYNTHETIC";
  } else if (weightedScore >= 50) {
    consensusSignal = "LIKELY_SYNTHETIC";
  }

  return {
    consensusSignal,
    configuredProviderCount: configured.length,
    activeProviderCount: successful.length,
    averageScore,
    weightedScore,
    disagreement: {
      hasDisagreement,
      variance: Math.round(
        scores.reduce((acc, s) => acc + Math.pow(s - averageScore, 2), 0) /
          scores.length
      ),
      highestProvider: { name: maxProv.providerName, score: maxScore },
      lowestProvider: { name: minProv.providerName, score: minScore },
      spread,
      explanation: disagreementExplanation,
    },
    results,
    timestamp: new Date().toISOString(),
  };
}
