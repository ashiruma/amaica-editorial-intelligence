/**
 * WireOps Desk / Amaica Media
 * Telegram Alert Notification Service
 *
 * NON-NEGOTIABLE ZERO-EMOJI WORKPLACE STANDARD:
 * All notification messages, headers, metadata tags, and body copy
 * MUST be 100% free of emojis. Professional journalism only.
 */

import { getEnvVar } from "@/lib/providers/llmProvider";
import { stripEmojis } from "@/lib/articleValidation";
import { AlertThrottler } from "./alertThrottler";

export type TelegramChannelTarget =
  | "wireops-breaking"
  | "wireops-western-desk"
  | "wireops-legal-alerts";

export interface StoryAlertPayload {
  storyId: string;
  headline: string;
  category: string;
  location?: string;
  confidenceScore: number;
  confidenceTier: "UNCONFIRMED" | "LOW" | "MODERATE" | "HIGH" | "VERIFIED";
  sourceCount: number;
  independentSourceCount: number;
  deskUrl?: string;
  summary?: string;
  forceAlert?: boolean;
}

export interface TelegramDispatchResult {
  sent: boolean;
  status: "SUCCESS" | "NOT_CONFIGURED" | "THROTTLED" | "NETWORK_ERROR";
  messageId?: number;
  channelTarget: TelegramChannelTarget;
  error?: string;
}

export class TelegramNotificationService {
  /**
   * Formats a breaking wire alert in accordance with the Zero-Emoji standard.
   */
  public static formatBreakingAlert(payload: StoryAlertPayload): string {
    const lines = [
      `[WIREOPS BREAKING ALERT]`,
      `STORY: ${payload.headline}`,
      `LOCATION: ${payload.location || "National / Regional"}`,
      `CATEGORY: ${payload.category.toUpperCase()}`,
      `CONFIDENCE: ${payload.confidenceTier} (${payload.confidenceScore}%)`,
      `SOURCES: ${payload.sourceCount} total (${payload.independentSourceCount} independent)`,
    ];

    if (payload.summary) {
      lines.push(`SYNOPSIS: ${payload.summary}`);
    }

    if (payload.deskUrl) {
      lines.push(`DESK LINK: ${payload.deskUrl}`);
    } else {
      lines.push(`DESK LINK: https://wireops-desk.vercel.app/newsroom`);
    }

    const message = lines.join("\n");
    return stripEmojis(message);
  }

  /**
   * Formats a specialized Western Kenya regional desk alert.
   */
  public static formatWesternDeskAlert(payload: StoryAlertPayload): string {
    const lines = [
      `[WIREOPS WESTERN DESK INTELLIGENCE]`,
      `FOCUS REGION: ${payload.location || "Kakamega / Western Kenya"}`,
      `STORY: ${payload.headline}`,
      `CATEGORY: ${payload.category.toUpperCase()}`,
      `CORROBORATION: ${payload.confidenceTier} (${payload.confidenceScore}%)`,
      `CONFIRMED OUTLETS: ${payload.sourceCount}`,
      `ACCESS DISPATCH: ${payload.deskUrl || "https://wireops-desk.vercel.app/newsroom"}`,
    ];

    const message = lines.join("\n");
    return stripEmojis(message);
  }

  /**
   * Formats an urgent legal or editorial hold notification.
   */
  public static formatEditorialHoldAlert(storyId: string, headline: string, reason: string): string {
    const lines = [
      `[WIREOPS EDITORIAL HOLD]`,
      `STORY ID: ${storyId}`,
      `HEADLINE: ${headline}`,
      `STATUS: PUBLICATION BLOCKED`,
      `REASON: ${reason}`,
      `ACTION: Senior editorial clearance required before release.`,
    ];

    const message = lines.join("\n");
    return stripEmojis(message);
  }

  /**
   * Dispatches an alert to Telegram, applying rate limiting and zero-emoji guarantees.
   */
  public static async dispatchStoryAlert(
    payload: StoryAlertPayload,
    channelTarget: TelegramChannelTarget = "wireops-breaking"
  ): Promise<TelegramDispatchResult> {
    // 1. Check rate limits & deduplication
    const throttleDecision = AlertThrottler.evaluate({
      clusterId: payload.storyId,
      category: payload.category,
      confidenceTier: payload.confidenceTier,
      forceAlert: payload.forceAlert,
    });

    if (!throttleDecision.allowed) {
      return {
        sent: false,
        status: "THROTTLED",
        channelTarget,
        error: throttleDecision.reason,
      };
    }

    // 2. Resolve credentials
    const botToken = getEnvVar("TELEGRAM_BOT_TOKEN");
    const chatId = getEnvVar("TELEGRAM_CHAT_ID");

    if (!botToken || !chatId) {
      return {
        sent: false,
        status: "NOT_CONFIGURED",
        channelTarget,
        error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in newsroom environment.",
      };
    }

    // 3. Format message according to channel target
    let formattedText: string;
    if (channelTarget === "wireops-western-desk") {
      formattedText = this.formatWesternDeskAlert(payload);
    } else {
      formattedText = this.formatBreakingAlert(payload);
    }

    // 4. Dispatch via Telegram Bot API
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedText,
          disable_web_page_preview: false,
        }),
      });

      if (!res.ok) {
        return {
          sent: false,
          status: "NETWORK_ERROR",
          channelTarget,
          error: `Telegram API responded with HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      return {
        sent: true,
        status: "SUCCESS",
        channelTarget,
        messageId: data.result?.message_id,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        sent: false,
        status: "NETWORK_ERROR",
        channelTarget,
        error: errorMsg,
      };
    }
  }
}
