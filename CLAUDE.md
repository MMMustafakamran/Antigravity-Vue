# Antigravity-vue

Docs QA harness for CopilotKit + Google Antigravity, Vue: https://docs.copilotkit.ai/vue/google-antigravity. One route per doc page, doc code verbatim, one clip per page. The goal is to show doc defects; fixes that hide one are banned. Overview, layout, Run and pipeline: [README.md](README.md).

## Rules

`.qa/` is the vendored copy of the shared tooling and rules (filled by the sync script; never edit it here).

@.qa/instructions/QA-RULES.md
@.qa/instructions/AUTORECORDER.md
@.qa/instructions/VOICE.md
@.qa/instructions/REVIEW.md
@.qa/instructions/REPORT.md

## This repo

- Ports (from `start-all.sh`): Vite **5140**, runtime **8140** (`server.antigravity.ts`), own quickstart agent **8141** (`backend/main.py`, `uv`, health at `/health`). Never 3000 / 8000; the doc's 5173 / 8200 are overridden.
- The repo runs on its own (no Antigravity-react needed). `backend/` is the doc's quickstart agent, copied verbatim via Antigravity-react; only the port is a harness change.
- The runtime is `server.antigravity.ts` (HttpAgent → 8141) because the doc's BuiltInAgent `server.ts` never reaches Antigravity (FINDINGS #1). HARNESS evidence; the finding stands.
- The doc's `.env` is never loaded by the backend (Antigravity-react FINDINGS #1), so `start-all.sh` uses `uv run --env-file .env`.
- Keys: `backend/.env` (`GEMINI_API_KEY`). Names in [.env.example](.env.example). Never print or commit them.
- **The 2026-11-04 clips must be re-recorded**: the old `actions/antigravity.actions.ts` drew red outlines and captions on the page (REVIEW.md: `rerecord`). Use the drag-select + Notepad evidence step (`actions/doc-evidence.ts`).
- Findings from the 2026-11-04 assignment were logged directly (one-off exception, QA-RULES section 6). New findings are approved by the owner locally.
- `vite` dev doesn't type-check: `vue-tsc` / `vite build` errors are build-only findings (QA-RULES section 5).
- Recorder: `autorecorder/` (`npm run record -- --pages=<id>`, `record:list`, `doctor`). `autorecorder/core/` is frozen, see `autorecorder/CLAUDE.md`. Clips go to `autorecorder/videos/` (not committed).
- Report rows use the team doc's older Antigravity `status` style (`assignment.json` `report.style`).
