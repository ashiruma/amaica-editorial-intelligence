# WireOps Desk: Target System Architecture

**Document**: WireOps Desk Target Architecture  
**Author**: Senior Principal Engineer, AI Systems Architect & Technical Lead  
**Version**: 2.0.0-PROD  
**Status**: Architecture Baseline  

---

## 1. System Vision & Architectural Philosophy

WireOps Desk is engineered not as a generic article generation wrapper, but as an **AI-powered Newsroom Operating System** designed for high journalistic accuracy, source verification, regional Western Kenya focus, and absolute editorial integrity.

### Core Architectural Laws
1. **Separation of Verification from Popularity**: High social engagement or viral reach is a priority signal, NEVER a verification signal. A story with 100,000 views remains unverified if independent evidence is missing. A story with 100 views can be verified if primary accountable evidence exists.
2. **Deterministic Governance Over Black-Box LLMs**: Verification rules, editorial policy compliance, quote preservation, and entity locking are executed via deterministic, auditable software engines. AI models assist in synthesis, but rule enforcement is deterministic.
3. **Multi-Agent Specialization with Structured Payloads**: Rather than a monolithic LLM prompt, 20 specialized agents and tools interact using typed JSON schemas (`StorySignal`, `StoryCluster`, `VerificationRecord`, etc.).
4. **Human-in-the-Loop Supremacy**: Publication requires explicit human authorization. The Humanization Tool and Paraphrasing Tool NEVER execute silently in the background; they are explicitly invoked, inspected, and approved by an editor.

---

