/**
 * Unit Tests for Kenyan English Editorial Stylebook Engine
 */

import { describe, it, expect } from "vitest";
import {
  auditKenyanStylebook,
  applyStylebookCorrections,
  KENYAN_SPELLING_MAP,
  KENYAN_INSTITUTIONAL_RULES,
  KENYAN_CURRENCY_RULES,
} from "@/lib/editorial/kenyanStylebookEngine";

describe("Kenyan English Editorial Stylebook Engine", () => {
  it("enforces Commonwealth spelling conventions over US spelling", () => {
    const usText = "The organization honored the color of the new theater in the center of the neighborhood.";
    const result = auditKenyanStylebook(usText);

    expect(result.passed).toBe(false);
    expect(result.categoryBreakdown.spelling).toBeGreaterThanOrEqual(5);

    const { correctedText, appliedCount } = applyStylebookCorrections(usText);
    expect(appliedCount).toBeGreaterThanOrEqual(5);
    expect(correctedText).toContain("organisation");
    expect(correctedText).toContain("honoured");
    expect(correctedText).toContain("colour");
    expect(correctedText).toContain("theatre");
    expect(correctedText).toContain("centre");
    expect(correctedText).toContain("neighbourhood");
  });

  it("standardizes Kenyan 2010 Constitution institutional terminology", () => {
    const legacyText = "The Cabinet Minister arrived with the Junior Minister, while local councilors met at the Municipal Council.";
    const result = auditKenyanStylebook(legacyText);

    expect(result.passed).toBe(false);
    expect(result.categoryBreakdown.institutional).toBeGreaterThanOrEqual(3);

    const issues = result.issues.filter((i) => i.category === "institutional");
    expect(issues.some((i) => i.preferredReplacement === "Cabinet Secretary")).toBe(true);
    expect(issues.some((i) => i.preferredReplacement.includes("County Assembly"))).toBe(true);
  });

  it("standardizes local transit terminology (boda boda and matatu sacco)", () => {
    const text = "A motorcycle taxi collided with a vehicle operated by a local matatu company.";
    const result = auditKenyanStylebook(text);

    expect(result.passed).toBe(false);
    const instIssues = result.issues.filter((i) => i.category === "institutional");
    expect(instIssues.some((i) => i.preferredReplacement === "boda boda rider")).toBe(true);
    expect(instIssues.some((i) => i.preferredReplacement === "matatu sacco")).toBe(true);

    const { correctedText } = applyStylebookCorrections(text);
    expect(correctedText).toContain("boda boda rider");
    expect(correctedText).toContain("matatu sacco");
  });

  it("formats Kenyan Shilling currency notations according to newsroom style", () => {
    const text = "The project cost kshs 450,000, while tickets were kes 2,000.";
    const result = auditKenyanStylebook(text);

    expect(result.categoryBreakdown.currency).toBe(2);

    const { correctedText } = applyStylebookCorrections(text);
    expect(correctedText).toContain("KSh 450,000");
    expect(correctedText).toContain("KSh 2,000");
  });

  it("detects and flags formulaic AI clichés", () => {
    const aiText = "This project serves as a testament to the vibrant tapestry of Nairobi's artists who delve into creative rhythms.";
    const result = auditKenyanStylebook(aiText);

    expect(result.categoryBreakdown.cliche).toBeGreaterThanOrEqual(3);
    const cliches = result.issues.filter((i) => i.category === "cliche");
    expect(cliches.some((c) => c.matchedText.toLowerCase().includes("testament"))).toBe(true);
    expect(cliches.some((c) => c.matchedText.toLowerCase().includes("tapestry"))).toBe(true);
    expect(cliches.some((c) => c.matchedText.toLowerCase().includes("delve"))).toBe(true);
  });

  it("passes clean, professional Kenyan editorial copy with a 100% score", () => {
    const cleanText = "The Cabinet Secretary for Transport inspected the new road in Kakamega County. The project received KSh 12 million from the national infrastructure development programme.";
    const result = auditKenyanStylebook(cleanText);

    expect(result.passed).toBe(true);
    expect(result.totalIssues).toBe(0);
    expect(result.score).toBe(100);
  });
});
