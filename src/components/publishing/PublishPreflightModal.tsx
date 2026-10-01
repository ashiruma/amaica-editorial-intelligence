/**
 * WireOps Desk / Amaica Media
 * Pre-Flight Publishing Modal & Authorization Cockpit
 *
 * Operational Standard: Zero-Emoji Workplace Standard
 * Visualizes the 6 non-negotiable publication criteria:
 * 1. Story Verification
 * 2. Plagiarism Index (< 15%)
 * 3. AI Detector Consensus
 * 4. Editorial Compliance Checklist
 * 5. Zero-Emoji Workplace Standard
 * 6. Editorial Authorization
 */

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Send,
  Globe,
  Radio,
  FileCheck,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  validatePreFlight,
  type PreFlightCheckResult,
  type SeniorEditorOverride,
} from "@/lib/publishing/preflightGatekeeper";
import {
  PublisherService,
  type DistributionChannel,
  type PublishArticleResponse,
} from "@/lib/publishing/publisherService";
import { toast } from "sonner";

export interface PublishPreflightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: {
    id: string;
    headline: string;
    lede?: string | null;
    body: string;
    byline?: string | null;
    category?: string | null;
    region?: string | null;
    hero_image_url?: string | null;
    template_type?: string;
    tags?: string[];
  };
  currentUser: {
    id: string;
    displayName?: string;
    roles: string[];
  };
  verificationStatus?: string;
  plagiarismScore?: number | null;
  aiConsensusScore?: number | null;
  isHumanCertified?: boolean;
  onPublishSuccess?: (response: PublishArticleResponse) => void;
}

