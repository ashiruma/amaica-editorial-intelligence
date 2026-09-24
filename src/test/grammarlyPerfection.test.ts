import { describe, it, expect } from "vitest";
import {
  convertParticipleToPastTense,
  perfectArticleGrammar,
  perfectArticleHeadlineLedeBody,
  auditGrammarlyScore,
} from "@/lib/editorial/grammarlyPerfectionEngine";
import { ensureEditorialCompliance } from "@/lib/editorial/editorialComplianceEngine";

describe("Grammarly 99%+ Perfection Engine", () => {
  describe("convertParticipleToPastTense", () => {
    it("converts irregular gerunds to authentic past tense verbs", () => {
      expect(convertParticipleToPastTense("leaving")).toBe("left");
      expect(convertParticipleToPastTense(", leaving")).toBe("left");
      expect(convertParticipleToPastTense("making")).toBe("made");
      expect(convertParticipleToPastTense("taking")).toBe("took");
      expect(convertParticipleToPastTense("giving")).toBe("gave");
      expect(convertParticipleToPastTense("setting")).toBe("set");
      expect(convertParticipleToPastTense("leading")).toBe("led");
      expect(convertParticipleToPastTense("drawing")).toBe("drew");
      expect(convertParticipleToPastTense("growing")).toBe("grew");
      expect(convertParticipleToPastTense("winning")).toBe("won");
      expect(convertParticipleToPastTense("spending")).toBe("spent");
      expect(convertParticipleToPastTense("bringing")).toBe("brought");
    });

    it("converts regular gerunds properly with standard morphological rules", () => {
      expect(convertParticipleToPastTense("sparking")).toBe("sparked");
      expect(convertParticipleToPastTense("creating")).toBe("created");
      expect(convertParticipleToPastTense("raising")).toBe("raised");
      expect(convertParticipleToPastTense("highlighting")).toBe("highlighted");
      expect(convertParticipleToPastTense("demonstrating")).toBe("demonstrated");
    });
  });

  describe("perfectArticleGrammar", () => {
    it("repairs any broken participial past tense constructions", () => {
      const input = "The sudden announcement shook the crowd. This maked fans question the upcoming tour.";
      const { text, improvements } = perfectArticleGrammar(input);
      expect(text).toContain("This made fans question");
      expect(improvements.some((i) => i.includes("made"))).toBe(true);
    });

    it("repairs . This leaved to . This left", () => {
      const input = "The producer departed without notice. This leaved the entire cast stranded.";
      const { text } = perfectArticleGrammar(input);
      expect(text).toContain("This left the entire cast stranded");
    });

    it("purges wordy redundant clichés into lean journalistic prose", () => {
      const input = "The festival organizers made a decision in order to completely eliminate delays due to the fact that attendance doubled.";
      const { text, improvements } = perfectArticleGrammar(input);
      expect(text).toContain("decided");
      expect(text).toContain("to eliminate delays");
      expect(text).toContain("because attendance doubled");
      expect(improvements.length).toBeGreaterThanOrEqual(3);
    });

    it("hyphenates compound modifiers before nouns", () => {
      const input = "The high profile artist announced a long term brand partnership with blue chip sponsors.";
      const { text } = perfectArticleGrammar(input);
      expect(text).toContain("high-profile artist");
      expect(text).toContain("long-term brand");
      expect(text).toContain("blue-chip sponsors");
    });

    it("unhyphenates -ly adverbs as required by Grammarly and AP Style", () => {
      const input = "The critically-acclaimed documentary features highly-anticipated interviews with widely-known musicians.";
      const { text } = perfectArticleGrammar(input);
      expect(text).toContain("critically acclaimed documentary");
      expect(text).toContain("highly anticipated interviews");
      expect(text).toContain("widely known musicians");
    });

    it("fixes commonly confused words and verb forms", () => {
      const input = "The dispute has lead to public outcry, and rehearsals take place everyday.";
      const { text } = perfectArticleGrammar(input);
      expect(text).toContain("has led to public outcry");
      expect(text).toContain("take place every day");
    });

    it("enforces commas after introductory transitions", () => {
      const input = "Meanwhile the organizing committee issued an advisory. However fans continued celebrating.";
      const { text } = perfectArticleGrammar(input);
      expect(text).toContain("Meanwhile, the organizing committee");
      expect(text).toContain("However, fans continued");
    });

    it("enforces American journalistic quotation mechanics (punctuation inside quotes)", () => {
      const input = '"We are deeply honored by this recognition", said the lead vocalist.';
      const { text } = perfectArticleGrammar(input);
      expect(text).toBe('"We are deeply honored by this recognition," said the lead vocalist.');
    });

    it("cleans double punctuation and spacing defects", () => {
      const input = "The concert was a massive success.. Venue gates opened early , admitting patrons smoothly.";
      const { text } = perfectArticleGrammar(input);
      expect(text).not.toContain("..");
      expect(text).not.toContain(" ,");
      expect(text).toContain("success. Venue gates opened early, admitting patrons smoothly.");
    });

    it("partitions 36+ word run-on sentences for pacing and clarity", () => {
      const runOn = "The music festival drew tens of thousands of revellers from all across East Africa to celebrate regional sound and dance traditions, and international touring artists joined local performers on stage during the grand finale.";
      const { text, improvements } = perfectArticleGrammar(runOn);
      expect(improvements.some((i) => i.includes("Partitioned"))).toBe(true);
      expect(text).toContain(". International touring artists");
    });
  });

  describe("perfectArticleHeadlineLedeBody", () => {
    it("polishes headline, lede, and body holistically", () => {
      const result = perfectArticleHeadlineLedeBody(
        "Major high profile concert announced for Nairobi .",
        "Due to the fact that tickets sold out, organizers added a second night",
        '"This is a dream come true", said the promoter. The tour has lead to immense joy across Kenya.'
      );

      expect(result.headline).toBe("Major high-profile concert announced for Nairobi");
      expect(result.lede).toContain("Because tickets sold out, organizers added a second night.");
      expect(result.body).toContain('"This is a dream come true," said the promoter.');
      expect(result.body).toContain("has led to immense joy");
    });
  });

  describe("auditGrammarlyScore", () => {
    it("evaluates a pristine journalistic article with >= 99% score", () => {
      const cleanArticle = `
Nairobi's premier entertainment district witnessed an extraordinary turnout as local and international performers gathered for the annual cultural gala. The evening showcased exceptional musical talent, drawing enthusiastic patrons from across the country.

"Our goal has always been to elevate East African contemporary sound to the global stage," said festival director Martin Wanyama. "The response from our audience tonight reaffirms the immense creative potential of our industry."

Industry commentators noted that modern staging and acoustic clarity have transformed live performances into major cultural milestones. Regional tour organizers emphasized that structured brand partnerships and disciplined production standards remain crucial for long-term growth across the entertainment sector.
      `.trim();

      const audit = auditGrammarlyScore(cleanArticle);
      expect(audit.score).toBeGreaterThanOrEqual(99);
      expect(audit.correctness).toBeGreaterThanOrEqual(98);
      expect(audit.clarity).toBeGreaterThanOrEqual(98);
    });

    it("penalizes broken verb forms and wordiness appropriately", () => {
      const flawed = 'The event was held in order to completely eliminate confusion. This maked patrons angry", said the manager..';
      const audit = auditGrammarlyScore(flawed);
      expect(audit.score).toBeLessThan(95);
      expect(audit.correctness).toBeLessThan(95);
    });
  });

  describe("ensureEditorialCompliance integration with Grammarly perfection", () => {
    it("guarantees zero broken participials and >= 99% Grammarly compliance on repaired articles", () => {
      const rawBody = `
The music awards gala concluded on Saturday evening, leaving audiences in awe of the spectacular choreography. The production team worked around the clock in order to make a decision on final nominees, making it a historic milestone for Kenyan entertainment.

"We have witnessed unprecedented growth in African contemporary music this season," said chief judge Sarah Ondimu. "The standard of creativity and dedication shown by all nominees demonstrates the maturity of our industry."

"Our ongoing commitment is to celebrate authentic regional storytelling with unmatched technical excellence," added broadcast director Douglas Masiga.
      `.trim();

      const result = ensureEditorialCompliance({
        headline: "Prestigious Nairobi Music Awards Gala Honors Top East African Performers",
        lede: "The prestigious Nairobi Music Awards honored outstanding musical creators across East Africa during an energetic ceremony held on Saturday.",
        body: rawBody,
        region: "national",
        category: "music",
        sources: [
          {
            url: "https://amaica.media/wire/nairobi-awards",
            title: "Music Desk",
            notes: [{ text: "Annual awards ceremony held Saturday", section: "Key Details" }]
          }
        ]
      });

      expect(result.success).toBe(true);
      // Verify NO broken participials like ". This maked" or ". This leaved"
      expect(result.body).not.toMatch(/\. This (?:maked|leaved|taked|gived|setted)\b/);
      expect(result.body).toContain(". This made");

      // Verify wordy redundancy eliminated ("in order to make a decision" -> "to decide")
      expect(result.body).not.toContain("in order to make a decision");

      // Verify Grammarly audit score of compliant output is >= 99%
      const audit = auditGrammarlyScore(result.body);
      expect(audit.score).toBeGreaterThanOrEqual(99);
    });
  });
});
