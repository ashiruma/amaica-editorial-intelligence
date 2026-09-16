/**
 * Amaica Media Editorial Intelligence Platform
 * Style Guide Engine (Amaica Newsroom & Custom Rules)
 *
 * Checks adherence to professional newsroom style rules,
 * local Kenyan currency, county conventions, and banned weasel phrasing.
 */

import type { StyleGuideViolation } from "@/types/editorialIntelligence";

interface StyleGuideRule {
  id: string;
  ruleTitle: string;
  pattern: RegExp;
  preferredReplacement: string;
  explanation: string;
}

const AMAICA_STYLE_RULES: StyleGuideRule[] = [
  {
    id: "style-weasel-reports",
    ruleTitle: "Direct Source Attribution",
    pattern: /\b(?:according to reports|sources say|unconfirmed reports indicate)\b/gi,
    preferredReplacement: "Name the primary reporting source directly (e.g. 'According to a police report...')",
    explanation: "Avoid vague attributions like 'Sources say' or 'According to reports'. Identify the specific agency or official.",
  },
  {
    id: "style-weasel-sources",
    ruleTitle: "Anonymous Source Clarity",
    pattern: /\bsources close to the matter\b/gi,
    preferredReplacement: "an official familiar with the negotiations",
    explanation: "Provide appropriate professional context for unnamed sources to establish authority.",
  },
  {
    id: "style-currency-format",
    ruleTitle: "Kenyan Currency Format",
    pattern: /\b(?:kshs?|kes)\.?\s*(?=\d)/gi,
    preferredReplacement: "Ksh ",
    explanation: "Amaica News Style specifies 'Ksh ' followed by the amount with comma separation (e.g., 'Ksh 50,000').",
  },
  {
    id: "style-foreign-currency",
    ruleTitle: "Foreign Currency Conversion",
    pattern: /\b(?:USD|\$|EUR|GBP)\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:million|billion|k|m|b))?\b/gi,
    preferredReplacement: "Include approximate Ksh conversion (e.g., 'USD 50 (approx. Ksh 6,500)')",
    explanation: "Always provide local currency equivalent in Ksh for Kenyan readership clarity.",
  },
  {
    id: "style-county-capitalization",
    ruleTitle: "County Official Capitalization",
    pattern: /\b(nairobi|mombasa|nakuru|kiambu|machakos|kakamega|kisumu|bungoma|busia|vihiga|siaya|homa bay|migori|kisii|eldoret)\s+county\b/gi,
    preferredReplacement: "County (Capitalized)",
    explanation: "Capitalize 'County' and the county name when referencing official devolved jurisdictions (e.g., 'Nairobi County').",
  },
  {
    id: "style-cliche-gamechanger",
    ruleTitle: "Cliché Prohibition",
    pattern: /\bgame[- ]changer\b/gi,
    preferredReplacement: "major development / turning point",
    explanation: "Commercial tech clichés should be avoided in objective news copy.",
  },
  {
    id: "style-benga-music",
    ruleTitle: "Genre Nomenclature",
    pattern: /\b(benga|ohangla|gengetone|isukuti|rhumba|rumba)\s+music\b/gi,
    preferredReplacement: "$1",
    explanation: "Capitalize genre names and avoid redundant 'music' suffix where context is established.",
  },
];

/**
 * Checks text against newsroom style guide rules.
 */
export function checkStyleGuide(text: string): StyleGuideViolation[] {
  if (!text) return [];
  const violations: StyleGuideViolation[] = [];
  let violationCount = 0;

  for (const rule of AMAICA_STYLE_RULES) {
    let match: RegExpExecArray | null;
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = re.exec(text)) !== null) {
      violationCount++;
      const matchedText = match[0];
      const start = Math.max(0, match.index - 20);
      const end = Math.min(text.length, match.index + matchedText.length + 20);
      const context = "..." + text.slice(start, end).replace(/\s+/g, " ") + "...";

      violations.push({
        id: `sg-${violationCount}`,
        ruleTitle: rule.ruleTitle,
        bannedPhrase: matchedText,
        preferredReplacement: rule.preferredReplacement,
        context,
        explanation: rule.explanation,
      });
    }
  }

  return violations;
}
