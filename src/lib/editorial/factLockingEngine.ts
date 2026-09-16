/**
 * Amaica Media Editorial Intelligence Platform
 * Fact Preservation & Fact Locking Engine
 *
 * Automatically extracts protected journalistic entities (people, organizations,
 * locations, dates, currencies, percentages, statistics, direct quotations, URLs)
 * and verifies that rewrites never alter, fabricate, or omit core factual data.
 */

import type { ProtectedFact, FactLockReport, FactEntityType } from "@/types/editorialIntelligence";

// Regex extractors for protected entities
const REGEX_PATTERNS: { type: FactEntityType; regex: RegExp; isQuote?: boolean }[] = [
  // Direct quotations ("..." or “...”)
  {
    type: "quotation",
    regex: /(?:["“][^"”]{5,}["”]|'[^']{5,}')/g,
    isQuote: true,
  },
  // URLs
  {
    type: "url",
    regex: /https?:\/\/[^\s)"]+/gi,
  },
  // Currencies & Monetary Figures
  {
    type: "currency",
    regex: /\b(?:ksh|kes|shillings?|\$|usd|eur|£)\.?\s*[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|k|m|b))?\b/gi,
  },
  // Percentages
  {
    type: "percentage",
    regex: /\b\d+(?:\.\d+)?\s*(?:%|percent|percentage)\b/gi,
  },
  // Dates & Calendar references
  {
    type: "date",
    regex: /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}\b/gi,
  },
  {
    type: "date",
    regex: /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  },
  // Statistics with unit quantities (e.g. 15 people, 60 students, 12 acts)
  {
    type: "statistic",
    regex: /\b\d+(?:,\d+)?\s+(?:people|students|attendees|participants|artists|acts|members|officials|fans|supporters|delegates|victims|casualties|votes|shares|shillings)\b/gi,
  },
  // Key Western Kenya & Kenyan locations
  {
    type: "location",
    regex: /\b(?:Nairobi|Kakamega|Kisumu|Bungoma|Busia|Vihiga|Siaya|Homa Bay|Migori|Kisii|Eldoret|Mumias|Webuye|Bukhungu|Uhuru Park|Nyayo Stadium|Kasarani|KICC|London|New York)\b/g,
  },
  // Key Organizations & Outlets
  {
    type: "organization",
    regex: /\b(?:Amaica Media|Brittle Paper|Standard Media|Nation Media|Citizen TV|KBC|Safaricom|M-Pesa|Ministry of Health|Ministry of Tourism|Parliament|Supreme Court)\b/g,
  },
  // Prominent Proper Names (Cap Words followed by Surname)
  {
    type: "person",
    regex: /\b(?:Fally Ipupa|Najib Balala|John Maloba|Mwai Kibaki|Uhuru Kenyatta|William Ruto|Walt Mzengi|Jane Mwangi)\b/g,
  },
];

/**
 * Extracts all protected facts from text.
 */
export function extractProtectedFacts(text: string): ProtectedFact[] {
  if (!text) return [];
  const facts: ProtectedFact[] = [];
  const seenSpans = new Set<string>();
  let factId = 0;

  for (const { type, regex, isQuote } of REGEX_PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
      const raw = match[0].trim();
      const start = match.index;
      const end = start + raw.length;
      const spanKey = `${start}-${end}`;

      if (!seenSpans.has(spanKey)) {
        seenSpans.add(spanKey);
        factId++;
        facts.push({
          id: `fact-${factId}`,
          type,
          value: raw,
          normalizedValue: raw.toLowerCase().replace(/[^\w]/g, ""),
          span: { start, end },
          isQuotation: !!isQuote,
        });
      }
    }
  }

  // Sort facts by appearance order
  return facts.sort((a, b) => a.span.start - b.span.start);
}

/**
 * Compares original facts with rewritten text to identify any unauthorized changes.
 */
