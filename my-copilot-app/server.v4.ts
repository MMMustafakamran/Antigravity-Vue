// HARNESS: runtime for the HITL / useInterrupt / headless / sub-agents Vue pages (port 8149).
// Copy of server.antigravity.ts; one CopilotRuntime per page, each with a `default` agent,
// served under /<page>/api/copilotkit so the doc components (which use the default agent) stay verbatim.
import { createServer } from "node:http";
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

const backend = process.env.AGENT_URL ?? "http://localhost:8145";
const listeners = Object.fromEntries(
  ["hitl", "interrupt", "subagents"].map((name) => [
    name,
    createCopilotNodeListener({
      runtime: new CopilotRuntime({ agents: { default: new HttpAgent({ url: `${backend}/${name}/` }) } }),
      basePath: `/${name}/api/copilotkit`,
      cors: true,
    }),
  ]),
);

const port = Number(process.env.PORT ?? 8149);
createServer((req, res) => {
  const name = (req.url ?? "").split("/")[1];
  const l = listeners[name];
  if (l) return (l as any)(req, res);
  res.statusCode = 404;
  res.end("not found");
}).listen(port, () => console.log(`Copilot Runtime (V4) listening at http://localhost:${port}`));
