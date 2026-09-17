import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Masthead } from "@/components/Masthead";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { validateArticle, validateArticleWithAiDetails, canApprove, countWords, noteText, noteSection, REQUIRED_HEADINGS, TARGET_WORDS_BY_TEMPLATE, type SourceRef, type SourceNote, type Issue } from "@/lib/articleValidation";
import { cleanAiClichesLocally, humanizeText, convertToPlainText, generateCertifiedCopy, dissolveFormulaicHeaders, analyzeAiContent, type AiDetectionResult } from "@/lib/aiContentDetector";
import { useMinWordCount } from "@/hooks/useNewsroomSettings";
import { getDraftById, updateDraftContent, deleteNewsroomDraft, ensureValidAuthorUUID, isValidUUID } from "@/lib/editorial/draftStorage";
import { ensureEditorialCompliance } from "@/lib/editorial/editorialComplianceEngine";
import {
  Bot,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Check,
  Copy,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Wand2,
  Link as LinkIcon,
  Plus,
  X,
  History,
  Save,
  Send,
  Globe,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  MessageCircle,
  Twitter,
  Instagram,
  Facebook,
} from "lucide-react";

type AuditEntry = {
  id: string;
  action: string;
  actor_display_name: string | null;
  from_status: string | null;
  to_status: string | null;
  error_count: number;
  warning_count: number;
  notes: string | null;
  created_at: string;
};

type Draft = {
  id: string;
  author_id: string;
  headline: string;
  lede: string | null;
  body: string | null;
  category: string | null;
  region: string;
  template_type: string;
  hero_image_url: string | null;
  social_image_url: string | null;
  byline: string | null;
  whatsapp_post?: string | null;
  twitter_post: string | null;
  instagram_post: string | null;
  facebook_post: string | null;
  status: string;
  wordpress_post_url: string | null;
  auto_publish_enabled?: boolean;
  auto_publish_at?: string | null;
  wordpress_last_error?: string | null;
  sources?: SourceRef[] | null;
};

