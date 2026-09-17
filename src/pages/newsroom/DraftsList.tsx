import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Masthead } from "@/components/Masthead";
import { useAuth } from "@/lib/auth";
import { FileText, Bot, Flame } from "lucide-react";
import { analyzeAiContent } from "@/lib/aiContentDetector";
import { isWesternKenyaGossip, isGossipContent } from "@/lib/localScraper";
import { fetchAllNewsroomDrafts } from "@/lib/editorial/draftStorage";

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

  useEffect(() => {
    if (!user) return;
    fetchAllNewsroomDrafts({ showPublished }).then((all) => {
      setDrafts(all as unknown as Draft[]);
    });
  }, [user, showPublished]);

  const filteredDrafts = drafts.filter((d) => {
    if (activeFilter === "review") {
      return d.status === "review";
    }
    if (activeFilter === "western_gossip") {
      return isWesternKenyaGossip(`${d.headline} ${d.lede ?? ""}`, d.region, d.category);
    }
    if (activeFilter === "western_kenya") {
      return d.region === "western_kenya";
    }
    if (activeFilter === "gossip") {
      return isGossipContent(`${d.headline} ${d.lede ?? ""}`, d.category);
    }
    return true;
  });

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/newsroom/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Masthead variant="newsroom" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="label-eyebrow text-primary mb-1">Newsroom · Drafts</div>
            <h1 className="font-display text-3xl">Working stories</h1>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-mid">
            <input type="checkbox" checked={showPublished} onChange={(e) => setShowPublished(e.target.checked)} />
            Include published (edit live posts)
          </label>
        </div>

        {/* Quick filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {([
            ["all", "All Stories"],
            ["review", "⏳ In Review Queue"],
            ["western_gossip", "🔥 Western Gossip"],
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
          <div className="text-center py-16 text-ink-light">
            <FileText size={32} className="mx-auto mb-3 opacity-40" />
            <p>No drafts match your filter. Head to <Link to="/newsroom" className="text-primary underline">Discover</Link> to create one.</p>
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
      </main>
    </div>
  );
}