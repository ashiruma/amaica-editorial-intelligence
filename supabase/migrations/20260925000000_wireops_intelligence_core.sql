-- Migration: WireOps Desk Newsroom Intelligence Core Schema
-- Migration ID: 20260925000000_wireops_intelligence_core.sql
-- Description: Establishes the relational multi-source intelligence graph, source registry,
-- lineage tracking, verification records, claims, research packets, immutable article versions,
-- quotes, editorial rules/violations, multi-detector forensics, and Telegram alerting.

-- Safely create custom ENUM types
DO $$ BEGIN
    CREATE TYPE public.source_credibility_tier AS ENUM (
        'global_national_established',
        'regional_established',
        'trusted_local_source',
        'official_source',
        'social_source',
        'unverified_source',
        'low_confidence_source'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.story_lifecycle_status AS ENUM (
        'SIGNAL',
        'DEVELOPING',
        'VERIFIED',
        'UNVERIFIED_SINGLE_SOURCE',
        'DISPUTED',
        'DRAFTING',
        'EDITORIAL_REVIEW',
        'READY_FOR_LEGAL',
        'APPROVED',
        'SCHEDULED',
        'PUBLISHED',
        'REJECTED',
        'ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 1. Source Registry
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    homepage_url TEXT NOT NULL,
    feed_url TEXT,
    source_type TEXT NOT NULL DEFAULT 'rss' CHECK (source_type IN ('rss', 'html_portal', 'government_portal', 'social_channel', 'wire_agency')),
    geography TEXT NOT NULL DEFAULT 'national' CHECK (geography IN ('kakamega', 'western_kenya', 'national', 'east_africa', 'international')),
    primary_topics TEXT[] DEFAULT ARRAY['general'],
    credibility_tier public.source_credibility_tier NOT NULL DEFAULT 'unverified_source',
    manual_trust_status TEXT NOT NULL DEFAULT 'standard' CHECK (manual_trust_status IN ('trusted', 'standard', 'under_review', 'blacklisted')),
    ai_confidence_score NUMERIC(5, 4) DEFAULT 0.5000,
    original_reporting_tendency NUMERIC(5, 4) DEFAULT 0.5000,
    syndication_tendency NUMERIC(5, 4) DEFAULT 0.5000,
    consecutive_failures INT NOT NULL DEFAULT 0,
    last_checked_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    admin_override_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sources_domain ON public.sources(domain);
CREATE INDEX IF NOT EXISTS idx_sources_credibility ON public.sources(credibility_tier);
CREATE INDEX IF NOT EXISTS idx_sources_geography ON public.sources(geography);

-- 2. Source Relationships (Lineage & Syndicate Tracking)
CREATE TABLE IF NOT EXISTS public.source_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    related_source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('syndicates_from', 'copies_frequently', 'parent_network', 'independent_partner')),
    confidence_score NUMERIC(5, 4) NOT NULL DEFAULT 0.8000,
    evidence_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(source_id, related_source_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_source_rel_source ON public.source_relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_source_rel_related ON public.source_relationships(related_source_id);

-- 3. Story Clusters (Unified Events)
CREATE TABLE IF NOT EXISTS public.story_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_code TEXT NOT NULL UNIQUE, -- e.g., WOP-2026-0001
    working_headline TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'community',
    primary_location TEXT NOT NULL DEFAULT 'Kakamega',
    county TEXT DEFAULT 'Kakamega',
    town TEXT,
    geographic_relevance_score INT NOT NULL DEFAULT 0,
    momentum_score INT NOT NULL DEFAULT 0,
    status public.story_lifecycle_status NOT NULL DEFAULT 'SIGNAL',
    is_potential_exclusive BOOLEAN NOT NULL DEFAULT false,
    first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_signal_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    signal_count INT NOT NULL DEFAULT 1,
    source_count INT NOT NULL DEFAULT 1,
    independent_source_count INT NOT NULL DEFAULT 1,
    assigned_editor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clusters_status ON public.story_clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_location ON public.story_clusters(county, town);
CREATE INDEX IF NOT EXISTS idx_clusters_updated ON public.story_clusters(updated_at DESC);

-- 4. Story Signals (Raw Ingested Reports)
CREATE TABLE IF NOT EXISTS public.story_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES public.story_clusters(id) ON DELETE SET NULL,
    external_url TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    raw_title TEXT NOT NULL,
    raw_text TEXT,
    excerpt TEXT,
    hero_image_url TEXT,
    author_name TEXT,
    published_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    content_hash TEXT NOT NULL UNIQUE,
    lineage_type TEXT NOT NULL DEFAULT 'original_report' CHECK (lineage_type IN ('original_report', 'secondary_report', 'syndicated_copy', 'social_amplification')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signals_cluster ON public.story_signals(cluster_id);
CREATE INDEX IF NOT EXISTS idx_signals_hash ON public.story_signals(content_hash);
CREATE INDEX IF NOT EXISTS idx_signals_detected ON public.story_signals(detected_at DESC);

-- 5. Verification Records (Audit Trail)
CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL UNIQUE REFERENCES public.story_clusters(id) ON DELETE CASCADE,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'disputed', 'under_investigation')),
    rule_applied TEXT NOT NULL CHECK (rule_applied IN ('three_independent_sources', 'official_accountable_authority', 'manual_editor_confirmation', 'insufficient_evidence')),
    independent_sources_count INT NOT NULL DEFAULT 0,
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    verified_authority_name TEXT,
    verified_authority_document_url TEXT,
    unresolved_discrepancies JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification_notes TEXT,
    verified_by_user_id UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_cluster ON public.verification_records(cluster_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON public.verification_records(verification_status);

-- 6. Claims & Claim Sources
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES public.story_clusters(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    claim_type TEXT NOT NULL CHECK (claim_type IN ('fact', 'attributed_claim', 'allegation', 'background', 'quotation')),
    is_disputed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_cluster ON public.claims(cluster_id);

CREATE TABLE IF NOT EXISTS public.claim_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    signal_id UUID NOT NULL REFERENCES public.story_signals(id) ON DELETE CASCADE,
    exact_sentence_in_source TEXT,
    confidence NUMERIC(5, 4) NOT NULL DEFAULT 0.9000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_sources_claim ON public.claim_sources(claim_id);

-- 7. Research Packets (Dossiers compiled before drafting)
CREATE TABLE IF NOT EXISTS public.research_packets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL UNIQUE REFERENCES public.story_clusters(id) ON DELETE CASCADE,
    key_entities JSONB NOT NULL DEFAULT '[]'::jsonb,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    confirmed_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
    unverified_claims JSONB NOT NULL DEFAULT '[]'::jsonb,
    direct_quotes JSONB NOT NULL DEFAULT '[]'::jsonb,
    statutory_citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    assembled_by_agent TEXT NOT NULL DEFAULT 'research_dossier_assembler_v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Articles (Extends and complements existing drafts table)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES public.story_clusters(id) ON DELETE SET NULL,
    legacy_draft_id UUID REFERENCES public.drafts(id) ON DELETE SET NULL,
    headline TEXT NOT NULL,
    standfirst_deck TEXT,
    lede TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'community',
    county TEXT DEFAULT 'Kakamega',
    town TEXT,
    word_count INT NOT NULL DEFAULT 0,
    reading_time_minutes INT NOT NULL DEFAULT 3,
    hero_image_url TEXT,
    hero_image_caption TEXT,
    hero_image_attribution TEXT,
    hero_image_type TEXT DEFAULT 'editorial_image' CHECK (hero_image_type IN ('editorial_image', 'stock_image', 'user_upload', 'social_media_image', 'ai_generated_image')),
    author_id UUID REFERENCES auth.users(id),
    approved_by_id UUID REFERENCES auth.users(id),
    status public.story_lifecycle_status NOT NULL DEFAULT 'DRAFTING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_cluster ON public.articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);

-- 9. Article Versions (Immutable Side-by-Side Snapshots)
CREATE TABLE IF NOT EXISTS public.article_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    version_tag TEXT NOT NULL CHECK (version_tag IN ('v1_ai_draft', 'v2_editor_edit', 'v3_paraphrase_applied', 'v4_humanization_applied', 'v5_final_published')),
    headline TEXT NOT NULL,
    lede TEXT NOT NULL,
    body TEXT NOT NULL,
    word_count INT NOT NULL,
    changed_by_user_id UUID REFERENCES auth.users(id),
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(article_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_article_versions_article ON public.article_versions(article_id, version_number DESC);

-- 10. Direct Quotations (Protected from automated rewrite)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    verbatim_text TEXT NOT NULL,
    speaker_name TEXT NOT NULL,
    speaker_title TEXT,
    source_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT true,
    is_protected_from_rewrite BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_article ON public.quotes(article_id);

-- 11. Editorial Rules & Violations
CREATE TABLE IF NOT EXISTS public.editorial_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('critical_blocker', 'error', 'warning', 'advisory')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.editorial_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES public.editorial_rules(id) ON DELETE CASCADE,
    violating_snippet TEXT NOT NULL,
    suggested_fix TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violations_article ON public.editorial_violations(article_id);

-- Seed Initial Core Editorial Rules
INSERT INTO public.editorial_rules (rule_code, title, description, severity) VALUES
('RULE_QUOTE_PRESERVATION', 'Verbatim Quote Protection', 'Direct quotes must be preserved verbatim without paraphrase or AI hallucination.', 'critical_blocker'),
('RULE_ZERO_EMOJIS', 'Zero Emoji Workplace Mandate', 'Workplace newsroom standard forbids all emojis in headlines, ledes, body copy, and metadata.', 'critical_blocker'),
('RULE_THREE_INDEPENDENT_SOURCES', 'Three Independent Sources Verification', 'High-impact allegations, arrests, corruption, or casualty claims require 3 independent sources or official authority confirmation.', 'critical_blocker'),
('RULE_INVERTED_PYRAMID_STRUCTURE', 'Inverted Pyramid Journalistic Standard', 'Articles must follow 5Ws+H lede, high-impact context, and descending significance without formulaic blog headers.', 'error'),
('RULE_KENYAN_LEGENDS_ONLY', 'Kenyan Legends Beat Exclusivity', 'The Legends beat strictly covers Kenyan historical, athletic, and cultural icons. Non-Kenyan figures are prohibited.', 'critical_blocker'),
('RULE_KENYAN_ENGLISH_SPELLING', 'Kenyan/British Standard English', 'Enforce British/Commonwealth orthography (colour, organise, honour, transport) and standard Kenyan institutional titles.', 'error'),
('RULE_NO_HALLUCINATED_ENDINGS', 'Beat Coherence & Anti-Drift', 'Articles must not drift thematically from the opening lede into unrelated beats (e.g. transit stories ending in concert summaries).', 'critical_blocker')
ON CONFLICT (rule_code) DO NOTHING;

-- 12. Detector Runs & Results (Multi-Provider Transparency)
CREATE TABLE IF NOT EXISTS public.detector_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    run_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    consensus_signal TEXT NOT NULL CHECK (consensus_signal IN ('consensus_human', 'consensus_ai', 'detector_disagreement', 'inconclusive')),
    provider_count INT NOT NULL DEFAULT 1,
    average_score NUMERIC(5, 2)
);

CREATE TABLE IF NOT EXISTS public.detector_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.detector_runs(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    score NUMERIC(5, 2),
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'NOT_CONFIGURED', 'SERVICE_UNAVAILABLE', 'TIMEOUT')),
    confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
    highlighted_passages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_detector_results_run ON public.detector_results(run_id);

-- 13. Telegram Alerts
CREATE TABLE IF NOT EXISTS public.telegram_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES public.story_clusters(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('BREAKING', 'DEVELOPING', 'POTENTIAL_EXCLUSIVE', 'VERIFICATION_COMPLETE', 'EDITOR_ACTION_REQUIRED', 'SYSTEM_FAILURE')),
    message_text TEXT NOT NULL,
    telegram_message_id TEXT,
    delivered BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on All New Tables
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detector_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detector_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_alerts ENABLE ROW LEVEL SECURITY;

-- Standard Policies for Authenticated Newsroom Staff
CREATE POLICY "Sources viewable by newsroom staff" ON public.sources FOR ALL TO authenticated USING (true);
CREATE POLICY "Source relationships viewable by newsroom staff" ON public.source_relationships FOR ALL TO authenticated USING (true);
CREATE POLICY "Story clusters viewable by newsroom staff" ON public.story_clusters FOR ALL TO authenticated USING (true);
CREATE POLICY "Story signals viewable by newsroom staff" ON public.story_signals FOR ALL TO authenticated USING (true);
CREATE POLICY "Verification records viewable by newsroom staff" ON public.verification_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Claims viewable by newsroom staff" ON public.claims FOR ALL TO authenticated USING (true);
CREATE POLICY "Claim sources viewable by newsroom staff" ON public.claim_sources FOR ALL TO authenticated USING (true);
CREATE POLICY "Research packets viewable by newsroom staff" ON public.research_packets FOR ALL TO authenticated USING (true);
CREATE POLICY "Articles viewable by newsroom staff" ON public.articles FOR ALL TO authenticated USING (true);
CREATE POLICY "Article versions viewable by newsroom staff" ON public.article_versions FOR ALL TO authenticated USING (true);
CREATE POLICY "Quotes viewable by newsroom staff" ON public.quotes FOR ALL TO authenticated USING (true);
CREATE POLICY "Editorial rules viewable by newsroom staff" ON public.editorial_rules FOR ALL TO authenticated USING (true);
CREATE POLICY "Editorial violations viewable by newsroom staff" ON public.editorial_violations FOR ALL TO authenticated USING (true);
CREATE POLICY "Detector runs viewable by newsroom staff" ON public.detector_runs FOR ALL TO authenticated USING (true);
CREATE POLICY "Detector results viewable by newsroom staff" ON public.detector_results FOR ALL TO authenticated USING (true);
CREATE POLICY "Telegram alerts viewable by newsroom staff" ON public.telegram_alerts FOR ALL TO authenticated USING (true);
