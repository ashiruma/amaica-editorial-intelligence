/**
 * WireOps Desk / Amaica Media
 * Humanizer Modal Component
 *
 * Strict Human-in-the-Loop editorial precision modal.
 * Never executes automatically.
 * Zero-Emoji Workplace Standard strictly enforced.
 */

import React, { useState, useEffect } from "react";
import {
  Wand2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Sliders,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  executeHumanizer,
  type HumanizeStyle,
  type HumanizeResult,
  type ParagraphDiff,
} from "@/lib/editorial/humanizerTool";
import { analyzeAiContent } from "@/lib/aiContentDetector";
import { toast } from "sonner";

export interface HumanizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  editorId: string;
  editorName?: string;
  headline?: string;
  lede?: string;
  onApplyToEditor: (humanizedText: string) => void;
}

export function HumanizerModal({
  isOpen,
  onClose,
  originalText,
  editorId,
  editorName = "Newsroom Editor",
  headline,
  lede,
  onApplyToEditor,
}: HumanizerModalProps) {
  const [style, setStyle] = useState<HumanizeStyle>("natural_newsroom");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<HumanizeResult | null>(null);
  const [diffs, setDiffs] = useState<ParagraphDiff[]>([]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styles: { id: HumanizeStyle; label: string; desc: string }[] = [
    {
      id: "natural_newsroom",
      label: "Natural Newsroom",
      desc: "Inverted pyramid cadence, active voice, Kenyan newsroom attribution.",
    },
    {
      id: "conversational",
      label: "Conversational",
      desc: "Engaging and accessible rhythm for entertainment and culture pieces.",
    },
    {
      id: "feature",
      label: "Feature Story",
      desc: "Narrative pacing, rhythmic variation, and descriptive depth.",
    },
    {
      id: "investigative",
      label: "Investigative",
      desc: "Formal, documentation-first tone with heightened factual precision.",
    },
    {
      id: "compact_brief",
      label: "Compact Brief",
      desc: "Concise sentences for fast mobile reading and wire alerts.",
    },
  ];

  const handleRunHumanizer = () => {
    if (!editorId) {
      toast.error("Authentication required: Only authenticated editors can initiate humanization.");
      return;
    }

    try {
      setIsProcessing(true);
      const res = executeHumanizer({
        text: originalText,
        headline,
        lede,
        style,
        initiatedByEditor: true,
        editorId,
        editorName,
      });

      setResult(res);
      setDiffs(res.diffs);
      toast.success(
        `Humanization complete: ${res.diffs.length} paragraphs reviewed with 0% factual drift.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Humanization failed";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleDiff = (diffId: string) => {
    setDiffs((prev) =>
      prev.map((d) => (d.id === diffId ? { ...d, accepted: !d.accepted } : d))
    );
  };

  const handleAcceptAll = () => {
    setDiffs((prev) => prev.map((d) => ({ ...d, accepted: true })));
    toast.success("Accepted all revisions.");
  };

  const handleRejectAll = () => {
    setDiffs((prev) => prev.map((d) => ({ ...d, accepted: false })));
    toast.info("Rejected all revisions.");
  };

  const handleApplyToEditor = () => {
    const finalParas = diffs.map((d) => (d.accepted ? d.humanizedText : d.originalText));
    const finalBody = finalParas.join("\n\n");
    onApplyToEditor(finalBody);
    toast.success("Applied humanized revisions to editor workspace.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="humanizer-modal-title"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="humanizer-modal-title" className="text-sm font-bold text-foreground">
                Editorial Humanizer Tool (Strict Human-in-the-Loop)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Converts stiff synthetic text into authentic Kenyan journalistic prose with zero factual drift.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Policy Banner */}
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Lock className="w-4 h-4 shrink-0" />
              <span>MANUAL EDITOR TRIGGER: Humanization runs strictly upon human editor command.</span>
            </div>
            <span className="text-muted-foreground text-[11px]">Authorized Editor: {editorName}</span>
          </div>

          {/* Style Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Editorial Voice & Cadence Preset
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`text-left p-3 rounded-lg border text-xs transition-all ${
                    style === s.id
                      ? "border-primary bg-primary/10 text-primary font-medium shadow-2xs"
                      : "border-border hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Guaranteed Zero Factual Drift: Names, numbers, dates, and direct quotes are locked.</span>
            </div>

            <button
              type="button"
              onClick={handleRunHumanizer}
              disabled={isProcessing || !originalText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isProcessing ? "Processing Humanization..." : "Run Editorial Humanizer"}</span>
            </button>
          </div>

          {/* Results Diff View */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-border">
              {/* Forensics Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/40 p-3.5 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-medium">Facts Preserved</span>
                  <span className="font-bold text-emerald-600">{result.entitiesPreserved} Entities</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-medium">Quotes Verified</span>
                  <span className="font-bold text-emerald-600">{result.quotesPreserved} Direct Quotes</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-medium">Burstiness (Cadence)</span>
                  <span className="font-bold text-primary">{result.burstinessScore}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-medium">Stylebook Edits</span>
                  <span className="font-bold text-primary">{result.stylebookCorrectionsApplied} Applied</span>
                </div>
              </div>

              {/* Diff Controls */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Paragraph-by-Paragraph Review:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-xs font-medium hover:bg-emerald-100 transition"
                  >
                    Accept All
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectAll}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded text-xs font-medium hover:bg-rose-100 transition"
                  >
                    Reject All
                  </button>
                </div>
              </div>

              {/* Diffs List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {diffs.map((d, idx) => (
                  <div
                    key={d.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-2 transition-all ${
                      d.accepted
                        ? "border-emerald-300 bg-emerald-50/20 dark:border-emerald-800 dark:bg-emerald-950/20"
                        : "border-border bg-card opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">
                        Paragraph {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleDiff(d.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                          d.accepted
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                        }`}
                      >
                        {d.accepted ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Accepted</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            <span>Keep Original</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 bg-muted/40 rounded border border-border/60 text-muted-foreground">
                        <span className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-muted-foreground/80">
                          Original
                        </span>
                        <p className="leading-relaxed">{d.originalText}</p>
                      </div>
                      <div className="p-2.5 bg-card rounded border border-primary/20 text-foreground">
                        <span className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-primary font-semibold">
                          Humanized
                        </span>
                        <p className="leading-relaxed">{d.humanizedText}</p>
                      </div>
                    </div>

                    {d.changesMade.length > 0 && (
                      <div className="text-[11px] text-muted-foreground pt-1 flex flex-wrap gap-1">
                        {d.changesMade.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="bg-muted px-1.5 py-0.5 rounded text-[10px] border border-border"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-border text-xs rounded-lg hover:bg-muted font-medium transition"
          >
            Cancel
          </button>
          {result && (
            <button
              type="button"
              onClick={handleApplyToEditor}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Revisions to Article</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
