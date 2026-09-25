# WireOps Desk: Specialized Agent & Tool Specifications

**Document**: WireOps Agent Specifications  
**Author**: Senior Principal Engineer & AI Systems Architect  
**Version**: 2.0.0  
**Status**: Specification Baseline  

---

## 1. Architectural Principles for Agents

1. **No Monolithic "All-Knowing" Agents**: Monolithic prompts that attempt to scout, verify, write, and publish in a single prompt suffer from severe prompt drift, hallucinations, and catastrophic loss of instructions. WireOps Desk decomposes these functions into 20 discrete agents and tools.
2. **Deterministic Guardrails Over Autonomous Actions**: Critical operations (verification thresholds, defamation hedging, quote preservation, publication permissions) are controlled by deterministic code, not probabilistic model guesses.
3. **Structured Typed Contracts**: Every agent communicates via explicit JSON schemas (enforced via TypeScript and Zod). Unstructured conversational chatter between agents is prohibited.
4. **Prompt Injection Hardening**: All external content (news headlines, scraped body text, social posts) is treated strictly as **UNTRUSTED DATA** isolated within structural boundaries, never executed as instruction sets.
5. **Explicit Manual Invocation for Rewriting Tools**: The **Humanization Tool** and **Paraphrasing Tool** must never run automatically in background queues. They are strictly initiated by a human editor with side-by-side visual diff reviews.

---

## 2. Core Agent Specifications

---

### Agent 1: Scout Agent
* **Role**: High-Frequency Information Crawler & Signal Detector
* **Execution Trigger**: Cron schedule every 1–5 minutes
* **Inputs**: Registered sources list (`discovery_feeds`), crawl queue, domain rate limits.
* **Responsibilities**:
  * Ingest RSS feeds, portal category pages, official government press feeds, and emergency police/court notices.
  * Extract title, link, published timestamp, raw HTML, and author credits.
  * Compute URL canonicalization and SHA-256 content hashes to prevent duplicate ingestion.
  * Respect `robots.txt`, crawl delays, and domain backoff gates.
* **Outputs**: `RawStorySignal[]`
* **Failure Modes**: Upstream 403/429 status codes; timeouts; malformed RSS XML. Handled via exponential backoff and domain failure logging to `scrape_failures`.

```typescript
export interface RawStorySignal {
  signalId: string;
  sourceId: string;
  sourceDomain: string;
  sourceUrl: string;
  canonicalUrl: string;
  rawTitle: string;
  rawText: string;
  heroImageUrl?: string;
  authorName?: string;
  publishedAt: string;
  detectedAt: string;
  contentHash: string;
}
```

---

### Agent 2: Source Discovery Agent
* **Role**: Autonomous Information Channel Scout
* **Execution Trigger**: Hourly / Daily scheduled batch
* **Inputs**: Outgoing external links from scraped stories, journalist bylines, and county portal directories.
* **Responsibilities**:
  * Scan for newly referenced local publications, verified journalist blogs, county assembly press portals, and police division noticeboards.
  * Test RSS/Atom availability on candidate domains.
  * Classify candidate into initial source tiers (`trusted_local`, `official_source`, `social_source`, `unverified_source`).
  * Queue newly discovered sources for Administrator review and override.
* **Outputs**: `DiscoveredSourceProposal[]`

---

### Agent 3: Trend Agent
* **Role**: Information Velocity & Momentum Analyzer
* **Execution Trigger**: Periodic (every 10 minutes) & Event-Driven on new signal arrival
* **Inputs**: Ingested signals across the last 24 hours.
* **Responsibilities**:
  * Calculate publication velocity (rate of new articles appearing across distinct outlets over a 30-minute window).
  * Compute the **Trending Momentum Score** (0–100) based on cross-outlet acceleration, local interest keyword weighting, and recency decay.
  * **Critical Guardrail**: Outputs a *Priority Signal*, NOT a *Verification Signal*. High momentum never implies factual verification.
* **Outputs**: `StoryMomentumUpdate { clusterId: string; velocityScore: number; isSurging: boolean }`

---

### Agent 4: Story Clustering Agent
* **Role**: Multi-Source Event Aggregator & Deduplication Engine
* **Execution Trigger**: Event-driven on arrival of new signals
* **Inputs**: Incoming `RawStorySignal`, active story clusters within a rolling 72-hour window.
* **Responsibilities**:
  * Extract Named Entities (Person, Location, Organization, Date, Event Type) using deterministic regexes and fast embeddings.
  * Compute semantic and entity overlap score against active clusters.
  * Merge matching signals into an existing `StoryCluster` or instantiate a new cluster candidate.
  * Support Newsroom Editor actions: **Merge Clusters**, **Split Cluster**, **Move Signal**, **Mark False Match**.
