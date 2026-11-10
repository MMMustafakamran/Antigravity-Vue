// HARNESS (group V1): copy of server.antigravity.ts on its own port (8146) so the V1 pages' agent ids resolve.
// The docs never show how to register an Antigravity agent for Vue (FINDINGS.md #1). Agent ids are the ones the
// pages use ("my-agent": prebuilt-components / headless-ui, "sales": programmatic-control, "default": slots, inspector),
// all pointed at this repo's quickstart Antigravity backend (../backend, :8141).
import { createServer } from "node:http";
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

// HARNESS: a second copy of the quickstart backend (backend/main.py) on 8142, so V1 probes don't share 8141's harness pool
const url = process.env.AGENT_URL ?? "http://localhost:8142";
const runtime = new CopilotRuntime({
  agents: {
    default: new HttpAgent({ url }),
    "my-agent": new HttpAgent({ url }),
    sales: new HttpAgent({ url }),
  },
});

const port = Number(process.env.PORT ?? 8146); // HARNESS: V1 runtime port

createServer(
  createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: true,
  }),
).listen(port, () => {
  console.log(`Copilot Runtime (V1) listening at http://localhost:${port}/api/copilotkit`);
});
