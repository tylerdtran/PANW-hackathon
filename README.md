# Journal Companion (Next.js Page Router)

A private, empathetic, and intelligent journaling companion that makes self‑reflection a seamless and insightful daily habit.

It helps overcome “blank page” anxiety with dynamic prompts, performs private sentiment and theme analysis, generates weekly insights, and visualizes trends – now with speech‑to‑text journaling and a daily streak to encourage consistency.

Link to Demo Video: [Demo Video](https://drive.google.com/file/d/1I-OizMpacudsH5L7NJzN-EKbGc_BgENT/view?usp=sharing)

## Table of Contents
- [Demo Highlights](#demo-highlights)
- [Problem & Audience](#problem--audience)
- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [How It Works](#how-it-works)
  - [Data Flow](#data-flow)
  - [Local Storage and Privacy](#local-storage-and-privacy)
  - [Dynamic, Empathetic Prompts](#dynamic-empathetic-prompts)
  - [Private Sentiment & Theme Analysis](#private-sentiment--theme-analysis)
  - [Insightful Reflection Summaries](#insightful-reflection-summaries)
  - [Speech‑to‑Text Journaling](#speechtoText-journaling)
  - [Streaks](#streaks)
- [UI/UX Notes](#uiux-notes)
- [Extending the Project](#extending-the-project)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)
- [Ethical Considerations, Security, and Limitations](#ethical-considerations-security-and-limitations)

## Demo Highlights
- Modern, glassmorphism‑inspired UI with regular CSS classes (no Tailwind required).
- Write tab with prompts, a large editor, and recent entry previews.
- Dashboard with trends (Recharts) and theme analysis.
- Insights with weekly/monthly summaries and positive highlights.
- Speech‑to‑text button that converts spoken notes to a coherent entry via the LLM.
- Journaling streak badge in the header (🔥 N days).

## Problem & Audience
- People struggle to sustain journaling due to blank pages, uncertainty about topics, and difficulty synthesizing insights.
- Target users:
  - Individuals focused on mental wellness
  - New journalers needing guidance
  - Busy professionals who want quick reflection

## Key Features
- Dynamic, empathetic prompts based on recent entries
- Private sentiment and theme analysis with visual dashboards
- Weekly/monthly insight summaries
- Speech‑to‑text journaling with automatic composition
- Full entry modal viewer for past entries and highlights
- Journaling streak to encourage habit formation

## Architecture Overview
- Next.js Page Router application (TypeScript + React)
- Client‑side state for UI and entries; entries persist in `localStorage`
- Serverless API routes for Gemini requests to avoid exposing API keys
- CSS is authored in `src/styles/globals.css` using custom classnames
- Charts via Recharts; date utilities via date‑fns

High level diagram:
- UI (React pages and components)
  - Pages: `src/pages/index.tsx` (app), `src/pages/api/*` (API)
  - Components: `JournalEntry`, `JournalDashboard`, `InsightSummary`
- Client helpers: `src/lib/gemini.ts`
- Serverless routes: `/api/analyze`, `/api/prompts`, `/api/insights`, `/api/themes`, `/api/compose`
- Persistence: browser `localStorage` only

## Tech Stack
- Next.js (Page Router) + TypeScript
- React + CSS (no Tailwind runtime)
- Recharts, date‑fns, lucide‑react icons
- Google Gemini API (via `@google/generative-ai`) in API routes

## Repository Structure
```text
journal-companion/
  README.md
  env.example
  next.config.ts
  next-env.d.ts
  package.json
  tsconfig.json
  public/
  src/
    components/
      JournalEntry.tsx         # Write tab: prompts, editor, speech-to-text
      JournalDashboard.tsx     # Dashboard charts & stats
      InsightSummary.tsx       # Weekly/monthly summary & positive highlights
    lib/
      gemini.ts                # Client helpers for API routes (analyze, prompts, compose, insights)
    pages/
      _app.tsx                 # Global styles import
      index.tsx                # Main page (tabs: Write, Dashboard, Insights)
      api/
        analyze.ts             # Calls Gemini to analyze an entry (sentiment, themes, insights)
        prompts.ts             # Generates empathetic prompts
        insights.ts            # Generates weekly/monthly insight summaries
        themes.ts              # Analyzes themes over time
        compose.ts             # Composes coherent entry from speech transcript
    styles/
      globals.css              # All CSS (layout, components, utilities)
```

## Getting Started
1) Prerequisites
- Node.js 18+ (Node 20 recommended)
- A Google Gemini API key
- A modern browser (Chrome recommended for speech recognition)

2) Install
```bash
cd journal-companion
npm install
```

3) Configure environment
- Copy `env.example` to `.env` and set `GEMINI_API_KEY`.

4) Run
```bash
npm run dev
```
Open `http://localhost:3000`.

5) Build
```bash
npm run build && npm run start
```

## Configuration
- `.env`
  - `GEMINI_API_KEY`: your server‑side Gemini API key. Never expose on the client.

## Scripts
- `dev` – Start Next.js in development
- `build` – Production build
- `start` – Run the production server
- `lint` – Linting if configured

## How It Works

### Data Flow
- User writes (or speaks) an entry in the Write tab
- Entry saved to `localStorage` immediately for privacy
- Optionally, a serverless route calls Gemini to analyze the content
- Results (sentiment, themes, insights) are merged back into the saved entry
- Dashboard and Insights derive aggregate stats and visualizations from entries

### Local Storage and Privacy
- All entries are stored locally in the browser via `localStorage` (no external DB)
- Analysis calls go to your own Next.js API routes; the API key never reaches the browser
- If Gemini is unavailable, simple, local fallback analysis runs client‑side

### Dynamic, Empathetic Prompts
- Recent entries inform the prompt generation
- `/api/prompts` returns up to 6 context‑aware prompts
- Fallback prompt generation runs client‑side if API fails

Code: `src/lib/gemini.ts` → `generateDynamicPrompts()`, API: `src/pages/api/prompts.ts`

### Private Sentiment & Theme Analysis
- `/api/analyze` returns sentiment, themes, insights, word count, intensity, and topics
- Dashboard computes trends and distribution
- `/api/themes` enhances theme analysis (with counts, examples, relationships)
- Client has local keyword fallback for offline/failed calls

Code: `src/lib/gemini.ts` → `analyzeJournalEntry()`, APIs: `analyze.ts`, `themes.ts`

### Insightful Reflection Summaries
- `/api/insights` generates weekly/monthly summaries
- UI shows period toggle, summary, key patterns, growth opportunities, theme analysis, and positive highlights

Code: `src/components/InsightSummary.tsx`, `src/pages/api/insights.ts`

### Speech‑to‑Text Journaling
- Click “🎤 Speak to Journal” to start recording with the browser Web Speech API
- Stop to send the transcript to `/api/compose` which returns a coherent entry (first‑person)

Code: `JournalEntry.tsx` (recording flow), `lib/gemini.ts` (compose helper), `api/compose.ts`

### Streaks
- Calculates the current daily streak from unique dates of entries
- Starts from today if you wrote today, otherwise can begin from yesterday
- Displayed as “🔥 N days streak” in the header

Code: `src/pages/index.tsx` (streak utility + badge)

## UI/UX Notes
- Regular CSS with custom classnames in `globals.css`
- “Glass” surfaces for primary cards; gradients and badges for emphasis
- Modals for full entry view and highlight details
- Accessible buttons and keyboard shortcuts (⌘ + Enter to save)

## Extending the Project
- Swap `localStorage` with your preferred DB (e.g., SQLite/Prisma, Supabase, or filesystem)
- Add auth to sync entries across devices
- Strengthen on‑device analysis by moving more heuristics client‑side
- Expand insights (e.g., energy patterns, routines, correlations)
- Add export/import for entries (JSON/Markdown)

## Troubleshooting
- Speech Recognition not available
  - Use Chrome or ensure `webkitSpeechRecognition` is supported
- Gemini errors
  - Verify `GEMINI_API_KEY` in `.env`
  - Check the server console for API errors returned by routes
- Styles not loading
  - Ensure `src/pages/_app.tsx` imports `../styles/globals.css`
- Build warnings
  - Some hooks may warn about dependencies; code intentionally scopes calls to avoid loops

## Roadmap
- On‑device embedding and similarity prompts
- Daily notifications/reminders
- Secure local encryption of entries
- Editable tags and manual theme curation
- Editable insights and guided plans

## License
MIT

---

## Ethical Considerations, Security, and Limitations

### Ethical Considerations
- Non‑judgmental language: Prompts and insights are written to be supportive, not diagnostic. The app avoids medical claims and does not replace professional care.
- User autonomy: Users choose when to save, analyze, or speak entries; the app does not auto‑share or gamify in coercive ways. The streak is encouraging but optional.
- Sensitive content: Journals may include sensitive topics. UI copy avoids triggering or prescriptive language and emphasizes self‑compassion.
- Bias and model behavior: Gemini outputs may reflect biases present in training data. We constrain prompts to be empathetic and ask the model for gentle, non‑clinical language.

### Security
- API key safety: The Gemini API key is kept server‑side in Next.js API routes; it is never exposed to the client.
- Data residency: Entries are stored locally in the user’s browser via `localStorage` and are not transmitted to any external database by default.
- Transport: Requests to API routes travel over HTTPS in production (via your hosting provider). No third‑party analytics are included by default.
- Surface area: Serverless functions are minimal, validating inputs and returning JSON only. Consider adding rate limiting and request size limits in production.

### Privacy
- Default private by design: All content remains on‑device unless the user explicitly requests an AI analysis or composition (which sends only the specific text to your own API route for processing by Gemini).
- Opt‑in: Speech‑to‑text uses the browser’s Web Speech API. Audio is not uploaded by this app; only the transcript is used, and only if the user stops recording and confirms.
- No tracking: There is no built‑in telemetry or tracking. If added, disclose and allow opt‑out.

### Limitations
- Local storage only: Data can be cleared by the browser (e.g., cache clears, private mode). Add export/import or syncing for resilience.
- Model fallibility: Sentiment, themes, and summaries may be incorrect or simplistic. The UI frames insights as suggestions, not facts.
- Connectivity: AI features require network access to Gemini. Fallback heuristics are basic and less accurate.
- Browser support: Speech recognition is best in Chrome (Web Speech API). Other browsers may not support it.
- Not clinical: This is not a medical tool or crisis resource; include help links and disclaimers if deploying to end users.

## Future Ideas and Next Steps

Below are concrete directions to deepen impact and address additional areas of the prompt (engagement, insightfulness, privacy/trust, responsible AI):

### 1) Personalization & Goals
- Guided onboarding to capture goals (e.g., sleep, stress, creativity) and preferred tone.
- Goal‑aware prompt generation and insights (e.g., track energy vs. morning walk habit).
- Weekly plan suggestions derived from themes + goals, with opt‑in nudges.

### 2) Habit Formation & Engagement
- Smart reminders based on user‑preferred times and streak state (respecting do‑not‑disturb).
- Gentle challenges (e.g., “3‑day calm series”) and achievement badges aligned with self‑care, not gamified pressure.
- Calendar view with mood overlays; simple “one‑tap reflection” for busy days.

### 3) Deeper Insightfulness
- On‑device embeddings for theme clustering and similarity search (find related entries, “when I felt energized”).
- Correlation exploration: surface links between routines (walks, focus blocks) and mood trends.
- Richer dashboards (time of day, weekday patterns, sentiment volatility, topic co‑occurrence).

### 4) Privacy & Security Upgrades
- Local encryption‑at‑rest (passphrase‑derived key), zero‑knowledge optional cloud sync/backup.
- Granular consent: per‑entry analysis, redaction controls (mask names, locations) before AI calls.
- Local red‑flag detection running on‑device to avoid sensitive data leaving the device.

### 5) Responsible AI & Guardrails
- Tone and harm‑avoidance constraints in prompt/insight templates.
- Model transparency notes (“AI‑generated; may be imperfect”) and user controls to edit/dismiss.
- Crisis and clinical disclaimers with optional resource links (region‑aware).

### 6) Accessibility & Inclusivity
- Multi‑language prompts and summaries; RTL support.
- Voice‑only capture mode; captions for any audio feedback.
- High‑contrast theme and reduced‑motion options.

### 7) Platform & Integrations
- Mobile apps (React Native/Expo) with offline‑first sync.
- Optional integrations (Apple Health/Google Fit) to correlate sleep/activity with mood (strict opt‑in).
- Export/import (JSON/Markdown) and optional email digests sent locally (client‑generated).

### 8) Collaboration & Coaching (Opt‑in)
- Share a single entry via expiring link; redact by default.
- “Co‑pilot” mode: conversational journaling session with explicit, time‑boxed scope.

These enhancements target the prompt’s success metrics:
- Engagement: streaks, reminders, challenges, faster capture.
- Insightfulness: correlations, embeddings, richer dashboards.
- Privacy/Trust: encryption, consent, redaction, local red‑flags.
- Responsible AI: guardrails, transparency, crisis resources.
