/**
 * WireOps Desk: Newsroom Intelligence Core Domain Types
 * Location: src/types/intelligence.ts
 * Operational Standard: Zero-Emoji Workplace Standard, Strict Kenyan Inverted Pyramid Style
 */

// ==========================================
// 1. SOURCE REGISTRY & LINEAGE
// ==========================================

export type SourceCredibilityTier =
  | "global_national_established"
  | "regional_established"
  | "trusted_local_source"
  | "official_source"
  | "social_source"
  | "unverified_source"
  | "low_confidence_source";

export type GeographicScope =
  | "kakamega"
  | "western_kenya"
  | "national"
  | "east_africa"
  | "international";

export type SourceType =
  | "rss"
  | "html_portal"
  | "government_portal"
  | "social_channel"
  | "wire_agency";

export type ManualTrustStatus =
  | "trusted"
  | "standard"
  | "under_review"
  | "blacklisted";

export interface SourceProfile {
  id: string;
  name: string;
  domain: string;
  homepage_url: string;
  feed_url?: string | null;
  source_type: SourceType;
  geography: GeographicScope;
  primary_topics: string[];
  credibility_tier: SourceCredibilityTier;
  manual_trust_status: ManualTrustStatus;
  ai_confidence_score: number;
  original_reporting_tendency: number;
  syndication_tendency: number;
  consecutive_failures: number;
  last_checked_at?: string | null;
  last_success_at?: string | null;
  is_active: boolean;
  admin_override_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type SourceRelationshipType =
  | "syndicates_from"
  | "copies_frequently"
  | "parent_network"
  | "independent_partner";

export interface SourceRelationship {
  id: string;
  source_id: string;
  related_source_id: string;
  relationship_type: SourceRelationshipType;
  confidence_score: number;
  evidence_notes?: string | null;
  created_at: string;
}

// ==========================================
// 2. SIGNALS, CLUSTERS & LIFECYCLE
// ==========================================

export type StoryLifecycleStatus =
  | "SIGNAL"
  | "DEVELOPING"
  | "VERIFIED"
  | "UNVERIFIED_SINGLE_SOURCE"
  | "DISPUTED"
  | "DRAFTING"
  | "EDITORIAL_REVIEW"
  | "READY_FOR_LEGAL"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

export type SignalLineageType =
  | "original_report"
  | "secondary_report"
  | "syndicated_copy"
  | "social_amplification";

export interface StorySignal {
  id: string;
  source_id: string;
  cluster_id?: string | null;
  external_url: string;
  canonical_url: string;
  raw_title: string;
  raw_text?: string | null;
  excerpt?: string | null;
  hero_image_url?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  detected_at: string;
  content_hash: string;
  lineage_type: SignalLineageType;
  created_at: string;
  // Hydrated helper properties
  source?: SourceProfile;
}

export interface StoryCluster {
  id: string;
  story_code: string;
  working_headline: string;
  category: string;
  primary_location: string;
  county?: string | null;
  town?: string | null;
  geographic_relevance_score: number;
  momentum_score: number;
  status: StoryLifecycleStatus;
  is_potential_exclusive: boolean;
  first_detected_at: string;
  last_signal_at: string;
  signal_count: number;
  source_count: number;
  independent_source_count: number;
  assigned_editor_id?: string | null;
  created_at: string;
  updated_at: string;
  // Hydrated helper properties
  signals?: StorySignal[];
  verification?: VerificationRecord | null;
}

// ==========================================
// 3. VERIFICATION & CLAIMS
// ==========================================

export type VerificationStatus =
  | "verified"
  | "unverified"
  | "disputed"
  | "under_investigation";

export type VerificationRuleApplied =
  | "three_independent_sources"
  | "official_accountable_authority"
  | "manual_editor_confirmation"
  | "insufficient_evidence";

export interface VerificationRecord {
  id: string;
  cluster_id: string;
  is_verified: boolean;
  verification_status: VerificationStatus;
  rule_applied: VerificationRuleApplied;
  independent_sources_count: number;
  confidence_score: number; // 0 to 100
  verified_authority_name?: string | null;
  verified_authority_document_url?: string | null;
  unresolved_discrepancies: Array<{
    claim: string;
    conflictingSources: string[];
    details: string;
  }>;
  verification_notes?: string | null;
  verified_by_user_id?: string | null;
  verified_at: string;
}

export type ClaimType =
  | "fact"
  | "attributed_claim"
  | "allegation"
  | "background"
  | "quotation";

export interface Claim {
  id: string;
  cluster_id: string;
  claim_text: string;
  claim_type: ClaimType;
  is_disputed: boolean;
  created_at: string;
  sources?: ClaimSource[];
}

export interface ClaimSource {
  id: string;
  claim_id: string;
  signal_id: string;
  exact_sentence_in_source?: string | null;
  confidence: number;
  created_at: string;
}

// ==========================================
// 4. RESEARCH PACKETS & ARTICLES
// ==========================================

export interface EntityProfile {
  name: string;
  role: string;
  organization?: string;
  isOfficialAuthority: boolean;
  mentionCount: number;
}

export interface TimelineEvent {
  timestamp: string;
  eventDescription: string;
  sourceUrl?: string;
  sourceDomain?: string;
}

export interface ConfirmedFact {
  fact: string;
  corroboratingSources: string[];
  confidence: number;
}

export interface ResearchPacket {
  id: string;
  cluster_id: string;
  key_entities: EntityProfile[];
  timeline: TimelineEvent[];
  confirmed_facts: ConfirmedFact[];
  unverified_claims: string[];
  direct_quotes: Array<{
    quote: string;
    speaker: string;
    sourceDomain: string;
  }>;
  statutory_citations: string[];
  assembled_by_agent: string;
  created_at: string;
  updated_at: string;
}

export type HeroImageType =
  | "editorial_image"
  | "stock_image"
  | "user_upload"
  | "social_media_image"
  | "ai_generated_image";

export interface ArticleRecord {
  id: string;
  cluster_id?: string | null;
  legacy_draft_id?: string | null;
  headline: string;
  standfirst_deck?: string | null;
  lede: string;
  body: string;
  category: string;
  county?: string | null;
  town?: string | null;
  word_count: number;
  reading_time_minutes: number;
  hero_image_url?: string | null;
  hero_image_caption?: string | null;
  hero_image_attribution?: string | null;
  hero_image_type: HeroImageType;
  author_id?: string | null;
  approved_by_id?: string | null;
  status: StoryLifecycleStatus;
  created_at: string;
  updated_at: string;
}

export type ArticleVersionTag =
  | "v1_ai_draft"
  | "v2_editor_edit"
  | "v3_paraphrase_applied"
  | "v4_humanization_applied"
  | "v5_final_published";

export interface ArticleVersion {
  id: string;
  article_id: string;
  version_number: number;
  version_tag: ArticleVersionTag;
  headline: string;
  lede: string;
  body: string;
  word_count: number;
  changed_by_user_id?: string | null;
  change_summary?: string | null;
  created_at: string;
}

export interface QuoteRecord {
  id: string;
  article_id: string;
  verbatim_text: string;
  speaker_name: string;
  speaker_title?: string | null;
  source_url?: string | null;
  is_verified: boolean;
  is_protected_from_rewrite: boolean;
  created_at: string;
}

// ==========================================
// 5. EDITORIAL RULES & GOVERNANCE
// ==========================================

export type RuleSeverity = "critical_blocker" | "error" | "warning" | "advisory";

export interface EditorialRule {
  id: string;
  rule_code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  is_active: boolean;
  created_at: string;
}

export interface EditorialViolation {
  id: string;
  article_id: string;
  rule_id: string;
  violating_snippet: string;
  suggested_fix?: string | null;
  is_resolved: boolean;
  resolved_by_user_id?: string | null;
  created_at: string;
  rule?: EditorialRule;
}

// ==========================================
// 6. MULTI-DETECTOR FORENSICS & TELEGRAM
// ==========================================

export type ConsensusSignal =
  | "consensus_human"
  | "consensus_ai"
  | "detector_disagreement"
  | "inconclusive";

export type DetectorStatus =
  | "SUCCESS"
  | "NOT_CONFIGURED"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT";

export interface DetectorRun {
  id: string;
  article_id: string;
  run_timestamp: string;
  consensus_signal: ConsensusSignal;
  provider_count: number;
  average_score?: number | null;
  results?: DetectorResult[];
}

export interface DetectorResult {
  id: string;
  run_id: string;
  provider_name: string;
  score?: number | null;
  status: DetectorStatus;
  confidence: "low" | "medium" | "high";
  highlighted_passages?: Array<{
    text: string;
    score: number;
    reason?: string;
  }>;
  created_at: string;
}

export type TelegramAlertType =
  | "BREAKING"
  | "DEVELOPING"
  | "POTENTIAL_EXCLUSIVE"
  | "VERIFICATION_COMPLETE"
  | "EDITOR_ACTION_REQUIRED"
  | "SYSTEM_FAILURE";

export interface TelegramAlertRecord {
  id: string;
  cluster_id?: string | null;
  alert_type: TelegramAlertType;
  message_text: string;
  telegram_message_id?: string | null;
  delivered: boolean;
  error_message?: string | null;
  created_at: string;
}

// ==========================================
// 7. PROVIDER ABSTRACTION CONTRACTS
// ==========================================

export type LLMProviderType =
  | "gemini"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "ollama";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  responseFormat?: "text" | "json_object";
  apiKey?: string;
}

export interface LLMCompletionResponse {
  provider: LLMProviderType;
  model: string;
  content: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  durationMs: number;
}

export interface DetectorAnalysisRequest {
  text: string;
  title?: string;
  language?: string;
}

export interface DetectorAnalysisResponse {
  providerName: string;
  status: DetectorStatus;
  aiScore: number | null; // 0.0 (100% human) to 100.0 (100% AI), null if not configured
  confidence: "low" | "medium" | "high";
  rawResponse?: Record<string, unknown>;
  latencyMs: number;
  errorMessage?: string;
}

export interface PlagiarismMatch {
  matchedUrl?: string;
  matchedTitle?: string;
  similarityPercent: number;
  matchedSnippets: Array<{
    originalText: string;
    matchedText: string;
  }>;
}

export interface PlagiarismCheckResponse {
  providerName: string;
  status: DetectorStatus;
  overallSimilarityPercent: number | null;
  matches: PlagiarismMatch[];
  latencyMs: number;
  errorMessage?: string;
}
