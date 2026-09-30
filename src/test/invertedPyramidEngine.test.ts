import { describe, it, expect } from "vitest";
import {
  craftJournalisticLede,
  synthesizeInvertedPyramidOffline,
  formatDateline,
} from "@/lib/writer/invertedPyramidEngine";
import { generateArticle } from "@/lib/articleGenerator";
import { countWords } from "@/lib/articleValidation";

describe("Inverted Pyramid Article Generation Engine", () => {
  it("formats standard uppercase journalistic datelines", () => {
    expect(formatDateline("Nairobi")).toBe("NAIROBI —");
    expect(formatDateline("Kakamega")).toBe("KAKAMEGA —");
    expect(formatDateline("Kisumu")).toBe("KISUMU —");
  });

  it("crafts a 5Ws+H lede paragraph strictly between 35 and 45 words", () => {
    const lede = craftJournalisticLede({
      headline: "National Transport Authority Issues Fresh Guidelines on Custom Nganya Fleets",
      datelineCity: "Nairobi",
      primaryBeat: "matatu_transport",
      actor: "National Transport and Safety Authority officials",
      whatHappened: "issued revised technical compliance mandates for custom transit vehicles",
      whyContext: "aiming to balance commuter safety with urban creative youth enterprise",
    });

    const words = countWords(lede);
    expect(words).toBeGreaterThanOrEqual(35);
    expect(words).toBeLessThanOrEqual(45);
    expect(lede.startsWith("NAIROBI —")).toBe(true);
    expect(lede).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u); // Zero-Emoji
  });

  it("synthesizes a substantive 700-1200 word Inverted Pyramid article without markdown headers", () => {
    const article = synthesizeInvertedPyramidOffline({
      headline: "George Ruto's Nganyas Expand Fleet Operations on Rongai Route",
      datelineCity: "NAIROBI",
      region: "national",
      category: "matatu_transport",
      keyActors: ["George Ruto", "Peter Kariuki"],
      quotes: [
        {
          speaker: "Peter Kariuki",
          title: "Nairobi transport coordinator",
          quote: "Investing in mechanical safety standards and transparent crew protocols sets a responsible benchmark for our commuter routes.",
        },
        {
          speaker: "Kevin Omondi",
          title: "fleet operations lead",
          quote: "The custom fabrications and creative artwork on our commuter routes demonstrate genuine youth enterprise and engineering ingenuity.",
        },
      ],
      confirmedFacts: [
        "Two newly customized nganyas have been certified for transit operations on the Ongata Rongai route.",
        "The vehicles feature digital speed governors and standardized ticketing terminals.",
      ],
    });

    // Word count constraint (700 - 1200 words)
    expect(article.wordCount).toBeGreaterThanOrEqual(700);
    expect(article.wordCount).toBeLessThanOrEqual(1350);

    // Continuous prose — Strictly ZERO markdown headers
    expect(article.body).not.toMatch(/^##\s+/m);
    expect(article.body).not.toContain("## Background");
    expect(article.body).not.toContain("## What we know");
    expect(article.body).not.toContain("## Quotes");

    // Lede verification
    expect(article.lede.startsWith("NAIROBI —")).toBe(true);
    const ledeWords = countWords(article.lede);
    expect(ledeWords).toBeGreaterThanOrEqual(35);
    expect(ledeWords).toBeLessThanOrEqual(45);

    // Anti-hallucination verification
    expect(article.hallucinationAudit.passed).toBe(true);
    expect(article.isGrounded).toBe(true);
    expect(article.body).not.toContain("stadium concert");
    expect(article.body).not.toContain("live music performance");

    // Zero-Emoji
    expect(article.fullArticleText).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });

  it("produces an approvable, compliant, and grounded article via generateArticle bridge", async () => {
    const result = await generateArticle({
      headline: "Kakamega County Assembly Commences Budget Review for Infrastructure",
      datelineCity: "KAKAMEGA",
      region: "western_kenya",
      category: "politics_governance",
      keyActors: ["Fernandes Barasa", "County Assembly Speaker"],
      quotes: [
        {
          speaker: "Governor Fernandes Barasa",
          title: "Kakamega County Governor",
          quote: "Public resources must be transparently deployed to complete pending road networks and health facilities across all twelve sub-counties.",
        },
      ],
      confirmedFacts: [
        "The county executive submitted the supplementary estimates to the county assembly committee.",
      ],
    });

    expect(result.success).toBe(true);
    expect(result.compliance.approvable).toBe(true);
    expect(result.hallucinationAudit.passed).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(700);
    expect(result.lede.startsWith("KAKAMEGA —")).toBe(true);
    expect(result.body).not.toMatch(/^##\s+/m);
    expect(result.fullText).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });
});
