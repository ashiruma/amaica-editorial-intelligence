import { describe, it, expect } from "vitest";
import { ensureEditorialCompliance } from "../lib/editorial/editorialComplianceEngine";
import { validateArticle, canApprove, countWords, extractParagraphs, findAttributedQuotes } from "../lib/articleValidation";

describe("Editorial Compliance & Minimum Requirements Guarantee Engine", () => {
  it("expands a short draft (< 150 words) to >= 700 words and >= 6 paragraphs", () => {
    const shortArticle = {
      headline: "Sauti Sol Announce New Live Acoustic Tour Dates",
      lede: "Kenyan music group Sauti Sol have announced new acoustic concert dates across Nairobi and Western Kenya today.",
      body: `Sauti Sol confirmed on Wednesday that their upcoming tour will cover four key counties.
Fans in Kisumu, Kakamega, and Nairobi can expect intimate acoustic arrangements of their classic hits.
"We want to reconnect with our fans in an intimate setting that honors live musicianship," said lead vocalist Bien-Aime Baraza.
The dates will be announced next week.`,
      template_type: "breaking",
      min_word_count: 700,
    };

    // Before compliance: fails wordcount and paragraphs
    const initialIssues = validateArticle(shortArticle);
    expect(canApprove(initialIssues)).toBe(false);
    expect(initialIssues.some((i) => i.id === "wordcount")).toBe(true);

    // Run compliance guarantee
    const result = ensureEditorialCompliance(shortArticle);
    expect(result.success).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(700);
    expect(result.paragraphCount).toBeGreaterThanOrEqual(6);
    expect(result.approvable).toBe(true);

    const postIssues = validateArticle({
      headline: result.headline,
      lede: result.lede,
      body: result.body,
      sources: result.sources,
      template_type: "breaking",
      min_word_count: 700,
    });
    expect(canApprove(postIssues)).toBe(true);
  });

  it("fixes unattributed quotes and ensures at least 2 attributed quotes", () => {
    const rawArticleWithUnattributedQuote = {
      headline: "Khaligraph Jones Prepares Historic Stadium Show",
      lede: "Kenyan rapper Khaligraph Jones has confirmed final preparations for his landmark stadium performance in Nairobi.",
      body: `Khaligraph Jones met with event organizers in Nairobi on Thursday.
"This is the biggest independent concert we have staged in the last five years."
The rapper inspected the sound stage and lighting towers ahead of the weekend.
Organizers planned security checkpoints along the main gates.
Fans purchased thousands of advance tickets across mobile money platforms.
Broadcasters praised the regional live music setup.`,
      template_type: "breaking",
      min_word_count: 300,
    };

    const initialQuotes = findAttributedQuotes(rawArticleWithUnattributedQuote.body);
    expect(initialQuotes.length).toBe(1);
    expect(initialQuotes[0].attributed).toBe(false);

    // Run compliance
    const result = ensureEditorialCompliance(rawArticleWithUnattributedQuote);

    expect(result.quotesCount).toBeGreaterThanOrEqual(2);
    const postQuotes = findAttributedQuotes(result.body);
    expect(postQuotes.length).toBeGreaterThanOrEqual(2);
    expect(postQuotes.every((q) => q.attributed)).toBe(true);
  });

  it("repairs malformed quote fragments starting with lowercase attribution (e.g. 'he said. ...')", () => {
    const malformedText = `Redsan addressed the media concerning previous radio remarks.
"he said. The singer went on to clarify that Kwambox merely made a light joke."
"Clearly, it seems that they did not understand why Kwambox entertained the topic," Redsan explained.`;

    const article = {
      headline: "Redsan Clarifies Radio Broadcast Remarks",
      lede: "Dancehall artist Redsan has dismissed claims surrounding radio presenters following a briefing in Nairobi.",
      body: malformedText,
      template_type: "breaking",
      min_word_count: 200,
    };

    const result = ensureEditorialCompliance(article);
    expect(result.body).not.toContain('"he said.');
    expect(result.approvable).toBe(true);
  });

  it("dissolves formulaic outline headings and achieves 0% AI footprint", () => {
    const formulaicArticle = {
      headline: "Wakalucy Fish Founder Honored in Nairobi",
      lede: "Culinary pioneer Monica Waithera was celebrated by creatives and artists across Nairobi on Thursday.",
      body: `Monica Waithera built a culinary hub that welcomed musicians, actors, and media personalities.

## Background
The restaurant was established over a decade ago in Nairobi. It quickly gained traction online, serving as a testament to her dedication.

## Key Details
She passed away at the age of 46 after a brief illness. Family members confirmed the details.

## Quotes
"Her hospitality transformed the local creative ecosystem," said event organizer Douglas Masiga.
"She always welcomed struggling musicians with open arms," added coordinator Caleb Opondo.

## Why it matters
Grassroots dining spots provide an essential support network for independent artists in Nairobi.

## Outlook
A memorial service will be held on Friday at All Saints Cathedral.`,
      template_type: "breaking",
      min_word_count: 200,
    };

    const result = ensureEditorialCompliance(formulaicArticle);

    // Formulaic headers must be dissolved
    expect(result.body).not.toContain("## Background");
    expect(result.body).not.toContain("## Key Details");
    expect(result.body).not.toContain("## Quotes");
    expect(result.body).not.toContain("## Why it matters");
    expect(result.body).not.toContain("## Outlook");

    // Must pass validation with zero errors
    expect(result.approvable).toBe(true);
  });

  it("attaches verified sources with notes when sources are missing", () => {
    const articleWithoutSources = {
      headline: "Benga Festival Set for Kisumu Waterfront",
      lede: "Organizers have announced a three-day Benga festival along the Kisumu waterfront this November.",
      body: `Benga musicians from across Western Kenya will converge in Kisumu.
"We are celebrating regional cultural sounds with world-class production," said director Douglas Masiga.
"Audiences in Kisumu love live music," added coordinator Mercy Chepkemoi.
The festival will feature ten live bands and local food exhibitions.
Security officers will coordinate with local authorities.
Tickets will be available via mobile money.`,
      template_type: "breaking",
      min_word_count: 200,
      sources: [],
    };

    const result = ensureEditorialCompliance(articleWithoutSources);
    expect(result.sources.length).toBeGreaterThanOrEqual(1);
    expect(result.sources[0].notes).toBeDefined();
    expect(result.sources[0].notes!.length).toBeGreaterThanOrEqual(2);
    expect(result.approvable).toBe(true);
  });

  it("end-to-end: resolves all 3 user screenshot errors (2 unattributed quotes + AI content) to 100% pass", () => {
    // Exact scenario from user's screenshot
    const redsanDraft = {
      headline: "Redsan Denies Claims He Attacked Radio Presenters",
      lede: "Dancehall titan Redsan has moved to dismiss rumors alleging tensions with broadcast presenters in Nairobi.",
      body: `Dancehall veteran Redsan addressed reports regarding past broadcast interactions during a radio interview.
"he said. The singer went on to clarify that Kwambox merely made a lighthearted comment," adding that there was no bad blood.
"Clearly, it seems that they did not understand why Kwambox entertained the joke," stating that both parties moved on peacefully.
Organizers planned future live shows across Nairobi and Western Kenya.
Production teams prepared logistics for the upcoming concerts.
Fans welcomed the clarification across digital message boards.`,
      template_type: "breaking",
      min_word_count: 700,
      sources: [{ url: "https://standardmedia.co.ke/article/2001557809", title: "Standard Media", notes: [] }],
    };

    const result = ensureEditorialCompliance(redsanDraft);

    expect(result.success).toBe(true);
    expect(result.approvable).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(700);
    expect(result.paragraphCount).toBeGreaterThanOrEqual(6);
    expect(result.quotesCount).toBeGreaterThanOrEqual(2);

    const finalIssues = validateArticle({
      headline: result.headline,
      lede: result.lede,
      body: result.body,
      sources: result.sources,
      template_type: "breaking",
      min_word_count: 700,
    });

    const errorIssues = finalIssues.filter((i) => i.severity === "error");
    expect(errorIssues.length).toBe(0);
    expect(canApprove(finalIssues)).toBe(true);
  });

  it("regression: purges 'resonate deeply', 'captivated audiences', and ', leaving' from Crazy Kennar excerpt", () => {
    // Exact phrases from the user screenshot that were surviving Auto-Fix
    const kennarDraft = {
      headline: "Crazy Kennar: How Kenya's Comedy King Built a Digital Empire",
      lede: "Comedian Crazy Kennar has captivated audiences across Kenya with his viral social satire and relatable humor.",
      body: `Crazy Kennar, born Kennedy Odhiambo, rose from humble beginnings in Western Kenya to become one of the country's most recognized comedic voices. His talent for transforming everyday experiences into relatable, humorous content solidifies his role as a significant cultural commentator. His skits resonate deeply because they capture shared frustrations and realities. It offered a comedic lens through which audiences can process challenges.

By investing in quality video production and authentic storytelling, he built a loyal following across YouTube, TikTok, and Instagram, captivated audiences numbering in the millions. The result was a comedic universe that audiences found impossible to ignore, leaving fans hungry for more original content week after week.

"I just want to show that ordinary Kenyan life has layers of humor in it," Crazy Kennar said in a recent interview. "Every frustration is a punchline if you look at it right."

His collective now employs over 20 creatives, giving employment to writers, camera operators, and editors.

"He is the blueprint for how to build a sustainable comedy brand in Kenya," said media analyst Paul Mwangi. "Others are now following his model."

Brand partnerships and digital advertising contracts generate millions of shillings annually for his studio.`,
      template_type: "breaking",
      min_word_count: 700,
      sources: [{ url: "https://standardmedia.co.ke/article/crazy-kennar", title: "Standard Media", notes: [{ text: "Interview details verified", section: "Key Details" }] }],
    };

    const result = ensureEditorialCompliance(kennarDraft);

    // The three specific flagged phrases must NOT appear in output
    expect(result.body).not.toMatch(/\bresonates?\s+deeply\b/i);
    expect(result.lede).not.toMatch(/\bresonates?\s+deeply\b/i);
    expect(result.body).not.toMatch(/\bcaptivat(?:ing|ed)\s+audiences?\b/i);
    expect(result.lede).not.toMatch(/\bcaptivat(?:ing|ed)\s+audiences?\b/i);
    expect(result.body).not.toMatch(/,\s*leaving\s+fans/i);
    expect(result.body).not.toMatch(/\bsolidif(?:ies|ied)\s+his\s+role\s+as\b/i);

    // Must still be fully approvable
    expect(result.approvable).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(700);

    const finalIssues = validateArticle({
      headline: result.headline,
      lede: result.lede,
      body: result.body,
      sources: result.sources,
      template_type: "breaking",
      min_word_count: 700,
    });
    const errors = finalIssues.filter((i) => i.severity === "error");
    expect(errors.length).toBe(0);
    expect(canApprove(finalIssues)).toBe(true);
  });
});
