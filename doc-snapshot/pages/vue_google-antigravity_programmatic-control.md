# Programmatic Control

> Drive agent runs directly from code — no chat UI required.

## What is this?

Programmatic control is what you reach for when you want to drive an agent run from code rather than from a chat composer: a button, a form, a cron job, a keyboard shortcut, or a graph callback. CopilotKit exposes three primitives that cover every triggering pattern:

- `agent.addMessage(...)` — append a message to the conversation without running the agent. Pair it with `copilotkit.runAgent({ agent })` when the message should kick off a turn.
- `copilotkit.runAgent({ agent })` — the same entry point `<CopilotChat />` calls under the hood. It orchestrates frontend tools, follow-up runs, and the subscriber lifecycle.
- `agent.subscribe(subscriber)` — low-level AG-UI event subscription (`onCustomEvent`, `onRunStartedEvent`, `onRunFinalized`, `onRunFailed`, and streaming deltas).

## When should I use this?

Use programmatic control when you want to:

- Trigger agent runs from buttons, forms, or other UI elements
- Execute specific tools directly from UI interactions without an LLM turn
- Build agent features without a chat window
- Access agent state and results programmatically
- Create fully custom agent-driven workflows

## Sending a message from code

<Steps>
  <Step>
    ### Install the Antigravity AG-UI adapter

    ```bash
    pip install ag-ui-antigravity google-antigravity
    ```

  </Step>
  <Step>
    ### Wire the agent once — chat and code share it

    `copilotkit.runAgent`, `agent.subscribe` and `agent.addMessage` drive runs
    against the same AG-UI endpoint your chat UI posts to, so there is no
    second backend to set up: build the `AntigravityAgent` the way any chat
    demo does and every entry point sees the same model, tools and session.

    
~~~~python title="_common.py"
def api_key() -> str | None:
    """The Gemini API key.

    ``GEMINI_API_KEY`` is the only name the Antigravity SDK reads. The showcase
    fleet exports ``GOOGLE_API_KEY`` for its Gemini integrations, so accept
    that too rather than fail on the first model call.
    """
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


def gemini_base_url() -> str | None:
    """The Gemini-compatible server to call instead of Google's API.

    Showcase compose sets ``GOOGLE_GEMINI_BASE_URL=http://aimock:4010``, the
    same variable the google-adk integration reads.
    """
    return os.environ.get("GOOGLE_GEMINI_BASE_URL", "").rstrip("/") or None


def aimock_headers() -> dict[str, str]:
    """Headers for a model call: the package's fixture context plus the
    current request's mock and diagnostic headers.

    ``X-AIMock-Context`` is fixed: it selects this package's fixtures whatever
    the request says. The rest comes from the inbound request (captured by
    ``HeaderForwardingHTTPMiddleware``) and is forwarded only when present, so
    ordinary demo traffic is never forced into strict mode.
    """
    forwarded = {
        k: v
        for k, v in get_forwarded_headers().items()
        if k.startswith(_FORWARDED_PREFIXES)
    }
    return {**forwarded, "x-aimock-context": SLUG}


def endpoint() -> GeminiAPIEndpoint | None:
    """Where every model call goes: aimock under compose, Google's API otherwise.

    Passed to the adapter as a callable, so it runs each time a session is
    built, inside that conversation's first request. The harness makes the
    model calls itself, so headers can only reach them on the endpoint: the
    request's ``X-AIMock-Strict`` and ``x-test-id``/``x-diag-*`` ride along
    from here (PNI-576). They are fixed per conversation, because the SDK
    sets a conversation's model configuration when it starts.
    """
    base_url = gemini_base_url()
    if base_url is None:
        return None
    return GeminiAPIEndpoint(
        base_url=base_url,
        api_key=api_key(),
        http_headers=aimock_headers(),
    )


def chat_only_capabilities() -> CapabilitiesConfig:
    """Only ``finish`` stays enabled.

    ``search_web`` returns an empty summary without Google credentials and the
    model retries it forever; ``ask_question`` would park on an interrupt the
    CopilotKit demos never answer. ``finish`` is how the harness ends a turn.
    """
    return CapabilitiesConfig(
        enabled_tools=[BuiltinTools.FINISH], enable_subagents=False
    )


_DIRS_READY = False


def _ensure_dirs() -> None:
    """Creates the workspace / save_dir once, on first agent construction.

    Deliberately NOT done at import time: the defaults live under ``/data``,
    which only exists inside the container image, so an import-time
    ``os.makedirs`` blows up on a developer machine (read-only ``/`` on macOS)
    and takes every ``import agent_server`` — including the package's pytest
    suite — down with it.
    """
    global _DIRS_READY
    if _DIRS_READY:
        return
    os.makedirs(WORKSPACE, exist_ok=True)
    os.makedirs(SAVE_DIR, exist_ok=True)
    _DIRS_READY = True


_POOL = None


