import { describe, it, expect } from "vitest";
import {
  analyzeArticleIntelligence,
  performEditorialRewrite,
  runEnsembleAiDetection,
  evaluateNewsroomQuality,
  verifyFactPreservation,
  extractProtectedFacts,
  restoreFact,
} from "../lib/editorial";

describe("Amaica Editorial Intelligence — Section 33 Full Workflow Verification", () => {
  const SAMPLE_JOURNALISM_TEXT = `Congolese rhumba star Fally Ipupa performed in Nairobi, Kenya, on Friday, September 6, 2026, delivering an evening of music to thousands of fans.

The concert featured a blend of rhumba and Amapiano, alongside several prominent African artists who joined him on stage for collaborative sets. Organizers confirmed that over 15,000 attendees filled the venue, paying tickets starting at Ksh 3,500.

## Background
The singer last performed in Nairobi two years ago. Fans arrived early at the venue, with security officers managing crowds along the perimeter. 

## Official Response
"I am grateful for the overwhelming reception from Nairobi fans," Fally Ipupa stated in a media briefing following the concert. "Kenya has always been a second home for Congolese rhumba, and we will return next year."

## Why it matters
The event demonstrates the growing market for regional live entertainment in East Africa. According to reports from event managers, international tour stops in Nairobi have surged by 45 percent over the past three years.`;

  describe("1. Complete Lifecycle: Create -> Analyze -> Inspect -> Humanize -> Re-analyze -> Quality -> Approve", () => {
    it("runs complete lifecycle from raw draft to verified humanized clearance", async () => {
      // Step 1: Analyze raw draft
      const analysis1 = await analyzeArticleIntelligence(
        SAMPLE_JOURNALISM_TEXT,
        "Fally Ipupa Delivers Live Performance in Nairobi"
      );
      expect(analysis1).toBeDefined();
      expect(analysis1.aiReport.calibratedScore).toBe(65);
      expect(analysis1.aiReport.confidence).toBe("high");
      expect(["low", "medium", "high"]).toContain(analysis1.aiReport.modelAgreement);

      // Step 2: Inspect flagged passages
      expect(analysis1.aiReport.sentenceDetails?.length).toBeGreaterThan(4);
      const flaggedSentences = analysis1.aiReport.sentenceDetails?.filter((s) => s.isFlagged);
      expect(flaggedSentences?.length).toBeGreaterThan(0);

      // Step 3: Check 7 quality metrics
      const quality = analysis1.newsroomScorecard.sevenScores;
      expect(quality).toBeDefined();
      expect(quality?.clarity).toBeGreaterThan(70);
      expect(quality?.readability).toBeGreaterThan(45);
      expect(quality?.structure).toBeGreaterThan(70);
      expect(quality?.grammar).toBeGreaterThan(70);
      expect(quality?.repetition).toBeGreaterThan(60);
      expect(quality?.specificity).toBeGreaterThan(60);
      expect(quality?.newsroomStyle).toBeGreaterThan(70);

      // Step 4: Headline Analyzer
      const headlineIntel = analysis1.newsroomScorecard.headlineIntelligence;
      expect(headlineIntel).toBeDefined();
      expect(headlineIntel?.alternativeHeadlines.length).toBeGreaterThanOrEqual(3);

      // Step 5: Humanize & Improve
      const humanized = performEditorialRewrite(SAMPLE_JOURNALISM_TEXT, "natural_newsroom");
      expect(humanized.rewrittenText.length).toBeGreaterThan(100);
      expect(humanized.changelog.length).toBeGreaterThan(0);

      // Step 6: Verify 100% Fact Locking
      expect(humanized.factLockReport.isBlocked).toBe(false);
      expect(humanized.factsChanged).toBe(0);
      expect(humanized.meaningChanged).toBe(0);
      expect(humanized.voicePreservationPercentage).toBeGreaterThanOrEqual(90);

      // Entities strictly preserved
      expect(humanized.rewrittenText).toContain("Fally Ipupa");
      expect(humanized.rewrittenText).toContain("Nairobi, Kenya");
      expect(humanized.rewrittenText).toContain("September 6, 2026");
      expect(humanized.rewrittenText).toContain("15,000");
      expect(humanized.rewrittenText).toContain("Ksh 3,500");
      expect(humanized.rewrittenText).toContain("45 percent");

      // Direct quote preserved
      expect(humanized.rewrittenText).toContain("I am grateful for the overwhelming reception from Nairobi fans");

      // Step 7: Re-analyze humanized output -> must score 0% AI clearance!
      const analysis2 = await analyzeArticleIntelligence(
        humanized.rewrittenText,
        headlineIntel?.alternativeHeadlines[0].headline
      );
      expect(analysis2.aiReport.calibratedScore).toBe(0);
      expect(analysis2.aiReport.classification).toBe("likely_human");
      expect(analysis2.aiReport.confidence).toBe("low");
    });
  });

  describe("2. Edge Cases & Defensive Safeguards", () => {
    it("handles completely empty content gracefully", async () => {
      const emptyAnalysis = await analyzeArticleIntelligence("");
      expect(emptyAnalysis.wordCount).toBe(0);
      expect(emptyAnalysis.aiReport.calibratedScore).toBe(0);
      expect(emptyAnalysis.aiReport.classification).toBe("insufficient_evidence");

      const emptyRewrite = performEditorialRewrite("");
      expect(emptyRewrite.rewrittenText).toBe("");
      expect(emptyRewrite.changelog.length).toBe(0);
    });

    it("handles very short content without false-positive accusations (< 50 words)", async () => {
      const shortContent = "Fally Ipupa held a press briefing in Nairobi on Friday afternoon.";
      const shortAnalysis = await analyzeArticleIntelligence(shortContent);
      expect(shortAnalysis.aiReport.classification).toBe("insufficient_evidence");
      expect(shortAnalysis.aiReport.explainabilitySummary).toMatch(/statistical significance|50 words/i);
    });

    it("handles long articles (> 500 words) without performance degradation", async () => {
      const longText = Array(4).fill(SAMPLE_JOURNALISM_TEXT).join("\n\n");
      const longAnalysis = await analyzeArticleIntelligence(longText);
      expect(longAnalysis.wordCount).toBeGreaterThan(600);
      expect(longAnalysis.aiReport.paragraphHeatmap.length).toBeGreaterThanOrEqual(4);
    });

    it("protects direct quotations from automated corruption", () => {
      const quoteText = `The minister stated: "We will not tolerate any corruption in county procurement." Furthermore, officials must act.`;
      const res = performEditorialRewrite(quoteText, "natural_newsroom");
      expect(res.rewrittenText).toContain(`"We will not tolerate any corruption in county procurement."`);
    });

    it("identifies formatting-only date differences and provides restoreFact utility", () => {
      const orig = `The conference starts on September 6, 2026.`;
      const facts = extractProtectedFacts(orig);
      const dateFact = facts.find((f) => f.type === "date");
      expect(dateFact).toBeDefined();

      const reformatted = `The conference starts on 6 September, 2026.`;
      const report = verifyFactPreservation(orig, reformatted);
      expect(report.formattingDifferences?.length).toBeGreaterThan(0);

      const restored = restoreFact(reformatted, dateFact!);
      expect(restored).toContain("September 6, 2026");
    });
  });
});
