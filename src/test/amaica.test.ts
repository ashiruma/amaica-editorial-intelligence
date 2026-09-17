import { describe, it, expect } from "vitest";
import {
  detectRegion,
  calculateReadTime,
  formatRelativeTime,
  getShareUrls,
  isGossipContent,
  isWesternKenyaGossip,
  detectCategory,
} from "@/lib/localScraper";
import { validateArticle, MIN_WORDS_BY_TEMPLATE, TARGET_WORDS_BY_TEMPLATE } from "@/lib/articleValidation";
import { verifyAdminPasscode, isExplicitAdmin, ADMIN_MASTER_PASSCODE } from "@/lib/auth";
import {
  isUserApprovedByAdmin,
  addApprovedEmail,
  removeApprovedEmail,
  submitNewsroomAccessRequest,
  getRequestStatusForEmail,
} from "@/lib/accessRequests";

describe("Amaica Media Utilities", () => {
  describe("detectRegion", () => {
    it("identifies Western Kenya keywords", () => {
      expect(detectRegion("Live concert in Kakamega Golf Club")).toBe("western_kenya");
      expect(detectRegion("New Benga song release in Kisumu")).toBe("western_kenya");
      expect(detectRegion("Ohangla night in Bungoma")).toBe("western_kenya");
    });

    it("identifies national Kenyan stories", () => {
      expect(detectRegion("Nairobi concert lineup announced", "national")).toBe("national");
      expect(detectRegion("Mombasa beach festival", "world")).toBe("national");
    });
  });

  describe("calculateReadTime", () => {
    it("calculates reading time based on word count", () => {
      const shortText = "word ".repeat(100);
      expect(calculateReadTime(shortText)).toBe("1 min read");

      const mediumText = "word ".repeat(500);
      expect(calculateReadTime(mediumText)).toBe("3 min read");
    });
  });

  describe("formatRelativeTime", () => {
    it("returns empty string for null", () => {
      expect(formatRelativeTime(null)).toBe("");
    });

    it("returns Just now for recent timestamps", () => {
      const justNow = new Date().toISOString();
      expect(formatRelativeTime(justNow)).toBe("Just now");
    });

    it("returns minutes ago for timestamps within an hour", () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(formatRelativeTime(tenMinsAgo)).toBe("10m ago");
    });
  });

  describe("getShareUrls", () => {
    it("generates formatted WhatsApp, X, and Facebook share URLs", () => {
      const urls = getShareUrls("Sauti Sol Reunited", "https://amaicamedia.com/article/123");
      expect(urls.whatsapp).toContain("whatsapp.com");
      expect(urls.whatsapp).toContain(encodeURIComponent("*Sauti Sol Reunited*"));
      expect(urls.twitter).toContain("twitter.com");
      expect(urls.facebook).toContain("facebook.com");
    });
  });

  describe("Article Validation Bands", () => {
    it("uses mandatory substantive breaking news minimum (700 words) instead of 1600", () => {
      expect(MIN_WORDS_BY_TEMPLATE.breaking).toBe(700);
      expect(TARGET_WORDS_BY_TEMPLATE.breaking.ideal).toBe(850);

      // Verify an article over 700 words does not trigger wordcount error for breaking news
      const sampleBody = `Opening statement about the event.
## Background
${"Background context sentence explaining the history and cultural depth of the Western Kenya music and arts scene. ".repeat(15)}

## Key Details
${"Key details about who, what, when, where, ticket prices and organizers for the event in Kakamega. ".repeat(15)}

## Quotes
"This is an important development for the scene," said Jane Mwangi, festival director. "We are thrilled with ticket sales," confirmed John Doe.

## Why it matters
${"Impact on the Western Kenya creative scene and local economic ecosystem across the lake region counties. ".repeat(15)}

## Outlook
${"Forward looking closing statements about upcoming tours and regional dates scheduled across East Africa. ".repeat(15)}`;

      const issues = validateArticle({
        headline: "Historic festival returns to Kakamega this weekend",
        lede: "Kakamega is set to host the largest cultural festival in Western Kenya this Saturday.",
        body: sampleBody,
        template_type: "breaking",
        sources: [{ url: "https://example.com", title: "Example Source" }],
      });

      const wordCountError = issues.find((i) => i.id === "wordcount");
      expect(wordCountError).toBeUndefined();
    });
  });

  describe("Western Kenya Gossip & Classification", () => {
    it("detects gossip keywords correctly", () => {
      expect(isGossipContent("Celebrity couple sparks breakup rumours after unfollowing each other")).toBe(true);
      expect(isGossipContent("Udaku: Popular artist spotted with secret lover at night club")).toBe(true);
      expect(isGossipContent("Musician involved in bitter drama with baby mama")).toBe(true);
      expect(isGossipContent("Official press release for annual economic forum", "gossip")).toBe(true);
      expect(isGossipContent("New album release and tracklist announcement")).toBe(false);
    });

    it("identifies Western Kenya specific gossip", () => {
      // Western town + gossip
      expect(isWesternKenyaGossip("Drama in Kisumu as benga star clapped back at promoter")).toBe(true);
      expect(isWesternKenyaGossip("Scandal in Kakamega hotel involving top performer")).toBe(true);
      expect(isWesternKenyaGossip("Prince Indah spotted with mysterious date", "western_kenya")).toBe(true);

      // National gossip without Western anchor
      expect(isWesternKenyaGossip("Nairobi socialite in cheating scandal", "national")).toBe(false);
      // Western story that is NOT gossip
      expect(isWesternKenyaGossip("Kakamega high school choir wins national music championship")).toBe(false);
    });

    it("accurately categorizes entertainment stories", () => {
      expect(detectCategory("Drama erupted after artist exposed ex-lover online")).toBe("gossip");
      expect(detectCategory("Ohangla maestro releases new 10-track studio album")).toBe("music");
      expect(detectCategory("Bukhungu stadium concert announces ticket prices and gate entries")).toBe("events");
      expect(detectCategory("Kenyan actor lands lead role in new Netflix thriller series")).toBe("film");
      expect(detectCategory("Lifestyle interview with top radio presenter")).toBe("celebrity");
    });
  });

  describe("Newsroom Artifact Security & Clearance Gate", () => {
    it("strictly verifies administrator master passcode and rejects invalid entries", () => {
      expect(verifyAdminPasscode(ADMIN_MASTER_PASSCODE)).toBe(true);
      expect(verifyAdminPasscode("wrong-passcode")).toBe(false);
      expect(verifyAdminPasscode("")).toBe(false);
    });

    it("identifies ashiruma as explicit administrator", () => {
      expect(isExplicitAdmin("ashiruma@amaicamedia.com")).toBe(true);
      expect(isExplicitAdmin("ashiruma")).toBe(true);
      expect(isExplicitAdmin("admin@amaicamedia.com")).toBe(true);
      expect(isExplicitAdmin("stranger@unknown.com")).toBe(false);
      expect(isExplicitAdmin(null)).toBe(false);
    });

    it("restricts newsroom access to unapproved users and unlocks when approved by admin", async () => {
      const testEmail = "reporter_test@amaicamedia.com";
      removeApprovedEmail(testEmail);

      // Initially unapproved
      expect(isUserApprovedByAdmin(testEmail)).toBe(false);

      // Once approved by admin
      addApprovedEmail(testEmail);
      expect(isUserApprovedByAdmin(testEmail)).toBe(true);

      // Clean up
      removeApprovedEmail(testEmail);
      expect(isUserApprovedByAdmin(testEmail)).toBe(false);
    });

    it("submits and tracks access request with pending status", async () => {
      const email = "applicant_beta@amaicamedia.com";
      const req = await submitNewsroomAccessRequest({
        email,
        displayName: "Beta Contributor",
        requestedRole: "contributor",
        beatReason: "Covering Ohangla festivals and western arts scene",
      });

      expect(req.status).toBe("pending");
      expect(req.email).toBe(email);

      const statusInfo = getRequestStatusForEmail(email);
      expect(statusInfo.status).toBe("pending");
      expect(statusInfo.request?.displayName).toBe("Beta Contributor");
    });
  });
});

