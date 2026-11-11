# HITL Overview

> Allow your agent and users to collaborate on complex tasks.

## What is this?

Human-in-the-loop (HITL) lets an agent pause mid-run to collect input, confirmation, or a choice from the user, then resume with that answer folded back into its reasoning. It's what turns an autonomous workflow into a collaborative one: the agent keeps its context, the user keeps the steering wheel.

<video
  src="https://cdn.copilotkit.ai/docs/copilotkit/images/coagents/human-in-the-loop-example.mp4"
  className="rounded-lg shadow-xl"
  loop
  playsInline
  controls
  autoPlay
  muted
/>

## When should I use this?

Use HITL when you need:

- **Quality control** — a human gate at high-stakes decision points
- **Edge cases** — graceful fallbacks when the agent's confidence is low
- **Expert input** — lean on the user for domain knowledge the model lacks
- **Reliability** — a more robust loop for real-world, production traffic

## Two patterns for HITL in CopilotKit

<Steps>
  <Step>
    ### Install the Antigravity AG-UI adapter

    ```bash
    pip install ag-ui-antigravity google-antigravity
    ```

  </Step>
  <Step>
    ### Ask for the human with a frontend tool

    The simplest route is an ordinary frontend tool. Register it in the
    browser with `useHumanInTheLoop`, or with `useFrontendTool` and an `async`
    handler that resolves once the user has answered. Each run carries that
    tool definition to the agent, the adapter rebuilds it as a custom
    Antigravity tool, and when the model calls it the call parks as an awaited
    coroutine — the SSE response for that run closes, and the adapter resolves
    the parked call from a later HTTP run with whatever the handler returned.
    The model receives that value as the tool's real return value, so there is
    no proxy tool and no fire-and-forget long-running-tool workaround.

  </Step>
  <Step>
    ### Or pause a server tool with `experimental_interrupt()`

    When the backend decides it needs the user, a Python server tool can pause
    itself on an AG-UI interrupt with the adapter's experimental
    `experimental_interrupt()` and carry on with the answer:

    ```python
    from ag_ui_antigravity import experimental_interrupt

    async def schedule_meeting(topic: str, attendee: str) -> str:
        """Books a meeting once the user picks a time."""
        answer = await experimental_interrupt(
            "schedule_meeting",
            message=f"Pick a time for {topic}",
            metadata={"topic": topic, "attendee": attendee},
        )
        if not answer.resolved:
            return f"Not scheduled ({answer.status})."
        return f"Scheduled for {answer.payload['chosen_label']}."
    ```

    The run ends with `RUN_FINISHED` carrying an interrupt outcome, which
    `useInterrupt` renders; the payload the user resolves it with comes back
    unchanged in `answer.payload`. `answer.status` is `"resolved"`,
    `"cancelled"` or `"abandoned"` (the user sent a new message instead).

  </Step>
  <Step>
    ### Name the tool in the agent's instructions

    That leaves the agent with one job: knowing the tool exists and when to
    call it. A model that is never told about `book_call` will answer in prose
    and the picker will never mount.

    
~~~~python title="hitl.py"
from agents._common import build

HITL_IN_CHAT_PROMPT = (
    "You help users book an onboarding call with the sales team. "
    "When they ask to book a call, call the frontend-provided "
    "`book_call` tool with a short topic and the user's name. "
    "Keep any chat reply to one short sentence."
)


def hitl_in_chat_agent():
    return build(system_instructions=HITL_IN_CHAT_PROMPT)


~~~~


    The frontend tool is dispatched to the browser at most once per turn
    (`deduplicate_tool_calls`, on by default), so a model that re-issues the
    same call after the harness backgrounds it does not ask the user twice.

  </Step>
</Steps>

<Callout type="info" title="ask_question is off in this showcase">
  Antigravity's own `ask_question` built-in tool — the one primitive that would
  park on a real AG-UI interrupt — is disabled here with
  `CapabilitiesConfig(enabled_tools=[BuiltinTools.FINISH])`. The CopilotKit
  demos answer a tool call with a `ToolMessage`, not an interrupt `resume`, so
  a turn that parked on `ask_question` would wait forever. `FINISH` has to stay
  enabled: it is how the harness ends a turn.
</Callout>

CopilotKit ships two complementary ways to pause an agent turn and ask the human something. They look similar from the outside (the chat pauses, a custom component appears, the user answers, the run resumes), but they're wired differently on the backend, and each has its own niche.

| Pattern | Who decides to pause? | Backend surface |
| --- | --- | --- |
| `useHumanInTheLoop` | The **LLM**, by calling a registered client-side tool | A frontend-only tool description (Zod schema + `render`) |
| `useInterrupt` | The **graph**, by calling `interrupt(...)` during a node | A server-side `interrupt()` call in your agent |

**Pick `useHumanInTheLoop`** when the pause is an _agent-initiated_ decision — the model chose to ask the user — and you want the picker UI inlined into the normal tool-call flow.

**Pick `useInterrupt`** when the pause is a _graph-enforced_ checkpoint — the code path deterministically requires a human answer — and you want the runtime interrupt as the server-side contract.

## Pattern 1 — `useHumanInTheLoop` (tool-based)

The app registers a HITL tool on the client with `useHumanInTheLoop`. When the LLM calls that tool, CopilotKit renders your Vue component and gives it a `respond` callback during the executing phase. The agent sees the answer as the tool result and continues from there.

```vue title="src/components/MeetingApproval.vue"
<script setup lang="ts">
import { z } from "zod";
import { useHumanInTheLoop } from "@copilotkit/vue/v2";
import TimePickerCard from "./TimePickerCard.vue";

useHumanInTheLoop({
  name: "schedule_meeting",
  description: "Ask the user to select a meeting time.",
  parameters: z.object({
    topic: z.string(),
    attendee: z.string(),
  }),
  render: TimePickerCard,
});
</script>

<template><p>Meeting approval tool registered.</p></template>
```

The picker UI can use static candidate slots, live availability, a calendar API, or any other application data. Mount the registration component beneath `CopilotKitProvider` so the composable can reach the runtime.

## Pattern 2 — `useInterrupt` (graph-paused)

With a runtime interrupt, the pause is enforced by the graph itself: a node interrupts with a serializable payload, the run suspends, the client receives the payload, renders a UI, and resumes the run with the user's answer. CopilotKit's `useInterrupt` composable and `CopilotChat`'s `#interrupt` slot form the Vue render contract.

See the [`useInterrupt` deep dive](/vue/google-antigravity/vue/human-in-the-loop/useInterrupt) for the full walkthrough, including the backend contract and Vue slot wiring.

## Going headless

Both patterns above can drive custom UI. For runtime interrupts, set `renderInChat: false` and use the reactive state returned by `useInterrupt`; for a frontend-tool pause, let the Promise-returning HITL tool drive application state. See the [headless interrupts guide](/vue/google-antigravity/vue/human-in-the-loop/headless) for the interrupt path.

<IntegrationGrid path="human-in-the-loop" />
