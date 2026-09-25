import { describe, it, expect } from "vitest";
import { LLMProviderFactory } from "@/lib/providers/llmProvider";

describe("WireOps Desk: LLM Provider Abstraction Layer", () => {
  it("discovers provider list without throwing errors", () => {
    const configured = LLMProviderFactory.getConfiguredProviders();
    expect(Array.isArray(configured)).toBe(true);
  });

  it("executes deterministic offline fallback when no external keys are configured", async () => {
    const res = await LLMProviderFactory.complete([
      { role: "system", content: "You are a professional Kenyan newsroom editor." },
      { role: "user", content: "George Ruto Matatu Regulatory Compliance Update" },
    ]);

    expect(res).toBeDefined();
    expect(res.content).toBeTruthy();
    expect(res.content.length).toBeGreaterThan(50);
    // Verified Kenyan dateline
    expect(res.content).toContain("NAIROBI, Kenya");
    // Model identifier
    expect(res.model).toBe("offline-deterministic-newsroom-v1");
  });

  it("strictly enforces the Zero-Emoji Workplace Standard on all LLM outputs", async () => {
    const promptWithEmojis = [
      { role: "user", content: "Breaking update 🚨🔥 on Kakamega County 🇰🇪 agricultural policy 🌾" },
    ];

    const res = await LLMProviderFactory.complete(promptWithEmojis);

    // Regex checking for common unicode emoji ranges
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(res.content)).toBe(false);
  });

  it("measures response duration correctly", async () => {
    const res = await LLMProviderFactory.complete([
      { role: "user", content: "Test brief query" },
    ]);

    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });
});
