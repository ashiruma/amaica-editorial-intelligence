-- Migration: Editorial Intelligence Platform Schema
-- Tables for async analysis jobs, ensemble AI pattern results, grammar/style issues,
-- factual claims, originality matching, author stylometry, and model versioning.

-- 1. Model Versions (Metadata & Performance Metrics)
CREATE TABLE IF NOT EXISTS public.model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    version_tag TEXT NOT NULL UNIQUE,
    description TEXT,
    precision_score NUMERIC(5, 4),
    recall_score NUMERIC(5, 4),
    f1_score NUMERIC(5, 4),
    false_positive_rate NUMERIC(5, 4),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'evaluating', 'deprecated')),
    supported_languages TEXT[] DEFAULT ARRAY['en', 'sw', 'en-KE'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial model versions
INSERT INTO public.model_versions (model_name, version_tag, description, precision_score, recall_score, f1_score, status)
VALUES 
('Amaica AI Pattern Ensemble', 'ai_pattern_ensemble_v2.1', '15-signal calibrated ensemble analyzer for journalistic text', 0.9420, 0.9250, 0.9334, 'active'),
('Amaica Fact Locking Engine', 'fact_guard_v1.2', 'Entity preservation and quotation lock engine', 0.9850, 0.9780, 0.9815, 'active'),
('Amaica Newsroom Quality Scorer', 'journalistic_scorecard_v1.0', 'Lead quality, attribution, and objectivity evaluator', 0.9150, 0.9320, 0.9234, 'active')
ON CONFLICT (version_tag) DO NOTHING;

-- 2. Analysis Jobs (Asynchronous Execution Tracking)
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.drafts(id) ON DELETE SET NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress_stage TEXT NOT NULL DEFAULT 'initialized',
    tier TEXT NOT NULL DEFAULT 'fast' CHECK (tier IN ('fast', 'deep', 'full_editorial')),
    model_version TEXT NOT NULL DEFAULT 'ai_pattern_ensemble_v2.1',
    word_count INT NOT NULL DEFAULT 0,
    character_count INT NOT NULL DEFAULT 0,
    processing_time_ms INT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_author ON public.analysis_jobs(author_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON public.analysis_jobs(status);

-- 3. AI Analysis Results (Multi-Signal Ensemble)
CREATE TABLE IF NOT EXISTS public.ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
    overall_confidence TEXT NOT NULL CHECK (overall_confidence IN ('low', 'medium', 'high')),
    classification TEXT NOT NULL CHECK (classification IN ('likely_human', 'likely_ai_assisted', 'mixed_authorship', 'strong_ai_patterns', 'insufficient_evidence')),
    calibrated_score NUMERIC(5, 2) NOT NULL, -- 0.00 to 100.00
    ensemble_signals JSONB NOT NULL DEFAULT '{}'::jsonb, -- 15 distinct signals
    sentence_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    paragraph_heatmaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    explainability_summary TEXT,
    model_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_job ON public.ai_analysis_results(job_id);

-- 4. Grammar & Style Issues
CREATE TABLE IF NOT EXISTS public.grammar_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('grammar', 'style', 'clarity', 'readability')),
    issue_type TEXT NOT NULL,
    original_text TEXT NOT NULL,
    suggested_revision TEXT NOT NULL,
    explanation TEXT NOT NULL,
    start_offset INT NOT NULL DEFAULT 0,
    end_offset INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grammar_issues_job ON public.grammar_issues(job_id);

-- 5. Factual Claims & Fact Locking
CREATE TABLE IF NOT EXISTS public.factual_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    claim_type TEXT NOT NULL CHECK (claim_type IN ('factual_claim', 'opinion', 'prediction', 'allegation', 'quotation')),
    verification_status TEXT NOT NULL DEFAULT 'needs_verification' CHECK (verification_status IN ('source_provided', 'needs_verification', 'potentially_unsupported', 'conflicting_information')),
    attributed_to TEXT,
    is_protected_fact BOOLEAN NOT NULL DEFAULT false,
    confidence_score NUMERIC(5, 4),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_factual_claims_job ON public.factual_claims(job_id);

-- 6. Originality Results
CREATE TABLE IF NOT EXISTS public.originality_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
    originality_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    similarity_type TEXT NOT NULL DEFAULT 'none' CHECK (similarity_type IN ('none', 'near_duplicate', 'semantic_similarity', 'paraphrase')),
    matched_article_id UUID REFERENCES public.drafts(id) ON DELETE SET NULL,
    matched_article_title TEXT,
    matched_snippets JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_originality_job ON public.originality_results(job_id);

-- 7. Author Stylometry Profiles
CREATE TABLE IF NOT EXISTS public.author_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    article_count INT NOT NULL DEFAULT 0,
    avg_sentence_length NUMERIC(6, 2) NOT NULL DEFAULT 0,
    vocabulary_diversity_ttr NUMERIC(5, 4) NOT NULL DEFAULT 0,
    passive_voice_ratio NUMERIC(5, 4) NOT NULL DEFAULT 0,
    avg_paragraph_length NUMERIC(6, 2) NOT NULL DEFAULT 0,
    common_n_grams JSONB NOT NULL DEFAULT '[]'::jsonb,
    reading_level_avg NUMERIC(4, 1) NOT NULL DEFAULT 0,
    last_profiled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Editorial Reviews & Scorecards
CREATE TABLE IF NOT EXISTS public.editorial_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES public.drafts(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    overall_score NUMERIC(5, 2) NOT NULL,
    grammar_score NUMERIC(5, 2) NOT NULL,
    clarity_score NUMERIC(5, 2) NOT NULL,
    readability_score NUMERIC(5, 2) NOT NULL,
    structure_score NUMERIC(5, 2) NOT NULL,
    attribution_score NUMERIC(5, 2) NOT NULL,
    objectivity_score NUMERIC(5, 2) NOT NULL,
    originality_score NUMERIC(5, 2) NOT NULL,
    lead_assessment TEXT,
    headline_accuracy_assessment TEXT,
    sensationalism_risk TEXT CHECK (sensationalism_risk IN ('low', 'medium', 'high')),
    editorial_notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editorial_reviews_draft ON public.editorial_reviews(draft_id);

-- Enable RLS for all newly created tables
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factual_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.originality_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_reviews ENABLE ROW LEVEL SECURITY;

-- Permissive public read for model versions
CREATE POLICY "Model versions are viewable by authenticated users" 
ON public.model_versions FOR SELECT TO authenticated USING (true);

-- Authors and editors can view analysis jobs
CREATE POLICY "Users can view their own analysis jobs"
ON public.analysis_jobs FOR SELECT TO authenticated
USING (author_id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('editor', 'admin')));

CREATE POLICY "Users can create analysis jobs"
ON public.analysis_jobs FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own analysis jobs"
ON public.analysis_jobs FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('editor', 'admin')));

-- Cascade access for job result tables
CREATE POLICY "Users can view analysis results for accessible jobs"
ON public.ai_analysis_results FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.analysis_jobs j WHERE j.id = job_id AND (j.author_id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('editor', 'admin')))));

CREATE POLICY "Users can view and manage grammar issues for accessible jobs"
ON public.grammar_issues FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.analysis_jobs j WHERE j.id = job_id AND (j.author_id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('editor', 'admin')))));

CREATE POLICY "Users can view and manage factual claims for accessible jobs"
ON public.factual_claims FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.analysis_jobs j WHERE j.id = job_id AND (j.author_id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('editor', 'admin')))));

CREATE POLICY "Users can view originality results for accessible jobs"
ON public.originality_results FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.analysis_jobs j WHERE j.id = job_id AND (j.author_id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('editor', 'admin')))));

CREATE POLICY "Users can view author profiles"
ON public.author_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editorial reviews viewable by newsroom staff"
ON public.editorial_reviews FOR ALL TO authenticated
USING (true);
