/**
 * WireOps Desk: Multi-Detector Provider Abstraction Engine
 * Location: src/lib/providers/detectorProvider.ts
 *
 * Implements normalized adapters for:
 * - Internal 15-Signal Ensemble (Local Turnitin/Grammarly Calibrated Engine)
 * - Copyleaks AI Detector API
 * - Winston AI API
 * - GPTZero API
 * - Sapling AI API
 * - ZeroGPT API
 *
 * NON-NEGOTIABLE TRANSPARENCY MANDATE:
 * If an API key is missing or service is offline, return status 'NOT_CONFIGURED'
 * or 'SERVICE_UNAVAILABLE' with aiScore: null.
 * NEVER fake mock numbers or simulate 0% / 100% scores.
 */

import {
  DetectorAnalysisRequest,
  DetectorAnalysisResponse,
  ConsensusSignal,
} from "@/types/intelligence";
import { getEnvVar } from "./llmProvider";
import { analyzeAiContent } from "@/lib/aiContentDetector";

export interface MultiDetectorConsensus {
  consensusSignal: ConsensusSignal;
  configuredProviderCount: number;
  activeProviderCount: number;
  averageScore: number | null; // null if no providers configured
  results: DetectorAnalysisResponse[];
  timestamp: string;
}

export class DetectorProviderRegistry {
  /**
   * 1. Internal Newsroom 15-Signal Calibrated Ensemble (Always configured locally)
   */
  public static async analyzeInternalEnsemble(
    req: DetectorAnalysisRequest
  ): Promise<DetectorAnalysisResponse> {
    const start = Date.now();
    try {
      const report = analyzeAiContent(req.text);
      return {
        providerName: "InternalEnsemble_v2.1",
        status: "SUCCESS",
        aiScore: Math.round(report.score),
        confidence: report.tier === "human" || report.tier === "heavy_ai" ? "high" : "medium",
        latencyMs: Date.now() - start,
        rawResponse: {
          tier: report.tier,
          verdict: report.verdict,
          sentenceCount: report.analyzedSentences?.length || 0,
          flaggedPhrasesCount: report.flaggedPhrases?.length || 0,
          benchmarks: report.benchmarks,
        },
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        providerName: "InternalEnsemble_v2.1",
        status: "SERVICE_UNAVAILABLE",
        aiScore: null,
        confidence: "low",
        latencyMs: Date.now() - start,
        errorMessage: errorMsg,
      };
    }
  }

