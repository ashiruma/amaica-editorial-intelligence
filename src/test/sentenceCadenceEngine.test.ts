/**
 * Unit Tests for Sentence Length and Burstiness Engineering Engine
 * WireOps Desk / Amaica Media
 */

import { describe, it, expect } from "vitest";
import {
  breakLongSentence,
  polishParagraphSentenceCadence,
  engineerTextBurstiness,
  splitIntoSentences,
  countSentenceWords,
  PUNCHY_JOURNALISTIC_SENTENCES,
  MAX_SENTENCE_WORDS,
} from "@/lib/editorial/sentenceCadenceEngine";

describe("Sentence Length and Burstiness Engineering", () => {
  it("breaks the 37-word Khalwale/Sifuna sentence into punchy sub-25-word sentences", () => {
    const longSentence = "Kakamega Senator Boni Khalwale has hinted at ditching the United Progressive Movement party to contest for the Kakamega gubernatorial seat under Nairobi Senator Edwin Sifuna's Orange Democratic Movement party following political consultations across the western region.";

    const broken = breakLongSentence(longSentence, MAX_SENTENCE_WORDS);

    // Must be split into at least 2 or 3 sentences
    expect(broken.length).toBeGreaterThanOrEqual(2);

    // Every non-quote sentence must respect the 25-word hard cap
    for (const s of broken) {
      const words = s.split(/\s+/).filter(Boolean).length;
      expect(words).toBeLessThanOrEqual(MAX_SENTENCE_WORDS);
    }

    // Must preserve all key entities
    const combined = broken.join(" ");
    expect(combined).toContain("Boni Khalwale");
    expect(combined).toContain("United Progressive Movement");
    expect(combined).toContain("Edwin Sifuna");
    expect(combined).toContain("Kakamega gubernatorial seat");
  });

  it("strictly enforces 25-word hard cap across multiple compound structures", () => {
    const compound = "The county executive committee met in Kakamega to review municipal revenues, while regional health delegates inspected the ongoing construction of the teaching referral hospital, and labor unions demanded immediate negotiations regarding overdue overtime allowances.";

    const broken = breakLongSentence(compound, MAX_SENTENCE_WORDS);
    expect(broken.length).toBeGreaterThanOrEqual(3);

    for (const s of broken) {
      const words = s.split(/\s+/).filter(Boolean).length;
      expect(words).toBeLessThanOrEqual(MAX_SENTENCE_WORDS);
    }
  });

  it("never breaks protected direct quotes even if long", () => {
    const quote = `"We have conducted extensive ground consultations with elders, youth groups, and party delegates across Western Kenya and we are confident of victory," said Governor Barasa.`;
    const result = breakLongSentence(quote, MAX_SENTENCE_WORDS);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(quote);
  });

  it("injects punchy 3-8 word journalistic sentences into paragraphs that lack short statements", () => {
    const uniformPara = "Regional coordinators gathered at Golf Hotel in Kakamega to finalize the campaign itinerary for the upcoming by-election. County delegates confirmed that all logistics and security arrangements have been verified with administrative authorities.";

    const result = polishParagraphSentenceCadence(uniformPara, 0, MAX_SENTENCE_WORDS);

    // Must contain a punchy sentence of 3-8 words
    const sentenceLengths = result.sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
    const hasShort = sentenceLengths.some((l) => l >= 3 && l <= 8);
    expect(hasShort).toBe(true);

    // Burstiness std-dev must be healthy
    expect(result.stdDev).toBeGreaterThanOrEqual(4.0);

    // Average sentence length must be in ~14-19 words range
    expect(result.avgWords).toBeLessThanOrEqual(20);
  });

  it("engineers entire article text into target average of 14-19 words and high burstiness", () => {
    const article = `Kakamega Senator Boni Khalwale has hinted at ditching the United Progressive Movement party to contest for the Kakamega gubernatorial seat under Nairobi Senator Edwin Sifuna's Orange Democratic Movement party following political consultations across the western region.

The announcement generated heated discussions among regional leaders and grassroots coordinators throughout Kakamega and Vihiga counties. Political analysts noted that shifting alliances reflect the evolving electoral calculus as candidates position themselves for competitive county executive positions.`;

    const engineered = engineerTextBurstiness(article, MAX_SENTENCE_WORDS);

    // Average sentence length must be ~14-19 words (well below AI average of 29 words)
    expect(engineered.avgWords).toBeGreaterThanOrEqual(10);
    expect(engineered.avgWords).toBeLessThanOrEqual(20);

    // Burstiness standard deviation must be healthy
    expect(engineered.stdDev).toBeGreaterThanOrEqual(3.5);

    // Must have short sentences
    expect(engineered.shortSentenceRatio).toBeGreaterThan(0);
  });

  it("safeguards honorific titles and decimal numbers in splitIntoSentences", () => {
    const text = "Dr. Boni Khalwale and Sen. Edwin Sifuna met in Kakamega. The project cost KSh. 45.5 million according to Gov. Fernandes Barasa.";
    const sentences = splitIntoSentences(text);

    expect(sentences).toHaveLength(2);
    expect(sentences[0]).toBe("Dr. Boni Khalwale and Sen. Edwin Sifuna met in Kakamega.");
    expect(sentences[1]).toBe("The project cost KSh. 45.5 million according to Gov. Fernandes Barasa.");
  });

  it("applies gender-neutral cadence breaking on female political leaders without misgendering", () => {
    const sentence = "Homa Bay Governor Gladys Wanga has announced plans to contest for the regional party chairmanship ahead of upcoming grassroots elections across Western Kenya.";
    const broken = breakLongSentence(sentence, MAX_SENTENCE_WORDS);

    for (const s of broken) {
      expect(countSentenceWords(s)).toBeLessThanOrEqual(MAX_SENTENCE_WORDS);
      // Strictly prevent misgendering female leader as "He plans"
      expect(s).not.toMatch(/\bHe plans\b/i);
    }
  });

  it("never injects a punchy sentence inside honorific titles or proper names", () => {
    const text = "Dr. Boni Khalwale addressed thousands of party delegates at Bukhungu Stadium in Kakamega on Thursday afternoon. County administrators confirmed that security arrangements had been concluded smoothly.";
    const result = polishParagraphSentenceCadence(text, 0, MAX_SENTENCE_WORDS);

    // Dr. Boni Khalwale must stay united
    expect(result.text).toContain("Dr. Boni Khalwale");
    expect(result.text).not.toContain("Dr. The timing is notable.");
  });
});
