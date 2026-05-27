# Hatch105 Thesis Ranker

Inspectable ranking system for the [Hatch105 Build Challenge](Initial-dataset/Hatch105%20Build%20Challenge.html): scores 50 Happy Stack Labs theses on **Hatch Fit** (buildability, speed to revenue, wedge, distribution, trap risk, expansion) and re-ranks when new theses arrive.

## Quick start

```bash
npm install
cp .env.example .env.local   # add GROQ_API_KEY from https://console.groq.com
npm run seed               # Score all 50 → scores/*.json + RANKING.md
npm run dev                # http://localhost:3000
```

## Ask the dataset (grounded chat)

Open **http://localhost:3000/chat** — a ChatGPT-style interface that answers **only** from your local thesis rankings (no web search). Each request reloads `Initial-dataset/candidate_theses.json`, `scores/*.json`, and the rubric into the Groq system prompt.

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
GROQ_API_KEY=gsk_... GROQ_MODEL=llama-3.3-70b-versatile npm run seed

# Heuristic only
SCORING_MODE=heuristic npm run seed
```

Groq scoring adds per-thesis **technical snapshot**, **3d / 3w / 10w v1 plan**, and optional **trap note** (visible in the detail panel).

## How we teach Groq to rank the dataset

This is **not** fine-tuning a custom model. We use Groq’s **`llama-3.3-70b-versatile`** by default for chat, briefs, and scoring (override with `GROQ_MODEL`). Optional `GROQ_SCORING_MODEL=openai/gpt-oss-20b` if you want GPT-OSS only for structured thesis JSON.

1. **Input** — Each row from [`Initial-dataset/candidate_theses.json`](Initial-dataset/candidate_theses.json) (team name, one-liner, customer, wedge) plus the full [CRITERIA.md](CRITERIA.md) rubric (condensed in [`lib/prompts/rubric-summary.ts`](lib/prompts/rubric-summary.ts)).
2. **Prompt** — [`lib/prompts/score-thesis.ts`](lib/prompts/score-thesis.ts) tells the model to score six criteria (1–5), write one-sentence reasons, output a verdict, technical snapshot, 10-week v1 plan, and trap note when relevant.
3. **Structured output** — [`lib/scorer.ts`](lib/scorer.ts) uses the AI SDK `generateObject` path (with JSON parse fallback) so each thesis becomes a typed object matching [`LlmScoreOutputSchema`](lib/types.ts).
4. **Deterministic gates** — [`lib/gates.ts`](lib/gates.ts) always runs **after** the LLM (e.g. `G3D`, `REALTIME_AI`) so traps cannot be ignored.
5. **Persist & rank** — Scores land in `scores/H-XX.json`; [`lib/rank.ts`](lib/rank.ts) computes Hatch Fit and sort order; `RANKING.md` and the UI read those files.

Batch scoring (`npm run seed`) walks all 50 theses. When Groq returns malformed JSON, the run logs the schema error and retries or falls back to the heuristic scorer for that thesis—so the pipeline still completes.

![Groq batch scoring: re-scoring theses with structured JSON output and per-thesis Hatch Fit results](docs/images/groq-seed-scoring.png)

*Example log: `npm run seed` with Groq scoring teams H-40–H-46. Each line is a saved score with verdict and `scoredWith: groq`. Occasional schema validation errors (missing `verdict`, `technicalSnapshot`, etc.) trigger retry or heuristic fallback.*

**Grounded chat** uses the same dataset differently: on each `/chat` message we inject the latest rankings and scores into the system prompt ([`lib/dataset-context.ts`](lib/dataset-context.ts)) so Groq answers only from that snapshot—no web search and no re-scoring inside chat.

## Deploy (Vercel)

1. Push repo to GitHub and import on [Vercel](https://vercel.com).
2. Committed `scores/*.json` powers the UI without Groq on page load.
3. For **live re-rank**, set environment variables:
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (optional, default `llama-3.3-70b-versatile`)
   - `GROQ_SCORING_MODEL` (optional, e.g. `openai/gpt-oss-20b` for scoring only)
   - `SCORING_MODE=auto`

```bash
npx vercel --prod
```

## Power features

| Feature | Where |
|---------|--------|
| **Evidence tags** (sourced / inferred / guess) | Thesis detail panel, compare, markdown export |
| **Human override + paper trail** | Thesis panel → Edit override → `overrides/H-XX.json` |
| **Research this team** | Grounded (competitor cache) or External (Firecrawl) → re-score with citations |
| **Competitor cache** | [`data/competitors.json`](data/competitors.json) injected when wedge mentions `vs X` |
| **Shopify surface checker** | Flags impossible surfaces before scoring |
| **Batch re-rank** | Live re-rank tab → progress bars + retry failed |
| **Compare tray** | `/compare` — up to 4 teams, mobile-friendly |
| **Portfolio Kanban** | Rankings → Portfolio tab (localStorage) |
| **Keyboard shortcuts** | `/` search · `j`/`k` navigate · `Enter` open · `?` help |
| **Executive brief** | Rankings → Executive brief (Groq memo from current ranking) |
| **Chat handoffs** | Score this idea · Add to compare chips on comparison tables |
| **Regression tests** | `npm test` — gates + heuristic golden theses |

Score archives on overwrite: `scores/archive/{criteriaVersion}/`.

## Project structure

```
Initial-dataset/     Challenge brief + candidate_theses.csv / .json
lib/
  scorer.ts          Groq + heuristic, gates applied after LLM
  prompts/           Rubric prompt for Groq
  gates.ts           Deterministic trap caps
scores/              Persisted per-thesis JSON (inspectable)
app/api/             ranking, rerank, batch, research, overrides, brief
data/competitors.json
overrides/           Human governance trail
components/          UI
fixtures/            Sample theses for dry-run
scripts/             seed + CLI rank
```

## Executive pick

Re-run `npm run seed` with Groq to refresh rankings. Heuristic default was **TrackReply (H-48)** at the top; Groq may shift order with richer technical judgment.

---

*Theses are confidential — do not redistribute `Initial-dataset/` files.*
