import { describe, it, expect } from "vitest";
import { FeedIngestionEngine } from "@/lib/ingestion/feedIngestionEngine";
import { RobotsParser } from "@/lib/scraper/robotsParser";

describe("WireOps Desk: Feed Ingestion & Signal Normalizer Engine", () => {
  const sampleRssXml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <channel>
        <title>Western Kenya Regional Wire</title>
        <link>https://westfm.co.ke</link>
        <description>Regional news from Kakamega, Bungoma, and Busia</description>
        <item>
          <title><![CDATA[Kakamega County Commissions New Maize Mill in Lugari]]></title>
          <link>https://westfm.co.ke/news/kakamega-maize-mill-lugari-2026</link>
          <description><![CDATA[Governor Fernandes Barasa has officially commissioned the Lugari processing facility.]]></description>
          <pubDate>Thu, 24 Sep 2026 10:30:00 +0300</pubDate>
          <dc:creator><![CDATA[Wekesa Simiyu]]></dc:creator>
          <enclosure url="https://westfm.co.ke/images/lugari-mill.jpg" type="image/jpeg" />
        </item>
        <item>
          <title><![CDATA[Bungoma Sugar Farmers Demand Immediate Taskforce Review]]></title>
          <link>https://westfm.co.ke/news/bungoma-sugar-farmers-taskforce-review</link>
          <description><![CDATA[According to reports by local unions, cane delivery backlogs have mounted at regional weighbridges.]]></description>
          <pubDate>Thu, 24 Sep 2026 12:15:00 +0300</pubDate>
          <dc:creator><![CDATA[Nafula Nekesa]]></dc:creator>
        </item>
      </channel>
    </rss>
  `;

  const sampleAtomXml = `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>County Press Dispatch</title>
      <entry>
        <title>Vihiga Health Committee Inspects Mbale Hospital Wing</title>
        <link href="https://vihiga.go.ke/press/mbale-hospital-inspection-2026" />
        <summary>The County Executive Committee Member for Health conducted a comprehensive site inspection.</summary>
        <updated>2026-09-24T08:00:00Z</updated>
        <author><name>County Communications</name></author>
      </entry>
    </feed>
  `;

  it("parses RSS 2.0 items including CDATA titles, enclosures, and authors", () => {
    const items = FeedIngestionEngine.parseFeedXml(sampleRssXml);
    expect(items.length).toBe(2);

    expect(items[0].title).toBe("Kakamega County Commissions New Maize Mill in Lugari");
    expect(items[0].link).toBe("https://westfm.co.ke/news/kakamega-maize-mill-lugari-2026");
    expect(items[0].description).toContain("Governor Fernandes Barasa");
    expect(items[0].author).toBe("Wekesa Simiyu");
    expect(items[0].imageUrl).toBe("https://westfm.co.ke/images/lugari-mill.jpg");
  });

  it("parses Atom XML entries with link href and summary fields", () => {
    const items = FeedIngestionEngine.parseFeedXml(sampleAtomXml);
    expect(items.length).toBe(1);

    expect(items[0].title).toBe("Vihiga Health Committee Inspects Mbale Hospital Wing");
    expect(items[0].link).toBe("https://vihiga.go.ke/press/mbale-hospital-inspection-2026");
    expect(items[0].description).toContain("County Executive Committee Member");
  });

  it("detects syndicated copy lineage based on attribution markers in text", () => {
    const items = FeedIngestionEngine.parseFeedXml(sampleRssXml);

    // Item 1: Original report
    const lineage1 = FeedIngestionEngine.determineLineage(items[0], 0.1);
    expect(lineage1).toBe("original_report");

    // Item 2: Contains "According to reports by"
    const lineage2 = FeedIngestionEngine.determineLineage(items[1], 0.1);
    expect(lineage2).toBe("syndicated_copy");
  });

  it("evaluates robots.txt rules and crawl-delays correctly", () => {
    const robotsTxt = `
      User-agent: *
      Disallow: /admin/
      Disallow: /private/
      Disallow: /api/internal/
      Allow: /api/public/
      Crawl-delay: 2

      User-agent: MaliciousBot
      Disallow: /
    `;

    // Allowed path
    const check1 = RobotsParser.isPathAllowed(robotsTxt, "/news/kakamega-story");
    expect(check1.allowed).toBe(true);
    expect(check1.crawlDelaySeconds).toBe(2);

    // Disallowed path
    const check2 = RobotsParser.isPathAllowed(robotsTxt, "/admin/dashboard");
    expect(check2.allowed).toBe(false);

    // Exception allowed path
    const check3 = RobotsParser.isPathAllowed(robotsTxt, "/api/public/feed");
    expect(check3.allowed).toBe(true);
  });
});
