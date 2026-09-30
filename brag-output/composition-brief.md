# Hyperframes Composition Brief: WireOps Desk

## Objective

Create a 22-second polished launch-style brag video for WireOps Desk — an AI-powered Kenyan newsroom intelligence and editorial production platform.

## Output

- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1280x720
- Duration: 22 seconds

## Source Material

- Project root: `D:\Abala\kenya-entertainment-wire`
- Primary files read: `README.md`, `package.json`, `src/index.css`, `src/pages/public/Home.tsx`, `src/pages/newsroom/AiDetectorStudio.tsx`
- Product name: WireOps Desk
- Tagline / strongest claim: "Turnitin-grade AI forensics. 0% AI footprint. 50+ stories per hour."
- Key UI moment to recreate: The AI Detector Studio sentence-confidence heat map — verdict rows with Perplexity, Burstiness, and Formulaic Transitions badges
- Copy that must appear verbatim:
  - "Your AI copy just failed Turnitin."
  - "0% AI Footprint"
  - "100% Entity Preservation"
  - "50+ stories / hour"
  - "Built for Kenyan newsrooms."
  - "No hallucinations. No AI flags. Just the story."
  - `wireops-desk.vercel.app`

## Creative Direction

- Tone preset: `polished`
- Creative direction: quiet premium newsroom product — serious tool for serious journalists, no hype
- Interpretation: Restrained pacing. Long holds on UI moments. Typography does the talking. Clean crossfades and one hard cut after the hook. Nothing moves unnecessarily.
- Angle: A system that solves two fears every African newsroom has — fabricated hallucinations and AI-detectable copy — built specifically for the Kenyan market.
- Hook: "Your AI copy just failed Turnitin." types out on a dark teal-black background. Character by character. Keyboard ticks. Red glow on "failed".
- Outro / punchline: Full teal background. Three text lines fade in sequentially: "Built for Kenyan newsrooms." / "No hallucinations. No AI flags. Just the story." / `wireops-desk.vercel.app`. Bell hit on the second line.
- Avoid:
  - Generic SaaS language ("streamline your workflow", "game-changer", "powerful")
  - Abstract motion graphics or color washes
  - Unrelated visual redesign — stay in the Amaica Media palette
  - Any visual more than 0.8s before text is fully settled

## Visual Identity

- Background (light): `hsl(180, 14%, 97%)` — #f5f9f9
- Background (hook/outro): `#0d1a1b` (dark) / `hsl(184, 51%, 21%)` = `#1A4F52` (teal)
- Text (primary): `hsl(195, 30%, 8%)` — near-black
- Text (on teal): `#ffffff`
- Accent (gold): `hsl(47, 100%, 48%)` = `#F5B800`
- Alert (red): `hsl(11, 81%, 51%)` = `#E8391D`
- Brand teal: `#1A4F52`
- Display font: Georgia, serif (heading weight)
- Body font: system-ui, -apple-system, sans-serif
- Visual references from the project: teal masthead gradient, amber/red AI confidence badges, sentence-level highlight rows, gold accent borders

## Storyboard

Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. **Hook** — 3.5s — "Your AI copy just failed Turnitin." types out on dark bg. Red glow on "failed". Hard cut.
2. **Forensics Panel** — 5.5s — AI Detection Studio panel with 3 verdict rows appearing one by one (Perplexity, Burstiness, Formulaic Transitions). "High AI Confidence Detected" banner appears.
3. **Humanizer at Work** — 6s — Split panel: red-marked draft (left), clean copy (right). "0% AI Footprint" stamp drops. "100% Entity Preservation" counter.
4. **Wire & Publish** — 4s — Discover page cards (Tuko, Nation, Mpasho source badges). "50+ stories / hour" stat. One card highlighted gold.
5. **Outro / Wordmark** — 3s — Teal background. "WireOps Desk" + "Built for Kenyan newsrooms." + "No hallucinations. No AI flags. Just the story." + URL.

## Audio

- Audio role: warm professional bed, restrained (polished posture)
- Audio arc: Tense keyboard ticks in the hook → methodical card sounds in forensics → bell hit at the 0% stamp → quiet bong at the outro → music fades under the wordmark
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: Fade in from 0s at 0.30 volume. Maintain through scene 4. Begin fade-out at scene 5 start (~19s). Fully silent by 22s.
- Music cue guidance:
  - Preset JSON: `C:\Users\ADMIN\.gemini\config\skills\brag\assets\music\cues\happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`
  - Strong cue locks (3 max):
    - 8.74s — beat-lock verdict row 1 arrival (Scene 2)
    - 13.11s — beat-lock "0% AI Footprint" stamp drop (Scene 3)
    - 17.47s — beat-lock "No hallucinations" text line (Scene 5 intro)
  - Beat-grid for sequential events: verdict rows near 8.55, 8.74, 9.29; wire cards near 14.73, 15.29, 15.84, 16.38, 16.93
  - Restraint rule: polished tone — ignore cues that pull text before it's settled
- Audio-reactive treatment: subtle; use music RMS/bass to make the teal masthead glow and product card presence breathe slightly. No waveform bars, no strobing.
- Audio-coupled moments:
  - Scene 1 (hook typing) — keyboard ticks per character, `keyboard/keypress-*.wav` randomized; red glow on "failed" reacts softly to RMS
  - Scene 2 (verdict rows) — `casino/card-place-1.ogg` at 0.65v for each of 3 rows, staggered; first row beat-locked 8.74s
  - Scene 3 (stamp drop) — `impact/impactBell_heavy_000.ogg` at 0.70v, beat-locked 13.11s
  - Scene 5 (outro "No hallucinations" line) — `interface/bong_001.ogg` at 0.55v, near 17.47s
- SFX selection guidance: sparse / polished — 4 cue types only. Card-place for rows. Bell for the stamp. Bong for the outro. Keyboard for the hook. Nothing else.
- SFX analysis guidance: `C:\Users\ADMIN\.gemini\config\skills\brag\assets\sfx\sfx-analysis.md` — prefer low HF-risk picks for repeated moments
- Exact SFX choice: Hyperframes should finalize timestamps, volume fine-tuning, and density based on implemented animation timing
- Audio files: music and SFX already copied to `brag-output/composition/assets/`

## Hyperframes Instructions

Load the Hyperframes domain skills (`hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`) to build the composition. This is the /brag workflow — do not enter the hyperframes entry-point interview or the generic promo workflow.

Requirements:
- Show real UI elements from WireOps Desk: verdict row structure, source badges, the humanizer split-panel concept, the teal masthead
- All text must be readable: short labels held at least 0.8s fully settled; sentences at 0.3s per word minimum
- Total duration must be 22 seconds (within 15-25s range)
- Include the planned music and SFX layer
- Audio-reactive: at least one visual element (teal glow, card presence) should subtly breathe with music RMS
- Beat-lock 3 major reveals as specified above (±0.15s tolerance)
- Sequential events (verdict rows, wire cards) should snap to beat-grid (±0.10s)
- Run `npx hyperframes check` before rendering — fix all errors
