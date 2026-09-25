# WireOps Desk: Machine-Readable Editorial Policy & Rules Engine

**Document**: WireOps Editorial Rules & Governance Engine Specification  
**Author**: Senior Principal Engineer & Editorial Systems Architect  
**Version**: 2.0.0  
**Status**: Specification Baseline  

---

## 1. Governance Architecture: Determinism Over Prompt Drift

In a professional newsroom, editorial policy cannot simply exist as a loose narrative prompt sent to an LLM. Large language models frequently drop instructions, hallucinate details when pressured by length targets, and soften firm prohibitions.

WireOps Desk implements a **Deterministic Machine-Readable Rules Engine** that evaluates every article before saving, drafting, or publishing. The engine inspects structure, claims, quotes, and sources against formal codified rules, generating auditable pass/fail checklists.

---

## 2. Core Codified Rules Matrix

The engine codifies the 17 official newsroom articles into machine-executable evaluation rules:

| Rule Code | Title & Rule Definition | Evaluation Mechanism | Severity | Automatic Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **`RULE-01-EXP-NO-FAB`** | **AI Cannot Fabricate Information**<br>AI is prohibited from manufacturing background, statistics, or facts to meet target lengths. | Entity & Claim cross-check against `ResearchPacket`. Unreferenced claims are flagged. | `CRITICAL_BLOCKER` | If under length, system flags *"INSUFFICIENT VERIFIED MATERIAL FOR TARGET LENGTH"* instead of generating filler. |
| **`RULE-02-QUOTE-LOCK`** | **Direct Quotes Cannot Be Rewritten**<br>Verbatim quotations must preserve exact wording, punctuation, and speaker attribution. | Levenshtein string distance comparison between source quote and draft quote must be 1.0. | `CRITICAL_BLOCKER` | Auto-restores original verbatim quote string if modified by rewriter or humanizer. |
| **`RULE-03-NO-QUOTE-FAB`** | **AI Cannot Fabricate Quotations**<br>Direct quotes cannot be invented under any circumstances. | Every quotation mark string must resolve to an authenticated source signal in `quotes`. | `CRITICAL_BLOCKER` | Deletes fabricated quotation; flags author or generator. |
| **`RULE-04-ALLEGE-HEDGE`** | **Unverified Allegations ≠ Facts**<br>Allegations, disputes, and accusations must be attributed with journalistic hedging. | Regex scans for unhedged accusations (`"is a thief"`, `"committed fraud"`). | `ERROR` | Rewrites unhedged assertions into attributed phrasing (`"was accused of theft"`). |
| **`RULE-05-RIGHT-OF-REPLY`** | **Fairness and Right of Reply**<br>Stories involving disputes or accusations must include a statement that both parties were afforded reply. | Scans for right-of-reply tokens (`"efforts to reach"`, `"declined to comment"`, `"denied the claims"`). | `WARNING` | Automatically appends Section 3 Right of Reply fairness clause if missing. |
| **`RULE-06-POP-NOT-VERIF`** | **Virality / Popularity ≠ Verification**<br>High social media engagement cannot verify a claim. | Blocks verification triggers based on view counts, shares, or trending scores. | `CRITICAL_BLOCKER` | Rejects promotion from `DEVELOPING` to `VERIFIED` without independent source lineage. |
| **`RULE-07-SRC-INDEP`** | **Copied Portals ≠ Independent Sources**<br>Three copied websites do not constitute three independent sources. | Source lineage analysis matches republished text snippets against upstream wires. | `CRITICAL_BLOCKER` | Collapses syndication copies into 1 source count; halts auto-verification. |
| **`RULE-08-ZERO-EMOJI`** | **Strict Zero-Emoji Workplace Standard**<br>Emojis are strictly forbidden anywhere in news copy, headlines, or UI metadata. | Unicode regex scan across headline, lede, body, and social posts: `[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}]`. | `CRITICAL_BLOCKER` | Strips emojis instantly across all fields. |
| **`RULE-09-TRAUMA-ADVISORY`**| **Content Advisory on Trauma**<br>Reporting on domestic disputes, trauma, or accidents requires an editorial advisory. | Keyword scanner (`"body bag"`, `"domestic violence"`, `"physical assault"`, `"trauma"`). | `ERROR` | Injects standardized Editor's Note & Content Advisory above the lede. |
| **`RULE-10-NO-COMM-PUFF`** | **Commercial Puffery Separation**<br>Commercial discount codes, hype adjectives, and promotional links are prohibited. | Pattern matching against commercial discount codes, affiliate hooks, and hype words. | `ERROR` | Strips promotional text from editorial body copy. |
| **`RULE-11-KENYAN-HERITAGE`**| **Kenyan Legends Sole Focus**<br>The Legends feature must strictly honor Kenyan cultural icons, never international figures. | Validates country metadata in `legends` table; must equal `"Kenya"`. | `CRITICAL_BLOCKER` | Filters out non-Kenyan entries and falls back to Kenyan seed roster. |
| **`RULE-12-NO-OUTLINE-HEAD`**| **No Robotic Outline Headings**<br>Continuous inverted-pyramid copy without formulaic `## Background` or `## Quotes`. | Markdown AST / regex search for `^##\s+(Background\|Quotes\|Why it matters)`. | `ERROR` | Dissolves section markers into flowing narrative paragraphs. |
| **`RULE-13-NO-TRAILING-PART`**| **Zero Broken Participials**<br>Trailing participial clauses (e.g. `", highlighting..."`, `", offering..."`) are forbidden. | Linguistic clause matcher detecting trailing comma + present participle. | `WARNING` | Converts trailing participials into independent, cadenced sentences. |
| **`RULE-14-HUMAN-PUBLISH`** | **Human Publication Authorization**<br>Autonomous publication is forbidden; release requires authorized human approval. | Database constraint verifying `approved_by_id` is linked to an authorized user role. | `CRITICAL_BLOCKER` | Halts automated dispatch; queues draft into Editorial Review desk. |
| **`RULE-15-MIN-WORD-COUNT`** | **Inverted Pyramid Depth**<br>Breaking stories must achieve a substantive depth (default 700+ words). | Word count calculator excluding titles and footers. | `WARNING` | Flags review requirement if under 700 words. |
| **`RULE-16-DEFAMATION-GATE`**| **Legal Defamation Safeguards**<br>Criminal claims without charge sheets or official records are blocked. | Scans for criminal claims lacking judicial attribution (`"police reported"`, `"court documents show"`). | `CRITICAL_BLOCKER` | Enforces attribution or prevents publication. |
| **`RULE-17-SOURCE-CREDIT`** | **Primary Publisher Attribution**<br>Wire rewrites must explicitly cite primary reporting outlet in prose. | Verifies presence of publisher title (e.g., *"According to reporting by Standard Digital..."*). | `ERROR` | Injects explicit publisher reference into paragraph 1 or 2. |

