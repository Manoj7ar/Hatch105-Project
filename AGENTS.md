<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Service overview

Single Next.js 16 application (App Router + Turbopack). No database, no Docker, no external services required for local development. All state is JSON on the filesystem.

### Running the app

- `npm run dev` — starts dev server on http://localhost:3000
- The app loads committed `scores/*.json` on first paint, so no seeding step is required to view rankings.

### Environment variables

Create `.env.local` in the repo root. Key vars:
- `GROQ_API_KEY` — required for LLM-powered scoring, chat, and brief. Without it, set `SCORING_MODE=heuristic` for deterministic fallback scoring (rankings still display from committed scores).
- `BLOB_READ_WRITE_TOKEN` — only needed on Vercel; locally the filesystem is used.
- `FIRECRAWL_API_KEY` — only for external research mode; defaults to grounded.

### Commands reference

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Tests | `npm test` |
| Build | `npm run build` |
| Seed scores | `npm run seed` (requires GROQ_API_KEY or `SCORING_MODE=heuristic`) |

### Gotchas

- ESLint reports pre-existing errors (react-hooks/set-state-in-effect, rules-of-hooks false positives in non-hook utility functions). These are known and not blockers.
- The lint rule `react-hooks/rules-of-hooks` fires on `lib/scorer.ts` because functions like `useGroqScoring` follow hook naming but are plain config-reading helpers — not actual React hooks.
- Without `GROQ_API_KEY`, features like chat, executive brief, and live re-rank with Groq will not function. The ranking dashboard still renders from pre-committed scores.
