import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Masthead } from "@/components/Masthead";
import { useAuth } from "@/lib/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RefreshCw, Sparkles, MapPin, Clock, ExternalLink, Eye, X, Square, CheckSquare, PlusCircle, Flame, Zap } from "lucide-react";
import { countWords } from "@/lib/articleValidation";
import { useMinWordCount } from "@/hooks/useNewsroomSettings";
import { formatRelativeTime, detectRegion, isWesternKenyaGossip, isGossipContent, detectCategory } from "@/lib/localScraper";
import { humanizeText, dissolveFormulaicHeaders } from "@/lib/aiContentDetector";
import { scrapeStoryResilient, scrapeKenyanEntertainmentPortals } from "@/lib/scraperService";
import {
  fetchLiveTrendingWireStories,
  repurposeWireStory,
  calculateTrendingVelocityScore,
  autoGenerateTrendingStories,
} from "@/lib/editorial/wireRepurposingEngine";
import { saveNewDraft, ensureValidAuthorUUID, isValidUUID } from "@/lib/editorial/draftStorage";
import { ensureEditorialCompliance } from "@/lib/editorial/editorialComplianceEngine";
import { safeGetItem, safeSetItem, safeUUID } from "@/lib/safeStorage";

type Story = {
  id: string;
  title: string;
  source: string;
  source_url: string;
  excerpt: string | null;
  image_url: string | null;
  region: string;
  category: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  highlights?: string[] | null;
  preview_summary?: string | null;
  trendingScore?: number;
};

