/**
 * Unit Tests for HTML Entity Decoding and Content Artifact Purging Utility
 * WireOps Desk / Amaica Media
 */

import { describe, it, expect } from "vitest";
import {
  decodeHtmlEntities,
  purgePhotoArtifactsAndCaptions,
  purgeSyntheticFeedAttribution,
} from "@/lib/editorial/htmlEntityDecoder";

describe("HTML Entity Decoder & Content Artifact Purging", () => {
  describe("HTML Entity Decoding", () => {
    it("fixes corrupted entity pattern '&rsquo. S' into \"'s\"", () => {
      const corrupted = "Khalwale to shelve UPM, run for Kakamega governor on Sifuna&rsquo. S party";
      const decoded = decodeHtmlEntities(corrupted);
      expect(decoded).toBe("Khalwale to shelve UPM, run for Kakamega governor on Sifuna's party");
    });

    it("decodes standard &rsquo; apostrophes cleanly without mangling", () => {
      const text = "Senator Sifuna&rsquo;s ODM party held talks in Nairobi.";
      const decoded = decodeHtmlEntities(text);
      expect(decoded).toBe("Senator Sifuna's ODM party held talks in Nairobi.");
    });

    it("decodes smart quotes, ampersands, and typographic entities", () => {
      const text = "&ldquo;We will win,&rdquo; Khalwale said &amp; affirmed &lsquo;victory&rsquo; &mdash; with 100&percnt; confidence.";
      const decoded = decodeHtmlEntities(text);
      expect(decoded).toContain('"We will win,"');
      expect(decoded).toContain("Khalwale said & affirmed 'victory' — with");
    });

    it("decodes decimal numeric entities (&#8217;, &#8220;, &#8221;)", () => {
      const text = "He said &#8220;it&#8217;s time&#8221; for new leadership.";
      const decoded = decodeHtmlEntities(text);
      expect(decoded).toBe('He said "it\'s time" for new leadership.');
    });

    it("decodes hexadecimal numeric entities (&#x2019;, &#x201C;, &#x201D;)", () => {
      const text = "He said &#x201C;it&#x2019;s time&#x201D; for change.";
      const decoded = decodeHtmlEntities(text);
      expect(decoded).toBe('He said "it\'s time" for change.');
    });
  });

  describe("Photo Caption and Metadata Purging", () => {
    it("strips dedicated photo caption paragraphs with PHOTO/@ credit", () => {
      const bodyWithPhoto = `Kakamega County Senator Boni Khalwale during a past event. PHOTO/@DrBKhalwale/X

Kakamega Senator Boni Khalwale has hinted at ditching the United Progressive Movement party.`;

      const cleaned = purgePhotoArtifactsAndCaptions(bodyWithPhoto);
      expect(cleaned).not.toContain("PHOTO/@DrBKhalwale/X");
      expect(cleaned).not.toContain("during a past event");
      expect(cleaned).toContain("Kakamega Senator Boni Khalwale has hinted");
    });

    it("strips inline photo credit tags and brackets", () => {
      const bodyWithCredit = "The senator addressed residents in Kakamega. Photo by Dr Boni Khalwale on X.\n\nPolitical talks have commenced.";
      const cleaned = purgePhotoArtifactsAndCaptions(bodyWithCredit);
      expect(cleaned).not.toContain("Photo by Dr Boni Khalwale on X");
      expect(cleaned).toContain("Political talks have commenced.");
    });
    it("strips concatenated photo captions at the top of body sentences", () => {
      const concatenated = "Kakamega County Senator Boni Khalwale during a past event. PHOTO/@DrBKhalwale/X Kakamega Senator Boni Khalwale has hinted at ditching the United Progressive Movement party.";
      const cleaned = purgePhotoArtifactsAndCaptions(concatenated);
      expect(cleaned).not.toContain("PHOTO/@DrBKhalwale/X");
      expect(cleaned).not.toContain("during a past event");
      expect(cleaned).toBe("Kakamega Senator Boni Khalwale has hinted at ditching the United Progressive Movement party.");
    });
  });

  describe("Synthetic Feed Attribution Purging", () => {
    it("cleans 'following reports published by news.google.com earlier this week' from lede", () => {
      const ledeWithFeed = "Khalwale to shelve UPM, run for Kakamega governor on Sifuna's party, following reports published by news.google.com earlier this week.";
      const cleaned = purgeSyntheticFeedAttribution(ledeWithFeed);
      expect(cleaned).toBe("Khalwale to shelve UPM, run for Kakamega governor on Sifuna's party.");
      expect(cleaned).not.toContain("news.google.com");
    });

    it("cleans feed attribution without 'earlier this week' suffix", () => {
      const lede = "Khalwale to shelve UPM, run for Kakamega governor on Sifuna's party, following reports published by news.google.com.";
      const cleaned = purgeSyntheticFeedAttribution(lede);
      expect(cleaned).toBe("Khalwale to shelve UPM, run for Kakamega governor on Sifuna's party.");
      expect(cleaned).not.toContain("news.google.com");
    });

    it("cleans synthetic dispatches confirmed by feed aggregators", () => {
      const text = "The talks intensified following initial dispatches confirmed by news.google.com.";
      const cleaned = purgeSyntheticFeedAttribution(text);
      expect(cleaned).not.toContain("news.google.com");
      expect(cleaned).toContain("dispatches confirmed by regional correspondents.");
    });
  });
});
