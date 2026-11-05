#!/usr/bin/env bash
# HARNESS: Vue app on 5140, runtime on 8140 (doc: 5173/8200). The runtime is server.antigravity.ts
# (HttpAgent -> Antigravity-react's quickstart agent on 8040), because the doc's BuiltInAgent
# server.ts never reaches Antigravity (FINDINGS.md #1). Start Antigravity-react/start-all.sh first.
cd "$(dirname "$0")/my-copilot-app"
mkdir -p ../logs
(PORT=8140 AGENT_URL=http://localhost:8040 npx tsx server.antigravity.ts > ../logs/runtime-8140.log 2>&1) &
(npm run dev > ../logs/vite-5140.log 2>&1) &
wait
