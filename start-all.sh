#!/usr/bin/env bash
# HARNESS: starts every Antigravity-vue server on its harness ports (REPOS.md: never 3000/8000).
#   8141 own Antigravity quickstart agent (backend/main.py; React quickstart: 8000)
#   8140 runtime server.antigravity.ts (HttpAgent -> :8141); the rendered quickstart has no Vue
#        steps (FINDINGS.md #9). Doc: 8200.
#   8155 Gemini key/model pool (tools/gemini_pool.py, OpenAI fallback) when GOOGLE_GEMINI_BASE_URL points at it
#   5140 Vite (doc: 5173)
# Override the agent URL with AGENT_URL. Key: backend/.env (see .env.example). The backend uses
# --env-file because the doc's .env is never loaded (Antigravity-react FINDINGS.md #1).
cd "$(dirname "$0")"
mkdir -p logs
: "${AGENT_URL:=http://localhost:8141}"

# HARNESS: Gemini pool on 8155 (copied from the google-adk repo). Keys: GEMINI_POOL_KEYS / GEMINI_POOL_KEYFILES, OpenAI as last-resort fallback;
# CI writes GOOGLE_GEMINI_BASE_URL=http://localhost:8155 into backend/.env so google-genai goes through it.
# --with httpx: the pool needs httpx, the doc's backend install doesn't have it.
(cd backend && PORT=8155 uv run --with httpx python ../tools/gemini_pool.py > ../logs/gemini-pool-8155.log 2>&1) &

# 1. agent backend
(cd backend && uv run --env-file .env uvicorn main:app --port 8141 > ../logs/backend-8141.log 2>&1) &
echo "waiting for the Antigravity backend on $AGENT_URL ..."
for _ in $(seq 1 60); do
  curl -sf "$AGENT_URL/health" > /dev/null 2>&1 && break
  sleep 2
done

# HARNESS: backends for the pages added 2026-11-10 (one port per page group).
(cd backend && uv run --env-file .env uvicorn main:app --port 8142 > ../logs/backend-8142.log 2>&1) &  # HARNESS: V1 quickstart-agent copy
(cd backend && uv run --env-file .env uvicorn v2_main:app --port 8143 > ../logs/backend-8143.log 2>&1) &  # HARNESS: V2 tool/state rendering, mcp apps
(cd backend && uv run --env-file .env uvicorn shared_state_main:app --port 8144 > ../logs/backend-8144.log 2>&1) &  # HARNESS: V3 shared-state pages
# HARNESS: V4 hitl/interrupt/subagents; --with httpx because subagents.py imports httpx and the doc's install never adds it (FINDINGS.md #47)
# HARNESS: the showcase _common.py (copied, never published) defaults to /data/ws, not writable on CI runners
mkdir -p backend/.antigravity-data/ws backend/.antigravity-data/sessions
(cd backend && ANTIGRAVITY_WORKSPACE="$PWD/.antigravity-data/ws" ANTIGRAVITY_SAVE_DIR="$PWD/.antigravity-data/sessions" uv run --with httpx --env-file .env uvicorn v4_main:app --port 8145 > ../logs/backend-8145.log 2>&1) &

# 2. runtime, 3. Vite
cd my-copilot-app
(PORT=8146 npx tsx server.v1.ts > ../logs/runtime-8146.log 2>&1) &  # HARNESS: V1 runtime
(PORT=8147 npx tsx server.v2.ts > ../logs/runtime-8147.log 2>&1) &  # HARNESS: V2 runtime
(PORT=8148 npx tsx server.v3.ts > ../logs/runtime-8148.log 2>&1) &  # HARNESS: V3 runtime
(PORT=8149 npx tsx server.v4.ts > ../logs/runtime-8149.log 2>&1) &  # HARNESS: V4 runtime
(PORT=8154 npx tsx server.threads.ts > ../logs/runtime-8154.log 2>&1) &  # HARNESS: Threads runtime with CopilotKitIntelligence (needs CPK_INTELLIGENCE_API_KEY: env, or my-copilot-app/.env.intelligence)
(PORT=8140 AGENT_URL="$AGENT_URL" npx tsx server.antigravity.ts > ../logs/runtime-8140.log 2>&1) &
(npm run dev > ../logs/vite-5140.log 2>&1) &
wait
