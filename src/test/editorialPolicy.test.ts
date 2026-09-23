import { describe, it, expect } from "vitest";
import {
  EDITORIAL_POLICY_SECTIONS,
  EDITORIAL_APPROVAL_PRINCIPLES,
} from "../pages/public/EditorialPolicy";

describe("Amaica Media Editorial Policy & Governance", () => {
  it("contains all 15 official policy clauses approved by Nelson Shitanda", () => {
    expect(EDITORIAL_POLICY_SECTIONS.length).toBe(15);

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
  });

  it("verifies AI and Digital Tools clause mandates human fact-checking responsibility", () => {
    const aiClause = EDITORIAL_POLICY_SECTIONS.find(
      (s) => s.title === "USE OF ARTIFICIAL INTELLIGENCE AND DIGITAL TOOLS"
    );
    expect(aiClause).toBeDefined();
    expect(aiClause?.content).toContain("journalists remain responsible for the accuracy and integrity of the final content");
    expect(aiClause?.content).toContain("AI-generated material shall not be presented as verified human reporting without appropriate checks");
  });

  it("verifies the 10 Editorial Approval Principles gatekeeper questions", () => {
    expect(EDITORIAL_APPROVAL_PRINCIPLES.length).toBe(10);
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
});
