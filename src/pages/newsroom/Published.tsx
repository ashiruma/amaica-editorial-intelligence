import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Masthead } from "@/components/Masthead";
import { useAuth } from "@/lib/auth";
import { Flame } from "lucide-react";
import { isWesternKenyaGossip, isGossipContent } from "@/lib/localScraper";
import { fetchAllNewsroomDrafts } from "@/lib/editorial/draftStorage";

type Item = { id: string; headline: string; category: string | null; region: string; published_at: string | null; hero_image_url: string | null };

export default function Published() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "western_gossip" | "western_kenya" | "gossip">("all");

  useEffect(() => {
    if (!user) return;
    fetchAllNewsroomDrafts({ showPublished: true }).then((all) => {
      const pub = all.filter((d) => d.status === "published");
      setItems(pub as Item[]);
    }).catch((err) => {
      console.warn("Could not fetch published drafts:", err);
    });
  }, [user]);

  const filteredItems = items.filter((d) => {
    if (activeFilter === "western_gossip") {
      return isWesternKenyaGossip(d.headline, d.region, d.category);
    }
    if (activeFilter === "western_kenya") {
      return d.region === "western_kenya";
    }
    if (activeFilter === "gossip") {
      return isGossipContent(d.headline, d.category);
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
            <div className="label-eyebrow text-primary mb-1">Newsroom · Published</div>
            <h1 className="font-display text-3xl">Live on Amaica</h1>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {([
            ["all", "All Live"],
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
                    : "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-ink-mid hover:text-foreground border border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded shadow-card divide-y divide-border">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-ink-light">No published stories match your filter.</div>
          ) : filteredItems.map((d) => {
            const isWestGossip = isWesternKenyaGossip(d.headline, d.region, d.category);
            const isGossip = isGossipContent(d.headline, d.category);
            return (
              <div key={d.id} className="p-4 hover:bg-muted flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-widest text-primary flex-wrap">
                    <span>{d.category || "Celebrity"}</span>
                    {d.region === "western_kenya" && <span>· Western KE</span>}
                    {isWestGossip ? (
                      <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Flame size={10} className="text-rose-600" /> Western Gossip
                      </span>
                    ) : isGossip ? (
                      <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Flame size={10} className="text-rose-500" /> Gossip
                      </span>
                    ) : null}
                  </div>
                  <h2 className="font-display text-lg">{d.headline}</h2>
                  <div className="text-[11px] text-ink-light mt-1">{d.published_at ? new Date(d.published_at).toLocaleString() : ""}</div>
                </div>
                <Link to={`/article/${d.id}`} className="text-xs text-ink-light hover:text-primary px-2 py-1">View</Link>
                <Link to={`/newsroom/draft/${d.id}`} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded font-medium hover:bg-primary-mid">Edit</Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}