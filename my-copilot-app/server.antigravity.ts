// HARNESS: no Vue page shows how to register an Antigravity agent (FINDINGS.md #1).
// This is the quickstart server.ts with BuiltInAgent replaced by the React quickstart's
// HttpAgent, pointed at the Antigravity backend (Antigravity-react/backend, :8000).
import { createServer } from "node:http";
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

const runtime = new CopilotRuntime({
  agents: {
    default: new HttpAgent({ url: process.env.AGENT_URL ?? "http://localhost:8000" }),
  },
});

const port = Number(process.env.PORT ?? 8200);

createServer(
  createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: true,
  }),
).listen(port, () => {
  console.log(`Copilot Runtime (Antigravity) listening at http://localhost:${port}/api/copilotkit`);
});
