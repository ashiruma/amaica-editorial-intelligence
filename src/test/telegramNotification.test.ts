/**
 * Unit Tests for Telegram Alert Notification Service
 */

import { describe, it, expect } from "vitest";
import {
  TelegramNotificationService,
  type StoryAlertPayload,
} from "@/lib/telegram/telegramNotificationService";
import { hasEmojis } from "@/lib/articleValidation";

describe("Telegram Alert Notification Service", () => {
  const samplePayload: StoryAlertPayload = {
    storyId: "WOP-004921",
    headline: "Kakamega County Inaugurates New Agricultural Processing Hub",
    category: "Community",
    location: "Kakamega",
    confidenceScore: 88,
    confidenceTier: "VERIFIED",
    sourceCount: 5,
    independentSourceCount: 3,
    deskUrl: "https://wireops-desk.vercel.app/newsroom/clusters/WOP-004921",
    summary: "Governor Barasa opened the multi-million-shilling dairy facility in Malava constituency.",
  };

  it("ZERO-EMOJI MANDATE: breaking alert format contains zero emojis", () => {
    const text = TelegramNotificationService.formatBreakingAlert(samplePayload);

    expect(text).toContain("[WIREOPS BREAKING ALERT]");
    expect(text).toContain("STORY: Kakamega County Inaugurates New Agricultural Processing Hub");
    expect(text).toContain("CONFIDENCE: VERIFIED (88%)");
    expect(text).toContain("SOURCES: 5 total (3 independent)");
    expect(hasEmojis(text)).toBe(false);
  });

  it("ZERO-EMOJI MANDATE: Western Kenya regional desk alert format contains zero emojis", () => {
    const text = TelegramNotificationService.formatWesternDeskAlert(samplePayload);

    expect(text).toContain("[WIREOPS WESTERN DESK INTELLIGENCE]");
    expect(text).toContain("FOCUS REGION: Kakamega");
    expect(text).toContain("CORROBORATION: VERIFIED (88%)");
    expect(hasEmojis(text)).toBe(false);
  });

  it("ZERO-EMOJI MANDATE: editorial hold alert format contains zero emojis", () => {
    const text = TelegramNotificationService.formatEditorialHoldAlert(
      "WOP-004921",
      "Defamation claim disputed",
      "Pending right-of-reply verification from legal counsel."
    );

    expect(text).toContain("[WIREOPS EDITORIAL HOLD]");
    expect(text).toContain("STATUS: PUBLICATION BLOCKED");
    expect(text).toContain("REASON: Pending right-of-reply verification from legal counsel.");
    expect(hasEmojis(text)).toBe(false);
  });

  it("returns NOT_CONFIGURED when bot token or chat ID is missing", async () => {
    const result = await TelegramNotificationService.dispatchStoryAlert(samplePayload);

    expect(result.sent).toBe(false);
    expect(result.status).toBe("NOT_CONFIGURED");
    expect(result.error).toContain("is not configured");
  });
});
