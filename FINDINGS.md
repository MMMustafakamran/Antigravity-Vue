# Findings — Antigravity-vue
Open doc defects only. A finding is proposed first and added only after the owner approves it (Claude Code proposes after the daily review and the owner approves locally: `.qa/instructions/QA-RULES.md` section 6). The entries from the 2026-11-04 Antigravity assignment were logged directly and reviewed by the owner at the end, a one-off exception that does not apply to new findings. Numbers are stable IDs (code cites `FINDINGS.md #N`), so gaps are removed findings.
Stack: `@copilotkit/vue`/`runtime` 1.85.0, `vue` 3.5.44 (declared ^3.5.42), `vite` 8.3.5 (declared ^8.2.2), `tsx` 4.23.15, Node 26.7.0, Windows 11. Docs: https://docs.copilotkit.ai/vue/google-antigravity (snapshot 2026-11-04)

## Dev blockers (seen with `npm run dev` and normal use of the page)

### [Quickstart](https://docs.copilotkit.ai/vue/google-antigravity/quickstart)
**#1 The Antigravity Vue quickstart never connects an Antigravity agent.**
- **Doc:** `server.ts` registers `default: new BuiltInAgent({ model: "openai:gpt-5-mini" })`. The callout says "Already have an agent? Do not use BuiltInAgent … use your framework's quickstart for the runtime wiring".
- **Result:** following the page verbatim gives a working chat answered by OpenAI. Antigravity is never involved. The Antigravity quickstart only shows a Next.js `app/api/copilotkit/route.ts`, which doesn't apply to this standalone Node `server.ts`. No page under `/vue/google-antigravity` shows `HttpAgent` pointed at an `ag_ui_antigravity` server.