export const PublishPreflightModal: React.FC<PublishPreflightModalProps> = ({
  open,
  onOpenChange,
  article,
  currentUser,
  verificationStatus = "unverified",
  plagiarismScore = 0,
  aiConsensusScore = null,
  isHumanCertified = false,
  onPublishSuccess,
}) => {
  const [channel, setChannel] = useState<DistributionChannel>("wordpress");
  const [publishing, setPublishing] = useState(false);
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [lastResponse, setLastResponse] = useState<PublishArticleResponse | null>(null);

  // Compute senior editor override if populated
  const seniorEditorOverride: SeniorEditorOverride | null = useMemo(() => {
    if (!showOverrideInput || overrideReason.trim().length < 10) return null;
    return {
      bypassed: true,
      editorId: currentUser.id,
      editorName: currentUser.displayName || "Desk Editor",
      reason: overrideReason.trim(),
      timestamp: new Date().toISOString(),
    };
  }, [showOverrideInput, overrideReason, currentUser]);

  // Compute live preflight status
  const preflight: PreFlightCheckResult = useMemo(() => {
    return validatePreFlight({
      article,
      user: currentUser,
      verificationStatus,
      plagiarismScore,
      aiConsensusScore,
      isHumanCertified,
      seniorEditorOverride,
    });
  }, [
    article,
    currentUser,
    verificationStatus,
    plagiarismScore,
    aiConsensusScore,
    isHumanCertified,
    seniorEditorOverride,
  ]);

  const handlePublish = async () => {
    if (!preflight.passed) {
      toast.error("All pre-flight checks must pass before publishing.");
      return;
    }

    setPublishing(true);
    try {
      const response = await PublisherService.publish({
        article,
        channel,
        user: currentUser,
        verificationStatus,
        plagiarismScore,
        aiConsensusScore,
        isHumanCertified,
        seniorEditorOverride,
      });

      setLastResponse(response);
      toast.success(`Published dispatch successfully via ${channel.toUpperCase()}`);
      if (onPublishSuccess) {
        onPublishSuccess(response);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish dispatch");
    } finally {
      setPublishing(false);
    }
  };

  const checkEntries = [
    { key: "zeroEmoji", item: preflight.checks.zeroEmoji },
    { key: "verification", item: preflight.checks.verification },
    { key: "editorialCompliance", item: preflight.checks.editorialCompliance },
    { key: "plagiarism", item: preflight.checks.plagiarism },
    { key: "aiConsensus", item: preflight.checks.aiConsensus },
    { key: "roleAuthorization", item: preflight.checks.roleAuthorization },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
              Phase 10 Distribution Gate
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Zero-Emoji Standard Verified
            </span>
          </div>
          <DialogTitle className="text-xl font-display flex items-center justify-between">
            <span>Pre-Flight Publishing Gatekeeper</span>
            <span
              className={`text-xs px-2.5 py-1 rounded font-mono font-medium flex items-center gap-1 ${
                preflight.passed
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              }`}
            >
              {preflight.passed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  CLEARED FOR PUBLICATION
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  {preflight.blockReasons.length} BLOCKING ISSUES
                </>
              )}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Non-negotiable verification gates protect editorial integrity before multi-channel syndication.
          </DialogDescription>
        </DialogHeader>

        {/* 6 Gates Checklist */}
        <div className="space-y-2.5 my-3">
          {checkEntries.map(({ key, item }) => (
            <div
              key={key}
              className={`p-3 rounded border text-xs transition-all ${
                item.passed
                  ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                  : "border-rose-500/40 bg-rose-500/5 text-foreground"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.scoreOrValue && (
                        <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                          {item.scoreOrValue}
                        </span>
                      )}
                      {item.bypassed && (
                        <span className="text-[10px] text-amber-500 font-mono font-semibold">
                          (Senior Editor Sign-Off)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Senior Editor Override Option for Unverified Stories */}
        {!preflight.checks.verification.passed && preflight.canBypass && (
          <div className="p-3 rounded border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Senior Editor Single-Source Override
              </span>
              <button
                type="button"
                onClick={() => setShowOverrideInput(!showOverrideInput)}
                className="text-xs text-amber-400 hover:underline font-mono"
              >
                {showOverrideInput ? "Cancel Override" : "Request Sign-Off"}
              </button>
            </div>
            {showOverrideInput && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  By providing single-source sign-off, you take editorial responsibility for this dispatch.
                  Your identity and explanation will be recorded in the tamper-evident cryptographic audit log.
                </p>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State journalistic justification (minimum 10 characters)..."
                  className="w-full text-xs p-2 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={2}
                />
              </div>
            )}
          </div>
        )}

        {/* Channel Selection */}
        <div className="border-t border-border pt-4 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Distribution Channel
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["wordpress", "WordPress REST"],
                ["ghost", "Ghost CMS"],
                ["webhook", "Syndicate Webhook"],
                ["internal", "WireOps Desk Live"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setChannel(val)}
                className={`text-xs p-2.5 rounded border text-left flex flex-col justify-between transition-all ${
                  channel === val
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-[10px] uppercase font-mono opacity-80">{val}</span>
                <span className="mt-1 font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cryptographic Audit Trail Confirmation (if already published) */}
        {lastResponse && (
          <div className="p-3 rounded border border-emerald-500/40 bg-emerald-500/10 text-xs space-y-1">
            <div className="font-semibold text-emerald-500 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Published and Logged to Audit Trail
            </div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">
              Audit ID: {lastResponse.auditRecord.auditId}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">
              Content SHA-256: {lastResponse.auditRecord.articleContentHash}
            </div>
            {lastResponse.postUrl && (
              <div className="pt-1">
                <a
                  href={lastResponse.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline flex items-center gap-1 font-medium"
                >
                  View Live Dispatch <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs px-4 py-2 rounded border border-border bg-muted text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!preflight.passed || publishing}
            onClick={handlePublish}
            className={`text-xs px-5 py-2 rounded font-semibold flex items-center gap-2 transition-all ${
              preflight.passed && !publishing
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            {publishing ? (
              <>Publishing Dispatch...</>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Authorize & Publish Dispatch
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
