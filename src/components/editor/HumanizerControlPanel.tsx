/**
 * WireOps Desk / Amaica Media
 * Humanizer Control Panel
 *
 * Newsroom UI component enforcing the strict Human-in-the-Loop mandate:
 * Humanization is explicitly initiated by a human editor. Never runs automatically.
 * Zero-Emoji Workplace Standard strictly enforced.
 */

import React, { useState } from "react";
import {
  Wand2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  ArrowRight,
  Sliders,
  Copy,
  Lock,
} from "lucide-react";
import {
  executeHumanizer,
  type HumanizeStyle,
  type HumanizeResult,
  type ParagraphDiff,
} from "@/lib/editorial/humanizerTool";
import { toast } from "sonner";

interface HumanizerControlPanelProps {
  originalText: string;
  editorId: string;
  editorName?: string;
  onApplyToEditor: (humanizedText: string) => void;
  onClose?: () => void;
}

export function HumanizerControlPanel({
  originalText,
  editorId,
  editorName = "Newsroom Editor",
  onApplyToEditor,
  onClose,
}: HumanizerControlPanelProps) {
  const [style, setStyle] = useState<HumanizeStyle>("natural_newsroom");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<HumanizeResult | null>(null);
  const [diffs, setDiffs] = useState<ParagraphDiff[]>([]);
  const [userConfirmed, setUserConfirmed] = useState(false);

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
    // Assemble final body based on accepted diffs
    const finalParas = diffs.map((d) => (d.accepted ? d.humanizedText : d.originalText));
    const finalBody = finalParas.join("\n\n");
    onApplyToEditor(finalBody);
    toast.success("Applied humanized revisions to editor workspace.");
    if (onClose) onClose();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-5">
      {/* Strict Mandate Banner */}
      <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded p-3 text-xs">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Lock className="w-4 h-4 text-primary" />
          <span>MANUAL TRIGGER ONLY: Humanization requires explicit editor initiation.</span>
        </div>
        <span className="text-muted-foreground">Editor: {editorName}</span>
      </div>

      {/* Style Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Editorial Voice & Rhythm Preset
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {styles.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`text-left p-3 rounded border text-xs transition-all ${
                style === s.id
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:bg-muted/50 text-foreground"
              }`}
            >
              <div className="font-semibold">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Trigger Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero Factual Drift Guarantee: Names, numbers, dates and quotes are strictly locked.</span>
        </div>

        <button
          type="button"
          onClick={handleRunHumanizer}
          disabled={isProcessing || !originalText.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          <span>{isProcessing ? "Processing Humanization..." : "Run Editorial Humanizer"}</span>
        </button>
      </div>

      {/* Results & Side-by-Side Review */}
      {result && (
        <div className="space-y-4 pt-4 border-t border-border">
          {/* Integrity Report Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/40 p-3 rounded text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Facts Preserved</span>
              <span className="font-bold text-emerald-600">{result.entitiesPreserved} Entities</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Quotes Verified</span>
              <span className="font-bold text-emerald-600">{result.quotesPreserved} Direct Quotes</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Burstiness Score</span>
              <span className="font-bold text-primary">{result.burstinessScore}/100</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Stylebook Edits</span>
              <span className="font-bold text-primary">{result.stylebookCorrectionsApplied} Applied</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Paragraph-by-Paragraph Review:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 font-medium"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 font-medium"
              >
                Reject All
              </button>
            </div>
          </div>

          {/* Diffs List */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {diffs.map((d, idx) => (
              <div
                key={d.id}
                className={`p-3 rounded border text-xs space-y-2 transition-all ${
                  d.accepted
                    ? "border-emerald-300 bg-emerald-50/20"
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
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
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
                  <div className="p-2 bg-muted/30 rounded border border-border/60 text-muted-foreground">
                    <span className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-muted-foreground/80">
                      Original
                    </span>
                    <p className="leading-relaxed">{d.originalText}</p>
                  </div>
                  <div className="p-2 bg-card rounded border border-primary/20 text-foreground">
                    <span className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-primary">
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

          {/* Final Apply Button */}
          <div className="flex justify-end gap-2 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-border text-xs rounded hover:bg-muted font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleApplyToEditor}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Revisions to Article</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
