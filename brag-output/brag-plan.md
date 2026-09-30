# Brag Plan: WireOps Desk

## What is this app?

WireOps Desk is an AI-powered Kenyan newsroom intelligence platform that ingests live wire stories, runs Turnitin-grade AI forensics on copy, and humanizes it to 0% AI footprint — all inside a full editorial workflow from discovery to publication.

## The angle

Every newsroom in Africa fears two things: fabricated stories and AI-written copy that a detector will flag. WireOps Desk is the first system built to kill both — simultaneously. The hook is the contrast: a ruthless AI-forensics engine sitting inside an editor's own desk, silently flagging every suspicious phrase, then rewriting it until it reads like a seasoned Kenyan journalist filed it at 3am.

## Hook (first 2–3 seconds)

Cold black background. One brutal line types out character by character:

**"Your AI copy just failed Turnitin."**

Keyboard tick sounds. Red glow. The line holds for 1.5s — fully settled before anything moves.

## Key moments (the middle)

1. **The forensics panel** — the AI Detection studio UI slides in. Sentence-by-sentence confidence bars light up in amber and red. A "High AI Confidence" badge pulses. Three verdict rows drop in one by one with card sounds: Perplexity, Burstiness, Formulaic transitions.

2. **The humanizer at work** — the humanizer workspace view shows a red-marked draft on the left, then morphs to a clean cleared version on the right. A green "0% AI Footprint" stamp drops onto the clean copy with a bell hit. The stat counts: 100% entity preservation.

3. **The newsroom wire** — the Discover page: live story cards from Tuko, Nation, Mpasho, Citizen scrolling in. A card gets selected. Beat labels: Western Kenya · Entertainment · Breaking. The inverted pyramid structure assembles onscreen.

## Outro / punchline

The WireOps Desk wordmark on the teal (#1A4F52) masthead. Below it, calm white text:

**"Built for Kenyan newsrooms. No hallucinations. No AI flags. Just the story."**

A bell hit lands with the final line. Held for 3s.

## User flow worth showing

1. **Entry** — Journalist opens the AI Detector Studio and pastes a wire story.
2. **Key action** — Forensics sweep completes: sentence-level confidence heat map lights up, verdict rows reveal AI patterns.
3. **Result** — Humanizer runs. Draft clears to 0% AI footprint. Story moves to the Editorial queue for publishing.

## Tone

- Preset: `polished`
- Creative direction: quiet premium newsroom product — serious tool for serious journalists
- Interpretation: Restrained energy. Long holds on key UI. Clean cuts, not flashes. Typography does the talking. No movement for movement's sake.

## Format: landscape — 1280x720
## Duration: 22 seconds

## Visual identity (from the project)

- Background: `hsl(180, 14%, 97%)` — near-white warm surface (light scenes) / `#0d1a1b` deep teal-black (hook scene)
- Primary / brand: `hsl(184, 51%, 21%)` = `#1A4F52` — Amaica teal
- Accent / gold: `hsl(47, 100%, 48%)` = `#F5B800` — gold
- Destructive / alert: `hsl(11, 81%, 51%)` = `#E8391D` — red
- Text: `hsl(195, 30%, 8%)` — near-black ink
- Display font: system serif / Georgia (no custom font detected in CSS, Tailwind defaults)
- Body font: system sans — Inter / system-ui
- Strongest visual element: The AI Detection Studio sentence-highlight heat map with red/amber confidence scores

## Share copy (draft)

Built WireOps Desk — a newsroom intelligence platform for Kenyan journalists. Turnitin-grade AI forensics, 0% AI footprint humanization, and a full editorial wire workflow. No hallucinations. Just the story.

## Audio direction

- Role: warm professional bed, restrained
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady and clean — matches polished tone)
- Music treatment: Fade in gently from 0s at 0.3 volume. Fade out under the final 2s. No swells or drops during the video — let the UI do the work.
- Music cue guidance: Bundled preset available — `happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`. Strong cues at 8.74s, 13.11s, 17.47s in the planning window. Target the verdict-row reveal to land near 8.74s (beat-locked), and the "0% AI Footprint" stamp near 13.11s.
- Audio-reactive treatment: subtle; use music RMS/bass to make the teal masthead glow breathe gently and card presence slightly swell. No waveform bars, no strobing.
- SFX posture: sparse, polished — 4 cues total
- Audio-coupled moments:
  - Hook typing: keyboard tick sounds (randomized `keyboard/keypress-*.wav`) as each character appears
  - Verdict rows: `casino/card-place-1.ogg` (x3, staggered) as each row drops in
  - "0% AI Footprint" stamp: `impact/impactBell_heavy_000.ogg`
  - Final wordmark landing: `interface/bong_001.ogg` (soft, restrained)
- Restraint rule: Music must never compete with the UI moments. No aggressive SFX. Nothing that sounds like a game.

## Storyboard

### Scene 1 — Hook — 3.5s

