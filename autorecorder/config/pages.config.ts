/**
 * Pages of https://docs.copilotkit.ai/vue/google-antigravity under test. The Vue app is a single
 * Vite app with no router, so both clips drive http://localhost:5140/. Its runtime is the harness's
 * server.antigravity.ts (HttpAgent -> Antigravity on 8040), because the doc's BuiltInAgent server.ts
 * never reaches Antigravity (FINDINGS.md #1) and the OpenAI key it needs has no credit.
 */
import { definePages } from '../core/types';

export const SKIP_RECORDING: Record<string, string> = {};

export const PAGES = definePages([
  {
    id: 'quickstart',
    name: 'Quickstart (Vue)',
    videoName: 'Quickstart',
    docPath: 'quickstart',
    route: '',
    ideFile: 'my-copilot-app/VERSIONS.md',
    startLine: 6,
    endLine: 20,
    extraTabs: [
      { filePath: 'my-copilot-app/package.json', startLine: 13, endLine: 17 },
      { filePath: 'my-copilot-app/server.ts', startLine: 1, endLine: 26 },
      { filePath: 'my-copilot-app/server.antigravity.ts', startLine: 1, endLine: 25 },
      { filePath: 'my-copilot-app/src/main.ts', startLine: 1, endLine: 5 },
      { filePath: 'my-copilot-app/src/App.quickstart.vue', startLine: 1, endLine: 13 },
    ],
    prompt: 'Tell me in one sentence what this app can do.',
    waitAfterPromptMs: 3000,
  },
  {
    id: 'frontend-tools',
    name: 'App Control - Frontend Tools (Vue)',
    videoName: 'FrontendTools',
    docPath: 'frontend-tools',
    route: '',
    ideFile: 'my-copilot-app/src/components/DashboardAgent.vue',
    startLine: 1,
    endLine: 27,
    extraTabs: [{ filePath: 'my-copilot-app/src/App.vue', startLine: 1, endLine: 11 }],
    prompt: 'Show only sev1 incidents.',
  },
]);
