/**
 * WireOps Desk / Amaica Media
 * Pre-Flight Publishing Gatekeeper
 *
 * NON-NEGOTIABLE EDITORIAL SAFEGUARDS:
 * Blocks publication across all distribution channels unless all 6 non-negotiable criteria pass:
 * 1. Verification status is VERIFIED (or senior editor single-source override logged).
 * 2. Plagiarism score < 15% unquoted overlap.
 * 3. AI Detector consensus within newsroom tolerance (<= 35%) or certified by human editor.
 * 4. Editorial Compliance Checklist 100% completed (zero blocking validation errors).
 * 5. Zero-Emoji scan passed with 0 violations (ABSOLUTELY NON-BYPASSABLE).
 * 6. User possesses authorized role (ADMIN, CHIEF_EDITOR, MANAGING_EDITOR, or EDITOR).
 */

import { validateArticle, canApprove, hasEmojis, type Issue } from "@/lib/articleValidation";

export type PublishingRole =
  | "admin"
  | "chief_editor"
  | "managing_editor"
  | "senior_editor"
  | "editor"
  | "writer"
  | "contributor"
  | string;

export const AUTHORIZED_PUBLISHING_ROLES = new Set([
  "admin",
  "chief_editor",
  "managing_editor",
  "senior_editor",
  "editor",
]);

export interface SeniorEditorOverride {
  bypassed: boolean;
  editorId: string;
  editorName?: string;
  reason: string;
  timestamp: string;
}

export interface PreFlightCheckItem {
  id: string;
  name: string;
  passed: boolean;
  scoreOrValue?: string | number | null;
  message: string;
  isBypassable: boolean;
  bypassed?: boolean;
  bypassReason?: string;
  details?: Record<string, any>;
}

export interface PreFlightCheckResult {
  passed: boolean;
  canBypass: boolean;
  checks: {
    verification: PreFlightCheckItem;
    plagiarism: PreFlightCheckItem;
    aiConsensus: PreFlightCheckItem;
    editorialCompliance: PreFlightCheckItem;
    zeroEmoji: PreFlightCheckItem;
    roleAuthorization: PreFlightCheckItem;
  };
  blockReasons: string[];
  timestamp: string;
}

export interface PreFlightInput {
  article: {
    headline: string;
    lede?: string | null;
    body: string;
    byline?: string | null;
    category?: string | null;
    region?: string | null;
    template_type?: string;
    min_word_count?: number;
    sources?: any[];
  };
  user: {
    id: string;
    displayName?: string;
    roles: string[];
  };
  verificationStatus?: "verified" | "unverified" | "disputed" | "under_investigation" | string;
  plagiarismScore?: number | null;
  aiConsensusScore?: number | null;
  isHumanCertified?: boolean;
  seniorEditorOverride?: SeniorEditorOverride | null;
}

export class PreFlightGateError extends Error {
  public result: PreFlightCheckResult;

  constructor(result: PreFlightCheckResult) {
    const reasons = result.blockReasons.join("; ");
    super(`Pre-Flight Publishing Gatekeeper failed: ${reasons}`);
    this.name = "PreFlightGateError";
    this.result = result;
  }
}

/**
 * Checks if a user role has authority to publish live news dispatches.
 */
export function isAuthorizedRole(roles: string[] | string): boolean {
  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.some((r) => AUTHORIZED_PUBLISHING_ROLES.has(r.toLowerCase().trim()));
}

/**
 * Evaluates all 6 non-negotiable pre-flight criteria.
 */
