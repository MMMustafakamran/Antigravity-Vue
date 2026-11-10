// HARNESS: runtime for the Vue shared-state pages (group V3), port 8148. Copy of server.antigravity.ts.
// No Vue page shows how to register an Antigravity agent (FINDINGS.md #1); HttpAgent -> ../backend/shared_state_main.py :8144.
// Agent ids come from the doc snippets: "workspace" (shared-state), "writer" (streaming),
// "default" (rendering-in-app and agent-readonly use the default agent).
import { createServer } from "node:http";
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

const base = process.env.AGENT_URL ?? "http://localhost:8144"; // HARNESS: port 8144

const runtime = new CopilotRuntime({
  agents: {
    workspace: new HttpAgent({ url: `${base}/` }), // HARNESS
    default: new HttpAgent({ url: `${base}/` }), // HARNESS
    writer: new HttpAgent({ url: `${base}/writer` }), // HARNESS
  },
});

const port = Number(process.env.PORT ?? 8148);

createServer(
  createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: true,
  }),
).listen(port, () => {
  console.log(`Copilot Runtime (V3 shared-state) listening at http://localhost:${port}/api/copilotkit`);
});
