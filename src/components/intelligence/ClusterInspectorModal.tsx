/**
 * WireOps Desk / Amaica Media
 * Story Cluster Inspector Modal & Comparison Dossier
 * Location: src/components/intelligence/ClusterInspectorModal.tsx
 *
 * Operational Standard: Strict Zero-Emoji Workplace Standard
 *
 * Provides:
 * 1. Sources & Lineage: Independent reporting outlets with 4-tier badges.
 * 2. Multi-Source Comparison & Conflicts: Agreements, Contradictory metrics, Unconfirmed single sources, Unknowns.
 * 3. Editorial Brief: Structured newsroom briefing separating Confirmed, Reported, Analysis, and Editorial Questions.
 */

import React, { useState } from "react";
import { StoryCluster } from "@/types/intelligence";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ExternalLink,
  Layers,
  ArrowRight,
  GitCompare,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { StoryComparisonEngine } from "@/lib/verification/storyComparisonEngine";
import { EditorialBriefGenerator } from "@/lib/editorial/editorialBriefGenerator";
import { toast } from "sonner";

interface ClusterInspectorModalProps {
  cluster: StoryCluster | null;
  isOpen: boolean;
  onClose: () => void;
  onDraftArticle: (cluster: StoryCluster) => void;
  onFlagDispute?: (cluster: StoryCluster) => void;
  isDrafting?: boolean;
}

