import { describe, it, expect } from "vitest";
import { validateArticle, canApprove } from "../lib/articleValidation";
import { humanizeText, convertToPlainText, analyzeAiContent } from "../lib/aiContentDetector";
import { isWesternKenyaGossip, isGossipContent, detectRegion } from "../lib/localScraper";

describe("Editorial Pipeline & Strict 0% AI Gate", () => {
  const sampleAiArticle = {
    headline: "Najib Balala death rumors refuted",
    lede: "Former Cabinet Secretary Najib Balala has dismissed social media rumors claiming he has died.",
    body: `Reports circulating on social media claiming that former Tourism Cabinet Secretary Najib Balala has died are false. The rumours quickly gained traction online. This prompted many to express their condolences and seek clarification on the politician's status.

Mr. Balala personally addressed the circulating rumours on Tuesday, November 28, via a statement shared on his Facebook page. He categorically refuted the death claims, assuring the public of his good health. The former Mvita MP thanked those who reached out to verify the information. This emphasized that the reports were unfounded.

## Background
Najib Balala served as Kenya's Tourism minister for over a decade. He has maintained an active role in African wildlife conservation since leaving office.

## Key Details
Balala posted on his verified Facebook page on Tuesday morning. He confirmed he is in good health and pursuing his normal schedule.

## Quotes
"I am well and in good spirits. I am aware of the misleading information that has been circulating. But I want to assure everyone that it is unfounded," Mr. Balala said.

"I thank the Almighty for His mercy and protection. Hasbunallahu wa ni'mal wakeel — I appreciate the concern and kind thoughts from friends and colleagues," he said.

## Why it matters
False death hoaxes targeting prominent Kenyan public figures cause widespread distress among families and supporters. Verified news desks must debunk such misinformation swiftly.

## Outlook
Balala continues his conservation advisory work. Friends and former colleagues urged social media users to verify sources before amplifying claims.`,
    template_type: "breaking",
    min_word_count: 100,
    sources: [{ url: "https://facebook.com/najibbalala", title: "Official Facebook Statement", notes: ["Balala is well", "False death rumors refuted"] }],
  };

  it("hard-blocks approval with severity 'error' when AI clichés or >0% AI score is present", () => {
    const issues = validateArticle(sampleAiArticle);
    const aiIssue = issues.find((i) => i.id === "ai-content-heavy" || i.id === "ai-content-elevated");

    expect(aiIssue).toBeDefined();
    expect(aiIssue?.severity).toBe("error"); // Strict 0% gate requires error severity
    expect(canApprove(issues)).toBe(false); // Approval must be blocked!
  });

  it("passes approval after 0% Ultra-Humanize is applied", () => {
    const humanizedBody = humanizeText(sampleAiArticle.body, "ultra").humanizedText;
    const humanizedLede = humanizeText(sampleAiArticle.lede, "ultra").humanizedText;

    const cleanedArticle = {
      ...sampleAiArticle,
      lede: humanizedLede,
      body: humanizedBody,
    };

    const issues = validateArticle(cleanedArticle);
    const aiIssues = issues.filter((i) => i.id === "ai-content-heavy" || i.id === "ai-content-elevated");

    expect(aiIssues.length).toBe(0);
    expect(canApprove(issues)).toBe(true);
  });

  it("converts humanized markdown cleanly to plain text for auto-copy to clipboard", () => {
    const markdown = `## Background\n\nNajib Balala served as minister. **Bold detail** and *italic note*.\n\n> "A quote here"\n\n- Fact 1\n- Fact 2`;
    const plain = convertToPlainText(markdown);

    expect(plain).not.toContain("##");
    expect(plain).not.toContain("**");
    expect(plain).not.toContain(">");
    expect(plain).toContain("Najib Balala served as minister.");
    expect(plain).toContain("Bold detail and italic note.");
  });

  it("correctly identifies and prioritizes Western Kenya gossip leads", () => {
    const westGossipTitle = "Drama in Kakamega as ohangla musician caught in alleged affair";
    expect(isWesternKenyaGossip(westGossipTitle)).toBe(true);
    expect(detectRegion(westGossipTitle)).toBe("western_kenya");
    expect(isGossipContent(westGossipTitle)).toBe(true);

    const nationalStory = "Treasury releases funds for Nairobi expressway expansion";
    expect(isWesternKenyaGossip(nationalStory)).toBe(false);
  });
});
