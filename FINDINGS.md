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

## Minor notes
- #5 Frontend Tools: `zod` is imported but no Vue install step adds it. It resolves only transitively (3.25.76).
- #6 [Chat Components](https://docs.copilotkit.ai/vue/google-antigravity/agentic-chat-ui): the Vue page's code is React/Next (`// src/app/demos/agentic-chat/page.tsx`, `<CopilotKit runtimeUrl=… agent="agentic_chat">`), and it calls `useConfigureSuggestions` without an import. There's no Vue template.
- #7 [Sub-Agents](https://docs.copilotkit.ai/vue/google-antigravity/multi-agent/subagents): identical Python to React, with the same unpublished `agents._common` imports (`MODEL, aimock_headers, api_key, gemini_base_url, build`), and no Vue frontend code at all.
- #8 When the model call fails (seen: OpenAI `insufficient_quota`), the Vue chat shows nothing: no error, no message. The quickstart's troubleshooting only says to check the terminal.
- #2 Quickstart "Where to go next": three links 404 because the path is doubled: `/vue/google-antigravity/vue/generative-ui/tool-based`, `/vue/google-antigravity/vue/AG-UI-Streams`, `/vue/google-antigravity/vue/prebuilt-components/copilot-threads-drawer`.
- #3 Quickstart: `export OPENAI_API_KEY=sk-...` is bash-only, and the Windows shell form isn't given.

## Build-only (`vue-tsc` / `vite build`; `npm run dev` runs fine)
