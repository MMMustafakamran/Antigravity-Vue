// HARNESS: Threads runtime (port 8154) for the Threads Drawer and Headless Threads pages.
// Doc: /vue/google-antigravity/headless-threads, step 1 "server.ts" (verbatim below the HARNESS block).
// The Threads Drawer page says threads need CopilotKit Intelligence but shows no runtime code, so it
// uses this runtime too. Key: CPK_INTELLIGENCE_API_KEY from the environment (CI secret), or locally
// from the gitignored my-copilot-app/.env.intelligence.
import { createServer } from "node:http";
import { HttpAgent } from "@ag-ui/client";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

try {
  process.loadEnvFile(".env.intelligence"); // HARNESS: local key file (gitignored); CI passes the env var
} catch {}

// HARNESS (begin): the snippet uses `agent` and `verifyAppSession` but never defines them, and shows
// no server around the runtime. No Vue page shows how to register an Antigravity agent (FINDINGS.md #1),
// so `agent` is an HttpAgent to this repo's quickstart backend (backend/v2_main.py /default on 8143).
const agent = new HttpAgent({ url: `${process.env.AGENT_BASE ?? "http://localhost:8143"}/default/` });
async function verifyAppSession(_request: Request) {
  return { user: { id: "antigravity-vue-qa-user", name: "Antigravity Vue QA" } }; // HARNESS: no auth in this harness
}
// HARNESS (end)

import {
  CopilotKitIntelligence,
  CopilotRuntime,
} from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: {
    default: agent,
    support: agent, // HARNESS: the Threads Drawer page's agent-id="support", never registered on the page
    "my-agent": agent, // HARNESS: the Headless Threads page's agent-id="my-agent"; its own server.ts registers only `default`
  },
  intelligence: new CopilotKitIntelligence({
    apiKey: process.env.CPK_INTELLIGENCE_API_KEY!,
  }),
  identifyUser: async (request) => {
    const session = await verifyAppSession(request);
    if (!session?.user) throw new Error("Unauthorized");
    return { id: session.user.id, name: session.user.name };
  },
  // generateThreadNames: false,
  // lockTtlSeconds: 20,
  // lockHeartbeatIntervalSeconds: 15,
  // lockKeyPrefix: "my-app",
});

// HARNESS: node server around the runtime (the doc shows none); cors because Vite (5140) is another origin.
const port = Number(process.env.PORT ?? 8154);
createServer(createCopilotNodeListener({ runtime, basePath: "/api/copilotkit", cors: true })).listen(port, () =>
  console.log(`Threads runtime (Intelligence) listening at http://localhost:${port}`),
);
