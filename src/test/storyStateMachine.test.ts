import { describe, it, expect } from "vitest";
import { StoryStateMachine } from "@/lib/state/storyStateMachine";

describe("WireOps Desk: Story State Machine Engine", () => {
  it("allows legal progression through standard newsroom lifecycle", () => {
    // SIGNAL -> DEVELOPING
    expect(StoryStateMachine.canTransition("SIGNAL", "DEVELOPING")).toBe(true);
    // DEVELOPING -> VERIFIED
    expect(StoryStateMachine.canTransition("DEVELOPING", "VERIFIED")).toBe(true);
    // VERIFIED -> DRAFTING
    expect(StoryStateMachine.canTransition("VERIFIED", "DRAFTING")).toBe(true);
    // DRAFTING -> EDITORIAL_REVIEW
    expect(StoryStateMachine.canTransition("DRAFTING", "EDITORIAL_REVIEW")).toBe(true);
    // EDITORIAL_REVIEW -> APPROVED
    expect(StoryStateMachine.canTransition("EDITORIAL_REVIEW", "APPROVED")).toBe(true);
    // APPROVED -> PUBLISHED
    expect(StoryStateMachine.canTransition("APPROVED", "PUBLISHED")).toBe(true);
    // PUBLISHED -> ARCHIVED
    expect(StoryStateMachine.canTransition("PUBLISHED", "ARCHIVED")).toBe(true);
  });

  it("strictly blocks illegal state jumps that bypass editorial controls", () => {
    // Cannot jump straight from raw SIGNAL to PUBLISHED
    expect(StoryStateMachine.canTransition("SIGNAL", "PUBLISHED")).toBe(false);
    // Cannot jump straight from DRAFTING to PUBLISHED
    expect(StoryStateMachine.canTransition("DRAFTING", "PUBLISHED")).toBe(false);
    // Cannot jump from UNVERIFIED_SINGLE_SOURCE directly to APPROVED
    expect(StoryStateMachine.canTransition("UNVERIFIED_SINGLE_SOURCE", "APPROVED")).toBe(false);

    const evalResult = StoryStateMachine.evaluateTransition("SIGNAL", "PUBLISHED");
    expect(evalResult.success).toBe(false);
    expect(evalResult.allowed).toBe(false);
    expect(evalResult.errorMessage).toContain("Illegal lifecycle transition");
  });

  it("enforces the 3-Independent-Sources Rule for verification", () => {
    // 1 source: Rejected
    const res1 = StoryStateMachine.evaluateTransition("DEVELOPING", "VERIFIED", {
      independentSourceCount: 1,
    });
    expect(res1.success).toBe(false);
    expect(res1.errorMessage).toContain("Requires at least 3 independent sources");

    // 2 sources: Rejected
    const res2 = StoryStateMachine.evaluateTransition("DEVELOPING", "VERIFIED", {
      independentSourceCount: 2,
    });
    expect(res2.success).toBe(false);

    // 3 sources: Approved
    const res3 = StoryStateMachine.evaluateTransition("DEVELOPING", "VERIFIED", {
      independentSourceCount: 3,
    });
    expect(res3.success).toBe(true);
    expect(res3.toStatus).toBe("VERIFIED");
  });

  it("permits verification with fewer sources if backed by an official authority", () => {
    const res = StoryStateMachine.evaluateTransition("DEVELOPING", "VERIFIED", {
      independentSourceCount: 1,
      isOfficialAuthority: true,
    });
    expect(res.success).toBe(true);
    expect(res.toStatus).toBe("VERIFIED");
  });

  it("permits Chief Admin editorial override for verification with logged role", () => {
    const res = StoryStateMachine.evaluateTransition("DEVELOPING", "VERIFIED", {
      independentSourceCount: 1,
      userRole: "chief_admin",
    });
    expect(res.success).toBe(true);
    expect(res.toStatus).toBe("VERIFIED");
  });

  it("enforces role-based publication gates", () => {
    // Intern cannot publish approved story
    const internRes = StoryStateMachine.evaluateTransition("APPROVED", "PUBLISHED", {
      userRole: "intern",
      zeroEmojiCheckPassed: true,
    });
    expect(internRes.success).toBe(false);
    expect(internRes.errorMessage).toContain("Only Managing Editors or Chief Admins");

    // Reporter cannot publish approved story
    const reporterRes = StoryStateMachine.evaluateTransition("APPROVED", "PUBLISHED", {
      userRole: "reporter",
      zeroEmojiCheckPassed: true,
    });
    expect(reporterRes.success).toBe(false);

    // Managing Editor can publish
    const editorRes = StoryStateMachine.evaluateTransition("APPROVED", "PUBLISHED", {
      userRole: "managing_editor",
      zeroEmojiCheckPassed: true,
    });
    expect(editorRes.success).toBe(true);
  });

  it("blocks publication if the Zero-Emoji Workplace Standard check fails", () => {
    const res = StoryStateMachine.evaluateTransition("APPROVED", "PUBLISHED", {
      userRole: "managing_editor",
      zeroEmojiCheckPassed: false,
    });
    expect(res.success).toBe(false);
    expect(res.errorMessage).toContain("Zero-Emoji Workplace Standard check failed");
  });

  it("blocks approval of stories under legal hold until clearance is confirmed", () => {
    // Without clearance
    const blockedRes = StoryStateMachine.evaluateTransition("READY_FOR_LEGAL", "APPROVED", {
      hasLegalClearance: false,
    });
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.errorMessage).toContain("Legal Hold Active");

    // With clearance
    const clearRes = StoryStateMachine.evaluateTransition("READY_FOR_LEGAL", "APPROVED", {
      hasLegalClearance: true,
    });
    expect(clearRes.success).toBe(true);
  });

  it("returns next valid states accurately for any given lifecycle step", () => {
    const nextFromSignal = StoryStateMachine.getNextAllowedStates("SIGNAL");
    expect(nextFromSignal).toEqual(["DEVELOPING", "UNVERIFIED_SINGLE_SOURCE", "REJECTED"]);

    const nextFromApproved = StoryStateMachine.getNextAllowedStates("APPROVED");
    expect(nextFromApproved).toEqual(["SCHEDULED", "PUBLISHED", "EDITORIAL_REVIEW"]);
  });
});