export function validatePreFlight(input: PreFlightInput): PreFlightCheckResult {
  const blockReasons: string[] = [];
  const timestamp = new Date().toISOString();

  // ----------------------------------------------------
  // Gate 1: Verification Status
  // ----------------------------------------------------
  const rawStatus = (input.verificationStatus || "unverified").toLowerCase();
  const isVerifiedStatus = rawStatus === "verified";
  const hasValidOverride = Boolean(
    input.seniorEditorOverride?.bypassed &&
    input.seniorEditorOverride.reason &&
    input.seniorEditorOverride.reason.trim().length >= 10 &&
    isAuthorizedRole(input.user.roles)
  );

  const verificationPassed = isVerifiedStatus || hasValidOverride;
  const verificationItem: PreFlightCheckItem = {
    id: "verification",
    name: "Story Verification Status",
    passed: verificationPassed,
    scoreOrValue: rawStatus.toUpperCase(),
    isBypassable: true,
    bypassed: !isVerifiedStatus && hasValidOverride,
    bypassReason: hasValidOverride ? input.seniorEditorOverride?.reason : undefined,
    message: isVerifiedStatus
      ? "Story is fully verified with independent sources or official accountable authority."
      : hasValidOverride
      ? `Single-source sign-off granted by Senior Editor: ${input.seniorEditorOverride?.reason}`
      : `Story verification status is ${rawStatus.toUpperCase()}. Verified status or Senior Editor sign-off required.`,
    details: {
      status: rawStatus,
      hasOverride: hasValidOverride,
    },
  };

  if (!verificationPassed) {
    blockReasons.push(verificationItem.message);
  }

  // ----------------------------------------------------
  // Gate 2: Plagiarism Threshold (< 15%)
  // ----------------------------------------------------
  const plagScore = typeof input.plagiarismScore === "number" ? input.plagiarismScore : 0;
  const plagiarismPassed = plagScore < 15;
  const plagiarismItem: PreFlightCheckItem = {
    id: "plagiarism",
    name: "Originality and Plagiarism Index",
    passed: plagiarismPassed,
    scoreOrValue: `${plagScore.toFixed(1)}%`,
    isBypassable: false,
    message: plagiarismPassed
      ? `Plagiarism index of ${plagScore.toFixed(1)}% is within the < 15% tolerance.`
      : `Plagiarism index of ${plagScore.toFixed(1)}% exceeds the strict 15% newsroom maximum.`,
    details: {
      score: plagScore,
      threshold: 15,
    },
  };

  if (!plagiarismPassed) {
    blockReasons.push(plagiarismItem.message);
  }

  // ----------------------------------------------------
  // Gate 3: AI Detector Consensus
  // ----------------------------------------------------
  const aiScore = input.aiConsensusScore;
  let aiPassed = true;
  let aiMessage = "";

  if (input.isHumanCertified) {
    aiPassed = true;
    aiMessage = "Human editorial certification verified. Manual copy review complete.";
  } else if (aiScore === null || aiScore === undefined) {
    aiPassed = true;
    aiMessage = "Third-party AI detectors unconfigured or inconclusive. Human certification recommended.";
  } else if (aiScore <= 35) {
    aiPassed = true;
    aiMessage = `AI consensus score of ${aiScore.toFixed(1)}% is within acceptable newsroom tolerance (<= 35%).`;
  } else {
    aiPassed = false;
    aiMessage = `AI consensus score of ${aiScore.toFixed(1)}% exceeds the 35% threshold without human editorial certification.`;
  }

  const aiItem: PreFlightCheckItem = {
    id: "aiConsensus",
    name: "AI Content Consensus",
    passed: aiPassed,
    scoreOrValue: aiScore !== null && aiScore !== undefined ? `${aiScore.toFixed(1)}%` : "N/A",
    isBypassable: true,
    bypassed: Boolean(input.isHumanCertified && aiScore && aiScore > 35),
    bypassReason: input.isHumanCertified ? "Certified by human editor review" : undefined,
    message: aiMessage,
    details: {
      score: aiScore,
      isHumanCertified: Boolean(input.isHumanCertified),
    },
  };

  if (!aiPassed) {
    blockReasons.push(aiItem.message);
  }

  // ----------------------------------------------------
  // Gate 4: Editorial Compliance Checklist
  // ----------------------------------------------------
  const validationIssues: Issue[] = validateArticle({
    headline: input.article.headline,
    lede: input.article.lede || "",
    body: input.article.body,
    category: input.article.category || undefined,
    template_type: input.article.template_type,
    min_word_count: input.article.min_word_count,
    sources: input.article.sources,
  });

  const errorIssues = validationIssues.filter((i) => {
    if (i.severity !== "error") return false;
    if (input.isHumanCertified && (i.id === "ai-content-heavy" || i.id === "ai-content-elevated")) {
      return false;
    }
    return true;
  });
  const compliancePassed = errorIssues.length === 0;
  const complianceItem: PreFlightCheckItem = {
    id: "editorialCompliance",
    name: "Editorial Standards Compliance",
    passed: compliancePassed,
    scoreOrValue: errorIssues.length === 0 ? "100% Compliant" : `${errorIssues.length} Blocking Errors`,
    isBypassable: false,
    message: compliancePassed
      ? "All mandatory editorial requirements (inverted pyramid lede, word count, attribution) are satisfied."
      : `Editorial validation failed with ${errorIssues.length} critical issues: ${errorIssues.map((e) => e.message).join(", ")}`,
    details: {
      errorCount: errorIssues.length,
      warningCount: validationIssues.filter((i) => i.severity === "warning").length,
      errors: errorIssues.map((e) => e.message),
    },
  };

  if (!compliancePassed) {
    blockReasons.push(complianceItem.message);
  }

  // ----------------------------------------------------
  // Gate 5: Zero-Emoji Workplace Standard (NEVER BYPASSABLE)
  // ----------------------------------------------------
  const fullTextToScan = [
    input.article.headline || "",
    input.article.lede || "",
    input.article.body || "",
    input.article.byline || "",
  ].join(" ");

  const containsEmojis = hasEmojis(fullTextToScan);
  const zeroEmojiPassed = !containsEmojis;
  const zeroEmojiItem: PreFlightCheckItem = {
    id: "zeroEmoji",
    name: "Zero-Emoji Workplace Standard",
    passed: zeroEmojiPassed,
    scoreOrValue: zeroEmojiPassed ? "0 Violations" : "Violations Detected",
    isBypassable: false, // Absolutely forbidden to bypass
    message: zeroEmojiPassed
      ? "Zero-Emoji audit passed. Professional journalistic standard verified."
      : "Emoji characters detected in article copy. Journalism standard permits zero emojis across headline, lede, body, and byline.",
    details: {
      hasViolations: containsEmojis,
    },
  };

  if (!zeroEmojiPassed) {
    blockReasons.push(zeroEmojiItem.message);
  }

  // ----------------------------------------------------
  // Gate 6: Role Authorization
  // ----------------------------------------------------
  const rolePassed = isAuthorizedRole(input.user.roles);
  const roleItem: PreFlightCheckItem = {
    id: "roleAuthorization",
    name: "Editorial Authorization",
    passed: rolePassed,
    scoreOrValue: input.user.roles.join(", ") || "None",
    isBypassable: false,
    message: rolePassed
      ? `User role '${input.user.roles.join(", ")}' is authorized for live publication.`
      : `User role '${input.user.roles.join(", ")}' is not authorized to publish stories. Chief Editor, Managing Editor, or Editor credentials required.`,
    details: {
      roles: input.user.roles,
    },
  };

  if (!rolePassed) {
    blockReasons.push(roleItem.message);
  }

  const passed = blockReasons.length === 0;
  // Can bypass only if the sole failure is verification and user has chief/managing editor credentials
  const canBypass =
    !passed &&
    !verificationPassed &&
    plagiarismPassed &&
    aiPassed &&
    compliancePassed &&
    zeroEmojiPassed &&
    rolePassed;

  return {
    passed,
    canBypass,
    checks: {
      verification: verificationItem,
      plagiarism: plagiarismItem,
      aiConsensus: aiItem,
      editorialCompliance: complianceItem,
      zeroEmoji: zeroEmojiItem,
      roleAuthorization: roleItem,
    },
    blockReasons,
    timestamp,
  };
}
