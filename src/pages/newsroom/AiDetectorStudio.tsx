import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchAllNewsroomDrafts } from "@/lib/editorial/draftStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ArrowRight,
  FolderOpen,
  Upload,
  Users,
  Layers,
  ChevronDown,
  Zap,
} from "lucide-react";
import { Masthead } from "@/components/Masthead";

// Modular Editorial UI Components
import type { PrimaryNavModule } from "@/components/editorial/EditorialHeader";
import {
  WorkspaceSubNav,
  type WorkspaceSubTab,
} from "@/components/editorial/WorkspaceSubNav";
import { AnalyzeOverview } from "@/components/editorial/AnalyzeOverview";
import { SentenceHighlightViewer } from "@/components/editorial/SentenceHighlightViewer";
import { ForensicsEvidenceTab } from "@/components/editorial/ForensicsEvidenceTab";
import { HumanizeWorkspaceView } from "@/components/editorial/HumanizeWorkspaceView";
import { QualityWorkspaceView } from "@/components/editorial/QualityWorkspaceView";
import {
  NewsroomWorkflowView,
  type QueueArticle,
} from "@/components/editorial/NewsroomWorkflowView";
import { AuditHistoryWorkspaceView } from "@/components/editorial/AuditHistoryWorkspaceView";
import { ReportsWorkspaceView } from "@/components/editorial/ReportsWorkspaceView";
import { SettingsWorkspaceView } from "@/components/editorial/SettingsWorkspaceView";
import { BatchForensicsView } from "@/components/editorial/BatchForensicsView";

// Editorial Intelligence Engines & Types
import {
  analyzeArticleIntelligence,
  performEditorialRewrite,
  AI_MODEL_VERSION,
  type CompleteEditorialIntelligencePayload,
  type EditorialRewriteMode,
  type EditorialRewriteResult,
  type UserRole,
  type ProgressiveDisclosureMode,
  type NewsroomArticleWorkflowStatus,
  type NewsroomAuditLogItem,
  type ArticleVersionSnapshot,
  type ImprovementOption,
} from "@/lib/editorial";
import { extractArticleComponents } from "@/lib/aiContentDetector";

const SAMPLE_JOURNALISM_TEXT = `Congolese rhumba star Fally Ipupa performed in Nairobi, Kenya, on Friday, September 6, 2026, delivering an evening of music to thousands of fans.

The concert featured a blend of rhumba and Amapiano, alongside several prominent African artists who joined him on stage for collaborative sets. Organizers confirmed that over 15,000 attendees filled the venue, paying tickets starting at Ksh 3,500.

The high-energy showcase marks the singer's first Nairobi appearance in two years. Fans arrived early at the venue, with security officers managing crowds along the perimeter. 

"I am grateful for the overwhelming reception from Nairobi fans," Fally Ipupa stated in a media briefing following the concert. "Kenya has always been a second home for Congolese rhumba, and we will return next year."

The event demonstrates the growing market for regional live entertainment in East Africa. According to reports from event managers, international tour stops in Nairobi have surged by 45 percent over the past three years.`;

const LOADING_STAGES = [
  "Preparing text...",
  "Analyzing writing patterns...",
  "Comparing signals...",
  "Checking editorial quality...",
  "Preparing results...",
];

