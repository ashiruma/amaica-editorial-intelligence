import { describe, it, expect } from "vitest";
import {
  runEnsembleAiDetection,
  analyzeGrammarAndStyle,
  evaluateNewsroomQuality,
  extractProtectedFacts,
  verifyFactPreservation,
  extractAndClassifyClaims,
  performEditorialRewrite,
  checkOriginality,
  evaluateAuthorConsistency,
  checkStyleGuide,
  analyzeArticleIntelligence,
  AI_MODEL_VERSION,
} from "../lib/editorial";

describe("Amaica Media Editorial Intelligence Platform", () => {
  const sampleAiHeavyText = `
    In today's rapidly evolving digital landscape, it is important to remember that technology serves as a testament to human innovation. 
    Furthermore, one must delve into the multifaceted nature of artificial intelligence to truly understand its transformative potential. 
    Moreover, it is crucial to note that organizations must navigate these changes meticulously. 
    In conclusion, the seamless integration of modern paradigms will undoubtedly foster sustainable growth.
  `;

  const sampleJournalisticArticle = `
    NAIROBI, Kenya — The Ethics and Anti-Corruption Commission arrested two senior procurement officers at City Hall on Monday morning over an alleged Ksh 45 million road construction tender scandal.

    Lead investigator Sarah Omari confirmed the suspects were detained following an eight-month forensic audit of county infrastructure expenditures. "We have obtained bank trail records showing irregular wire transfers initiated between March and July," Omari told reporters outside Integrity Centre.

    Treasury records reviewed by Amaica News corroborate that payments were authorized despite independent engineers certifying that only 15 percent of the tarmac work in Westlands had been completed. The suspects are scheduled to enter pleas before Magistrate Lawrence Mugambi on Wednesday.
  `;

  describe("1. AI Pattern Ensemble Engine (15 Signals & Explainable Heatmap)", () => {
    it("analyzes AI-heavy prose and reports elevated AI-pattern signals with calibrated language", () => {
      const result = runEnsembleAiDetection(sampleAiHeavyText);

      expect(result.calibratedScore).toBeGreaterThanOrEqual(45);
      expect(["medium", "high"]).toContain(result.confidence);
      expect(["likely_ai_assisted", "strong_ai_patterns"]).toContain(result.classification);
      expect(result.explainabilitySummary).toMatch(/AI|formulaic/i);
      expect(result.modelVersion).toBe(AI_MODEL_VERSION);

      // Check signals
      expect(result.signals.syntacticRhythmUniformity).toBeGreaterThan(25);
      expect(result.signals.transitionDensity).toBeGreaterThan(0);
      expect(result.signals.fillerHypeDensity).toBeGreaterThan(0);

      // Check paragraph breakdown and explainable flags
      expect(result.paragraphHeatmap.length).toBeGreaterThan(0);
      const firstPara = result.paragraphHeatmap[0];
      expect(firstPara.detectedSignals.length).toBeGreaterThan(0);
    });

    it("identifies high natural human variation in genuine journalistic copy", () => {
      const result = runEnsembleAiDetection(sampleJournalisticArticle);

      expect(result.calibratedScore).toBeLessThan(50);
      expect(result.confidence).toBe("low");
      expect(result.classification).toBe("likely_human");
      expect(result.signals.hapaxRatio).toBeGreaterThan(0.3);
      expect(result.signals.typeTokenRatio).toBeGreaterThan(0.4);
    });

    it("gracefully handles short or empty text without breaking", () => {
      const emptyResult = runEnsembleAiDetection("");
      expect(emptyResult.confidence).toBe("low");
      expect(emptyResult.calibratedScore).toBe(0);
      expect(emptyResult.classification).toBe("insufficient_evidence");

      const shortResult = runEnsembleAiDetection("Hello world. This is a very short text.");
      expect(shortResult.classification).toBe("insufficient_evidence");
    });
  });

  describe("2. Grammar, Style, & Readability Engine", () => {
    it("detects wordiness, redundancies, and passive voice", () => {
      const textWithIssues = "In order to examine the situation, a decision was announced by the board in the event that something happens.";
      const { suggestions, readability } = analyzeGrammarAndStyle(textWithIssues);

      expect(suggestions.length).toBeGreaterThan(0);

      // Wordiness check: "in order to" -> "to"
      const wordiness = suggestions.find((s) => s.category === "clarity" || s.issueType.includes("Wordy"));
      expect(wordiness).toBeDefined();
      expect(wordiness?.suggestedRevision).toContain("to");

      // Passive voice check: "was announced by" -> active suggestion
      const passive = suggestions.find((s) => s.issueType === "Passive Voice");
      expect(passive).toBeDefined();

      // Readability metrics
      expect(readability.fleschReadingEase).toBeGreaterThan(0);
      expect(readability.gradeDescription).toBeDefined();
      expect(readability.fleschKincaidGradeLevel).toBeGreaterThan(0);
    });

    it("accurately calculates Flesch Reading Ease and Flesch-Kincaid Grade Level", () => {
      const simpleText = "The cat sat on the mat. The sun was hot. Dogs ran in the park.";
      const { readability } = analyzeGrammarAndStyle(simpleText);

      expect(readability.fleschReadingEase).toBeGreaterThan(70);
      expect(readability.fleschKincaidGradeLevel).toBeLessThan(6);
      expect(readability.gradeDescription).toContain("easy");
    });
  });

  describe("3. Newsroom Quality & Journalistic Standards Scorecard", () => {
    it("scores an inverted pyramid lead with high marks for answering key 5W questions", () => {
      const headline = "Ethics Commission Arrests Two Officers Over Ksh 45M Scandal";
      const scorecard = evaluateNewsroomQuality(sampleJournalisticArticle, headline, 0, 65);

      expect(scorecard.leadQuality.score).toBeGreaterThanOrEqual(80);
      expect(["strong", "adequate"]).toContain(scorecard.leadQuality.verdict);
      expect(scorecard.headlineAccuracy.score).toBeGreaterThan(70);
      expect(scorecard.attributionScore).toBeGreaterThanOrEqual(70);
      expect(scorecard.sensationalismRisk).toBe("low");
      expect(scorecard.overallScore).toBeGreaterThan(70);
    });

    it("penalizes clickbait sensationalism and poor leads", () => {
      const clickbaitText = "SHOCKING TRUTH REVEALED! A bombshell scandal is an unbelievable, mind-blowing epic disaster that will leave readers stunned!";
      const scorecard = evaluateNewsroomQuality(clickbaitText, "Unrelated Headline About Weather", 5, 40);

      expect(scorecard.sensationalismRisk).toBe("high");
      expect(scorecard.sensationalPhrasesFound.length).toBeGreaterThanOrEqual(3);
      expect(scorecard.leadQuality.score).toBeLessThanOrEqual(85);
      expect(scorecard.overallScore).toBeLessThanOrEqual(75);
    });
  });

  describe("4. Fact Locking Engine (Entities, Statistics, Quotes)", () => {
    it("extracts named entities, currencies, percentages, and exact quotes", () => {
      const facts = extractProtectedFacts(sampleJournalisticArticle);

      expect(facts.some((f) => f.type === "currency" && f.value.includes("Ksh 45 million"))).toBe(true);
      expect(facts.some((f) => f.type === "percentage" && f.value.includes("15 percent"))).toBe(true);
      expect(facts.some((f) => f.type === "quotation" && f.value.includes("We have obtained bank trail records"))).toBe(true);
    });

    it("approves revisions that faithfully preserve all facts", () => {
      const original = "Detectives arrested John Doe on Monday, recovering Ksh 50,000 in cash.";
      const faithfulRewrite = "On Monday, officers apprehended John Doe and seized Ksh 50,000 in cash.";

      const report = verifyFactPreservation(original, faithfulRewrite);
      expect(report.isBlocked).toBe(false);
      expect(report.modifiedFacts.length).toBe(0);
    });

    it("blocks rewrites that alter numbers, currencies, or direct quotes", () => {
      const original = 'Governor Jane Doe said "We allocated Ksh 100 million for healthcare" on Tuesday.';
      const corruptedRewrite = 'Governor Jane Doe said "We spent some funds" on Tuesday.';

      const report = verifyFactPreservation(original, corruptedRewrite);
      expect(report.isBlocked).toBe(true);
      expect(report.modifiedFacts.length).toBeGreaterThan(0);
      expect(report.modifiedFacts.some((m) => m.original.type === "currency" || m.original.type === "quotation")).toBe(true);
    });
  });

  describe("5. Claim Analysis Engine", () => {
    it("extracts and classifies factual claims, opinions, allegations, and predictions", () => {
      const text = `
        The suspect allegedly took the documents from the cabinet.
        In my opinion, the new transit policy is completely ineffective.
        Analysts predict the economy will grow by 4 percent next year.
        "The project is on schedule," the minister declared.
        Kenya achieved independence in 1963.
      `;

      const claims = extractAndClassifyClaims(text);
      expect(claims.length).toBeGreaterThanOrEqual(4);

      const types = claims.map((c) => c.claimType);
      expect(types).toContain("allegation");
      expect(types).toContain("opinion");
      expect(types).toContain("prediction");
      expect(types).toContain("quotation");
      expect(types).toContain("factual_claim");
    });
  });

  describe("6. Editorial Rewrite Engine (7 Modes & Reversible Changelog)", () => {
    it("supports all 7 rewrite modes and generates detailed sentence changelogs", () => {
      const input = "In order to achieve success, it is important to remember that technology serves as a testament to human innovation. The reports were reviewed by managers.";

      const modes = [
        "light_edit",
        "editorial_polish",
        "newsroom_standard",
        "simplify",
        "concise",
        "formal",
        "conversational",
      ] as const;

      for (const mode of modes) {
        const result = performEditorialRewrite(input, mode);
        expect(result.mode).toBe(mode);
        expect(result.rewrittenText.length).toBeGreaterThan(0);
        expect(result.changelog.length).toBeGreaterThan(0);
        expect(result.factLockReport).toBeDefined();
      }
    });

    it("preserves locked facts during editorial polish", () => {
      const original = 'Dr. Allan Mwangi stated that "exactly 42 patients recovered from the illness on August 15."';
      const result = performEditorialRewrite(original, "editorial_polish");

      expect(result.rewrittenText).toContain("42 patients");
      expect(result.factLockReport.isBlocked).toBe(false);
    });
  });

  describe("7. Originality & Internal Archive Checking", () => {
    it("detects high similarity when text duplicates an archived piece", () => {
      const duplicateText = "Former Tourism Cabinet Secretary Najib Balala has dismissed widespread social media reports claiming he had passed away, confirming he is alive and well.";
      const report = checkOriginality(duplicateText);

      expect(report.originalityScore).toBeLessThan(50);
      expect(report.matches.length).toBeGreaterThan(0);
      expect(report.matches[0].matchedArticleTitle).toContain("Najib Balala");
    });

    it("rewards highly unique text with a near 100% originality score", () => {
      const uniqueText = "A completely unprecedented archaeological survey conducted in Turkana revealed obsidian arrowheads dating back 12,000 years to early hunter-gatherers.";
      const report = checkOriginality(uniqueText);

      expect(report.originalityScore).toBeGreaterThanOrEqual(95);
      expect(report.matches.length).toBe(0);
    });
  });

  describe("8. Author Stylometry Profile Baseline", () => {
    it("computes author stylometry metrics and compares against baseline profile", () => {
      const baselineProfile = {
        authorId: "author-123",
        articleCount: 15,
        avgSentenceLength: 20,
        vocabularyDiversityTtr: 0.55,
        passiveVoiceRatio: 0.08,
        avgParagraphLength: 35,
        readingLevelAvg: 9.5,
        commonPhrases: ["exclusive reporting", "confirmed to Amaica", "county officials"],
        consistencyVerdict: "aligns_with_baseline" as const,
        deviationNotes: [],
      };

      const result = evaluateAuthorConsistency(sampleJournalisticArticle, baselineProfile);
      expect(result.authorId).toBe("author-123");
      expect(result.consistencyVerdict).toBeDefined();
      expect(result.deviationNotes).toBeDefined();
      expect(result.vocabularyDiversityTtr).toBeGreaterThan(0);
    });
  });

  describe("9. Style Guide & Local Standards (Kenya / Amaica News)", () => {
    it("flags non-standard currency notation, lowercase counties, and anonymous weasel attributions", () => {
      const badStyleText = "Sources say that USD 50 was spent in nairobi county yesterday.";
      const violations = checkStyleGuide(badStyleText);

      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations.some((v) => v.ruleTitle === "Direct Source Attribution")).toBe(true);
      expect(violations.some((v) => v.ruleTitle === "County Official Capitalization")).toBe(true);
      expect(violations.some((v) => v.ruleTitle === "Foreign Currency Conversion")).toBe(true);
    });
  });

  describe("10. Full Orchestrator (analyzeArticleIntelligence)", () => {
    it("returns complete unified payload with all 9 modular engine outputs", async () => {
      const payload = await analyzeArticleIntelligence(
        sampleJournalisticArticle,
        "Ethics Commission Arrests Two Officers Over Ksh 45M Scandal"
      );

      expect(payload.id).toMatch(/^intel-/);
      expect(payload.wordCount).toBeGreaterThan(50);
      expect(payload.characterCount).toBeGreaterThan(200);
      expect(payload.language).toBe("en-KE");
      expect(payload.readingMetrics.gradeDescription).toBeDefined();
      expect(payload.aiReport.classification).toBe("likely_human");
      expect(payload.grammarSuggestions).toBeDefined();
      expect(payload.newsroomScorecard.overallScore).toBeGreaterThan(70);
      expect(payload.factLockReport.isBlocked).toBe(false);
      expect(payload.claims.length).toBeGreaterThan(0);
      expect(payload.originality.originalityScore).toBeGreaterThan(70);
      expect(payload.styleGuideViolations).toBeDefined();
    });
  });

  describe("11. Multi-Model AI Content Forensics & Structural-Semantic Pipeline", () => {
    it("runs independent ModernBERT, Stylometric, and N-gram classifiers with model consensus", () => {
      const result = runEnsembleAiDetection(sampleAiHeavyText);

      expect(result.modelPredictions).toBeDefined();
      expect(result.modelPredictions.length).toBe(3);
      expect(result.modelPredictions.map((m) => m.architecture)).toEqual(
        expect.arrayContaining(["ModernBERT", "Stylometry", "NgramEntropy"])
      );
      expect(["high", "medium", "low"]).toContain(result.modelAgreement);
      expect(result.textAnalysisScope).toBe("limited_analysis");
    });

    it("evaluates structural discourse flow and overused transitions", () => {
      const result = runEnsembleAiDetection(sampleAiHeavyText);

      expect(result.structuralAnalysis).toBeDefined();
      expect(result.structuralAnalysis?.introPattern).toBe("formulaic_ai_hook");
      expect(result.structuralAnalysis?.conclusionPattern).toBe("summary_takeaway");

      expect(result.transitionAnalysis).toBeDefined();
      expect(result.transitionAnalysis?.status).toBe("high");
      expect(result.transitionAnalysis?.detectedTransitions.length).toBeGreaterThan(0);
    });

    it("generates sentence-level forensic details with supporting and counter signals", () => {
      const result = runEnsembleAiDetection(sampleJournalisticArticle);

      expect(result.sentenceDetails).toBeDefined();
      expect(result.sentenceDetails?.length).toBeGreaterThan(0);
      const firstSentence = result.sentenceDetails?.[0];
      expect(firstSentence).toBeDefined();
      expect(firstSentence?.classification).toBe("human");
      expect(firstSentence?.counterSignals.length).toBeGreaterThan(0);

      // Verify overall report signals
      expect(result.counterSignals.some((s) => s.includes("Type-Token Ratio") || s.includes("cadence") || s.includes("currency"))).toBe(true);
      expect(result.limitations.length).toBeGreaterThanOrEqual(2);
    });

    it("gating: marks short texts under 50 words as insufficient evidence", () => {
      const shortText = "NAIROBI, Kenya — The Ethics Commission announced an investigation on Monday morning into procurement.";
      const result = runEnsembleAiDetection(shortText);

      expect(result.classification).toBe("insufficient_evidence");
      expect(result.textAnalysisScope).toBe("insufficient_text");
      expect(result.explainabilitySummary).toMatch(/statistical significance threshold|50 words/i);
    });
  });

  describe("12. Turnitin & QuillBot Commercial Parity & Zero-AI Editorial Humanizer", () => {
    const SAMPLE_JOURNALISM_TEXT = `Congolese rhumba star Fally Ipupa performed in Nairobi, Kenya, on Friday, September 6, 2026, delivering an evening of music to thousands of fans.

The concert featured a blend of rhumba and Amapiano, alongside several prominent African artists who joined him on stage for collaborative sets. Organizers confirmed that over 15,000 attendees filled the venue, paying tickets starting at Ksh 3,500.

## Background
The singer last performed in Nairobi two years ago. Fans arrived early at the venue, with security officers managing crowds along the perimeter. 

## Official Response
"I am grateful for the overwhelming reception from Nairobi fans," Fally Ipupa stated in a media briefing following the concert. "Kenya has always been a second home for Congolese rhumba, and we will return next year."

## Why it matters
The event demonstrates the growing market for regional live entertainment in East Africa. According to reports from event managers, international tour stops in Nairobi have surged by 45 percent over the past three years.`;

    it("matches QuillBot v7.2.0 and Turnitin exact 65% benchmark on raw AI sample", () => {
      const result = runEnsembleAiDetection(SAMPLE_JOURNALISM_TEXT);
      expect(result.calibratedScore).toBe(65);
      expect(result.quillBotBreakdown?.aiGeneratedScore).toBe(65);
      expect(result.quillBotBreakdown?.humanWrittenScore).toBe(35);
      expect(result.benchmarks.turnitinIndex).toBe(65);
      expect(result.benchmarks.quillBotLikelihood).toBe(65);
      expect(result.classification).toBe("strong_ai_patterns");
    });

    it("dissolves formulaic outline headers and maintains 100% Fact Locking during rewrite", () => {
      const rewrite = performEditorialRewrite(SAMPLE_JOURNALISM_TEXT, "newsroom_standard");

      // Zero markdown outline headers in rewritten text
      expect(rewrite.rewrittenText).not.toMatch(/^##\s+/m);
      expect(rewrite.rewrittenText).not.toMatch(/## Background/);
      expect(rewrite.rewrittenText).not.toMatch(/## Official Response/);
      expect(rewrite.rewrittenText).not.toMatch(/## Why it matters/);

      // Fact Locking must be 100% verified (unblocked)
      expect(rewrite.factLockReport.isBlocked).toBe(false);
      expect(rewrite.rewrittenText).toContain("Fally Ipupa");
      expect(rewrite.rewrittenText).toContain("Nairobi, Kenya");
      expect(rewrite.rewrittenText).toContain("September 6, 2026");
      expect(rewrite.rewrittenText).toContain("15,000");
      expect(rewrite.rewrittenText).toContain("Ksh 3,500");
      expect(rewrite.rewrittenText).toContain("45 percent");
    });

    it("achieves 0% AI detection clearance on rewritten text", () => {
      const rewrite = performEditorialRewrite(SAMPLE_JOURNALISM_TEXT, "natural_newsroom");
      const analysis = runEnsembleAiDetection(rewrite.rewrittenText);

      expect(analysis.calibratedScore).toBe(0);
      expect(analysis.quillBotBreakdown?.aiGeneratedScore).toBe(0);
      expect(analysis.quillBotBreakdown?.humanWrittenScore).toBe(100);
      expect(analysis.benchmarks.turnitinIndex).toBe(0);
      expect(analysis.classification).toBe("likely_human");
    });
  });

  describe("13. 7 Editorial Quality Scores & Headline Intelligence", () => {
    it("calculates all 7 distinct quality scores with plain English recommendations", () => {
      const scorecard = evaluateNewsroomQuality(sampleJournalisticArticle, "Ethics Commission Arrests Two Officers Over Ksh 45M Scandal");

      expect(scorecard.sevenScores).toBeDefined();
      const s = scorecard.sevenScores!;
      expect(s.clarity).toBeGreaterThan(60);
      expect(s.readability).toBeGreaterThan(50);
      expect(s.structure).toBeGreaterThan(60);
      expect(s.grammar).toBeGreaterThan(70);
      expect(s.repetition).toBeGreaterThan(50);
      expect(s.specificity).toBeGreaterThan(50);
      expect(s.newsroomStyle).toBeGreaterThan(60);
      expect(Array.isArray(s.recommendations)).toBe(true);
    });

    it("evaluates headline clarity, specificity, SEO, and engagement with fact-grounded alternatives", () => {
      const scorecard = evaluateNewsroomQuality(sampleJournalisticArticle, "Ethics Commission Arrests Two Officers Over Ksh 45M Scandal");

      expect(scorecard.headlineIntelligence).toBeDefined();
      const h = scorecard.headlineIntelligence!;
      expect(h.clarityScore).toBeGreaterThan(60);
      expect(h.specificityScore).toBeGreaterThan(70);
      expect(h.seoScore).toBeGreaterThan(60);
      expect(h.engagementScore).toBeGreaterThan(70);
      expect(h.alternativeHeadlines.length).toBeGreaterThanOrEqual(3);

      // Verify alternatives are grounded in article facts
      for (const alt of h.alternativeHeadlines) {
        expect(alt.headline.length).toBeGreaterThan(15);
        expect(alt.groundedFacts.length).toBeGreaterThan(0);
      }
    });

    it("generates actionable editorial assistant recommendations", () => {
      const scorecard = evaluateNewsroomQuality(sampleJournalisticArticle, "Ethics Commission Arrests Two Officers");

      expect(scorecard.editorialSuggestions).toBeDefined();
      expect(Array.isArray(scorecard.editorialSuggestions)).toBe(true);
    });
  });

  describe("14. 5 Journalistic Rewrite Modes & Fact Restoration", () => {
    const testArticle = `Congolese rhumba star Fally Ipupa performed in Nairobi, Kenya, on 13 September 2026, delivering an evening of music to 15,000 fans, with tickets starting at Ksh 3,500.`;

    it("supports all 5 rewrite modes without breaking fact preservation", () => {
      const modes = ["light_edit", "natural_newsroom", "conversational", "feature", "amaica_editorial"] as const;

      for (const mode of modes) {
        const res = performEditorialRewrite(testArticle, mode);
        expect(res.rewrittenText.length).toBeGreaterThan(20);
        expect(res.factLockReport.isBlocked).toBe(false);
        expect(res.voicePreservationPercentage).toBeGreaterThanOrEqual(90);
      }
    });
  });
});
