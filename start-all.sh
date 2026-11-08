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

# 2. runtime, 3. Vite
cd my-copilot-app
(PORT=8140 AGENT_URL="$AGENT_URL" npx tsx server.antigravity.ts > ../logs/runtime-8140.log 2>&1) &
(npm run dev > ../logs/vite-5140.log 2>&1) &
wait
