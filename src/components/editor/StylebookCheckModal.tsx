/**
 * WireOps Desk / Amaica Media
 * Kenyan Stylebook Check Modal
 *
 * Displays findings from the Kenyan English Editorial Stylebook Engine,
 * categorized into Spelling, Governance/Institutions, Currency, and AI Clichés.
 * Zero-Emoji Workplace Standard strictly enforced.
 */

import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Sparkles,
  Sliders,
  DollarSign,
  Building2,
  Type,
} from "lucide-react";
import {
  auditKenyanStylebook,
  applyStylebookCorrections,
  type StylebookAuditResult,
  type StylebookIssue,
} from "@/lib/editorial/kenyanStylebookEngine";
import { toast } from "sonner";

interface StylebookCheckModalProps {
  text: string;
  onApplyCorrectedText: (corrected: string) => void;
  onClose: () => void;
}

export function StylebookCheckModal({
  text,
  onApplyCorrectedText,
  onClose,
}: StylebookCheckModalProps) {
  const [auditResult, setAuditResult] = useState<StylebookAuditResult>(() =>
    auditKenyanStylebook(text)
  );
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentText, setCurrentText] = useState(text);

  const filteredIssues =
    activeCategory === "all"
      ? auditResult.issues
      : auditResult.issues.filter((i) => i.category === activeCategory);

  const handleApplySingle = (issue: StylebookIssue) => {
    const { correctedText } = applyStylebookCorrections(currentText, [issue.id]);
    setCurrentText(correctedText);
    const newAudit = auditKenyanStylebook(correctedText);
    setAuditResult(newAudit);
    toast.success(`Applied stylebook correction for '${issue.matchedText}'.`);
  };

  const handleApplyAll = () => {
    const { correctedText, appliedCount } = applyStylebookCorrections(currentText);
    setCurrentText(correctedText);
    const newAudit = auditKenyanStylebook(correctedText);
    setAuditResult(newAudit);
    toast.success(`Applied ${appliedCount} Kenyan stylebook corrections.`);
  };

  const handleSaveAndClose = () => {
    onApplyCorrectedText(currentText);
    toast.success("Updated editor copy with Kenyan stylebook revisions.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Kenyan English Editorial Stylebook
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Commonwealth orthography, 2010 Constitution institutional titles & local currency
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score & Summary Banner */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                auditResult.score >= 80
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : auditResult.score >= 60
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-rose-500 bg-rose-50 text-rose-700"
              }`}
            >
              {auditResult.score}%
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">
                {auditResult.passed
                  ? "100% Kenyan Stylebook Compliant"
                  : `${auditResult.totalIssues} Stylebook ${auditResult.totalIssues === 1 ? "Notice" : "Notices"} Found`}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Spelling: {auditResult.categoryBreakdown.spelling} | Governance:{" "}
                {auditResult.categoryBreakdown.institutional} | Currency:{" "}
                {auditResult.categoryBreakdown.currency} | Clichés:{" "}
                {auditResult.categoryBreakdown.cliche}
              </div>
            </div>
          </div>

          {auditResult.issues.length > 0 && (
            <button
              type="button"
              onClick={handleApplyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply All Corrections</span>
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/10 text-xs">
          {[
            { id: "all", label: "All Notices", count: auditResult.totalIssues },
            { id: "spelling", label: "Spelling", count: auditResult.categoryBreakdown.spelling },
            { id: "institutional", label: "Governance Titles", count: auditResult.categoryBreakdown.institutional },
            { id: "currency", label: "Currency", count: auditResult.categoryBreakdown.currency },
            { id: "cliche", label: "AI Clichés", count: auditResult.categoryBreakdown.cliche },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveCategory(t.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeCategory === t.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
              <p className="text-xs font-medium">No stylebook issues found in this category.</p>
              <p className="text-[11px]">The copy strictly observes standard Kenyan editorial rules.</p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-3 rounded border border-border bg-card text-xs flex items-start justify-between gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{issue.ruleTitle}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-medium text-muted-foreground uppercase tracking-wider">
                      {issue.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {issue.explanation}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="line-through text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      {issue.matchedText}
                    </span>
                    <span className="text-muted-foreground">{"->"}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {issue.preferredReplacement}
                    </span>
                  </div>
                </div>

                {!issue.preferredReplacement.startsWith("[") && (
                  <button
                    type="button"
                    onClick={() => handleApplySingle(issue)}
                    className="flex-shrink-0 px-2.5 py-1 bg-muted hover:bg-primary hover:text-primary-foreground border border-border text-[11px] font-semibold rounded transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-border bg-muted/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-border text-xs rounded hover:bg-muted font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 transition-colors shadow-sm"
          >
            Save Revisions to Article
          </button>
        </div>
      </div>
    </div>
  );
}