---

## 3. Transparent Quality Checklist (Not a Fake "AI Score")

Rather than compressing complex newsroom evaluation into a single opaque number (e.g., *"Story Quality: 84%"*), WireOps Desk renders a transparent, unbundled **Editorial Quality Checklist**:

```
┌──────────────────────────────────────────────────────────────┐
│                  EDITORIAL QUALITY CHECKLIST                 │
├──────────────────────────────────────────────────────────────┤
│  Verification Status   │  PASS (3 Independent Sources)       │
│  Primary Sources       │  PASS (Standard Digital, Citizen)   │
│  Attribution Rigor     │  PASS (All claims cited)            │
│  Quote Integrity       │  PASS (2 Verbatim Quotes Locked)    │
│  Grammar & Syntax      │  96% (Grammarly-Grade Clean)        │
│  Readability           │  GOOD (Flesch Score: 68.4)          │
│  Originality           │  LOW SIMILARITY (94% Unique)        │
│  AI Pattern Signal     │  LIKELY HUMAN (No Clichés Detected) │
│  Editorial Policy      │  PASS (17/17 Articles Satisfied)    │
│  Zero Emoji Compliance │  PASS (100% Clean)                  │
│  SEO Readiness         │  PASS (Slug & Meta Configured)      │
│  Human Review Decision │  PENDING (Assigned to Chief Editor) │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Administrative Configuration & Custom Rules Engine

Administrators can configure, activate, or adjust rule parameters via `newsroom_settings` without redeploying application code:

```typescript
export interface NewsroomEditorialRuleConfig {
  ruleCode: string;
  isActive: boolean;
  severity: "critical_blocker" | "error" | "warning" | "advisory";
  thresholds?: {
    minWordCount?: number;
    requiredIndependentSources?: number;
    allowSwahiliLoanWords?: boolean;
  };
  customBannedPhrases?: string[];
}
```

This guarantees complete regulatory compliance with Media Council of Kenya (MCK) standards and WireOps internal editorial bylaws.
