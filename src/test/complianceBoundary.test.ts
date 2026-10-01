import { describe, it, expect } from "vitest";
import { hasEmojis, stripEmojis } from "@/lib/articleValidation";
import { executeHumanizer } from "@/lib/editorial/humanizerTool";
import { executeParaphrase } from "@/lib/editorial/paraphraseTool";
import { auditArticleHallucinations } from "@/lib/writer/hallucinationGuard";
import { MultiDetectorEngine } from "@/lib/detectors/multiDetectorEngine";
import { calculateConsensus } from "@/lib/detectors/consensusAggregator";

describe("Newsroom Compliance & Non-Negotiable Boundaries", () => {
  describe("1. Zero-Emoji Workplace Standard", () => {
    it("detects and flags all emoji unicodes accurately", () => {
      expect(hasEmojis("Breaking: Governor speaks in Kakamega")).toBe(false);
      expect(hasEmojis("Breaking: Governor speaks in Kakamega 📢")).toBe(true);
      expect(hasEmojis("Agriculture fund approved 🌾")).toBe(true);
      expect(hasEmojis("Celebrity update 🔥")).toBe(true);
      expect(hasEmojis("Court ruling delivered ⚖️")).toBe(true);
    });

    it("strips emojis completely and normalizes whitespace", () => {
      const input = "Governor Barasa 🌾 announced KSh 12 million 💰 in Kakamega 🏛️";
      const cleaned = stripEmojis(input);
      expect(hasEmojis(cleaned)).toBe(false);
      expect(cleaned).toBe("Governor Barasa announced KSh 12 million in Kakamega");
    });
  });

  describe("2. Strict Human-in-the-Loop Humanizer Mandate", () => {
    const candidateText =
      "Kakamega County Governor Fernandes Barasa on Monday announced an agricultural grant program. The initiative aims to support sugarcane farmers across the region.";

    it("throws an error if humanization is invoked automatically without explicit editor authorization", () => {
      expect(() =>
        executeHumanizer({
          text: candidateText,
          initiatedByEditor: false,
          editorId: "editor-1",
        })
      ).toThrow(/Unauthorized automatic humanization/i);
    });

    it("throws an error if editorId is missing", () => {
      expect(() =>
        executeHumanizer({
          text: candidateText,
          initiatedByEditor: true,
          editorId: "",
        })
      ).toThrow(/Unauthorized automatic humanization/i);
    });

    it("succeeds when initiated explicitly by an authenticated human editor", () => {
      const result = executeHumanizer({
        text: candidateText,
        initiatedByEditor: true,
        editorId: "editor-barasa-123",
      });

      expect(result.humanizedText).toBeTruthy();
      expect(result.factReport.isBlocked).toBe(false);
    });
  });

  describe("3. Zero Factual Drift Guarantee", () => {
    it("locks direct quotes and facts without modification during journalistic paraphrasing", () => {
      const text = `At the present time, investigators are conducting an inquiry into the financial irregularities.
"We will not hesitate to prosecute any official found culpable," said EACC chairperson David Oginde.`;

      const res = executeParaphrase({
        text,
        mode: "journalistic",
      });

      expect(res.quotesPreserved).toBe(1);
      expect(res.paraphrasedText).toContain('"We will not hesitate to prosecute any official found culpable,"');
      expect(res.paraphrasedText).toContain("David Oginde");
    });

    it("paraphrases compact text while retaining numbers and locations", () => {
      const text = "In 2024, the county government disbursed KSh 150 million to 3,200 farmers in Malava.";
      const res = executeParaphrase({
        text,
        mode: "compact",
      });

      expect(res.paraphrasedText).toContain("KSh 150 million");
      expect(res.paraphrasedText).toContain("3,200");
      expect(res.paraphrasedText).toContain("Malava");
    });
  });

  describe("4. Transparency Mandate for Third-Party Detectors", () => {
    it("returns NOT_CONFIGURED when detector API keys are absent (never fakes scores)", async () => {
      const statuses = await MultiDetectorEngine.getStatuses();
      expect(statuses.length).toBeGreaterThanOrEqual(5);

      const unconfigured = statuses.filter((s) => !s.isConfigured);
      for (const s of unconfigured) {
        expect(s.status).toBe("NOT_CONFIGURED");
      }
    });

    it("returns INCONCLUSIVE consensus when no third-party detectors are configured (never averages fake numbers)", () => {
      const mockUnconfigured = [
        {
          providerName: "winston_ai",
          status: "NOT_CONFIGURED" as const,
          aiScore: null,
          confidence: "low" as const,
          latencyMs: 0,
        },
        {
          providerName: "gptzero",
          status: "NOT_CONFIGURED" as const,
          aiScore: null,
          confidence: "low" as const,
          latencyMs: 0,
        },
      ];

      const consensus = calculateConsensus(mockUnconfigured);
      expect(consensus.consensusSignal).toBe("INCONCLUSIVE");
      expect(consensus.averageScore).toBeNull();
      expect(consensus.activeProviderCount).toBe(0);
    });
  });

  describe("5. Anti-Hallucination Thematic Guard", () => {
    it("detects thematic shift from transit / matatu fleet to unrelated music concert", () => {
      const article = {
        headline: "George Ruto Nganyas Expand Fleet Operations on Rongai Route",
        lede: "Youth entrepreneur George Ruto has expanded his custom matatu fleet operations with two high-specification nganyas entering the Nairobi transit corridor.",
        body: `Speaking on the record, route coordinators confirmed that the new custom vehicles have received full regulatory approval from the National Transport and Safety Authority.

The development underscores the economic vitality of Nairobi's matatu industry.

Meanwhile, fans eagerly look forward to his upcoming stadium concert this weekend, with tickets on sale at major ticketing outlets for the headline show and live music performance.`,
        category: "matatu_transport",
      };

      const audit = auditArticleHallucinations(article);
      expect(audit.passed).toBe(false);
      expect(audit.primaryBeat).toBe("matatu_transport");
      expect(audit.driftViolations.length).toBeGreaterThan(0);
      expect(audit.errors.some((e) => e.includes("music concert") || e.includes("Critical Hallucination"))).toBe(true);
    });

    it("passes coherent continuation of agricultural news story", () => {
      const article = {
        headline: "Kakamega County Launches Farm Subsidy Program",
        lede: "Kakamega County Governor Fernandes Barasa on Monday launched a farm input subsidy for farmers.",
        body: `Agricultural extension officers will monitor fertilizer distribution in Mumias and Shinyalu to ensure smallholder farmers benefit.
The initiative targets increased grain yields ahead of the planting season across the county.`,
        category: "agriculture",
      };

      const audit = auditArticleHallucinations(article);
      expect(audit.passed).toBe(true);
      expect(audit.driftViolations.length).toBe(0);
    });
  });
});
