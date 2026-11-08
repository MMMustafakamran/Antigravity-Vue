/**
 * probe: the fast check. Open a page's demo route, send its prompt, wait for the result, save
 * the evidence. No doc tour, no IDE, no Notepad, no humanized mouse/typing, headless.
 * Use it to explore new pages, check findings and verify fixes; record the full humanized
 * clip (npm run record) only once a page's result is final (AUTORECORDER.md section 0).
 *
 * Run from a repo's autorecorder/ folder (servers up via start-all.sh):
 *   npx tsx ../.qa/tools/probe.mts <page-id> [<page-id> ...] [options]
 *   npx tsx ../.qa/tools/probe.mts --all                      every page not in SKIP_RECORDING
 * Options:
 *   --prompt "..."     override the page's prompt (one page only)
 *   --route path       override the route (one page only)
 *   --wait 90          max seconds to wait for the reply to settle (default 90)
 *   --parallel 3       pages at once (default 3)
 *   --headed           show the browser
 *   --video            also save a plain (unedited) video of the demo
 * Output: autorecorder/videos/probe/<page-id>/  final.png, shots/<n>s.png (every 5 s),
 *         result.json { reply, errorsOnScreen, console errors, failed requests, timing }
 * Prints one line per page: ok / no-reply / error, seconds, first words of the reply.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const req = createRequire(join(cwd, 'package.json'));
const { chromium } = req('playwright');
const imp = (p: string) => import(pathToFileURL(resolve(cwd, p)).href);

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string, d?: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : d;
};
const valued = new Set(['prompt', 'route', 'wait', 'parallel']);
const ids: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) { if (valued.has(args[i].slice(2))) i++; continue; }
  ids.push(args[i]);
}

const { PAGES, SKIP_RECORDING = {} } = await imp('config/pages.config.ts');
const { PROJECT, demoUrlFor } = await imp('config/project.config.ts');
const { SELECTORS } = await imp('config/selectors.config.ts');

const WAIT = Number(opt('wait', '90')) * 1000;
const PAR = Math.max(1, Number(opt('parallel', '3')));
const pages = (flag('all') ? PAGES.filter((p: any) => !SKIP_RECORDING[p.id]) : PAGES.filter((p: any) => ids.includes(p.id)))
  .map((p: any) => ({ ...p, route: opt('route', p.route), prompt: opt('prompt', p.prompt) }));
const unknown = ids.filter((i) => !PAGES.some((p: any) => p.id === i));
if (unknown.length) console.error(`unknown page id(s): ${unknown.join(', ')}`);
if (!pages.length) { console.error('nothing to probe'); process.exit(2); }

const ERROR_TEXT = /error|failed|unable to|not found|exception|cannot|could not|invalid input/i;
const outRoot = join(cwd, 'videos', 'probe');
const browser = await chromium.launch({ headless: !flag('headed') });

async function probe(p: any) {
  const out = join(outRoot, p.id);
  mkdirSync(join(out, 'shots'), { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(flag('video') ? { recordVideo: { dir: out, size: { width: 1440, height: 900 } } } : {}),
  });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const sec = () => Math.round((Date.now() - t0) / 100) / 10;
  const consoleErrors: string[] = [], pageErrors: string[] = [], failed: string[] = [];
  page.on('console', (m: any) => { if (m.type() === 'error' || /no renderer is registered|rendered nothing/.test(m.text())) consoleErrors.push(`${sec()}s ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e: any) => pageErrors.push(`${sec()}s ${String(e?.message ?? e).slice(0, 300)}`));
  page.on('response', (r: any) => { if (r.status() >= 400) failed.push(`${sec()}s ${r.status()} ${r.request().method()} ${r.url().slice(0, 160)}`); });
  page.on('requestfailed', (r: any) => failed.push(`${sec()}s FAILED ${r.method()} ${r.url().slice(0, 160)} ${r.failure()?.errorText ?? ''}`));

  const result: any = { page: p.id, route: p.route, prompt: p.prompt ?? null };
  let shotTimer: any;
  try {
    await page.goto(demoUrlFor(p.route ?? ''), { waitUntil: 'domcontentloaded', timeout: 120000 });
    let n = 0;
    shotTimer = setInterval(() => { page.screenshot({ path: join(out, 'shots', `${String(n += 5).padStart(3, '0')}s.png`) }).catch(() => {}); }, 5000);
    const input = page.locator(SELECTORS.chatInput).first();
    await input.waitFor({ state: 'visible', timeout: 60000 });
    result.pageReadyS = sec();
    if (p.prompt) {
      // Real key events (fill() bypasses the chat's own input state), then confirm the question
      // shows up in the page; the runtime may still be connecting, so retry up to 3 times.
      const probeText = p.prompt.slice(0, 40);
      for (let attempt = 1; attempt <= 3 && !result.sentS; attempt++) {
        await input.click();
        await page.keyboard.press('Control+A').catch(() => {});
        await page.keyboard.press('Backspace').catch(() => {});
        await input.pressSequentially(p.prompt, { delay: 2 });
        await page.keyboard.press('Enter');
        for (let i = 0; i < 10 && !result.sentS; i++) {
          await page.waitForTimeout(500);
          const typedLeft = ((await input.inputValue().catch(() => (input as any).innerText?.() ?? '')) || '').trim();
          const shown = (await page.locator('body').innerText().catch(() => '')).includes(probeText);
          if (shown && !typedLeft.includes(probeText)) result.sentS = sec();
        }
        if (!result.sentS) await page.locator(SELECTORS.chatSubmit).first().click({ timeout: 2000 }).catch(() => {});
      }
      if (!result.sentS) result.sendNote = 'prompt never left the composer (3 attempts)';
      // Settled = the last assistant message's text has not changed for 4 s (or the wait runs out).
      const msgs = page.locator(SELECTORS.assistantMessage);
      let last = '', stableSince = Date.now();
      const deadline = Date.now() + WAIT;
      while (Date.now() < deadline) {
        const cnt = await msgs.count().catch(() => 0);
        const txt = cnt ? ((await msgs.nth(cnt - 1).innerText().catch(() => '')) || '') : '';
        const body = (await page.locator('body').innerText().catch(() => '')).length;
        const sig = `${txt}|${body}`;
        if (sig !== last) { last = sig; stableSince = Date.now(); }
        else if (txt && Date.now() - stableSince > 4000) break;
        await page.waitForTimeout(500);
      }
      const cnt = await msgs.count().catch(() => 0);
      result.reply = cnt ? ((await msgs.nth(cnt - 1).innerText().catch(() => '')) || '').trim().slice(0, 2000) : '';
      result.replyS = result.reply ? sec() : null;
    }
    const bodyText: string = await page.locator('body').innerText().catch(() => '');
    result.errorsOnScreen = [...new Set(bodyText.split('\n').map((l) => l.trim()).filter((l) => l.length < 300 && ERROR_TEXT.test(l)))].slice(0, 20);
  } catch (e: any) {
    result.harnessError = String(e?.message ?? e).split('\n')[0];
  } finally {
    clearInterval(shotTimer);
    await page.screenshot({ path: join(out, 'final.png'), fullPage: false }).catch(() => {});
    result.totalS = sec();
    result.consoleErrors = consoleErrors.slice(0, 40);
    result.pageErrors = pageErrors.slice(0, 20);
    result.failedRequests = failed.filter((f) => !/analytics|posthog|segment|sentry|favicon/i.test(f)).slice(0, 40);
    await ctx.close();
    writeFileSync(join(out, 'result.json'), JSON.stringify(result, null, 1));
  }
  const status = result.harnessError ? 'HARNESS' : !p.prompt ? 'loaded' : !result.reply ? 'NO-REPLY' : result.errorsOnScreen.length ? 'reply+errors' : 'ok';
  console.log(`${status.padEnd(12)} ${String(result.totalS).padStart(5)}s  ${p.id.padEnd(32)} ${(result.harnessError ?? result.reply ?? '').replace(/\s+/g, ' ').slice(0, 90)}`);
}

console.log(`probe: ${pages.length} page(s), ${PAR} at a time, ${PROJECT.frontendUrl}`);
const queue = [...pages];
await Promise.all(Array.from({ length: Math.min(PAR, queue.length) }, async () => {
  while (queue.length) await probe(queue.shift());
}));
await browser.close();
console.log(`evidence: ${outRoot}`);
