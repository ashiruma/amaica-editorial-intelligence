import { describe, it, expect } from "vitest";
import {
  normalizeUrl,
  isPortalHomepage,
  extractBestImage,
  cleanMarkdownContent,
  getHostname,
} from "../lib/scraperService";

describe("scraperService", () => {
  describe("normalizeUrl", () => {
    it("adds https protocol when missing", () => {
      expect(normalizeUrl("tuko.co.ke")).toBe("https://tuko.co.ke");
      expect(normalizeUrl("www.mpasho.co.ke/entertainment")).toBe("https://www.mpasho.co.ke/entertainment");
    });

    it("preserves existing protocol", () => {
      expect(normalizeUrl("https://standardmedia.co.ke/entertainment")).toBe("https://standardmedia.co.ke/entertainment");
      expect(normalizeUrl("http://localhost:8080/test")).toBe("http://localhost:8080/test");
    });

    it("handles whitespace", () => {
      expect(normalizeUrl("  https://tuko.co.ke/  ")).toBe("https://tuko.co.ke/");
    });
  });

  describe("isPortalHomepage", () => {
    it("correctly identifies root domains and homepages", () => {
      expect(isPortalHomepage("https://www.tuko.co.ke/")).toBe(true);
      expect(isPortalHomepage("https://www.tuko.co.ke")).toBe(true);
      expect(isPortalHomepage("tuko.co.ke")).toBe(true);
      expect(isPortalHomepage("https://mpasho.co.ke/")).toBe(true);
      expect(isPortalHomepage("https://www.standardmedia.co.ke/")).toBe(true);
      expect(isPortalHomepage("https://www.citizen.digital")).toBe(true);
    });

    it("identifies high-level category hubs as homepages", () => {
      expect(isPortalHomepage("https://www.tuko.co.ke/entertainment/")).toBe(true);
      expect(isPortalHomepage("https://mpasho.co.ke/gossip")).toBe(true);
      expect(isPortalHomepage("https://www.tuko.co.ke/celebrities")).toBe(true);
    });

    it("correctly identifies specific story articles", () => {
      expect(
        isPortalHomepage(
          "https://www.tuko.co.ke/entertainment/celebrities/638773-andrew-kibe-refuses-work-oga-obinna-salasya-fight-explains/"
        )
      ).toBe(false);
      expect(
        isPortalHomepage(
          "https://mpasho.co.ke/entertainment/2026-09-04-tcl-sues-samsung-over-false-mini-led-tv-advertising"
        )
      ).toBe(false);
      expect(
        isPortalHomepage(
          "https://www.standardmedia.co.ke/entertainment/showbiz/article/2001487291/steve-kay-lights-up-bukhungu-stadium"
        )
      ).toBe(false);
    });
  });

  describe("extractBestImage", () => {
    it("filters out icons, logos, and trophies", () => {
      const markdown = `
[![Image 1: Tuko Logo](https://cdn.tuko.co.ke/static/logo.png)](https://www.tuko.co.ke/)
[![Image 2: Trophy badge](https://cdn.tuko.co.ke/static/trophey.png)](https://www.tuko.co.ke/)
![Image 3: Andrew Kibe speaking at press conference](https://cdn.tuko.co.ke/images/1120/de00adeaa14863ec.jpeg?v=1)
      `;
      const best = extractBestImage(markdown, "https://cdn.tuko.co.ke/static/logo.png");
      expect(best).toBe("https://cdn.tuko.co.ke/images/1120/de00adeaa14863ec.jpeg?v=1");
    });

    it("falls back to valid meta image when markdown images are badges", () => {
      const markdown = `
[![Image 1: Site Favicon](https://site.com/favicon.png)](https://site.com)
      `;
      const best = extractBestImage(markdown, "https://site.com/uploads/2026/09/hero.webp");
      expect(best).toBe("https://site.com/uploads/2026/09/hero.webp");
    });
  });

  describe("cleanMarkdownContent", () => {
    it("strips cookie policies, navigation headers, and boilerplate", () => {
      const raw = `
[Home](https://tuko.co.ke/) > [Entertainment](https://tuko.co.ke/entertainment)

---

### Breaking News

Andrew Kibe has stated he will take on Peter Salasya in an anticipated celebrity exhibition match in Kakamega.

The event is set to attract thousands of music and sports enthusiasts across Western Kenya.

---
Cookie policy: By browsing this site you accept cookies. All rights reserved 2026.
Subscribe to our newsletter for daily updates.
      `;
      const cleaned = cleanMarkdownContent(raw);
      expect(cleaned).toContain("Andrew Kibe has stated he will take on Peter Salasya");
      expect(cleaned).toContain("The event is set to attract thousands of music and sports enthusiasts");
      expect(cleaned).not.toContain("Cookie policy");
      expect(cleaned).not.toContain("Subscribe to our newsletter");
      expect(cleaned).not.toContain("---");
    });
  });

  describe("getHostname", () => {
    it("cleans www and extracts hostname", () => {
      expect(getHostname("https://www.tuko.co.ke/news/123")).toBe("tuko.co.ke");
      expect(getHostname("https://mpasho.co.ke/")).toBe("mpasho.co.ke");
    });
  });
});
