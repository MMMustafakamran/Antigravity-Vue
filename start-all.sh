#!/usr/bin/env bash
# HARNESS: starts every Antigravity-vue server on its harness ports (REPOS.md: never 3000/8000).
#   8141 own Antigravity quickstart agent (backend/main.py; React quickstart: 8000)
#   8140 runtime server.antigravity.ts (HttpAgent -> :8141), because the doc's BuiltInAgent
#        server.ts never reaches Antigravity (FINDINGS.md #1). Doc: 8200.
#   5140 Vite (doc: 5173)
# Override the agent URL with AGENT_URL. Key: backend/.env (see .env.example). The backend uses
# --env-file because the doc's .env is never loaded (Antigravity-react FINDINGS.md #1).
cd "$(dirname "$0")"
mkdir -p logs
: "${AGENT_URL:=http://localhost:8141}"

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
(cd backend && uv run --with httpx --env-file .env uvicorn v4_main:app --port 8145 > ../logs/backend-8145.log 2>&1) &

# 2. runtime, 3. Vite
cd my-copilot-app
(PORT=8146 npx tsx server.v1.ts > ../logs/runtime-8146.log 2>&1) &  # HARNESS: V1 runtime
(PORT=8147 npx tsx server.v2.ts > ../logs/runtime-8147.log 2>&1) &  # HARNESS: V2 runtime
(PORT=8148 npx tsx server.v3.ts > ../logs/runtime-8148.log 2>&1) &  # HARNESS: V3 runtime
(PORT=8149 npx tsx server.v4.ts > ../logs/runtime-8149.log 2>&1) &  # HARNESS: V4 runtime
(PORT=8140 AGENT_URL="$AGENT_URL" npx tsx server.antigravity.ts > ../logs/runtime-8140.log 2>&1) &
(npm run dev > ../logs/vite-5140.log 2>&1) &
wait
