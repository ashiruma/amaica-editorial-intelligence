import { describe, it, expect } from "vitest";
import { decodeHtmlEntities, purgePhotoArtifactsAndCaptions, purgeSyntheticFeedAttribution } from "@/lib/editorial/htmlEntityDecoder";
import { cleanAiClichesLocally, analyzeAiContent } from "@/lib/aiContentDetector";
import { breakLongSentence, injectPunchyJournalisticSentence } from "@/lib/editorial/sentenceCadenceEngine";
import { executeHumanizer, humanizeParagraphCadence } from "@/lib/editorial/humanizerTool";

describe("Humanizer and Cadence Pipeline Integration", () => {
  it("processes copy seamlessly through entity decoding, artifact purging, and conversational cadence", () => {
    const draft = "The singer did not attend the rehearsal because she was not feeling well. Furthermore, they could not reach an agreement.";
    const result = executeHumanizer({
      text: draft,
      initiatedByEditor: true,
      editorId: "editor-conv",
      style: "conversational",
    });

    expect(result.success).toBe(true);
    expect(result.humanizedText).toContain("didn't");
    expect(result.humanizedText).toContain("wasn't");
    expect(result.humanizedText).toContain("couldn't");
  });

  it("safeguards honorific titles like Mr. Balala across photo purging and local cliché cleaning", () => {
    const text = "Mr. Balala personally addressed the circulating rumours on Tuesday, November 28, via a statement shared on his Facebook page.";
    const purged = purgePhotoArtifactsAndCaptions(text);
    expect(purged).toContain("Mr. Balala");

    const cleaned = cleanAiClichesLocally(text);
    expect(cleaned.cleaned).toContain("Balala addressed the reports directly");
  });

  it("humanizes the exact WireOps Desk screenshot draft to 0% AI with cadence engineering and artifact purging", () => {
    const corruptedHeadline = "Khalwale to shelve UPM, run for Kakamega governor on Sifuna&rsquo. S party";
    const corruptedLede = "Kakamega Senator Boni Khalwale has hinted at ditching the United Progressive Movement party to contest for the Kakamega gubernatorial seat under Nairobi Senator Edwin Sifuna's Orange Democratic Movement party following political consultations across the western region, following reports published by news.google.com earlier this week.";
    const rawBody = `Kakamega County Senator Boni Khalwale during a past event. PHOTO/@DrBKhalwale/X
Kakamega Senator Boni Khalwale has hinted at ditching the United Progressive Movement party to contest for the Kakamega gubernatorial seat under Nairobi Senator Edwin Sifuna's Orange Democratic Movement party following political consultations across the western region.

The announcement generated heated discussions among regional leaders and grassroots coordinators throughout Kakamega and Vihiga counties. Political analysts noted that shifting alliances reflect the evolving electoral calculus as candidates position themselves for competitive county executive positions.`;

    const result = executeHumanizer({
      text: rawBody,
      headline: corruptedHeadline,
      lede: corruptedLede,
      style: "natural_newsroom",
      initiatedByEditor: true,
      editorId: "editor-khalwale",
    });

    expect(result.success).toBe(true);

    // 1. HTML entities decoded cleanly
    expect(result.headline).toBe("Khalwale to shelve UPM, run for Kakamega governor on Sifuna's party");
    expect(result.headline).not.toContain("&rsquo");

    // 2. Synthetic feed attribution purged from lede
    expect(result.lede).not.toContain("news.google.com");
    expect(result.lede).not.toContain("following reports published");

    // 3. Photo caption metadata purged from body
    expect(result.humanizedText).not.toContain("PHOTO/@DrBKhalwale/X");
    expect(result.humanizedText).not.toContain("during a past event");

    // 4. Cadence & Burstiness: No non-quote sentences over 25 words
    const sentences = result.humanizedText.split(/(?<=[.!?])\s+/).filter(Boolean);
    for (const s of sentences) {
      const words = s.split(/\s+/).filter(Boolean).length;
      expect(words).toBeLessThanOrEqual(25);
    }

    // 5. Very-short punchy sentences (3-8 words) injected
    const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
    const hasShort = lengths.some((l) => l >= 3 && l <= 8);
    expect(hasShort).toBe(true);

    // 6. Average sentence length is ~14-19 words (never ~29 words)
    const avgWords = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    expect(avgWords).toBeLessThanOrEqual(20);

    // 7. Passes AI Content Forensics with 0% AI
    const audit = analyzeAiContent(result.humanizedText, result.headline, result.lede);
    expect(audit.score).toBe(0);
    expect(audit.quillBotBreakdown.aiGeneratedScore).toBe(0);
    expect(audit.quillBotBreakdown.humanWrittenScore).toBe(100);
  });
});
