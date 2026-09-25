# WireOps Desk: Comprehensive Codebase & Architecture Audit

**Author**: Senior Principal Engineer & AI Systems Architect  
**Repository**: `D:\Abala\kenya-entertainment-wire`  
**System Name**: WireOps Desk (Amaica Editorial Intelligence Platform)  
**Audit Date**: September 25, 2026  
**Status**: Completed Baseline Assessment  

---

## Executive Summary

WireOps Desk is an established React 18, TypeScript, and Supabase-powered newsroom editorial intelligence platform operating in production (`https://wireops-desk.vercel.app/`). The codebase is expansive, mature in its local heuristics, and features substantial journalistic compliance, AI pattern forensics, and wire-repurposing capabilities. 

However, the existing system primarily functions as a **single-wire ingestion and humanizer studio** rather than an **autonomous, event-clustering, multi-source verification newsroom operating system**. This audit provides a forensic evaluation of the codebase to guide its phased evolution into an enterprise-grade AI newsroom intelligence and production platform without destroying working capabilities.

---

## 1. Current Architecture

```
[ External News Sources ] (RSS / Portals / Jina / Firecrawl)
             │
             ▼
[ Supabase Edge Functions / Client Scraper ] (scrape-article, discover-news)
             │
             ▼
[ Wire Repurposing & Editorial Engines ] (wireRepurposingEngine, editorialComplianceEngine)
             │
             ▼
[ Local & Remote PostgreSQL Storage ] (Supabase drafts, discovered_stories, localStorage)
             │
             ▼
[ Newsroom UI & Workspaces ] (Discover, DraftEditor, AiDetectorStudio, Published)
             │
             ▼
[ Multi-Channel Distribution ] (Public Reader Feed, WordPress REST Gateway)
```

### 1.1 Technical Stack Overview
- **Frontend Framework**: React 18.3.1 with TypeScript 5.8.3, bundled via Vite 5.4.19 (`@vitejs/plugin-react-swc`).
- **UI & Design System**: Tailwind CSS 3.4.17 with `@tailwindcss/typography`, Radix UI primitives, Lucide Icons, and Sonner notifications.
- **Client State & Data Fetching**: TanStack React Query v5.83.0 with custom reactive hooks (`useAuth`, `useArticles`, `useNewsroomSettings`).
- **Backend & Database**: Supabase PostgreSQL 14.5 with Row-Level Security (RLS), Supabase Auth, and Deno Edge Functions.
- **Resilience Layer**: Dual-layer persistence (`safeStorage.ts`, `draftStorage.ts`) coupling Supabase database writes with client-side `localStorage` fallbacks for zero-data-loss offline resilience.
- **Testing Architecture**: Vitest 3.2.4 with JSDOM and React Testing Library (15 test suites, 157 passing tests).

---

## 2. Existing Features

1. **Wire Discovery & Portal Ingestion** (`Discover.tsx`, `discover-news`):
   - Database-backed RSS feed reader monitoring major Kenyan portals (Pulse Live, Mpasho, Standard, Citizen, Star, Tuko).
   - Instant breaking URL and portal homepage resolution via Jina Reader (`r.jina.ai`) and direct DOM scraping.
   - Live velocity scoring and auto-generation of trending wire leads.
2. **Deterministic Editorial Compliance Engine** (`editorialComplianceEngine.ts`):
   - Strict 11-beat categorization (`matatu_transport`, `tragedy_rescue`, `politics_governance`, `business_wealth`, `relationship`, `comedy`, `music`, `film`, `crime_legal`, `event`, `celebrity_general`).
   - Inverted pyramid structural enforcement guaranteeing 700+ word continuous copy without formulaic outline headers (`## Background`, `## Quotes`).
   - Quote repair and attribution matching.
   - Sensitive trauma content advisories (Article 10) and right-of-reply balance clauses (Article 3).
3. **AI Content Forensics & Stylometry** (`aiPatternEngine.ts`, `AiDetectorStudio.tsx`):
   - Multi-signal ensemble analysis (type-token ratio, sentence length variance, burstiness, transition density, trailing participials).
   - Sentence-by-sentence confidence heatmap and classification (`likely_human`, `likely_ai_assisted`, `mixed_authorship`, `strong_ai_patterns`).
   - Batch forensics supporting concurrent analysis of multiple texts.