Deep teal-black background (`#0d1a1b`). Centre-aligned.
Text types out character by character: **"Your AI copy just failed Turnitin."**
Font: bold, large — ~52px. Color: white. Red glow pulses on the word "failed".
After the line settles (at ~2.8s), the glow intensifies for 0.5s, then cuts hard.

Sequential/interaction: yes — character-by-character type-on from left, each character takes ~0.09s
Audio intent: tense, building — keyboard ticks create rhythm and dread
Audio-coupled idea: randomized keyboard ticks per character; red word glow intensifies with music RMS
Music: warm bed fades in under the typing, very low at first
Transition mood: hard cut → Scene 2

---

### Scene 2 — Forensics Panel — 5.5s

Light background (`hsl(180, 14%, 97%)`). The AI Detection Studio panel slides in from the right.
Shows: a text area with the pasted draft. Below it, three verdict rows appear one by one (beat-grid staggered at ~8.55s, 8.74s beat-locked, 9.29s):
- Row 1: "Perplexity" — amber badge "Elevated"
- Row 2: "Burstiness" — amber badge "Uniform"
- Row 3: "Formulaic Transitions" — red badge "Detected"

Each row card-places in with a soft card sound. After all three are visible, a prominent red banner appears: **"High AI Confidence Detected"**.

Holds 1.5s after the banner appears, fully settled.

Sequential/interaction: yes — 3 verdict rows drop in one by one, then banner appears
Audio intent: deliberate, factual — the system is doing its job, not panicking
Audio-coupled idea: `casino/card-place-1.ogg` on each row arrival; beat-locked first row to 8.74s strong cue
Music: steady bed continues
Transition mood: soft crossfade → Scene 3

---

### Scene 3 — Humanizer at Work — 6s

Split-panel view. Left: red-marked draft with underlined AI phrases highlighted in amber/red. Right: initially blank.

At 1s into the scene, the right panel fills in clean copy, line by line. After 2s, the clean copy is complete. A green **"0% AI Footprint"** stamp drops onto the right panel — beat-locked to strong cue at 13.11s. Below it, a single counter: **"100% Entity Preservation"**.

The left red panel fades to 40% opacity as the right panel takes focus.

Sequential/interaction: yes — right-side copy lines appear one by one; then stamp drops
Audio intent: relief, professional satisfaction — the job is done
Audio-coupled idea: `impact/impactBell_heavy_000.ogg` as the green stamp drops (beat-locked 13.11s)
Music: gentle swell in the bed as the stamp lands, then returns to normal level
Transition mood: clean crossfade → Scene 4

---

### Scene 4 — Wire & Publish — 4s

The Discover newsroom page. Five story cards scroll in from the bottom, one by one — Kenyan source badges visible: Tuko, Nation, Mpasho. Each card shows a headline and a region badge ("Western Kenya · Entertainment").

One card is highlighted / selected with a gold border. Above it, text appears: **"50+ stories / hour"**.

Holds 1.5s on the selected card.

Sequential/interaction: yes — 5 cards arrive staggered; one gets a gold highlight
Audio intent: productive, high-throughput — the newsroom is moving fast
Audio-coupled idea: `interface/drop_001.ogg` for each card arrival (first and last only accented)
Music: bed continues cleanly
Transition mood: soft crossfade → Scene 5

---

### Scene 5 — Outro / Wordmark — 3s

Full teal background (`#1A4F52`). Centre-aligned.
Top: **"WireOps Desk"** in white, display weight.
Below it (fades in 0.8s later): **"Built for Kenyan newsrooms."**
Then (fades in 0.5s after): **"No hallucinations. No AI flags. Just the story."**
Bottom: small URL — `wireops-desk.vercel.app`

Bell hit at the moment "No hallucinations..." appears (beat-locked near 17.47s strong cue).
Everything holds for 2.5s.

Sequential/interaction: yes — three text lines appear in sequence with 0.5-0.8s gaps; each fully settled before the next
Audio intent: authoritative, clean close — earned confidence, not hype
Audio-coupled idea: `interface/bong_001.ogg` at the "No hallucinations" line; `impact/impactBell_heavy_000` under the wordmark (soft, 0.55 volume)
Music: fade out begins at scene start, fully silent by 22s
Transition mood: hold to end

---

**Music mood for this video:** steady, clean corporate bed — restrained and professional
**Audio summary:** Keyboard ticks build tension in the hook; card-place sounds make the forensics feel methodical; a bell hit marks the 0% stamp as a moment of earned relief; the outro bong closes it with authority. Music fades quietly under the final logo.

## Music cue guidance

- Track: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` — 109.96 BPM
- Strong cues in window:
  - **8.74s** — beat-lock verdict row 1 arrival
  - **13.11s** — beat-lock "0% AI Footprint" stamp drop
  - **17.47s** — beat-lock "No hallucinations" text line in outro
- Beat-grid windows for sequential events: verdict rows at ~8.55, 8.74, 9.29 (every other beat); wire cards at ~14.73, 15.29, 15.84, 16.38, 16.93
- Restraint rule: tone is polished — use at most 3 strong cue locks; ignore cues that would pull text off-screen before it's readable