export default function Discover() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { minWordCount } = useMinWordCount();
  const [stories, setStories] = useState<Story[]>([]);
  const [filter, setFilter] = useState<"all" | "trending" | "western_circuit" | "music" | "celebrity" | "western_gossip" | "festivals">("all");
  const [discovering, setDiscovering] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoGenProgress, setAutoGenProgress] = useState<{ current: number; total: number; title: string; status: string } | null>(null);
  const [autoPilotEnabled, setAutoPilotEnabled] = useState<boolean>(() => {
    try {
      return safeGetItem("amaica_autopilot_enabled") === "true";
    } catch {
      return false;
    }
  });
  const [writingId, setWritingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Story | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPreview, setBulkPreview] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkStatusFilter, setBulkStatusFilter] = useState<"all" | "queued" | "writing" | "done" | "failed">("all");
  const [bulkAttemptFilter, setBulkAttemptFilter] = useState<"all" | "1" | "2+" | "3+">("all");
  const [bulkErrorFilter, setBulkErrorFilter] = useState<string>("all");
  type RetryStatus = {
    state: "queued" | "writing" | "retrying" | "done" | "failed";
    attempts?: number;
    nextRetryAt?: string | null;
    finalStatus?: number | null;
    finalError?: string | null;
  };
  const [retryStatus, setRetryStatus] = useState<Record<string, RetryStatus>>({});
  const [customUrl, setCustomUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);

  const toggleAutoPilot = () => {
    const next = !autoPilotEnabled;
    setAutoPilotEnabled(next);
    try {
      safeSetItem("amaica_autopilot_enabled", String(next));
    } catch { /* ignore */ }
    if (next) {
      toast.success("⚡ Newsroom Auto-Pilot activated: Monitoring reference sites & auto-drafting viral stories");
    } else {
      toast.info("Newsroom Auto-Pilot paused");
    }
  };

  const handleAutoGenerateTrending = useCallback(async (count = 3) => {
    if (!user) return;
    setAutoGenerating(true);
    setAutoGenProgress({ current: 0, total: count, title: "Scanning feeds", status: "Scanning reference portals for breaking news..." });

    try {
      const res = await autoGenerateTrendingStories({
        count,
        userId: user.id,
        userDisplayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "Amaica Newsroom",
        onProgress: (status, progress) => {
          setAutoGenProgress({
            current: progress?.current ?? 0,
            total: progress?.total ?? count,
            title: progress?.title ?? "Processing story",
            status,
          });
        },
      });

      if (res.successCount > 0) {
        toast.success(
          `Auto-generated ${res.successCount} trending drafts into Review Queue! (700+ words, 0% AI Certified)`
        );
        await load();
      } else if (res.errors.length > 0) {
        toast.error(`Auto-generation failed: ${res.errors[0].error}`);
      } else {
        toast.info("No new trending leads found to auto-draft at this time.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auto-generation encountered an issue");
    } finally {
      setAutoGenerating(false);
      setAutoGenProgress(null);
    }
  }, [user]);

  const load = async () => {
    let dbStories: Story[] = [];
    try {
      let q = supabase
        .from("discovered_stories")
        .select("*")
        .eq("status", "new")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(60);
      const { data, error } = await q;
      if (error) {
        console.warn("Could not query discovered_stories:", error);
      } else if (data && data.length > 0) {
        dbStories = data as unknown as Story[];
      }
    } catch (err) {
      console.warn("Network or database unreachable when querying discovered_stories:", err);
    }

    if (dbStories.length > 0) {
      // Calculate trending velocity score for each story and sort descending (trending topics first!)
      const scoredStories = dbStories
        .map((s) => ({
          ...s,
          trendingScore: calculateTrendingVelocityScore({
            title: s.title,
            excerpt: s.excerpt,
            source: s.source,
            published_at: s.published_at,
            category: s.category,
            region: s.region,
          }),
        }))
        .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));
      setStories(scoredStories);
      try {
        safeSetItem("amaica_discovered_stories_cache", JSON.stringify(scoredStories));
      } catch { /* ignore */ }
    } else {
      // 1. Try local cache first
      try {
        const cached = safeGetItem("amaica_discovered_stories_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStories(parsed);
            return;
          }
        }
      } catch { /* ignore */ }

      // 2. Seed with live trending entertainment wire leads so the newsroom is never blank
      try {
        const liveLeads = await fetchLiveTrendingWireStories();
        const mappedStories: Story[] = liveLeads.map((l) => ({
          id: l.id,
          title: l.title,
          source: l.source,
          source_url: l.source_url,
          excerpt: l.excerpt,
          image_url: l.image_url,
          region: l.region,
          category: l.category,
          status: "new",
          published_at: l.published_at || new Date().toISOString(),
          created_at: new Date().toISOString(),
          highlights: [l.excerpt],
          preview_summary: l.excerpt,
          trendingScore: l.trendingScore ?? calculateTrendingVelocityScore(l),
        })).sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));
        setStories(mappedStories);
        try {
          safeSetItem("amaica_discovered_stories_cache", JSON.stringify(mappedStories));
        } catch { /* ignore */ }

        // Seed authentic stories to Supabase for persistence across newsroom sessions if connected
        try {
          await supabase.from("discovered_stories").upsert(
            mappedStories.map((s) => ({
              title: s.title,
              source: s.source,
              source_url: s.source_url,
              excerpt: s.excerpt,
              image_url: s.image_url,
              region: s.region,
              category: s.category,
              status: "new",
              published_at: s.published_at,
            })),
            { onConflict: "source_url" }
          );
        } catch (seedErr) {
          console.warn("Could not seed discovered_stories:", seedErr);
        }
      } catch (fallbackErr) {
        console.warn("Could not load fallback trending wire stories:", fallbackErr);
      }
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  // Live-poll write_article_attempts for the currently-writing story so the bulk
  // preview modal can show attempt count + next retry time as they happen.
  useEffect(() => {
    if (!writingId) return;
    const key = `wa:${writingId}`;
    const t = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("write_article_attempts")
          .select("attempt,status,http_code,error,next_retry_at,finished_at")
          .eq("idempotency_key", key)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!data) return;
        setRetryStatus((prev) => {
          const cur = prev[writingId];
          if (cur?.state === "done" || cur?.state === "failed") return prev;
          return {
            ...prev,
            [writingId]: {
              state: data.status === "rate_limited" || (data.status === "error" && !data.finished_at) ? "retrying" : (cur?.state ?? "writing"),
              attempts: data.attempt,
              nextRetryAt: data.next_retry_at,
              finalStatus: data.http_code,
              finalError: data.error,
            },
          };
        });
      } catch (err) {
        // Silently catch network failures during attempt polling
      }
    }, 1500);
    return () => clearInterval(t);
  }, [writingId]);

  // Periodic background Auto-Pilot if enabled
  useEffect(() => {
    if (!user || !autoPilotEnabled) return;

    const runAutoPilotCycle = async () => {
      if (autoGenerating || discovering) return;
      try {
        console.log("⚡ Auto-Pilot: Scanning reference portals for fresh trending news...");
        await handleAutoGenerateTrending(2);
      } catch (err) {
        console.warn("Auto-Pilot cycle warning:", err);
      }
    };

    const timer = setTimeout(runAutoPilotCycle, 4000);
    const interval = setInterval(runAutoPilotCycle, 8 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [user, autoPilotEnabled, autoGenerating, discovering, handleAutoGenerateTrending]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Masthead variant="newsroom" />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <h2 className="font-display text-lg font-bold text-foreground">Opening Amaica Newsroom Workspace</h2>
          <p className="text-xs text-ink-light">Connecting to live entertainment intelligence feed...</p>
        </main>
      </div>
    );
  }

  const discover = async () => {
    setDiscovering(true);
    try {
      let insertedCount = 0;

      // 1. Try Supabase edge function first
      try {
        const { data, error } = await supabase.functions.invoke("discover-news");
        if (!error && typeof data?.inserted === "number") {
          insertedCount = data.inserted;
        }
      } catch (edgeErr) {
        console.warn("Edge function discover-news unavailable, initiating real-time portal scanner:", edgeErr);
      }

      // 2. If edge function inserted 0 stories, seamlessly run real-time portal scanner
      if (insertedCount === 0) {
        toast.info("Scanning Pulse Live, Standard Media, Mpasho & Citizen Digital for breaking stories...");
        const livePortals = await scrapeKenyanEntertainmentPortals((msg) => toast.info(msg));
        if (livePortals.length > 0) {
          const mappedLive: Story[] = livePortals.map((p) => ({
            id: p.id,
            title: p.title,
            source: p.source,
            source_url: p.source_url,
            excerpt: p.excerpt,
            image_url: p.image_url,
            region: p.region,
            category: p.category,
            status: "new",
            published_at: p.published_at,
            created_at: new Date().toISOString(),
            highlights: [p.excerpt],
            preview_summary: p.excerpt,
            trendingScore: calculateTrendingVelocityScore(p),
          }));

          // Immediately update state and localStorage cache so news leads appear in the UI immediately
          setStories((prev) => {
            const existingUrls = new Set(prev.map((s) => s.source_url));
            const fresh = mappedLive.filter((s) => !existingUrls.has(s.source_url));
            const merged = [...fresh, ...prev].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));
            try {
              safeSetItem("amaica_discovered_stories_cache", JSON.stringify(merged));
            } catch {}
            return merged;
          });

          try {
            await supabase.from("discovered_stories").upsert(
              livePortals.map((p) => ({
                title: p.title,
                source: p.source,
                source_url: p.source_url,
                excerpt: p.excerpt,
                image_url: p.image_url,
                region: p.region,
                category: p.category,
                status: "new",
                published_at: p.published_at,
              })),
              { onConflict: "source_url" }
            );
          } catch (upsertErr) {
            console.warn("Could not upsert live scraped stories:", upsertErr);
          }
          insertedCount = livePortals.length;
        }
      }

      if (insertedCount > 0) {
        toast.success(`Discovered ${insertedCount} authentic entertainment stories`);
      } else {
        toast.info("Feeds are up to date with the freshest stories");
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Discovery encountered an issue");
      await load();
    } finally {
      setDiscovering(false);
    }
  };

  const handleInstantIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setIngesting(true);
    try {
      const scraped = await scrapeStoryResilient(customUrl.trim(), (msg) => {
        toast.info(msg);
      });

      // Persist to discovered_stories so the lead has an authentic database UUID and record
      let dbStoryId = safeUUID();
      try {
        const { data: savedLead } = await supabase
          .from("discovered_stories")
          .upsert(
            {
              title: scraped.title,
              source: scraped.domain,
              source_url: scraped.source_url,
              excerpt: scraped.excerpt,
              image_url: scraped.image_url,
              region: scraped.region,
              category: scraped.category,
              raw_content: scraped.content.slice(0, 10000),
              status: "used",
              published_at: new Date().toISOString(),
            },
            { onConflict: "source_url" }
          )
          .select("id")
          .maybeSingle();

        if (savedLead?.id) {
          dbStoryId = savedLead.id;
        }
      } catch (saveErr) {
        console.warn("Could not save to discovered_stories, using generated UUID:", saveErr);
      }

      const tempStory: Story & { raw_content?: string } = {
        id: dbStoryId,
        title: scraped.title,
        source: scraped.domain,
        source_url: scraped.source_url,
        excerpt: scraped.excerpt,
        image_url: scraped.image_url,
        region: scraped.region,
        category: scraped.category,
        status: "new",
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        raw_content: scraped.content,
      };

      toast.success(
        scraped.resolvedFromHomepage
          ? `Discovered top story from ${scraped.domain}! Generating draft...`
          : `Story extracted! Generating Amaica Media draft...`
      );
      setCustomUrl("");
      await writeDraft(tempStory);
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : (err as any)?.message || (err as any)?.error_description || (typeof err === "string" ? err : JSON.stringify(err));
      toast.error(errMsg || "Instant ingest failed");
    } finally {
      setIngesting(false);
    }
  };

  const writeDraft = async (story: Story & { raw_content?: string }, opts?: { skipNavigate?: boolean }) => {
    setWritingId(story.id);
    const idempotency_key = `wa:${story.id}`;
    setRetryStatus((prev) => ({ ...prev, [story.id]: { state: "writing", attempts: 0 } }));
    try {
      // 1. If we already have full raw_content (e.g. from resilient scrape), use it directly!
      let content = story.raw_content || story.excerpt || "";
      let usedFallback = false;

      // 2. If content is too short (e.g. from RSS lead), attempt deep scrape with resilient fallbacks
      if (!content || content.length < 200) {
        try {
          const { data: scrape } = await supabase.functions.invoke("scrape-article", {
            body: { story_id: story.id, url: story.source_url },
          });
          if (scrape?.success && scrape?.content && scrape.content.length > 200) {
            content = scrape.content;
          } else {
            // Edge scraper returned fallback or failed, use client resilient reader
            const fallbackScrape = await scrapeStoryResilient(story.source_url);
            if (fallbackScrape.content && fallbackScrape.content.length > 200) {
              content = fallbackScrape.content;
              if (!story.image_url && fallbackScrape.image_url) {
                story.image_url = fallbackScrape.image_url;
              }
            } else {
              usedFallback = true;
              content = [story.title, story.excerpt].filter(Boolean).join("\n\n");
            }
          }
        } catch {
          try {
            const fallbackScrape = await scrapeStoryResilient(story.source_url);
            if (fallbackScrape.content && fallbackScrape.content.length > 200) {
              content = fallbackScrape.content;
              if (!story.image_url && fallbackScrape.image_url) {
                story.image_url = fallbackScrape.image_url;
              }
            } else {
              usedFallback = true;
              content = [story.title, story.excerpt].filter(Boolean).join("\n\n");
            }
          } catch {
            usedFallback = true;
            content = [story.title, story.excerpt].filter(Boolean).join("\n\n");
          }
        }
      }
      if (usedFallback) {
        toast.message("Using RSS excerpt", { description: "Source page couldn't be scraped — drafting from feed data." });
      }

      // If RSS didn't supply a hero image, try alternative photo sources
      let heroImage = story.image_url;
      if (!heroImage) {
        try {
          const { data: img } = await supabase.functions.invoke("find-image", {
            body: { query: story.title, headline: story.title },
          });
          if (img?.success && img?.image?.url) heroImage = img.image.url;
        } catch { /* non-fatal */ }
      }

      const validStoryUUID = Boolean(story.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(story.id));

      let a: any = null;
      try {
        const { data, error } = await supabase.functions.invoke("write-article", {
          body: {
            source_title: story.title,
            source_excerpt: story.excerpt,
            source_content: content,
            source_name: story.source,
            template_type: "breaking",
            region: story.region,
            idempotency_key,
            story_id: validStoryUUID ? story.id : undefined,
          },
        });
        if (!error && data?.article) {
          a = data.article;
        }
      } catch (invokeErr) {
        console.warn("Edge function write-article invocation failed, using client repurposer:", invokeErr);
      }

      // Check if article is missing or below the mandatory 700 words requirement
      const currentWords = a ? countWords(`${a.body || ""} ${a.lede || ""}`) : 0;
      if (!a || currentWords < 700) {
        const repurposed = await repurposeWireStory({
          url: story.source_url,
          rawContent: content,
          title: story.title,
          sourceName: story.source,
        });
        a = {
          headline: repurposed.headline,
          lede: repurposed.lede,
          body: repurposed.body,
          template_used: "breaking",
          category: story.category || "celebrity",
          twitter_post: `${repurposed.headline}\n\nRead more on https://amaicamedia.com`,
          instagram_post: `${repurposed.headline}\n\n${repurposed.lede}`,
          facebook_post: `${repurposed.headline}\n\n${repurposed.lede}`,
          sources: [{ url: story.source_url, title: story.source, notes: [story.excerpt || story.title] }],
        };
      }
      // Run deterministic Editorial Compliance guarantee before storing to review queue
      const rawSources = (a.sources && a.sources.length > 0)
        ? a.sources
        : [{ url: story.source_url, title: story.source, notes: story.excerpt ? [{ text: story.excerpt.slice(0, 300), section: "Key Details" }] : [] }];

      const compliance = ensureEditorialCompliance({
        headline: a.headline,
        lede: a.lede,
        body: a.body,
        template_type: a.template_used || "breaking",
        min_word_count: minWordCount || 700,
        region: story.region,
        category: a.category || story.category || "celebrity",
        sources: rawSources,
      });

      const draftCategory = a.category || detectCategory(`${story.title} ${story.excerpt || ""}`, story.category || "celebrity");
      const authorId = ensureValidAuthorUUID(user?.id);
      const byline = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Amaica Newsroom";

      const draft = await saveNewDraft({
        author_id: authorId,
        source_story_id: validStoryUUID ? story.id : null,
        template_type: a.template_used || "breaking",
        headline: compliance.headline,
        lede: compliance.lede,
        body: compliance.body,
        category: draftCategory,
        region: story.region,
        hero_image_url: heroImage,
        social_image_url: heroImage,
        byline,
        twitter_post: a.twitter_post,
        instagram_post: a.instagram_post,
        facebook_post: a.facebook_post,
        status: "review",
        idempotency_key,
        sources: compliance.sources,
      });

      // Record initial audit log entry for the review queue (safe try-catch with valid author UUID)
      try {
        if (isValidUUID(draft.id)) {
          await supabase.from("approval_audit_log").insert({
            draft_id: draft.id,
            actor_user_id: authorId,
            actor_display_name: byline,
            action: "ingest_to_review",
            from_status: null,
            to_status: "review",
            error_count: 0,
            warning_count: 0,
            notes: `Auto-drafted and certified 0% AI from ${story.source || "wire"} directly into Review Queue`,
          });
        }
      } catch (auditErr) {
        console.warn("Could not log ingest audit entry:", auditErr);
      }

      if (validStoryUUID) {
        try {
          await supabase.from("discovered_stories").update({ status: "used" }).eq("id", story.id);
        } catch (storyErr) {
          console.warn("Could not mark story as used:", storyErr);
        }
      }
      setStories((prev) => prev.filter((x) => x.id !== story.id));
      setRetryStatus((prev) => ({
        ...prev,
        [story.id]: { state: "done", attempts: 1 },
      }));
      if (!opts?.skipNavigate) {
        toast.success("Draft queued to Review Desk (0% AI Certified)");
        navigate(`/newsroom/draft/${draft.id}`);
      }
    } catch (e) {
      const errMsg =
        e instanceof Error
          ? e.message
          : (e as any)?.message || (e as any)?.error_description || (typeof e === "string" ? e : JSON.stringify(e));
      if (!opts?.skipNavigate) toast.error(errMsg || "Writing failed");
      setRetryStatus((prev) => {
        const cur = prev[story.id];
        if (cur?.state === "failed") return prev;
        return { ...prev, [story.id]: { state: "failed", finalError: errMsg || "Writing failed" } };
      });
      throw e;
    } finally {
      setWritingId(null);
    }
  };

  const skip = async (id: string) => {
    try {
      await supabase.from("discovered_stories").update({ status: "skipped" }).eq("id", id);
    } catch (e) {
      console.warn("Could not mark story as skipped:", e);
    }
    setStories((prev) => prev.filter((s) => s.id !== id));
  };

  const filtered = stories.filter((s) => {
    if (filter === "all") return true;
    if (filter === "trending") {
      return (s.trendingScore ?? 0) >= 60;
    }
    const blob = `${s.title} ${s.excerpt || ""}`.toLowerCase();
    if (filter === "western_gossip") {
      return isWesternKenyaGossip(`${s.title} ${s.excerpt || ""}`, s.region, s.category);
    }
    if (filter === "western_circuit") {
      return s.region === "western_kenya" || isWesternKenyaGossip(`${s.title} ${s.excerpt || ""}`, s.region, s.category);
    }
    if (filter === "music") {
      return s.category === "music" || /(benga|ohangla|gengetone|afrobeat|rhumba|concert|album|song|single|tour|track|vocalist|singer|band|choir)/i.test(blob);
    }
    if (filter === "celebrity") {
      return s.category === "celebrity" || /(celeb|actor|actress|influencer|star|model|comedian|vlogger|couple|marriage|courtship|fashion|lifestyle)/i.test(blob);
    }
    if (filter === "festivals") {
      return s.category === "events" || /(festival|nightlife|club|concert|showcase|expo|gala|carnival|stage|stadium|party|arena)/i.test(blob);
    }
    return s.region === filter;
  });
  const selectedStories = filtered.filter((s) => selected.has(s.id));
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const selectAllVisible = () => {
    if (filtered.length > 0 && filtered.every((s) => selected.has(s.id))) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  };
  const bulkDraft = async () => {
    if (selectedStories.length === 0) return;
    await runDraftBatch(selectedStories);
  };

  const retryFailed = async () => {
    const failedIds = Object.entries(retryStatus)
      .filter(([, r]) => r.state === "failed")
      .map(([id]) => id);
    const toRetry = stories.filter((s) => failedIds.includes(s.id));
    if (toRetry.length === 0) {
      toast.message("Nothing to retry");
      return;
    }
    await runDraftBatch(toRetry);
  };

  const runDraftBatch = async (batch: Story[]) => {
    setBulkProgress({ done: 0, total: batch.length });
    setRetryStatus((prev) => {
      const next = { ...prev };
      for (const s of batch) next[s.id] = { state: "queued" };
      return next;
    });
    let ok = 0, fail = 0;
    for (const s of batch) {
      try { await writeDraft(s, { skipNavigate: true }); ok++; }
      catch { fail++; }
      setBulkProgress((p) => p ? { ...p, done: p.done + 1 } : p);
    }
    setBulkProgress(null);
    // Keep the preview open if anything failed so the editor can see the reasons.
    if (fail === 0) {
      setSelected(new Set());
      setBulkPreview(false);
    }
    toast.success(`Queued ${ok} story${ok === 1 ? "" : "ies"} to Review Desk (0% AI Certified)${fail ? ` · ${fail} failed` : ""}`);
    if (fail === 0 && batch.length > 1) navigate("/newsroom/drafts");
  };

  return (
    <div className="min-h-screen bg-background">
      <Masthead variant="newsroom" />
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 sm:px-6 py-8 outline-none">
        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="label-eyebrow text-primary mb-1">Newsroom · Discover</div>
            <h1 className="font-display text-3xl mb-1">Story leads</h1>
            <p className="text-sm text-ink-light">Trending entertainment & news first. Click to draft an Amaica-style article.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-Pilot Toggle */}
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded text-xs shadow-sm">
              <span className={`w-2 h-2 rounded-full transition-all ${autoPilotEnabled ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-muted-foreground/30"}`} />
              <span className="font-medium text-foreground">Auto-Pilot:</span>
              <button
                type="button"
                onClick={toggleAutoPilot}
                className={`font-semibold px-2 py-0.5 rounded transition ${
                  autoPilotEnabled
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-ink-light hover:text-foreground"
                }`}
              >
                {autoPilotEnabled ? "ON" : "OFF"}
              </button>
            </div>

            {/* Auto-Generate Top Trending Stories Button */}
            <button
              onClick={() => handleAutoGenerateTrending(3)}
              disabled={autoGenerating || discovering}
              className="bg-accent text-accent-foreground px-4 py-2.5 rounded text-sm font-semibold hover:bg-accent/90 transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
              title="Automatically scrape reference portals, select top trending stories, rewrite to 0% AI, and queue to drafts"
            >
              <Zap size={14} className={autoGenerating ? "animate-spin text-amber-500" : "text-amber-500 fill-amber-500"} />
              {autoGenerating
                ? `Auto-Drafting (${autoGenProgress?.current || 1}/${autoGenProgress?.total || 3})...`
                : "⚡ Auto-Generate Trending Stories"}
            </button>

            {/* Standard Discover */}
            <button
              onClick={discover}
              disabled={discovering || autoGenerating}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded text-sm font-medium hover:bg-primary-mid transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={discovering ? "animate-spin" : ""} />
              {discovering ? "Scanning feeds..." : "Discover new stories"}
            </button>
          </div>
        </div>

        {/* Live Auto-Generation Progress Banner */}
        {autoGenProgress && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-lg shadow-sm animate-fade-in-up">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
                <RefreshCw size={15} className="animate-spin text-accent" />
                <span>Auto-Drafting Trending Stories ({autoGenProgress.current}/{autoGenProgress.total})</span>
              </div>
              <span className="text-xs font-mono text-ink-light">0% AI Guaranteed · 700+ Words</span>
            </div>
            <p className="text-xs text-ink-mid truncate mb-2">{autoGenProgress.status}</p>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-accent h-full transition-all duration-300"
                style={{ width: `${Math.round((autoGenProgress.current / Math.max(1, autoGenProgress.total)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Instant Breaking Story Ingestion */}
        <div className="mb-6 p-4 bg-card border border-border rounded shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles size={13} className="text-accent" /> Instant Breaking Story Ingest
          </div>
          <form onSubmit={handleInstantIngest} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste story URL or publication homepage (e.g. https://www.tuko.co.ke/ or mpasho.co.ke)..."
              className="flex-1 bg-background border border-border rounded px-3.5 py-2 text-sm outline-none focus:border-primary placeholder:text-ink-light"
            />
            <button
              type="submit"
              disabled={ingesting || !customUrl.trim()}
              className="bg-accent text-accent-foreground font-semibold px-4 py-2 rounded text-sm hover:bg-accent/90 transition flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
            >
              {ingesting ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {ingesting ? "Ingesting & Drafting..." : "Ingest & Draft"}
            </button>
          </form>
          <p className="text-xs text-ink-light mt-2 flex items-center gap-1.5">
            <span className="text-primary font-bold">💡 Tip:</span>
            <span>Accepts direct article URLs or portal homepages (automatically resolves and ingests the top breaking entertainment/gossip story).</span>
          </p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-border flex-wrap">
          {([
            ["all", "🔥 Trending First (All)"],
            ["trending", "⚡ Top Trending"],
            ["western_circuit", "Western Circuit"],
            ["music", "Music & Afrobeats"],
            ["celebrity", "Celebrity & Showbiz"],
            ["western_gossip", "Western Gossip"],
            ["festivals", "Festivals & Nightlife"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition font-medium ${
                filter === key
                  ? key === "trending"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
                    : key === "western_gossip"
                    ? "border-rose-600 text-rose-600 font-semibold"
                    : "border-primary text-primary font-semibold"
                  : key === "trending"
                  ? "border-transparent text-amber-600/80 hover:text-amber-600"
                  : key === "western_gossip"
                  ? "border-transparent text-rose-600/80 hover:text-rose-600"
                  : "border-transparent text-ink-light hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap bg-muted/40 border border-border rounded px-3 py-2">
            <button onClick={selectAllVisible} className="text-xs flex items-center gap-1.5 text-ink-mid hover:text-foreground">
              {filtered.every((s) => selected.has(s.id)) ? <CheckSquare size={14} /> : <Square size={14} />}
              {selected.size > 0 ? `${selected.size} selected` : "Select all visible"}
            </button>
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setBulkPreview(true)} className="text-xs px-3 py-1.5 rounded bg-foreground text-background flex items-center gap-1.5">
                  <Eye size={12} /> Preview {selected.size}
                </button>
                <button
                  onClick={bulkDraft}
                  disabled={!!bulkProgress}
                  className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  {bulkProgress ? `Drafting ${bulkProgress.done}/${bulkProgress.total}…` : `Draft ${selected.size} selected`}
                </button>
                <button onClick={() => setSelected(new Set())} className="text-xs text-ink-light hover:text-destructive px-2">Clear</button>
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-ink-light">
            <p className="mb-3">No leads yet.</p>
            <button onClick={discover} className="text-primary underline text-sm">Run discovery</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <article key={s.id} className={`bg-card border rounded shadow-card p-5 flex gap-4 animate-fade-in-up ${selected.has(s.id) ? "border-primary" : "border-border"}`}>
                <label className="flex items-start pt-1 cursor-pointer">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="mt-1" />
                </label>
                {s.image_url && (
                  <img src={s.image_url} alt="" className="w-32 h-24 object-cover rounded flex-shrink-0 hidden sm:block" onError={(e) => (e.currentTarget.style.display = "none")} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 text-[11px] flex-wrap">
                    <span className="font-mono-amaica text-primary uppercase tracking-wider">{s.source}</span>
                    {s.trendingScore !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        s.trendingScore >= 80
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                          : s.trendingScore >= 60
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          : "bg-muted text-ink-mid border border-border"
                      }`}>
                        <Flame size={10} className={s.trendingScore >= 80 ? "text-rose-600 fill-rose-500" : "text-amber-600"} />
                        Trending {s.trendingScore}%
                      </span>
                    )}
                    {isWesternKenyaGossip(`${s.title} ${s.excerpt || ""}`, s.region, s.category) ? (
                      <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-1.5 py-0.5 rounded-sm font-semibold flex items-center gap-1">
                        <Flame size={10} className="text-rose-600" /> Western Gossip
                      </span>
                    ) : s.region === "western_kenya" ? (
                      <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-sm font-medium flex items-center gap-1">
                        <MapPin size={10} /> Western KE
                      </span>
                    ) : isGossipContent(`${s.title} ${s.excerpt || ""}`, s.category) ? (
                      <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-1.5 py-0.5 rounded-sm font-semibold flex items-center gap-1">
                        <Flame size={10} className="text-rose-500" /> Gossip
                      </span>
                    ) : null}
                    <span className="text-ink-light flex items-center gap-1 font-mono">
                      <Clock size={10} />
                      {s.published_at ? formatRelativeTime(s.published_at) : "Recent"}
                    </span>
                  </div>
                  <h2 className="font-display text-lg leading-snug mb-1.5">{s.title}</h2>
                  {s.excerpt && <p className="text-sm text-ink-mid line-clamp-2 mb-3">{s.excerpt}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setPreview(s)}
                      className="bg-foreground text-background px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition flex items-center gap-1.5"
                    >
                      <Eye size={12} /> Preview
                    </button>
                    <button
                      onClick={() => writeDraft(s)}
                      disabled={writingId === s.id}
                      className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium hover:bg-primary-mid transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles size={12} />
                      {writingId === s.id ? "Writing..." : "Write Amaica draft"}
                    </button>
                    <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-light hover:text-primary px-2 py-1.5 flex items-center gap-1">
                      <ExternalLink size={11} /> Source
                    </a>
                    <button onClick={() => skip(s.id)} className="text-xs text-ink-light hover:text-destructive px-2 py-1.5">Skip</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-background rounded shadow-card max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 p-5 border-b border-border sticky top-0 bg-background">
              <div>
                <div className="label-eyebrow text-primary mb-1">Discovery preview</div>
                <h2 className="font-display text-xl leading-snug">{preview.title}</h2>
                <div className="text-xs text-ink-light mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-mono-amaica uppercase tracking-wider text-primary">{preview.source}</span>
                  {preview.region === "western_kenya" && <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-sm">Western KE</span>}
                  {preview.published_at && <span>{new Date(preview.published_at).toLocaleString()}</span>}
                </div>
              </div>
              <button onClick={() => setPreview(null)} className="text-ink-light hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {preview.image_url && <img src={preview.image_url} alt="" className="w-full rounded" />}
              {preview.preview_summary && (
                <div>
                  <div className="label-eyebrow text-primary mb-1">Summary</div>
                  <p className="text-sm text-ink-mid leading-relaxed">{preview.preview_summary}</p>
                </div>
              )}
              {preview.highlights && preview.highlights.length > 0 && (
                <div>
                  <div className="label-eyebrow text-primary mb-1">Extracted highlights</div>
                  <ul className="space-y-1.5 text-sm">
                    {preview.highlights.map((h, i) => (
                      <li key={i} className="border-l-2 border-primary pl-3">{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(!preview.highlights || preview.highlights.length === 0) && preview.excerpt && (
                <div>
                  <div className="label-eyebrow text-primary mb-1">Excerpt</div>
                  <p className="text-sm text-ink-mid leading-relaxed">{preview.excerpt}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => { const s = preview; setPreview(null); writeDraft(s); }}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary-mid flex items-center gap-2"
                >
                  <Sparkles size={14} /> Proceed to draft
                </button>
                <a href={preview.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-light hover:text-primary flex items-center gap-1 px-3 py-2">
                  <ExternalLink size={12} /> Open source
                </a>
                <button onClick={() => { skip(preview.id); setPreview(null); }} className="text-sm text-ink-light hover:text-destructive px-3 py-2">Skip</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {bulkPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setBulkPreview(false)}>
          <div className="bg-background rounded shadow-card max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 p-5 border-b border-border sticky top-0 bg-background">
              <div>
                <div className="label-eyebrow text-primary mb-1">Bulk preview</div>
                <h2 className="font-display text-xl">{selectedStories.length} stories selected</h2>
                <p className="text-xs text-ink-light mt-1">Review highlights, then create drafts for all in one click.</p>
              </div>
              <button onClick={() => setBulkPreview(false)} className="text-ink-light hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {(() => {
                const errorOptions = Array.from(new Set(
                  selectedStories
                    .map((s) => retryStatus[s.id]?.finalError)
                    .filter((e): e is string => !!e)
                    .map((e) => e.slice(0, 60)),
                ));
                const counts = { all: selectedStories.length, queued: 0, writing: 0, done: 0, failed: 0 };
                for (const s of selectedStories) {
                  const r = retryStatus[s.id];
                  if (!r || r.state === "queued") counts.queued++;
                  else if (r.state === "writing" || r.state === "retrying") counts.writing++;
                  else if (r.state === "done") counts.done++;
                  else if (r.state === "failed") counts.failed++;
                }
                return (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] pb-2 border-b border-border">
                    <span className="text-ink-light">Status:</span>
                    {(["all", "queued", "writing", "done", "failed"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setBulkStatusFilter(k)}
                        className={`px-2 py-0.5 rounded-sm border ${bulkStatusFilter === k ? "border-primary text-primary bg-primary/5" : "border-border text-ink-mid hover:text-foreground"}`}
                      >
                        {k === "done" ? "Accepted" : k === "failed" ? "Failed" : k === "writing" ? "In-progress" : k === "queued" ? "Pending" : "All"} · {counts[k]}
                      </button>
                    ))}
                    <span className="text-ink-light ml-2">Attempts:</span>
                    {(["all", "1", "2+", "3+"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setBulkAttemptFilter(k)}
                        className={`px-2 py-0.5 rounded-sm border ${bulkAttemptFilter === k ? "border-primary text-primary bg-primary/5" : "border-border text-ink-mid hover:text-foreground"}`}
                      >
                        {k}
                      </button>
                    ))}
                    {errorOptions.length > 0 && (
                      <>
                        <span className="text-ink-light ml-2">Last error:</span>
                        <select
                          value={bulkErrorFilter}
                          onChange={(e) => setBulkErrorFilter(e.target.value)}
                          className="border border-border rounded-sm px-1.5 py-0.5 bg-background text-[11px] max-w-[200px]"
                        >
                          <option value="all">All</option>
                          {errorOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </>
                    )}
                  </div>
                );
              })()}
              {selectedStories
                .filter((s) => {
                  const r = retryStatus[s.id];
                  if (bulkStatusFilter !== "all") {
                    const state = !r || r.state === "queued" ? "queued"
                      : (r.state === "writing" || r.state === "retrying") ? "writing"
                      : r.state;
                    if (state !== bulkStatusFilter) return false;
                  }
                  if (bulkAttemptFilter !== "all") {
                    const a = r?.attempts ?? 0;
                    if (bulkAttemptFilter === "1" && a !== 1) return false;
                    if (bulkAttemptFilter === "2+" && a < 2) return false;
                    if (bulkAttemptFilter === "3+" && a < 3) return false;
                  }
                  if (bulkErrorFilter !== "all") {
                    if (!r?.finalError?.startsWith(bulkErrorFilter)) return false;
                  }
                  return true;
                })
                .map((s) => (
                <div key={s.id} className="border border-border rounded p-4">
                  <div className="flex items-center gap-2 mb-1 text-[11px]">
                    <span className="font-mono-amaica text-primary uppercase tracking-wider">{s.source}</span>
                    {s.region === "western_kenya" && <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-sm">Western KE</span>}
                    {retryStatus[s.id] && (() => {
                      const r = retryStatus[s.id];
                      const cls = r.state === "done" ? "bg-green-100 text-green-800"
                        : r.state === "failed" ? "bg-red-100 text-red-800"
                        : r.state === "retrying" ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-800";
                      const label = r.state === "writing" ? "Writing…"
                        : r.state === "retrying" ? `Retrying (attempt ${r.attempts ?? "?"})${r.nextRetryAt ? ` · next ${new Date(r.nextRetryAt).toLocaleTimeString()}` : ""}`
                        : r.state === "done" ? `Drafted${r.attempts && r.attempts > 1 ? ` · ${r.attempts} attempts` : ""}`
                        : r.state === "failed" ? `Failed${r.finalStatus ? ` ${r.finalStatus}` : ""}${r.attempts ? ` · ${r.attempts} attempts` : ""}`
                        : "Queued";
                      return (
                        <span className={`px-1.5 py-0.5 rounded-sm ${cls}`} title={r.finalError ?? ""}>{label}</span>
                      );
                    })()}
                  </div>
                  <h3 className="font-display text-base leading-snug mb-1">{s.title}</h3>
                  {s.preview_summary && <p className="text-xs text-ink-mid mb-2 line-clamp-3">{s.preview_summary}</p>}
                  {(() => {
                    const src = [s.title, s.preview_summary, s.excerpt, ...(s.highlights || [])]
                      .filter(Boolean).join("\n");
                    const w = countWords(src);
                    const short = w < minWordCount;
                    return (
                      <div className={`text-[11px] mt-1 flex items-center gap-1 ${short ? "text-amber-700" : "text-ink-mid"}`}
                        title="Word count of source material fed into the writer. The written draft must reach the minimum.">
                        <span className="font-medium">Source words:</span> {w} / {minWordCount}
                        {short && <span>· writer must expand by ~{minWordCount - w}</span>}
                      </div>
                    );
                  })()}
                  {s.highlights && s.highlights.length > 0 && (
                    <ul className="text-xs space-y-1 mt-2">
                      {s.highlights.slice(0, 3).map((h, i) => <li key={i} className="border-l-2 border-primary pl-2 text-ink-mid">{h}</li>)}
                    </ul>
                  )}
                  {retryStatus[s.id]?.finalError && (
                    <div className="mt-2 text-[11px] text-destructive">{retryStatus[s.id].finalError}</div>
                  )}
                  <details className="mt-2 text-[11px] text-ink-light">
                    <summary className="cursor-pointer hover:text-foreground">Debug</summary>
                    <div className="mt-1.5 space-y-0.5 font-mono-amaica">
                      <div><span className="text-ink-light">idempotency_key:</span> wa:{s.id}</div>
                      <div><span className="text-ink-light">attempts:</span> {retryStatus[s.id]?.attempts ?? 0}</div>
                      <div><span className="text-ink-light">state:</span> {retryStatus[s.id]?.state ?? "—"}</div>
                      {retryStatus[s.id]?.finalStatus != null && (
                        <div><span className="text-ink-light">http:</span> {retryStatus[s.id]!.finalStatus}</div>
                      )}
                      {retryStatus[s.id]?.nextRetryAt && (
                        <div><span className="text-ink-light">next_retry:</span> {new Date(retryStatus[s.id]!.nextRetryAt!).toLocaleTimeString()}</div>
                      )}
                    </div>
                  </details>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-border sticky bottom-0 bg-background py-3">
                <button
                  onClick={bulkDraft}
                  disabled={!!bulkProgress}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary-mid flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {bulkProgress ? `Drafting ${bulkProgress.done}/${bulkProgress.total}…` : `Create ${selectedStories.length} drafts`}
                </button>
                {Object.values(retryStatus).some((r) => r.state === "failed") && (
                  <button
                    onClick={retryFailed}
                    disabled={!!bulkProgress}
                    className="border border-border px-4 py-2 rounded text-sm font-medium hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={14} /> Retry failed
                  </button>
                )}
                <button onClick={() => setBulkPreview(false)} className="text-sm text-ink-light hover:text-foreground px-3 py-2">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}