def shared_pool():
    """One HarnessPool for the whole server: one Go process, not one per agent."""
    global _POOL
    if _POOL is None:
        from ag_ui_antigravity.harness_pool import HarnessPool

        _POOL = HarnessPool()
    return _POOL


def build(**kwargs):
    """Creates an AntigravityAgent with the package defaults applied."""
    from ag_ui_antigravity import AntigravityAgent

    _ensure_dirs()

    defaults = dict(
        model=MODEL,
        api_key=api_key(),
        endpoint=endpoint,
        workspaces=[WORKSPACE],
        save_dir=SAVE_DIR,
        harness_pool=shared_pool(),
        capabilities=chat_only_capabilities(),
        session_timeout_seconds=SESSION_TIMEOUT_SECONDS,
        max_sessions=MAX_SESSIONS,
        max_tool_calls_per_turn=MAX_TOOL_CALLS_PER_TURN,
    )
    defaults.update(kwargs)
    return AntigravityAgent(**defaults)


~~~~


    Sessions are keyed by `thread_id` inside the agent, so a headless run that
    reuses a thread continues that conversation, and a fresh `thread_id`
    starts a new one.

  </Step>
</Steps>

<Callout type="info" title="Headless interrupts come from server tools">
  The headless interrupt-resolver pattern — read the interrupt off the agent,
  answer it with a `resume` — works when a Python server tool pauses with the
  adapter's `experimental_interrupt()` (see the human-in-the-loop setup). The harness's
  own `ask_question` built-in, which would also park on an interrupt, is
  disabled in this showcase. For asking the user from code without a backend
  tool, use the frontend-tool Promise pattern: register the tool with
  `useFrontendTool` and an `async` handler, and resolve its promise when your
  own UI has the answer.
</Callout>

The canonical pattern is to append a user message with `agent.addMessage`, then call `copilotkit.runAgent({ agent })`. Use `copilotkit.stopAgent({ agent })` to cancel an in-flight run.

```vue title="src/components/AgentTrigger.vue"
<script setup lang="ts">
import { toRaw } from "vue";
import { useAgent, useCopilotKit } from "@copilotkit/vue/v2";

const { agent } = useAgent({ agentId: "sales" });
const { copilotkit } = useCopilotKit();

async function run() {
  const current = agent.value;
  if (!current || current.isRunning) return;

  current.addMessage({
    id: crypto.randomUUID(),
    role: "user",
    content: "Summarize the latest sales data",
  });

  try {
    await copilotkit.value.runAgent({ agent: toRaw(current) });
  } catch (error) {
    console.error("CopilotKit runAgent failed:", error);
  }
}

function stop() {
  const current = agent.value;
  if (!current) return;
  copilotkit.value.stopAgent({ agent: toRaw(current) });
}
</script>

<template>
  <button :disabled="agent?.isRunning" @click="run">Run agent</button>
  <button :disabled="!agent?.isRunning" @click="stop">Stop</button>
</template>
```

```vue title="src/App.vue"
<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import AgentTrigger from "./components/AgentTrigger.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <AgentTrigger />
  </CopilotKitProvider>
</template>
```

### `copilotkit.runAgent()` vs `agent.runAgent()`

Both methods trigger the agent, but they operate at different levels:

- **`copilotkit.runAgent({ agent })`** — the recommended default. It orchestrates the full lifecycle, executes frontend tools, handles follow-up runs, and routes errors through the subscriber system.
- **`agent.runAgent(options)`** — a low-level method on the agent instance. It sends the request to the runtime but does **not** execute frontend tools or chain follow-ups. Reach for it only when you need direct control.

## Subscribing to agent events

`agent.subscribe(subscriber)` returns `{ unsubscribe }`. The subscriber accepts every AG-UI lifecycle callback: `onCustomEvent`, `onRunStartedEvent`, `onRunFinalized`, `onRunFailed`, and the streaming deltas. Use it to drive progress UI, forward events to analytics, or inspect framework pause/resume events.

```ts
import { watch } from "vue";

watch(
  agent,
  (current, _previous, onCleanup) => {
    if (!current) return;
    const subscription = current.subscribe({
      onRunStartedEvent: () => console.log("started"),
      onRunFinalized: () => console.log("done"),
      onRunFailed: ({ error }) => console.error(error),
    });
    onCleanup(() => subscription.unsubscribe());
  },
  { immediate: true },
);
```





## Resolving a frontend tool call from a button

For promise-based integrations there is no native interrupt primitive. Register a `useHumanInTheLoop` frontend tool instead. Its handler remains pending, the rendered Vue component exposes the approval in any application surface, and calling `respond(...)` resolves the Promise the agent's tool call is awaiting.

The resulting pending state and response callback are pure data; the same pattern can power a modal, toast, sidebar form, or voice UI.





## See also

- [Headless UI](/vue/google-antigravity/vue/custom-look-and-feel/headless-ui) — build your own chat surface from lower-level components.
- [Human-in-the-Loop](./human-in-the-loop) — compare `useHumanInTheLoop` and `useInterrupt` for paused runs.

<IntegrationGrid path="programmatic-control" />