- **Confirmed by harness:** the same `server.ts` with `default: new HttpAgent({ url: "http://localhost:8000" })` (from the React quickstart) in place of `BuiltInAgent` works against the Antigravity backend, and frontend tools fire (see #4). That wiring is what the page is missing (`server.antigravity.ts`).

### [Frontend Tools](https://docs.copilotkit.ai/vue/google-antigravity/frontend-tools)
**#4 Every run fails: `runtime-url="/api/copilotkit"` is relative, but the quickstart runtime is a separate server.**
- **Doc:** `src/App.vue` has `<CopilotKitProvider runtime-url="/api/copilotkit">`. The quickstart serves the runtime from `server.ts` on `http://localhost:8200`, and Vite (5173) has no proxy for it.
- **Error:** `GET http://localhost:5173/api/copilotkit/info 404`, then `Agent execution failed: Error: Runtime info request failed with status 404`. The chat sends nothing. With the quickstart's absolute URL (harness), the agent calls `filter_incidents` and the UI shows "Current filter: sev1".

**#9 The rendered Vue quickstart page has no Vue quickstart on it.**
- **Doc:** https://docs.copilotkit.ai/vue/google-antigravity/quickstart (and `/vue/google-antigravity`), titled "Vue quickstart".
- **Result:** in a browser the page shows the Antigravity landing content: "Bring your Google Antigravity agents into any app", "Build with Google Antigravity", "Start building", and "Connect your agent" with a Next.js `route.ts` (`HttpAgent`, `next/server`). There's no `npm create vue`, no `@copilotkit/vue` and no `server.ts`. Its embedded live demo (`showcase-google-antigravity-production.up.railway.app/vue/agentic-chat`) shows "404 This page could not be found". The Vue steps exist only in the page's `.md` export, which is what #1–#3 are based on. Seen in recording `ANTIGRAVITY-vue-01-Quickstart`.

### [Programmatic Control](https://docs.copilotkit.ai/vue/google-antigravity/programmatic-control)
**#14 the only backend code on the page (_common.py) is showcase internals with undefined names, so the agent behind the Run button has to be guessed.**
- Doc: `_common.py` uses MODEL, WORKSPACE, SLUG and aimock helpers that are never defined or imported / Result: cannot run as published; the harness reused the quickstart agent

### [Tool Rendering](https://docs.copilotkit.ai/vue/google-antigravity/generative-ui/tool-rendering)
**#19 backend snippet uses build(), SYSTEM_PROMPT and 3 tools that are never shown; needed showcase code to run. Card also reads city but the backend tool arg is location.**
- Doc: TOOLS = [get_weather, search_flights, get_stock_price, roll_d20] / def tool_rendering_agent(): return build(system_instructions=SYSTEM_PROMPT, tools=TOOLS) / Result: build, SYSTEM_PROMPT and three of the four tools are never shown or imported (NameError as published). With showcase code filled in, the card renders but the city heading is empty: the frontend reads parameters.city while the backend get_weather takes location.

### [State Rendering](https://docs.copilotkit.ai/vue/google-antigravity/generative-ui/state-rendering)
**#21 frontend reads status/draft/progress but the Antigravity backend snippet only writes steps, and the full agent shown is LangGraph code. Panel stays Idle.**
- Doc: ResearchProgress reads state.status / draft / completed / total; the only Antigravity backend code (set_steps) writes state.steps; the full agent file shown is src/agents/shared_state_streaming.py, a LangGraph/langchain agent (ChatOpenAI, StateStreamingMiddleware) / Result: no Antigravity agent producing the frontend's state exists on the page; the progress panel stays 'Idle' while the agent replies in chat.

### [MCP Apps](https://docs.copilotkit.ai/vue/google-antigravity/generative-ui/mcp-apps)
**#23 runtime snippet uses an undefined agent and a placeholder MCP url; with those filled in the Excalidraw app frame shows up blank in the chat.**
- Doc: agents: { default: agent }, url: "https://mcp.example.com/mcp" / Result: `agent` is undefined and the server URL is a placeholder; with harness fills the agent says the flowchart is drawn but the in-chat MCP App frame stays blank (headed Chromium, 3 runs). NEEDS a visual recheck: React harness saw the Excalidraw iframe render (React FINDINGS #43).

### [State Streaming](https://docs.copilotkit.ai/vue/google-antigravity/shared-state/streaming)
**#32 Antigravity can't stream state (the page says so itself), but the page still shows LangGraph backend code and a frontend reading state.document, which the only Antigravity snippet (set_steps) never writes. The panel stays on "Waiting for a draft…".**
- Doc: Antigravity backend snippet is only `def set_steps(steps: list[dict])` writing state key "steps", while the full backend shown is LangGraph (`from langchain.agents import ... create_agent`, `StateStreamingMiddleware`) and the frontend StreamingDocument.vue reads `state.document` from agent "writer" / Result: the agent answers in chat, the document panel stays at "Waiting for a draft…" for the whole run; nothing streams. The page's own callout says "Token-by-token state streaming is not available with Antigravity."

### [Agent Read-Only Context](https://docs.copilotkit.ai/vue/google-antigravity/shared-state/agent-readonly)
**#35 the agent never sees the useAgentContext value (asked which workspace, it answered C:/srv/agents/w1, not northstar). The Antigravity adapter needs experimental_app_context=True on the agent, which the page never mentions.**
- Doc: "Surfaced to the agent through the backend's CopilotKit middleware on every turn." (useAgentContext({ description: "Active workspace", value: workspaceId }) with workspaceId = "northstar") / Result: asked "Which workspace am I in right now?" the agent replied "You are currently in the workspace: C:/srv/agents/w1"; the context never reaches it. ag_ui_antigravity only exposes useAgentContext values when the agent is built with experimental_app_context=True (get_app_context tool, see agent.py docstring), which the page never mentions.

### [useInterrupt](https://docs.copilotkit.ai/vue/google-antigravity/human-in-the-loop/useInterrupt)
**#42 the page says Antigravity should use useHumanInTheLoop, but its frontend and backend sections have no code; only a useInterrupt panel and an App.vue importing a MeetingChat component that is never shown.**
- Doc: sections 'The frontend: useHumanInTheLoop with a Promise-resolving handler' and 'The backend: agent instructed to call the frontend tool' are prose only; the page says some runtimes cannot pause like interrupt() and to use useHumanInTheLoop, yet the only code is a useInterrupt ApprovalPanel and an App.vue importing ./components/MeetingChat.vue (never shown) / Result: nothing runnable from this page; an interrupt only appears with the backend copied from the HITL overview plus a guessed MeetingChat. ApprovalPanel resolves {approved:true} while the overview tool reads answer.payload['chosen_label'] (KeyError on approve; not exercised).

### [Headless Interrupts](https://docs.copilotkit.ai/vue/google-antigravity/human-in-the-loop/headless)
**#44 the only code on the page is App.vue importing HeadlessInterruptPanel.vue, which is never shown; the primitives section is text only, so there is nothing to run.**
- Doc: App.vue `import HeadlessInterruptPanel from "./components/HeadlessInterruptPanel.vue";`, and 'The primitives' section is prose only / Error: Failed to resolve import "./components/HeadlessInterruptPanel.vue". Does the file exist? The page has no runnable code beyond the provider.

### [WebMCP](https://docs.copilotkit.ai/vue/google-antigravity/webmcp)
**#46 OrderSearch.vue calls searchOrders(), which the page never defines, and the agent never replies when the tool is used.**
- Doc: `const orders = await searchOrders(status);` in OrderSearch.vue / Result: searchOrders is never defined or imported; the chat never replies when the tool is asked for. The WebMCP side (document.modelContext) needs Chrome 149 + flag, not testable in the probe browser.

### [Sub-Agents](https://docs.copilotkit.ai/vue/google-antigravity/multi-agent/subagents)
**#47 the delegation-log frontend section has no code, and subagents.py needs httpx (not in the install step) and agents._common, which is never shown.**
- Doc: 'Rendering a live delegation log' says "On the frontend, the delegation log is a reactive render of the `delegations` slot." with no code; install is `pip install ag-ui-antigravity google-antigravity` but subagents.py does `import httpx`; `from agents._common import ...` is never published / Error: ModuleNotFoundError: No module named 'httpx'. With harness fixes the supervisor replies, but there is no delegation log (no Vue frontend on the page).

## Minor notes
- #5 Frontend Tools: `zod` is imported but no Vue install step adds it. It resolves only transitively (3.25.76).
- #6 [Chat Components](https://docs.copilotkit.ai/vue/google-antigravity/agentic-chat-ui): the Vue page's code is React/Next (`// src/app/demos/agentic-chat/page.tsx`, `<CopilotKit runtimeUrl=… agent="agentic_chat">`), and it calls `useConfigureSuggestions` without an import. There's no Vue template.
- #7 [Sub-Agents](https://docs.copilotkit.ai/vue/google-antigravity/multi-agent/subagents): identical Python to React, with the same unpublished `agents._common` imports (`MODEL, aimock_headers, api_key, gemini_base_url, build`), and no Vue frontend code at all.
- #8 When the model call fails (seen: OpenAI `insufficient_quota`), the Vue chat shows nothing: no error, no message. The quickstart's troubleshooting only says to check the terminal.
- #2 Quickstart "Where to go next": three links 404 because the path is doubled: `/vue/google-antigravity/vue/generative-ui/tool-based`, `/vue/google-antigravity/vue/AG-UI-Streams`, `/vue/google-antigravity/vue/prebuilt-components/copilot-threads-drawer`.
- #3 Quickstart: `export OPENAI_API_KEY=sk-...` is bash-only, and the Windows shell form isn't given.
- #10 Prebuilt Components: agent-id="my-agent" is never registered by the Vue quickstart runtime (it registers default); reader must add it
- #11 Prebuilt Components: runtime-url="/api/copilotkit" is relative, 404 on a Vite app (same as other Vue pages)
- #12 Slots (Subcomponents): disclaimer slot snippet uses CopilotChatInput without importing it; other snippets are template fragments (CustomMessageView, CustomToolbarAction undefined)
- #13 Fully Headless UI: same unregistered my-agent id / relative runtime-url as Prebuilt Components
- #15 Inspector: only code block for disabling Inspector is React (<CopilotKit enableInspector>), Vue gets one prose line
- #16 Threads Drawer: page says 'Without a valid Threads license, the drawer shows a locked view' but with the placeholder key it shows endless 'Loading threads...' instead
- #17 Headless Threads: sidebar uses class="flex" (Tailwind) with no Tailwind setup on the page
- #48 Threads Drawer: page shows no runtime code for Intelligence and agent-id="support" is never registered; public-license-key="ck_pub_..." is a placeholder (not needed once the runtime has CPK_INTELLIGENCE_API_KEY)
- #49 Headless Threads: server.ts uses agent and verifyAppSession without defining them and registers only default, while App.vue uses agent-id="my-agent"
- #18 Components as Tools: imports zod but no install step adds it (present only transitively)
- #20 Tool Rendering: WeatherToolCard reads parameters.city, backend arg is location: card shows result JSON with no city name
- #22 State Rendering: set_steps uses experimental_get_state/experimental_set_state with no import
- #24 MCP Apps: server snippet: `agent` never defined
- #25 Shared State: backend snippet calls build(...) which the page never defines or imports (same as React #8)
- #26 Shared State: set_notes snippet uses experimental_get_state/experimental_set_state without imports
- #27 Shared State: two separate blocks both titled src/components/SharedWorkspace.vue; the second (setTone) uses agent and WorkspaceState it never defines, merge is left to the reader
- #28 Shared State: 'Streaming partial state updates' section shows LangGraph/langchain Python (create_agent, StateStreamingMiddleware), not Antigravity
- #29 Shared State: in-content links point to /vue/google-antigravity/vue/shared-state/... (doubled 'vue') -> 404
- #30 Render agent state in your app: page has no backend code; relies on the Shared State page's agent
- #31 Render agent state in your app: all in-page links use /vue/google-antigravity/vue/... (doubled 'vue') -> 404
- #33 State Streaming: no Antigravity agent shown for set_steps (no instructions, no registration)
- #34 State Streaming: links use doubled /vue/.../vue/ path -> 404
- #36 Agent Read-Only Context: page shows no backend code at all
- #37 Agent Read-Only Context: links use doubled /vue/.../vue/ path -> 404
- #38 Human in the Loop: TimePickerCard.vue is imported by MeetingApproval.vue but never shown
- #39 Human in the Loop: hitl.py imports agents._common.build, never published
- #40 Human in the Loop: backend prompt names book_call, the Vue snippet registers schedule_meeting (model still called schedule_meeting)
- #41 Human in the Loop: links to useInterrupt/headless go to /vue/google-antigravity/vue/... (double vue)
- #43 useInterrupt: runtime-url /api/copilotkit 404 on Vite
- #45 Governed Actions: no backend shown: nothing makes the agent call approve_governed_action or emit an interrupt with metadata.action; executeSideEffect in handleApproval undefined
- #50 Doubled `/vue/` in in-content links (2026-11-11 drift check), on top of #2/#29/#31/#41: Headless UI -> `.../vue/custom-look-and-feel/slots` and `/css`; Tool-based -> `.../vue/generative-ui/tool-rendering` and `/vue/human-in-the-loop`; Prebuilt Components -> `.../vue/prebuilt-components/chat`, `/chat-controls`, `/popup`, `/sidebar`; Threads Drawer / Headless Threads -> `.../vue/threads-lifecycle`, `/vue/headless-threads`, `/vue/AG-UI-Streams`; Programmatic control -> `.../vue/custom-look-and-feel/headless-ui`. All 404.

## Build-only (`vue-tsc` / `vite build`; `npm run dev` runs fine)
