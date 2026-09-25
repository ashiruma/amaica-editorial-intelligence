/**
 * WireOps Desk: Story Cluster Inspector Modal
 * Location: src/components/intelligence/ClusterInspectorModal.tsx
 *
 * Detailed forensic inspection drawer for clustered news stories:
 * - Independent source lineage
 * - Multi-outlet corroboration checklist
 * - Confidence score breakdown
 * - Factual claims and locked direct quotes
 * - Zero-Emoji Workplace Standard
 */

import React from "react";
import { StoryCluster } from "@/types/intelligence";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface ClusterInspectorModalProps {
  cluster: StoryCluster | null;
  isOpen: boolean;
  onClose: () => void;
  onDraftArticle: (cluster: StoryCluster) => void;
  onFlagDispute?: (cluster: StoryCluster) => void;
}

export const ClusterInspectorModal: React.FC<ClusterInspectorModalProps> = ({
  cluster,
  isOpen,
  onClose,
  onDraftArticle,
  onFlagDispute,
}) => {
  if (!isOpen || !cluster) return null;

  const signals = cluster.signals || [];
  const verification = cluster.verification;
  const confidenceScore = verification?.confidence_score ?? (cluster.status === "VERIFIED" ? 85 : 40);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col">
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
                {cluster.primary_location} · {cluster.county || "Kenya"}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold leading-snug">
              {cluster.working_headline}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Top Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 border border-border rounded-lg text-center">
            <div>
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                Signals Ingested
              </span>
              <span className="text-lg font-bold text-foreground">
                {cluster.signal_count}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                Reporting Outlets
              </span>
              <span className="text-lg font-bold text-foreground">
                {cluster.source_count}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                Independent Sources
              </span>
              <span
                className={`text-lg font-bold ${
                  cluster.independent_source_count >= 3 ? "text-green-600" : "text-amber-600"
                }`}
              >
                {cluster.independent_source_count} / 3
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                Confidence Score
              </span>
              <span className="text-lg font-bold text-primary">
                {confidenceScore}%
              </span>
            </div>
          </div>

          {/* Independent Verification Status Banner */}
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 ${
              cluster.independent_source_count >= 3 || cluster.status === "VERIFIED"
                ? "bg-green-500/5 border-green-500/20 text-green-950 dark:text-green-200"
                : "bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-200"
            }`}
          >
            {cluster.independent_source_count >= 3 || cluster.status === "VERIFIED" ? (
              <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-bold block text-sm mb-0.5">
                {cluster.status === "VERIFIED"
                  ? "Corroboration Verified (3 Independent Sources Rule Met)"
                  : "Developing Lead (Pending Full 3-Source Independent Corroboration)"}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {verification?.verification_notes ||
                  "Independent verification requires multi-source corroborated evidence, on-record statements, or official gazette notices before publication."}
              </p>
            </div>
          </div>

          {/* Reporting Outlets & Signal Lineage */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Layers size={14} />
              Reporting Outlets &amp; Source Lineage ({signals.length})
            </h3>
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
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            {onFlagDispute && (
              <button
                onClick={() => onFlagDispute(cluster)}
                className="text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded font-medium border border-destructive/30 transition-colors"
              >
                Flag Factual Dispute
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded border border-border bg-background hover:bg-muted transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onDraftArticle(cluster);
              }}
              className="text-xs bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileText size={14} />
              Draft Continuous Article
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
