import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PublisherService,
  type PublishArticleRequest,
} from "@/lib/publishing/publisherService";
import {
  computeContentHash,
  verifyArticleIntegrity,
  buildArticleContentForHash,
} from "@/lib/publishing/publicationAuditLogger";
import { generateGhostToken } from "@/lib/publishing/connectors/ghostConnector";
import { computeHmacSignature } from "@/lib/publishing/connectors/webhookPublisher";

describe("PublisherService and Multi-Channel Connectors", () => {
  const validArticle = {
    id: "art-test-100",
    headline: "Vihiga County Launches Rural Solar Water Pumping Project",
    lede: "Vihiga County has launched a rural solar water pumping project designed to supply clean water to over 15,000 households.",
    body: `Vihiga County has launched a rural solar water pumping project designed to supply clean water to over 15,000 households across Hamisi and Luanda sub-counties.

The solar installation aims to reduce operational diesel expenses for community water schemes and expand daily supply hours. Speaking at the commissioning ceremony, county water officials noted that the initiative will drastically decrease utility downtime for local dispensaries and primary schools.

"We are deploying reliable green energy infrastructure to ensure sustainable water access for every resident," said County Executive Member for Water and Environment.

Community elders expressed appreciation for the system, noting that local women previously traveled long distances to fetch clean water. Technical teams confirmed that smart metering sensors have been integrated into all pumping stations.

"This intervention represents a long overdue transformation for our rural community water access," said local community chairman Peter Aluda.

County engineers confirmed that routine system telemetry will monitor solar battery health and flow rates in real time.`,
    byline: "WireOps Desk",
    category: "Community",
    region: "western_kenya",
    template_type: "standard_news",
    min_word_count: 100,
    sources: [
      { id: "s1", name: "County Water Department", url: "https://vihiga.go.ke" },
    ],
  };

  const validEditor = {
    id: "editor-456",
    displayName: "Senior Desk Editor",
    roles: ["editor"],
  };

  describe("Publication Pre-Flight Protection", () => {
    it("throws PreFlightGateError if an unverified article attempts publication without override", async () => {
      const request: PublishArticleRequest = {
        article: validArticle,
        channel: "internal",
        user: validEditor,
        verificationStatus: "unverified",
      };

      await expect(PublisherService.publish(request)).rejects.toThrow("Pre-Flight Publishing Gatekeeper failed");
    });

    it("throws PreFlightGateError if zero-emoji standard is violated", async () => {
      const emojiArticle = {
        ...validArticle,
        headline: "Vihiga County Launches Rural Solar Water Pumping Project ☀️",
      };

      const request: PublishArticleRequest = {
        article: emojiArticle,
        channel: "internal",
        user: validEditor,
        verificationStatus: "verified",
      };

      await expect(PublisherService.publish(request)).rejects.toThrow("Pre-Flight Publishing Gatekeeper failed");
    });
  });

  describe("Internal Publishing & Cryptographic Audit Trail", () => {
    it("successfully publishes to internal channel and creates SHA-256 audit log", async () => {
      const request: PublishArticleRequest = {
        article: validArticle,
        channel: "internal",
        user: validEditor,
        verificationStatus: "verified",
        plagiarismScore: 1.5,
        aiConsensusScore: 8.0,
      };

      const result = await PublisherService.publish(request);
      expect(result.success).toBe(true);
      expect(result.channel).toBe("internal");
      expect(result.postUrl).toContain(validArticle.id);
      expect(result.auditRecord).toBeDefined();
      expect(result.auditRecord.articleId).toBe(validArticle.id);
      expect(result.auditRecord.articleContentHash).toHaveLength(64); // SHA-256 hex string
      expect(result.preflightSnapshot.passed).toBe(true);
    });
  });

  describe("Cryptographic Hash & Integrity Verifier", () => {
    it("computes deterministic SHA-256 hash and verifies integrity matches exactly", async () => {
      const content = buildArticleContentForHash(validArticle);
      const hash1 = await computeContentHash(content);
      const hash2 = await computeContentHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);

      const isMatch = await verifyArticleIntegrity(validArticle, hash1);
      expect(isMatch).toBe(true);

      const modifiedArticle = { ...validArticle, headline: "Tampered Headline Content" };
      const isTamperedMatch = await verifyArticleIntegrity(modifiedArticle, hash1);
      expect(isTamperedMatch).toBe(false);
    });
  });

  describe("Ghost Admin API Token Generator", () => {
    it("generates a valid 3-part HS256 JWT for Ghost Admin API", async () => {
      const fakeAdminKey = "64f1234567890abcdef12345:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const token = await generateGhostToken(fakeAdminKey);

      expect(typeof token).toBe("string");
      const parts = token.split(".");
      expect(parts).toHaveLength(3); // header.payload.signature

      // Verify header format
      const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
      expect(header.alg).toBe("HS256");
      expect(header.typ).toBe("JWT");
      expect(header.kid).toBe("64f1234567890abcdef12345");
    });
  });

  describe("Webhook Signature Generator", () => {
    it("computes HMAC-SHA256 signature for webhook payload verification", async () => {
      const secret = "wireops-secret-key-1234";
      const payload = JSON.stringify({ event: "published", id: "art-100" });
      const signature = await computeHmacSignature(secret, payload);

      expect(typeof signature).toBe("string");
      expect(signature).toHaveLength(64); // 32 bytes hex encoded = 64 characters
    });
  });
});
