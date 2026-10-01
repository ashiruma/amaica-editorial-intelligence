import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Masthead } from "@/components/Masthead";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { FileText, Bot, Flame, Trash2, AlertTriangle, Zap, RefreshCw } from "lucide-react";
import { analyzeAiContent } from "@/lib/aiContentDetector";
import { isWesternKenyaGossip, isGossipContent } from "@/lib/localScraper";
import { fetchAllNewsroomDrafts, deleteAllNewsroomDrafts } from "@/lib/editorial/draftStorage";
import { autoGenerateTrendingStories } from "@/lib/editorial/wireRepurposingEngine";

type Draft = {
  id: string;
  headline: string;
  lede: string | null;
  body: string | null;
  category: string | null;
  region: string;
  status: string;
  template_type: string;
  updated_at: string;
};

export default function DraftsList() {
  const { user, loading } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showPublished, setShowPublished] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "review" | "western_gossip" | "western_kenya" | "gossip">("all");
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoGenProgress, setAutoGenProgress] = useState<string | null>(null);

  const loadDrafts = async () => {
    const all = await fetchAllNewsroomDrafts({ showPublished });
    setDrafts(all as unknown as Draft[]);
  };

  useEffect(() => {
    loadDrafts();
  }, [user, showPublished]);

  const handleGenerateLiveDrafts = async () => {
    setAutoGenerating(true);
    setAutoGenProgress("Scanning live feeds & auto-drafting 3 verified stories...");
    try {
      const res = await autoGenerateTrendingStories({
        count: 3,
        userId: user?.id || "2d623b06-aaca-414a-a0f8-fd7f12e372c6",
        userDisplayName: user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Amaica Newsroom",
        onProgress: (status) => setAutoGenProgress(status),
      });
      if (res.successCount > 0) {
        toast.success(`Generated ${res.successCount} machine-verified drafts into Review Queue! (700+ words, 0% AI Certified)`);
        await loadDrafts();
      } else {
        toast.error(res.errors[0]?.error || "Could not generate drafts");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft generation failed");
    } finally {
      setAutoGenerating(false);
      setAutoGenProgress(null);
    }
  };

  const filteredDrafts = drafts.filter((d) => {
    if (activeFilter === "review") {
      return d.status === "review";
    }
    if (activeFilter === "western_gossip") {
      return isWesternKenyaGossip(`${d.headline} ${d.lede ?? ""}`, d.region, d.category);
    }
    if (activeFilter === "western_kenya") {
      return d.region === "western_kenya" || d.region === "kakamega";
    }
    if (activeFilter === "gossip") {
      return isGossipContent(`${d.headline} ${d.lede ?? ""}`, d.category);
    }
    return true;
  });

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteAllNewsroomDrafts();
      setDrafts([]);
      setShowDeleteAllConfirm(false);
      toast.success(`Deleted all ${res.deletedCount} drafts from newsroom`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete drafts");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <Masthead variant="newsroom" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="label-eyebrow text-primary mb-1">Newsroom · Drafts</div>
            <h1 className="font-display text-3xl">Working stories</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleGenerateLiveDrafts}
              disabled={autoGenerating}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
              title="Automatically generate machine-verified 700+ word drafts from live wire feeds"
            >
              <Zap size={13} className={autoGenerating ? "animate-spin text-amber-500" : "text-amber-500 fill-amber-500"} />
              <span>{autoGenerating ? "Generating Live Drafts..." : "Generate Live Wire Drafts"}</span>
            </button>
            <label className="flex items-center gap-2 text-xs text-ink-mid cursor-pointer">
              <input type="checkbox" checked={showPublished} onChange={(e) => setShowPublished(e.target.checked)} />
              Include published (edit live posts)
            </label>
            {drafts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(true)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Delete all drafts permanently"
              >
                <Trash2 size={13} />
                <span>Delete All Drafts</span>
              </button>
            )}
          </div>
        </div>

        {autoGenProgress && (
          <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded text-xs text-accent-foreground flex items-center gap-2 animate-fade-in-up">
            <RefreshCw size={13} className="animate-spin text-accent" />
            <span>{autoGenProgress}</span>
          </div>
        )}

        {/* Quick filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {([
            ["all", "All Stories"],
            ["review", "In Review Queue"],
            ["western_gossip", "Western Gossip"],
            ["western_kenya", "Western Kenya"],
            ["gossip", "All Gossip (Udaku)"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`text-xs px-3 py-1.5 rounded font-medium transition ${
                activeFilter === key
                  ? key === "western_gossip"
                    ? "bg-rose-600 text-white font-semibold"
                    : key === "review"
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-ink-mid hover:text-foreground border border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredDrafts.length === 0 ? (
          <div className="text-center py-16 px-4 border border-border border-dashed rounded-lg bg-card/50">
            <FileText size={36} className="mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-display text-base font-bold text-foreground mb-1">No drafts in this view</h3>
            <p className="text-xs text-ink-light max-w-md mx-auto mb-5">
              No stories match your current filter. You can instantly draft stories from live wire feeds or visit Discover to browse unassigned leads.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateLiveDrafts}
                disabled={autoGenerating}
                className="px-4 py-2 rounded text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <Zap size={13} className={autoGenerating ? "animate-spin text-amber-500" : "text-amber-500 fill-amber-500"} />
                <span>{autoGenerating ? "Auto-Drafting Live Stories..." : "Generate Live Wire Drafts Now"}</span>
              </button>
              <Link
                to="/newsroom"
                className="px-4 py-2 rounded text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-mid transition flex items-center gap-1.5 shadow-xs"
              >
                Browse Live Intelligence Signals
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded shadow-card divide-y divide-border">
            {filteredDrafts.map((d) => {
              const ai = analyzeAiContent(d.body || "", d.headline, d.lede || "");
              const isWestGossip = isWesternKenyaGossip(`${d.headline} ${d.lede ?? ""}`, d.region, d.category);
              const isGossip = isGossipContent(`${d.headline} ${d.lede ?? ""}`, d.category);
              return (
                <Link key={d.id} to={`/newsroom/draft/${d.id}`} className="block p-4 hover:bg-muted transition">
                  <div className="flex items-center gap-2 mb-1 text-[10px] uppercase tracking-widest flex-wrap">
                    <span className={`px-2 py-0.5 rounded-sm font-medium ${d.status === "review" ? "bg-accent text-accent-foreground" : "bg-teal-light text-primary"}`}>{d.status}</span>
                    <span className="text-ink-light">{d.template_type}</span>
                    {d.category && <span className="text-ink-light">· {d.category}</span>}
                    {d.region === "western_kenya" && <span className="text-destructive font-semibold">· Western KE</span>}
                    {isWestGossip ? (
                      <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Flame size={10} className="text-rose-600" /> Western Gossip
                      </span>
                    ) : isGossip ? (
                      <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Flame size={10} className="text-rose-500" /> Gossip
                      </span>
                    ) : null}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] border font-mono font-medium ml-auto flex items-center gap-1 ${
                      ai.score >= 76
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
                        : ai.score >= 56
                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300"
                        : ai.score >= 26
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300"
                    }`}>
                      <Bot size={10} />
                      {ai.score >= 76
                        ? `AI Flagged (${ai.score}%)`
                        : ai.score >= 56
                        ? `AI Warning (${ai.score}%)`
                        : ai.score >= 26
                        ? `Mixed AI (${ai.score}%)`
                        : "0% Human Voice (Verified)"}
                    </span>
                  </div>
                <h2 className="font-display text-lg leading-snug">{d.headline}</h2>
                <div className="text-[11px] text-ink-light mt-1">Updated {d.updated_at ? new Date(d.updated_at).toLocaleString() : "Recently"}</div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Delete All Drafts Confirmation Modal */}
        {showDeleteAllConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h2 className="text-base font-bold text-foreground">Delete All Newsroom Drafts?</h2>
              </div>
              <p className="text-xs text-ink-mid">
                Are you sure you want to permanently delete all {drafts.length} working drafts? This will purge all draft stories from both local newsroom storage and the remote database. This action cannot be undone.
              </p>
              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="px-3.5 py-1.5 text-xs rounded border border-border text-ink-mid hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteAll}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Trash2 size={13} />
                  {isDeleting ? "Deleting all..." : "Yes, Delete All Drafts"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}