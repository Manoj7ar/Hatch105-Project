# Hatch105 Thesis Ranker

Inspectable ranking system for the [Hatch105 Build Challenge](Initial-dataset/Hatch105%20Build%20Challenge.html): score 50 Happy Stack Labs theses on **Hatch Fit**, explain every placement, and **re-rank the full set** when new ideas arrive in the same JSON/CSV format.

Built with **Next.js**, **Groq** (optional), and persisted `scores/*.json` so humans and reviewers can audit every decision.

---

## What you get

| Capability | Where |
|------------|--------|
| Ranked list of all 50 theses | [http://localhost:3000](http://localhost:3000) → **All ideas** |
| Written rubric + hard gates | [CRITERIA.md](CRITERIA.md) + [`lib/gates.ts`](lib/gates.ts) |
| Full company profile + cohort charts | `/ideas/H-01` … `/ideas/H-50` |
| **Live re-rank** (batch ingest + progress) | **Live re-rank** tab or CLI |
| Grounded dataset chat (`@` mentions) | [/chat](http://localhost:3000/chat) |
| Compare up to 4 teams | [/compare](http://localhost:3000/compare) |
| Portfolio board (local) | **Portfolio** tab |
| Executive brief export | **Executive brief** button |

---

## Quick start

```bash
npm install
cp .env.example .env.local   # set GROQ_API_KEY from https://console.groq.com
npm run seed                 # score all 50 → scores/*.json + RANKING.md
npm run dev                  # http://localhost:3000
```

The UI reads committed `scores/*.json` on load. Re-run `npm run seed` after rubric or model changes.

**Without Groq:** `SCORING_MODE=heuristic npm run seed` — deterministic rules, no API key.

---

## Environment variables

Copy [`.env.example`](.env.example). Common settings:

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Groq API for scoring, chat, brief |
| `GROQ_MODEL` | Default `llama-3.3-70b-versatile` (chat + scoring) |
| `GROQ_SCORING_MODEL` | Optional separate model for structured scoring only |
| `SCORING_MODE` | `auto` \| `groq` \| `heuristic` |
| `SCORING_ROUTING` | `smart` (heuristic first) \| `always_groq` |
| `SCORING_TWO_PASS` | Pass 1 scores; pass 2 adds snapshot/plan for top fits |
| `FIRECRAWL_API_KEY` | External research mode (optional) |
| `RESEARCH_DEFAULT_MODE` | `grounded` \| `external` |
| `CRITERIA_VERSION` | Rubric version stamped on each score |

---

## How ranking works

**North star:** Which thesis should a **3-person Hatch team** build this year — shippable in **10 weeks**, revenue inside **10 weeks**, without trap pivots.

### Hatch Fit (1–5)

Weighted average of six criteria (see [CRITERIA.md](CRITERIA.md)):

| Criterion | Weight |
|-----------|--------|
| Buildability (3d · 3w · 10w) | 25% |
| Speed to revenue | 20% |
| Wedge clarity | 15% |
| Distribution | 15% |
| Trap risk *(inverted)* | 10% |
| Expansion | 15% |

### Pipeline

1. **Input** — [`Initial-dataset/candidate_theses.json`](Initial-dataset/candidate_theses.json) (title, one_liner, example_customer, wedge).
2. **Score** — [`lib/scorer.ts`](lib/scorer.ts): Groq structured output (AI SDK) or [`lib/heuristic.ts`](lib/heuristic.ts) fallback.
3. **Gates** — [`lib/gates.ts`](lib/gates.ts) always runs **after** the model (`G3D`, `REALTIME_AI`, etc.).
4. **Persist** — `scores/H-XX.json` (inspectable JSON per thesis).
5. **Rank** — [`lib/rank.ts`](lib/rank.ts) sorts by Hatch Fit; [`RANKING.md`](RANKING.md) + UI consume the result.

Evidence on each criterion is tagged **sourced**, **inferred**, or **guess**.

---

## Live re-rank (challenge step 3)

Paste or upload **new theses** in the same JSON/CSV shape as the dataset.

**UI:** Rankings → **Live re-rank** → **Score & re-rank with Groq** → watch per-thesis progress → full list updates with placement summaries.

**CLI** (reliable on a walkthrough if the network fails):

```bash
npm run rank -- --input fixtures/new_theses.json --merge
```

[`fixtures/new_theses.json`](fixtures/new_theses.json) includes five sample ideas (H-51–H-55) for dry runs.

---

## Chat

**[/chat](http://localhost:3000/chat)** answers from the local ranking snapshot only (no web search in chat). Type `@` to mention a team; links in replies open `/ideas/[ref]`.

From any company page, **Ask in chat** prefills `@TeamName` in the composer.

Chat does **not** score new ideas — use **Live re-rank** for that.

---

## Company pages

Each thesis has a dedicated route: **`/ideas/H-XX`**

- **Why this rank** — headline plus strongest/weakest criteria vs cohort (template-driven from `scores/*.json`)
- **Rank vs gates** — callout when fit is high but hard gates fired
- **Similar in cohort** — three nearest neighbors by criterion profile
- **10-week build lens** — toggle for buildability + trap safety vs cohort and v1 timeline (3d / 3w / 10w)
- Rank context vs cohort (median, percentile)
- Radar + bar charts vs cohort averages
- Criterion breakdown with reasons
- Research (grounded / Firecrawl) and **Re-score with Groq**
- Human override paper trail (`overrides/H-XX.json`)
- Previous / next in rank order

**Traps tab** (home): narrative **trap stories** (paper titans, incumbent squeeze, scope/platform, low fit), **rank vs gates** tension table, then the full flagged list.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (pre-renders 50 idea pages) |
| `npm run seed` | Score all candidate theses |
| `npm run rank -- --input <file> [--merge]` | CLI live re-rank |
| `npm test` | Vitest — gates + heuristic golden cases |
| `npm run lint` | ESLint |

---

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ranking` | GET | Full ranking state + markdown |
| `/api/rerank/batch` | POST, GET | Start/poll batch scoring job |
| `/api/teams` | GET | Teams for `@` autocomplete |
| `/api/chat` | POST | Grounded chat (streaming) |
| `/api/research/[ref]` | GET, POST | Research + optional re-score |
| `/api/overrides/[ref]` | POST | Human override note |
| `/api/brief` | POST | Executive memo (Groq) |

---

## Project layout

```
Initial-dataset/          Challenge brief + candidate_theses.{json,csv}
CRITERIA.md               Rubric (human-readable source of truth)
fixtures/                 Sample theses for live re-rank practice
scores/                   One JSON file per thesis (committed for deploy)
data/competitors.json     Grounded research cache for "vs X" wedges
lib/
  scorer.ts               Groq + heuristic scoring
  gates.ts                Deterministic post-LLM caps
  rerank-batch.ts         Batch jobs + finalize ranking
  thesis-detail.ts        Cohort benchmarks (server)
  prompts/                Groq system prompts
app/
  page.tsx                Rankings dashboard
  ideas/[ref]/            Per-company detail pages
  chat/                   Grounded chat
  compare/                Side-by-side compare
  api/                    HTTP handlers
components/               UI (rankings, thesis charts, chat, rerank)
scripts/                  seed-scores.ts, rank.ts
tests/                    Regression tests
```

Runtime paths (gitignored): `.jobs/`, `research/`, `scores/archive/`.

---

## Deploy (Vercel)

1. Import the repo on [Vercel](https://vercel.com).
2. Committed `scores/*.json` lets the rankings UI work without Groq on cold start.
3. Set `GROQ_API_KEY` (and optional vars above) for **Live re-rank**, chat, and brief.

```bash
npx vercel --prod
```

---

## Tests

```bash
npm test
```

Covers hard gates, fit bands, and heuristic snapshots on golden fixtures in [`tests/fixtures/golden-theses.json`](tests/fixtures/golden-theses.json).

---

## Confidentiality

Theses in `Initial-dataset/` are confidential per the challenge brief — do not redistribute them outside the review process.

---

## License

Private challenge submission — see repository owner for usage terms.
