# State Rendering

> Render your agent's state with custom UI components in real-time.

## What is this?

State rendering lets you build UI that reflects your agent's state in real-time. As your agent progresses through nodes and emits state updates, your frontend renders those changes, showing progress, drafts, or intermediate results.

<Callout type="info">
  **Free course:** See this pattern built end-to-end in [Build Interactive Agents with Generative UI](https://www.deeplearning.ai/short-courses/build-interactive-agents-with-generative-ui/) — a free DeepLearning.AI short course taught by CopilotKit's CEO covering the full Generative UI spectrum (Controlled, Declarative, and Open-Ended).
</Callout>

## When should I use this?

Use state rendering when you want to:

- Show real-time progress (e.g. "Researching... 2/5 complete")
- Display drafts that update as the agent works
- Build dashboards that reflect agent state
- Render structured output outside of the chat

## How it works in code

On the frontend, subscribe to the agent's state. Each time the backend forwards a fresh value, your component re-renders with the latest partial output. `useAgent` returns an `agent` ref; read `agent.value?.state` in script or let templates unwrap the ref. Keep the provider in an ancestor SFC.

```vue title="src/components/ResearchProgress.vue"
<script setup lang="ts">
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type ResearchState = { status?: string; draft?: string; completed?: number; total?: number };

const { agent } = useAgent({
  agentId: "researcher",
  updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
});

const state = computed(() => (agent.value?.state ?? {}) as ResearchState);
</script>

<template>
  <section aria-live="polite">
    <p>{{ state.status ?? "Idle" }}</p>
    <progress :value="state.completed ?? 0" :max="state.total ?? 1" />
    <article v-if="state.draft">{{ state.draft }}</article>
  </section>
</template>
```

```vue title="src/App.vue"
<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import ResearchProgress from "./components/ResearchProgress.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <ResearchProgress />
    <CopilotChat agent-id="researcher" />
  </CopilotKitProvider>
</template>
```

On the backend, a state-streaming mapping forwards a specific tool argument straight into a state key *as it's being generated*. Some frameworks provide that as middleware; direct SDK adapters can emit `STATE_SNAPSHOT` events from their streaming loop. Either way, the UI can watch the answer assemble token-by-token rather than appearing in one burst between checkpoints.

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

Treat agent state as untrusted external data. Validate it before using it for privileged actions, and avoid putting secrets in state that is streamed to the browser.

<IntegrationGrid
  path="generative-ui/state-rendering"
  exclude={["agno", "agent-spec"]}
/>