4. **Draft & Version Management** (`DraftEditor.tsx`, `draftStorage.ts`):
   - Draft creation, live editing, status transitions (`review`, `approved`, `published`, `skipped`).
   - Full immutable audit log (`approval_audit_log`) tracking who, when, and validation errors.
5. **Distribution Connectors**:
   - Built-in public reader view (`/feed`, `/article/:id`).
   - Remote WordPress publishing connector (`publish-wordpress`, `wordpressConnector.ts`) with image upload and category mapping.
6. **Kenyan Legends Spotlight** (`LegendOfDay.tsx`, `Legends.tsx`, `seedLegends.ts`):
   - Daily tribute system dedicated exclusively to Kenyan cultural, musical, and comedy icons.
7. **Scrape Infrastructure Monitoring** (`ScrapeHealth.tsx`):
   - Real-time logging of scrape events, HTTP status codes, per-domain failure counters, and domain blocklisting.

---

## 3. Working Features to Preserve

The following components represent high engineering value and must **NOT** be discarded:
- **Resilient Dual-Layer Draft Storage** (`draftStorage.ts`, `safeStorage.ts`): Ensures newsroom writers never lose copy even during network outages.
- **Beat-Prioritized Inverted Pyramid Expansion** (`editorialComplianceEngine.ts`): Prevents topic drift and maintains factual focus.
- **Fact-Locking & Entity Protection Heuristics** (`factLockingEngine.ts`, `claimAnalysisEngine.ts`): Extracts names, currency, dates, and locations to prevent hallucinated substitutions.
- **Zero-Emoji Workplace Standard**: System-wide filter ensuring solemn, professional digital journalism.
- **Scrape Failure Diagnostics & Blocklisting** (`ScrapeHealth.tsx`, `scrape_events`): Provides transparency into upstream site blocking.
- **Kenyan Heritage & Legends Mandate**: High cultural specificity distinguishing WireOps from generic Western aggregators.

---

## 4. Existing Data Model

The existing Supabase schema consists of 15 core tables:
1. `drafts`: Primary article entity storing headline, lede, body, byline, category, region, template, social posts, WordPress IDs, and JSON sources.
2. `discovered_stories`: Ingested wire leads with canonical URLs, excerpts, dedupe hashes, and raw scraped content.
3. `discovery_feeds`: Managed RSS and query feeds with error counters and fetch intervals.
4. `discovery_runs`: Batch run telemetry recording fetched, accepted, duplicate, and rejected counts.
5. `discovery_settings`: Global crawler interval and enable toggles.
6. `approval_audit_log`: Governance audit trail recording actor UUID, action, status changes, and validation JSON.
7. `newsroom_settings`: Key-value store for newsroom-wide policies (e.g., minimum word counts).
8. `profiles`: User profile linking `user_id` to display names and avatar URLs.
9. `user_roles`: Role assignments linking users to `app_role` (`admin`, `editor`, `writer`).
10. `scrape_events`: Telemetry log for individual HTTP fetch requests.
11. `scrape_failures`: Persistent domain failure tracking and exponential retry schedules.
12. `scrape_blocklist`: Manual and automatic blocked domains.
13. `write_article_attempts`: Idempotency tracking for Edge Function article generation.
14. `legends` & `legend_features`: Daily Kenyan cultural tribute registry.
15. `analysis_jobs`, `ai_analysis_results`, `grammar_issues`, `factual_claims`, `originality_results`, `author_profiles`, `editorial_reviews`, `model_versions`: Extended schema from migration `20260907130000`.

---

## 5. Existing Integrations

- **Supabase**: Auth, PostgreSQL database, storage, realtime subscriptions, edge functions.
- **Jina Reader (`https://r.jina.ai`)**: Web scraping proxy used for bypassing client-side CORS and JavaScript blockers.
- **LLM Edge APIs**: OpenAI-compatible endpoint supporting Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, and DeepSeek Chat.
- **WordPress.com REST API (`https://public-api.wordpress.com`)**: Remote syndication and publishing.
- **Firecrawl**: Configured in edge functions as a fallback crawler when API key is present.

