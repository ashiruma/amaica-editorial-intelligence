/**
 * Unit Tests for Alert Throttler & Deduplicator
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AlertThrottler } from "@/lib/telegram/alertThrottler";

describe("Alert Throttler & Deduplicator", () => {
  beforeEach(() => {
    AlertThrottler.reset();
  });

  it("permits the first alert for a new cluster", () => {
    const decision = AlertThrottler.evaluate({
      clusterId: "WOP-101",
      category: "Politics",
      confidenceTier: "MODERATE",
    });

    expect(decision.allowed).toBe(true);
  });

  it("suppresses duplicate alert for the same cluster within 4 hours if tier is unchanged", () => {
    AlertThrottler.evaluate({
      clusterId: "WOP-101",
      category: "Politics",
      confidenceTier: "MODERATE",
    });

    const second = AlertThrottler.evaluate({
      clusterId: "WOP-101",
      category: "Politics",
      confidenceTier: "MODERATE",
    });

    expect(second.allowed).toBe(false);
    expect(second.reason).toContain("Duplicate alert suppressed");
  });

  it("allows duplicate alert if confidence tier escalated (e.g. MODERATE -> VERIFIED)", () => {
    AlertThrottler.evaluate({
      clusterId: "WOP-101",
      category: "Politics",
      confidenceTier: "MODERATE",
    });

    const escalated = AlertThrottler.evaluate({
      clusterId: "WOP-101",
      category: "Politics",
      confidenceTier: "VERIFIED",
    });

    expect(escalated.allowed).toBe(true);
  });

  it("throttles category alerts when exceeding 2 alerts per minute", () => {
    // Dispatch 2 alerts in Politics category
    const d1 = AlertThrottler.evaluate({
      clusterId: "WOP-201",
      category: "Politics",
      confidenceTier: "HIGH",
    });
    const d2 = AlertThrottler.evaluate({
      clusterId: "WOP-202",
      category: "Politics",
      confidenceTier: "HIGH",
    });

    expect(d1.allowed).toBe(true);
    expect(d2.allowed).toBe(true);

    // Third alert in same category within the minute must be throttled
    const d3 = AlertThrottler.evaluate({
      clusterId: "WOP-203",
      category: "Politics",
      confidenceTier: "HIGH",
    });

    expect(d3.allowed).toBe(false);
    expect(d3.reason).toContain("Rate limit exceeded for category 'Politics'");
  });

  it("forceAlert flag bypasses throttling and deduplication", () => {
    AlertThrottler.evaluate({
      clusterId: "WOP-301",
      category: "Community",
      confidenceTier: "HIGH",
    });

    const forced = AlertThrottler.evaluate({
      clusterId: "WOP-301",
      category: "Community",
      confidenceTier: "HIGH",
      forceAlert: true,
    });

    expect(forced.allowed).toBe(true);
  });
});
