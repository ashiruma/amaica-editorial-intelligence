/**
 * WireOps Desk: Polite Newsroom Robots.txt Parser
 * Location: src/lib/scraper/robotsParser.ts
 *
 * Enforces newsroom crawling etiquette and robots.txt compliance.
 */

export interface RobotsPolicy {
  allowed: boolean;
  crawlDelaySeconds?: number;
}

export class RobotsParser {
  /**
   * Evaluates if a given URL path is permitted under a site's robots.txt content.
   */
  public static isPathAllowed(
    robotsTxtContent: string,
    targetPath: string,
    userAgent = "WireOpsBot"
  ): RobotsPolicy {
    if (!robotsTxtContent || robotsTxtContent.trim().length === 0) {
      return { allowed: true };
    }

    const lines = robotsTxtContent.split(/\r?\n/);
    let currentUserAgentApplies = false;
    const disallowRules: string[] = [];
    const allowRules: string[] = [];
    let crawlDelay: number | undefined;

    const targetUA = userAgent.toLowerCase();

    for (let rawLine of lines) {
      // Strip comments
      const commentIdx = rawLine.indexOf("#");
      if (commentIdx !== -1) {
        rawLine = rawLine.substring(0, commentIdx);
      }

      const line = rawLine.trim();
      if (!line) continue;

      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const directive = line.substring(0, colonIdx).trim().toLowerCase();
      const value = line.substring(colonIdx + 1).trim();

      if (directive === "user-agent") {
        const val = value.toLowerCase();
        if (val === "*" || val === targetUA) {
          currentUserAgentApplies = true;
        } else {
          currentUserAgentApplies = false;
        }
      } else if (currentUserAgentApplies) {
        if (directive === "disallow") {
          if (value) disallowRules.push(value);
        } else if (directive === "allow") {
          if (value) allowRules.push(value);
        } else if (directive === "crawl-delay") {
          const parsedDelay = parseFloat(value);
          if (!isNaN(parsedDelay)) {
            crawlDelay = parsedDelay;
          }
        }
      }
    }

    // Check allow rules first (more specific)
    for (const rule of allowRules) {
      if (this.matchesRule(targetPath, rule)) {
        return { allowed: true, crawlDelaySeconds: crawlDelay };
      }
    }

    // Check disallow rules
    for (const rule of disallowRules) {
      if (this.matchesRule(targetPath, rule)) {
        return { allowed: false, crawlDelaySeconds: crawlDelay };
      }
    }

    return { allowed: true, crawlDelaySeconds: crawlDelay };
  }

  /**
   * Path prefix matching according to standard robots.txt spec
   */
  private static matchesRule(path: string, rule: string): boolean {
    if (!rule) return false;
    if (rule === "/") return true;

    // Handle trailing wildcard
    if (rule.endsWith("*")) {
      const prefix = rule.slice(0, -1);
      return path.startsWith(prefix);
    }

    return path.startsWith(rule);
  }
}
