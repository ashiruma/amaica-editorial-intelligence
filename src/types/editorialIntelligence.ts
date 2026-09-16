/**
 * Amaica Media Editorial Intelligence Platform
 * Core TypeScript Definitions and Domain Models
 */

export type AiPatternConfidence = "low" | "medium" | "high";

export type AuthorshipClassification =
  | "likely_human"
  | "likely_ai_assisted"
  | "mixed_authorship"
  | "likely_ai_generated"
  | "strong_ai_patterns"
  | "heavily_ai_patterned"
  | "insufficient_evidence";

export type TextAnalysisScope =
  | "insufficient_text"
  | "limited_analysis"
  | "standard_analysis"
  | "deep_analysis";

export type ModelAgreementLevel = "high" | "medium" | "low";

export interface ModelPrediction {
  modelName: string;
  architecture: "ModernBERT" | "DeBERTa" | "Stylometry" | "NgramEntropy";
  score: number;
  confidence: AiPatternConfidence;
  classification: AuthorshipClassification;
}

export interface SentenceAnalysisDetail {
  sentenceIndex: number;
  text: string;
  wordCount: number;
  score: number;
  isFlagged: boolean;
  classification: "human" | "mixed" | "ai_pattern";
  supportingSignals: string[];
  counterSignals: string[];
  syntacticType?: string;
  reason?: string;
}

export interface StructuralAnalysisReport {
  introPattern: "journalistic_lede" | "academic" | "formulaic_ai_hook" | "generic";
  conclusionPattern: "summary_takeaway" | "formulaic_moral" | "natural_kicker" | "none";
  boilerplateFlowDetected: boolean;
  flowStages: string[];
  structuralPredictabilityScore: number; // 0 to 100
}

export interface SemanticRepetitionReport {
  semanticRepetitionScore: number; // 0 to 100
  repeatedConcepts: { concept: string; sentenceA: string; sentenceB: string; similarity: number }[];
  paraphraseTransformationScore: "low" | "medium" | "high";
  redundantExplanationDetected: boolean;
}

export interface TransitionAnalysisReport {
  frequencyPercent: number;
  densityPer100Words: number;
  status: "normal" | "elevated" | "high";
  detectedTransitions: { phrase: string; count: number }[];
}

export interface PredictabilityReport {
  perplexityScore: number;
  burstinessScore: number;
  burstinessProfile: "low_variation" | "medium_variation" | "high_variation";
  phrasePredictabilityIndex: number; // 0 to 100
}

export interface EnsembleSignalMetrics {
  // 1. Vocabulary diversity (Type-Token Ratio & Hapax Legomena)
  typeTokenRatio: number; // 0.0 to 1.0 (human typically > 0.45 on full articles)
  hapaxRatio: number; // Single-occurrence words ratio
  // 2. Syntactic & Sentence Metrics
  avgSentenceLength: number; // Words per sentence
  sentenceLengthVariance: number; // Variance in sentence length
  sentenceLengthStdDev: number; // Burstiness indicator
  shortSentenceRatio: number; // Sentences <= 6 words
  longSentenceRatio: number; // Sentences >= 26 words
  // 3. Structural Uniformity & Predictability
  syntacticRhythmUniformity: number; // 0 to 100 (high = robotic uniformity)
  repeatedSentenceOpenersRatio: number; // Over-use of identical clause openings
  // 4. Connectives & Formulaic Patterns
  transitionDensity: number; // Occurrences per 100 words of formulaic transitions
  trailingParticipialDensity: number; // Trailing ,-ing clauses per 100 words
  fillerHypeDensity: number; // Formulaic AI adjectives/adverbs per 100 words
  // 5. Echoing & Repetition
  adjacentNgramOverlap: number; // Structural repetition between consecutive sentences
  semanticEchoRatio: number; // Idea reiteration without adding new facts
  // 6. Overall Ensemble Synthesis
  ensembleScore: number; // 0 to 100
  confidence: AiPatternConfidence;
  classification: AuthorshipClassification;
}

export interface ParagraphAnalysis {
  id: number;
  paragraphIndex: number;
  text: string;
  wordCount: number;
  sentenceCount: number;
  confidence: AiPatternConfidence;
  classification: AuthorshipClassification;
  score: number; // 0 to 100
  detectedSignals: string[]; // Real calculated reasons
  sentenceBreakdown: {
    sentenceIndex: number;
    text: string;
    wordCount: number;
    score: number;
    isFlagged: boolean;
    reason?: string;
  }[];
}

export interface IndustryBenchmarks {
  quillBotLikelihood: number; // 0 to 100
  gptZeroConfidence: number; // 0 to 100
  turnitinIndex: number; // 0 to 100
  copyleaksIndex: number; // 0 to 100
  burstinessScore: number;
  perplexityScore: number;
}

