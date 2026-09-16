import React, { useState } from "react";
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Check,
  ChevronRight,
  Filter,
  PlusCircle,
  FileText,
} from "lucide-react";
import type {
  NewsroomArticleWorkflowStatus,
  UserRole,
} from "@/types/editorialIntelligence";
import { toast } from "sonner";

export interface QueueArticle {
  id: string;
  headline: string;
  category: string;
  author: string;
  status: NewsroomArticleWorkflowStatus;
  updatedAt: string;
  wordCount: number;
  aiScore: number;
  bodyText: string;
}

interface NewsroomWorkflowViewProps {
  articles: QueueArticle[];
  onOpenArticle: (article: QueueArticle) => void;
  onApproveArticle: (id: string) => void;
  onRejectArticle: (id: string) => void;
  userRole: UserRole;
  onNewArticle: () => void;
}

export function NewsroomWorkflowView({
  articles,
  onOpenArticle,
  onApproveArticle,
  onRejectArticle,
  userRole,
  onNewArticle,
}: NewsroomWorkflowViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const approvedCount = articles.filter((a) => a.status === "approved" || a.status === "published").length;
  const reviewCount = articles.filter((a) => a.status === "editor_review" || a.status === "needs_review").length;
  const draftCount = articles.filter((a) => a.status === "draft" || a.status === "analyzing" || a.status === "humanized").length;
  const totalCount = articles.length;

  const filteredArticles = filterStatus === "all"
    ? articles
    : articles.filter((a) => a.status === filterStatus);

  const statusBadge = (st: NewsroomArticleWorkflowStatus) => {
    switch (st) {
      case "approved":
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-amaica font-bold bg-primary/10 text-primary border border-primary/20">Approved</span>;
      case "published":
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-amaica font-bold bg-primary text-primary-foreground">Published</span>;
      case "editor_review":
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-amaica font-bold bg-accent/20 text-accent-foreground border border-accent/40">In Review</span>;
      case "needs_review":
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-amaica font-bold bg-destructive/10 text-destructive border border-destructive/20">Needs Review</span>;
      case "humanized":
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-amaica font-bold bg-accent/20 text-accent-foreground border border-accent/40">Humanized</span>;
      case "analyzing":
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-amaica font-bold bg-accent/20 text-accent-foreground border border-accent/40 animate-pulse">Analyzing</span>;
      case "draft":
      default:
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono-amaica font-bold bg-muted text-ink-mid border border-border">Draft</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Newsroom Greeting & Daily Ticker */}
      <div className="bg-card rounded border border-border shadow-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="label-eyebrow text-primary mb-0.5">
            Editorial Workflow Desk
          </div>
          <h2 className="text-xl font-bold font-display text-foreground mt-0.5 uppercase">
            Active Newsroom Queue — {userRole}
          </h2>
          <p className="text-xs text-ink-light mt-1">
            Real-time newsroom queue tracking verified attributions, fact preservation, and editorial clearance.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-muted/40 px-4 py-2.5 rounded border border-border text-center">
            <span className="text-xl font-bold text-primary font-mono-amaica">{totalCount}</span>
            <span className="text-[10px] text-ink-light block uppercase font-mono-amaica">Articles Today</span>
          </div>
          <div className="bg-muted/40 px-3.5 py-2 rounded border border-border text-center">
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono-amaica">{approvedCount}</span>
            <span className="text-[10px] text-ink-light block font-mono-amaica">Approved</span>
          </div>
          <div className="bg-muted/40 px-3.5 py-2 rounded border border-border text-center">
            <span className="text-base font-bold text-accent-foreground font-mono-amaica">{reviewCount}</span>
            <span className="text-[10px] text-ink-light block font-mono-amaica">Review</span>
          </div>
          <div className="bg-muted/40 px-3.5 py-2 rounded border border-border text-center">
            <span className="text-base font-bold text-ink-mid font-mono-amaica">{draftCount}</span>
            <span className="text-[10px] text-ink-light block font-mono-amaica">Draft</span>
          </div>
        </div>
      </div>

      {/* 2. Needs Attention Queue Table */}
      <div className="bg-card rounded border border-border shadow-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase font-mono-amaica tracking-wider">
              Needs Attention
            </h2>
            <p className="text-xs text-ink-light">
              Articles awaiting analysis, humanization review, or editorial approval.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 text-xs bg-muted/60 p-1 rounded border border-border">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-2.5 py-1 rounded-sm text-xs font-medium cursor-pointer ${filterStatus === "all" ? "bg-card shadow-xs font-semibold text-primary border border-border" : "text-ink-light hover:text-foreground"}`}
              >
                All ({articles.length})
              </button>
              <button
                onClick={() => setFilterStatus("editor_review")}
                className={`px-2.5 py-1 rounded-sm text-xs font-medium cursor-pointer ${filterStatus === "editor_review" ? "bg-card shadow-xs font-semibold text-primary border border-border" : "text-ink-light hover:text-foreground"}`}
              >
                Review ({articles.filter((a) => a.status === "editor_review").length})
              </button>
              <button
                onClick={() => setFilterStatus("draft")}
                className={`px-2.5 py-1 rounded-sm text-xs font-medium cursor-pointer ${filterStatus === "draft" ? "bg-card shadow-xs font-semibold text-primary border border-border" : "text-ink-light hover:text-foreground"}`}
              >
                Drafts ({articles.filter((a) => a.status === "draft").length})
              </button>
            </div>

            <button
              onClick={onNewArticle}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-mid text-primary-foreground text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-accent" />
              New Article
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-ink-light font-mono-amaica uppercase text-[10px]">
                <th className="py-2.5 px-3 font-semibold">Article</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">AI Signal</th>
                <th className="py-2.5 px-3 font-semibold">Last Updated</th>
                <th className="py-2.5 px-3 font-semibold">Assigned To</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-light italic">
                    No articles found in this queue state.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                        {art.headline}
                      </div>
                      <div className="text-[10px] text-ink-light flex items-center gap-2 mt-0.5">
                        <span className="font-mono-amaica">{art.category}</span>
                        <span>•</span>
                        <span className="font-mono-amaica">{art.wordCount} words</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">{statusBadge(art.status)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono-amaica font-bold text-xs ${
                          art.aiScore >= 45
                            ? "text-destructive"
                            : art.aiScore >= 20
                            ? "text-accent-foreground"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {art.aiScore}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-amaica text-ink-light text-[11px]">
                      {art.updatedAt}
                    </td>
                    <td className="py-3 px-3 text-ink-mid">
                      {art.author}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenArticle(art)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-primary hover:bg-primary-mid text-primary-foreground rounded shadow-xs transition-colors cursor-pointer"
                        >
                          Open in Studio
                        </button>
                        {art.status !== "approved" && (
                          <button
                            onClick={() => onApproveArticle(art.id)}
                            className="p-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                            title="Approve Article"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
