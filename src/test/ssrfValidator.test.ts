import { describe, it, expect } from "vitest";
import { SSRFValidator } from "@/lib/scraper/ipValidator";
import { scrapeStoryResilient } from "@/lib/scraperService";

describe("WireOps Desk: SSRF IP & URL Validator", () => {
  it("allows legitimate public news websites", () => {
    const validUrls = [
      "https://nation.africa/kenya/news/politics",
      "https://www.standardmedia.co.ke/western/article/2001",
      "https://kakamega.go.ke/news",
      "https://the-star.co.ke/counties/western",
      "https://citizen.digital/news/crime-update",
    ];

    for (const url of validUrls) {
      const res = SSRFValidator.validateUrl(url);
      expect(res.isValid).toBe(true);
      expect(res.sanitizedUrl).toBe(url);
    }
  });

  it("strictly blocks loopback and localhost addresses", () => {
    const loopbacks = [
      "http://localhost:8080/admin",
      "http://127.0.0.1:3000/internal",
      "http://127.0.0.2/secret",
      "http://[::1]/debug",
      "http://0.0.0.0:8000/api",
    ];

    for (const url of loopbacks) {
      const res = SSRFValidator.validateUrl(url);
      expect(res.isValid).toBe(false);
      expect(res.reason).toMatch(/blocked target host|restricted/i);
    }
  });

  it("strictly blocks RFC 1918 private IPv4 subnets", () => {
    const privateIps = [
      "http://10.0.0.1/status",
      "http://10.254.0.1/admin",
      "http://172.16.0.1/keys",
      "http://172.31.255.254/config",
      "http://192.168.0.1/router",
      "http://192.168.1.100/passwords",
    ];

    for (const url of privateIps) {
      const res = SSRFValidator.validateUrl(url);
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain("Blocked restricted IPv4 address");
    }
  });

  it("strictly blocks cloud metadata endpoints (AWS/GCP/Azure)", () => {
    const metadataUrls = [
      "http://169.254.169.254/latest/meta-data/",
      "http://169.254.169.254/computeMetadata/v1/",
      "http://metadata.google.internal/computeMetadata/v1/",
      "http://instance-data/latest/meta-data/",
    ];

    for (const url of metadataUrls) {
      const res = SSRFValidator.validateUrl(url);
      expect(res.isValid).toBe(false);
      expect(res.reason).toMatch(/metadata|restricted/i);
    }
  });

  it("blocks dangerous non-HTTP/HTTPS protocols", () => {
    const nonHttp = [
      "file:///etc/passwd",
      "file:///C:/Windows/System32/drivers/etc/hosts",
      "ftp://anonymous@internal.corp",
      "gopher://internal.lan:70",
      "dict://127.0.0.1:2628",
      "data:text/html,<script>alert(1)</script>",
    ];

    for (const url of nonHttp) {
      const res = SSRFValidator.validateUrl(url);
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain("Disallowed protocol");
    }
  });

  it("blocks internal host domain suffixes", () => {
    const internalDomains = [
      "http://database.internal/dump",
      "http://vault.local/secrets",
      "http://admin.localhost/portal",
    ];

    for (const url of internalDomains) {
      const res = SSRFValidator.validateUrl(url);
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain("Blocked internal domain suffix");
    }
  });

  it("enforces SSRF defense inside scrapeStoryResilient", async () => {
    await expect(scrapeStoryResilient("http://127.0.0.1:8080/test")).rejects.toThrow(
      /SSRF Blocked/
    );

    await expect(scrapeStoryResilient("http://169.254.169.254/meta-data")).rejects.toThrow(
      /SSRF Blocked/
    );
  });
});
