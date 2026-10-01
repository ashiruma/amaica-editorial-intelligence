# WireOps Desk - Production Release Runbook v2.0
**Operational Standard:** Zero-Emoji Workplace Standard  
**Target Environment:** Production (`https://wireops-desk.vercel.app/`)  
**Git Remote:** `https://github.com/ashiruma/amaica-editorial-intelligence.git`  
**Branch:** `main`  
**Document Classification:** Confidential / Editorial & Systems Architecture  

---

## 1. System Overview & Architecture Topology

WireOps Desk is a production-grade AI-first newsroom intelligence and editorial dispatch platform designed for high-integrity journalism. The architecture is composed of 20 specialized agents and deterministic verification services operating in concert:

1. **Scout Agent & RSS Scraper:** Ingests wire signals from national, regional, and county newsrooms with DNS-level SSRF prevention.
2. **Source Discovery Agent:** Continuously discovers and registers legitimate news websites and RSS feeds.
3. **Trend & Momentum Agent:** Tracks rising public interest without mistaking viral popularity for verified truth.
4. **Story Clustering Engine:** Multi-source entity and temporal clustering grouping parallel wire reports into unified clusters.
5. **Geographic Intelligence Agent:** Western Kenya priority desk with primary focus on Kakamega, Vihiga, Bungoma, Busia, Siaya, Trans Nzoia, and Nandi.
6. **Celebrity Intelligence Desk:** Monitors established and emerging Kenyan figures across music, sports, broadcast, and digital creator sectors.
7. **Corroboration & Verification Engine:** Enforces the 3-Independent-Sources Rule, official authority confirmation, and contradiction tracking.
8. **Research Dossier & Packet Builder:** Assembles locked timelines, verified facts, direct quotes, and statutory citations.
9. **Inverted Pyramid Article Generator:** Writes professional copy (35-45 word lede, 5Ws+H, no robotic headers, substantive body paragraphs).
10. **Anti-Hallucination Guard:** Validates thematic consistency and prevents topic drift across transit, political, and cultural beats.
11. **Kenyan English Stylebook Engine:** Enforces Commonwealth spelling, 2010 Constitution institutional titles (CS, PS, MCA), currency formatting (KSh), and purges clichés.
12. **Humanizer Precision Tool (Human-in-the-Loop):** Explicitly initiated by authenticated editors only. Never runs automatically.
13. **Professional Paraphraser:** Multi-mode paraphraser (journalistic, compact, formal, background) with automated quote preservation and source citation injection.
14. **Multi-Detector Consensus Aggregator:** Transparent consensus calculation across configured third-party detectors with divergence alerts.
15. **Cluster Plagiarism & Similarity Engine:** N-gram 5-shingle overlap and Levenshtein edit distance analysis.
16. **Pre-Flight Publishing Gatekeeper:** Enforces 6 non-negotiable publication criteria.
17. **Multi-Channel Distribution Gateway:** Dispatches verified stories to WordPress REST API, Ghost CMS, Syndication Webhook, and WireOps internal desk.
18. **Telegram Alerting & Command Webhook Bot:** Dispatches breaking alerts and handles desk commands (`/status`, `/verify`, `/hold`, `/help`).
19. **Cryptographic Audit Logger:** SHA-256 content hashing, tamper-evident publication logging, and audit trail preservation.
20. **Newsroom RBAC Engine:** 5-tier role hierarchy (`INTERN_WRITER`, `REPORTER`, `DESK_EDITOR`, `MANAGING_EDITOR`, `CHIEF_ADMIN`).

---

## 2. Environment Variables & Secrets Reference

Ensure the following environment variables are configured in Vercel and the Supabase dashboard:

