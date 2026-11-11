# State Streaming

> Stream partial agent state updates to the UI while a tool call is still running.

## What is this?

By default, agent state only updates *between* backend checkpoints, so a long-running tool call, such as writing a full document or drafting an email, appears to the UI as one big burst at the end. For agent-native apps, that feels broken: users expect to watch the output materialize.

**State streaming** forwards the value of a specific tool argument straight into an agent state key *as the argument is being generated*. The UI, subscribed through `useAgent`, re-renders every token.

## When should I use this?

Use state streaming whenever a tool's output is long-form text or a growing structured value and you want the user to see it assemble in real time. Common shapes:

- A collaborative writing agent that emits a document
- A research agent that accumulates a list of findings
- A planning agent that builds up a step-by-step plan

Without streaming, the user stares at a spinner. With streaming, they see the answer grow token-by-token.

## The backend: one streaming state mapping

<Callout type="warn" title="Antigravity streams state per tool call, not per token">
  The Antigravity harness hands the adapter each tool call with its arguments
  already complete, so there is no partial argument to map into a state key
  while the model is still generating. Token-by-token state streaming is not
  available with Antigravity.
</Callout>

The closest pattern is a tool that writes state each time the model calls it.
`experimental_set_state()` streams a `STATE_SNAPSHOT` as the tool finishes, so a plan that
the model sends step by step, one call per update, still assembles in the UI
while the run continues.


~~~~python title="gen_ui_agent.py"
def set_steps(steps: list[dict]) -> str:
    """Publish the current plan + step statuses. Call this every time a step
    transitions (including the first enumeration of steps).

    Each step has: id, title, and status ("pending", "in_progress" or
    "completed").
    """
    experimental_set_state({**experimental_get_state(), "steps": steps})
    return f"Published {len(steps)} step(s)."


~~~~

The backend pattern is always the same: map one streaming tool argument to one shared-state key. Middleware-backed frameworks usually expose this as a declarative mapping. Direct SDK adapters do the same work in their streaming loop by parsing partial tool arguments and emitting `STATE_SNAPSHOT` whenever the mapped value changes. When the LLM streams that argument, CopilotKit writes every partial value into shared state before the tool finishes executing.

```python
# src/agents/shared_state_streaming.py
import uuid

from langchain.agents import AgentState as BaseAgentState, create_agent
from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.types import Command

from copilotkit import (
    CopilotKitMiddleware,
    StateItem,
    StateStreamingMiddleware,
)


class AgentState(BaseAgentState):
    """Shared state. `document` is streamed token-by-token."""

    document: str


@tool
def write_document(document: str, runtime: ToolRuntime) -> Command:
    """Write a document for the user.

    Always call this tool when the user asks you to write or draft
    something of any length (an essay, poem, email, summary, etc.).
    The `document` argument is streamed *per token* into shared agent
    state under the `document` key, so the UI can render it as it is
    generated.
    """
    return Command(
        update={
            "document": document,
            "messages": [
                ToolMessage(
                    content="Document written to shared state.",
                    name="write_document",
                    id=str(uuid.uuid4()),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


graph = create_agent(
    model=ChatOpenAI(reasoning_effort="none", model="gpt-6-luna"),
    tools=[write_document],
    middleware=[
        CopilotKitMiddleware(),
        # Forward every token of write_document's `document` argument
        # straight into state["document"] while the tool call is still
        # streaming. Without this, `document` would only update once
        # the tool call completes.
        #
        # NOTE: the frontend `usePredictStateSubscription` hook indexes
        # the (partial-JSON-parsed) tool args by `state_key`, so the
        # tool's argument name MUST match `state_key` ("document") for
        # per-token deltas to land in `state.document`.
        StateStreamingMiddleware(
            StateItem(
                state_key="document",
                tool="write_document",
                tool_argument="document",
            )
        ),
    ],
    state_schema=AgentState,
    system_prompt=(
        "You are a collaborative writing assistant. Whenever the user asks "
        "you to write, draft, or revise any piece of text, ALWAYS call the "
        "`write_document` tool with the full content as a single string in "
        "the `document` argument. Never paste the document into a chat "
        "message directly — the document belongs in shared state and the "
        "UI renders it live as you type."
    ),
)
```

A few things to note:

- The state key must exist in your agent state (`document` in this example).
- The tool and argument names must match the exact LLM-facing tool call you want to forward.
- When the tool call completes, its final return value is written to the same key, so the streamed partial eventually becomes the authoritative final value.

## The frontend: useAgent + OnStateChanged

The UI side is identical to any other shared-state subscription: `useAgent` with `OnStateChanged` gives you a reactive `agent.value.state`. Add `OnRunStatusChanged` if you want a live/done indicator.

```vue title="src/components/StreamingDocument.vue"
<script setup lang="ts">
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type DocumentState = { document?: string };

const { agent } = useAgent({
  agentId: "writer",
  updates: [
    UseAgentUpdate.OnStateChanged,
    UseAgentUpdate.OnRunStatusChanged,
  ],
});
const state = computed(
  () => (agent.value?.state ?? {}) as DocumentState,
);
</script>

<template>
  <article aria-live="polite">
    <span v-if="agent?.isRunning">LIVE</span>
    <p>{{ state.document ?? "Waiting for a draft…" }}</p>
  </article>
</template>
```

From there, `state.document` is a string that grows on every token, and `agent.isRunning` tells you whether to show a streaming indicator.

```vue title="src/App.vue"
<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import StreamingDocument from "./components/StreamingDocument.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <StreamingDocument />
    <CopilotChat agent-id="writer" />
  </CopilotKitProvider>
</template>
```

If the runtime does not emit partial state snapshots, the UI sees only the final state. The Vue frontend cannot invent updates the backend never sends.

## Related

- **[Shared State (overview)](/vue/google-antigravity/vue/shared-state)** — the bidirectional read and write pattern this extends.
- **[Agent read-only context](/vue/google-antigravity/vue/shared-state/agent-readonly)** — for the inverse UI-to-agent one-way channel.

<IntegrationGrid path="shared-state/streaming" exclude={["agno", "agent-spec", "spring-ai", "langroid"]} />
