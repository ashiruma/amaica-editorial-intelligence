import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Wand2,
  EyeOff,
  Check,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type {
  CompleteEditorialIntelligencePayload,
  SentenceAnalysisDetail,
} from "@/types/editorialIntelligence";

interface SentenceHighlightViewerProps {
  content: string;
  payload: CompleteEditorialIntelligencePayload | null;
  onSentenceRewrite: (index: number, original: string) => void;
  onSentenceIgnore: (index: number) => void;
  onSentenceReview: (index: number) => void;
}

export type HighlightFilterState = "all" | "ai_pattern" | "needs_review" | "unclear" | "natural";

export function SentenceHighlightViewer({
  content,
  payload,
  onSentenceRewrite,
  onSentenceIgnore,
  onSentenceReview,
}: SentenceHighlightViewerProps) {
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(0);
  const [activeFilter, setActiveFilter] = useState<HighlightFilterState>("all");
  const [ignoredSentences, setIgnoredSentences] = useState<Set<number>>(new Set());
  const [reviewedSentences, setReviewedSentences] = useState<Set<number>>(new Set());

  const sentences: SentenceAnalysisDetail[] = payload?.aiReport.sentenceDetails || [];

  const handleIgnore = (idx: number) => {
    setIgnoredSentences((prev) => new Set(prev).add(idx));
    onSentenceIgnore(idx);
  };

  const handleReview = (idx: number) => {
    setReviewedSentences((prev) => new Set(prev).add(idx));
    onSentenceReview(idx);
  };

  // Determine state for a sentence
  const getSentenceState = (
    s: SentenceAnalysisDetail
  ): "natural" | "needs_review" | "ai_pattern" | "unclear" => {
    if (ignoredSentences.has(s.sentenceIndex)) return "natural";
    if (s.score >= 55 || s.classification === "ai_pattern") return "ai_pattern";
    if (s.score >= 30 || s.classification === "mixed") return "needs_review";
    if (s.text.length < 25) return "unclear";
    return "natural";
  };

  const stateStyles = {
    natural: {
      border: "border-transparent",
      bg: "hover:bg-emerald-500/10",
      pill: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      label: "Natural",
    },
    needs_review: {
      border: "border-b-2 border-accent bg-accent/10 hover:bg-accent/20",
      pill: "bg-accent/20 text-accent-foreground border-accent/40",
      label: "Needs Review",
    },
    ai_pattern: {
      border: "border-b-2 border-destructive bg-destructive/10 hover:bg-destructive/20",
      pill: "bg-destructive/10 text-destructive border-destructive/30",
      label: "AI-like Pattern",
    },
    unclear: {
      border: "border-b-2 border-border bg-muted/60 hover:bg-muted",
      pill: "bg-muted text-ink-light border-border",
      label: "Unclear / Short",
    },
  };

  const selectedSentence =
    selectedSentenceIndex !== null
      ? sentences.find((s) => s.sentenceIndex === selectedSentenceIndex) || null
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 8 Cols: Interactive Highlight Text Editor */}
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-card rounded border border-border shadow-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <div className="label-eyebrow text-primary mb-0.5">Forensic Layer 3 · Micro-Inspection</div>
              <h2 className="text-base font-bold font-display text-foreground">
                Sentence &amp; Paragraph Forensics
              </h2>
              <p className="text-xs text-ink-light">
                Click any highlighted passage to inspect writing signals and take immediate action.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted text-ink-light hover:text-foreground"
                }`}
              >
                All ({sentences.length})
              </button>
              <button
                onClick={() => setActiveFilter("ai_pattern")}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                  activeFilter === "ai_pattern"
                    ? "bg-destructive text-destructive-foreground font-semibold shadow-xs"
                    : "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                }`}
              >
                AI-like Patterns ({sentences.filter((s) => getSentenceState(s) === "ai_pattern").length})
              </button>
              <button
                onClick={() => setActiveFilter("needs_review")}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                  activeFilter === "needs_review"
                    ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                    : "bg-accent/20 text-accent-foreground border border-accent/40 hover:bg-accent/30"
                }`}
              >
                Needs Review ({sentences.filter((s) => getSentenceState(s) === "needs_review").length})
              </button>
              <button
                onClick={() => setActiveFilter("natural")}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                  activeFilter === "natural"
                    ? "bg-emerald-700 text-white font-semibold shadow-xs"
                    : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                }`}
              >
                Natural ({sentences.filter((s) => getSentenceState(s) === "natural").length})
              </button>
            </div>
          </div>

          {/* Render Sentences */}
          <div className="text-sm font-sans leading-relaxed text-foreground space-y-3 max-h-[550px] overflow-y-auto pr-2">
            {sentences.length === 0 ? (
              <p className="text-ink-light italic">No sentence analysis available. Please analyze content first.</p>
            ) : (
              <p className="leading-loose">
                {sentences.map((s) => {
                  const state = getSentenceState(s);
                  const isVisible = activeFilter === "all" || activeFilter === state;
                  const isSelected = selectedSentenceIndex === s.sentenceIndex;
                  const isIgnored = ignoredSentences.has(s.sentenceIndex);
                  const isReviewed = reviewedSentences.has(s.sentenceIndex);

                  if (!isVisible && activeFilter !== "all") {
                    return (
                      <span key={s.sentenceIndex} className="opacity-30 mr-1.5">
                        {s.text}{" "}
                      </span>
                    );
                  }

                  return (
                    <span
                      key={s.sentenceIndex}
                      onClick={() => setSelectedSentenceIndex(s.sentenceIndex)}
                      className={`cursor-pointer px-1 py-0.5 rounded-sm transition-all mr-1.5 inline ${
                        stateStyles[state].border
                      } ${isSelected ? "ring-2 ring-primary shadow-xs font-medium" : ""} ${
                        isReviewed ? "opacity-75" : ""
                      }`}
                      title={`Sentence ${s.sentenceIndex + 1}: ${stateStyles[state].label} (${s.score}% AI score)`}
                    >
                      {s.text}
                      {state === "ai_pattern" && !isIgnored && !isReviewed && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive ml-1 mb-1 align-baseline" />
                      )}
                    </span>
                  );
                })}
              </p>
            )}
          </div>

          {/* Legend Footer */}
          <div className="flex items-center gap-4 pt-3 border-t border-border text-[11px] text-ink-light flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Natural (&lt; 30%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span>Needs Review (30%–55%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <span>AI-like Pattern (&gt; 55%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-border" />
              <span>Unclear / Short</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right 4 Cols: Sentence Explanation & Actions Drawer */}
      <div className="lg:col-span-4 space-y-4">
        {selectedSentence ? (
          <div className="bg-card rounded border border-border shadow-card p-5 space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-amaica font-bold text-ink-light uppercase">
                  Sentence #{selectedSentence.sentenceIndex + 1}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${
                    stateStyles[getSentenceState(selectedSentence)].pill
                  }`}
                >
                  {stateStyles[getSentenceState(selectedSentence)].label}
                </span>
              </div>
              <span className="text-xs font-mono-amaica font-bold text-foreground">
                {selectedSentence.score}% Machine Score
              </span>
            </div>

            {/* Passaged Quoted */}
            <div className="bg-muted/50 p-3 rounded border border-border text-xs italic text-foreground leading-relaxed font-sans">
              "{selectedSentence.text}"
            </div>

            {/* Why This Was Flagged */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase font-mono-amaica tracking-wider">
                Why this was flagged
              </h3>
              <p className="text-xs text-ink-light font-sans leading-relaxed">
                {selectedSentence.reason ||
                  (selectedSentence.score > 50
                    ? "Low syntactic variation and predictable connective phrasing commonly seen in machine-generated copy."
                    : "Passage contains natural human sentence rhythm and specific factual details.")}
              </p>
            </div>

            {/* AI-like Patterns List */}
            <div className="space-y-1.5 pt-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase font-mono-amaica">
                AI-Like Patterns
              </h4>
              <ul className="text-xs space-y-1 text-ink-mid">
                {selectedSentence.score >= 50 ? (
                  <>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      Formulaic clause construction
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      Predictable transition pattern
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      Low syntactic length variance
                    </li>
                  </>
                ) : (
                  <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Natural cadence and active news phrasing
                  </li>
                )}
              </ul>
            </div>

            {/* Actions: Rewrite, Ignore, Review */}
            <div className="pt-3 border-t border-border space-y-2">
              <button
                onClick={() =>
                  onSentenceRewrite(selectedSentence.sentenceIndex, selectedSentence.text)
                }
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-mid text-primary-foreground text-xs font-medium rounded shadow-xs transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-accent" />
                Rewrite Sentence
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleReview(selectedSentence.sentenceIndex)}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-foreground bg-card border border-border hover:bg-muted rounded font-medium transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-ink-light" />
                  Mark Reviewed
                </button>
                <button
                  onClick={() => handleIgnore(selectedSentence.sentenceIndex)}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-ink-light hover:text-foreground bg-card border border-border hover:bg-muted rounded font-medium transition-colors cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Ignore
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded border border-border p-8 text-center text-ink-light text-xs shadow-card">
            Click on any sentence in the left panel to inspect why it was flagged.
          </div>
        )}
      </div>
    </div>
  );
}
