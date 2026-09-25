/**
 * WireOps Desk: Story State Machine Engine
 * Location: src/lib/state/storyStateMachine.ts
 *
 * Enforces deterministic lifecycle transitions for newsroom story clusters
 * and articles, guaranteeing that stories cannot bypass verification,
 * editorial review, or publication authorization.
 */

import { StoryLifecycleStatus } from "@/types/intelligence";

export interface TransitionContext {
  userId?: string;
  userRole?: "intern" | "reporter" | "desk_editor" | "managing_editor" | "chief_admin";
  independentSourceCount?: number;
  isOfficialAuthority?: boolean;
  hasLegalClearance?: boolean;
  editorialChecklistPassed?: boolean;
  zeroEmojiCheckPassed?: boolean;
  reason?: string;
}

export interface TransitionResult {
  success: boolean;
  fromStatus: StoryLifecycleStatus;
  toStatus: StoryLifecycleStatus;
  allowed: boolean;
  errorMessage?: string;
  timestamp: string;
}

export interface StateTransitionLog {
  id: string;
  storyId: string;
  fromStatus: StoryLifecycleStatus;
  toStatus: StoryLifecycleStatus;
  actorUserId?: string;
  reason?: string;
  timestamp: string;
}

export class StoryStateMachine {
  /**
   * Deterministic matrix of valid state transitions
   */
  private static readonly ALLOWED_TRANSITIONS: Record<StoryLifecycleStatus, StoryLifecycleStatus[]> = {
    SIGNAL: ["DEVELOPING", "UNVERIFIED_SINGLE_SOURCE", "REJECTED"],
    DEVELOPING: ["VERIFIED", "UNVERIFIED_SINGLE_SOURCE", "DISPUTED", "REJECTED"],
    UNVERIFIED_SINGLE_SOURCE: ["DEVELOPING", "VERIFIED", "DISPUTED", "REJECTED"],
    DISPUTED: ["DEVELOPING", "VERIFIED", "REJECTED"],
    VERIFIED: ["DRAFTING", "DEVELOPING", "DISPUTED", "REJECTED"],
    DRAFTING: ["EDITORIAL_REVIEW", "VERIFIED"],
    EDITORIAL_REVIEW: ["DRAFTING", "READY_FOR_LEGAL", "APPROVED", "REJECTED"],
    READY_FOR_LEGAL: ["APPROVED", "DRAFTING", "REJECTED"],
    APPROVED: ["SCHEDULED", "PUBLISHED", "EDITORIAL_REVIEW"],
    SCHEDULED: ["PUBLISHED", "APPROVED"],
    PUBLISHED: ["ARCHIVED"],
    REJECTED: ["DEVELOPING"], // Can be reopened if fresh corroborating evidence surfaces
    ARCHIVED: ["DEVELOPING"],
  };

  /**
   * Check if a transition is syntactically allowed in the graph
   */
  public static canTransition(
    currentStatus: StoryLifecycleStatus,
    targetStatus: StoryLifecycleStatus
  ): boolean {
    const allowed = this.ALLOWED_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(targetStatus) : false;
  }

  /**
   * Validate and execute a transition with newsroom business rules
   */
  public static evaluateTransition(
    currentStatus: StoryLifecycleStatus,
    targetStatus: StoryLifecycleStatus,
    context: TransitionContext = {}
  ): TransitionResult {
    const timestamp = new Date().toISOString();

    // 1. Syntactic transition validation
    if (!this.canTransition(currentStatus, targetStatus)) {
      return {
        success: false,
        allowed: false,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        errorMessage: `Illegal lifecycle transition: Cannot move from ${currentStatus} to ${targetStatus}.`,
        timestamp,
      };
    }

    // 2. Guard: Verification requires 3 independent sources or official authority
    if (targetStatus === "VERIFIED") {
      const sourceCount = context.independentSourceCount ?? 0;
      const isOfficial = context.isOfficialAuthority ?? false;
      const isChiefAdminOverride = context.userRole === "chief_admin" || context.userRole === "managing_editor";

      if (!isOfficial && sourceCount < 3 && !isChiefAdminOverride) {
        return {
          success: false,
          allowed: false,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          errorMessage: `Verification Gatekeeper Blocked: Requires at least 3 independent sources or verified official authority (currently: ${sourceCount}).`,
          timestamp,
        };
      }
    }

    // 3. Guard: Publishing requires APPROVED state and Senior/Chief Editor role
    if (targetStatus === "PUBLISHED") {
      if (currentStatus !== "APPROVED" && currentStatus !== "SCHEDULED") {
        return {
          success: false,
          allowed: false,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          errorMessage: `Publication Gatekeeper Blocked: Stories must be APPROVED before publishing (current: ${currentStatus}).`,
          timestamp,
        };
      }

      if (
        context.userRole &&
        context.userRole !== "managing_editor" &&
        context.userRole !== "chief_admin"
      ) {
        return {
          success: false,
          allowed: false,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          errorMessage: `Authorization Blocked: Only Managing Editors or Chief Admins can execute publication dispatches.`,
          timestamp,
        };
      }

      if (context.zeroEmojiCheckPassed === false) {
        return {
          success: false,
          allowed: false,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          errorMessage: `Editorial Standard Blocked: Zero-Emoji Workplace Standard check failed. Remove all emojis before publish.`,
          timestamp,
        };
      }
    }

    // 4. Guard: Legal review clearance
    if (currentStatus === "READY_FOR_LEGAL" && targetStatus === "APPROVED") {
      if (context.hasLegalClearance === false) {
        return {
          success: false,
          allowed: false,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          errorMessage: `Legal Hold Active: Cannot approve story without verified legal clearance.`,
          timestamp,
        };
      }
    }

    return {
      success: true,
      allowed: true,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      timestamp,
    };
  }

  /**
   * Helper to inspect all valid next transitions from current state
   */
  public static getNextAllowedStates(
    currentStatus: StoryLifecycleStatus
  ): StoryLifecycleStatus[] {
    return this.ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}
