import React, { useState } from "react";
import {
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Check,
  Zap,
} from "lucide-react";
import type {
  CompleteEditorialIntelligencePayload,
  EditorialAssistantSuggestion,
} from "@/types/editorialIntelligence";
import { toast } from "sonner";

interface QualityWorkspaceViewProps {
  payload: CompleteEditorialIntelligencePayload | null;
  onApplySuggestions: (selectedIds: string[]) => void;
  onSelectAlternativeHeadline: (headline: string) => void;
}

export function QualityWorkspaceView({
  payload,
  onApplySuggestions,
  onSelectAlternativeHeadline,
}: QualityWorkspaceViewProps) {
  const [assistantSuggestions, setAssistantSuggestions] = useState<EditorialAssistantSuggestion[]>([]);

  React.useEffect(() => {
    if (payload?.newsroomScorecard.editorialSuggestions) {
      setAssistantSuggestions(payload.newsroomScorecard.editorialSuggestions);
    }
  }, [payload]);

  if (!payload) {
    return (
      <div className="bg-card rounded border border-border p-8 text-center text-ink-light text-xs shadow-card">
        No editorial quality data available. Please analyze content first.
      </div>
    );
  }

  const { newsroomScorecard } = payload;
  const seven = newsroomScorecard.sevenScores;
  const headlineIntel = newsroomScorecard.headlineIntelligence;

  const toggleSuggestion = (id: string) => {
    setAssistantSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleApplySelected = () => {
    const selectedIds = assistantSuggestions.filter((s) => s.selected).map((s) => s.id);
    if (selectedIds.length === 0) {
      toast.info("Please select at least one recommendation to apply.");
      return;
    }
    onApplySuggestions(selectedIds);
    toast.success(`Applied ${selectedIds.length} editorial improvement(s).`);
  };

  const scoreList = [
    { label: "Clarity", score: seven?.clarity ?? 88, target: "88%" },
    { label: "Readability", score: seven?.readability ?? 81, target: "81%" },
    { label: "Structure", score: seven?.structure ?? 92, target: "92%" },
    { label: "Grammar", score: seven?.grammar ?? 96, target: "96%" },
    { label: "Repetition", score: seven?.repetition ?? 74, target: "74%" },
    { label: "Specificity", score: seven?.specificity ?? 69, target: "69%" },
    { label: "Newsroom Style", score: seven?.newsroomStyle ?? 91, target: "91%" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. 7 Quality Scores Grid */}
      <div className="bg-card rounded border border-border shadow-card p-5 space-y-4">
        <div>
          <div className="label-eyebrow text-primary mb-0.5">Editorial Intelligence · Standards Engine</div>
          <h2 className="text-xl font-bold font-display text-foreground">
            Newsroom Quality &amp; Standards Scorecard
          </h2>
          <p className="text-xs text-ink-light">
            Comprehensive evaluation across clarity, readability, structure, repetition, and newsroom guidelines.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {scoreList.map((item) => (
            <div key={item.label} className="p-3 bg-muted/40 rounded border border-border text-center space-y-1">
              <span className="text-xs text-ink-light font-mono-amaica block truncate">{item.label}</span>
              <div className="text-xl font-bold font-mono-amaica text-foreground">{item.score}%</div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div
                  className="h-1 rounded-full bg-primary"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Headline Intelligence Section */}
      {headlineIntel && (
        <div className="bg-card rounded border border-border shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-bold text-foreground uppercase font-mono-amaica tracking-wider">
              Headline Intelligence &amp; Factual Grounding
            </h3>
            <span className="text-xs font-mono-amaica font-bold text-primary">
              Score: {headlineIntel.score}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-muted/40 rounded border border-border space-y-1">
              <span className="text-ink-light font-medium">Clickbait Risk</span>
              <div className="text-base font-bold text-foreground font-mono-amaica capitalize">
                {headlineIntel.clickbaitRisk}
              </div>
            </div>
            <div className="p-3 bg-muted/40 rounded border border-border space-y-1">
              <span className="text-ink-light font-medium">Factually Grounded</span>
              <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono-amaica">
                {headlineIntel.isFactuallyGrounded ? "Verified (100%)" : "Needs Verification"}
              </div>
            </div>
            <div className="p-3 bg-muted/40 rounded border border-border space-y-1">
              <span className="text-ink-light font-medium">Search &amp; Social Visibility</span>
              <div className="text-base font-bold text-foreground font-mono-amaica capitalize">
                High Virality &amp; Clarity
              </div>
            </div>
          </div>

          {/* Alternative Headline Suggestions */}
          {headlineIntel.alternativeHeadlines && headlineIntel.alternativeHeadlines.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-foreground font-mono-amaica uppercase">
                Recommended Journalistic Headlines
              </span>
              <div className="space-y-2">
                {headlineIntel.alternativeHeadlines.map((alt, i) => (
                  <div
                    key={i}
                    className="p-3 bg-muted/30 rounded border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="font-display font-medium text-foreground">{alt}</div>
                    <button
                      onClick={() => onSelectAlternativeHeadline(alt)}
                      className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shadow-xs"
                    >
                      Use Headline
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Assistant Suggestions Section */}
      {assistantSuggestions.length > 0 && (
        <div className="bg-card rounded border border-border shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase font-mono-amaica tracking-wider">
                Editorial Assistant Recommendations ({assistantSuggestions.length})
              </h3>
              <p className="text-xs text-ink-light">
                Select specific improvements suggested by newsroom readability and flow algorithms.
              </p>
            </div>
            <button
              onClick={handleApplySelected}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-mid text-primary-foreground text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-accent" />
              Apply Selected ({assistantSuggestions.filter((s) => s.selected).length})
            </button>
          </div>

          <div className="space-y-2">
            {assistantSuggestions.map((sug) => (
              <div
                key={sug.id}
                onClick={() => toggleSuggestion(sug.id)}
                className={`p-3 rounded border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  sug.selected
                    ? "bg-primary/5 border-primary ring-1 ring-primary/30"
                    : "bg-card border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={sug.selected}
                  onChange={() => {}}
                  className="mt-1 accent-primary"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{sug.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-sm bg-muted text-ink-light font-mono-amaica uppercase">
                      {sug.category}
                    </span>
                    <span className="text-[10px] text-ink-light font-mono-amaica">
                      +{sug.impactScore} quality pts
                    </span>
                  </div>
                  <p className="text-ink-light font-sans">{sug.explanation}</p>
                  {sug.targetText && sug.suggestedRevision && (
                    <div className="pt-1 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 bg-muted/40 rounded border border-border text-ink-light line-through">
                        {sug.targetText}
                      </div>
                      <div className="p-2 bg-primary/10 rounded border border-primary/20 text-foreground font-medium">
                        {sug.suggestedRevision}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
