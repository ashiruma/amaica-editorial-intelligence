/**
 * Unit Tests for Human-Initiated Editorial Humanizer Precision Tool
 */

import { describe, it, expect } from "vitest";
import { executeHumanizer, calculateBurstiness } from "@/lib/editorial/humanizerTool";

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
});