```bash
# Supabase Integration
VITE_SUPABASE_URL="https://[project-id].supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Telegram Alerting & Command Bot
TELEGRAM_BOT_TOKEN="0123456789:AA..."
TELEGRAM_CHAT_ID="-100..."
TELEGRAM_WESTERN_DESK_CHAT_ID="-100..."
TELEGRAM_WEBHOOK_SECRET="secure-webhook-secret-token"

# Distribution Gateway
VITE_WORDPRESS_SITE_URL="theashirumanow.wordpress.com"
WORDPRESS_APP_PASSWORD="..."
GHOST_ADMIN_API_KEY="[id]:[64-hex-chars-secret]"
DISTRIBUTION_WEBHOOK_SECRET="hmac-sha256-signing-secret"

# Third-Party AI & Plagiarism Detectors (Optional - Reports NOT_CONFIGURED when missing)
WINSTON_AI_API_KEY=""
GPTZERO_API_KEY=""
ZEROGPT_API_KEY=""
SAPLING_API_KEY=""
COPYLEAKS_API_KEY=""
TURNITIN_API_KEY=""
```

---

## 3. Strict Newsroom Operational Standards

All team members and automated engines operate under 5 non-negotiable standards:

1. **Zero-Emoji Workplace Standard:**
   - Emojis are strictly banned from all source code, commit messages, UI interfaces, article copy, prompts, and Telegram dispatches. Professional journalism requires zero emojis.
2. **Human-in-the-Loop Humanizer Mandate:**
   - The Humanization Tool must never run automatically upon saving, publishing, or queueing. It must be explicitly initiated by an authenticated editor via the editor interface.
3. **Zero Factual Drift Guarantee:**
   - Proper names, numbers, dates, locations, and direct quotes must remain 100% identical before and after humanization or paraphrasing.
4. **Transparency Mandate for Detectors:**
   - Detectors without active API keys return `NOT_CONFIGURED` with `aiScore: null`. No fabricated scores or mock numbers are ever averaged.
5. **Western Kenya & Kakamega Geographic Focus:**
   - Geographic relevance scoring prioritizes Kakamega and Western Kenya sub-counties, institutions, and leaders.

---

## 4. Pre-Flight Publishing Gatekeeper Checklist

Before an article is syndicated or marked live, all 6 non-negotiable criteria are evaluated:

| Gate | Check Name | Requirement | Bypassable? |
|---|---|---|---|
| 1 | Story Verification | Status must be `VERIFIED` | Senior Editor Single-Source Override only |
| 2 | Originality / Plagiarism | Score must be strictly < 15% | No |
| 3 | AI Consensus | Consensus <= 35% or Human Certified | Yes (with human editorial certification) |
| 4 | Editorial Compliance | 100% of inverted pyramid & attribution checks pass | No |
| 5 | Zero-Emoji Standard | 0 emoji violations across headline, lede, body, byline | Absolutely Forbidden to Bypass |
| 6 | Role Authorization | User must be `ADMIN`, `CHIEF_EDITOR`, `MANAGING_EDITOR`, or `EDITOR` | No |

---

## 5. Deployment & Verification Verification Steps

1. **Run Full Test Suite:**
   ```powershell
   npx vitest run
   ```
   *Expected outcome: 47+ test files passing, 305+ tests passing, 0 failures.*

2. **Run TypeScript Production Build:**
   ```powershell
   npm run build
   ```
   *Expected outcome: Zero TypeScript or Vite compilation errors; clean bundle output in `dist/`.*

3. **Verify Zero Emojis Across Repository:**
   ```powershell
   node -e "
   const fs = require('fs');
   const code = fs.readFileSync('src/pages/newsroom/DraftEditor.tsx', 'utf8');
   const re = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1FA70}-\u{1FAFF}]/u;
   console.log('Zero-Emoji Status:', !re.test(code) ? 'PASSED' : 'FAILED');
   "
   ```

4. **Vercel Production Promotion:**
   - Commit and push to `origin/main`.
   - Vercel automatically deploys the latest commit to `https://wireops-desk.vercel.app/`.
   - Verify HTTPS headers via curl or browser DevTools (`nosniff`, `X-Frame-Options`, `HSTS`, `Referrer-Policy`).

---

## 6. Rollback & Incident Response Procedures

If an unexpected critical issue occurs post-deployment:
1. **Instant Vercel Rollback:**
   - Navigate to the Vercel Dashboard -> Deployments.
   - Select the previous stable deployment SHA and click **Promote to Production**.
2. **Desk Emergency Hold:**
   - Any authorized editor can issue `/hold` via Telegram or the newsroom cockpit to pause all automated queue publishing immediately.
3. **Git Revert:**
   ```powershell
   git revert HEAD --no-edit
   git push origin main
   ```
