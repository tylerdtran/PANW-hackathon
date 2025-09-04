# Demo Video Script (5–7 minutes)

This script walks through the problem, target users, solution, live product tour, architecture, and responsible AI considerations — tailored to a 5–7 minute demo.

---

## 0:00 – 0:30 Intro: Problem & Who We Help
- "Hi, I’m [Name], and this is Journal Companion — a private, empathetic, intelligent journaling app."
- "The problem: people know journaling is good for mental health, but get stuck with blank pages, don’t know what to write, and can’t easily make sense of their emotions over time."
- "We’re helping three groups: 1) wellness‑focused folks who want to understand patterns, 2) people new to journaling who need guidance, and 3) busy professionals who need quick, effective reflection."

## 0:30 – 1:30 Solution in One Line + Success Criteria
- "Journal Companion gives you context‑aware prompts, on‑device analysis, and gentle insights — so reflection becomes a daily habit, not a chore."
- "Success metrics we track: engagement (daily streaks and usage), insightfulness (helpful patterns and summaries), privacy and trust (local storage, key stays server‑side), and quality of AI application."

## 1:30 – 3:30 Product Tour (Write → Dashboard → Insights)

### Write Tab (Prompts, Speech‑to‑Text, Save)
- "On the Write tab, we help you start with dynamic, empathetic prompts based on your recent entries and themes — not one‑size‑fits‑all."
- Hover/click: "Notice how prompts reflect recent context (e.g., if I wrote about work stress, I’ll see a calming follow‑up like ‘How did you find moments of calm today?’)."
- "Typing is a lot of work — click ‘Speak to Journal.’ We use the browser’s speech recognition to capture your thoughts, then the LLM composes a coherent journal entry in your voice."
- "Recent entries appear below. Click to open a full modal with the entry, sentiment, and themes."
- "We encourage consistency with a visible streak: ‘🔥 N‑day streak.’"

### Dashboard (Trends & Themes)
- "The Dashboard visualizes sentiment over time, distribution, and top themes — so you see what’s really going on, at a glance."
- "These charts help answer: What emotions recur? Which themes show up the most? Am I trending more positive, neutral, or mixed?"

### Insights (Weekly/Monthly Summaries)
- "The Insights tab gives a gentle weekly summary: top themes, dominant sentiment, key patterns, and supportive recommendations."
- "Positive highlights are clickable — you can pop them open, revisit bright spots, and reinforce what’s working."

## 3:30 – 4:30 Under the Hood (Architecture & Privacy)
- "We built this with Next.js (Page Router), TypeScript, and plain CSS for a fast, portable UI."
- "Entries are stored locally in the browser via localStorage by default — your words stay on your device."
- "When we call the LLM, we hit our own Next.js API routes — the Gemini API key lives server‑side and is never exposed to the client."
- "If the network is unavailable, we use a local fallback sentiment/theme heuristic, so the app remains usable."
- "Charts are powered by Recharts; date calculations by date‑fns; icons by lucide‑react."

## 4:30 – 5:30 Responsible AI & Limitations
- Ethics: "We use supportive, non‑judgmental language and avoid clinical claims. The app guides, it doesn’t diagnose or treat."
- Privacy: "Default private by design — local storage for entries, no tracking by default, opt‑in analysis only."
- Security: "Minimal serverless surface area, API key is server‑only, and traffic is HTTPS in production."
- Limitations: "Local storage can be cleared; speech recognition works best in Chrome; model outputs can be imperfect; offline heuristics are simpler than AI."
- Future: "Add encryption-at-rest locally, optional cloud sync/backup, and more robust on‑device analytics."

## 5:30 – 6:30 Why This Meets the Rubric
- Problem Understanding: "We targeted blank‑page anxiety and pattern discovery with prompts, summaries, and dashboards."
- Technical Rigor: "Next.js Page Router, typed APIs, server‑side key handling, resilient fallbacks, charts, and speech‑to‑text."
- Creativity: "Context‑aware prompts, highlight pop‑ups, streaks, and speech‑to‑text entry composition."
- Prototype Quality: "Everything you saw is functional: writing, speaking, saving, analyzing, charting, and summarizing."
- Responsible AI: "We address ethics, privacy, and limitations directly, and keep the user in control."

## 6:30 – 7:00 Closing
- "Journal Companion makes reflection simple, private, and genuinely helpful — so journaling becomes a habit you’ll keep."
- "Thanks for watching — happy to share the repo and answer questions."

---

## Optional Live Demo Flow (backup plan)
1. Start on Write tab → show prompts → click ‘Speak to Journal,’ say a short sentence → stop & insert composed text → click Save.
2. Hop to Dashboard → point out sentiment trend and top themes.
3. Hop to Insights → read the weekly summary → click a Positive highlight to open the modal.
4. Return to header → show updated streak if applicable.

## Callouts You Can Mention
- “Your entries never leave the device unless you choose to analyze or compose.”
- “LLM prompts are tuned for empathy; outputs are supportive, not clinical.”
- “If the network is down, we still give basic insights via local heuristics.”
- “We intentionally prioritized habit formation (streaks) and a gentle tone.”
