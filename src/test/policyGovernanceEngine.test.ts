import { describe, it, expect } from "vitest";
import {
  auditEditorialPolicy,
  morphStoryWithPolicy,
  OFFICIAL_APPROVAL_PRINCIPLES,
} from "../lib/editorial/policyGovernanceEngine";

describe("Policy Governance Engine (15 Articles & 10 Approval Principles)", () => {
  it("has exactly 10 official editorial approval principles approved by Nelson Shitanda", () => {
    expect(OFFICIAL_APPROVAL_PRINCIPLES).toHaveLength(10);
    expect(OFFICIAL_APPROVAL_PRINCIPLES[0]).toBe("Is it accurate?");
    expect(OFFICIAL_APPROVAL_PRINCIPLES[2]).toBe("Is it fair and balanced?");
    expect(OFFICIAL_APPROVAL_PRINCIPLES[9]).toBe("Would we be able to defend the editorial decision if challenged?");
  });

  it("audits all 15 articles of editorial governance", () => {
    const audit = auditEditorialPolicy({
      headline: "Sauti Sol Announce Kakamega Stadium Concert Date",
      lede: "Veteran Kenyan music group Sauti Sol confirmed a major performance at Bukhungu Stadium in Kakamega on Thursday.",
      body: "Sauti Sol will headline the regional festival in November.\n\nOrganizers confirmed tickets will be available next week.",
    });

    expect(audit.articles).toHaveLength(15);
    expect(audit.principles).toHaveLength(10);
    expect(audit.effectiveDate).toBe("21st September 2027");
    expect(audit.approvedBy).toBe("Nelson Shitanda");
  });

  it("flags Article 10 when sensitive trauma keywords appear without an advisory", () => {
    const audit = auditEditorialPolicy({
      headline: "Mags speaks out on breakup with Alma",
      lede: "Creator Mags has broken her silence on leaving her relationship with Alma.",
      body: "Mags stated during an interview that she walked away after fearing she could end up in a body bag if the domestic conflict continued.",
    });

    expect(audit.advisoryRequired).toBe(true);
    const art10 = audit.articles.find((a) => a.articleNumber === 10);
    expect(art10?.passed).toBe(false);
    expect(art10?.severity).toBe("warning");
  });

  it("flags Article 3 when unhedged allegations appear without right of reply", () => {
    const audit = auditEditorialPolicy({
      headline: "Artist accused of fraud by event promoter",
      lede: "A prominent Nairobi promoter has accused a recording artist of walking away with deposit funds.",
      body: "The promoter claimed the artist defrauded management and walked out on contract agreements.",
    });

    expect(audit.rightOfReplyRequired).toBe(true);
    const art3 = audit.articles.find((a) => a.articleNumber === 3);
    expect(art3?.passed).toBe(false);
  });

  it("flags Article 1 when commercial puffery is detected", () => {
    const audit = auditEditorialPolicy({
      headline: "Top Fashion Trends in Nairobi",
      lede: "Nairobi designers showcased their latest street collections during fashion week on Friday.",
      body: "Check out these new jackets. Buy now using our exclusive promo code to save money.",
    });

    const art1 = audit.articles.find((a) => a.articleNumber === 1);
    expect(art1?.passed).toBe(false);
    expect(art1?.severity).toBe("error");
  });

  it("actively morphs a raw sensitive story to 100% policy compliance", () => {
    const rawStory = {
      headline: "Mags speaks out on relationship fallout with Alma",
      lede: "Social media personality Mags has addressed the reasons behind her departure from creator Alma.",
      body: `Mags shared details regarding her relationship with Alma, stating that she walked out after fearing ending up in a body bag.\n\n"When personal boundaries are crossed repeatedly, leaving is necessary," said Mags.\n\n## Background\n\nThe two had collaborated on digital shows for several months before separating. Buy now with our discount code.\n\n## Quotes\n\n"We needed to part ways," she added.`,
    };

    const morphed = morphStoryWithPolicy(rawStory);

    // 1. Injected Content Advisory for sensitive topic (Article 10)
    expect(morphed.body).toMatch(/Content Advisory/i);

    // 2. Dissolved outline headings (Article 14)
    expect(morphed.body).not.toMatch(/## Background/);
    expect(morphed.body).not.toMatch(/## Quotes/);

    // 3. Injected right of reply clause (Article 3)
    expect(morphed.body).toMatch(/right of reply/i);

    // 4. Stripped commercial puffery (Article 1)
    expect(morphed.body).not.toMatch(/Buy now with our discount code/i);

    // 5. Expanded to inverted-pyramid depth
    expect(morphed.wordCount).toBeGreaterThanOrEqual(650);
    expect(morphed.paragraphCount).toBeGreaterThanOrEqual(6);

    // 6. Audit after morph passes
    expect(morphed.audit.advisoryRequired).toBe(false);
    expect(morphed.audit.rightOfReplyRequired).toBe(false);
  });
});