export interface QuillBotBreakdown {
  aiGeneratedScore: number; // Yellow (AI-generated %)
  aiRefinedScore: number; // Blue (AI-refined %)
  humanWrittenScore: number; // Clear (Human-written %)
}

export interface AiDetectionReport {
  modelVersion: string;
  analyzedAt: string;
  processingTimeMs: number;
  classification: AuthorshipClassification;
  confidence: AiPatternConfidence;
  analysisConfidence?: AiPatternConfidence;
  calibratedScore: number; // 0 to 100
  rawScore?: number;
  explainabilitySummary: string;
  supportingSignals: string[];
  counterSignals: string[];
  limitations: string[];
  textAnalysisScope: TextAnalysisScope;
  modelAgreement: ModelAgreementLevel;
  modelPredictions: ModelPrediction[];
  structuralAnalysis?: StructuralAnalysisReport;
  semanticAnalysis?: SemanticRepetitionReport;
  transitionAnalysis?: TransitionAnalysisReport;
  predictabilityAnalysis?: PredictabilityReport;
  signals: EnsembleSignalMetrics;
  paragraphHeatmap: ParagraphAnalysis[];
  sentenceDetails?: SentenceAnalysisDetail[];
  benchmarks?: IndustryBenchmarks;
  quillBotBreakdown?: QuillBotBreakdown;
}

export type GrammarCategory = "grammar" | "style" | "clarity" | "readability";

export interface GrammarSuggestion {
  id: string;
  category: GrammarCategory;
  issueType: string;
  originalText: string;
  suggestedRevision: string;
  explanation: string;
  startOffset: number;
  endOffset: number;
  status: "pending" | "accepted" | "rejected";
}

export interface ReadabilityMetrics {
  fleschKincaidGradeLevel: number; // e.g. 8.2 (Target: 8-10 for journalism)
  fleschReadingEase: number; // 0 to 100 (Target: 60-70)
  readingTimeMinutes: number;
  avgSyllablesPerWord: number;
  complexWordPercentage: number;
  gradeDescription: string;
}

export interface EditorialQualitySevenScores {
  clarity: number; // 0 to 100 (e.g. 88%)
  readability: number; // 0 to 100 (e.g. 81%)
  structure: number; // 0 to 100 (e.g. 92%)
  grammar: number; // 0 to 100 (e.g. 96%)
  repetition: number; // 0 to 100 (e.g. 74%)
  specificity: number; // 0 to 100 (e.g. 69%)
  newsroomStyle: number; // 0 to 100 (e.g. 91%)
  recommendations: {
    metric: string;
    issue: string;
    plainEnglishAdvice: string;
  }[];
}

export interface HeadlineIntelligence {
  originalHeadline: string;
  clarityScore: number;
  specificityScore: number;
  seoScore: number;
  engagementScore: number;
  overallScore: number;
  verdict: string;
  alternativeHeadlines: {
    headline: string;
    style: "direct_news" | "active_voice" | "quote_focus" | "analytical";
    groundedFacts: string[];
  }[];
}

export interface EditorialAssistantSuggestion {
  id: string;
  type: "opening" | "paragraph" | "repetition" | "headline" | "generic_language" | "transition";
  title: string;
  targetText: string;
  suggestedRevision: string;
  explanation: string;
  selected: boolean;
}

export interface NewsroomScorecard {
  overallScore: number; // 0 to 100
  grammarScore: number; // 0 to 100
  clarityScore: number; // 0 to 100
  readabilityScore: number; // 0 to 100
  structureScore: number; // 0 to 100
  attributionScore: number; // 0 to 100
  objectivityScore: number; // 0 to 100
  originalityScore: number; // 0 to 100
  sevenScores?: EditorialQualitySevenScores;
  headlineIntelligence?: HeadlineIntelligence;
  editorialSuggestions?: EditorialAssistantSuggestion[];
  leadQuality: {
    score: number;
    verdict: "strong" | "adequate" | "needs_work" | "missing_lead";
    summary: string;
  };
  headlineAccuracy: {
    score: number;
    matchesBody: boolean;
    feedback: string;
  };
  sensationalismRisk: "low" | "medium" | "high";
  sensationalPhrasesFound: string[];
  attributionDetails: {
    namedSourcesCount: number;
    anonymousQuotesCount: number;
    unattributedClaimsCount: number;
    feedback: string;
  };
}

export type FactEntityType =
  | "person"
  | "organization"
  | "location"
  | "date"
  | "currency"
  | "percentage"
  | "statistic"
  | "quotation"
  | "url";

export interface ProtectedFact {
  id: string;
  type: FactEntityType;
  value: string;
  normalizedValue: string;
  span: { start: number; end: number };
  isQuotation: boolean;
}