## 2. High-Level System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    1. INGESTION SUBSYSTEM                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │ National Portals │  │ Western KE Feeds │  │  County Portals  │  │ Social / Discovered │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └──────────┬──────────┘  │
│           └─────────────────────┼─────────────────────┼───────────────────────┘             │
│                                 ▼                                                           │
│                     [ 1. SCOUT & MONITOR AGENT ] (1-5m cycle)                               │
│                     [ 2. SOURCE DISCOVERY AGENT ] (discovers new feeds)                     │
└─────────────────────────────────┬───────────────────────────────────────────────────────────┘
                                  │ Raw Signals
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                2. CLUSTERING & LINEAGE SUBSYSTEM                            │
│                                                                                             │
│  ┌──────────────────────────────┴──────────────────────────────┐                            │
│  │                 [ 4. STORY CLUSTERING AGENT ]               │                            │
│  │  - Entity Resolution (NER)      - Semantic Vector Embeddings │                            │
│  │  - Location & Landmark Matching - Quotation / Headline Overlap │                            │
│  └──────────────────────────────┬──────────────────────────────┘                            │
│                                 ▼                                                           │
│                 [ 5. SOURCE INDEPENDENCE & LINEAGE ENGINE ]                                 │
│      Classifies: Original Report | Secondary | Syndicated | Copied | Social Echo            │
└─────────────────────────────────┬───────────────────────────────────────────────────────────┘
                                  │ Clustered Story Candidate
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           3. VERIFICATION & INTELLIGENCE SUBSYSTEM                          │
│                                                                                             │
│  ┌──────────────────────────────┴──────────────────────────────┐                            │
│  │                   [ 7. VERIFICATION AGENT ]                 │                            │
│  │  Criteria: (3 Independent Sources) OR (1 Official Accountable Authority)                 │
│  └──────────────────────────────┬──────────────────────────────┘                            │
│                                 │                                                           │
│      ┌──────────────────────────┼──────────────────────────┐                                │
│      ▼                          ▼                          ▼                                │
│ [ 5. GEOGRAPHIC AGENT ]   [ 6. CELEBRITY AGENT ]   [ 3. TREND AGENT ]                       │
│ (Kakamega Tier 1 Boost)   (Emerging & Icon Watch)  (Velocity & Momentum)                    │
│                                 │                                                           │
│                                 ▼                                                           │
│                     [ 8. RESEARCH & EVIDENCE AGENT ]                                        │
│               Constructs Structured Evidence Claim Registry                                 │
└─────────────────────────────────┬───────────────────────────────────────────────────────────┘
                                  │ Verified Research Packet
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               4. DRAFTING & COMPLIANCE SUBSYSTEM                            │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐                            │
│  │                    [ 9. WRITER AGENT ]                      │                            │
│  │  Kenyan English · Inverted Pyramid · 700-1200 Words Target   │                            │
│  │  Fact-Attributed · Zero Trailing Participials · Zero Halluc.│                            │
│  └──────────────────────────────┬──────────────────────────────┘                            │
│                                 ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐                            │
│  │              [ 11. EDITORIAL POLICY AGENT ]                 │                            │
│  │  17 Machine-Readable Articles · Zero Emoji · Defamation Gate │                            │
│  │  Quote Preservation Guarantee · Sensitive Content Advisory  │                            │
│  └──────────────────────────────┬──────────────────────────────┘                            │
│                                 │                                                           │
│        ┌────────────────────────┴────────────────────────┐                                  │
│        ▼                                                 ▼                                  │
│ [ 15. SEO AGENT ]                             [ 16. SOCIAL AGENT ]                          │
│ (Slug, Meta, Entities)                        (Facebook, X, Telegram Copy)                  │
└─────────────────────────────────┬───────────────────────────────────────────────────────────┘
                                  │ Story Draft + Verification Evidence
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               5. EDITORIAL CONTROL WORKSPACE                                │
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         [ NEWSROOM EDITORIAL CONTROL ROOM ]                           │  │
│  │  Live Monitor · Story Pipeline · Kakamega Hub · Verification Queue · Version History  │  │
│  └──────────────────────────────┬────────────────────────────────────────────────────────┘  │
│                                 │                                                           │
│     ┌───────────────────────────┼───────────────────────────┐                               │
│     ▼                           ▼                           ▼                               │
│ [ 12. GRAMMAR AGENT ]  [ 19. HUMANIZATION TOOL ]  [ 20. PARAPHRASING TOOL ]                 │
│ (Grammarly-Equivalent  (Manually Triggered        (Sentence / Para / Article                │
│  Style & Clarity)       Local Voice Polish)        Side-by-Side Review)                     │
│                                 │                                                           │
│     ┌───────────────────────────┴───────────────────────────┐                               │
│     ▼                                                       ▼                               │
│ [ 14. MULTI-DETECTOR AI ORCHESTRATOR ]    [ 13. ORIGINALITY & SIMILARITY AGENT ]            │
│ (GPTZero, Turnitin Adapter, Consensus)     (Web Similarity, Internal Duplicate Match)       │
└─────────────────────────────────┬───────────────────────────────────────────────────────────┘
                                  │ Authorized Human Approval
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           6. PUBLISHING & NOTIFICATION SUBSYSTEM                            │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐                            │
│  │                  [ 18. PUBLISHING AGENT ]                   │                            │
│  │  Role Check (Editor/Admin) · Gate Validation · WordPress    │                            │
│  │  Public Web Syndication · Social Broadcaster                │                            │
│  └──────────────────────────────┬──────────────────────────────┘                            │
│                                 │                                                           │
│                                 ▼                                                           │
│                    [ 17. TELEGRAM ALERT AGENT ]                                             │
│       Breaking News Pushes · Verification Alerts · Editor Action Cards                      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Specialized Agent & Tool Topology (20 Units)

The system decomposes newsroom intelligence into 20 specialized units:

