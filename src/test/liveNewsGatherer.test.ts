import { describe, it, expect } from "vitest";
import { LiveNewsGatherer } from "../lib/ingestion/liveNewsGatherer";
import { CURATED_TRENDING_LEADS } from "../lib/editorial/wireRepurposingEngine";

describe("Live News Gatherer Engine", () => {
  it("provides synchronous access to cached discovered stories", () => {
    const cached = LiveNewsGatherer.getCachedStories();
    expect(Array.isArray(cached)).toBe(true);
  });

  it("gathers live stories with complete metadata and valid regions", async () => {
    const stories = await LiveNewsGatherer.gatherStories();
    expect(stories.length).toBeGreaterThanOrEqual(5);

    for (const story of stories) {
      expect(story.id).toBeDefined();
      expect(story.title.length).toBeGreaterThan(10);
      expect(story.source_url).toMatch(/^https?:\/\//);
      expect(typeof story.trendingScore).toBe("number");
      expect(story.trendingScore).toBeGreaterThanOrEqual(10);
      expect(["kakamega", "western_kenya", "national", "world"]).toContain(story.region);
    }
  }, 15000);

  it("prioritizes Western Kenya and Kakamega geographic beats when filtered", async () => {
    const westernStories = await LiveNewsGatherer.gatherStories({ beat: "western_kenya" });
    expect(westernStories.length).toBeGreaterThan(0);

    for (const s of westernStories) {
      expect(["kakamega", "western_kenya"]).toContain(s.region);
    }
  }, 15000);

  it("enforces zero emojis in all curated trending wire leads", () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]|\p{Extended_Pictographic}/u;
    for (const lead of CURATED_TRENDING_LEADS) {
      expect(emojiRegex.test(lead.title)).toBe(false);
      expect(emojiRegex.test(lead.excerpt)).toBe(false);
    }
  });
});
