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
import { closeNotepad, openNotepad, typeInNotepad } from '../core/overlays/notepad';
import { clickTaskbarApp, ensureOverlays, waitForHydration } from '../core/overlays/taskbar';
import { type Page } from 'playwright';
import { type PageRecordConfig } from '../core/types';

export interface DocEvidence {
  /** Text inside the element to point at (matched against pre/code/p/li/h2/h3). */
  text: string;
  caption: string;
}

export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {
  quickstart: [
    { text: 'Build with Google Antigravity', caption: 'The "Vue quickstart" URL shows the Antigravity landing page, not Vue steps' },
    { text: 'import type { NextRequest } from "next/server";', caption: 'The only code on the page is a Next.js route - nothing for Vue' },
  ],
};

async function findEvidence(page: Page, text: string) {
  for (const sel of ['pre', 'code', 'p', 'li', 'h2', 'h3']) {
    const loc = page.locator(sel, { hasText: text }).last();
    if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) return loc;
  }
  // Callouts and banners are plain divs: fall back to the innermost element with the text.
  const any = page.getByText(text, { exact: false }).first();
  if ((await any.count()) > 0 && (await any.isVisible().catch(() => false))) return any;
  return null;
}

/** Go back to the doc page and point at each defect, one by one. */
export async function showDocEvidence(page: Page, config: PageRecordConfig): Promise<void> {
  const items = FINDING_EVIDENCE[config.id];
  if (!items?.length) return;
  console.log(`   🔎 Showing the finding on the doc page (${items.length} spot(s))...`);
  await clickTaskbarApp(page, 'chrome').catch(() => {});
  // Demo verdict is settled; docs.copilotkit.ai's own hydration errors must not be blamed on the app.
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
  await page.goto(config.docUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await ensureOverlays(page, 'chrome');
  await waitForHydration(page, 15000).catch(() => false);
  await sleep(1500);

  for (const item of items) {
    const target = await findEvidence(page, item.text);
    if (!target) {
      console.warn(`   ⚠️ Evidence not found on the doc page: "${item.text}"`);
      continue;
    }
    await target.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await sleep(1800);
    await target.evaluate((el, caption) => {
      const r = el.getBoundingClientRect();
      const box = document.createElement('div');
      box.className = '__finding_mark';
      Object.assign(box.style, {
        position: 'fixed', left: `${r.left - 6}px`, top: `${r.top - 6}px`,
        width: `${r.width + 12}px`, height: `${r.height + 12}px`,
        border: '3px solid #ef4444', borderRadius: '8px', zIndex: '2147483000', pointerEvents: 'none',
        boxShadow: '0 0 0 4px rgba(239,68,68,0.18)',
      });
      const label = document.createElement('div');
      label.className = '__finding_mark';
      label.textContent = caption;
      Object.assign(label.style, {
        position: 'fixed', left: `${Math.max(8, r.left - 6)}px`, top: `${Math.max(8, r.top - 44)}px`,
        maxWidth: '720px', padding: '6px 12px', background: '#ef4444', color: '#fff',
        font: '600 16px/1.3 Segoe UI, Arial, sans-serif', borderRadius: '6px',
        zIndex: '2147483001', pointerEvents: 'none',
      });
      document.body.append(box, label);
    }, item.caption);
    await glideTo(page, target, 4500);
    await page.evaluate(() => document.querySelectorAll('.__finding_mark').forEach((n) => n.remove()));
    await sleep(500);
  }
}



/** Finding clips end with the finding typed into Notepad (REPOS.md, "Finding clips"). */
const QUICKSTART_FINDING = [
  'FINDING - Vue quickstart (FINDINGS.md #1, #9)',
  '',
  '1. The live page shows the Antigravity landing page with Next.js code,',
  '   not the Vue steps. Its embedded demo is a 404.',
  '2. The Vue steps (only in the .md version) use OpenAI BuiltInAgent',
  '   and never connect to Antigravity.',
  '',
  'This chat only works because the harness swapped in an HttpAgent',
  'pointing at the Antigravity backend (server.antigravity.ts).',
].join('\n');

export const runVueQuickstartAction: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runStandardAction(page, config, root, ctx);
  } finally {
    await showDocEvidence(page, config).catch((e) => console.warn(`   doc evidence failed: ${String(e).slice(0, 120)}`));
  }
  await openNotepad(page, 'finding-vue-quickstart.txt');
  await typeInNotepad(page, QUICKSTART_FINDING);
  await closeNotepad(page, 4000);
};
