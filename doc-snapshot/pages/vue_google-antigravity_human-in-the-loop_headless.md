# Headless Interrupts

> Resolve agent interrupts from any UI, without a chat interrupt slot.

## What is this?

The `#interrupt` slot is the 80% path: it keeps the UI attached to a `<CopilotChat>` transcript and handles when to show the picker. This page covers the escape hatch: set `renderInChat: false` and render the reactive interrupt state anywhere in your Vue tree. The UI can take any shape — button grid, form, modal, keyboard shortcut — and no chat needs to be mounted.





For promise-based integrations there is no native interrupt primitive. Build the same headless experience with `useHumanInTheLoop`: its frontend-tool handler holds a Promise open, application state renders the picker outside chat, and the user's answer resolves the tool call.





## When should I use this?

- **Testing / Playwright fixtures** — a deterministic, chat-less button grid is easier to drive than a picker that appears after an LLM call.
- **Non-chat UIs** — dashboards, side panels, inspector surfaces, or any place where you want the agent's interrupt without the transcript.
- **Custom flow control** — when you need to know exactly when the interrupt arrived and when it was resolved.
- **Research / debugging** — when you want to observe raw interrupt state without the chat abstraction.

If you just want a picker in chat, use [`useInterrupt`](./useInterrupt) with the default `renderInChat: true` and the `#interrupt` slot.





## The primitives

Register a `useHumanInTheLoop` tool with a Vue render component that reflects the pending request into application state. The tool's handler remains pending until the component calls `respond(...)`; no runtime interrupt or chat slot is involved.

Keep concurrent calls separate by tool-call id, clear pending state after the user responds, and make the render component visually empty if the actual picker lives elsewhere in the app.





## Provider setup

The component calling these composables must be below `CopilotKitProvider`:

```vue title="src/App.vue"
<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import HeadlessInterruptPanel from "./components/HeadlessInterruptPanel.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <HeadlessInterruptPanel />
  </CopilotKitProvider>
</template>
```

## Going further

- [Tool-based HITL with `useHumanInTheLoop`](../human-in-the-loop) — for LLM-initiated pauses where the model decides to ask the user.
- [`useInterrupt`](./useInterrupt) — the chat-slot path, with `enabled` gating, handler preprocessing, and standard interrupt details.
