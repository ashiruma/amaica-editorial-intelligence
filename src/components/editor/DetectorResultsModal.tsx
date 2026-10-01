/**
 * WireOps Desk / Amaica Media
 * Multi-Detector & Plagiarism Results Modal
 *
 * Displays transparent multi-detector analysis results, inter-detector
 * divergence warnings, and plagiarism sentence-level matches.
 * Zero-Emoji Workplace Standard strictly enforced.
 */

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  FileText,
} from "lucide-react";
import type { AggregatedConsensus } from "@/lib/detectors/consensusAggregator";
import type { PlagiarismScanResult } from "@/lib/detectors/plagiarismEngine";

interface DetectorResultsModalProps {
  detectorResult: AggregatedConsensus | null;
  plagiarismResult: PlagiarismScanResult | null;
  onClose: () => void;
}

export function DetectorResultsModal({
  detectorResult,
  plagiarismResult,
  onClose,
}: DetectorResultsModalProps) {
  const [activeTab, setActiveTab] = useState<"ai_detectors" | "plagiarism">("ai_detectors");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                AI Detection & Plagiarism Intelligence
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Multi-detector consensus breakdown & cluster similarity analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("ai_detectors")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === "ai_detectors"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>AI Detector Ensemble</span>
            {detectorResult?.averageScore !== null && (
              <span className="text-[10px] ml-1 bg-background/20 px-1.5 py-0.2 rounded">
                {detectorResult?.averageScore}%
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("plagiarism")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === "plagiarism"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cluster Similarity & Plagiarism</span>
            {plagiarismResult && (
              <span className="text-[10px] ml-1 bg-background/20 px-1.5 py-0.2 rounded">
                {plagiarismResult.overallSimilarityPercent}%
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "ai_detectors" && (
            <div className="space-y-4">
              {/* Overall Consensus Banner */}
              {detectorResult ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-muted/30 p-3.5 rounded border border-border">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Consensus Verdict
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {detectorResult.consensusSignal.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Weighted AI Score
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          (detectorResult.weightedScore ?? 0) >= 50
                            ? "text-rose-600"
                            : (detectorResult.weightedScore ?? 0) <= 20
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {detectorResult.weightedScore !== null
                          ? `${detectorResult.weightedScore}%`
                          : "Inconclusive"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Active Providers
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {detectorResult.activeProviderCount} / {detectorResult.results.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Inter-Provider Spread
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {detectorResult.disagreement.spread} pts
                      </span>
                    </div>
                  </div>

                  {/* Disagreement Warning */}
                  {detectorResult.disagreement.hasDisagreement && (
                    <div className="flex items-start gap-2.5 p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Detector Divergence Detected</div>
                        <p className="text-[11px] mt-0.5 text-amber-800">
                          {detectorResult.disagreement.explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Provider Breakdown Cards */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Provider-by-Provider Breakdown:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {detectorResult.results.map((prov) => (
                        <div
                          key={prov.providerName}
                          className="p-3 rounded border border-border bg-card text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{prov.providerName}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                                prov.status === "SUCCESS"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : prov.status === "NOT_CONFIGURED"
                                  ? "bg-muted text-muted-foreground border border-border"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {prov.status.replace("_", " ")}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between pt-1">
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Score</span>
                              <span
                                className={`text-base font-bold ${
                                  prov.aiScore === null
                                    ? "text-muted-foreground"
                                    : prov.aiScore >= 50
                                    ? "text-rose-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {prov.aiScore !== null ? `${prov.aiScore}%` : "N/A"}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground block">
                                Response Time
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">
                                {prov.latencyMs} ms
                              </span>
                            </div>
                          </div>

                          {prov.errorMessage && (
                            <div className="text-[10px] text-muted-foreground bg-muted p-1 rounded font-mono truncate">
                              {prov.errorMessage}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-xs">
                  No detector scan data available. Click Scan to run multi-detector consensus.
                </div>
              )}
            </div>
          )}

          {activeTab === "plagiarism" && (
            <div className="space-y-4">
              {plagiarismResult ? (
                <>
                  {/* Summary Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-3.5 rounded border border-border text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Overall Overlap
                      </span>
                      <span
                        className={`text-base font-bold ${
                          plagiarismResult.overallSimilarityPercent >= 30
                            ? "text-rose-600"
                            : plagiarismResult.overallSimilarityPercent >= 10
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {plagiarismResult.overallSimilarityPercent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Exact Matches
                      </span>
                      <span className="text-sm font-bold text-rose-600">
                        {plagiarismResult.exactMatchCount} sentences
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Paraphrased Matches
                      </span>
                      <span className="text-sm font-bold text-amber-600">
                        {plagiarismResult.paraphrasedMatchCount} sentences
                      </span>
                    </div>
                  </div>

                  {/* Highlighted Match List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Matched Passages:
                    </h4>
                    {plagiarismResult.highlightedSpans.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs bg-muted/10 rounded border border-border">
                        <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
                        <p className="font-semibold">Zero Plagiarism Detected</p>
                        <p className="text-[11px]">
                          No suspicious similarity found against cluster sources or news wires.
                        </p>
                      </div>
                    ) : (
                      plagiarismResult.highlightedSpans.map((span, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded border text-xs space-y-1.5 ${
                            span.type === "exact"
                              ? "bg-rose-50/40 border-rose-200"
                              : "bg-amber-50/40 border-amber-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                span.type === "exact"
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : "bg-amber-100 text-amber-800 border-amber-300"
                              }`}
                            >
                              {span.type === "exact" ? "Exact Match (100%)" : `Paraphrase (~${span.similarityScore}%)`}
                            </span>
                            {span.sourceTitle && (
                              <span className="text-[11px] font-medium text-muted-foreground">
                                Source: {span.sourceTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-foreground leading-relaxed italic">
                            "{span.text}"
                          </p>
                          {span.sourceUrl && (
                            <a
                              href={span.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Source Reference</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-xs">
                  No similarity scan data available.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-muted border border-border text-xs rounded hover:bg-muted/80 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
