import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LogOut, User as UserIcon, Menu, X as CloseIcon } from "lucide-react";
import { DiscoveryRunNotifier } from "@/components/DiscoveryRunNotifier";

export function Masthead({ variant = "newsroom" }: { variant?: "newsroom" | "public" }) {
  const { user, signOut, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:font-bold focus:shadow-lg focus:rounded focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      <DiscoveryRunNotifier />
      <header className="bg-primary text-primary-foreground border-b-[3px] border-accent sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-primary-foreground/80 hover:text-primary-foreground p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
            >
              {mobileOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="font-display text-xl font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
              Amaica <span className="text-accent">ENTERTAINMENT</span>
            </Link>
          </div>

          {variant === "newsroom" ? (
            <nav aria-label="Newsroom navigation" className="hidden md:flex items-center gap-6 text-[13px]">
              <NavLink to="/newsroom" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Discover</NavLink>
              <NavLink to="/newsroom/drafts" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Drafts</NavLink>
              <NavLink to="/newsroom/published" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Published</NavLink>
              <NavLink to="/newsroom/legends" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Legends</NavLink>
              <NavLink to="/newsroom/ai-detector" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>AI Intelligence</NavLink>
              <NavLink to="/newsroom/editorial-policy" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Editorial Policy</NavLink>
              <NavLink to="/newsroom/style-guide" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Style guide</NavLink>
              {isEditor && (
                <NavLink to="/newsroom/health" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Health</NavLink>
              )}
              {isEditor && (
                <NavLink to="/newsroom/discovery" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Discovery</NavLink>
              )}
              {isAdmin && (
                <NavLink to="/newsroom/admin" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Admin</NavLink>
              )}
              <NavLink to="/" className="text-primary-foreground/80 hover:text-primary-foreground">View site →</NavLink>
            </nav>
          ) : (
            <nav aria-label="Main category navigation" className="hidden md:flex items-center gap-6 text-[13px]">
              <NavLink end to="/" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Latest</NavLink>
              <NavLink to="/category/gossip" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Gossip</NavLink>
              <NavLink to="/category/music" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Music</NavLink>
              <NavLink to="/category/events" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Events</NavLink>
              <NavLink to="/category/film" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Film & TV</NavLink>
              <NavLink to="/category/celebrity" className={({ isActive }) => isActive ? "text-accent font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"}>Celebrity</NavLink>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {variant === "public" && (
                  <button onClick={() => navigate("/newsroom")} className="text-[12px] bg-accent text-accent-foreground font-semibold px-2.5 py-1 rounded hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent">Newsroom</button>
                )}
                <button onClick={async () => { await signOut(); navigate("/"); }} className="text-primary-foreground/70 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded p-1" aria-label="Sign out">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link to="/newsroom/auth" className="flex items-center gap-1.5 text-[12px] text-primary-foreground/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded font-medium">
                <UserIcon size={14} /> Newsroom Access
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <nav id="mobile-nav-drawer" aria-label="Mobile navigation" className="md:hidden bg-primary-mid border-t border-primary-foreground/15 px-4 py-3 animate-in slide-in-from-top-2 duration-200">
            {variant === "newsroom" ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <NavLink onClick={() => setMobileOpen(false)} to="/newsroom" className="py-1.5 text-primary-foreground/90 hover:text-accent">Discover</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/newsroom/drafts" className="py-1.5 text-primary-foreground/90 hover:text-accent">Drafts</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/newsroom/published" className="py-1.5 text-primary-foreground/90 hover:text-accent">Published</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/newsroom/legends" className="py-1.5 text-primary-foreground/90 hover:text-accent">Legends</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/newsroom/ai-detector" className="py-1.5 text-accent font-semibold">AI Intelligence</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/newsroom/editorial-policy" className="py-1.5 text-primary-foreground/90 hover:text-accent font-medium">Editorial Policy</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/newsroom/style-guide" className="py-1.5 text-primary-foreground/90 hover:text-accent">Style Guide</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/" className="py-1.5 text-accent font-medium">View Live Site →</NavLink>
              </div>
            ) : (
              <div className="flex flex-col gap-2 text-sm">
                <NavLink onClick={() => setMobileOpen(false)} end to="/" className="py-1 text-primary-foreground/90 hover:text-accent">Latest Stories</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/category/gossip" className="py-1 text-primary-foreground/90 hover:text-accent">Gossip & Rumours</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/category/music" className="py-1 text-primary-foreground/90 hover:text-accent">Music & Benga</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/category/events" className="py-1 text-primary-foreground/90 hover:text-accent">Concerts & Events</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/category/film" className="py-1 text-primary-foreground/90 hover:text-accent">Film & TV</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/category/celebrity" className="py-1 text-primary-foreground/90 hover:text-accent">Celebrity & Culture</NavLink>
                <NavLink onClick={() => setMobileOpen(false)} to="/newsroom" className="py-1 text-accent font-semibold pt-2 border-t border-primary-foreground/15">Open Newsroom Desk</NavLink>
              </div>
            )}
          </nav>
        )}
      </header>

      <div className="bg-destructive overflow-hidden h-[30px] flex items-center relative" aria-hidden="true">
        <div className="relative z-20 bg-foreground text-background text-[10px] font-medium tracking-[0.12em] uppercase px-3.5 h-full flex items-center flex-shrink-0 shadow-sm">
          {variant === "newsroom" ? "Newsroom" : "Live"}
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="flex animate-ticker whitespace-nowrap">
            {[0, 1].map((i) => (
              <span key={i} className="text-destructive-foreground text-[12px] px-8 tracking-wide">
                Western Kenya Entertainment &bull; Music &bull; Film &bull; Events &bull; Culture &nbsp;&nbsp;&bull;&nbsp;&nbsp; Lead with the fact. Attribute everything. One idea per sentence. &nbsp;&nbsp;&bull;&nbsp;&nbsp; Amaica Media — Newsroom of Western Kenya &nbsp;&nbsp;&bull;&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}