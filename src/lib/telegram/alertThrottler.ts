/**
 * WireOps Desk / Amaica Media
 * Telegram Alert Rate Limiter & Deduplicator
 *
 * Prevents alert storms (max 2 alerts per minute per category)
 * and suppresses duplicate notifications for the same cluster within 4 hours
 * unless the confidence tier has escalated or breaking override is enabled.
 */

export interface ThrottleCheckOptions {
  clusterId: string;
  category: string;
  confidenceTier: string;
  forceAlert?: boolean;
}

export interface ThrottleDecision {
  allowed: boolean;
  reason?: string;
  cooldownRemainingMs?: number;
}

export class AlertThrottler {
  // Category rate limiting: timestamps of dispatched alerts per category
  private static categoryTimestamps: Map<string, number[]> = new Map();

  // Cluster deduplication: clusterId -> { timestamp: number, confidenceTier: string }
  private static clusterAlertHistory: Map<string, { timestamp: number; confidenceTier: string }> = new Map();

  // Settings
  private static readonly MAX_ALERTS_PER_MINUTE = 2;
  private static readonly RATE_WINDOW_MS = 60 * 1000; // 1 minute
  private static readonly DEDUPE_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

  /**
   * Evaluates whether a new alert is permitted to dispatch.
   */
  public static evaluate(options: ThrottleCheckOptions): ThrottleDecision {
    const now = Date.now();
    const { clusterId, category, confidenceTier, forceAlert = false } = options;

    if (forceAlert) {
      this.recordDispatch(clusterId, category, confidenceTier, now);
      return { allowed: true };
    }

    // 1. Deduplication Check
    const prevAlert = this.clusterAlertHistory.get(clusterId);
    if (prevAlert) {
      const timeSince = now - prevAlert.timestamp;
      const isWithinDedupeWindow = timeSince < this.DEDUPE_WINDOW_MS;
      const tierUnchanged = prevAlert.confidenceTier === confidenceTier;

      if (isWithinDedupeWindow && tierUnchanged) {
        return {
          allowed: false,
          reason: `Duplicate alert suppressed: Cluster was alerted ${Math.round(timeSince / 60000)} minutes ago with same tier (${confidenceTier}).`,
          cooldownRemainingMs: this.DEDUPE_WINDOW_MS - timeSince,
        };
      }
    }

    // 2. Category Rate Limiting Check
    const catTimestamps = this.categoryTimestamps.get(category) || [];
    // Keep only timestamps within the rolling window
    const recent = catTimestamps.filter((t) => now - t < this.RATE_WINDOW_MS);
    this.categoryTimestamps.set(category, recent);

    if (recent.length >= this.MAX_ALERTS_PER_MINUTE) {
      const oldest = recent[0];
      const waitTime = this.RATE_WINDOW_MS - (now - oldest);
      return {
        allowed: false,
        reason: `Rate limit exceeded for category '${category}': Maximum ${this.MAX_ALERTS_PER_MINUTE} alerts per minute reached.`,
        cooldownRemainingMs: waitTime,
      };
    }

    // Allowed: record dispatch
    this.recordDispatch(clusterId, category, confidenceTier, now);
    return { allowed: true };
  }

  private static recordDispatch(
    clusterId: string,
    category: string,
    confidenceTier: string,
    timestamp: number
  ): void {
    // Record for deduplication
    this.clusterAlertHistory.set(clusterId, { timestamp, confidenceTier });

    // Record for rate limiting
    const list = this.categoryTimestamps.get(category) || [];
    list.push(timestamp);
    this.categoryTimestamps.set(category, list);
  }

  /**
   * Resets throttler state (primarily used in testing).
   */
  public static reset(): void {
    this.categoryTimestamps.clear();
    this.clusterAlertHistory.clear();
  }
}
