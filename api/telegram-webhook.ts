/**
 * Vercel Serverless Function: Telegram Webhook Endpoint
 * Location: api/telegram-webhook.ts
 *
 * Receives incoming POST updates from the Telegram Bot API
 * and forwards them to the TelegramWebhookHandler.
 */

import { TelegramWebhookHandler, type TelegramWebhookUpdate } from "../src/lib/telegram/telegramWebhookHandler";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const update: TelegramWebhookUpdate = req.body;
    const result = await TelegramWebhookHandler.handleUpdate(update);

    // If an authorized reply was generated, return it
    return res.status(result.statusCode).json({
      status: result.statusCode === 200 ? "OK" : "DENIED",
      reply: result.replyText,
      commandExecuted: result.commandExecuted,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Telegram Webhook Error:", error);
    return res.status(500).json({ error: errMessage });
  }
}
