/**
 * WireOps Desk / Amaica Media
 * AI Integrity Forensic Diagnostic Panel
 * Location: src/components/editorial/AiIntegrityPanel.tsx
 *
 * Operational Standard: Strict Zero-Emoji Workplace Standard
 *
 * Mandate:
 * - AI detection and humanization are TWO SEPARATE SYSTEMS.
 * - This panel is purely diagnostic: never automatically rewrites, alters, or evades.
 * - Displays each provider independently (no misleading single averages).
 * - Qualitative Editorial Risk Classification: LOW, MODERATE, HIGH, REVIEW REQUIRED.
 * - Disclaims statistical variance: does not present detection as scientific certainty.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Bot,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";
import { MultiDetectorEngine, type DetectorStatusInfo } from "@/lib/detectors/multiDetectorEngine";
import { DetectorProviderRegistry } from "@/lib/providers/detectorProvider";
import type {
  DetectorAnalysisResponse,
  EditorialRiskRating,
} from "@/types/intelligence";
import { analyzeAiContent } from "@/lib/aiContentDetector";

interface AiIntegrityPanelProps {
  text: string;
  headline?: string;
}

export function AiIntegrityPanel({ text, headline }: AiIntegrityPanelProps) {
  const [loading, setLoading] = useState(false);
  const [providerResults, setProviderResults] = useState<DetectorAnalysisResponse[]>([]);
  const [riskRating, setRiskRating] = useState<EditorialRiskRating>("LOW");
  const [riskExplanation, setRiskExplanation] = useState<string>("");
  const [providerStatuses, setProviderStatuses] = useState<DetectorStatusInfo[]>([]);

  const runDiagnostics = async () => {
    if (!text || text.trim().length < 20) return;
    setLoading(true);

    try {
      const statuses = await MultiDetectorEngine.getStatuses();
      setProviderStatuses(statuses);

      const consensus = await MultiDetectorEngine.scan({ text, title: headline });
      setProviderResults(consensus.results);

      const riskAssessment = DetectorProviderRegistry.computeEditorialRiskRating(consensus.results);
      setRiskRating(riskAssessment.riskRating);
      setRiskExplanation(riskAssessment.explanation);
    } catch (err) {
      console.error("AI Integrity scan failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [text]);

  // Sentence-level flags from local heuristic analysis
  const localAnalysis = analyzeAiContent(text);
  const flaggedPhrases = localAnalysis.flaggedPhrases || [];

  const getRiskBadge = (rating: EditorialRiskRating) => {
    switch (rating) {
      case "REVIEW_REQUIRED":
        return {
          bg: "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800",
          icon: ShieldAlert,
          label: "REVIEW REQUIRED",
        };
      case "HIGH":
        return {
          bg: "bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-800",
          icon: AlertTriangle,
          label: "HIGH RISK",
        };
      case "MODERATE":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800",
          icon: AlertTriangle,
          label: "MODERATE RISK",
        };
      case "LOW":
      default:
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
          icon: ShieldCheck,
          label: "LOW RISK",
        };
    }
  };

  const badge = getRiskBadge(riskRating);
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-card text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="font-bold uppercase tracking-wider text-foreground text-[11px]">
            AI Integrity Multi-Engine Panel
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="Re-run Multi-Detector Scan"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>Rescan</span>
          </button>
          <Link
            to={`/newsroom/detector?text=${encodeURIComponent(text)}`}
            className="text-[11px] text-primary hover:underline flex items-center gap-1"
          >
            <span>Studio</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>

      {/* Editorial Risk Rating */}
      <div className={`p-3 rounded-md border flex items-start gap-3 ${badge.bg}`}>
        <BadgeIcon className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-xs tracking-wide">
            EDITORIAL RISK: {badge.label}
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {riskExplanation || "Multi-engine analysis evaluates linguistic predictability and synthetic sentence distributions."}
          </p>
        </div>
      </div>

      {/* Independent Provider Matrix */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Independent Provider Status & Probability Signals
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {providerResults.map((p) => {
            const isConfigured = p.status !== "NOT_CONFIGURED";
            const isSuccess = p.status === "SUCCESS";
            return (
              <div
                key={p.providerName}
                className="bg-muted/40 border border-border rounded p-2.5 flex flex-col justify-between"
              >
                <div className="text-[10px] font-semibold text-muted-foreground truncate">
                  {p.providerName}
                </div>
                <div className="mt-1">
                  {!isConfigured ? (
                    <span className="text-[10px] font-mono text-muted-foreground block">
                      Not Configured
                    </span>
                  ) : !isSuccess ? (
                    <span className="text-[10px] font-mono text-amber-600 block">
                      Unavailable
                    </span>
                  ) : (
                    <div>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {p.aiScore}%
                      </span>
                      <span className="text-[10px] block text-muted-foreground capitalize">
                        {p.confidence} confidence
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sentence-Level & Structural Heuristics */}
      {flaggedPhrases.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sentence-Level Predictive Markers ({flaggedPhrases.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {flaggedPhrases.slice(0, 8).map((fp, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted border border-border text-foreground"
              >
                "{fp.phrase}" {fp.count > 1 ? `(${fp.count})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Policy Mandate Disclaimer */}
      <div className="pt-2 border-t border-border flex items-start gap-1.5 text-[10px] text-muted-foreground">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p>
          AI detection and humanization are independent systems. Detector signals never trigger automatic rewriting.
          To refine tone or cadence, an authorized editor must manually initiate the Humanizer workspace.
        </p>
      </div>
    </div>
  );
}