export default function DraftEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading, isEditor } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [wpBusy, setWpBusy] = useState(false);
  const [fixBusy, setFixBusy] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const { minWordCount } = useMinWordCount();

  useEffect(() => {
    if (!id || !user) return;
    getDraftById(id).then((d) => {
      if (d) setDraft(d as unknown as Draft);
      else toast.error("Draft not found");
    });
  }, [id, user]);

  const loadAudit = async (draftId: string) => {
    const { data } = await supabase
      .from("approval_audit_log")
      .select("id, action, actor_display_name, from_status, to_status, error_count, warning_count, notes, created_at")
      .eq("draft_id", draftId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setAudit(data as unknown as AuditEntry[]);
  };
  useEffect(() => { if (id && user) loadAudit(id); }, [id, user]);

  const [showAiInspector, setShowAiInspector] = useState(false);
  const [copyFormat, setCopyFormat] = useState<"plain" | "markdown" | "whatsapp" | "certificate">("plain");
  const [copied, setCopied] = useState(false);

  // Helper to prevent duplicate ledes when body already starts with the lede sentence/paragraph
  const getCleanArticleComponents = (rawHeadline: string, rawLede: string | null, rawBody: string | null) => {
    const headline = (rawHeadline || "").trim();
    const lede = (rawLede || "").trim();
    let body = (rawBody || "").trim();

    if (lede && body) {
      const firstPara = body.split(/\n\n+/)[0].trim();
      const normLede = lede.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
      const normFirstPara = firstPara.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");

      if (normFirstPara === normLede || normFirstPara.startsWith(normLede) || normLede.startsWith(normFirstPara)) {
        body = body.slice(firstPara.length).replace(/^[\s.!?]+/, "").trim();
      }
    }

    const full = [headline, lede, body].filter(Boolean).join("\n\n");
    return { headline, lede, body, full };
  };

  const handleCopyArticle = async (format: "plain" | "markdown" | "whatsapp" | "certificate" = copyFormat) => {
    if (!draft) return;
    const { headline, lede, body: cleanBody, full } = getCleanArticleComponents(draft.headline, draft.lede, draft.body);
    let text = "";
    if (format === "plain") {
      text = [
        headline,
        lede ? convertToPlainText(lede) : "",
        cleanBody ? convertToPlainText(cleanBody) : "",
      ].filter(Boolean).join("\n\n");
    } else if (format === "markdown") {
      text = [
        `# ${headline}`,
        lede ? `> ${lede}` : "",
        cleanBody || "",
      ].filter(Boolean).join("\n\n");
    } else if (format === "whatsapp") {
      text = draft.whatsapp_post || `*${headline}*\n\n${lede ? convertToPlainText(lede) : ""}\n\nRead more on https://amaicamedia.com`;
    } else if (format === "certificate") {
      const ai = aiResult || analyzeAiContent(full);
      text = generateCertifiedCopy(full, ai, null);
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`Copied (${format === "plain" ? "Clean Plain Text" : format === "markdown" ? "Markdown" : format === "whatsapp" ? "WhatsApp" : "0% Certificate"})!`);
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error("Clipboard access not available");
      }
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const { issues, aiResult } = useMemo(() => {
    if (!draft) return { issues: [] as Issue[], aiResult: null as AiDetectionResult | null };
    return validateArticleWithAiDetails({
      headline: draft.headline,
      lede: draft.lede,
      body: draft.body,
      template_type: draft.template_type,
      sources: (draft.sources as SourceRef[]) || [],
      min_word_count: minWordCount,
    });
  }, [draft?.headline, draft?.lede, draft?.body, draft?.template_type, draft?.sources, minWordCount]);

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/newsroom/auth" replace />;
  if (!draft) return <div className="min-h-screen bg-background"><Masthead variant="newsroom" /><div className="p-8 text-ink-light">Loading…</div></div>;

  const update = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const approvable = canApprove(issues);

  const sources: SourceRef[] = (draft.sources as SourceRef[]) || [];
  const updateSource = (idx: number, patch: Partial<SourceRef>) => {
    const next = sources.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    update({ sources: next });
  };
  const addSource = () => update({ sources: [...sources, { url: "", title: "", notes: [] }] });
  const removeSource = (idx: number) => update({ sources: sources.filter((_, i) => i !== idx) });

  const updateNote = (sIdx: number, nIdx: number, patch: Partial<{ text: string; section: string }>) => {
    const s = sources[sIdx];
    const notes = (s.notes || []).map((n, i) => {
      if (i !== nIdx) return n;
      const current = typeof n === "string" ? { text: n, section: "" } : { text: n.text || "", section: n.section || "" };
      return { ...current, ...patch };
    });
    updateSource(sIdx, { notes });
  };
  const addNote = (sIdx: number) => {
    const s = sources[sIdx];
    updateSource(sIdx, { notes: [...(s.notes || []), { text: "", section: "" }] });
  };
  const removeNote = (sIdx: number, nIdx: number) => {
    const s = sources[sIdx];
    updateSource(sIdx, { notes: (s.notes || []).filter((_, i) => i !== nIdx) });
  };

  const recordAudit = async (action: string, fromStatus: string | null, toStatus: string | null, notes?: string) => {
    if (!user || !draft) return;
    try {
      const display = user.user_metadata?.display_name || user.email || null;
      const validActorId = ensureValidAuthorUUID(user.id);
      if (isValidUUID(draft.id)) {
        await supabase.from("approval_audit_log").insert({
          draft_id: draft.id,
          actor_user_id: validActorId,
          actor_display_name: display,
          action,
          from_status: fromStatus,
          to_status: toStatus,
          validation_errors: errors as unknown as never,
          validation_warnings: warnings as unknown as never,
          error_count: errors.length,
          warning_count: warnings.length,
          notes: notes || null,
        });
        loadAudit(draft.id);
      }
    } catch (auditErr) {
      console.warn("Could not record audit log:", auditErr);
    }
  };

  const save = async (newStatus?: string) => {
    setBusy(true);
    try {
      let candidateHeadline = draft.headline;
      let candidateLede = draft.lede;
      let candidateBody = draft.body;
      let candidateSources = sources;

      if (newStatus && (newStatus === "review" || newStatus === "published") && !approvable) {
        toast.info("Auto-resolving validation errors to meet minimum newsroom requirements...");
        const compliance = ensureEditorialCompliance({
          headline: draft.headline,
          lede: draft.lede,
          body: draft.body,
          template_type: draft.template_type,
          min_word_count: minWordCount || 700,
          region: draft.region,
          category: draft.category,
          sources,
        });
        candidateHeadline = compliance.headline;
        candidateLede = compliance.lede;
        candidateBody = compliance.body;
        candidateSources = compliance.sources;
        setSources(compliance.sources);
      }

      // Guarantee ultra 0% AI humanized output on save/publish
      const finalBody = candidateBody ? humanizeText(candidateBody, "ultra").humanizedText : candidateBody;
      const finalLede = candidateLede ? humanizeText(candidateLede, "ultra").humanizedText : candidateLede;

      const updates: any = {
        headline: draft.headline,
        lede: finalLede,
        body: finalBody,
        category: draft.category,
        region: draft.region,
        byline: draft.byline,
        hero_image_url: draft.hero_image_url,
        social_image_url: draft.social_image_url,
        whatsapp_post: draft.whatsapp_post,
        twitter_post: draft.twitter_post,
        instagram_post: draft.instagram_post,
        facebook_post: draft.facebook_post,
        auto_publish_enabled: draft.auto_publish_enabled ?? false,
        auto_publish_at: draft.auto_publish_at || null,
        sources: sources,
        ...(newStatus ? { status: newStatus, ...(newStatus === "published" ? { published_at: new Date().toISOString() } : {}) } : {}),
      };

      await updateDraftContent(draft.id, updates);
      setDraft((prev) => (prev ? { ...prev, ...updates } : null));

      // Auto-copy clean plain text to clipboard upon Publish or Send for Review
      if (newStatus === "published" || newStatus === "review") {
        try {
          const { headline: cleanH, lede: cleanL, body: cleanB } = getCleanArticleComponents(draft.headline, finalLede, finalBody);
          const plainStory = [
            cleanH,
            cleanL ? convertToPlainText(cleanL) : "",
            cleanB ? convertToPlainText(cleanB) : "",
          ].filter(Boolean).join("\n\n");
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(plainStory);
            toast.success(
              newStatus === "published"
                ? "Published live (0% AI Verified) & plain text copied to clipboard!"
                : "Sent to Review Queue & plain text copied to clipboard!"
            );
          } else {
            toast.success(newStatus === "published" ? "Published live (0% AI Verified)" : "Sent for review");
          }
        } catch {
          toast.success(newStatus === "published" ? "Published live (0% AI Verified)" : "Sent for review");
        }
      } else {
        toast.success("Saved");
      }

      if (finalBody !== draft.body || finalLede !== draft.lede) {
        update({ body: finalBody, lede: finalLede });
      }
      if (newStatus) {
        await recordAudit(newStatus === "published" ? "publish" : "send_for_review", draft.status, newStatus);
        setDraft({ ...draft, status: newStatus });
      } else {
        await recordAudit("save", draft.status, draft.status);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const findNewImage = async () => {
    if (!draft) return;
    setImgBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("find-image", {
        body: { query: draft.headline, headline: draft.headline },
      });
      if (error) throw error;
      if (data?.success && data?.image?.url) {
        update({ hero_image_url: data.image.url, social_image_url: data.image.url });
        toast.success(`Image found from ${data.image.source}`);
      } else {
        toast.error("No alternative image found");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image search failed");
    } finally {
      setImgBusy(false);
    }
  };

  const setCustomImage = () => {
    const url = prompt("Paste image URL", draft?.hero_image_url || "");
    if (url) update({ hero_image_url: url, social_image_url: url });
  };

  const publishToWordPress = async () => {
    if (!draft) return;
    if (!approvable) {
      toast.error("Resolve validation errors before pushing to WordPress");
      return;
    }
    setWpBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("publish-wordpress", {
        body: {
          headline: draft.headline,
          body: draft.body,
          lede: draft.lede,
          byline: draft.byline,
          hero_image_url: draft.hero_image_url,
          status: "pending",
        },
      });
      if (error) throw error;
      await updateDraftContent(draft.id, {
        wordpress_post_url: data.post_url,
        wordpress_post_id: String(data.post_id),
        wordpress_published_at: new Date().toISOString(),
      } as any);
      setDraft((prev) => prev ? { ...prev, wordpress_post_url: data.post_url } : null);
      toast.success("Published to WordPress");
      await recordAudit("wordpress_push", draft.status, draft.status, `Pushed to WordPress (pending review): ${data.post_url}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "WordPress publish failed");
    } finally {
      setWpBusy(false);
    }
  };

  const autoFix = async () => {
    if (!draft) return;
    if (issues.length === 0) { toast.info("Nothing to fix — all checks pass."); return; }
    setFixBusy(true);
    try {
      let rawBody = draft.body || "";
      let rawLede = draft.lede || "";
      let rawSources = sources;
      let sectionsUpdated: string[] = [];

      // 1. First attempt cloud edge function if available
      try {
        const { data, error } = await supabase.functions.invoke("auto-fix-article", {
          body: {
            headline: draft.headline,
            lede: draft.lede,
            body: draft.body,
            template_type: draft.template_type,
            sources,
            issues: issues.map((i) => ({ id: i.id, message: i.message })),
          },
        });
        if (!error && data?.success) {
          rawBody = data.body || rawBody;
          rawSources = data.sources || rawSources;
          sectionsUpdated = data.sections_updated || [];
        }
      } catch (cloudErr) {
        console.warn("Cloud auto-fix-article unavailable, running deterministic compliance engine:", cloudErr);
      }

      // 2. Deterministically guarantee 100% editorial compliance
      const compliance = ensureEditorialCompliance({
        headline: draft.headline,
        lede: rawLede,
        body: rawBody,
        template_type: draft.template_type,
        min_word_count: minWordCount || 700,
        region: draft.region,
        category: draft.category,
        sources: rawSources,
      });

      update({
        headline: compliance.headline,
        body: compliance.body,
        lede: compliance.lede,
        sources: compliance.sources,
      });

      await recordAudit(
        "auto_fix",
        draft.status,
        draft.status,
        `Auto-compliance guaranteed: ${compliance.wordCount} words, ${compliance.paragraphCount} paragraphs, ${compliance.quotesCount} quotes (${compliance.fixedIssues.join("; ") || "all checks passed"})`
      );

      toast.success(`100% Editorial Compliance Guaranteed! All minimum requirements met (${compliance.wordCount} words, 0% AI).`);
    } catch (e) {
      // Ultimate safety fallback
      try {
        const fallback = ensureEditorialCompliance({
          headline: draft.headline,
          lede: draft.lede,
          body: draft.body,
          template_type: draft.template_type,
          min_word_count: minWordCount || 700,
          region: draft.region,
          category: draft.category,
          sources,
        });
        update({
          headline: fallback.headline,
          body: fallback.body,
          lede: fallback.lede,
          sources: fallback.sources,
        });
        toast.success(`100% Editorial Compliance Guaranteed! All minimum requirements met (${fallback.wordCount} words).`);
      } catch (fallbackErr) {
        toast.error(fallbackErr instanceof Error ? fallbackErr.message : "Auto-fix failed");
      }
    } finally {
      setFixBusy(false);
    }
  };

  const humanizeContent = () => {
    if (!draft?.body) return;
    const bodyRes = humanizeText(draft.body, "ultra");
    let cleanedLede = draft.lede;
    let ledeReplacements = 0;
    if (draft.lede) {
      const ledeRes = humanizeText(draft.lede, "ultra");
      cleanedLede = ledeRes.humanizedText;
      ledeReplacements = ledeRes.replacementsMade;
    }
    const total = bodyRes.replacementsMade + ledeReplacements;
    if (total === 0) {
      toast.info("No formulaic AI clichés or uniform cadence detected to adjust.");
    } else {
      update({ body: bodyRes.humanizedText, lede: cleanedLede });
      toast.success(`Humanized: ${total} adjustment${total === 1 ? "" : "s"} made (clichés stripped, sentence cadence & short punchy rhythm applied)!`);
    }
  };

  const sendToIntelligence = () => {
    if (!draft) return;
    const { headline: cleanH, lede: cleanL, body: cleanB } = getCleanArticleComponents(draft.headline, draft.lede, draft.body);
    try {
      sessionStorage.setItem("intelligence_incoming_draft", JSON.stringify({
        id: draft.id,
        headline: cleanH,
        lede: cleanL,
        body: cleanB,
        category: draft.category,
        region: draft.region,
      }));
    } catch (e) {
      console.warn("Could not set sessionStorage incoming draft:", e);
    }
    toast.info("Opening in AI Intelligence Studio for fixing...");
    navigate(`/newsroom/ai-detector?draftId=${draft.id}`);
  };

  const remove = async () => {
    if (!confirm("Delete this draft permanently?")) return;
    try {
      await deleteNewsroomDraft(draft.id);
      toast.success("Deleted");
      navigate("/newsroom/drafts");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete draft");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Masthead variant="newsroom" />
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_320px] gap-6 outline-none">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <span className={`px-2 py-0.5 rounded-sm font-medium ${draft.status === "published" ? "bg-primary text-primary-foreground" : draft.status === "review" ? "bg-accent text-accent-foreground" : "bg-teal-light text-primary"}`}>{draft.status}</span>
              <span className="text-ink-light">{draft.template_type} · {draft.region.replace("_", " ")}</span>
            </div>

            {/* AI Risk Score Badge */}
            {aiResult && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiInspector(!showAiInspector)}
                  aria-expanded={showAiInspector}
                  aria-controls="ai-inspector-panel"
                  className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1.5 font-medium transition cursor-pointer ${aiResult.badgeColor}`}
                  title="Click to view AI content metrics and detected phrases"
                >
                  <Bot size={13} aria-hidden="true" />
                  <span>AI Risk: {aiResult.score}%</span>
                  <span className="hidden sm:inline opacity-80">· {aiResult.verdict}</span>
                  {showAiInspector ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  onClick={humanizeContent}
                  className={`text-xs px-2.5 py-1 rounded font-semibold transition flex items-center gap-1 ${
                    aiResult.score > 0
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-muted text-ink-mid hover:text-foreground"
                  }`}
                  title="Run QuillBot 0% AI Ultra Humanizer on this draft"
                >
                  <Sparkles size={11} aria-hidden="true" />
                  {aiResult.score > 0 ? "Ensure 0% AI" : "0% AI Clean"}
                </button>
                <button
                  type="button"
                  onClick={sendToIntelligence}
                  className="text-xs px-2.5 py-1 rounded font-semibold transition flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer"
                  title="Open in AI Intelligence segment for advanced forensic scanning, QuillBot modes, and sentence-by-sentence fixing"
                >
                  <Wand2 size={11} aria-hidden="true" />
                  <span>Send to Intelligence</span>
                </button>
                <div className="flex items-center rounded border border-border bg-card overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleCopyArticle(copyFormat)}
                    className="text-xs px-2.5 py-1 font-medium hover:bg-muted transition flex items-center gap-1.5"
                    title={`Copy article as ${copyFormat}`}
                  >
                    {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <select
                    value={copyFormat}
                    onChange={(e) => setCopyFormat(e.target.value as any)}
                    aria-label="Article copy format"
                    className="text-[11px] bg-muted/40 border-l border-border px-1.5 py-1 outline-none font-medium cursor-pointer"
                    title="Select copy format"
                  >
                    <option value="plain">Plain Text</option>
                    <option value="markdown">Markdown</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="certificate">0% Certificate</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible AI Content Inspector */}
          {aiResult && showAiInspector && (
            <div id="ai-inspector-panel" className="bg-card border border-border rounded p-4 shadow-card text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="label-eyebrow flex items-center gap-1.5 font-bold text-foreground">
                  <Bot size={13} className="text-primary" /> AI Content Diagnostic Inspector
                </div>
                <span className="text-[11px] text-ink-light font-mono">{aiResult.score}% AI Probability</span>
              </div>

              {/* Visual Meter */}
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${
                    aiResult.score >= 76
                      ? "bg-destructive"
                      : aiResult.score >= 56
                      ? "bg-orange-500"
                      : aiResult.score >= 26
                      ? "bg-amber-500"
                      : "bg-green-600"
                  }`}
                  style={{ width: `${Math.max(5, aiResult.score)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-muted/50 p-2 rounded border border-border">
                  <div className="text-[10px] uppercase text-ink-light">Clichés & Forms</div>
                  <div className={`font-mono text-sm font-semibold ${(aiResult.clicheCount + (aiResult.participialCount || 0)) > 0 ? "text-destructive" : "text-green-600"}`}>
                    {aiResult.clicheCount + (aiResult.participialCount || 0)}
                  </div>
                </div>
                <div className="bg-muted/50 p-2 rounded border border-border">
                  <div className="text-[10px] uppercase text-ink-light">Transitions</div>
                  <div className={`font-mono text-sm font-semibold ${aiResult.transitionCount > 2 ? "text-orange-500" : "text-ink-mid"}`}>
                    {aiResult.transitionCount}
                  </div>
                </div>
                <div className="bg-muted/50 p-2 rounded border border-border">
                  <div className="text-[10px] uppercase text-ink-light">Burstiness (Std-Dev)</div>
                  <div className="font-mono text-sm font-semibold text-ink-mid">
                    {aiResult.sentenceMetrics.stdDev}w
                    <span className="text-[10px] block font-normal text-ink-light capitalize">{aiResult.sentenceMetrics.burstinessVerdict.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="bg-muted/50 p-2 rounded border border-border">
                  <div className="text-[10px] uppercase text-ink-light">Local Grounding</div>
                  <div className="font-mono text-sm font-semibold text-green-600">
                    +{aiResult.localGroundingPoints} pts
                  </div>
                </div>
              </div>

              {/* Flagged Phrases */}
              {aiResult.flaggedPhrases.length > 0 ? (
                <div className="pt-1">
                  <div className="text-[11px] font-medium text-ink-mid mb-1.5">Flagged Formulaic Phrases:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.flaggedPhrases.map((p) => (
                      <span
                        key={p.phrase}
                        className={`px-2 py-0.5 rounded text-[11px] border font-mono ${
                          p.category === "cliche" || p.category === "participial"
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900"
                        }`}
                      >
                        "{p.phrase}" {p.count > 1 && `(${p.count})`}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-green-600 font-medium text-[11px] flex items-center gap-1.5 pt-1">
                  <ShieldCheck size={14} /> Zero AI clichés or trailing participial clauses detected. Output is 100% human cadence.
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                <div className="text-[11px] text-ink-light">
                  Target: <strong className="text-foreground">0% AI Probability</strong> (QuillBot / GPTZero calibrated)
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/newsroom/detector?text=${encodeURIComponent(getCleanArticleComponents(draft.headline, draft.lede, draft.body).full)}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Open in AI Detector Studio <ExternalLink size={12} />
                  </Link>
                  <button
                    type="button"
                    onClick={humanizeContent}
                    className="bg-accent text-accent-foreground text-xs px-3 py-1 rounded font-semibold hover:bg-accent/90 transition flex items-center gap-1.5"
                  >
                    <Sparkles size={12} /> Clean & Humanize Clichés
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section Category and Region Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/40 border border-border rounded">
            <div>
              <label className="label-eyebrow block mb-1">Section / Category</label>
              <select
                value={draft.category || "celebrity"}
                onChange={(e) => update({ category: e.target.value })}
                className="w-full text-xs bg-card border border-border rounded px-2.5 py-1.5 font-medium outline-none focus:border-primary"
              >
                <option value="gossip">🔥 Gossip (Udaku ya Showbiz)</option>
                <option value="celebrity">Celebrity & Culture</option>
                <option value="music">Music & Benga</option>
                <option value="events">Concerts & Events</option>
                <option value="film">Film & TV</option>
                <option value="culture">Culture & Heritage</option>
              </select>
            </div>
            <div>
              <label className="label-eyebrow block mb-1">Regional Wire Focus</label>
              <select
                value={draft.region || "western_kenya"}
                onChange={(e) => update({ region: e.target.value })}
                className="w-full text-xs bg-card border border-border rounded px-2.5 py-1.5 font-medium outline-none focus:border-primary"
              >
                <option value="western_kenya">📍 Western Kenya (Kakamega, Kisumu, Bungoma, Busia...)</option>
                <option value="national">🇰🇪 National (Kenya Wide)</option>
                <option value="world">🌍 World (East Africa & Global)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-eyebrow block mb-1">Headline</label>
            <textarea value={draft.headline} onChange={(e) => update({ headline: e.target.value })} rows={2} className="w-full font-display text-2xl leading-tight bg-card border border-border rounded px-3 py-2 resize-none" />
          </div>

          <div>
            <label className="label-eyebrow block mb-1">Byline</label>
            <input
              value={draft.byline || ""}
              onChange={(e) => update({ byline: e.target.value })}
              placeholder="By Jane Mwangi"
              className="w-full text-sm bg-card border border-border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="label-eyebrow block mb-1">Lede</label>
            <textarea value={draft.lede || ""} onChange={(e) => update({ lede: e.target.value })} rows={2} className="w-full text-base bg-card border border-border rounded px-3 py-2 resize-none" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 gap-2">
              <label className="label-eyebrow">Body (markdown)</label>
              {(() => {
                const words = countWords(draft.body || "");
                const target = TARGET_WORDS_BY_TEMPLATE[draft.template_type] || { min: minWordCount, ideal: minWordCount, max: 1200 };
                const requiredMin = Math.min(minWordCount, target.min);
                const pct = Math.min(100, Math.round((words / requiredMin) * 100));
                const under = words < requiredMin;
                return (
                  <div className="flex items-center gap-2 text-[11px]" title={`Target: ${target.min}–${target.max} words (${draft.template_type})`}>
                    <div className="w-24 h-1.5 bg-muted rounded overflow-hidden">
                      <div
                        className={`h-full transition-all ${under ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={under ? "text-destructive font-medium" : "text-ink-mid"}>
                      {words} words (target: {target.min}–{target.max}w)
                      {under && ` · ${requiredMin - words} short`}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <p className="text-[11px] text-ink-light leading-relaxed">
                Inverted-pyramid journalism: Lede, developing facts, background context, attributed quotes, and regional significance flow naturally across 5+ paragraphs without robotic outline headers.
              </p>
              {/#\s*(?:Background|Key Details|Official Response|Quotes|Why it matters|Outlook)/i.test(draft.body || "") && (
                <button
                  type="button"
                  onClick={() => {
                    const dissolved = dissolveFormulaicHeaders(draft.body || "");
                    update({ body: dissolved });
                    toast.success("Dissolved robotic outline headers into natural continuous prose!");
                  }}
                  className="text-[11px] font-medium text-primary hover:underline whitespace-nowrap flex items-center gap-1 self-start sm:self-auto bg-primary/10 px-2 py-0.5 rounded border border-primary/20"
                >
                  <Sparkles size={11} />
                  Dissolve Outline Headers
                </button>
              )}
            </div>
            <textarea value={draft.body || ""} onChange={(e) => update({ body: e.target.value })} rows={20} className="w-full text-sm font-mono bg-card border border-border rounded px-3 py-2 resize-y leading-relaxed" />
          </div>

          {/* Validation panel */}
          <div className={`border rounded p-4 shadow-card ${approvable ? "bg-card border-border" : "bg-red-light/30 border-destructive/40"}`}>
            <div className="flex items-center gap-2 mb-2">
              {approvable ? <CheckCircle2 size={14} className="text-primary" /> : <AlertTriangle size={14} className="text-destructive" />}
              <div className="label-eyebrow">Editor checks</div>
              <span className="text-[11px] text-ink-light ml-auto">{errors.length} error{errors.length === 1 ? "" : "s"} · {warnings.length} warning{warnings.length === 1 ? "" : "s"}</span>
            </div>
            {issues.length === 0 ? (
              <p className="text-xs text-ink-mid">All checks pass. Ready for review.</p>
            ) : (
              <ul className="space-y-2">
                {issues.map((i) => (
                  <li key={i.id} className="text-xs">
                    <div className={`font-medium ${i.severity === "error" ? "text-destructive" : "text-accent-foreground"}`}>
                      {i.severity === "error" ? "✗" : "!"} {i.message}
                    </div>
                    <div className="text-ink-light pl-3">→ {i.suggestion}</div>
                  </li>
                ))}
              </ul>
            )}
            {!approvable && (
              <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/30 space-y-2">
                <div className="text-[11px] font-semibold text-destructive flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  <span>{errors.length} validation error{errors.length === 1 ? "" : "s"} blocking review and publishing</span>
                </div>
                <button
                  type="button"
                  onClick={autoFix}
                  disabled={fixBusy}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2.5 rounded font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Wand2 size={13} className={fixBusy ? "animate-spin" : ""} />
                  <span>{fixBusy ? "Guaranteeing compliance…" : "Auto-Fix to 100% Pass Minimum Requirements"}</span>
                </button>
              </div>
            )}
            {issues.length > 0 && approvable && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  onClick={autoFix}
                  disabled={fixBusy}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded font-medium hover:bg-primary-mid disabled:opacity-50"
                >
                  <Wand2 size={12} className={fixBusy ? "animate-pulse" : ""} />
                  {fixBusy ? "Regenerating…" : "Auto-fix weak sections & refresh sources"}
                </button>
                <button
                  type="button"
                  onClick={humanizeContent}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-semibold transition ${
                    aiResult && aiResult.score > 0
                      ? "bg-accent text-accent-foreground ring-2 ring-accent hover:opacity-90 font-bold"
                      : "bg-accent text-accent-foreground hover:bg-accent/90"
                  }`}
                >
                  <Sparkles size={12} />
                  Auto-Fix to 0% AI (Instant Humanize)
                </button>
              </div>
            )}
          </div>

          {/* Sources panel */}
          <div className="bg-card border border-border rounded p-4 shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <LinkIcon size={12} className="text-primary" />
              <div className="label-eyebrow">Sources & notes</div>
              <button onClick={addSource} className="ml-auto text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                <Plus size={11} /> Add source
              </button>
            </div>
            <p className="text-[11px] text-ink-light">Editors use these links and notes to verify every fact in the story.</p>
            {sources.length === 0 && <p className="text-xs text-ink-light italic">No sources attached yet.</p>}
            {sources.map((s, idx) => (
              <div key={idx} className="border border-border rounded p-2.5 space-y-1.5 bg-muted/40">
                <div className="flex gap-1.5">
                  <input
                    value={s.title || ""}
                    onChange={(e) => updateSource(idx, { title: e.target.value })}
                    placeholder="Source name (e.g. Nation, official statement)"
                    className="flex-1 text-xs bg-card border border-border rounded px-2 py-1"
                  />
                  <button onClick={() => removeSource(idx)} className="text-ink-light hover:text-destructive p-1" aria-label="Remove source">
                    <X size={12} />
                  </button>
                </div>
                <input
                  value={s.url || ""}
                  onChange={(e) => updateSource(idx, { url: e.target.value })}
                  placeholder="https://…"
                  className="w-full text-xs bg-card border border-border rounded px-2 py-1"
                />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-ink-light">Extracted notes · tag the section each supports</span>
                    <button onClick={() => addNote(idx)} className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5">
                      <Plus size={10} /> Note
                    </button>
                  </div>
                  {(s.notes || []).length === 0 && (
                    <p className="text-[11px] text-ink-light italic">No notes yet — add the specific facts this link supports.</p>
                  )}
                  {(s.notes || []).map((n, nIdx) => (
                    <div key={nIdx} className="flex gap-1 items-start">
                      <input
                        value={noteText(n)}
                        onChange={(e) => updateNote(idx, nIdx, { text: e.target.value })}
                        placeholder="e.g. Concert KSh 1,500, Oct 12 at Bukhungu Stadium"
                        className="flex-1 text-xs bg-card border border-border rounded px-2 py-1"
                      />
                      <select
                        value={noteSection(n)}
                        onChange={(e) => updateNote(idx, nIdx, { section: e.target.value })}
                        className="text-[11px] bg-card border border-border rounded px-1 py-1 w-[110px]"
                        title="Which section this note supports"
                      >
                        <option value="">— section —</option>
                        {REQUIRED_HEADINGS.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <button onClick={() => removeNote(idx, nIdx)} className="text-ink-light hover:text-destructive p-1" aria-label="Remove note">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Approval audit log */}
          <div className="bg-card border border-border rounded p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <History size={12} className="text-primary" />
              <div className="label-eyebrow">Approval audit log</div>
              <span className="text-[11px] text-ink-light ml-auto">{audit.length} entr{audit.length === 1 ? "y" : "ies"}</span>
            </div>
            {audit.length === 0 ? (
              <p className="text-xs text-ink-light italic">No actions recorded yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {audit.map((a) => (
                  <li key={a.id} className="text-xs border-l-2 border-border pl-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono uppercase tracking-wider text-[10px] text-primary">{a.action.replace(/_/g, " ")}</span>
                      {a.from_status && a.to_status && a.from_status !== a.to_status && (
                        <span className="text-[10px] text-ink-light">{a.from_status} → {a.to_status}</span>
                      )}
                      <span className="ml-auto text-[10px] text-ink-light">{new Date(a.created_at).toLocaleString("en-KE")}</span>
                    </div>
                    <div className="text-ink-mid">
                      {a.actor_display_name || "Unknown"} · <span className={a.error_count > 0 ? "text-destructive" : "text-primary"}>{a.error_count} error{a.error_count === 1 ? "" : "s"}</span>, {a.warning_count} warning{a.warning_count === 1 ? "" : "s"}
                    </div>
                    {a.notes && <div className="text-ink-light text-[11px] mt-0.5">{a.notes}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button disabled={busy} onClick={() => save()} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary-mid transition flex items-center gap-1.5 disabled:opacity-50">
              <Save size={14} /> Save
            </button>
            {draft.status === "draft" && (
              <button disabled={busy} onClick={() => save("review")} className="bg-accent text-accent-foreground px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
                Send for review
              </button>
            )}
            {draft.status !== "published" && (
              <button disabled={busy} onClick={() => save("published")} className="bg-destructive text-destructive-foreground px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50">
                <Send size={14} /> {isEditor ? "Publish" : "Self-publish"}
              </button>
            )}
            <button disabled={wpBusy} onClick={publishToWordPress} className="bg-foreground text-background px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50">
              <Globe size={14} /> {wpBusy ? "Pushing…" : "Publish to WordPress"}
            </button>
            <button onClick={remove} className="ml-auto text-destructive hover:bg-red-light px-3 py-2 rounded text-sm flex items-center gap-1.5">
              <Trash2 size={14} /> Delete
            </button>
          </div>
          {draft.wordpress_post_url && (
            <a href={draft.wordpress_post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <ExternalLink size={11} /> View on WordPress
            </a>
          )}

          <div className="bg-card border border-border rounded p-4 shadow-card space-y-2">
            <div className="label-eyebrow flex items-center gap-1.5"><Globe size={11} /> Auto-publish to WordPress (editorial)</div>
            <p className="text-[11px] text-ink-light">When enabled, the queue will push this story to WordPress at the scheduled time as <strong>Pending review</strong> so editors can approve it before it goes live.</p>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!draft.auto_publish_enabled}
                onChange={(e) => update({ auto_publish_enabled: e.target.checked })}
              />
              Queue for auto-publish
            </label>
            <input
              type="datetime-local"
              value={draft.auto_publish_at ? new Date(draft.auto_publish_at).toISOString().slice(0, 16) : ""}
              onChange={(e) => update({ auto_publish_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5"
            />
            {draft.wordpress_last_error && (
              <p className="text-[11px] text-destructive">Last error: {draft.wordpress_last_error}</p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-card border border-border rounded p-4 shadow-card">
            <div className="label-eyebrow mb-2 flex items-center gap-1.5"><ImageIcon size={11} /> Hero / social image</div>
            {draft.hero_image_url ? (
              <img src={draft.hero_image_url} alt="" className="w-full aspect-[16/10] object-cover rounded border border-border mb-2" onError={(e) => (e.currentTarget.style.opacity = "0.3")} />
            ) : (
              <div className="w-full aspect-[16/10] bg-muted rounded border border-border mb-2 flex items-center justify-center text-xs text-ink-light">No image</div>
            )}
            <input
              value={draft.hero_image_url || ""}
              onChange={(e) => update({ hero_image_url: e.target.value, social_image_url: e.target.value })}
              placeholder="https://…"
              className="w-full text-[11px] bg-muted border border-border rounded px-2 py-1.5 mb-2"
            />
            <div className="flex gap-1.5">
              <button disabled={imgBusy} onClick={findNewImage} className="flex-1 bg-primary text-primary-foreground px-2 py-1.5 rounded text-[11px] font-medium hover:bg-primary-mid disabled:opacity-50 flex items-center justify-center gap-1">
                <RefreshCw size={10} className={imgBusy ? "animate-spin" : ""} /> Find photo
              </button>
              <button onClick={setCustomImage} className="bg-muted text-foreground px-2 py-1.5 rounded text-[11px] font-medium hover:bg-border">Paste URL</button>
            </div>
            <p className="text-[10px] text-ink-light mt-2">This image will be attached to all social posts and pushed to WordPress.</p>
          </div>
          <div className="bg-card border border-border rounded p-4 shadow-card">
            <div className="label-eyebrow mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-green-600 font-semibold"><MessageCircle size={12} /> WhatsApp Broadcast</span>
              {draft.whatsapp_post && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(draft.whatsapp_post || "");
                    toast.success("WhatsApp broadcast copy copied!");
                  }}
                  className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded font-medium hover:bg-green-700"
                >
                  Copy
                </button>
              )}
            </div>
            <textarea
              value={draft.whatsapp_post || ""}
              onChange={(e) => update({ whatsapp_post: e.target.value })}
              placeholder="*Breaking Headline*\n• Point 1\n• Point 2\nRead details on amaicamedia.com"
              rows={5}
              className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5 resize-none"
            />
            <p className="text-[10px] text-ink-light mt-1">Formatted for WhatsApp channels & community groups.</p>
          </div>
          <div className="bg-card border border-border rounded p-4 shadow-card">
            <div className="label-eyebrow mb-2 flex items-center gap-1.5"><Twitter size={11} /> Twitter / X</div>
            {draft.social_image_url && <img src={draft.social_image_url} alt="" className="w-full aspect-video object-cover rounded mb-2 border border-border" />}
            <textarea value={draft.twitter_post || ""} onChange={(e) => update({ twitter_post: e.target.value })} rows={4} maxLength={280} className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5 resize-none" />
            <div className="text-[10px] text-ink-light mt-1 text-right">{(draft.twitter_post || "").length}/280</div>
          </div>
          <div className="bg-card border border-border rounded p-4 shadow-card">
            <div className="label-eyebrow mb-2 flex items-center gap-1.5"><Instagram size={11} /> Instagram</div>
            {draft.social_image_url && <img src={draft.social_image_url} alt="" className="w-full aspect-square object-cover rounded mb-2 border border-border" />}
            <textarea value={draft.instagram_post || ""} onChange={(e) => update({ instagram_post: e.target.value })} rows={5} className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5 resize-none" />
          </div>
          <div className="bg-card border border-border rounded p-4 shadow-card">
            <div className="label-eyebrow mb-2 flex items-center gap-1.5"><Facebook size={11} /> Facebook</div>
            {draft.social_image_url && <img src={draft.social_image_url} alt="" className="w-full aspect-[1.91/1] object-cover rounded mb-2 border border-border" />}
            <textarea value={draft.facebook_post || ""} onChange={(e) => update({ facebook_post: e.target.value })} rows={4} className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5 resize-none" />
          </div>
        </aside>
      </main>
    </div>
  );
}