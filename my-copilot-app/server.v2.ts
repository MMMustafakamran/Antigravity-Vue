// HARNESS: group V2 runtime (port 8147), copied from server.antigravity.ts. No Vue page shows how to
// register an Antigravity agent (FINDINGS.md #1), so each agent id the V2 pages use is an HttpAgent
// to this repo's backend on 8143 (backend/v2_main.py).
// Two runtimes on one port, chosen by path:
//   /api/copilotkit      -> plain runtime (Components as Tools, Tool Rendering, State Rendering, Threads pages)
//   /mcp/api/copilotkit  -> the MCP Apps page's runtime (mcpApps block verbatim apart from the server URL)
import { createServer } from "node:http";
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

const B = process.env.AGENT_BASE ?? "http://localhost:8143";

const runtime = new CopilotRuntime({
  agents: {
    default: new HttpAgent({ url: `${B}/default/` }),
    researcher: new HttpAgent({ url: `${B}/state-rendering/` }), // HARNESS: State Rendering's agent-id
    support: new HttpAgent({ url: `${B}/default/` }), // HARNESS: Threads Drawer's agent-id
    "my-agent": new HttpAgent({ url: `${B}/default/` }), // HARNESS: Headless Threads' agent-id
  },
});

// HARNESS: Tool Rendering needs its own backend tools; it uses agent-id "default" on its own runtime path.
const toolRuntime = new CopilotRuntime({
  agents: { default: new HttpAgent({ url: `${B}/tool-rendering/` }) },
});

const agent = new HttpAgent({ url: `${B}/default/` }); // HARNESS: the MCP Apps snippet uses an undefined `agent`

// --- MCP Apps doc (verbatim except url) ---
const mcpRuntime = new CopilotRuntime({
  agents: { default: agent },
  mcpApps: {
    servers: [
      {
        type: "http",
        url: process.env.MCP_URL ?? "https://mcp.excalidraw.com/mcp", // HARNESS: doc has the placeholder https://mcp.example.com/mcp; Excalidraw is the doc's own example server
        serverId: "support-tools",
      },
    ],
  },
});
// --- end doc ---

const main = createCopilotNodeListener({ runtime, basePath: "/api/copilotkit", cors: true });
const tools = createCopilotNodeListener({ runtime: toolRuntime, basePath: "/tools/api/copilotkit", cors: true });
const mcp = createCopilotNodeListener({ runtime: mcpRuntime, basePath: "/mcp/api/copilotkit", cors: true });

const port = Number(process.env.PORT ?? 8147);
createServer((req, res) => {
  const u = req.url ?? "";
  if (u.startsWith("/mcp/")) return mcp(req, res);
  if (u.startsWith("/tools/")) return tools(req, res);
  return main(req, res);
}).listen(port, () => console.log(`V2 runtime listening at http://localhost:${port}`));
