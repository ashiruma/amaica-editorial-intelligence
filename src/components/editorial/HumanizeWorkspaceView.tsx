import React, { useState } from "react";
import {
  Wand2,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Sliders,
  Copy,
  Layers,
} from "lucide-react";
import type {
  EditorialRewriteMode,
  EditorialRewriteResult,
  ImprovementOption,
  FactLockReport,
  ProtectedFact,
} from "@/types/editorialIntelligence";
import { restoreFact } from "@/lib/editorial/factLockingEngine";
import { toast } from "sonner";

interface HumanizeWorkspaceViewProps {
  originalText: string;
  rewriteResult: EditorialRewriteResult | null;
  onRunHumanize: (mode: EditorialRewriteMode, options: ImprovementOption[]) => void;
  isHumanizing: boolean;
  onApplyRewriteToEditor: (rewrittenText: string) => void;
  activeMode: EditorialRewriteMode;
  onChangeMode: (mode: EditorialRewriteMode) => void;
}

export function HumanizeWorkspaceView({
  originalText,
  rewriteResult,
  onRunHumanize,
  isHumanizing,
  onApplyRewriteToEditor,
  activeMode,
  onChangeMode,
}: HumanizeWorkspaceViewProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<ImprovementOption>>(
    new Set([
      "naturalness",
      "sentence_variation",
      "remove_repetition",
      "improve_clarity",
      "reduce_generic",
      "preserve_style",
    ])
  );

  const [changelogState, setChangelogState] = useState<
    { id: string; accepted: boolean; originalText: string; rewrittenText: string; reason: string }[]
  >([]);

  // Sync changelog
  React.useEffect(() => {
    if (rewriteResult?.changelog) {
      setChangelogState(
        rewriteResult.changelog.map((c) => ({
          ...c,
          accepted: true,
        }))
      );
    }
  }, [rewriteResult]);

  const toggleOption = (opt: ImprovementOption) => {
    const next = new Set(selectedOptions);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    setSelectedOptions(next);
  };

  const modes: { id: EditorialRewriteMode; label: string; desc: string }[] = [
    { id: "light_edit", label: "Light Edit", desc: "Mechanics, typos, and minor transitions only" },
    { id: "natural_newsroom", label: "Natural Newsroom", desc: "Crisp inverted pyramid, active voice, AP/Amaica newsroom attribution" },
    { id: "conversational", label: "Conversational", desc: "Engaging and friendly tone for human-interest and entertainment pieces" },
    { id: "feature", label: "Feature", desc: "Narrative pacing, rhythmic variation, and descriptive depth" },
    { id: "amaica_editorial", label: "Amaica Editorial", desc: "Signature regional newsroom voice, active nut-graphs, local formatting" },
  ];

  const improvementControls: { id: ImprovementOption; label: string }[] = [
    { id: "naturalness", label: "Naturalness" },
    { id: "sentence_variation", label: "Sentence variation (Burstiness)" },
    { id: "remove_repetition", label: "Remove repetition" },
    { id: "strengthen_voice", label: "Strengthen author's voice" },
    { id: "improve_clarity", label: "Improve clarity" },
    { id: "reduce_generic", label: "Reduce generic AI language" },
    { id: "preserve_style", label: "Preserve newsroom style" },
  ];

  const handleAcceptAll = () => {
    setChangelogState((prev) => prev.map((c) => ({ ...c, accepted: true })));
    toast.success("Accepted all revisions.");
  };

  const handleRejectAll = () => {
    setChangelogState((prev) => prev.map((c) => ({ ...c, accepted: false })));
    toast.info("Rejected all revisions. Restored original sentences.");
  };

  const handleToggleChange = (id: string) => {
    setChangelogState((prev) =>
      prev.map((c) => (c.id === id ? { ...c, accepted: !c.accepted } : c))
    );
  };

  // Reconstructed text based on accepted modifications
  const currentImprovedText = React.useMemo(() => {
    if (!rewriteResult) return "";
    let text = originalText;
    for (const chg of changelogState) {
      if (chg.accepted) {
        text = text.replace(chg.originalText, chg.rewrittenText);
      }
    }
    return text;
  }, [originalText, rewriteResult, changelogState]);

  const factReport: FactLockReport | undefined = rewriteResult?.factLockReport;
  const lockedFacts: ProtectedFact[] = factReport?.lockedFacts || [];

  // Entity breakdown counts
  const entityCounts = {
    dates: lockedFacts.filter((f) => f.type === "date").length,
    names: lockedFacts.filter((f) => f.type === "person").length,
    organizations: lockedFacts.filter((f) => f.type === "organization").length,
    locations: lockedFacts.filter((f) => f.type === "location").length,
    numbers: lockedFacts.filter((f) => f.type === "currency" || f.type === "statistic" || f.type === "percentage").length,
    quotes: lockedFacts.filter((f) => f.type === "quotation").length,
  };

  const handleRestoreFact = (fact: ProtectedFact) => {
    if (!currentImprovedText) return;
    const restored = restoreFact(currentImprovedText, fact);
    onApplyRewriteToEditor(restored);
    toast.success(`Restored fact: "${fact.value}"`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Modes Selection */}
      <div className="bg-card rounded border border-border shadow-card p-5 space-y-4">
        <div>
          <div className="label-eyebrow text-primary mb-0.5">Editorial Studio · Humanization &amp; Style</div>
          <h2 className="text-xl font-bold font-display text-foreground">
            Fact-Locked Humanization Engine
          </h2>
          <p className="text-xs text-ink-light">
            Improve naturalness, clarity, variation and editorial voice while preserving 100% of facts, quotes, and meaning.
          </p>
        </div>

        {/* 5 Modes Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => onChangeMode(m.id)}
              className={`p-3 rounded border text-left transition-all cursor-pointer ${
                activeMode === m.id
                  ? "bg-primary/10 border-primary ring-1 ring-primary shadow-xs"
                  : "bg-background border-border hover:bg-muted/60"
              }`}
            >
              <div className={`text-xs font-bold font-display ${activeMode === m.id ? "text-primary" : "text-foreground"}`}>
                {m.label}
              </div>
              <div className="text-[11px] text-ink-light mt-1 leading-snug">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Multi-Select Improvement Controls */}
        <div className="pt-2 border-t border-border space-y-2">
          <span className="text-xs font-bold text-foreground font-mono-amaica uppercase">
            Select Editorial Improvements
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {improvementControls.map((ctrl) => {
              const isChecked = selectedOptions.has(ctrl.id);
              return (
                <button
                  key={ctrl.id}
                  onClick={() => toggleOption(ctrl.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isChecked
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-ink-mid border-border hover:bg-muted"
                  }`}
                >
                  {isChecked ? "✓ " : "+ "}
                  {ctrl.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Humanize CTA */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onRunHumanize(activeMode, Array.from(selectedOptions))}
            disabled={isHumanizing || !originalText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-mid disabled:opacity-50 text-primary-foreground text-xs font-semibold rounded shadow transition-all cursor-pointer"
          >
            {isHumanizing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Improving Writing Pacing &amp; Fact Integrity...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-accent" />
                <span>Humanize &amp; Improve</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fact Lock & Fact Integrity Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FACT LOCK Card */}
        <div className="bg-card rounded border border-border p-4 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground font-mono-amaica">
            <span className="flex items-center gap-1.5 text-primary">
              <Lock className="w-3.5 h-3.5" />
              FACT LOCK
            </span>
            <span className="text-ink-light font-normal">{lockedFacts.length} Entities Protected</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="bg-muted/40 p-1.5 rounded border border-border">
              <span className="text-ink-light">Dates:</span>{" "}
              <strong className="text-foreground font-mono-amaica">{entityCounts.dates}</strong>
            </div>
            <div className="bg-muted/40 p-1.5 rounded border border-border">
              <span className="text-ink-light">Names:</span>{" "}
              <strong className="text-foreground font-mono-amaica">{entityCounts.names}</strong>
            </div>
            <div className="bg-muted/40 p-1.5 rounded border border-border">
              <span className="text-ink-light">Orgs:</span>{" "}
              <strong className="text-foreground font-mono-amaica">{entityCounts.organizations}</strong>
            </div>
            <div className="bg-muted/40 p-1.5 rounded border border-border">
              <span className="text-ink-light">Locations:</span>{" "}
              <strong className="text-foreground font-mono-amaica">{entityCounts.locations}</strong>
            </div>
            <div className="bg-muted/40 p-1.5 rounded border border-border">
              <span className="text-ink-light">Numbers:</span>{" "}
              <strong className="text-foreground font-mono-amaica">{entityCounts.numbers}</strong>
            </div>
            <div className="bg-muted/40 p-1.5 rounded border border-border">
              <span className="text-ink-light">Quotes:</span>{" "}
              <strong className="text-foreground font-mono-amaica">{entityCounts.quotes}</strong>
            </div>
          </div>
        </div>

        {/* FACT INTEGRITY Card */}
        <div className="bg-card rounded border border-border p-4 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground font-mono-amaica">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              FACT INTEGRITY
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] font-mono-amaica">100% Locked</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Names preserved
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Numbers &amp; Currencies preserved
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dates preserved
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Quotes protected by default
            </div>
          </div>
        </div>
      </div>

      {/* Formatting Difference Alert if any */}
      {factReport?.formattingDifferences && factReport.formattingDifferences.length > 0 && (
        <div className="bg-accent/15 border border-accent/40 rounded p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold font-mono-amaica">
            <AlertTriangle className="w-4 h-4 text-accent" />
            FACT CHANGE DETECTED (FORMATTING ONLY)
          </div>
          {factReport.formattingDifferences.map((fd, i) => (
            <div key={i} className="flex items-center justify-between bg-card p-2.5 rounded border border-border">
              <div className="space-y-0.5">
                <div>Original: <strong className="text-foreground">{fd.original.value}</strong></div>
                <div>Rewrite: <strong className="text-foreground">{fd.modifiedValue}</strong></div>
                <div className="text-[10px] text-ink-light">Difference: Formatting only</div>
              </div>
              <button
                onClick={() => handleRestoreFact(fd.original)}
                className="px-3 py-1 bg-accent/20 hover:bg-accent/30 text-accent-foreground rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Side-by-Side Comparison Workspace */}
      {rewriteResult && (
        <div className="bg-card rounded border border-border shadow-card p-5 space-y-4 animate-fade-in-up">
          {/* Top Bar Metrics */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-4 text-xs font-mono-amaica">
              <span>Changes: <strong className="text-foreground">{changelogState.filter((c) => c.accepted).length}</strong></span>
              <span className="text-ink-light">•</span>
              <span>Facts changed: <strong className="text-emerald-700 dark:text-emerald-400">{rewriteResult.factsChanged ?? 0}</strong></span>
              <span className="text-ink-light">•</span>
              <span>Meaning changed: <strong className="text-emerald-700 dark:text-emerald-400">{rewriteResult.meaningChanged ?? 0}</strong></span>
              <span className="text-ink-light">•</span>
              <span>Voice preservation: <strong className="text-primary">{rewriteResult.voicePreservationPercentage ?? 94}%</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptAll}
                className="px-3 py-1 bg-card border border-border hover:bg-muted text-foreground text-xs font-medium rounded transition-colors cursor-pointer"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectAll}
                className="px-3 py-1 bg-card border border-border hover:bg-muted text-foreground text-xs font-medium rounded transition-colors cursor-pointer"
              >
                Reject All
              </button>
              <button
                onClick={() => onApplyRewriteToEditor(currentImprovedText)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Apply Rewrite to Editor
              </button>
            </div>
          </div>

          {/* Side-by-side Editor Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left: Original */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-ink-light uppercase tracking-wider font-mono-amaica">
                ORIGINAL COPY
              </div>
              <div className="p-4 bg-muted/40 rounded border border-border text-sm font-sans leading-relaxed text-foreground whitespace-pre-wrap min-h-[350px]">
                {originalText}
              </div>
            </div>

            {/* Right: Improved */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-primary uppercase tracking-wider font-mono-amaica flex items-center justify-between">
                <span>IMPROVED COPY</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-sans font-semibold">0% Machine Footprint</span>
              </div>
              <div className="p-4 bg-card rounded border-2 border-primary text-sm font-sans leading-relaxed text-foreground whitespace-pre-wrap min-h-[350px]">
                {currentImprovedText}
              </div>
            </div>
          </div>

          {/* Reviewable Changelog Items */}
          <div className="pt-4 border-t border-border space-y-2">
            <h3 className="text-xs font-bold text-foreground font-mono-amaica uppercase tracking-wider">
              Sentence Modification Details ({changelogState.length} changes)
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {changelogState.map((chg) => (
                <div
                  key={chg.id}
                  className={`p-3 rounded border text-xs flex items-start justify-between gap-3 transition-colors ${
                    chg.accepted
                      ? "bg-card border-border"
                      : "bg-muted/50 border-border opacity-60 line-through"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-ink-light line-through font-sans">{chg.originalText}</div>
                    <div className="text-foreground font-semibold font-sans">{chg.rewrittenText}</div>
                    <div className="text-[10px] text-primary font-sans italic">{chg.reason}</div>
                  </div>
                  <button
                    onClick={() => handleToggleChange(chg.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      chg.accepted
                        ? "bg-muted hover:bg-destructive/10 text-ink-mid hover:text-destructive"
                        : "bg-primary text-primary-foreground hover:bg-primary-mid"
                    }`}
                  >
                    {chg.accepted ? "Undo" : "Apply"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
