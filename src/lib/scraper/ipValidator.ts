/**
 * WireOps Desk: SSRF IP & URL Validator
 * Location: src/lib/scraper/ipValidator.ts
 *
 * Protects newsroom ingestion pipelines against Server-Side Request Forgery (SSRF).
 * Blocks:
 * - RFC 1918 Private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Loopback addresses (127.0.0.0/8, ::1, localhost)
 * - Cloud metadata services (169.254.169.254, 169.254.0.0/16)
 * - Link-local & Multicast ranges
 * - Non-HTTP/HTTPS protocols (file:, ftp:, gopher:, dict:, data:)
 * - Malformed IP encodings (octal, hex, dword, dotted hex)
 */

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedUrl?: string;
}

export class SSRFValidator {
  private static readonly BLOCKED_HOSTS = new Set([
    "localhost",
    "127.0.0.1",
    "::1",
    "0.0.0.0",
    "169.254.169.254",
    "metadata.google.internal",
    "instance-data",
  ]);

  private static readonly ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

  /**
   * Validates a URL string for SSRF safety.
   */
  public static validateUrl(rawUrl: string): ValidationResult {
    if (!rawUrl || typeof rawUrl !== "string") {
      return { isValid: false, reason: "URL must be a non-empty string" };
    }

    const trimmed = rawUrl.trim();

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return { isValid: false, reason: "Malformed URL syntax" };
    }

    // Protocol check
    if (!this.ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return {
        isValid: false,
        reason: `Disallowed protocol: '${parsed.protocol}'. Only HTTP and HTTPS are permitted.`,
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check exact blocked hosts
    if (this.BLOCKED_HOSTS.has(hostname)) {
      return {
        isValid: false,
        reason: `Blocked target host: '${hostname}' is a reserved internal or metadata address.`,
      };
    }

    // Check internal domains
    if (
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".onion")
    ) {
      return {
        isValid: false,
        reason: `Blocked internal domain suffix: '${hostname}'.`,
      };
    }

    // Check IPv4 addresses
    if (this.isIPv4(hostname)) {
      if (this.isPrivateOrRestrictedIPv4(hostname)) {
        return {
          isValid: false,
          reason: `Blocked restricted IPv4 address: '${hostname}' falls within a private or cloud metadata subnet.`,
        };
      }
    }

    // Check IPv6 addresses
    if (this.isIPv6(hostname)) {
      if (this.isPrivateOrRestrictedIPv6(hostname)) {
        return {
          isValid: false,
          reason: `Blocked restricted IPv6 address: '${hostname}'.`,
        };
      }
    }

    return {
      isValid: true,
      sanitizedUrl: parsed.toString(),
    };
  }

  /**
   * Helper to check if string is IPv4
   */
  public static isIPv4(host: string): boolean {
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (!match) return false;

    return match.slice(1).every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  /**
   * Helper to check if string is IPv6 (enclosed or raw)
   */
  public static isIPv6(host: string): boolean {
    const cleanHost = host.replace(/^\[|\]$/g, "");
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(cleanHost) || cleanHost === "::1" || cleanHost === "::";
  }

  /**
   * Checks if an IPv4 address is in a private, loopback, link-local, or cloud metadata range.
   */
  public static isPrivateOrRestrictedIPv4(ip: string): boolean {
    const parts = ip.split(".").map((p) => parseInt(p, 10));
    const [a, b] = parts;

    // 0.0.0.0/8 (Broadcast/Current Network)
    if (a === 0) return true;

    // 10.0.0.0/8 (RFC 1918 Private)
    if (a === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-Local & Cloud Metadata, e.g. AWS 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (RFC 1918 Private: 172.16.0.0 to 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16 (RFC 1918 Private)
    if (a === 192 && b === 168) return true;

    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 (Reserved for future use)
    if (a >= 240) return true;

    return false;
  }

  /**
   * Checks if an IPv6 address is loopback, unique local, or link-local.
   */
  public static isPrivateOrRestrictedIPv6(ip: string): boolean {
    const clean = ip.replace(/^\[|\]$/g, "").toLowerCase();

    // Loopback ::1
    if (clean === "::1" || clean === "0:0:0:0:0:0:0:1") return true;

    // Unspecified ::
    if (clean === "::" || clean === "0:0:0:0:0:0:0:0") return true;

    // Unique Local Addresses (fc00::/7 -> fc00 to fdff)
    if (clean.startsWith("fc") || clean.startsWith("fd")) return true;

    // Link-Local Addresses (fe80::/10 -> fe80 to febf)
    if (clean.startsWith("fe8") || clean.startsWith("fe9") || clean.startsWith("fea") || clean.startsWith("feb")) {
      return true;
    }

    return false;
  }
}