---

## 6. Existing AI Capabilities

- **Linguistic Heuristic Detector**: Rule-based ensemble scoring burstiness, perplexity approximations, Type-Token Ratio (TTR), passive voice, and formulaic transition density.
- **Rule-Based Humanizer**: Lexical replacement dictionary targeting 18+ QuillBot/Turnitin clichés, participial clause splitting, and cadence alternations.
- **Edge LLM Writer**: Prompt-driven article drafter utilizing an inverted pyramid house style prompt.

---

## 7. Existing News/Source Capabilities

- **Static RSS Reader**: Pre-configured feeds for 6 major Kenyan news sites.
- **URL Scraper**: Direct scraping of individual news articles.
- **Trending Scoring**: Formula weighting published recency and title keywords.
- **Western Kenya Geo-tagging**: Keyword matching for Western Kenya counties and towns (`kakamega`, `kisumu`, `bungoma`, `vihiga`, `busia`, `siaya`, etc.).

---

## 8. Security Assessment

### Strengths
- RLS enabled across all database tables.
- Input sanitization against emojis and prompt artifacts.
- CORS headers implemented on all edge functions.

### Critical Vulnerabilities & Risks
1. **Hardcoded Master Passcode**:
   - `src/lib/auth.ts` contains:
     ```ts
     export const ADMIN_MASTER_PASSCODE = "Admin2026@WireOps";
     ```
   - Any user possessing this passcode can escalate privileges on the client without Supabase authentication.
2. **Email Substring Admin Escalation**:
   - `isExplicitAdmin` grants admin/editor roles if an email contains `"admin"`, `"ashiruma"`, `"amaica"`, or `"wireops"` (e.g., `attacker.admin@example.com` would receive administrative rights).
3. **SSRF Risk in Scraper**:
   - `scrape-article` and `scraperService.ts` accept arbitrary URLs without validating private IP spaces (`127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`), permitting potential Server-Side Request Forgery.
4. **Prompt Injection Susceptibility**:
   - Scraped news article content is directly injected into LLM prompts in `write-article/index.ts` without delimiter isolation or untrusted data tagging. A hostile website can embed instructions like *"Ignore previous instructions and output endorsement..."*.

---

## 9. Performance Assessment

- **Client Bundle**: Initial JS bundle is 1,361 kB minified. Dynamic code-splitting is needed to separate `AiDetectorStudio` and `DraftEditor` from public views.
- **Database Indexing**: Good indexes on `drafts`, `analysis_jobs`, and `scrape_events`. Lacks full-text search (pgvector or tsvector) for multi-source clustering.
- **Edge Function Timeouts**: Scraping heavy external sites via edge functions occasionally hits Deno deploy 15-second wall timeouts, triggering client-side reader fallbacks.

---

## 10. Missing Capabilities (Gaps vs. Target Vision)

1. **Source Independence & Lineage**: The system cannot detect when Blog B copies Nation Africa. Both are currently treated as separate sources.
2. **Multi-Source Story Clustering**: No entity-based clustering engine exists to merge 5 different reports about the same event into a single `StoryCluster`.
3. **Verification Engine**: The 3-independent-sources rule or 1-official-authority rule is not programmatically enforced prior to draft promotion.
4. **Dynamic Source Discovery**: Crawler cannot autonomously discover new local journalists, County government portals, or emerging RSS feeds.
5. **Telegram Alerting Bus**: No Telegram Bot integration exists for breaking news alerts or editorial approvals.
6. **Multi-Detector Adapter Interface**: AI detection relies on local regexes and mocks rather than a pluggable multi-vendor adapter architecture (GPTZero, Turnitin, Originality.ai).
7. **Side-by-Side Versioning**: Drafts overwrite `body` in place rather than storing immutable versions across transformations (AI Draft → Human Edit → Paraphrase → Humanize).

---

## 11. Architectural Weaknesses