* **Outputs**: `StoryCluster`

```typescript
export interface StoryCluster {
  clusterId: string;
  workingHeadline: string;
  category: string;
  primaryLocation: string;
  firstDetectedAt: string;
  lastSignalAt: string;
  signalCount: number;
  signals: RawStorySignal[];
  extractedEntities: {
    people: string[];
    locations: string[];
    organizations: string[];
  };
  status: "SIGNAL" | "DEVELOPING" | "VERIFIED" | "EDITORIAL_REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED";
  isPotentialExclusive: boolean;
}
```

---

### Agent 5: Geographic Intelligence Agent
* **Role**: Local Spatial Relevance & Western Kenya Hierarchy Evaluator
* **Execution Trigger**: Invoked on story clustering and intake
* **Inputs**: `StoryCluster` headline, body text, locations, and source domain.
* **Responsibilities**:
  * Map mentions against a structured Kenyan geographic taxonomy:
    * **Tier 1 (Core Focus)**: Kakamega County (Lurambi, Malava, Shinyalu, Ikolomani, Butere, Mumias, Matungu, Navakholo).
    * **Tier 2 (Western Corridor)**: Vihiga, Bungoma, Busia, Siaya, Trans Nzoia, Nandi.
    * **Tier 3 (National / Regional)**: Nairobi, Kisumu, Nakuru, Mombasa, Eldoret, East Africa.
    * **Tier 4 (International / World)**.
  * Calculate `geographicRelevanceScore` (0–100), boosting Kakamega and Western Kenya leads to the top of newsroom discovery desks.
* **Outputs**: `GeoRelevanceResult { tier: number; primaryCounty: string; town?: string; relevanceScore: number }`

---

### Agent 6: Celebrity Intelligence Agent
* **Role**: Kenyan Entertainer & Emerging Creator Tracker
* **Execution Trigger**: Intake pipeline hook
* **Inputs**: Entities extracted from story clusters, matched against the WireOps Celebrity Registry.
* **Responsibilities**:
  * Cross-reference personalities against the database of musicians (Benga, Ohangla, Gengetone, Afrobeats), comedians, actors, radio hosts, and digital creators.
  * Detect **Emerging Personalities** based on unusual, legitimate cross-platform reporting spikes without historical registry entries.
  * **Strict Ethics Guardrail**: Prohibit inference of private personal data; prohibit fabrication of relationships, health claims, or controversies.
* **Outputs**: `CelebrityContext { matchedCelebrities: string[]; isEmergingCreator: boolean }`

---

### Agent 7: Verification Agent
* **Role**: Source Independence & Truth Gatekeeper
* **Execution Trigger**: Cluster update event
* **Inputs**: `StoryCluster`, `SourceRegistry`, Source Lineage Graph.
* **Responsibilities**:
  * Execute Source Lineage Analysis to distinguish between original reports, secondary rewrites, syndication, and copied blogs.
  * Enforce the **WireOps Truth Doctrine**:
    * **Rule A**: At least **THREE (3)** genuinely independent sources confirm the core factual claims.
    * **OR Rule B**: At least **ONE (1)** approved official accountable authority confirms the information (e.g., Police statement, Court filing, County Government Gazette, authenticated direct institutional representative).
  * Block promotion to `VERIFIED` status if sources merely copy each other.
* **Outputs**: `VerificationRecord`

```typescript
export interface VerificationRecord {
  clusterId: string;
  isVerified: boolean;
  verificationRuleApplied: "THREE_INDEPENDENT_SOURCES" | "OFFICIAL_AUTHORITY" | "INSUFFICIENT_EVIDENCE";
  independentSourceCount: number;
  totalSourceCount: number;
  independentSources: Array<{ sourceId: string; domain: string; tier: string; originalReportUrl: string }>;
  unresolvedDiscrepancies: string[];
  recommendation: "PROMOTE_TO_VERIFIED" | "KEEP_DEVELOPING" | "REJECT_UNSUBSTANTIATED";
}
```

---

### Agent 8: Research Agent
* **Role**: Evidence File & Claim Assembler
* **Execution Trigger**: Upon a cluster transitioning to `VERIFIED`
* **Inputs**: `StoryCluster`, verified source documents.
* **Responsibilities**:
  * Extract verifiable claims: Who did what, when, where, key numbers, ticket prices, dates, and locations.
  * Extract verbatim quotes with exact speaker attribution.
  * Build the internal **Article Research File** displaying every claim alongside its primary source URL and confidence level.
* **Outputs**: `ResearchPacket`