export const ClusterInspectorModal: React.FC<ClusterInspectorModalProps> = ({
  cluster,
  isOpen,
  onClose,
  onDraftArticle,
  onFlagDispute,
  isDrafting,
}) => {
  const [activeTab, setActiveTab] = useState<"lineage" | "comparison" | "brief">("comparison");
  const [copiedBrief, setCopiedBrief] = useState(false);

  if (!isOpen || !cluster) return null;

  const signals = cluster.signals || [];
  const verification = cluster.verification;
  const confidenceScore = verification?.confidence_score ?? (cluster.status === "VERIFIED" ? 85 : 40);

  const comparison = StoryComparisonEngine.compareSources(cluster, signals);
  const brief = EditorialBriefGenerator.generateBrief(cluster, signals);

  const handleCopyBrief = () => {
    const text = [
      `EDITORIAL BRIEF: ${brief.whatHappened}`,
      `LOCATION: ${brief.whereLocation} | TIMELINE: ${brief.whenTime}`,
      `ENTITIES: ${brief.whoInvolved.join(", ")}`,
      "",
      "--- CONFIRMED FACTS ---",
      ...brief.confirmedFacts,
      "",
      "--- REPORTED CLAIMS ---",
      ...brief.reportedClaims,
      "",
      "--- CONFLICTING CLAIMS ---",
      ...brief.conflictingClaims,
      "",
      "--- OFFICIAL STATEMENTS ---",
      ...brief.officialStatements,
      "",
      "--- WHY IT MATTERS (AMAICA CONTEXT) ---",
      brief.whyItMatters,
      brief.amaicaRelevance,
      "",
      "--- RECOMMENDED REPORTING ANGLES ---",
      ...brief.recommendedAngles,
      "",
      "--- INVESTIGATIVE QUESTIONS ---",
      ...brief.investigativeQuestions,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopiedBrief(true);
    toast.success("Editorial Brief copied to clipboard.");
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border w-full max-w-4xl max-h-[92vh] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-start justify-between bg-muted/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {cluster.story_code}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  cluster.status === "VERIFIED"
                    ? "bg-green-500/10 text-green-600 border border-green-500/30"
                    : cluster.status === "DISPUTED"
                    ? "bg-destructive/10 text-destructive border border-destructive/30"
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                }`}
              >
                {cluster.status.replace(/_/g, " ")}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {cluster.primary_location} · {cluster.county || "Western Kenya"}
              </span>
            </div>
            <h2 className="font-display text-lg font-bold leading-snug">
              {cluster.working_headline}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-muted/20 px-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("comparison")}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "comparison"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitCompare size={13} />
            <span>Multi-Source Comparison & Conflicts ({comparison.conflicts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("brief")}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "brief"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen size={13} />
            <span>Editorial Brief Dossier</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lineage")}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "lineage"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers size={13} />
            <span>Sources & Lineage ({signals.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Top Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 border border-border rounded-lg text-center">
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                Signals Ingested
              </span>
              <span className="text-base font-bold text-foreground">
                {cluster.signal_count}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                Reporting Outlets
              </span>
              <span className="text-base font-bold text-foreground">
                {cluster.source_count}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                Independent Sources
              </span>
              <span
                className={`text-base font-bold ${
                  cluster.independent_source_count >= 3 ? "text-green-600" : "text-amber-600"
                }`}
              >
                {cluster.independent_source_count} / 3
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                Corroboration Confidence
              </span>
              <span className="text-base font-bold text-primary">
                {confidenceScore}%
              </span>
            </div>
          </div>

          {/* TAB 1: Multi-Source Comparison & Conflicts */}
          {activeTab === "comparison" && (
            <div className="space-y-4">
              {/* Conflict Alert (if any) */}
              {comparison.conflicts.length > 0 ? (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-950 dark:text-red-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-destructive">
                    <AlertTriangle size={16} />
                    <span>Conflicting Claims Detected Across Reporting Outlets</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Mandate: The newsroom system must never silently resolve contradictory numbers or statements.
                    Attribute differing claims explicitly or highlight the ongoing verification gap.
                  </p>
                  <div className="space-y-2 pt-1">
                    {comparison.conflicts.map((c, i) => (
                      <div key={i} className="bg-background/80 p-2.5 rounded border border-border text-foreground space-y-1">
                        <div className="font-semibold text-xs text-destructive">{c.topic}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                          {c.variants.map((v, vi) => (
                            <div key={vi} className="bg-muted/40 p-1.5 rounded border border-border">
                              <span className="font-bold block text-primary">{v.sourceName}</span>
                              <span>{v.claimText}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] text-muted-foreground pt-1 italic">
                          Editorial Guideline: {c.editorialRecommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-900 dark:text-green-200 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <span>Zero direct factual or numerical contradictions detected across monitored sources.</span>
                </div>
              )}

              {/* Agreements (Corroborated Facts) */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-green-600" />
                  Corroborated Agreements (Supported by 2+ Independent Outlets)
                </h3>
                {comparison.agreements.length > 0 ? (
                  <div className="space-y-1.5">
                    {comparison.agreements.map((a, i) => (
                      <div key={i} className="p-2.5 bg-muted/30 border border-border rounded flex items-start justify-between gap-3">
                        <span className="font-medium text-foreground">{a.claimText}</span>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0 bg-background px-2 py-0.5 rounded border border-border">
                          {a.supportingSources.join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Developing story: multi-outlet agreement matching ongoing.</p>
                )}
              </div>

              {/* Unconfirmed Claims & Unknowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-amber-600" />
                    Unconfirmed Single-Source Claims ({comparison.unconfirmed.length})
                  </h3>
                  <div className="space-y-1.5">
                    {comparison.unconfirmed.map((u, i) => (
                      <div key={i} className="p-2 bg-muted/20 border border-border rounded">
                        <span className="text-foreground block">{u.claimText}</span>
                        <span className="text-[10px] text-muted-foreground">Source: {u.sourceName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-primary" />
                    Identified Information Gaps (Unknowns)
                  </h3>
                  <div className="space-y-1.5">
                    {comparison.unknown.map((un, i) => (
                      <div key={i} className="p-2 bg-muted/20 border border-border rounded">
                        <span className="font-semibold text-foreground block">{un.aspect}</span>
                        <span className="text-[10px] text-muted-foreground">{un.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Editorial Brief Dossier */}
          {activeTab === "brief" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Editorial Briefing Dossier</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Structured intelligence breakdown separating Confirmed Facts, Reported Claims, Context, and Angle.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBrief}
                  className="px-3 py-1.5 rounded border border-border bg-background hover:bg-muted font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedBrief ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  <span>{copiedBrief ? "Copied" : "Copy Brief"}</span>
                </button>
              </div>

              {/* Key Sections */}
              <div className="space-y-3">
                <div className="bg-muted/30 p-3 rounded border border-border space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-primary">What Happened</span>
                  <p className="text-xs font-semibold text-foreground">{brief.whatHappened}</p>
                  <p className="text-[11px] text-muted-foreground">Location: {brief.whereLocation} · Date: {brief.whenTime}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-muted/20 p-3 rounded border border-border space-y-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-green-700 dark:text-green-400">Confirmed Facts</span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      {brief.confirmedFacts.map((f, i) => (
                        <li key={i}>{f.replace(/^\[CONFIRMED\]\s*/, "")}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-muted/20 p-3 rounded border border-border space-y-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400">Reported (Pending Independent Corroboration)</span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      {brief.reportedClaims.map((r, i) => (
                        <li key={i}>{r.replace(/^\[REPORTED\]\s*/, "")}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-muted/20 p-3 rounded border border-border space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-primary">Why It Matters & Amaica Regional Relevance</span>
                  <p className="text-[11px] text-foreground leading-relaxed">{brief.whyItMatters}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{brief.amaicaRelevance}</p>
                </div>

                <div className="bg-muted/20 p-3 rounded border border-border space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-primary">Recommended Editorial Angles</span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    {brief.recommendedAngles.map((ang, i) => (
                      <li key={i}>{ang}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Sources & Lineage */}
          {activeTab === "lineage" && (
            <div className="space-y-4">
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-background">
                {signals.map((sig, idx) => (
                  <div key={sig.id || idx} className="p-3 hover:bg-muted/30 transition-colors flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          {sig.raw_title}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                          {sig.lineage_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      {sig.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {sig.excerpt}
                        </p>
                      )}
                      <span className="text-[11px] text-muted-foreground block font-mono">
                        Domain: {new URL(sig.external_url).hostname.replace(/^www\./, "")}
                      </span>
                    </div>
                    <a
                      href={sig.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex-shrink-0"
                      title="Open external original report"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            {onFlagDispute && (
              <button
                type="button"
                onClick={() => onFlagDispute(cluster)}
                className="text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded font-medium border border-destructive/30 transition-colors cursor-pointer"
              >
                Flag Factual Dispute
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded border border-border bg-background hover:bg-muted transition-colors font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isDrafting}
              onClick={() => {
                onClose();
                onDraftArticle(cluster);
              }}
              className="text-xs bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isDrafting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Drafting Article...
                </>
              ) : (
                <>
                  <FileText size={14} />
                  Draft Continuous Article
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