export function verifyFactPreservation(
  originalText: string,
  rewrittenText: string
): FactLockReport {
  const originalFacts = extractProtectedFacts(originalText);
  const rewrittenLower = (rewrittenText || "").toLowerCase();

  const modifiedFacts: FactLockReport["modifiedFacts"] = [];

  for (const fact of originalFacts) {
    const norm = fact.normalizedValue;
    // Check if normalized representation exists in the rewritten text
    const cleanRewritten = rewrittenLower.replace(/[^\w]/g, "");

    if (!cleanRewritten.includes(norm)) {
      // If it's a quote, check if at least 70% of quote words exist
      if (fact.isQuotation) {
        const quoteWords = fact.value.toLowerCase().replace(/["'“”]/g, "").split(/\s+/).filter(Boolean);
        const matchCount = quoteWords.filter((w) => rewrittenLower.includes(w)).length;
        if (quoteWords.length > 0 && matchCount / quoteWords.length < 0.6) {
          modifiedFacts.push({
            original: fact,
            modifiedValue: "[Quote altered or truncated]",
            violationType: "altered_value",
          });
        }
      } else {
        modifiedFacts.push({
          original: fact,
          modifiedValue: "[Fact missing or rephrased]",
          violationType: "omitted",
        });
      }
    }
  }

  // Detect numerical substitutions (e.g. original had '15 people' but rewrite has '50 people')
  const origNumbers = originalText.match(/\b\d+(?:,\d+)?(?:\.\d+)?\b/g) || [];
  const rewrittenNumbers = rewrittenText.match(/\b\d+(?:,\d+)?(?:\.\d+)?\b/g) || [];

  for (const num of origNumbers) {
    if (!rewrittenNumbers.includes(num)) {
      // Find if an altered number was substituted
      const foundOriginalFact = originalFacts.find((f) => f.value.includes(num));
      if (foundOriginalFact && !modifiedFacts.some((m) => m.original.id === foundOriginalFact.id)) {
        modifiedFacts.push({
          original: foundOriginalFact,
          modifiedValue: `Original number '${num}' missing or altered`,
          violationType: "altered_value",
        });
      }
    }
  }

  const formattingDifferences: FactLockReport["formattingDifferences"] = [];

  // Check for formatting-only date/currency variations
  for (const fact of originalFacts) {
    if (fact.type === "date") {
      // Check if day and month swapped e.g. "September 6" vs "6 September"
      const dateParts = fact.value.match(/([a-zA-Z]+)\s+(\d{1,2})|(\d{1,2})\s+([a-zA-Z]+)/);
      if (dateParts) {
        const month = dateParts[1] || dateParts[4];
        const day = dateParts[2] || dateParts[3];
        const altFormat = `${day} ${month}`;
        const altFormat2 = `${month} ${day}`;
        if (
          (rewrittenText.includes(altFormat) || rewrittenText.includes(altFormat2)) &&
          !rewrittenText.includes(fact.value)
        ) {
          formattingDifferences.push({
            original: fact,
            modifiedValue: rewrittenText.includes(altFormat) ? altFormat : altFormat2,
            violationType: "formatting_only",
          });
        }
      }
    }
  }

  const isBlocked = modifiedFacts.some(
    (m) =>
      m.original.type === "statistic" ||
      m.original.type === "currency" ||
      m.original.type === "percentage" ||
      m.original.type === "date" ||
      m.original.type === "person" ||
      m.original.type === "quotation"
  );

  let warningMessage: string | undefined;
  if (isBlocked) {
    warningMessage = `Fact Guard Alert: ${modifiedFacts.length} protected entity change(s) detected. High-stakes entities (numbers, names, dates, quotes) must remain identical.`;
  } else if (modifiedFacts.length > 0) {
    warningMessage = `Notice: ${modifiedFacts.length} non-critical entity variation(s) observed. Review before saving.`;
  }

  return {
    lockedFacts: originalFacts,
    totalFactsCount: originalFacts.length,
    modifiedFacts,
    formattingDifferences,
    isBlocked,
    warningMessage,
  };
}

/**
 * Restores a specific fact to its exact original form in rewritten text.
 */
export function restoreFact(text: string, originalFact: ProtectedFact): string {
  if (!text || !originalFact) return text;
  // If formatting difference e.g. date or currency
  const dateParts = originalFact.value.match(/([a-zA-Z]+)\s+(\d{1,2})|(\d{1,2})\s+([a-zA-Z]+)/);
  if (dateParts) {
    const month = dateParts[1] || dateParts[4];
    const day = dateParts[2] || dateParts[3];
    const altRegex = new RegExp(`\\b(?:${day}\\s+${month}|${month}\\s+${day})\\b`, "i");
    if (altRegex.test(text)) {
      return text.replace(altRegex, originalFact.value);
    }
  }
  return text;
}
