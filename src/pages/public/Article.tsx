import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { ArrowLeft, ExternalLink, Link as LinkIcon, Share2, MessageCircle, Twitter, Facebook, Copy, Check, Clock, Calendar } from "lucide-react";
import { noteText, noteSection, type SourceRef } from "@/lib/articleValidation";
import { calculateReadTime, formatRelativeTime, getShareUrls } from "@/lib/localScraper";
import { getLocalDrafts } from "@/lib/editorial/draftStorage";
import { toast } from "sonner";

type Article = {
  id: string;
  headline: string;
  lede: string | null;
  body: string | null;
  category: string | null;
  region: string;
  hero_image_url: string | null;
  published_at: string | null;
  byline: string | null;
  sources: SourceRef[] | null;
};

export default function PublicArticle() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);

    const loadArticle = async () => {
      try {
        const { data, error } = await supabase
          .from("drafts")
          .select("id, headline, lede, body, category, region, hero_image_url, published_at, byline, sources")
          .eq("id", id)
          .eq("status", "published")
          .maybeSingle();

        if (!error && data) {
          const art = data as unknown as Article;
          setArticle(art);

          // Fetch related articles
          try {
            let rq = supabase
              .from("drafts")
              .select("id, headline, lede, body, category, region, hero_image_url, published_at, byline, sources")
              .eq("status", "published")
              .neq("id", id)
              .order("published_at", { ascending: false })
              .limit(3);
            if (art.category) rq = rq.eq("category", art.category);
            const { data: relData } = await rq;
            if (relData && relData.length > 0) {
              setRelated(relData as unknown as Article[]);
              return;
            }
          } catch { /* ignore related error */ }
        }
      } catch (err) {
        console.warn("Could not query draft from Supabase:", err);
      }

      // Fallback to local drafts if Supabase fails or article not found in DB
      const local = getLocalDrafts().find((d) => d.id === id);
      if (local) {
        setArticle({
          id: local.id,
          headline: local.headline,
          lede: local.lede,
          body: local.body,
          category: local.category,
          region: local.region,
          hero_image_url: local.hero_image_url,
          published_at: local.published_at || local.updated_at,
          byline: local.byline,
          sources: local.sources as SourceRef[],
        });
        const otherLocals = getLocalDrafts()
          .filter((d) => d.id !== id && d.status === "published")
          .map((d) => ({
            id: d.id,
            headline: d.headline,
            lede: d.lede,
            body: d.body,
            category: d.category,
            region: d.region,
            hero_image_url: d.hero_image_url,
            published_at: d.published_at || d.updated_at,
            byline: d.byline,
            sources: d.sources as SourceRef[],
          }));
        setRelated(otherLocals.slice(0, 3));
        return;
      }

      setNotFound(true);
    };

    loadArticle();
  }, [id]);

  if (notFound) return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Masthead variant="public" />
        <div className="max-w-2xl mx-auto p-12 text-center text-ink-light">
          <h2 className="font-display text-2xl text-foreground mb-2">Article Not Found</h2>
          <p className="mb-6">The requested story could not be found or has not been published yet.</p>
          <Link to="/feed" className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary-mid">
            Back to Headlines
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (!article) return <div className="min-h-screen bg-background"><Masthead variant="public" /></div>;

  const currentUrl = window.location.href;
  const shareUrls = getShareUrls(article.headline, currentUrl);
  const readTime = calculateReadTime(article.body || article.lede || "");
  const timeAgo = formatRelativeTime(article.published_at);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    toast.success("Article link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const renderBody = (bodyText: string) => {
    const blocks = bodyText.split(/\n\n+/);
    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // Heading 2: ## ...
      const h2 = trimmed.match(/^##\s+(.+)$/);
      if (h2) {
        return (
          <h2 key={idx} className="font-display text-2xl md:text-3xl font-bold mt-10 mb-4 text-foreground border-b border-border/70 pb-2">
            {h2[1]}
          </h2>
        );
      }

      // Heading 3: ### ...
      const h3 = trimmed.match(/^###\s+(.+)$/);
      if (h3) {
        return (
          <h3 key={idx} className="font-display text-xl font-bold mt-8 mb-3 text-foreground">
            {h3[1]}
          </h3>
        );
      }

      // Blockquote: > ...
      if (trimmed.startsWith(">")) {
        const quoteText = trimmed.replace(/^>\s*/gm, "");
        return (
          <blockquote key={idx} className="my-6 pl-5 border-l-4 border-accent bg-accent/10 py-3.5 px-4 rounded-r italic text-foreground text-lg leading-relaxed shadow-sm">
            "{quoteText}"
          </blockquote>
        );
      }

      // Bullet lists: - ... or * ...
      if (/^[\*\-]\s+/m.test(trimmed)) {
        const items = trimmed.split(/\n/).filter((l) => /^[\*\-]\s+/.test(l));
        return (
          <ul key={idx} className="my-4 space-y-2 list-disc pl-6 text-[17px] leading-relaxed text-ink-mid">
            {items.map((it, i) => (
              <li key={i} dangerouslySetInnerHTML={{
                __html: it.replace(/^[\*\-]\s+/, "")
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-accent font-medium">$1</a>')
              }} />
            ))}
          </ul>
        );
      }

      // Standard Paragraph with inline formatting
      return (
        <p
          key={idx}
          className="mb-6 leading-relaxed text-[17px] md:text-[18px] text-ink-mid"
          dangerouslySetInnerHTML={{
            __html: trimmed
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-accent font-medium">$1</a>')
          }}
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Masthead variant="public" />
        <main id="main-content" tabIndex={-1} className="max-w-3xl mx-auto px-4 sm:px-6 py-10 outline-none">
          <Link to="/feed" className="inline-flex items-center gap-1.5 text-xs text-ink-light hover:text-primary mb-6 transition font-medium focus-visible:ring-2 focus-visible:ring-primary rounded">
            <ArrowLeft size={13} aria-hidden="true" /> Back to Headlines
          </Link>

          {/* Eyebrow / Category & Region */}
          <div className="flex items-center gap-2 mb-3">
            <span className="label-eyebrow text-primary font-semibold">
              {article.category || "Entertainment"}
            </span>
            {article.region === "western_kenya" && (
              <span className="bg-accent/20 text-accent-foreground text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">
                Western Kenya
              </span>
            )}
            {article.region === "world" && (
              <span className="bg-muted text-ink-mid text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">
                World
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.15] mb-4 text-foreground font-bold tracking-tight">
            {article.headline}
          </h1>

          {/* Lede / Standfirst */}
          {article.lede && (
            <p className="text-xl md:text-2xl text-ink-mid leading-relaxed mb-6 font-light border-l-2 border-primary pl-4 py-1 italic">
              {article.lede}
            </p>
          )}

          {/* Byline & Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 mb-6 border-y border-border text-[12px] text-ink-light">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">
                By {article.byline || "Amaica Newsroom"}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar size={13} aria-hidden="true" />
                {article.published_at && new Date(article.published_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                {timeAgo && ` (${timeAgo})`}
              </span>
            </div>
            <div className="flex items-center gap-1 text-primary font-medium">
              <Clock size={13} aria-hidden="true" /> {readTime}
            </div>
          </div>

          {/* Hero Image */}
          {article.hero_image_url && (
            <div className="mb-8 rounded overflow-hidden shadow-elevated border border-border">
              <img
                src={article.hero_image_url}
                alt={article.headline}
                className="w-full aspect-[16/9] object-cover"
              />
            </div>
          )}

          {/* Social Share Toolbar */}
          <div role="region" aria-label="Share this story" className="mb-8 p-3.5 bg-card border border-border rounded flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-mid">
              <Share2 size={14} className="text-primary" aria-hidden="true" /> Share story:
            </div>
            <div className="flex items-center gap-2">
              <a
                href={shareUrls.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share this story on WhatsApp"
                className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#1EBE5D] transition shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MessageCircle size={14} aria-hidden="true" /> WhatsApp
              </a>
              <a
                href={shareUrls.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share this story on X (Twitter)"
                className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-neutral-800 transition shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Twitter size={13} aria-hidden="true" /> X
              </a>
              <a
                href={shareUrls.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share this story on Facebook"
                className="inline-flex items-center gap-1.5 bg-[#1877F2] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#0d65d9] transition shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Facebook size={13} aria-hidden="true" /> Share
              </a>
              <button
                onClick={copyToClipboard}
                aria-label="Copy story link to clipboard"
                className="inline-flex items-center gap-1 bg-muted text-ink-mid px-2.5 py-1.5 rounded text-xs font-medium hover:bg-muted/80 transition focus-visible:ring-2 focus-visible:ring-primary"
              >
                {copied ? <Check size={13} className="text-green-600" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Article Body */}
          <article className="max-w-none text-ink-mid">
            {article.body ? renderBody(article.body) : <p className="text-ink-light">Article body in development.</p>}
          </article>

          {/* Bottom Social Share */}
          <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm font-semibold text-foreground">
              Liked this story? Share it with friends:
            </div>
            <div className="flex items-center gap-2">
              <a
                href={shareUrls.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3.5 py-2 rounded text-xs font-semibold hover:bg-[#1EBE5D] transition shadow-sm"
              >
                <MessageCircle size={14} /> Share on WhatsApp
              </a>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 bg-muted text-ink-mid px-3 py-2 rounded text-xs font-medium hover:bg-muted/80 transition"
              >
                <Copy size={13} /> Copy Link
              </button>
            </div>
          </div>

          {/* Sources Section */}
          {article.sources && article.sources.length > 0 && (
            <section className="mt-10 pt-6 border-t border-border bg-card p-5 rounded border">
              <div className="label-eyebrow text-primary flex items-center gap-1.5 mb-3 font-semibold">
                <LinkIcon size={12} /> Editorial Sources & Verification Notes
              </div>
              <ul className="space-y-4">
                {article.sources.map((s, i) => (
                  <li key={i} className="text-sm">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      {s.title || s.url} <ExternalLink size={12} />
                    </a>
                    {s.notes && s.notes.length > 0 && (
                      <ul className="mt-2 pl-4 list-disc text-xs text-ink-light space-y-1">
                        {s.notes.map((n, j) => {
                          const text = noteText(n);
                          const section = noteSection(n);
                          if (!text) return null;
                          return (
                            <li key={j}>
                              {section && (
                                <span className="inline-block bg-muted text-foreground text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded mr-1.5 font-mono">
                                  {section}
                                </span>
                              )}
                              {text}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Related Stories */}
          {related.length > 0 && (
            <section className="mt-14 pt-8 border-t border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-border flex-1" />
                <h2 className="font-display text-xl text-primary font-bold uppercase tracking-wider">
                  More From Amaica Media
                </h2>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link key={r.id} to={`/article/${r.id}`} className="group block">
                    <div className="aspect-[16/10] bg-muted overflow-hidden mb-2.5 rounded border border-border">
                      {r.hero_image_url ? (
                        <img src={r.hero_image_url} alt={r.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center font-display text-primary/40 text-3xl font-bold">A</div>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
                      {r.category || "News"}
                    </div>
                    <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary transition line-clamp-2 mb-1">
                      {r.headline}
                    </h3>
                    <p className="text-xs text-ink-light line-clamp-2">
                      {r.lede}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}