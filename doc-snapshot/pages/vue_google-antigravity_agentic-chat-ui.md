# Chat Components

> Customizable, drop-in components for building AI-powered chat interfaces


<!-- interactive demo: agentic-chat -->


## Pre-built components for agentic chat

CopilotKit's chat components give you a fully functional, customizable AI chat interface out of the box.
They handle streaming, generative UI, and deep customization so you can focus on your agent's behavior, not UI plumbing.

<video
  src="https://cdn.copilotkit.ai/docs/copilotkit/images/coagents/agentic-chat-ui.mp4"
  className="rounded-lg shadow-xl"
  loop
  playsInline
  controls
  autoPlay
  muted
/>

## What it looks like in code

The live `agentic-chat` cell above is built from a single, small page. Wrap your UI in `<CopilotKit>` once (it wires the runtime, session, and agent registry) and drop `<CopilotChat>` wherever the chat should go:

```typescript
// src/app/demos/agentic-chat/page.tsx
    <CopilotKit runtimeUrl="/api/copilotkit" agent="agentic_chat">
      <Chat />
    </CopilotKit>
```

Inside the chat, the `useConfigureSuggestions` hook lets you show contextual
starter prompts. The example below uses it to seed a simple "Write a sonnet"
suggestion:

```typescript
// src/app/demos/agentic-chat/suggestions.ts
export function useAgenticChatSuggestions() {
  useConfigureSuggestions({
    suggestions: [
      { title: "Write a sonnet", message: "Write a short sonnet about AI." },
      {
        title: "Tell me a joke",
        message: "Tell me a one-line joke.",
      },
      {
        title: "Is 17 prime?",
        message: "Walk me through whether 17 is prime.",
      },
    ],
    available: "always",
  });
}
```

<IntegrationGrid path="chat" description="The chat components work with any AI backend. Pick your integration to get started." />
