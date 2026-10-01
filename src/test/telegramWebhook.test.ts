/**
 * Unit Tests for Telegram Webhook Handler
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TelegramWebhookHandler,
  type TelegramWebhookUpdate,
} from "@/lib/telegram/telegramWebhookHandler";
import { hasEmojis } from "@/lib/articleValidation";

describe("Telegram Command Webhook Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("REJECTS unauthorized Telegram user IDs with 403 Forbidden", async () => {
    const unauthorizedUpdate: TelegramWebhookUpdate = {
      update_id: 1001,
      message: {
        message_id: 50,
        from: { id: 999999999, first_name: "Intruder" },
        chat: { id: 123456 },
        text: "/status WOP-001",
      },
    };

    const res = await TelegramWebhookHandler.handleUpdate(unauthorizedUpdate);

    expect(res.statusCode).toBe(403);
    expect(res.authorized).toBe(false);
    expect(res.replyText).toContain("Access Denied");
    expect(hasEmojis(res.replyText)).toBe(false);
  });

  it("processes /status command for authorized editors with zero emojis", async () => {
    // Mock isAuthorized to return true for this test
    vi.spyOn(TelegramWebhookHandler, "isAuthorized").mockReturnValue(true);

    const update: TelegramWebhookUpdate = {
      update_id: 1002,
      message: {
        message_id: 51,
        from: { id: 12345, first_name: "Editor" },
        chat: { id: 123456 },
        text: "/status WOP-004921",
      },
    };

    const res = await TelegramWebhookHandler.handleUpdate(update);

    expect(res.statusCode).toBe(200);
    expect(res.authorized).toBe(true);
    expect(res.commandExecuted).toBe("/status");
    expect(res.replyText).toContain("[WIROPS STATUS REPORT]");
    expect(res.replyText).toContain("STORY ID: WOP-004921");
    expect(hasEmojis(res.replyText)).toBe(false);
  });

  it("processes /verify command for authorized editors", async () => {
    vi.spyOn(TelegramWebhookHandler, "isAuthorized").mockReturnValue(true);

    const update: TelegramWebhookUpdate = {
      update_id: 1003,
      message: {
        message_id: 52,
        from: { id: 12345, first_name: "Editor" },
        chat: { id: 123456 },
        text: "/verify WOP-004921",
      },
    };

    const res = await TelegramWebhookHandler.handleUpdate(update);

    expect(res.statusCode).toBe(200);
    expect(res.commandExecuted).toBe("/verify");
    expect(res.replyText).toContain("Priority corroboration scan queued.");
    expect(hasEmojis(res.replyText)).toBe(false);
  });

  it("processes /hold command and includes reason", async () => {
    vi.spyOn(TelegramWebhookHandler, "isAuthorized").mockReturnValue(true);

    const update: TelegramWebhookUpdate = {
      update_id: 1004,
      message: {
        message_id: 53,
        from: { id: 12345, first_name: "Editor" },
        chat: { id: 123456 },
        text: "/hold WOP-004921 Defamation risk under Section 3",
      },
    };

    const res = await TelegramWebhookHandler.handleUpdate(update);

    expect(res.statusCode).toBe(200);
    expect(res.commandExecuted).toBe("/hold");
    expect(res.replyText).toContain("[WIROPS EDITORIAL HOLD APPLIED]");
    expect(res.replyText).toContain("Defamation risk under Section 3");
    expect(res.replyText).toContain("PUBLICATION: BLOCKED");
    expect(hasEmojis(res.replyText)).toBe(false);
  });

  it("displays /help with zero emojis", async () => {
    vi.spyOn(TelegramWebhookHandler, "isAuthorized").mockReturnValue(true);

    const update: TelegramWebhookUpdate = {
      update_id: 1005,
      message: {
        message_id: 54,
        from: { id: 12345, first_name: "Editor" },
        chat: { id: 123456 },
        text: "/help",
      },
    };

    const res = await TelegramWebhookHandler.handleUpdate(update);

    expect(res.statusCode).toBe(200);
    expect(res.replyText).toContain("[WIROPS DESK TELEGRAM TRIAGE COMMANDS]");
    expect(hasEmojis(res.replyText)).toBe(false);
  });
});
