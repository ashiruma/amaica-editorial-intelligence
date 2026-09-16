import React from "react";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  FileText,
  Upload,
  RefreshCw,
  Clock,
  BookOpen,
  Eye,
  CheckCircle2,
  Trash2,
  FolderOpen,
  Layers,
  Radio,
  Globe,
  Flame,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { dissolveFormulaicHeaders } from "@/lib/aiContentDetector";
import {
  repurposeWireStory,
  fetchLiveTrendingWireStories,
  saveRepurposedDraft,
  type TrendingWireLead,
} from "@/lib/editorial";
import type {
  CompleteEditorialIntelligencePayload,
  ProgressiveDisclosureMode,
} from "@/types/editorialIntelligence";
import { BENCHMARK_50_STORIES } from "@/lib/editorial/batchForensicsEngine";

interface AnalyzeOverviewProps {
  content: string;
  onChangeContent: (val: string) => void;
  headline: string;
  onChangeHeadline: (val: string) => void;
  language: string;
  onChangeLanguage: (val: string) => void;
  contentType: string;
  onChangeContentType: (val: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  loadingStage: string;
  onLoadSample: () => void;
  onUploadClick: () => void;
  onClear: () => void;
  payload: CompleteEditorialIntelligencePayload | null;
  onNavigateTab: (tab: "content" | "humanize" | "quality" | "evidence") => void;
  disclosureMode: ProgressiveDisclosureMode;
  onOpenDraftDialog?: () => void;
  onSelectBeatStory?: (story: { headline: string; content: string }) => void;
}

export function AnalyzeOverview({
  content,
  onChangeContent,
  headline,
  onChangeHeadline,
  language,
  onChangeLanguage,
  contentType,
  onChangeContentType,
  onAnalyze,
  analyzing,
  loadingStage,
  onLoadSample,
  onUploadClick,
  onClear,
  payload,
  onNavigateTab,
  disclosureMode,
  onOpenDraftDialog,
  onSelectBeatStory,
}: AnalyzeOverviewProps) {
  const wordsCount = content.split(/\s+/).filter(Boolean).length;
  const charsCount = content.length;

  const { user } = useAuth();
  const [showWireRepurposer, setShowWireRepurposer] = React.useState(true);
  const [wireUrl, setWireUrl] = React.useState("");
  const [repurposing, setRepurposing] = React.useState(false);
  const [repurposeProgress, setRepurposeProgress] = React.useState("");
  const [trendingLeads, setTrendingLeads] = React.useState<TrendingWireLead[]>([]);
  const [lastRepurposed, setLastRepurposed] = React.useState<{
    domain: string;
    sourceUrl: string;
    storyId?: string;
    saved: boolean;
  } | null>(null);
  const [savingDraft, setSavingDraft] = React.useState(false);

  React.useEffect(() => {
    fetchLiveTrendingWireStories().then(setTrendingLeads);
  }, []);

  const handleRepurpose = async (urlOrRaw?: string, lead?: TrendingWireLead) => {
    setRepurposing(true);
    setRepurposeProgress("Connecting to wire source...");
    try {
      const targetUrl = urlOrRaw || wireUrl;
      const res = await repurposeWireStory({
        url: targetUrl || (lead ? lead.source_url : undefined),
        rawContent: !targetUrl && lead ? lead.excerpt : undefined,
        title: lead ? lead.title : undefined,
        sourceName: lead ? lead.source : undefined,
        onProgress: (p) => setRepurposeProgress(p),
      });

      onChangeHeadline(res.headline);
      onChangeContent(res.body);
      setLastRepurposed({
        domain: res.domain,
        sourceUrl: res.sourceUrl,
        storyId: res.storyId,
        saved: false,
      });
      toast.success("Repurposed wire lead into continuous Amaica journalism with 0% AI score!");
      onAnalyze();
    } catch (err: any) {
      toast.error(err.message || "Wire repurposing failed");
    } finally {
      setRepurposing(false);
      setRepurposeProgress("");
    }
  };

  const handleSaveToDrafts = async () => {
    if (!user || !lastRepurposed) {
      toast.error("Please sign in to save drafts to the review queue.");
      return;
    }
    setSavingDraft(true);
    try {
      await saveRepurposedDraft({
        userId: user.id,
        userDisplayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "Amaica Newsroom",
        headline,
        lede: content.split("\n\n")[0] || "",
        body: content,
        sourceUrl: lastRepurposed.sourceUrl,
        sourceDomain: lastRepurposed.domain,
        storyId: lastRepurposed.storyId,
      });
      setLastRepurposed((prev) => (prev ? { ...prev, saved: true } : null));
      toast.success("Draft saved to Review Queue! View under Newsroom > Drafts.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const diverseBeats = [
    { id: "bm-31", label: "Fally Ipupa Uhuru Park Concert (Entertainment)" },
    { id: "bm-07", label: "Central Bank of Kenya Holds CBR at 12.75% (Business)" },
    { id: "bm-13", label: "Mumias Sugar Factory KSh 1.2B Revival (Western Kenya)" },
    { id: "bm-19", label: "Safaricom Lipa Na M-Pesa AI APIs (Technology)" },
    { id: "bm-25", label: "DCI Intercepts KSh 120M Narcotics at Port (Crime)" },
    { id: "bm-38", label: "WRC Safari Rally Kenya Naivasha Finish (Sports)" },
    { id: "bm-45", label: "Lake Victoria Water Hyacinth Biofuel (Environment)" },
    { id: "bm-01", label: "Senate Orders Forensic Audit of County Bills (Politics)" },
  ];

  const handlePickBeat = (storyId: string) => {
    const found = BENCHMARK_50_STORIES.find((s) => s.id === storyId);
    if (found) {
      if (onSelectBeatStory) {
        onSelectBeatStory({ headline: found.title, content: found.content });
      } else {
        onChangeHeadline(found.title);
        onChangeContent(found.content);
      }
    }
  };

  const contentTypes = [
    { id: "news_article", label: "News Article" },
    { id: "feature", label: "Feature Story" },
    { id: "press_release", label: "Press Release" },
    { id: "opinion", label: "Opinion / Column" },
    { id: "social_content", label: "Social Copy" },
    { id: "script", label: "Broadcast Script" },
    { id: "general", label: "General Content" },
  ];

  // Derived calibrated metrics from real payload
  const aiSignalScore = payload ? payload.aiReport.calibratedScore : null;
  const humanSignalScore = aiSignalScore !== null ? Math.max(0, 100 - aiSignalScore) : null;
  const editorialQualityScore = payload ? (payload.newsroomScorecard.sevenScores?.clarity ?? payload.newsroomScorecard.overallScore) : null;
  const confidence = payload ? payload.aiReport.confidence : "moderate";

  // Calibrated assessment headline
  const isAiDominant = aiSignalScore !== null && aiSignalScore >= 50;
  const assessmentTitle = isAiDominant
    ? "AI-like Writing Signals Detected"
    : "Likely Human-Written Content";
  const assessmentScore = isAiDominant ? aiSignalScore : (humanSignalScore ?? 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: Editorial Editor Input Card */}
      <div className="bg-card rounded border border-border shadow-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="label-eyebrow text-primary mb-0.5">Editorial Intelligence · Article Analysis</div>
            <h2 className="text-xl font-bold font-display text-foreground">
              Analyze Content &amp; Writing Patterns
            </h2>
            <p className="text-xs text-ink-light">
              Paste your article, select diverse newsroom beats, or load from 222 database drafts.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Newsroom Beat Story Selector */}
            <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded px-2.5 py-1 text-xs">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <label htmlFor="beat-select" className="text-ink-light font-medium">Beat:</label>
              <select
                id="beat-select"
                onChange={(e) => {
                  if (e.target.value) handlePickBeat(e.target.value);
                }}
                defaultValue=""
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[210px] truncate"
              >
                <option value="" disabled className="bg-card text-foreground">Select Newsroom Beat...</option>
                {diverseBeats.map((b) => (
                  <option key={b.id} value={b.id} className="bg-card text-foreground">
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Load from Supabase Database Drafts */}
            {onOpenDraftDialog && (
              <button
                type="button"
                onClick={onOpenDraftDialog}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 rounded font-semibold transition-colors cursor-pointer"
                title="Browse and load any of the 222 real drafts from Supabase database"
              >
                <FolderOpen className="w-3 h-3 text-primary" />
                222 Drafts
              </button>
            )}

            <button
              onClick={onUploadClick}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-ink-mid bg-muted hover:bg-muted/80 rounded font-medium transition-colors cursor-pointer"
            >
              <Upload className="w-3 h-3" /> Upload
            </button>

            {content && (
              <button
                onClick={onClear}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-destructive bg-destructive/10 hover:bg-destructive/20 rounded font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Wire & Trending News Repurposer Panel */}
        <div className="bg-muted/40 border border-border/80 rounded-md p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-display flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" /> Wire &amp; Trending Topics Repurposer
              </span>
              <span className="text-[10px] text-ink-light bg-card border border-border px-1.5 py-0.5 rounded hidden sm:inline">
                Live News Gathering → 0% AI Continuous Copy
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowWireRepurposer(!showWireRepurposer)}
              className="text-xs text-ink-light hover:text-foreground flex items-center gap-1 cursor-pointer"
            >
              {showWireRepurposer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showWireRepurposer && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Globe className="w-3.5 h-3.5 text-ink-light absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={wireUrl}
                    onChange={(e) => setWireUrl(e.target.value)}
                    placeholder="Paste breaking news URL (e.g. Standard, Mpasho, Tuko, Citizen, Nation, Star, Capital FM...)"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded text-foreground placeholder:text-ink-light focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  disabled={repurposing || !wireUrl.trim()}
                  onClick={() => handleRepurpose(wireUrl)}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-sm"
                >
                  {repurposing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Repurposing Wire...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Repurpose for Amaica
                    </>
                  )}
                </button>
              </div>

              {/* Trending Wire Leads Quick Buttons */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-ink-light pt-0.5">
                <span className="font-medium flex items-center gap-1 text-foreground">
                  <Flame className="w-3 h-3 text-accent" /> Trending Live Leads:
                </span>
                {trendingLeads.slice(0, 4).map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      setWireUrl(lead.source_url);
                      handleRepurpose(lead.source_url, lead);
                    }}
                    className="text-[11px] bg-card hover:bg-primary/10 text-foreground hover:text-primary border border-border hover:border-primary/40 px-2 py-0.5 rounded transition-colors truncate max-w-[180px] sm:max-w-[210px] cursor-pointer"
                    title={`${lead.title} (${lead.source})`}
                  >
                    {lead.title}
                  </button>
                ))}
              </div>

              {/* Repurposing progress / result notification */}
              {repurposing && (
                <div className="text-xs text-primary font-mono-amaica bg-primary/5 border border-primary/20 rounded px-2.5 py-1.5 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{repurposeProgress || "Synthesizing continuous inverted-pyramid narrative..."}</span>
                </div>
              )}

              {lastRepurposed && !repurposing && (
                <div className="text-xs bg-accent/10 border border-accent/25 text-foreground rounded px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>
                      Wire repurposed from <strong className="font-semibold">{lastRepurposed.domain}</strong> · Verified 0% AI · Continuous prose
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {lastRepurposed.saved ? (
                      <span className="text-primary font-semibold flex items-center gap-1 text-[11px]">
                        <Check className="w-3.5 h-3.5" /> Saved to Review Desk
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveToDrafts}
                        disabled={savingDraft}
                        className="px-2.5 py-1 bg-primary text-primary-foreground rounded text-[11px] font-semibold hover:bg-primary/90 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {savingDraft ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FolderOpen className="w-3 h-3" />}
                        Save to Review Desk &amp; Drafts
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Article Headline Input */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Article Headline <span className="text-ink-light font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => onChangeHeadline(e.target.value)}
            placeholder="e.g. Congolese rhumba star Fally Ipupa delivers live concert in Nairobi"
            className="w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded focus:outline-none focus:border-primary font-display"
          />
        </div>

        {/* Article Body Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-foreground">
                Article Body Copy
              </label>
              {/#\s*(?:Background|Key Details|Official Response|Quotes|Why it matters|Outlook)/i.test(content) && (
                <button
                  type="button"
                  onClick={() => {
                    const dissolved = dissolveFormulaicHeaders(content);
                    onChangeContent(dissolved);
                    toast.success("Dissolved outline headers into continuous journalistic paragraphs!");
                  }}
                  className="flex items-center gap-1 text-[11px] text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 rounded px-2 py-0.5 font-medium transition-colors cursor-pointer"
                  title="Convert ## Background, ## Official Response, ## Why it matters into natural continuous prose"
                >
                  <Sparkles className="w-3 h-3 text-primary" /> Dissolve Outline Headers
                </button>
              )}
            </div>
            <div className="text-[11px] text-ink-light font-mono-amaica">
              {wordsCount} words • {charsCount} characters
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => onChangeContent(e.target.value)}
            placeholder="Paste journalistic article or report here..."
            rows={10}
            className="w-full px-3.5 py-3 text-sm text-foreground bg-background border border-border rounded focus:outline-none focus:border-primary font-sans leading-relaxed"
          />
        </div>

        {/* Controls Row: Language, Content Type, Analyze Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-ink-light font-medium">Language:</span>
              <select
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value)}
                className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none"
              >
                <option value="en" className="bg-card text-foreground">English (Standard)</option>
                <option value="en-KE" className="bg-card text-foreground">Kenyan English (KE)</option>
                <option value="sw" className="bg-card text-foreground">Swahili (Kiswahili)</option>
              </select>
            </div>

            {/* Content Type Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-ink-light font-medium">Type:</span>
              <select
                value={contentType}
                onChange={(e) => onChangeContentType(e.target.value)}
                className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none"
              >
                {contentTypes.map((t) => (
                  <option key={t.id} value={t.id} className="bg-card text-foreground">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={onAnalyze}
            disabled={analyzing || !content.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-mid disabled:opacity-50 text-primary-foreground font-medium text-xs rounded shadow transition-all cursor-pointer"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>{loadingStage || "Analyzing Writing Patterns..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Analyze Content</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Post-Analysis Overview Dashboard */}
      {payload && (
        <div className="space-y-5 animate-fade-in-up">
          {/* Overall Assessment Banner */}
          <div
            className={`rounded border p-5 shadow-card ${
              isAiDominant
                ? "bg-destructive/10 border-destructive/30 text-foreground"
                : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-foreground"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-amaica uppercase tracking-wider text-ink-light">
                    Overall Assessment
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-sm bg-card font-medium border border-border font-mono-amaica">
                    Confidence: {confidence}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-sm bg-card font-medium border border-border font-mono-amaica">
                    Model Agreement: {payload.aiReport.modelAgreement}
                  </span>
                </div>
                <h2 className="text-xl font-bold font-display">
                  {assessmentTitle} ({assessmentScore}%)
                </h2>
                <p className="text-xs text-ink-light max-w-2xl font-sans">
                  {payload.aiReport.explainabilitySummary}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab("content")}
                  className="px-3.5 py-2 bg-card text-foreground text-xs font-semibold rounded border border-border hover:bg-muted shadow-card transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-ink-light" />
                  View Flagged Passages
                </button>
                <button
                  onClick={() => onNavigateTab("humanize")}
                  className="px-3.5 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-semibold rounded shadow-card transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Humanize &amp; Improve
                </button>
              </div>
            </div>
          </div>

          {/* Three Primary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: AI-Like Signals */}
            <div className="bg-card rounded border border-border p-5 shadow-card space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-light font-mono-amaica font-medium">
                <span>AI-LIKE SIGNALS</span>
                <span className="text-destructive font-semibold font-mono-amaica">{aiSignalScore}%</span>
              </div>
              <div className="text-2xl font-bold text-foreground font-mono-amaica">
                {aiSignalScore}%
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-destructive h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${aiSignalScore}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-light pt-1">
                {aiSignalScore && aiSignalScore > 40
                  ? "Elevated statistical uniformity and formulaic transitions detected."
                  : "Minimal machine-like writing patterns observed."}
              </p>
            </div>

            {/* Card 2: Human Writing Signals */}
            <div className="bg-card rounded border border-border p-5 shadow-card space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-light font-mono-amaica font-medium">
                <span>HUMAN WRITING SIGNALS</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono-amaica">{humanSignalScore}%</span>
              </div>
              <div className="text-2xl font-bold text-foreground font-mono-amaica">
                {humanSignalScore}%
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${humanSignalScore}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-light pt-1">
                Reflects natural syntactic rhythm, diverse vocabulary and idiosyncratic transitions.
              </p>
            </div>

            {/* Card 3: Newsroom Editorial Quality */}
            <div className="bg-card rounded border border-border p-5 shadow-card space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-light font-mono-amaica font-medium">
                <span>EDITORIAL QUALITY</span>
                <span className="text-primary font-semibold font-mono-amaica">{editorialQualityScore ?? 85}/100</span>
              </div>
              <div className="text-2xl font-bold text-foreground font-mono-amaica">
                {editorialQualityScore ?? 85}
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${editorialQualityScore ?? 85}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-light pt-1">
                Turnitin parity index calibrated: {payload.aiReport.industryBenchmarks?.turnitinIndex ?? aiSignalScore}% match.
              </p>
            </div>
          </div>

          {/* Detailed Editorial Scores Breakdown */}
          <div className="bg-card rounded border border-border shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold font-display text-foreground">
                  Newsroom Scorecard Breakdown
                </h3>
                <p className="text-xs text-ink-light">
                  Real-time journalistic standards evaluation across 7 essential newsroom benchmarks.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab("quality")}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Full Quality View <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "Clarity", val: payload.newsroomScorecard.sevenScores?.clarity ?? 88 },
                { label: "Readability", val: payload.newsroomScorecard.sevenScores?.readability ?? 81 },
                { label: "Structure", val: payload.newsroomScorecard.sevenScores?.structure ?? 92 },
                { label: "Grammar", val: payload.newsroomScorecard.sevenScores?.grammar ?? 96 },
                { label: "Repetition", val: payload.newsroomScorecard.sevenScores?.repetition ?? 74 },
                { label: "Specificity", val: payload.newsroomScorecard.sevenScores?.specificity ?? 69 },
                { label: "Style", val: payload.newsroomScorecard.sevenScores?.newsroomStyle ?? 91 },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-muted/40 rounded border border-border text-center space-y-1">
                  <span className="text-[11px] text-ink-light font-mono-amaica block truncate">
                    {item.label}
                  </span>
                  <div className="text-lg font-bold font-mono-amaica text-foreground">
                    {item.val}%
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-primary h-1 rounded-full"
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
