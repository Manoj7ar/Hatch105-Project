# Hatch105 Thesis Ranker

Inspectable ranking system for the [Hatch105 Build Challenge](Hatch105%20Build%20Challenge.html): scores 50 Happy Stack Labs theses on **Hatch Fit** (buildability, speed to revenue, wedge, distribution, trap risk, expansion) and re-ranks when new theses arrive.

## Quick start

```bash
npm install
cp .env.example .env.local   # add GROQ_API_KEY from https://console.groq.com
npm run seed               # Score all 50 → scores/*.json + RANKING.md
npm run dev                # http://localhost:3000
```

## Ask the dataset (grounded chat)

Open **http://localhost:3000/chat** — a ChatGPT-style interface that answers **only** from your local thesis rankings (no web search). Each request reloads `candidate_theses.json`, `scores/*.json`, and the rubric into the Groq system prompt.

Requires `GROQ_API_KEY` in `.env.local`. The server injects rankings + scores + rubric into each request (compact snapshot for Groq token limits; top 8 theses include full criterion notes). To score new ideas, use **Live re-rank** on the Rankings page (chat does not score).

## Live re-rank (CLI — use on the call if UI/network fails)

```bash
npm run rank -- --input fixtures/new_theses.json --merge
```

Or paste JSON in the **Live re-rank** tab in the UI.

## Criteria

See [CRITERIA.md](CRITERIA.md) — weights, 1–5 anchors, hard gates (`G3D`, `REALTIME_AI`, etc.). Hard gates always run in code **after** the model scores.

## Scoring modes

| Mode | How |
|------|-----|
| **auto** (default) | Groq when `GROQ_API_KEY` is set; otherwise heuristic |
| **groq** | Force Groq (fails over to heuristic per thesis on API error) |
| **heuristic** | Deterministic rules + gates; no API key |

```bash
# Groq (recommended for challenge)
GROQ_API_KEY=gsk_... GROQ_MODEL=openai/gpt-oss-20b npm run seed

# Heuristic only
SCORING_MODE=heuristic npm run seed
```

Groq scoring adds per-thesis **technical snapshot**, **3d / 3w / 10w v1 plan**, and optional **trap note** (visible in the detail panel).

## Deploy (Vercel)

1. Push repo to GitHub and import on [Vercel](https://vercel.com).
2. Committed `scores/*.json` powers the UI without Groq on page load.
3. For **live re-rank**, set environment variables:
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (optional, default `llama-3.3-70b-versatile`)
   - `SCORING_MODE=auto`

```bash
npx vercel --prod
```

## Project structure

```
lib/
  scorer.ts          Groq + heuristic, gates applied after LLM
  prompts/           Rubric prompt for Groq
  gates.ts           Deterministic trap caps
scores/              Persisted per-thesis JSON (inspectable)
app/api/             ranking + rerank
components/          UI
fixtures/            Sample theses for dry-run
scripts/             seed + CLI rank
```

## Executive pick

Re-run `npm run seed` with Groq to refresh rankings. Heuristic default was **TrackReply (H-48)** at the top; Groq may shift order with richer technical judgment.

---

*Theses are confidential — do not redistribute candidate_theses files.*
