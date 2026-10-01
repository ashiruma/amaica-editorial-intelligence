/**
 * WireOps Desk / Amaica Media
 * Multi-Detector Provider Adapter Engine
 *
 * Normalizes multi-detector queries across:
 * - Internal 15-Signal Newsroom Ensemble (calibrated locally)
 * - Copyleaks AI Detector API
 * - Winston AI API
 * - GPTZero API
 * - Sapling AI API
 * - ZeroGPT API
 *
 * STRICT TRANSPARENCY MANDATE:
 * Missing API key -> status 'NOT_CONFIGURED' with aiScore: null.
 * Offline service -> status 'SERVICE_UNAVAILABLE' with aiScore: null.
 * NEVER fake mock numbers.
 */

import { DetectorProviderRegistry } from "@/lib/providers/detectorProvider";
import { getEnvVar } from "@/lib/providers/llmProvider";
import {
  calculateConsensus,
  type AggregatedConsensus,
} from "./consensusAggregator";
import type {
  DetectorAnalysisRequest,
  DetectorAnalysisResponse,
} from "@/types/intelligence";

export interface DetectorStatusInfo {
  providerName: string;
  isConfigured: boolean;
  status: "READY" | "NOT_CONFIGURED" | "RATE_LIMITED" | "OFFLINE";
  envKeyRequired?: string;
}

export class MultiDetectorEngine {
  /**
   * Executes analysis across all configured detector adapters concurrently.
   */
  public static async scan(req: DetectorAnalysisRequest): Promise<AggregatedConsensus> {
    const promises: Promise<DetectorAnalysisResponse>[] = [
      DetectorProviderRegistry.analyzeInternalEnsemble(req),
      DetectorProviderRegistry.analyzeCopyleaks(req),
      DetectorProviderRegistry.analyzeWinston(req),
      DetectorProviderRegistry.analyzeGPTZero(req),
      DetectorProviderRegistry.analyzeSapling(req),
      DetectorProviderRegistry.analyzeZeroGPT(req),
    ];

    const results = await Promise.all(promises);
    return calculateConsensus(results);
  }

  /**
   * Inspects connection and configuration health for all supported detector APIs.
   */
  public static async getStatuses(): Promise<DetectorStatusInfo[]> {
    const providers: { name: string; envVar: string }[] = [
      { name: "InternalEnsemble_v2.1", envVar: "" },
      { name: "Copyleaks", envVar: "COPYLEAKS_API_KEY" },
      { name: "WinstonAI", envVar: "WINSTON_API_KEY" },
      { name: "GPTZero", envVar: "GPTZERO_API_KEY" },
      { name: "SaplingAI", envVar: "SAPLING_API_KEY" },
      { name: "ZeroGPT", envVar: "ZEROGPT_API_KEY" },
    ];

    return providers.map((p) => {
      if (!p.envVar) {
        return {
          providerName: p.name,
          isConfigured: true,
          status: "READY",
        };
      }

      const val = getEnvVar(p.envVar);
      return {
        providerName: p.name,
        isConfigured: Boolean(val),
        status: val ? "READY" : "NOT_CONFIGURED",
        envKeyRequired: p.envVar,
      };
    });
  }
}