| # | Agent / Tool Name | Execution Mode | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **1** | **Scout Agent** | Scheduled (1–5 min) | Continuous polling of registered feeds, web portals, county pages, and RSS sources. |
| **2** | **Source Discovery Agent** | Scheduled (Daily/Hourly) | Analyzes external links, credits, and citations to discover new credible local sources. |
| **3** | **Trend Agent** | Event-Driven / Periodic | Measures momentum, social velocity, and coverage acceleration across signals. |
| **4** | **Story Clustering Agent** | Event-Driven | Merges multiple incoming reports about the same event into unified story clusters. |
| **5** | **Geographic Intelligence Agent** | Pipeline Hook | Evaluates local relevance, boosting Kakamega (Tier 1) and Western Kenya corridors. |
| **6** | **Celebrity Intelligence Agent** | Pipeline Hook | Tracks established Kenyan personalities and detects unusual spikes in emerging creators. |
| **7** | **Verification Agent** | Deterministic Engine | Enforces the 3-Independent-Sources or 1-Official-Authority rule. Prevents unverified promotion. |
| **8** | **Research Agent** | Event-Driven | Extracts factual claims, quotes, figures, and builds the verifiable evidence packet. |
| **9** | **Writer Agent** | Event-Driven / On-Demand | Produces continuous Kenyan English inverted-pyramid drafts (700–1200 words). |
| **10** | **Expansion Agent** | On-Demand | Deepens contextual scene history without fabricating unverified claims. |
| **11** | **Editorial Policy Agent** | Deterministic Gate | Audits copy against 17 machine-readable articles; blocks unhedged claims and emojis. |
| **12** | **Grammar Agent** | Interactive / On-Demand | Checks syntax, spelling, clarity, sentence variety, and cadenced burstiness. |
| **13** | **Originality / Similarity Agent**| Interactive / On-Demand | Performs web similarity, cross-checks internal archives, and identifies copied phrases. |
| **14** | **AI Writing Analysis Agent** | Interactive / On-Demand | Pluggable multi-detector orchestrator (Turnitin, GPTZero, ensemble heuristics). |
| **15** | **SEO Agent** | Pipeline Hook | Generates fact-aligned SEO headlines, clean slugs, meta descriptions, and entities. |
| **16** | **Social Distribution Agent** | Pipeline Hook | Crafts tailored copy for Facebook, X, and Telegram without exaggerating facts. |
| **17** | **Telegram Alert Agent** | Event-Driven | Dispatches breaking cards, verification updates, and editorial action requests. |
| **18** | **Publishing Agent** | Human-Triggered | Enforces role permissions and executes dispatches to WordPress and public endpoints. |
| **19** | **Humanization Tool** | **MANUALLY TRIGGERED** | Naturalizes rhythm and tone with side-by-side diff review. Never runs silently. |
| **20** | **Paraphrasing Tool** | **MANUALLY TRIGGERED** | Rewrites sentences, paragraphs, or copy in Light/Medium/Heavy modes with entity locks. |

---

## 4. Provider Abstraction Layers

To prevent vendor lock-in and support seamless replacements, all third-party integrations operate through abstract TypeScript interfaces:

```typescript
// 1. LLM Provider Interface
export interface LLMProvider {
  name: string;
  generateText(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>;
  generateStructured<T>(prompt: string, schema: any): Promise<T>;
  isConfigured(): boolean;
}

// 2. AI Detector Provider Interface
export interface AIDetectorProvider {
  name: string;
  analyzeText(text: string): Promise<{
    provider: string;
    score: number; // 0 to 100
    confidence: "low" | "medium" | "high";
    highlightedSentences: Array<{ text: string; score: number }>;
    isConfigured: boolean;
  }>;
}

// 3. Similarity Provider Interface
export interface SimilarityProvider {
  name: string;
  checkSimilarity(text: string): Promise<{
    similarityScore: number;
    matches: Array<{ sourceTitle: string; sourceUrl: string; matchedSnippet: string; similarity: number }>;
    isConfigured: boolean;
  }>;
}

// 4. News Source Provider Interface
export interface NewsSourceProvider {
  name: string;
  fetchLatest(endpoint: string): Promise<RawStorySignal[]>;
}

// 5. Telegram Provider Interface
export interface TelegramProvider {
  sendAlert(alert: TelegramNewsAlert): Promise<{ success: boolean; messageId?: string; error?: string }>;
  isConfigured(): boolean;
}

// 6. Publishing Provider Interface
export interface PublishingProvider {
  name: string;
  publish(payload: PublishingPayload): Promise<{ success: boolean; postUrl?: string; postId?: string; error?: string }>;
}
```

