import React from "react";
import {
  LayoutDashboard,
  FileText,
  Search,
  Wand2,
  CheckCircle2,
  Clock,
  Send,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type {
  NewsroomArticleWorkflowStatus,
  UserRole,
} from "@/types/editorialIntelligence";

export type WorkspaceSubTab =
  | "overview"
  | "content"
  | "evidence"
  | "humanize"
  | "quality"
  | "history";

interface WorkspaceSubNavProps {
  activeTab: WorkspaceSubTab;
  onSelectTab: (tab: WorkspaceSubTab) => void;
  status: NewsroomArticleWorkflowStatus;
  headline?: string;
  wordCount: number;
  readingTimeMinutes: number;
  userRole: UserRole;
  onSubmitForReview: () => void;
  onApproveArticle: () => void;
  onResetArticle: () => void;
  hasAnalyzed: boolean;
}

export function WorkspaceSubNav({
  activeTab,
  onSelectTab,
  status,
  headline,
  wordCount,
  readingTimeMinutes,
  userRole,
  onSubmitForReview,
  onApproveArticle,
  onResetArticle,
  hasAnalyzed,
}: WorkspaceSubNavProps) {
  const tabs: { id: WorkspaceSubTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: "content", label: "Content", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "evidence", label: "Evidence", icon: <Search className="w-3.5 h-3.5" /> },
    { id: "humanize", label: "Humanize", icon: <Wand2 className="w-3.5 h-3.5" /> },
    { id: "quality", label: "Quality", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: "history", label: "History", icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  const statusBadges: Record<NewsroomArticleWorkflowStatus, { label: string; bg: string; text: string; border: string }> = {
    draft: { label: "Draft", bg: "bg-muted", text: "text-ink-mid", border: "border-border" },
    analyzing: { label: "Analyzing...", bg: "bg-accent/15", text: "text-accent-foreground", border: "border-accent/40 animate-pulse font-mono" },
    needs_review: { label: "Needs Review", bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/30" },
    humanized: { label: "Humanized", bg: "bg-accent/20", text: "text-accent-foreground", border: "border-accent/50 font-bold" },
    editor_review: { label: "In Review", bg: "bg-amber-100", text: "text-amber-900", border: "border-amber-300 font-semibold" },
    approved: { label: "Approved", bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300 font-semibold" },
    published: { label: "Published", bg: "bg-primary", text: "text-primary-foreground", border: "border-primary-mid font-semibold" },
  };

  const badge = statusBadges[status] || statusBadges.draft;

  return (
    <div className="bg-card border border-border px-4 py-2.5 rounded shadow-2xs mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Article Metadata & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
            {badge.label}
          </span>
          <div className="flex items-center gap-2 truncate">
            <h2 className="text-xs font-bold text-foreground truncate font-display">
              {headline ? headline : "Untitled Article"}
            </h2>
            <span className="text-[11px] text-ink-light hidden sm:inline">•</span>
            <span className="text-[11px] text-ink-light font-mono hidden sm:inline">
              {wordCount} words
            </span>
            <span className="text-[11px] text-ink-light hidden sm:inline">•</span>
            <span className="text-[11px] text-ink-light font-mono hidden sm:inline">
              {readingTimeMinutes} min read
            </span>
          </div>
        </div>

        {/* Center: Tabs */}
        <nav aria-label="Workspace tabs" className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-card text-primary font-bold shadow-xs border border-border"
                    : "text-ink-light hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Actions based on Role & Status */}
        <div className="flex items-center gap-2">
          {userRole === "journalist" && status !== "approved" && status !== "published" && (
            <button
              onClick={onSubmitForReview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-mid text-primary-foreground text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
              title="Submit draft to the editorial desk for review"
            >
              <Send className="w-3 h-3 text-accent" />
              Submit to Desk
            </button>
          )}

          {(userRole === "editor" || userRole === "admin") && status !== "approved" && status !== "published" && (
            <button
              onClick={onApproveArticle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold rounded shadow-xs transition-colors cursor-pointer"
              title="Approve article for newsroom publishing"
            >
              <Check className="w-3.5 h-3.5" />
              Approve Article
            </button>
          )}

          {status === "approved" && (
            <span className="flex items-center gap-1 text-xs text-emerald-800 font-semibold bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Ready to Publish
            </span>
          )}

          <button
            onClick={onResetArticle}
            className="p-1.5 text-ink-light hover:text-destructive rounded hover:bg-muted transition-colors cursor-pointer"
            title="Clear and start new article"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