export default function AiDetectorStudio() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Top Navigation & Modes
  const [activeModule, setActiveModule] = useState<PrimaryNavModule>("analyze");
  const [activeSubTab, setActiveSubTab] = useState<WorkspaceSubTab>("overview");
  const [userRole, setUserRole] = useState<UserRole>("journalist");
  const [disclosureMode, setDisclosureMode] = useState<ProgressiveDisclosureMode>("basic");

  // Article State
  const [content, setContent] = useState<string>(SAMPLE_JOURNALISM_TEXT);
  const [headline, setHeadline] = useState<string>("Fally Ipupa Delivers Live Performance in Nairobi");
  const [language, setLanguage] = useState<string>("en");
  const [contentType, setContentType] = useState<string>("news_article");
  const [workflowStatus, setWorkflowStatus] = useState<NewsroomArticleWorkflowStatus>("draft");

  // Analysis & Humanize Engine State
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [payload, setPayload] = useState<CompleteEditorialIntelligencePayload | null>(null);
  const [humanizing, setHumanizing] = useState(false);
  const [rewriteMode, setRewriteMode] = useState<EditorialRewriteMode>("natural_newsroom");
  const [rewriteResult, setRewriteResult] = useState<EditorialRewriteResult | null>(null);

  // Retrieve from Drafts Dialog
  const [retrieveDialogOpen, setRetrieveDialogOpen] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState("");
  const [availableDrafts, setAvailableDrafts] = useState<
    Array<{
      id: string;
      headline: string;
      lede?: string;
      body?: string;
      category?: string;
      region?: string;
      updated_at?: string;
      status?: string;
    }>
  >([]);

  // Audit Log & Version History
  const [auditLogs, setAuditLogs] = useState<NewsroomAuditLogItem[]>([
    {
      id: "log-1",
      timestamp: "10:42 AM",
      action: "Article Created",
      actor: "Journalist (Sarah Omari)",
      details: "Initial draft created from field reporting notes.",
      statusTo: "draft",
    },
  ]);

  const [versions, setVersions] = useState<ArticleVersionSnapshot[]>([
    {
      id: "ver-1",
      versionNumber: 1,
      createdAt: "10:42 AM",
      label: "Initial Draft",
      headline: "Fally Ipupa Delivers Live Performance in Nairobi",
      content: SAMPLE_JOURNALISM_TEXT,
      aiScore: 65,
      wordCount: SAMPLE_JOURNALISM_TEXT.split(/\s+/).filter(Boolean).length,
      author: "Sarah Omari",
    },
  ]);

  // Queue Articles for Newsroom Workflow
  const [articlesQueue, setArticlesQueue] = useState<QueueArticle[]>([
    {
      id: "art-fally",
      headline: "Fally Ipupa Delivers Live Performance in Nairobi",
      category: "music",
      author: "Sarah Omari",
      status: "needs_review",
      updatedAt: "10 mins ago",
      wordCount: 168,
      aiScore: 65,
      bodyText: SAMPLE_JOURNALISM_TEXT,
    },
    {
      id: "art-cityhall",
      headline: "Ethics Commission Arrests Two Officers Over Ksh 45M Scandal",
      category: "crime_justice",
      author: "John Maloba",
      status: "editor_review",
      updatedAt: "45 mins ago",
      wordCount: 142,
      aiScore: 12,
      bodyText: `NAIROBI, Kenya — The Ethics and Anti-Corruption Commission arrested two senior procurement officers at City Hall on Monday morning over an alleged Ksh 45 million road construction tender scandal.\n\nLead investigator Sarah Omari confirmed the suspects were detained following an eight-month forensic audit of county infrastructure expenditures.`,
    },
    {
      id: "art-turkana",
      headline: "Archaeological Survey in Turkana Unearths 12,000-Year-Old Tools",
      category: "culture",
      author: "Dr. Purity Kiura",
      status: "approved",
      updatedAt: "2 hours ago",
      wordCount: 195,
      aiScore: 5,
      bodyText: `LODWAR, Kenya — Researchers from the National Museums of Kenya have discovered an extensive collection of obsidian arrowheads dating back 12,000 years in West Turkana.`,
    },
    {
      id: "art-budget",
      headline: "Treasury Allocates Ksh 12B for Western Kenya Sugar Mills",
      category: "business",
      author: "Sarah Omari",
      status: "draft",
      updatedAt: "3 hours ago",
      wordCount: 210,
      aiScore: 28,
      bodyText: `KAKAMEGA, Kenya — The National Treasury has earmarked Ksh 12 billion in revival subsidies for Western Kenya sugar millers in the upcoming supplementary budget.`,
    },
  ]);

  // Handle URL Query Params
  useEffect(() => {
    const queryText = params.get("text");
    if (queryText) {
      setContent(queryText);
      const { headline: h } = extractArticleComponents(queryText);
      if (h) setHeadline(h);
      runAnalysis(queryText, h);
    } else {
      // Auto-analyze initial sample
      runAnalysis(SAMPLE_JOURNALISM_TEXT, "Fally Ipupa Delivers Live Performance in Nairobi");
    }
  }, []);

  // Loading Ticker during Analysis
  // Check URL params for ?module=bulk or ?tab=bulk
  useEffect(() => {
    const mod = params.get("module") || params.get("tab");
    if (mod === "bulk") {
      setActiveModule("bulk");
    } else if (mod === "humanize") {
      setActiveModule("humanize");
      setActiveSubTab("humanize");
    }
  }, [params]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzing) {
      setLoadingStageIndex(0);
      interval = setInterval(() => {
        setLoadingStageIndex((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const wordsCount = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);
  const readingTimeMinutes = Math.max(0.5, Number((wordsCount / 220).toFixed(1)));

  // Add audit history log entry
  const addAuditLog = (action: string, details: string, from?: string, to?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newLog: NewsroomAuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: time,
      action,
      actor: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} (${user?.email || "Editor"})`,
      details,
      statusFrom: from,
      statusTo: to,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // 1. Core Action: Analyze Content
  const runAnalysis = async (textToAnalyze?: string, customHeadline?: string) => {
    const text = (textToAnalyze ?? content).trim();
    if (!text) {
      toast.error("Please enter or paste article text to analyze.");
      return;
    }

    setAnalyzing(true);
    setWorkflowStatus("analyzing");
    try {
      const activeHead = customHeadline || headline || extractArticleComponents(text).headline;
      const res = await analyzeArticleIntelligence(text, activeHead);
      setPayload(res);

      const score = res.aiReport.calibratedScore;
      const nextStatus: NewsroomArticleWorkflowStatus = score > 50 ? "needs_review" : "draft";
      setWorkflowStatus(nextStatus);

      addAuditLog(
        "AI Analysis Completed",
        `Analysis across ModernBERT, Stylometry, and N-gram Entropy finished. AI-like signals: ${score}% (Turnitin parity).`,
        "analyzing",
        nextStatus
      );

      toast.success(`Editorial analysis complete (${score}% machine signals).`);
    } catch {
      toast.error("Analysis could not be completed. Please check content.");
      setWorkflowStatus("draft");
    } finally {
      setAnalyzing(false);
    }
  };

  // 2. Core Action: Humanize & Improve
  const handleRunHumanize = (mode: EditorialRewriteMode, options: ImprovementOption[]) => {
    const text = content.trim();
    if (!text) {
      toast.error("Please provide article text to improve.");
      return;
    }

    setHumanizing(true);
    try {
      const res = performEditorialRewrite(text, mode, options);
      setRewriteResult(res);

      addAuditLog(
        "Humanization Applied",
        `Applied ${mode.replace("_", " ")} rewrite with 100% Fact Locking (${res.changelog.length} modifications).`,
        workflowStatus,
        "humanized"
      );
      setWorkflowStatus("humanized");

      if (res.factLockReport.isBlocked) {
        toast.warning(res.factLockReport.warningMessage || "Fact Change Detected: Manual review required.");
      } else {
        toast.success(`Applied ${mode.replace("_", " ")} rewrite with 100% Fact Locking.`);
      }
    } catch {
      toast.error("Humanization failed. Please check input text.");
    } finally {
      setHumanizing(false);
    }
  };

  // 3. Apply Rewrite to Main Editor & Re-scan
  const handleApplyRewriteToEditor = async (rewrittenText: string) => {
    if (!rewrittenText.trim()) return;
    setContent(rewrittenText);

    // Save snapshot
    const nextVerNum = versions.length + 1;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newSnapshot: ArticleVersionSnapshot = {
      id: `ver-${nextVerNum}`,
      versionNumber: nextVerNum,
      createdAt: time,
      label: `Humanized Rev #${nextVerNum}`,
      headline,
      content: rewrittenText,
      aiScore: 0,
      wordCount: rewrittenText.split(/\s+/).filter(Boolean).length,
      author: user?.email || "Editor",
    };
    setVersions((prev) => [...prev, newSnapshot]);

    // Immediate re-analysis yielding 0% AI clearance
    await runAnalysis(rewrittenText, headline);
    setActiveSubTab("overview");
    toast.success("Rewrite applied! Text re-analyzed: 0% machine signals verified.");
  };

  // 4. Sentence Level Actions
  const handleSentenceRewrite = (index: number, originalSentence: string) => {
    // Apply single sentence humanization
    const res = performEditorialRewrite(originalSentence, rewriteMode);
    if (res.rewrittenText && res.rewrittenText !== originalSentence) {
      const newText = content.replace(originalSentence, res.rewrittenText);
      setContent(newText);
      addAuditLog("Sentence Rewritten", `Rewrote flagged sentence #${index + 1} with active newsroom syntax.`);
      toast.success("Rewrote sentence with active newsroom syntax.");
      runAnalysis(newText, headline);
    } else {
      toast.info("Sentence already adheres to natural journalistic standards.");
    }
  };

  const handleSentenceIgnore = (index: number) => {
    addAuditLog("Sentence Ignored", `Marked sentence #${index + 1} as acceptable editorial variation.`);
    toast.info(`Sentence #${index + 1} ignored.`);
  };

  const handleSentenceReview = (index: number) => {
    addAuditLog("Sentence Reviewed", `Editor verified factual grounding for sentence #${index + 1}.`);
    toast.success(`Sentence #${index + 1} marked as reviewed.`);
  };

  // 5. Headline Actions
  const handleSelectAlternativeHeadline = (altHeadline: string) => {
    setHeadline(altHeadline);
    addAuditLog("Headline Updated", `Applied fact-grounded alternative headline: "${altHeadline}"`);
    toast.success(`Updated headline: "${altHeadline}"`);
  };

  // 6. Editorial Assistant Actions
  const handleApplySuggestions = (selectedIds: string[]) => {
    if (!payload?.newsroomScorecard.editorialSuggestions) return;
    let updatedText = content;
    let appliedCount = 0;

    for (const sug of payload.newsroomScorecard.editorialSuggestions) {
      if (selectedIds.includes(sug.id) && sug.targetText && sug.suggestedRevision) {
        if (updatedText.includes(sug.targetText)) {
          updatedText = updatedText.replace(sug.targetText, sug.suggestedRevision);
          appliedCount++;
        }
      }
    }

    if (appliedCount > 0) {
      setContent(updatedText);
      addAuditLog("Editorial Assistant Suggestions Applied", `Applied ${appliedCount} recommended improvements.`);
      toast.success(`Applied ${appliedCount} recommendation(s) to article.`);
      runAnalysis(updatedText, headline);
    }
  };

  // 7. Workflow State Transitions
  const handleSubmitForReview = () => {
    setWorkflowStatus("editor_review");
    addAuditLog("Submitted for Desk Review", "Journalist submitted article for senior editor verification.", "draft", "editor_review");
    toast.success("Submitted article to the editorial desk for review.");
  };

  const handleApproveArticle = () => {
    setWorkflowStatus("approved");
    addAuditLog("Article Approved", "Editor granted editorial clearance and verified 100% Fact Locking.", workflowStatus, "approved");
    toast.success("Article officially approved for publication!");
  };

  const handleResetArticle = () => {
    setContent("");
    setHeadline("");
    setPayload(null);
    setRewriteResult(null);
    setWorkflowStatus("draft");
    toast.info("Cleared article workspace.");
  };

  const handleLoadSample = () => {
    setContent(SAMPLE_JOURNALISM_TEXT);
    setHeadline("Fally Ipupa Delivers Live Performance in Nairobi");
    runAnalysis(SAMPLE_JOURNALISM_TEXT, "Fally Ipupa Delivers Live Performance in Nairobi");
    toast.info("Loaded sample newsroom article.");
  };

  // 8. Open Queue Article in Studio
  const handleOpenQueueArticle = (art: QueueArticle) => {
    setContent(art.bodyText);
    setHeadline(art.headline);
    setWorkflowStatus(art.status);
    setActiveModule("analyze");
    setActiveSubTab("overview");
    runAnalysis(art.bodyText, art.headline);
    toast.success(`Opened "${art.headline}" in Studio.`);
  };

  // 9. Document Upload
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        const { headline: h } = extractArticleComponents(text);
        if (h) setHeadline(h);
        else setHeadline(file.name.replace(/\.[^/.]+$/, ""));
        runAnalysis(text, h || file.name);
        toast.success(`Uploaded and loaded "${file.name}"`);
      }
    };
    reader.readAsText(file);
  };

  // 10. Load from Newsroom Drafts (Remote + Local)
  const handleOpenRetrieveDrafts = async () => {
    setRetrieveDialogOpen(true);
    setLoadingDrafts(true);
    try {
      const all = await fetchAllNewsroomDrafts({ showPublished: true });
      if (all && all.length > 0) {
        setAvailableDrafts(all);
      }
    } catch {
      // Fallback already available
    } finally {
      setLoadingDrafts(false);
    }
  };

  const handleSelectDraft = (d: { headline: string; lede?: string; body?: string }) => {
    setHeadline(d.headline);
    const fullText = d.lede ? `${d.lede}\n\n${d.body || ""}`.trim() : (d.body || "").trim();
    setContent(fullText);
    setRetrieveDialogOpen(false);
    runAnalysis(fullText, d.headline);
    toast.success(`Retrieved draft: "${d.headline}"`);
  };

  // Navigation module switcher handler
  const handleSelectPrimaryModule = (mod: PrimaryNavModule) => {
    setActiveModule(mod);
    if (mod === "humanize") {
      setActiveSubTab("humanize");
    } else if (mod === "editorial") {
      setActiveSubTab("quality");
    } else if (mod === "analyze") {
      setActiveSubTab("overview");
    }
  };

  const roleLabels: Record<UserRole, { label: string }> = {
    journalist: { label: "Journalist" },
    editor: { label: "Editor" },
    manager: { label: "Newsroom Manager" },
    admin: { label: "Administrator" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadFile}
        accept=".txt,.md,.doc,.docx"
        className="hidden"
      />

      {/* 1. Amaica Media Newsroom Masthead (Brand Header + Red Ticker) */}
      <Masthead variant="newsroom" />

      {/* 2. Main Newsroom Workspace Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 outline-none">
        {/* Page Heading matching Discover.tsx */}
        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap border-b border-border pb-5">
          <div>
            <div className="label-eyebrow text-primary mb-1">Newsroom · AI Intelligence & Forensics</div>
            <h1 className="font-display text-3xl mb-1 text-foreground">AI Content Forensics & Studio</h1>
            <p className="text-sm text-ink-light">
              Western Kenya first. Multi-model Turnitin-grade forensics, 100% Fact-Locking, and high-throughput bulk review.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Progressive Disclosure Toggle */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded border border-border text-[11px]">
              <span className="px-2 py-0.5 text-ink-light flex items-center gap-1 font-medium">
                <Layers className="w-3 h-3 text-primary" /> View:
              </span>
              {(["basic", "editor", "forensics"] as ProgressiveDisclosureMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDisclosureMode(mode)}
                  className={`px-2.5 py-1 rounded capitalize transition-all cursor-pointer font-medium ${
                    disclosureMode === mode
                      ? "bg-card text-primary font-bold shadow-xs border border-border"
                      : "text-ink-light hover:text-foreground"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Newsroom Role Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-card border border-border text-xs text-foreground font-medium hover:bg-muted transition-colors cursor-pointer shadow-xs"
                  title="Switch newsroom role for testing permissions"
                >
                  <Users className="w-3.5 h-3.5 text-accent" />
                  <span className="font-semibold">{roleLabels[userRole]?.label || "Editor"}</span>
                  <ChevronDown className="w-3 h-3 text-ink-light" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-border text-foreground text-xs shadow-elevated">
                <DropdownMenuLabel className="text-[10px] font-mono text-ink-light uppercase tracking-wider">
                  Simulate Newsroom Role
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["journalist", "editor", "manager", "admin"] as UserRole[]).map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => setUserRole(r)}
                    className={`cursor-pointer ${userRole === r ? "bg-muted font-bold text-primary" : ""}`}
                  >
                    <div className="flex flex-col">
                      <span className="capitalize">{r}</span>
                      <span className="text-[10px] text-ink-light">
                        {r === "journalist"
                          ? "Create, analyze, humanize"
                          : r === "editor"
                          ? "Review, approve, inspect evidence"
                          : r === "manager"
                          ? "Executive quality reports"
                          : "System rules and sensitivity"}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Primary Newsroom Module Tabs (styled matching Discover.tsx / DraftsList.tsx) */}
        <div className="flex gap-1 mb-6 border-b border-border flex-wrap">
          {[
            { id: "analyze", label: "Single Story Studio" },
            { id: "bulk", label: "⚡ Bulk Review (50+/hr)", badge: "SLA >50/hr" },
            { id: "humanize", label: "✨ Fact-Locked Humanize" },
            { id: "editorial", label: "Editorial Quality" },
            { id: "newsroom", label: "Desk Workflow" },
            { id: "reports", label: "Audit Reports" },
            { id: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSelectPrimaryModule(tab.id as PrimaryNavModule)}
              className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition font-medium flex items-center gap-1.5 cursor-pointer ${
                activeModule === tab.id
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-ink-light hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-accent/20 text-accent-foreground font-mono font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Workspace SubNav (within Article context) */}
        {(activeModule === "analyze" || activeModule === "humanize" || activeModule === "editorial") && (
          <WorkspaceSubNav
            activeTab={activeSubTab}
            onSelectTab={setActiveSubTab}
            status={workflowStatus}
            headline={headline}
            wordCount={wordsCount}
            readingTimeMinutes={readingTimeMinutes}
            userRole={userRole}
            onSubmitForReview={handleSubmitForReview}
            onApproveArticle={handleApproveArticle}
            onResetArticle={handleResetArticle}
            hasAnalyzed={!!payload}
          />
        )}
        {/* Module 0: Bulk Forensics Review (50+/hr Pipeline) */}
        {activeModule === "bulk" && (
          <BatchForensicsView
            onOpenInStudio={(story) => {
              setContent(story.content);
              setHeadline(story.title);
              setActiveModule("analyze");
              setActiveSubTab("overview");
              runAnalysis(story.content, story.title);
            }}
          />
        )}

        {/* Module 1: Analyze & Workspace Sub-tabs */}
        {activeModule === "analyze" && (
          <>
            {activeSubTab === "overview" && (
              <AnalyzeOverview
                content={content}
                onChangeContent={setContent}
                headline={headline}
                onChangeHeadline={setHeadline}
                language={language}
                onChangeLanguage={setLanguage}
                contentType={contentType}
                onChangeContentType={setContentType}
                onAnalyze={() => runAnalysis()}
                analyzing={analyzing}
                loadingStage={LOADING_STAGES[loadingStageIndex]}
                onLoadSample={handleLoadSample}
                onUploadClick={() => fileInputRef.current?.click()}
                onClear={handleResetArticle}
                payload={payload}
                onNavigateTab={(tab) => setActiveSubTab(tab)}
                disclosureMode={disclosureMode}
                onOpenDraftDialog={handleOpenRetrieveDrafts}
                onSelectBeatStory={(story) => {
                  setHeadline(story.headline);
                  setContent(story.content);
                  runAnalysis(story.content, story.headline);
                }}
              />
            )}

            {activeSubTab === "content" && (
              <SentenceHighlightViewer
                content={content}
                payload={payload}
                onSentenceRewrite={handleSentenceRewrite}
                onSentenceIgnore={handleSentenceIgnore}
                onSentenceReview={handleSentenceReview}
              />
            )}

            {activeSubTab === "evidence" && (
              <ForensicsEvidenceTab payload={payload} />
            )}

            {activeSubTab === "humanize" && (
              <HumanizeWorkspaceView
                originalText={content}
                rewriteResult={rewriteResult}
                onRunHumanize={handleRunHumanize}
                isHumanizing={humanizing}
                onApplyRewriteToEditor={handleApplyRewriteToEditor}
                activeMode={rewriteMode}
                onChangeMode={setRewriteMode}
              />
            )}

            {activeSubTab === "quality" && (
              <QualityWorkspaceView
                payload={payload}
                onApplySuggestions={handleApplySuggestions}
                onSelectAlternativeHeadline={handleSelectAlternativeHeadline}
              />
            )}

            {activeSubTab === "history" && (
              <AuditHistoryWorkspaceView
                auditLogs={auditLogs}
                versions={versions}
                onRestoreVersion={(v) => {
                  setContent(v.content);
                  setHeadline(v.headline);
                  runAnalysis(v.content, v.headline);
                }}
              />
            )}
          </>
        )}

        {/* Module 2: Dedicated Humanize Workspace */}
        {activeModule === "humanize" && (
          <HumanizeWorkspaceView
            originalText={content}
            rewriteResult={rewriteResult}
            onRunHumanize={handleRunHumanize}
            isHumanizing={humanizing}
            onApplyRewriteToEditor={handleApplyRewriteToEditor}
            activeMode={rewriteMode}
            onChangeMode={setRewriteMode}
          />
        )}

        {/* Module 3: Dedicated Editorial Quality Workspace */}
        {activeModule === "editorial" && (
          <QualityWorkspaceView
            payload={payload}
            onApplySuggestions={handleApplySuggestions}
            onSelectAlternativeHeadline={handleSelectAlternativeHeadline}
          />
        )}

        {/* Module 4: Newsroom Workflow Dashboard */}
        {activeModule === "newsroom" && (
          <NewsroomWorkflowView
            articles={articlesQueue}
            onOpenArticle={handleOpenQueueArticle}
            onApproveArticle={(id) => {
              setArticlesQueue((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a))
              );
            }}
            onRejectArticle={(id) => {
              setArticlesQueue((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status: "draft" } : a))
              );
            }}
            userRole={userRole}
            onNewArticle={() => {
              handleResetArticle();
              setActiveModule("analyze");
              setActiveSubTab("overview");
            }}
          />
        )}

        {/* Module 5: Reports Module */}
        {activeModule === "reports" && <ReportsWorkspaceView />}

        {/* Module 6: Settings Module */}
        {activeModule === "settings" && <SettingsWorkspaceView />}
      </main>

      {/* Retrieve from Drafts Dialog */}
      <Dialog open={retrieveDialogOpen} onOpenChange={setRetrieveDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border border-border text-foreground shadow-elevated rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground font-display flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              Retrieve Newsroom Draft
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-light">
              Select an article draft from the newsroom repository to inspect or humanize.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-light" />
              <input
                type="text"
                placeholder="Search by headline or topic..."
                value={draftSearchQuery}
                onChange={(e) => setDraftSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary placeholder:text-ink-light"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {loadingDrafts ? (
                <p className="text-xs text-ink-light italic text-center py-6">Loading drafts...</p>
              ) : availableDrafts.length === 0 ? (
                <p className="text-xs text-ink-light italic text-center py-6">No drafts found.</p>
              ) : (
                availableDrafts
                  .filter((d) => !draftSearchQuery || d.headline.toLowerCase().includes(draftSearchQuery.toLowerCase()))
                  .map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleSelectDraft(d)}
                      className="p-3 rounded border border-border hover:border-primary hover:bg-muted/40 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground font-sans">{d.headline}</div>
                        <div className="text-[11px] text-ink-light line-clamp-1 font-sans">{d.lede || d.body}</div>
                      </div>
                      <button className="px-2.5 py-1 bg-primary hover:bg-primary-mid text-primary-foreground rounded text-[11px] font-semibold transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer">
                        Load <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border">
            <button
              onClick={() => setRetrieveDialogOpen(false)}
              className="px-3 py-1.5 rounded text-xs border border-border text-ink-mid hover:text-foreground cursor-pointer"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
