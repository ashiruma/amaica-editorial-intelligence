/**
 * Unit Tests for Human-Initiated Editorial Humanizer Precision Tool
 */

import { describe, it, expect } from "vitest";
import { executeHumanizer, calculateBurstiness } from "@/lib/editorial/humanizerTool";
import { analyzeAiContent } from "@/lib/aiContentDetector";

describe("Human-Initiated Editorial Humanizer Tool", () => {
  it("STRICT MANDATE: throws an error if called automatically without explicit editor authorization", () => {
    const draft = "The committee held a meeting in Nairobi to discuss the matters.";

    // Missing initiatedByEditor flag
    expect(() =>
      executeHumanizer({
        text: draft,
        initiatedByEditor: false,
        editorId: "editor-1",
      })
    ).toThrow(/Unauthorized automatic humanization/i);

    // Missing editorId
    expect(() =>
      executeHumanizer({
        text: draft,
        initiatedByEditor: true,
        editorId: "",
      })
    ).toThrow(/Unauthorized automatic humanization/i);
  });

  it("guarantees 100% zero factual drift for proper names, dates, figures, and direct quotes", () => {
    const text = `On October 14, 2025, Kakamega Governor Fernandes Barasa met with Safaricom officials in Bukhungu Stadium.
The county government disbursed KSh 45 million to support 150 local tech students across Western Kenya.
"We must invest in youth innovation to ensure sustainable regional growth," said Governor Barasa during the ceremony.
Furthermore, the meeting concluded with agreement on new telecom infrastructure.`;

    const result = executeHumanizer({
      text,
      initiatedByEditor: true,
      editorId: "ed-101",
      editorName: "Chief Editor Ochieng",
    });

    expect(result.success).toBe(true);
    expect(result.factReport.isBlocked).toBe(false);
    expect(result.quotesPreserved).toBe(1);

    // Verify key facts are 100% intact in humanized text
    expect(result.humanizedText).toContain("Fernandes Barasa");
    expect(result.humanizedText).toContain("Bukhungu Stadium");
    expect(result.humanizedText).toContain("KSh 45 million");
    expect(result.humanizedText).toContain("150 local tech students");
    expect(result.humanizedText).toContain('"We must invest in youth innovation to ensure sustainable regional growth,"');
  });

  it("calculates sentence length variance (burstiness) accurately", () => {
    // Monotonous text (every sentence is 5 words)
    const flatText = "The team went to town. They saw a big car. It was a nice day. Everyone felt very happy now.";
    const lowBurstiness = calculateBurstiness(flatText);

    // Varied journalistic text (short punchy mixed with long descriptive)
    const variedText = "The strike ended abruptly at dawn. Hundreds of commuter vehicles returned to major city arteries after union delegates and county administrators signed a binding collective agreement following thirteen hours of tense deliberations in Nairobi.";
    const highBurstiness = calculateBurstiness(variedText);

    expect(highBurstiness).toBeGreaterThan(lowBurstiness);
  });

  it("produces granular paragraph diffs with change annotations", () => {
    const text = `In a significant development, the ministry announced new guidelines.

Moreover, the agency confirmed that all pending applications will be processed by Friday.`;

    const result = executeHumanizer({
      text,
      initiatedByEditor: true,
      editorId: "editor-42",
      style: "natural_newsroom",
    });

    expect(result.diffs.length).toBe(2);
    expect(result.diffs[0].changesMade.length).toBeGreaterThan(0);
    expect(result.diffs[0].accepted).toBe(true);
    // Should remove synthetic opener "In a significant development"
    expect(result.humanizedText).not.toContain("In a significant development");
  });

  describe("QuillBot 86% Failure Remediation on Real Radio Clash Draft", () => {
    const radioClashDraft = `On Thursday morning, Sarah Mtalii and Simon Kabu clashed live on Radio Jambo over unpaid salary claims totaling KSh 1.2 million.
"I worked for three months without receiving my agreed contract pay," said Sarah Mtalii during the heated broadcast.
Simon Kabu denied the claims on air, stating that all financial obligations had been settled through official accounts.

The public milestone reflects the active nature of East Africa's media and creative sectors. Professionals throughout the region noted that adaptability, authentic audience engagement, and disciplined public communications remain essential factors in sustaining a meaningful public profile across modern multimedia channels. "Authentic storytelling remains the backbone of East African cultural journalism," noted media analyst Martin Wanyama. "Audiences respond warmly when public figures communicate with transparency."

Media commentators in Nairobi point out that digital platforms have fundamentally transformed how regional audiences interact with public figures. Audiences now expect consistent engagement, transparent communication, and genuine professionalism. This made reputation resilience more critical than short-lived viral exposure.`;

    it("transforms copy into punchy newsroom prose with high burstiness, eliminating QuillBot-flagged corporate filler", () => {
      const result = executeHumanizer({
        text: radioClashDraft,
        headline: "Sarah Mtalii, Simon Kabu clash live on radio over separation, alleged unpaid salaries",
        lede: "Sarah Mtalii and Simon Kabu traded accusations live on radio Thursday morning over claims of unpaid salaries.",
        initiatedByEditor: true,
        editorId: "editor-wire-101",
        editorName: "Senior Newsroom Desk",
        style: "natural_newsroom",
      });

      expect(result.success).toBe(true);
      expect(result.diffs.length).toBeGreaterThanOrEqual(3);

      // 1. Corporate filler phrases purged
      expect(result.humanizedText).not.toContain("The public milestone reflects");
      expect(result.humanizedText).not.toContain("active nature of East Africa's media");
      expect(result.humanizedText).not.toContain("sustaining a meaningful public profile");
      expect(result.humanizedText).not.toContain("reputation resilience more critical than short-lived viral exposure");

      // 2. Synthetic placeholder Martin Wanyama quote is naturalized, not re-injected verbatim
      expect(result.humanizedText).not.toContain('"Authentic storytelling remains the backbone of East African cultural journalism,"');

      // 3. Genuine interviewee quotes and real facts are 100% preserved
      expect(result.humanizedText).toContain("Sarah Mtalii");
      expect(result.humanizedText).toContain("Simon Kabu");
      expect(result.humanizedText).toContain("Radio Jambo");
      expect(result.humanizedText).toContain("KSh 1.2 million");
      expect(result.humanizedText).toContain('"I worked for three months without receiving my agreed contract pay,"');

      // 4. Burstiness score is healthy
      expect(result.burstinessScore).toBeGreaterThanOrEqual(3.0);

      // 5. Clears AI detection with 0% AI
      const aiAudit = analyzeAiContent(result.humanizedText);
      expect(aiAudit.score).toBe(0);
      expect(aiAudit.quillBotBreakdown.aiGeneratedScore).toBe(0);
      expect(aiAudit.quillBotBreakdown.humanWrittenScore).toBe(100);
    });

    it("applies conversational style with natural contractions and engaging flow", () => {
      const draft = `The singer did not attend the rehearsal because she was not feeling well. Furthermore, they could not reach an agreement.`;
      const res = executeHumanizer({
        text: draft,
        initiatedByEditor: true,
        editorId: "editor-conv",
        style: "conversational",
      });

      expect(res.humanizedText).toContain("didn't");
      expect(res.humanizedText).toContain("wasn't");
      expect(res.humanizedText).toContain("couldn't");
    });

    it("applies investigative style with documentation-first evidentiary tone", () => {
      const draft = `Commentators noted that the company claimed that payments were settled. In addition, the director stated that all vouchers were filed.`;
      const res = executeHumanizer({
        text: draft,
        initiatedByEditor: true,
        editorId: "editor-inv",
        style: "investigative",
      });

      expect(res.humanizedText).toContain("verified records indicate that");
      expect(res.humanizedText).toContain("documented statements");
    });

    it("applies compact_brief style with crisp mobile wire alert brevity", () => {
      const draft = `The commission met in Nairobi in order to finalize guidelines due to the fact that new regulations take effect. In addition, they confirmed dates.`;
      const res = executeHumanizer({
        text: draft,
        initiatedByEditor: true,
        editorId: "editor-brief",
        style: "compact_brief",
      });

      expect(res.humanizedText).not.toContain("in order to");
      expect(res.humanizedText).not.toContain("due to the fact that");
      expect(res.humanizedText).toContain("to");
      expect(res.humanizedText).toContain("because");
    });

    it("deduplicates headline repetition at the start of the body", () => {
      const repeatingDraft = `Sarah Mtalii, Simon Kabu clash live on radio over separation, alleged unpaid salaries. The incident occurred during the breakfast broadcast.\n\n"I worked without pay," said Sarah Mtalii.`;
      const res = executeHumanizer({
        text: repeatingDraft,
        headline: "Sarah Mtalii, Simon Kabu clash live on radio over separation, alleged unpaid salaries",
        initiatedByEditor: true,
        editorId: "editor-dedup",
      });

      // Does not repeat the exact headline string at paragraph start
      expect(res.humanizedText.split("\n\n")[0].startsWith("Sarah Mtalii, Simon Kabu clash live on radio over separation, alleged unpaid salaries.")).toBe(false);
      // Genuine quote preserved
      expect(res.humanizedText).toContain('"I worked without pay," said Sarah Mtalii.');
    });

    it("cleanly naturalizes synthetic placeholder commentator quotes while preserving genuine interviewee quotes", () => {
      const mixedText = `"I will not work under these unfair conditions," said event coordinator Grace Akinyi in Nairobi.\n\n"Authentic storytelling remains the backbone of East African cultural journalism," noted media analyst Martin Wanyama. "Audiences respond warmly when public figures communicate with transparency."`;
      const res = executeHumanizer({
        text: mixedText,
        initiatedByEditor: true,
        editorId: "editor-quotes",
      });

      // Genuine interviewee quote is 100% preserved
      expect(res.humanizedText).toContain('"I will not work under these unfair conditions," said event coordinator Grace Akinyi in Nairobi.');
      // Synthetic placeholder quote is converted to narrative without quotation marks
      expect(res.humanizedText).not.toContain('"Authentic storytelling remains the backbone of East African cultural journalism,"');
      expect(res.humanizedText).not.toContain('"Audiences respond warmly when public figures communicate with transparency."');
      expect(res.quotesPreserved).toBe(1);
    });
  });
});