```typescript
export interface ResearchPacket {
  clusterId: string;
  claims: Array<{
    claimText: string;
    claimType: "fact" | "attributed_quote" | "allegation" | "background";
    sourceUrl: string;
    sourceDomain: string;
    confidence: "high" | "medium";
  }>;
  verifiedQuotes: Array<{
    quoteText: string;
    speaker: string;
    speakerTitle: string;
    sourceUrl: string;
  }>;
  knownFacts: string[];
  unknownGaps: string[];
}
```

---

### Agent 9: Writer Agent
* **Role**: Inverted-Pyramid Digital Newsroom Copy Drafter
* **Execution Trigger**: On-demand by editor or auto-draft queue for verified stories
* **Inputs**: `ResearchPacket`, `EditorialStyleGuide`, target length (700–1200 words).
* **Responsibilities**:
  * Write disciplined, modern digital journalism in **Kenyan English**.
  * Structure copy into continuous inverted-pyramid paragraphs (Lede, Context, Attributed Quotes, Scene History, Regional Significance, Forward Outlook).
  * **Strict Bans**: Absolute prohibition on formulaic outline markdown headers (`## Background`, `## Quotes`), trailing participial clauses (e.g., *", highlighting..."*, *", ensuring..."*), and AI hype clichés.
  * **Fact Lock**: Distinguish between established facts and attributed allegations. Never manufacture missing background.
* **Outputs**: `ArticleDraft`

---

### Agent 10: Expansion Agent
* **Role**: Contextual & Historical Scene Deepener
* **Execution Trigger**: Invoked when an article falls below target length (700 words) but possesses legitimate scene history.
* **Responsibilities**:
  * Query verified regional background archives (e.g., previous concert tours, previous county legislative sessions, transport SACCO history).
  * Append strictly on-beat inverted-pyramid background paragraphs.
  * **Safety Gate**: If insufficient verified factual material exists, the agent outputs:  
    `"INSUFFICIENT VERIFIED MATERIAL FOR TARGET LENGTH"`  
    It must **NEVER** manufacture unverified filler or hallucinate quotes.
* **Outputs**: `ExpandedArticleDraft`

---

### Agent 11: Editorial Policy Agent
* **Role**: Machine-Readable Governance Auditor
* **Execution Trigger**: Pre-save and pre-publish validation gate
* **Inputs**: Article headline, lede, body, sources, author ID.
* **Responsibilities**:
  * Evaluate article against the 17 machine-readable policy clauses.
  * Verify quote preservation (no direct quotes altered).
  * Verify legal defamation hedging on sensitive claims.
  * Enforce the strict **Zero-Emoji Workplace Standard**.
  * Mandate human approval before publication.
* **Outputs**: `PolicyAuditResult { passed: boolean; violations: EditorialViolation[]; approvable: boolean }`

---

### Agent 12: Grammar Agent
* **Role**: Newsroom Syntax, Readability & Burstiness Engine
* **Execution Trigger**: Interactive in Draft Editor
* **Inputs**: Article text.
* **Responsibilities**:
  * Identify spelling errors, grammatical inconsistencies, and punctuation defects.
  * Evaluate sentence length burstiness (requiring at least 25% short sentences under 7 words).
  * Detect passive voice overuse, repetitive sentence openers, and awkward phrasing.
  * Provide reviewable, individually accept/rejectable suggestions without overwriting copy.
* **Outputs**: `GrammarReport { suggestions: GrammarSuggestion[]; readabilityScore: number }`

---

### Agent 13: Originality & Similarity Agent
* **Role**: Plagiarism & Cross-Source Duplication Detector
* **Execution Trigger**: Interactive in Draft Editor & Pre-Publishing Audit
* **Inputs**: Article draft text, database of previous WireOps articles, external search indices.
* **Responsibilities**:
  * Scan for exact-string matches, near-duplicates, and patchwork similarity.
  * Distinguish properly attributed direct quotations from unattributed copied prose.
  * Compute similarity score percentage, highlighting matching passages and source URLs.
* **Outputs**: `SimilarityReport { similarityScore: number; matches: SimilarityMatch[]; passesOriginality: boolean }`

---

### Agent 14: AI Writing Analysis Agent
* **Role**: Multi-Detector Forensics Orchestrator
* **Execution Trigger**: Interactive in Draft Editor & AI Detector Studio
* **Inputs**: Article text.
* **Responsibilities**:
  * Dispatch text through pluggable provider adapters (e.g., Turnitin adapter, GPTZero adapter, internal 15-signal ensemble classifier).
  * Normalize detector scores and detect consensus or divergence.
  * Display transparent sentence-by-sentence heatmap.
  * Explicitly communicate: *"AI detection is probabilistic and can produce false positives and false negatives."*
* **Outputs**: `AIDetectionReport { overallSignal: string; detectorScores: Record<string, number>; sentenceHeatmap: any[] }`