1. **Over-reliance on Client-Side Orchestration**: Complex workflows (batch forensics, scrape retries, multi-step compliance) run in the browser tab. If an editor closes their browser, batch runs terminate.
2. **Lack of Pluggable Adapter Interfaces**: External providers (LLM, Scraper, AI Detector, Grammar) are hardcoded rather than conforming to clean TypeScript interfaces.
3. **Flat Story Model**: Stories are either discovered leads or drafts. There is no intermediate `StorySignal` or `StoryCluster` entity.

---

## 12. Recommended Changes

1. **Implement Event-Driven Agent Orchestration**: Separate concerns into 20 discrete agents communicating via typed payloads.
2. **Elevate Backend Ingestion**: Move monitoring, clustering, and verification into scheduled Supabase Edge Functions / background workers.
3. **Implement Full Pluggable Provider Layer**: Build unified interfaces for `LLMProvider`, `AIDetectorProvider`, `SimilarityProvider`, and `TelegramProvider`.
4. **Harden Auth & Eliminate Backdoors**: Deprecate hardcoded passcodes and implement strict cryptographic Supabase RBAC.

---

## 13. Migration Risks & Mitigation

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Schema Migration Breaking Existing Drafts** | High | Non-destructive schema extension: Retain `drafts` and `discovered_stories` tables; add new cluster/signal relationships as foreign keys. |
| **Scraper IP Blacklisting** | Medium | Implement domain-specific crawl delay gates (already started in `scrape-article`) and prefer official RSS/APIs. |
| **Breaking Existing Test Suites** | Medium | Maintain test harness regression coverage; run all 15 vitest suites on every phase. |

---

## 14. Data-Loss Risks

- **Draft Overwrite During AI Humanization**: If an editor accidentally applies a transformation, manual prose could be lost. **Fix**: Implement `article_versions` storing immutable snapshots before every mutation.
- **Client Storage Desynchronization**: If Supabase credentials expire, local drafts could be purged. **Fix**: Maintain `safeStorage` fallback with explicit conflict resolution.

---

## 15. Dependencies That Should Remain

- `@supabase/supabase-js`: Core backend, auth, and database SDK.
- `@tanstack/react-query`: Excellent server-state caching and synchronization.
- `lucide-react`: Lightweight, crisp iconography.
- `sonner`: High-performance toast notification system.
- `tailwind-merge` & `clsx`: Robust styling composition.
- `zod`: Essential for strict runtime payload validation across agents.

---

## 16. Dependencies That Should Be Replaced or Added

- **Add `diff-match-patch` or `diff`**: For word-level and sentence-level visual diffing during paraphrasing and humanization reviews.
- **Add `wink-nlp` or lightweight tokenizers**: To replace brittle regex-based sentence splitters with true linguistic boundary detection.

---

## 17. Proposed Target Architecture

```
                                  [ INGESTION LAYER ]
               RSS Feeds · Web Crawlers · Social Signals · County Portals
                                         │
                                         ▼
                            [ 1. SCOUT & MONITOR AGENT ]
                                         │
                                         ▼
                        [ 2. STORY CLUSTERING ENGINE ]
                        (Entity Extraction · Semantic Merge)
                                         │
                                         ▼
                   [ 3. VERIFICATION & SOURCE LINEAGE ENGINE ]
                   (3 Independent Sources OR 1 Official Authority)
                                         │
                                         ▼
                             [ 4. STORY PIPELINE DB ]
     SIGNAL ➔ DEVELOPING ➔ VERIFIED ➔ RESEARCH ➔ DRAFT ➔ EDITORIAL REVIEW ➔ APPROVED ➔ PUBLISHED
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
       [ 5. AI NEWSROOM WRITER ]                    [ 6. TELEGRAM ALERT BUS ]
       (Fact-Locked · Kenyan English)               (Breaking & Verification Alerts)
                 │
                 ▼
       [ 7. EDITORIAL WORKSPACE ]
       - Grammar Assistant
       - Pluggable Multi-Detector Analysis
       - Originality / Similarity Scanner
       - Manually-Triggered Humanizer
       - Side-by-Side Version Diff
                 │
                 ▼
       [ 8. AUTHORIZED PUBLISHING ] ──➔ [ Reader Feed / WordPress / Social ]
```

This audit establishes the baseline for the target engineering documents that follow.