export interface FactLockReport {
  lockedFacts: ProtectedFact[];
  totalFactsCount: number;
  modifiedFacts: {
    original: ProtectedFact;
    modifiedValue: string;
    violationType: "altered_value" | "omitted" | "invented";
  }[];
  formattingDifferences?: {
    original: ProtectedFact;
    modifiedValue: string;
    violationType: "formatting_only";
  }[];
  isBlocked: boolean; // True if any number, name, quote or date was altered
  warningMessage?: string;
}

export type ClaimType =
  | "factual_claim"
  | "opinion"
  | "prediction"
  | "allegation"
  | "quotation";

export type ClaimVerificationStatus =
  | "source_provided"
  | "needs_verification"
  | "potentially_unsupported"
  | "conflicting_information";

export interface ClaimItem {
  id: string;
  claimText: string;
  claimType: ClaimType;
  verificationStatus: ClaimVerificationStatus;
  attributedTo?: string;
  isProtectedFact: boolean;
  notes: string;
}

export type EditorialRewriteMode =
  | "light_edit" // Fixes grammar, typos & mechanics only
  | "natural_newsroom" // Natural newsroom flow & AP/Amaica attribution
  | "conversational" // Engaging, accessible tone for features/gossip
  | "feature" // In-depth human feature journalism
  | "amaica_editorial" // Signature Amaica Media newsroom voice
  | "editorial_polish" // Legacy alias
  | "newsroom_standard" // Legacy alias
  | "simplify" // Legacy alias
  | "concise" // Legacy alias
  | "formal"; // Legacy alias

export type ImprovementOption =
  | "naturalness"
  | "sentence_variation"
  | "remove_repetition"
  | "strengthen_voice"
  | "improve_clarity"
  | "reduce_generic"
  | "preserve_style";

export interface RewriteChangelogItem {
  id: string;
  sentenceIndex: number;
  originalText: string;
  rewrittenText: string;
  reason: string;
  accepted: boolean;
}

export interface EditorialRewriteResult {
  mode: EditorialRewriteMode;
  originalText: string;
  rewrittenText: string;
  wordCountDelta: number;
  changelog: RewriteChangelogItem[];
  factLockReport: FactLockReport;
  newScorecard?: NewsroomScorecard;
  newAiReport?: AiDetectionReport;
  voicePreservationPercentage?: number;
  meaningChanged?: number;
  factsChanged?: number;
}

export type UserRole = "journalist" | "editor" | "manager" | "admin";

export type ProgressiveDisclosureMode = "basic" | "editor" | "forensics";

export type NewsroomArticleWorkflowStatus =
  | "draft"
  | "analyzing"
  | "needs_review"
  | "humanized"
  | "editor_review"
  | "approved"
  | "published";

export interface NewsroomAuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  statusFrom?: string;
  statusTo?: string;
}

export interface ArticleVersionSnapshot {
  id: string;
  versionNumber: number;
  createdAt: string;
  label: string;
  headline: string;
  content: string;
  aiScore: number;
  wordCount: number;
  author: string;
}

export interface OriginalityMatch {
  matchedArticleId?: string;
  matchedArticleTitle: string;
  similarityPercentage: number;
  matchingPassage: string;
}

export interface OriginalityReport {
  originalityScore: number; // 0 to 100 (100 = completely original)
  similarityType: "none" | "near_duplicate" | "semantic_similarity" | "paraphrase";
  matches: OriginalityMatch[];
  summary: string;
}

export interface AuthorStyleProfile {
  authorId: string;
  articleCount: number;
  avgSentenceLength: number;
  vocabularyDiversityTtr: number;
  passiveVoiceRatio: number;
  avgParagraphLength: number;
  commonPhrases: string[];
  readingLevelAvg: number;
  consistencyVerdict: "aligns_with_baseline" | "moderate_variance" | "significant_deviation" | "insufficient_data";
  deviationNotes: string[];
}

export interface StyleGuideViolation {
  id: string;
  ruleTitle: string;
  bannedPhrase: string;
  preferredReplacement: string;
  context: string;
  explanation: string;
}

export interface CompleteEditorialIntelligencePayload {
  id: string;
  analyzedAt: string;
  modelVersion: string;
  wordCount: number;
  characterCount: number;
  language: "en" | "sw" | "en-KE";
  readingMetrics: ReadabilityMetrics;
  aiReport: AiDetectionReport;
  grammarSuggestions: GrammarSuggestion[];
  newsroomScorecard: NewsroomScorecard;
  factLockReport: FactLockReport;
  claims: ClaimItem[];
  originality: OriginalityReport;
  styleGuideViolations: StyleGuideViolation[];
  authorProfile?: AuthorStyleProfile;
}
