import React, { useState } from "react";
import {
  Clock,
  RotateCcw,
  CheckCircle2,
  FileText,
  User,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import type {
  NewsroomAuditLogItem,
  ArticleVersionSnapshot,
} from "@/types/editorialIntelligence";
import { toast } from "sonner";

interface AuditHistoryWorkspaceViewProps {
  auditLogs: NewsroomAuditLogItem[];
  versions: ArticleVersionSnapshot[];
  onRestoreVersion: (version: ArticleVersionSnapshot) => void;
}

export function AuditHistoryWorkspaceView({
  auditLogs,
  versions,
  onRestoreVersion,
}: AuditHistoryWorkspaceViewProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    versions.length > 0 ? versions[versions.length - 1].id : null
  );

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 6 Cols: Chronological Audit Trail */}
      <div className="lg:col-span-6 bg-card rounded border border-border shadow-card p-5 space-y-4">
        <div>
          <div className="label-eyebrow text-primary mb-0.5">Editorial Governance · Audit Log</div>
          <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Article Audit Trail
          </h2>
          <p className="text-xs text-ink-light">
            Immutable chronological record of every analysis run, humanization change, and editorial approval.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-ink-light italic">No audit history recorded yet.</p>
          ) : (
            auditLogs.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />
                  {idx < auditLogs.length - 1 && <div className="w-0.5 h-8 bg-border" />}
                </div>
                <div className="space-y-0.5 bg-muted/40 p-2.5 rounded border border-border flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground font-sans">{item.action}</span>
                    <span className="text-[10px] text-ink-light font-mono-amaica">{item.timestamp}</span>
                  </div>
                  <p className="text-ink-mid font-sans text-[11px]">{item.details}</p>
                  <div className="text-[10px] text-primary font-mono-amaica font-medium">Actor: {item.actor}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right 6 Cols: Version History & Restore */}
      <div className="lg:col-span-6 bg-card rounded border border-border shadow-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <div className="label-eyebrow text-primary mb-0.5">Editorial Revisions</div>
            <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Version Snapshots
            </h2>
            <p className="text-xs text-ink-light">
              Review prior revisions and restore when needed.
            </p>
          </div>

          {selectedVersion && (
            <button
              onClick={() => {
                onRestoreVersion(selectedVersion);
                toast.success(`Restored snapshot: ${selectedVersion.label}`);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-card border border-border hover:bg-muted text-foreground text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Restore Version
            </button>
          )}
        </div>

        {/* Version Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVersionId(v.id)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                selectedVersion?.id === v.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                  : "bg-card text-ink-mid border-border hover:bg-muted"
              }`}
            >
              {v.label} ({v.createdAt})
            </button>
          ))}
        </div>

        {/* Selected Version Preview */}
        {selectedVersion && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-ink-light font-mono-amaica">
              <span>{selectedVersion.wordCount} words</span>
              <span>Machine Score: {selectedVersion.aiScore}%</span>
              <span>Author: {selectedVersion.author}</span>
            </div>

            <div className="p-4 bg-muted/40 rounded border border-border text-xs font-sans leading-relaxed text-foreground max-h-80 overflow-y-auto whitespace-pre-wrap">
              <h3 className="font-bold font-display text-sm mb-2 text-foreground">
                {selectedVersion.headline}
              </h3>
              {selectedVersion.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
