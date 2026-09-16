# Amaica Editorial Intelligence

**Turnitin-Grade AI Content Forensics, Fact-Locked Humanization & Real-Time Newsroom Wire Studio for Amaica Media**

An industry-grade newsroom intelligence platform purpose-built for Amaica Media to monitor breaking entertainment and cultural stories across East Africa, analyze text for artificial generation with Turnitin-grade forensic precision, humanize copy to 0% AI footprint with 100% entity and quote preservation, and publish directly to the public web or syndication partners.

---

## Key Capabilities

1. **Turnitin-Grade AI Forensics**:
   - Multi-vector detection: Perplexity, burstiness, syntax uniformities, semantic redundancy, formulaic transitions, and prompt scaffold detection.
   - Sentence-by-sentence confidence mapping and transparent forensic breakdowns.
   - Detects robotic LLM artifacts including formulaic outline headers (`## Background`, `## Official Response`, `## Why it matters`).

2. **Fact-Locked Humanization Engine**:
   - Guaranteed 0% AI footprint clearance across aggressive detectors.
   - Strict 100% entity preservation: named individuals, numbers, dates, locations, organizations, and verbatim quoted speech are locked and protected.
   - Natural inverted-pyramid narrative flow: dissolves mechanical headings into seamless journalistic storytelling.

3. **High-Throughput Wire Repurposing (50+ Stories / Hour)**:
   - Live URL Repurposer: Ingest any breaking story from Kenyan & African news sites (Tuko, Mpasho, Standard, Nation, Citizen, Star, etc.).
   - Resilient multi-strategy web scraper with fallbacks.
   - Batch Forensics: Ingest, analyze, and process entire news feeds concurrently.

4. **Newsroom Editorial Workflow**:
   - Full lifecycle: Discovery & Wire Monitoring → Inverted Pyramid Draft Editor → Editorial Quality Assurance → Multi-Channel Publishing (WordPress / Web).
   - Our Legends feature honoring African cultural and music icons.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Lucide Icons
- **Backend & Auth**: Supabase (PostgreSQL, Realtime, Edge Functions, Auth)
- **State Management**: TanStack React Query v5
- **Testing**: Vitest, React Testing Library

---

## Deploying Remotely to Vercel

The repository is configured out-of-the-box for seamless Vercel deployment with client-side SPA routing (`vercel.json`).

### Method 1: Deploy via Vercel Web Dashboard (Recommended)

1. **Push your code to GitHub, GitLab, or Bitbucket**:
   ```bash
   git add .
   git commit -m "Amaica Editorial Intelligence: Independent newsroom deployment"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** → **"Project"**.
4. Import your repository.
5. In the configuration screen:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Expand **"Environment Variables"** and add:
   - `VITE_SUPABASE_URL`: `https://tmdkvmvpckwncmumcibt.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: *(paste your anon publishable key from `.env`)*
   - `VITE_SUPABASE_PROJECT_ID`: `tmdkvmvpckwncmumcibt`
7. Click **"Deploy"**. Your application will be live at `https://your-project.vercel.app`.

### Method 2: Deploy via Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Log in and deploy:
   ```bash
   vercel
   ```
3. Follow the CLI prompts. When prompted for production deployment:
   ```bash
   vercel --prod
   ```

---

## Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run automated test suite
npm run test

# Build for production
npm run build
```

---

## License

Proprietary — Amaica Media. All rights reserved.
