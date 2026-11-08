import { createServer } from "node:http";
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: "openai:gpt-6-luna",
      prompt: "You are a helpful assistant for a Vue app.",
    }),
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
  console.log(
    `Copilot Runtime listening at http://localhost:${port}/api/copilotkit`,
  );
});
