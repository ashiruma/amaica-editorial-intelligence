/**
 * Unit Tests for Professional Editorial Paraphraser Precision Tool
 */

import { describe, it, expect } from "vitest";
import { executeParaphrase } from "@/lib/editorial/paraphraseTool";

describe("Professional Editorial Paraphraser Tool", () => {
  it("paraphrases text in journalistic mode and preserves direct quotations exactly", () => {
    const text = `At the present time, investigators are conducting an inquiry into the financial irregularities.
"We will not hesitate to prosecute any official found culpable," said EACC chairperson David Oginde.`;

    const result = executeParaphrase({
      text,
      mode: "journalistic",
    });

    expect(result.originalText).toBe(text);
    // Verifies wordy phrase 'At the present time' replaced with 'Currently' or tightened
    expect(result.paraphrasedText.toLowerCase()).toContain("currently");
    // Direct quote must remain 100% unaltered
    expect(result.paraphrasedText).toContain('"We will not hesitate to prosecute any official found culpable,"');
    expect(result.quotesPreserved).toBe(1);
  });

  it("compact mode tightens wordy prose and reduces word count", () => {
    const wordyText = "In order to provide assistance to victims, the county held a meeting due to the fact that flooding occurred.";
    const result = executeParaphrase({
      text: wordyText,
      mode: "compact",
    });

    expect(result.wordsAfter).toBeLessThan(result.wordsBefore);
    expect(result.paraphrasedText).toContain("to");
    expect(result.paraphrasedText).toContain("because");
  });

  it("injects explicit formal source attribution when requested", () => {
    const text = "A major transport cooperative has acquired twenty new buses to service the Nairobi to Kakamega highway.";

    const result = executeParaphrase({
      text,
      mode: "journalistic",
      sourceAttribution: {
        sourceName: "Daily Nation",
        isDirectStatement: false,
      },
    });

    expect(result.attributionInjected).toBe(true);
    expect(result.paraphrasedText).toContain("according to verified reporting by Daily Nation");
  });

  it("preserves proper nouns and numbers with zero drift", () => {
    const text = "Safaricom recorded KSh 34 billion in profit for the fiscal period ending December 2024.";

    const result = executeParaphrase({
      text,
      mode: "formal",
    });

    expect(result.paraphrasedText).toContain("Safaricom");
    expect(result.paraphrasedText).toContain("KSh 34 billion");
    expect(result.paraphrasedText).toContain("December 2024");
  });
});