  /**
   * 2. Copyleaks AI Detector Adapter
   */
  public static async analyzeCopyleaks(
    req: DetectorAnalysisRequest
  ): Promise<DetectorAnalysisResponse> {
    const start = Date.now();
    const apiKey = getEnvVar("COPYLEAKS_API_KEY");

    if (!apiKey) {
      return {
        providerName: "Copyleaks",
        status: "NOT_CONFIGURED",
        aiScore: null,
        confidence: "low",
        latencyMs: 0,
        errorMessage: "COPYLEAKS_API_KEY is not configured in newsroom environment.",
      };
    }

    try {
      const res = await fetch("https://api.copyleaks.com/v2/writer-detector/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ text: req.text }),
      });

      if (!res.ok) {
        return {
          providerName: "Copyleaks",
          status: "SERVICE_UNAVAILABLE",
          aiScore: null,
          confidence: "low",
          latencyMs: Date.now() - start,
          errorMessage: `Copyleaks responded with HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      const score = typeof data.score === "number" ? Math.round(data.score * 100) : null;

      return {
        providerName: "Copyleaks",
        status: "SUCCESS",
        aiScore: score,
        confidence: "high",
        latencyMs: Date.now() - start,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        providerName: "Copyleaks",
        status: "SERVICE_UNAVAILABLE",
        aiScore: null,
        confidence: "low",
        latencyMs: Date.now() - start,
        errorMessage: errorMsg,
      };
    }
  }

  /**
   * 3. Winston AI Adapter
   */
  public static async analyzeWinston(
    req: DetectorAnalysisRequest
  ): Promise<DetectorAnalysisResponse> {
    const start = Date.now();
    const apiKey = getEnvVar("WINSTON_API_KEY");

    if (!apiKey) {
      return {
        providerName: "WinstonAI",
        status: "NOT_CONFIGURED",
        aiScore: null,
        confidence: "low",
        latencyMs: 0,
        errorMessage: "WINSTON_API_KEY is not configured in newsroom environment.",
      };
    }

    try {
      const res = await fetch("https://api.gowinston.ai/v2/plagiarism", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ text: req.text, language: req.language || "en" }),
      });

      if (!res.ok) {
        return {
          providerName: "WinstonAI",
          status: "SERVICE_UNAVAILABLE",
          aiScore: null,
          confidence: "low",
          latencyMs: Date.now() - start,
          errorMessage: `Winston AI responded with HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      return {
        providerName: "WinstonAI",
        status: "SUCCESS",
        aiScore: data.score ?? null,
        confidence: "high",
        latencyMs: Date.now() - start,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        providerName: "WinstonAI",
        status: "SERVICE_UNAVAILABLE",
        aiScore: null,
        confidence: "low",
        latencyMs: Date.now() - start,
        errorMessage: errorMsg,
      };
    }
  }

  /**
   * 4. GPTZero Adapter
   */
  public static async analyzeGPTZero(
    req: DetectorAnalysisRequest
  ): Promise<DetectorAnalysisResponse> {
    const start = Date.now();
    const apiKey = getEnvVar("GPTZERO_API_KEY");

    if (!apiKey) {
      return {
        providerName: "GPTZero",
        status: "NOT_CONFIGURED",
        aiScore: null,
        confidence: "low",
        latencyMs: 0,
        errorMessage: "GPTZERO_API_KEY is not configured in newsroom environment.",
      };
    }

    try {
      const res = await fetch("https://api.gptzero.me/v2/predict/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ document: req.text }),
      });

      if (!res.ok) {
        return {
          providerName: "GPTZero",
          status: "SERVICE_UNAVAILABLE",
          aiScore: null,
          confidence: "low",
          latencyMs: Date.now() - start,
          errorMessage: `GPTZero responded with HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      const aiProb = data.documents?.[0]?.completely_generated_prob;
      const score = typeof aiProb === "number" ? Math.round(aiProb * 100) : null;

      return {
        providerName: "GPTZero",
        status: "SUCCESS",
        aiScore: score,
        confidence: "high",
        latencyMs: Date.now() - start,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        providerName: "GPTZero",
        status: "SERVICE_UNAVAILABLE",
        aiScore: null,
        confidence: "low",
        latencyMs: Date.now() - start,
        errorMessage: errorMsg,
      };
    }
  }

  /**
   * 5. Sapling AI Adapter
   */
  public static async analyzeSapling(
    req: DetectorAnalysisRequest
  ): Promise<DetectorAnalysisResponse> {
    const start = Date.now();
    const apiKey = getEnvVar("SAPLING_API_KEY");

    if (!apiKey) {
      return {
        providerName: "SaplingAI",
        status: "NOT_CONFIGURED",
        aiScore: null,
        confidence: "low",
        latencyMs: 0,
        errorMessage: "SAPLING_API_KEY is not configured in newsroom environment.",
      };
    }

    try {
      const res = await fetch("https://api.sapling.ai/api/v1/aidetect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey, text: req.text }),
      });

      if (!res.ok) {
        return {
          providerName: "SaplingAI",
          status: "SERVICE_UNAVAILABLE",
          aiScore: null,
          confidence: "low",
          latencyMs: Date.now() - start,
          errorMessage: `Sapling AI responded with HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      const score = typeof data.score === "number" ? Math.round(data.score * 100) : null;

      return {
        providerName: "SaplingAI",
        status: "SUCCESS",
        aiScore: score,
        confidence: "medium",
        latencyMs: Date.now() - start,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        providerName: "SaplingAI",
        status: "SERVICE_UNAVAILABLE",
        aiScore: null,
        confidence: "low",
        latencyMs: Date.now() - start,
        errorMessage: errorMsg,
      };
    }
  }

  /**
   * 6. ZeroGPT Adapter
   */
  public static async analyzeZeroGPT(
    req: DetectorAnalysisRequest
  ): Promise<DetectorAnalysisResponse> {
    const start = Date.now();
    const apiKey = getEnvVar("ZEROGPT_API_KEY");

    if (!apiKey) {
      return {
        providerName: "ZeroGPT",
        status: "NOT_CONFIGURED",
        aiScore: null,
        confidence: "low",
        latencyMs: 0,
        errorMessage: "ZEROGPT_API_KEY is not configured in newsroom environment.",
      };
    }

    try {
      const res = await fetch("https://api.zerogpt.com/api/detect/detectText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ApiKey: apiKey,
        },
        body: JSON.stringify({ input_text: req.text }),
      });

      if (!res.ok) {
        return {
          providerName: "ZeroGPT",
          status: "SERVICE_UNAVAILABLE",
          aiScore: null,
          confidence: "low",
          latencyMs: Date.now() - start,
          errorMessage: `ZeroGPT responded with HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      const score = typeof data.data?.fakePercentage === "number" ? Math.round(data.data.fakePercentage) : null;

      return {
        providerName: "ZeroGPT",
        status: "SUCCESS",
        aiScore: score,
        confidence: "medium",
        latencyMs: Date.now() - start,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        providerName: "ZeroGPT",
        status: "SERVICE_UNAVAILABLE",
        aiScore: null,
        confidence: "low",
        latencyMs: Date.now() - start,
        errorMessage: errorMsg,
      };
    }
  }

  /**
   * Run all adapters and compute newsroom consensus across active providers.
   */
  public static async runAllDetectors(text: string): Promise<MultiDetectorConsensus> {
    const req: DetectorAnalysisRequest = { text };

    const results = await Promise.all([
      this.analyzeInternalEnsemble(req),
      this.analyzeCopyleaks(req),
      this.analyzeWinston(req),
      this.analyzeGPTZero(req),
      this.analyzeSapling(req),
      this.analyzeZeroGPT(req),
    ]);

    const activeResults = results.filter((r) => r.status === "SUCCESS" && r.aiScore !== null);
    const configuredCount = results.filter((r) => r.status !== "NOT_CONFIGURED").length;

    let averageScore: number | null = null;
    let consensusSignal: ConsensusSignal = "inconclusive";

    if (activeResults.length > 0) {
      const totalScore = activeResults.reduce((acc, r) => acc + (r.aiScore || 0), 0);
      averageScore = Math.round((totalScore / activeResults.length) * 10) / 10;

      // Determine consensus
      const allHuman = activeResults.every((r) => (r.aiScore || 0) < 25);
      const allAi = activeResults.every((r) => (r.aiScore || 0) > 65);

      if (allHuman) {
        consensusSignal = "consensus_human";
      } else if (allAi) {
        consensusSignal = "consensus_ai";
      } else {
        consensusSignal = "detector_disagreement";
      }
    }

    return {
      consensusSignal,
      configuredProviderCount: configuredCount,
      activeProviderCount: activeResults.length,
      averageScore,
      results,
      timestamp: new Date().toISOString(),
    };
  }
}
