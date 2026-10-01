import { describe, it, expect } from "vitest";
import {
  validatePreFlight,
  isAuthorizedRole,
  PreFlightGateError,
  type PreFlightInput,
} from "@/lib/publishing/preflightGatekeeper";

describe("Pre-Flight Publishing Gatekeeper", () => {
  const validArticle = {
    headline: "Kakamega County Unveils New Agriculture Grant Program",
    lede: "Kakamega County Governor Fernandes Barasa on Monday officially unveiled a multimillion agricultural subsidy program aimed at supporting local cane farmers.",
    body: `Kakamega County Governor Fernandes Barasa on Monday officially unveiled a multimillion agricultural subsidy program aimed at supporting local cane farmers across the county.

The initiative seeks to boost agricultural output and cushion smallholder households from rising production costs. Speaking during the launch in Kakamega town, the county chief stated that the county administration has earmarked dedicated funds to revive productivity across all sub-counties.

"We are committed to delivering sustainable economic support directly to our sugarcane growers and cooperative societies," Barasa stated during the morning briefing.

Local cooperative leaders welcomed the intervention, noting that subsidized inputs would improve yields significantly ahead of the upcoming planting season. Agricultural officers confirmed that distribution centres will open across Shinyalu, Malava, and Mumias sub-counties.

"This subsidy arrives at an important time as our farmers prepare for the primary agricultural cycle," said Western regional agricultural coordinator John Omondi.

The county government assured stakeholders that strict oversight mechanisms have been instituted to prevent supply diversions and ensure direct beneficiary reach.`,
    byline: "WireOps Desk",
    category: "Agriculture",
    region: "western_kenya",
    template_type: "standard_news",
    min_word_count: 100,
    sources: [
      { id: "s1", name: "County Press Statement", url: "https://kakamega.go.ke" },
      { id: "s2", name: "Ministry of Agriculture", url: "https://kilimo.go.ke" },
    ],
  };

  const validEditor = {
    id: "editor-123",
    displayName: "Desk Editor",
    roles: ["editor"],
  };

  it("passes when all 6 non-negotiable criteria are satisfied", () => {
    const input: PreFlightInput = {
      article: validArticle,
      user: validEditor,
      verificationStatus: "verified",
      plagiarismScore: 3.5,
      aiConsensusScore: 12.0,
      isHumanCertified: true,
    };

    const result = validatePreFlight(input);
    expect(result.passed).toBe(true);
    expect(result.blockReasons.length).toBe(0);
    expect(result.checks.verification.passed).toBe(true);
    expect(result.checks.plagiarism.passed).toBe(true);
    expect(result.checks.aiConsensus.passed).toBe(true);
    expect(result.checks.editorialCompliance.passed).toBe(true);
    expect(result.checks.zeroEmoji.passed).toBe(true);
    expect(result.checks.roleAuthorization.passed).toBe(true);
  });

  describe("Gate 1: Verification Status", () => {
    it("blocks publication if story is unverified without senior editor override", () => {
      const input: PreFlightInput = {
        article: validArticle,
        user: validEditor,
        verificationStatus: "unverified",
        plagiarismScore: 2.0,
        aiConsensusScore: 10.0,
      };

      const result = validatePreFlight(input);
      expect(result.passed).toBe(false);
      expect(result.checks.verification.passed).toBe(false);
      expect(result.canBypass).toBe(true);
      expect(result.blockReasons.some((r) => r.includes("UNVERIFIED"))).toBe(true);
    });

    it("allows senior editor single-source sign-off with valid justification", () => {
      const input: PreFlightInput = {
        article: validArticle,
        user: { id: "chief-1", displayName: "Chief Editor", roles: ["chief_editor"] },
        verificationStatus: "unverified",
        plagiarismScore: 4.0,
        aiConsensusScore: 15.0,
        seniorEditorOverride: {
          bypassed: true,
          editorId: "chief-1",
          reason: "Exclusive on-record interview verified directly with County Secretary.",
          timestamp: new Date().toISOString(),
        },
      };

      const result = validatePreFlight(input);
      expect(result.passed).toBe(true);
      expect(result.checks.verification.passed).toBe(true);
      expect(result.checks.verification.bypassed).toBe(true);
    });
  });

  describe("Gate 2: Plagiarism Threshold (< 15%)", () => {
    it("blocks publication if plagiarism score is >= 15%", () => {
      const input: PreFlightInput = {
        article: validArticle,
        user: validEditor,
        verificationStatus: "verified",
        plagiarismScore: 24.5,
        aiConsensusScore: 10.0,
      };

      const result = validatePreFlight(input);
      expect(result.passed).toBe(false);
      expect(result.checks.plagiarism.passed).toBe(false);
      expect(result.blockReasons.some((r) => r.includes("15%"))).toBe(true);
    });
  });

  describe("Gate 3: AI Detector Consensus", () => {
    it("blocks publication if AI score exceeds 35% without human certification", () => {
      const input: PreFlightInput = {
        article: validArticle,
        user: validEditor,
        verificationStatus: "verified",
        plagiarismScore: 2.0,
        aiConsensusScore: 68.0,
        isHumanCertified: false,
      };

      const result = validatePreFlight(input);
      expect(result.passed).toBe(false);
      expect(result.checks.aiConsensus.passed).toBe(false);
    });

    it("passes high AI score if explicit human editorial certification is provided", () => {
      const input: PreFlightInput = {
        article: validArticle,
        user: validEditor,
        verificationStatus: "verified",
        plagiarismScore: 2.0,
        aiConsensusScore: 68.0,
        isHumanCertified: true,
      };

      const result = validatePreFlight(input);
      expect(result.passed).toBe(true);
      expect(result.checks.aiConsensus.passed).toBe(true);
      expect(result.checks.aiConsensus.bypassed).toBe(true);
    });
  });

  describe("Gate 5: Zero-Emoji Workplace Standard", () => {
    it("strictly blocks publication if emoji is detected anywhere in copy (NEVER BYPASSABLE)", () => {
      const emojiHeadlineArticle = {
        ...validArticle,
        headline: "Kakamega County Unveils New Agriculture Grant Program 🌾",
      };

      const input: PreFlightInput = {
        article: emojiHeadlineArticle,
        user: { id: "admin-1", displayName: "Admin", roles: ["admin"] },
        verificationStatus: "verified",
        plagiarismScore: 0,
        aiConsensusScore: 0,
        seniorEditorOverride: {
          bypassed: true,
          editorId: "admin-1",
          reason: "Attempting to bypass zero-emoji standard",
          timestamp: new Date().toISOString(),
        },
      };

      const result = validatePreFlight(input);
      expect(result.passed).toBe(false);
      expect(result.checks.zeroEmoji.passed).toBe(false);
      expect(result.checks.zeroEmoji.isBypassable).toBe(false);
      expect(result.blockReasons.some((r) => r.includes("Emoji"))).toBe(true);
    });
  });

  describe("Gate 6: Role Authorization", () => {
    it("blocks publication if user is only a writer", () => {
      const input: PreFlightInput = {
        article: validArticle,
        user: { id: "writer-1", displayName: "Staff Writer", roles: ["writer"] },
        verificationStatus: "verified",
        plagiarismScore: 0,
        aiConsensusScore: 0,
      };

      const result = validatePreFlight(input);
      expect(result.passed).toBe(false);
      expect(result.checks.roleAuthorization.passed).toBe(false);
    });

    it("verifies isAuthorizedRole helper correctly recognizes editorial tiers", () => {
      expect(isAuthorizedRole(["admin"])).toBe(true);
      expect(isAuthorizedRole(["chief_editor"])).toBe(true);
      expect(isAuthorizedRole(["managing_editor"])).toBe(true);
      expect(isAuthorizedRole(["editor"])).toBe(true);
      expect(isAuthorizedRole(["writer"])).toBe(false);
      expect(isAuthorizedRole(["contributor"])).toBe(false);
    });
  });
});