---

## 5. Staged Intelligence & Cost-Control Architecture

To eliminate runaway LLM API expenses, WireOps Desk implements a strict 5-stage funnel:

```
[ Stage 1: Ingestion ] ──────> Regex / String Deduplication (0 Tokens)
[ Stage 2: Clustering ] ─────> Fast Local Embedding / Exact Matching (0 LLM Tokens)
[ Stage 3: Verification ] ───> Deterministic Source Registry Heuristics (0 LLM Tokens)
[ Stage 4: Writing ] ────────> High-Capability Model (Only for Verified / Developing Leads)
[ Stage 5: Review & Polish ] ─> On-Demand Editor Invocation (Only when Requested)
```

- **Rule**: Never run an LLM against every raw RSS entry every 3 minutes.
- **Rule**: Free/cheap local heuristics handle filtering, deduplication, and initial classification.
- **Rule**: Expensive reasoning is reserved strictly for promising, verified story clusters.

---

## 6. Story Lifecycle State Machine

```
                   ┌──────────────┐
                   │    SIGNAL    │ (Raw item detected from 1 source)
                   └──────┬───────┘
                          │ 2nd source detected / developing traction
                          ▼
                   ┌──────────────┐
                   │  DEVELOPING  │ (Clustered signals, facts emerging)
                   └──────┬───────┘
                          │ Verification threshold met (3 ind. sources OR 1 official)
                          ▼
                   ┌──────────────┐
                   │   VERIFIED   │ (Core facts confirmed; research assembled)
                   └──────┬───────┘
                          │ Drafting pipeline triggered
                          ▼
                   ┌──────────────┐
                   │    DRAFT     │ (Fact-locked inverted pyramid copy)
                   └──────┬───────┘
                          │ Compliance engine passes
                          ▼
                   ┌──────────────────┐
                   │ EDITORIAL REVIEW │ (Assigned to Editor for inspection)
                   └──────┬───────┬───┘
                          │       │ Rejected / Inaccurate
                          │       ▼
                          │ ┌──────────────┐
                          │ │   REJECTED   │
                          │ └──────────────┘
                          │ Approved by authorized editor
                          ▼
                   ┌──────────────┐
                   │   APPROVED   │ (Ready for release)
                   └──────┬───────┘
                          │ Published to reader site & syndication
                          ▼
                   ┌──────────────┐
                   │  PUBLISHED   │ (Continuous monitoring remains active)
                   └──────┬───────┘
                          │ Archival cycle
                          ▼
                   ┌──────────────┐
                   │   ARCHIVED   │
                   └──────────────┘
```

**Potential Exclusive Flag**: An orthogonal boolean flag (`is_potential_exclusive: true`). Can be attached to a `SIGNAL` or `DEVELOPING` story when first detected without prior reporting elsewhere. **Crucially, it never bypasses verification.**

---

## 7. Data Flow & Inter-Agent Communication

Agents communicate via validated schemas rather than unstructured chat dialogues. Every message boundary enforces strict TypeScript types and Zod schemas:

1. **`ScoutAgent`** outputs `RawStorySignal`.
2. **`StoryClusteringAgent`** consumes `RawStorySignal[]` and outputs `StoryCluster`.
3. **`VerificationAgent`** evaluates `StoryCluster` against `SourceRegistry` and outputs `VerificationRecord`.
4. **`ResearchAgent`** extracts `ClaimRecord[]` and outputs `ResearchPacket`.
5. **`WriterAgent`** consumes `ResearchPacket` and outputs `ArticleDraft`.
6. **`EditorialPolicyAgent`** audits `ArticleDraft` and outputs `PolicyAuditResult`.
7. **`PublishingAgent`** checks user permissions and dispatches to syndication targets.

This architecture ensures total predictability, high execution speed, zero prompt drift, and straightforward testability across all operational environments.
