import { describe, it, expect } from "vitest";
import { KenyanEntityExtractor } from "@/lib/clustering/entityExtractor";

describe("WireOps Desk: Kenyan Entity Extractor", () => {
  it("extracts and normalizes Kenyan political figures and aliases", () => {
    const text = `
      President Ruto arrived in Kakamega today accompanied by Prime Cabinet Secretary Mudavadi
      and Governor Barasa to inspect development projects.
    `;

    const res = KenyanEntityExtractor.extractEntities(text);
    expect(res.canonicalNames).toContain("William Ruto");
    expect(res.canonicalNames).toContain("Musalia Mudavadi");
    expect(res.canonicalNames).toContain("Fernandes Barasa");
  });

  it("identifies Kakamega County sub-counties and tags Western Kenya focus", () => {
    const text = `
      Sugarcane farmers in Malava, Lurambi, and Shinyalu sub-counties held consultative forums
      ahead of the planned factory reopening in Mumias.
    `;

    const res = KenyanEntityExtractor.extractEntities(text);
    expect(res.isWesternKenyaFocus).toBe(true);
    expect(res.primaryCounty).toBe("Kakamega");
    expect(res.canonicalNames).toContain("Malava");
    expect(res.canonicalNames).toContain("Lurambi");
    expect(res.canonicalNames).toContain("Shinyalu");
    expect(res.canonicalNames).toContain("Mumias");
  });

  it("detects regulatory and state institutions", () => {
    const text = `
      Officers from the DCI and EACC conducted joint operations following an advisory from the NTSA.
    `;

    const res = KenyanEntityExtractor.extractEntities(text);
    expect(res.canonicalNames).toContain("DCI");
    expect(res.canonicalNames).toContain("EACC");
    expect(res.canonicalNames).toContain("NTSA");
  });

  it("detects transit beat and matatu sector entities (preventing drift)", () => {
    const text = `
      George Ruto's nganya matatus operated along the route following NTSA compliance inspections.
    `;

    const res = KenyanEntityExtractor.extractEntities(text);
    expect(res.transitBeatDetected).toBe(true);
    expect(res.canonicalNames).toContain("George Ruto");
    expect(res.canonicalNames).toContain("Nganya");
    expect(res.canonicalNames).toContain("Matatus");
  });
});
