import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { Search, Clock, Flame } from "lucide-react";
import { LegendOfDay } from "@/components/LegendOfDay";
import { formatRelativeTime, isWesternKenyaGossip, isGossipContent } from "@/lib/localScraper";

type Article = {
  id: string;
  headline: string;
  lede: string | null;
  category: string | null;
  region: string;
  hero_image_url: string | null;
  published_at: string | null;
};

export default function PublicHome() {
  const { category } = useParams<{ category?: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [region, setRegion] = useState<"all" | "western_kenya" | "national" | "world">("all");
  const [westernGossipOnly, setWesternGossipOnly] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let q = supabase
      .from("drafts")
      .select("id, headline, lede, category, region, hero_image_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(30);
    if (category) q = q.eq("category", category);
    q.then(({ data }) => setArticles((data as Article[]) || []));
  }, [category]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (westernGossipOnly) {
        const isWestGossip = isWesternKenyaGossip(`${a.headline} ${a.lede ?? ""}`, a.region, a.category);
        if (!isWestGossip) return false;
      }
      if (region !== "all" && a.region !== region) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!`${a.headline} ${a.lede ?? ""} ${a.category ?? ""}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [articles, region, query, westernGossipOnly]);

  const isFiltering = region !== "all" || query.trim().length > 0 || !!category || westernGossipOnly;
  const hero = !isFiltering ? articles[0] : undefined;
  const western = articles.filter((a) => a.region === "western_kenya").slice(0, 4);
  const westernGossipStories = articles.filter((a) => isWesternKenyaGossip(`${a.headline} ${a.lede ?? ""}`, a.region, a.category)).slice(0, 4);
  const list = isFiltering ? filtered : articles.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Masthead variant="public" />
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 py-8 outline-none">
        {!category && <LegendOfDay />}
        {category && (
          <div className="mb-6">
            <div className="label-eyebrow text-primary mb-1">Section</div>
            <h1 className="font-display text-3xl capitalize flex items-center gap-2">
              {category === "gossip" && <Flame className="text-destructive inline" size={28} />}
              {category === "gossip" ? "Gossip & Rumours" : category}
            </h1>
            {category === "gossip" && (
              <p className="text-sm text-ink-light mt-1">Exclusive celebrity buzz, verified insider reports, and showbiz gossip from Western Kenya and across the nation.</p>
            )}
          </div>
        )}

        {/* Filter bar */}
        <div role="search" aria-label="Article filter and search" className="mb-6 flex flex-wrap items-center gap-3 bg-card border border-border rounded p-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={14} className="text-ink-light" aria-hidden="true" />
            <input
              type="search"
              id="article-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search headlines, ledes, topics…"
              aria-label="Search headlines, ledes, topics"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-light"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[12px]" role="group" aria-label="Filter by region and gossip">
            <button
              type="button"
              onClick={() => {
                const next = !westernGossipOnly;
                setWesternGossipOnly(next);
                if (next) setRegion("western_kenya");
              }}
              aria-pressed={westernGossipOnly}
              className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 font-semibold ${
                westernGossipOnly
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900"
              }`}
            >
              <Flame size={12} className={westernGossipOnly ? "text-amber-200 animate-pulse" : "text-rose-500"} />
              Western Kenya Gossip
            </button>
            {([
              ["all", "All regions"],
              ["western_kenya", "Western Kenya"],
              ["national", "National"],
              ["world", "World"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => {
                  setRegion(k);
                  if (k !== "western_kenya" && westernGossipOnly) setWesternGossipOnly(false);
                }}
                aria-pressed={region === k && !westernGossipOnly}
                className={`px-3 py-1.5 rounded transition ${region === k && !westernGossipOnly ? "bg-primary text-primary-foreground font-medium" : "text-ink-light hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {(query || region !== "all" || westernGossipOnly) && (
            <button onClick={() => { setQuery(""); setRegion("all"); setWesternGossipOnly(false); }} aria-label="Reset search and filters" className="text-[12px] text-destructive hover:underline">Clear</button>
          )}
        </div>

        {hero && (
          <Link to={`/article/${hero.id}`} className="block mb-10 group">
            <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 items-center bg-card border border-border rounded shadow-elevated overflow-hidden">
              <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                {hero.hero_image_url ? (
                  <img src={hero.hero_image_url} alt={hero.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center font-display text-primary-foreground/30 text-6xl">A</div>
                )}
                <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-[10px] font-medium tracking-widest uppercase px-2 py-1">Top Story</div>
              </div>
              <div className="p-6">
                <div className="label-eyebrow text-primary mb-2">{hero.category} {hero.region === "western_kenya" && "· Western Kenya"}{hero.region === "world" && "· World"}</div>
                <h2 className="font-display text-3xl md:text-4xl leading-tight mb-3 group-hover:text-primary transition">{hero.headline}</h2>
                <p className="text-ink-mid leading-relaxed line-clamp-3">{hero.lede}</p>
              </div>
            </div>
          </Link>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded">
            <div className="label-eyebrow text-primary mb-2">No stories yet</div>
            <h2 className="font-display text-2xl mb-3">The desk is warming up.</h2>
            <p className="text-sm text-ink-light mb-5">Sign in to the newsroom to discover and write your first story.</p>
            <Link to="/newsroom" className="inline-block bg-primary text-primary-foreground px-5 py-2 rounded text-sm font-medium hover:bg-primary-mid transition">Open Newsroom</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px bg-border flex-1" />
                <h2 className="label-eyebrow text-primary">
                  {isFiltering ? `${list.length} ${list.length === 1 ? "result" : "results"}` : "Latest"}
                </h2>
                <div className="h-px bg-border flex-1" />
              </div>
              {list.length === 0 ? (
                <p className="text-center text-sm text-ink-light py-10">No stories match your filters.</p>
              ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {list.map((a) => (
                  <Link key={a.id} to={`/article/${a.id}`} className="group flex flex-col justify-between">
                    <div>
                      <div className="aspect-[16/10] bg-muted overflow-hidden mb-3 rounded border border-border">
                        {a.hero_image_url ? (
                          <img src={a.hero_image_url} alt={a.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-teal-light flex items-center justify-center font-display text-primary/30 text-4xl">A</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="label-eyebrow text-primary">{a.category} {a.region === "western_kenya" && "· Western KE"}{a.region === "world" && "· World"}</span>
                          {isGossipContent(`${a.headline} ${a.lede ?? ""}`, a.category) && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                              <Flame size={10} className="text-rose-500" /> Gossip
                            </span>
                          )}
                        </div>
                        {a.published_at && (
                          <span className="text-[11px] text-ink-light flex items-center gap-1">
                            <Clock size={11} /> {formatRelativeTime(a.published_at)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-xl leading-snug group-hover:text-primary transition mb-1">{a.headline}</h3>
                      <p className="text-sm text-ink-light line-clamp-2">{a.lede}</p>
                    </div>
                  </Link>
                ))}
              </div>
              )}
            </section>
            {!category && (
              <aside className="space-y-6">
                <div className="bg-card border border-border rounded p-5 shadow-card sticky top-24">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                    <div className="w-1.5 h-5 bg-destructive rounded-full" />
                    <h3 className="font-display text-lg font-bold">Western Kenya Desk</h3>
                  </div>
                  {western.length === 0 ? (
                    <p className="text-sm text-ink-light">No regional stories yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {western.map((a, i) => (
                        <li key={a.id} className="pb-3 border-b border-border last:border-0 last:pb-0">
                          <Link to={`/article/${a.id}`} className="group flex gap-2.5">
                            <span className="font-display text-2xl text-accent font-bold leading-none">{i + 1}</span>
                            <div>
                              <span className="text-xs text-primary font-semibold uppercase tracking-wider block mb-0.5">{a.category || "Culture"}</span>
                              <span className="text-sm group-hover:text-primary transition leading-snug font-medium line-clamp-2">{a.headline}</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {westernGossipStories.length > 0 && (
                  <div className="bg-card border border-rose-200 dark:border-rose-900/60 rounded p-5 shadow-card">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                      <Flame size={18} className="text-rose-600" />
                      <h3 className="font-display text-lg font-bold text-foreground">Western Kenya Gossip</h3>
                    </div>
                    <ul className="space-y-3">
                      {westernGossipStories.map((a) => (
                        <li key={a.id} className="pb-3 border-b border-border last:border-0 last:pb-0">
                          <Link to={`/article/${a.id}`} className="group flex gap-2.5">
                            <Flame size={14} className="text-rose-500 mt-1 flex-shrink-0" />
                            <div>
                              <span className="text-xs text-rose-600 font-semibold uppercase tracking-wider block mb-0.5">Udaku · Western</span>
                              <span className="text-sm group-hover:text-primary transition leading-snug font-medium line-clamp-2">{a.headline}</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}