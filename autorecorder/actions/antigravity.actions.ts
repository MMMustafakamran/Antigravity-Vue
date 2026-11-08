import { type PageActionHandler } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { glideTo } from './glide-click';

/** Vue Frontend Tools: the agent calls filter_incidents and "Current filter" changes. */
export const runVueFrontendToolsAction: PageActionHandler = async (page, config, _root, ctx) => {
  const label = page.getByText(/Current filter:/).first();
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const changed = await page
    .waitForFunction(() => !/Current filter: all\b/.test(document.body.innerText), null, { timeout: 60000 })
    .then(() => true)
    .catch(() => false);
  if (!changed) ctx.fail('filter_incidents never ran: "Current filter" stayed "all".');
  try {
    await waitForAgentResponseCompletion(page, 2500, msgCount);
  } catch (e) {
    ctx.warn(`Reply did not complete cleanly: ${String(e).slice(0, 160)}`);
  }
  await glideTo(page, label, 3000);
  await sleep(1500);
};

import { runStandardAction } from '../core/actions';
import { type DocEvidence, showFinding } from './doc-evidence';

export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {
  quickstart: [
    { text: 'Build with Google Antigravity', caption: 'The Vue quickstart URL shows the Antigravity landing page, not Vue steps' },
    { text: 'import type { NextRequest } from "next/server";', caption: 'The only code on the page is a Next.js route' },
  ],
};

/** Finding clips end with the finding typed into Notepad (REPOS.md Rule 6). */
const QUICKSTART_FINDING = [
  'vue quickstart - findings #1 #9',
  '',
  'the live page shows the antigravity landing page with next.js code',
  'not the vue steps, and the embedded demo is a 404',
  'the vue steps (only in the .md version) use an openai BuiltInAgent',
  'and never connect to antigravity at all',
  'this chat only works because the harness swapped in an HttpAgent',
  'pointing at the antigravity backend (server.antigravity.ts)',
].join('\n');

export const runVueQuickstartAction: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runStandardAction(page, config, root, ctx);
  } finally {
    await showFinding(page, config, FINDING_EVIDENCE[config.id], QUICKSTART_FINDING, 'finding-vue-quickstart.txt');
  }
};
