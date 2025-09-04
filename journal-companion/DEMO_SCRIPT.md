# Demo Video Script (5–7 minutes)

This is the talk track I’ll use for a live demo. It blends a personal, story‑driven flow with a quick, structured mapping to goals, features, and grading criteria.

---

## 0:00 – 0:30 Who I Built This For
Hi, I’m [Name]. I built Journal Companion for people like me who want the benefits of journaling but hit friction: blank pages, not enough time, and a pile of notes that never turn into insight. My north star: make reflection easy, private, and genuinely helpful.

## 0:30 – 1:20 What I Built (In One Breath)
A Next.js app (Page Router, TypeScript) that:
- Adapts prompts based on recent entries (context‑aware, empathetic)
- Analyzes entries privately and visualizes trends
- Generates weekly insights you can act on
- Lets you “Speak to Journal” and turns your thoughts into clear text
- Encourages consistency with a streak
- Uses a modern UI — clean CSS, no Tailwind at runtime
Everything is local by default; AI calls go through serverless routes so the Gemini key stays server‑side.

## 1:20 – 3:20 Product Tour (Show, Don’t Tell)
### Write
On the Write tab, prompt cards are not generic. They pull context from your latest entries and themes. If I’ve been writing about work stress, I’ll see a prompt like “Where did you find a moment of calm today?” that meets me where I am.
When typing’s too much, I click “Speak to Journal.” I used the browser’s Web Speech API to capture audio, then a Gemini route that composes a coherent entry in my voice. It drops straight into the editor. Recent entries appear below; clicking a card opens a full modal with the content, sentiment, and theme chips. Up top, my streak badge gently nudges consistency.

### Dashboard
The Dashboard shows sentiment over time, a distribution pie, and top themes, built with Recharts. It answers: What emotions recur? Which topics show up most? Am I trending more positive, neutral, or mixed?

### Insights
The Insights tab generates a weekly summary with dominant sentiment, key patterns, and growth ideas. I expanded Theme Analysis to include counts and a “show all” toggle. Positive highlights are clickable, so I can relive bright spots and reinforce what’s working.

## 3:20 – 4:30 Why These Choices (Architecture)
- Next.js (Page Router) + TypeScript for speed and clarity
- CSS via `globals.css` for full control and portability (no Tailwind at runtime)
- Entries stored in `localStorage` — private by default, no external DB
- AI only through my API routes (`/api/analyze`, `/api/prompts`, `/api/insights`, `/api/themes`, `/api/compose`) so the Gemini key is never exposed
- Local heuristic fallback when the network/LLM is unavailable
- Recharts for charts, date‑fns for time, lucide‑react for icons

## 4:30 – 5:15 What I Focused On (My Work)
- Rebuilt the visual design in plain CSS (glass surfaces, gradients, grids, modals)
- Secured the AI key behind serverless routes and added graceful fallbacks
- Wrote prompt logic to be empathetic and context‑aware
- Implemented end‑to‑end speech‑to‑text: mic → transcript → LLM composition → editor
- Calculated daily streaks from unique entry dates
- Added entry/highlight modals to turn data into moments you can revisit
- Cleaned lint/types, unified icon usage, and fixed edge cases in charts and labels

## 5:15 – 5:45 Responsible by Design
I kept it private by default (local storage, no tracking), used supportive language, and avoided clinical claims. Model outputs can be imperfect, so I frame them as suggestions users can edit or dismiss. Next, I’d add local encryption‑at‑rest, per‑entry consent for analysis/redaction, and on‑device embeddings for smarter, privacy‑preserving insights.

## 5:45 – 6:20 Success Metrics (How We Know It’s Working)
- Engagement: visible streaks, fast capture (speech‑to‑text), quick prompts
- Insightfulness: patterns and themes surfaced weekly, plus trend charts
- Privacy & Trust: local storage by default; key stays server‑side; minimal surface area
- AI Application: empathy‑tuned prompts/summaries, clear guardrails, fallbacks

## 6:20 – 6:50 Rubric Mapping (Grading Criteria)
- Problem Understanding: Directly tackles blank‑page anxiety, reflection friction, and pattern discovery
- Technical Rigor: Next.js Page Router, typed API routes, server‑side key handling, Recharts, heuristics fallback, speech‑to‑text integration
- Creativity: Context‑aware prompts, highlight modals, streaks, one‑click speech composition
- Prototype Quality: Fully working flow — writing, speaking, saving, analyzing, charting, summarizing
- Responsible AI: Supportive tone, privacy by default, key security, known limitations documented

## 6:50 – 7:00 Why This Matters
Journaling shouldn’t feel like work. With adaptive prompts, one‑click speech capture, and gentle insights, it becomes a small daily ritual you’ll keep. That’s Journal Companion — simple, private, and actually helpful. Thanks for watching.

---

## Appendix: Quick Live Demo Flow
1) Write → pick a prompt → Speak to Journal → Stop & Compose → Save
2) Dashboard → sentiment trend and top themes
3) Insights → weekly summary → open a Positive highlight
4) Header → show the streak
