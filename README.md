# Antigravity-vue: CopilotKit docs QA (Google Antigravity, Vue)

QA harness for the CopilotKit Vue docs at https://docs.copilotkit.ai/vue/google-antigravity. Every doc page gets a route in a real Vite + Vue app with the doc's snippets pasted **verbatim**, and a screen-recorded clip shows what happens when a user follows the page. Where the docs break, the clip shows the break and the defect is listed in [FINDINGS.md](FINDINGS.md). Nothing here fixes a doc defect; the only allowed edits are marked `HARNESS` (rules: `.qa/instructions/QA-RULES.md`).

Status: recorded 2026-11-04, findings logged. **The clips need re-recording** (the old recorder drew red outlines on the page). 3 pages tracked in [assignment.json](assignment.json), 2 reachable (❌ Quickstart, ✅ Frontend Tools; Chat Components is marked `reachable: none` and kept out of the report), 2 clips, both on Loom. Current report: [report/status.html](report/status.html).

## Layout

```
backend/                 own copy of the doc's Antigravity quickstart agent (Python, uv), 8141
my-copilot-app/          Vite + Vue app, one route per doc page; runtime server.antigravity.ts (8140)
doc-snapshot/            rendered / .md snapshot of the docs (2026-11-04)
autorecorder/            clip recorder: cli.ts → core/engine.ts → actions/*.ts; config/*.config.ts; output videos/ (not committed)
narration/
  scripts/<clip>.json    voice-over script per ❌ clip ({clip, segments:[{at, text}]})
  audio/<key>.wav+.json  generated narration lines, reused while the text is unchanged
  voice.json             {model, refSha256}: lets CI find cached audio without the private reference voice
assignment.json          per-page status, notes, findings, clip ids, Loom links, review sign-off
report/status.html       generated from assignment.json (paste-friendly, team Google Doc format)
FINDINGS.md              open doc defects (stable #N ids)
.qa/                     vendored shared tooling + rules (synced; don't edit here)
start-all.sh             starts the backend, runtime and Vite on the harness ports (see Run)
```

## Run

This repo runs on its own: it has its own Antigravity quickstart agent in `backend/` and does not need Antigravity-react.

Prerequisites: Node.js 20+, Python 3.13 with [uv](https://docs.astral.sh/uv/), Git Bash (or any bash), `curl`.

1. Key: copy `.env.example` to `backend/.env` and fill in `GEMINI_API_KEY` (gitignored).
2. Install: `cd backend && uv sync`, then `cd ../my-copilot-app && npm ci`.
3. Start everything: `./start-all.sh` (logs in `logs/`). It starts, in order:

| Port | Server |
|---|---|
| 8141 | `backend/main.py`: the doc's Antigravity quickstart agent (`uvicorn main:app`, health at `/health`) |
| 8140 | `my-copilot-app/server.antigravity.ts`: runtime, HttpAgent -> :8141 |
| 5140 | Vite app: http://localhost:5140 |

Notes:
- Point the runtime at another agent with `AGENT_URL=... ./start-all.sh`.
- Never run on 3000 / 8000.
- `backend/` is copied verbatim from the docs' quickstart (via Antigravity-react/backend); only the port is a harness change, set in `start-all.sh`.
- Record clips: `cd autorecorder && npm run record` (see `autorecorder/`).

## Daily CI

`.github/workflows/daily.yml`. No LLM, no Fish key, no voice sample in CI; nothing is committed and no finding is written by CI (QA-RULES section 6).

**Triggers:** daily at 02:00 UTC (`schedule`), and `workflow_dispatch` (Actions → Daily QA run → Run workflow) with optional inputs `pages` (recorder page ids, comma-separated; empty = every page) and `shards` (default: 1 runner).

**Secrets to add** (Settings → Secrets and variables → Actions): `GEMINI_API_KEY` only. It is written to `backend/.env` at runtime and never printed.

**Jobs:**
1. `plan`: reads the page list from `autorecorder/config/pages.config.ts` and splits it across shards.
2. `record` (one runner per shard): installs deps + Playwright Chromium, starts the servers with `start-all.sh` (8141 backend, 8140 runtime, 5140 Vite; never 3000/8000), waits for health, then `npm run record -- --pages=...` under `xvfb`. A failed take does not fail the job (it is usually the doc defect).
3. `report`: doc drift (`.qa/tools/drift.mjs`: `doc-snapshot/pages/*.md` vs the live `https://docs.copilotkit.ai/<page>.md`; never updates the snapshot, never fails the run), then `.qa/tools/ci_post.py`: for every ❌/⚠️ page in `assignment.json` with a `narration/scripts/<clip>.json`, `.qa/narrate/narrate.py fit` then `mix` with the saved `narration/audio` + `narration/voice.json`; a flagged line (`overlap`/`gap`/`past-end`) or a line without saved audio is listed in the summary and the raw clip is still uploaded. Then `.qa/checks/batch.py` over every clip (expected status from `assignment.json`).

**Artifact:** one `run-<YYYY-MM-DD>` per run, kept 14 days (per-shard artifacts are temporary and deleted):

```
summary.md                 also shown on the run page (step summary)
videos/                    <clip>.webm, .timeline.json (schema 2), .events.jsonl, .frames/, RECORD_RESULTS.json, logs/
narration/                 <clip>.fit.json/.fit.txt, <clip>.narrated.mp4, mix logs
checks/                    <clip>.checks.json, <clip>.checks/ red frames, summary.md/.json
drift/                     drift.json, drift.md, live/ (live copy of each changed page)
narration-summary.json
logs/<shard>/              server + recorder logs
```

**Download locally** (into the workspace `runs/`, gitignored):

```sh
gh run list -R MMMustafakamran/Antigravity-Vue -w daily.yml
gh run download <id> -R MMMustafakamran/Antigravity-Vue -D runs/<date>/Antigravity-vue
```

Then the local review flow in `qa-kit/README.md` ("Downloading a run").

## How to review and report

- **A clip**: it should go doc → IDE (verbatim code) → demo, and for ❌/⚠️ also evidence (the faulty doc text drag-selected) → Notepad note. Nothing may be injected on the page. Full rubric: `.qa/instructions/REVIEW.md`.
- **A status**: ✅ works as documented, ⚠️ main feature works with a minor defect, ❌ main feature doesn't work as documented. If in doubt, ❌.
- **A finding**: propose it after the daily review; it is added to `FINDINGS.md` only after the owner approves. Format: QA-RULES section 5.
- **A narration script**: the owner reads the script for every new finding before its audio is generated (`.qa/instructions/VOICE.md`).
- **The report**: edit `assignment.json` (schema: `.qa/report/SCHEMA.md`), then rebuild. Don't hand-edit the HTML. Rows use the team doc's older Antigravity `status` style (`report.style`).

  ```sh
  python .qa/report/build.py assignment.json --out report/status.html
  # framework report for the team doc (React file first; needs a checkout of Antigravity-react beside this repo)
  python .qa/report/build.py ../Antigravity-react/assignment.json assignment.json --out Antigravity-status.html
  ```