---

### Agent 15: SEO Agent
* **Role**: Editorial Metadata & Discovery Optimizer
* **Execution Trigger**: Pipeline hook during draft preparation
* **Inputs**: Verified article copy.
* **Responsibilities**:
  * Generate primary SEO headline (within 60 characters), clean slug, meta description (140–160 characters), and focus entities.
  * **Rule of Primacy**: SEO considerations must **NEVER** override factual accuracy or compromise journalistic tone.
* **Outputs**: `SEOPackage { seoHeadline: string; slug: string; metaDescription: string; entities: string[] }`

---

### Agent 16: Social & Distribution Agent
* **Role**: Multi-Channel Audience Copywriter
* **Execution Trigger**: Draft finalization
* **Inputs**: Verified headline, lede, key quotes.
* **Responsibilities**:
  * Generate platform-specific dispatches:
    * **Facebook**: Contextual, community-focused narrative copy.
    * **X (Twitter)**: Concise, fact-first update without hashtags or sensationalism.
    * **Telegram**: Newsroom breaking card format with verification badge.
* **Outputs**: `SocialDistributionPackage { facebookCopy: string; xCopy: string; telegramCopy: string }`

---

### Agent 17: Telegram Alert Agent
* **Role**: Urgent Newsroom Messaging & Alert Dispatcher
* **Execution Trigger**: Event-driven on Breaking News, Verification Events, or System Failures
* **Inputs**: Alert payload, authorized Telegram Channel/Chat ID, Bot Token.
* **Responsibilities**:
  * Format concise newsroom alert cards (Topic, Location, Sources, Verification Status, Action Link).
  * Dispatch via secure Telegram Bot API.
  * Support authorized editor commands (`/verify <id>`, `/status`).
* **Outputs**: `TelegramDispatchResult { delivered: boolean; messageId?: string }`

---

### Agent 18: Publishing Agent
* **Role**: Multi-Target Dispatch & Authorization Validator
* **Execution Trigger**: Manually triggered by authorized Editor/Admin
* **Inputs**: Draft ID, user credentials, destination targets (Public Web, WordPress).
* **Responsibilities**:
  * Verify user possesses explicit `editor` or `admin` role in `user_roles`.
  * Validate that the draft has passed all 17 editorial policy rules.
  * Execute atomic publication to the public reader site and remote WordPress REST API.
  * Record immutable publication audit log entry.
* **Outputs**: `PublishingResult { publishedUrl: string; status: "success" | "failed" }`

---

### Agent 19: Humanization Tool
* **Role**: Manual Editorial Naturalization & Rhythm Polisher
* **Execution Trigger**: **EXPLICITLY TRIGGERED BY HUMAN EDITOR ONLY**
* **Responsibilities**:
  * Improve natural sentence rhythm, eliminate stiffness, and inject authentic Kenyan digital newsroom cadence.
  * **Entity Protection Gate**: Strictly preserve 100% of named entities, numbers, dates, locations, and verbatim quotes.
  * Display side-by-side comparison (Original vs. Humanized).
  * Allow editor to **Accept All**, **Accept Individual Sentence**, or **Reject**.
  * **Critical Directive**: Never claim or market a guarantee of "bypassing AI detectors"; focus solely on writing quality.
* **Outputs**: `HumanizationReviewSession { original: string; proposed: string; diffs: any[] }`

---

### Agent 20: Paraphrasing Tool
* **Role**: Controlled Rewriter for Sentence, Paragraph & Article Levels
* **Execution Trigger**: **EXPLICITLY TRIGGERED BY HUMAN EDITOR ONLY**
* **Inputs**: Selected text, mode (`LIGHT` | `MEDIUM` | `HEAVY`), target level (`SENTENCE` | `PARAGRAPH` | `ARTICLE`).
* **Responsibilities**:
  * Restructure syntax while locking all factual assertions, proper nouns, and quoted speech.
  * Render side-by-side diff with individual replacement toggles.
* **Outputs**: `ParaphraseResult { originalText: string; paraphrasedText: string; replacements: any[] }`

---

## 3. Inter-Agent Communication Contracts (Summary)

To ensure interoperability, the agents rely on standard data contracts:
- `RawStorySignal`: Ingested data from the web.
- `StoryCluster`: Clustered events across multiple sources.
- `VerificationRecord`: Output of the 3-source or official authority evaluation.
- `ResearchPacket`: Factual assertions and quotes ready for drafting.
- `ArticleDraft`: The full generated inverted-pyramid copy.
- `PolicyAuditResult`: The compliance assessment against all 17 governance articles.
- `PublishingDecision`: The human editor's final authorized release directive.
