import { describe, it, expect } from "vitest";
import {
  dissolveFormulaicHeaders,
  cleanAiClichesLocally,
  humanizeText,
  analyzeAiContent,
} from "../lib/aiContentDetector";
import { validateArticle, canApprove } from "../lib/articleValidation";
import {
  repurposeWireStory,
  fetchLiveTrendingWireStories,
  CURATED_TRENDING_LEADS,
  calculateTrendingVelocityScore,
  autoGenerateTrendingStories,
} from "../lib/editorial/wireRepurposingEngine";

describe("Wire Repurposing & Natural Journalistic Storytelling", () => {
  const SAMPLE_OUTLINE_ARTICLE = `Congolese rhumba star Fally Ipupa performed in Nairobi, Kenya, on Friday, September 6, 2026, delivering an evening of music to thousands of fans.

The concert featured a blend of rhumba and Amapiano, alongside several prominent African artists who joined him on stage for collaborative sets. Organizers confirmed that over 15,000 attendees filled the venue, paying tickets starting at Ksh 3,500.

## Background
The singer last performed in Nairobi two years ago. Fans arrived early at the venue, with security officers managing crowds along the perimeter.

## Official Response
"I am grateful for the overwhelming reception from Nairobi fans," Fally Ipupa stated in a media briefing following the concert. "Kenya has always been a second home for Congolese rhumba, and we will return next year."

## Why it matters
The event demonstrates the growing market for regional live entertainment in East Africa. According to reports from event managers, international tour stops in Nairobi have surged by 45 percent over the past three years.

## Outlook
Tour organizers indicated that plans are underway for a multi-city East African circuit in 2027.`;

  describe("1. Formulaic Header Dissolution", () => {
    it("dissolves ## Background, ## Official Response, and ## Why it matters into continuous paragraphs", () => {
      const dissolved = dissolveFormulaicHeaders(SAMPLE_OUTLINE_ARTICLE);

      expect(dissolved).not.toMatch(/##\s*Background/i);
      expect(dissolved).not.toMatch(/##\s*Official Response/i);
      expect(dissolved).not.toMatch(/##\s*Why it matters/i);
      expect(dissolved).not.toMatch(/##\s*Outlook/i);

      // Verify the content itself is preserved in continuous prose
      expect(dissolved).toContain("The singer last performed in Nairobi two years ago.");
      expect(dissolved).toContain("I am grateful for the overwhelming reception from Nairobi fans");
      expect(dissolved).toContain("The event demonstrates the growing market for regional live entertainment");
      expect(dissolved).toContain("Tour organizers indicated that plans are underway");
    });

    it("dissolves bold outline headers like **Background** and **Official Response:**", () => {
      const boldText = `First paragraph here.
      
**Background**
This is the background context.

**Official Response:**
"We are pleased with the turnout," the promoter said.`;

      const dissolved = dissolveFormulaicHeaders(boldText);
      expect(dissolved).not.toContain("**Background**");
      expect(dissolved).not.toContain("**Official Response:**");
      expect(dissolved).toContain("This is the background context.");
      expect(dissolved).toContain('"We are pleased with the turnout," the promoter said.');
    });
  });

  describe("2. Article Validation for Continuous Journalism", () => {
    it("passes validation cleanly with 0 errors for continuous prose without outline headers", () => {
      const rawLede = "Congolese musician Fally Ipupa performed in Nairobi on Friday before an audience of over 15,000 fans at Uhuru Park.";
      const rawBody = `Congolese musician Fally Ipupa performed in Nairobi, Kenya, on Friday, September 6, 2026. He played a full live set for thousands of cheering fans from across East Africa.

The concert combined traditional rhumba with modern rhythms. Top guest musicians joined him on stage to perform together throughout the evening. Venue managers confirmed that over 15,000 attendees packed the grounds, with regular tickets starting at Ksh 3,500.

The live showcase marks his first Nairobi appearance in two years. Fans arrived at the gates from early afternoon, while police and private marshals managed perimeter security.

"I am grateful for the overwhelming reception from Nairobi fans," Fally Ipupa told reporters after the show. "Kenya has always been a second home for Congolese rhumba, and we will return next year with a bigger tour."

"The stage setup and sound engineering met all regional festival standards," confirmed event director Caroline Shisanya. "We demonstrated that Nairobi can host stadium-scale live music seamlessly."

The sold-out showcase highlights a resurgence in East Africa's commercial live music sector. International tour dates in Nairobi surged by 45 percent over the past three years. Promoters confirmed that preliminary arrangements are underway for lakeside performances in Kisumu and Kakamega.`;

      const humanizedLede = humanizeText(rawLede, "ultra").humanizedText;
      const humanizedBody = humanizeText(rawBody, "ultra").humanizedText;

      const naturalContinuousArticle = {
        headline: "Fally Ipupa thrills 15,000 rhumba fans in landmark Nairobi concert",
        lede: humanizedLede,
        body: humanizedBody,
        template_type: "breaking",
        min_word_count: 100,
        sources: [{ url: "https://example.com/wire", title: "Concert Desk", notes: ["15,000 fans attended", "Tickets Ksh 3,500"] }],
      };

      const issues = validateArticle(naturalContinuousArticle);
      const errors = issues.filter((i) => i.severity === "error");

      expect(errors.length).toBe(0);
      expect(canApprove(issues)).toBe(true);

      // Verify no formulaic heading warnings on natural prose
      const headingWarning = issues.find((i) => i.id === "formulaic-headings");
      expect(headingWarning).toBeUndefined();
    });

    it("flags a warning (non-blocking) when formulaic outline headers are detected", () => {
      const issues = validateArticle({
        headline: "Fally Ipupa delivers live performance in Nairobi",
        lede: "Congolese rhumba star Fally Ipupa performed in Nairobi on Friday before 15,000 fans.",
        body: SAMPLE_OUTLINE_ARTICLE,
        template_type: "breaking",
        sources: [{ url: "https://example.com", title: "Test", notes: ["Fact 1"] }],
      });

      const headingWarning = issues.find((i) => i.id === "formulaic-headings");
      expect(headingWarning).toBeDefined();
      expect(headingWarning?.severity).toBe("warning");
      expect(headingWarning?.message).toContain("Formulaic outline header");
      expect(headingWarning?.suggestion).toContain("Inverted-pyramid journalism");
    });
  });

  describe("3. Wire Repurposing Pipeline", () => {
    it("ensures all curated trending leads have valid URLs from legitimate Kenyan publications", () => {
      expect(CURATED_TRENDING_LEADS.length).toBeGreaterThanOrEqual(10);
      const allowedDomains = ["pulse.co.ke", "standardmedia.co.ke", "mpasho.co.ke", "citizen.digital"];
      for (const lead of CURATED_TRENDING_LEADS) {
        expect(lead.source_url).toMatch(/^https:\/\//);
        expect(lead.title.length).toBeGreaterThan(15);
        expect(lead.excerpt.length).toBeGreaterThan(30);
        const hasValidDomain = allowedDomains.some((d) => lead.source_url.includes(d));
        expect(hasValidDomain).toBe(true);
      }
    });

    it("loads trending wire leads from database or curated fallback", async () => {
      const leads = await fetchLiveTrendingWireStories();
      expect(leads.length).toBeGreaterThanOrEqual(4);
      expect(leads[0].title).toBeDefined();
      expect(leads[0].source_url).toBeDefined();
    }, 15000);

    it("repurposes raw wire story into 0% AI continuous inverted-pyramid copy", async () => {
      const wireLead = CURATED_TRENDING_LEADS[0];
      const result = await repurposeWireStory({
        title: wireLead.title,
        rawContent: `NAIROBI — Congolese music heavyweight Fally Ipupa staged a massive performance in Nairobi on Friday. Over 15,000 fans attended the concert at Uhuru Park. Speaking after the show, Ipupa said: "Nairobi has always shown me deep love, and this concert was special." Organizers confirmed tickets sold out two days prior. The show marks his first Kenyan performance since 2024. Industry observers note that Nairobi live events have grown by 40% in recent years.`,
        sourceName: wireLead.source,
      });

      expect(result.success).toBe(true);
      expect(result.headline).toBeDefined();
      expect(result.lede.length).toBeGreaterThan(20);
      expect(result.body.length).toBeGreaterThan(100);

      // Must have zero formulaic outline headers
      expect(result.body).not.toMatch(/##\s*Background/i);
      expect(result.body).not.toMatch(/##\s*Why it matters/i);
      expect(result.body).not.toMatch(/##\s*Quotes/i);

      // Must achieve 0% AI detection score
      expect(result.aiScore).toBe(0);
      expect(result.humanScore).toBe(100);

      // Key entities must be preserved
      expect(result.fullArticleText).toContain("Fally Ipupa");
      expect(result.fullArticleText).toContain("15,000");
    });

    it("calculates trending velocity scores giving highest priority to breaking viral entertainment news", () => {
      const breakingLead = {
        title: "Mags reveals why she left relationship with Alma, says she feared ending up in a body bag",
        excerpt: "Creator breaks silence on dramatic split and domestic altercation.",
        source: "Mpasho",
        published_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        category: "gossip",
      };

      const olderGenericLead = {
        title: "County government discusses cultural festival arrangements for next year",
        excerpt: "Officials met to discuss preliminary logistics for regional holiday showcases.",
        source: "Local Wire",
        published_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
        category: "events",
      };

      const scoreBreaking = calculateTrendingVelocityScore(breakingLead);
      const scoreGeneric = calculateTrendingVelocityScore(olderGenericLead);

      expect(scoreBreaking).toBeGreaterThan(80);
      expect(scoreBreaking).toBeGreaterThan(scoreGeneric);
    });

    it("ensures fetchLiveTrendingWireStories returns leads ordered with trending topics first", async () => {
      const leads = await fetchLiveTrendingWireStories();
      expect(leads.length).toBeGreaterThanOrEqual(2);
      expect(leads[0].trendingScore).toBeDefined();

      for (let i = 0; i < leads.length - 1; i++) {
        expect(leads[i].trendingScore!).toBeGreaterThanOrEqual(leads[i + 1].trendingScore!);
      }
    }, 15000);

    it("auto-generates trending stories with standardized 7-paragraph structure and 0% AI clearance", async () => {
      const testUserId = "550e8400-e29b-41d4-a716-446655440000";
      const progressMessages: string[] = [];

      const result = await autoGenerateTrendingStories({
        count: 2,
        userId: testUserId,
        userDisplayName: "Amaica Wire Auto-Pilot",
        onProgress: (msg) => progressMessages.push(msg),
      });

      expect(result.totalProcessed).toBe(2);
      expect(result.successCount).toBeGreaterThanOrEqual(1);
      expect(result.drafts.length).toBeGreaterThanOrEqual(1);

      const firstDraft = result.drafts[0];
      expect(firstDraft.draftId).toBeDefined();
      expect(firstDraft.headline.length).toBeGreaterThan(15);
      expect(firstDraft.wordCount).toBeGreaterThanOrEqual(700);
      expect(firstDraft.aiScore).toBe(0);
      expect(firstDraft.trendingScore).toBeGreaterThan(50);
      expect(progressMessages.length).toBeGreaterThan(0);
    }, 60000);
  });
});

