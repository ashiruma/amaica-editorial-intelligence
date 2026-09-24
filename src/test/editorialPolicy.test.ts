import { describe, it, expect } from "vitest";
import {
  EDITORIAL_POLICY_SECTIONS,
  EDITORIAL_APPROVAL_PRINCIPLES,
} from "../pages/public/EditorialPolicy";

describe("Amaica Media Editorial Policy & Governance", () => {
  it("contains all 16 official policy clauses including the zero-emoji workplace standard", () => {
    expect(EDITORIAL_POLICY_SECTIONS.length).toBe(16);

    const titles = EDITORIAL_POLICY_SECTIONS.map((s) => s.title);
    expect(titles).toContain("EDITORIAL INDEPENDENCE");
    expect(titles).toContain("ACCURACY AND FACT-CHECKING");
    expect(titles).toContain("FAIRNESS AND BALANCE");
    expect(titles).toContain("SOURCE IDENTIFICATION AND CONFIDENTIALITY");
    expect(titles).toContain("CORRECTIONS AND RIGHT OF REPLY");
    expect(titles).toContain("CONFLICTS OF INTEREST");
    expect(titles).toContain("SEPARATION OF EDITORIAL AND COMMERCIAL CONTENT");
    expect(titles).toContain("POLITICAL AND ELECTION COVERAGE");
    expect(titles).toContain("PROTECTION OF CHILDREN AND VULNERABLE PERSONS");
    expect(titles).toContain("PRIVACY, DIGNITY AND HUMAN RIGHTS");
    expect(titles).toContain("HATE SPEECH, INCITEMENT AND DISCRIMINATION");
    expect(titles).toContain("USER-GENERATED AND SOCIAL MEDIA CONTENT");
    expect(titles).toContain("USE OF ARTIFICIAL INTELLIGENCE AND DIGITAL TOOLS");
    expect(titles).toContain("NEWSROOM PROFESSIONAL CONDUCT");
    expect(titles).toContain("EDITORIAL ACCOUNTABILITY AND QUALITY ASSURANCE");
    expect(titles).toContain("STRICT ZERO-EMOJI WORKPLACE STANDARD");
  });

  it("verifies AI and Digital Tools clause mandates human fact-checking responsibility", () => {
    const aiClause = EDITORIAL_POLICY_SECTIONS.find(
      (s) => s.title === "USE OF ARTIFICIAL INTELLIGENCE AND DIGITAL TOOLS"
    );
    expect(aiClause).toBeDefined();
    expect(aiClause?.content).toContain("journalists remain responsible for the accuracy and integrity of the final content");
    expect(aiClause?.content).toContain("AI-generated material shall not be presented as verified human reporting without appropriate checks");
  });

  it("verifies the Strict Zero-Emoji clause mandates solemn professional journalism", () => {
    const emojiClause = EDITORIAL_POLICY_SECTIONS.find(
      (s) => s.title === "STRICT ZERO-EMOJI WORKPLACE STANDARD"
    );
    expect(emojiClause).toBeDefined();
    expect(emojiClause?.content).toContain("No emojis are permitted anywhere in editorial work");
    expect(emojiClause?.content).toContain("Journalism is solemn, rigorous, and professional");
  });

  it("verifies the Editorial Approval Principles gatekeeper questions", () => {
    expect(EDITORIAL_APPROVAL_PRINCIPLES.length).toBeGreaterThanOrEqual(10);
    expect(EDITORIAL_APPROVAL_PRINCIPLES[0]).toBe("Is it accurate?");
    expect(EDITORIAL_APPROVAL_PRINCIPLES[1]).toBe("Has it been verified?");
    expect(EDITORIAL_APPROVAL_PRINCIPLES[2]).toBe("Is it fair and balanced?");
    expect(EDITORIAL_APPROVAL_PRINCIPLES[3]).toBe("Is there a public-interest justification?");
    expect(EDITORIAL_APPROVAL_PRINCIPLES[4]).toBe("Have the affected parties been given an opportunity to respond where appropriate?");
    expect(EDITORIAL_APPROVAL_PRINCIPLES[5]).toBe("Does it protect privacy, dignity and vulnerable persons?");
    expect(EDITORIAL_APPROVAL_PRINCIPLES[6]).toBe("Could it promote hate, violence or discrimination?");
    expect(EDITORIAL_APPROVAL_PRINCIPLES[7]).toBe("Is any commercial or personal interest properly disclosed?");
    expect(EDITORIAL_APPROVAL_PRINCIPLES[8]).toBe("Have photographs, videos, audio and user-generated content been authenticated?");
    expect(EDITORIAL_APPROVAL_PRINCIPLES[9]).toBe("Would we be able to defend the editorial decision if challenged?");
  });

  it("ensures every clause has substantive content and clear metadata tags", () => {
    for (const section of EDITORIAL_POLICY_SECTIONS) {
      expect(section.num).toBeDefined();
      expect(section.content.length).toBeGreaterThan(50);
      expect(section.tag.length).toBeGreaterThan(3);
    }
  });

  describe("Zero-Emoji Work Rule Enforcement", () => {
    it("flags any emoji in journalistic copy as an approval-blocking error", async () => {
      const { validateArticle, hasEmojis, stripEmojis } = await import("../lib/articleValidation");
      
      const emojiText = "Celebrity drops fire new album 🔥 and shocks fans 🚀!";
      expect(hasEmojis(emojiText)).toBe(true);

      const stripped = stripEmojis(emojiText);
      expect(hasEmojis(stripped)).toBe(false);
      expect(stripped).toBe("Celebrity drops fire new album and shocks fans !");

      const issues = validateArticle({
        headline: "Celebrity drops new album 🔥 in Nairobi",
        lede: "A prominent artist released their studio album on Thursday afternoon in Nairobi.",
        body: "The album arrived across major streaming networks today.",
      });

      const emojiIssue = issues.find((i) => i.id === "zero-emoji-violation");
      expect(emojiIssue).toBeDefined();
      expect(emojiIssue?.severity).toBe("error");
    });

    it("automatically purges all emojis during compliance remediation", async () => {
      const { ensureEditorialCompliance } = await import("../lib/editorial/editorialComplianceEngine");
      const { hasEmojis } = await import("../lib/articleValidation");

      const result = ensureEditorialCompliance({
        headline: "Nairobi Festival Launches ⚡",
        lede: "The annual city festival opened in Nairobi on Thursday with verified musical acts.",
        body: "Organizers confirmed attendance across all venues ✨.\n\nTicket sales opened at KSh 1,500 🔥.\n\nThe festival previously paused for two years.\n\nAttendance hit 22,000.\n\n\"We are back at full strength,\" said Festival Director Caroline Shisanya.\n\nThe music scene welcomes the return.\n\nTickets remain available through official outlets.",
      });

      expect(hasEmojis(result.headline)).toBe(false);
      expect(hasEmojis(result.lede)).toBe(false);
      expect(hasEmojis(result.body)).toBe(false);
    });

    it("purges emojis during Grammarly 99%+ perfection polish", async () => {
      const { perfectArticleGrammar, auditGrammarlyScore } = await import("../lib/editorial/grammarlyPerfectionEngine");
      const { hasEmojis } = await import("../lib/articleValidation");

      const raw = "The show was amazing 🔥 and drew crowds 🚀. In addition she performed.";
      const audit = auditGrammarlyScore(raw);
      expect(audit.score).toBeLessThan(90);

      const perfected = perfectArticleGrammar(raw);
      expect(hasEmojis(perfected.text)).toBe(false);
      expect(perfected.improvements.some((imp) => imp.includes("emojis"))).toBe(true);
    });
  });

  describe("WordPress Connector & Gateway", () => {
    it("manages WordPress configuration with safe defaults", async () => {
      const { getWordPressConfig, saveWordPressConfig, DEFAULT_WP_CONFIG } = await import("../lib/wordpress/wordpressConnector");

      const config = getWordPressConfig();
      expect(config.siteUrl).toBeDefined();
      expect(config.defaultStatus).toBe("pending");

      const updated = saveWordPressConfig({ siteUrl: "custom-press.internal", defaultStatus: "draft" });
      expect(updated.siteUrl).toBe("custom-press.internal");
      expect(updated.defaultStatus).toBe("draft");

      // Reset
      saveWordPressConfig({ siteUrl: DEFAULT_WP_CONFIG.siteUrl, defaultStatus: "pending" });
    });
  });
});
