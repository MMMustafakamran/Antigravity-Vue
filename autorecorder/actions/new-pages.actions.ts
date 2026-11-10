/**
 * Finding clips for the Vue pages added 2026-11-10 (AUTORECORDER.md section 2): demo, then the
 * faulty doc text drag-selected, then the hurried Notepad note. Problem text: FINDINGS.md entries.
 * Evidence texts were checked against the rendered doc pages (2026-11-10).
 */
import { type Page } from 'playwright';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction, sendPrompt } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { type DocEvidence, showFinding } from './doc-evidence';
import { glideClick, glideTo } from './glide-click';
import { checkpoint, mark, probeText } from '../core/timeline';

type Demo = (page: Page, config: PageRecordConfig, root: string, ctx: ActionContext) => Promise<void>;

interface NewFinding { evidence: DocEvidence[]; note: string; demo?: Demo }

/** Send the prompt, then wait for `text` to show (or give up after `ms`). */
async function promptAndWaitFor(page: Page, config: PageRecordConfig, text: RegExp, ms: number): Promise<boolean> {
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const el = page.getByText(text).first();
  const ok = await el.waitFor({ state: 'visible', timeout: ms }).then(() => true).catch(() => false);
  if (ok) await glideTo(page, el, 3000);
  return ok;
}

export const NEW_FINDINGS: Record<string, NewFinding> = {
  // FINDINGS.md #14
  'programmatic-control': {
    evidence: [{ text: 'def aimock_headers() -> dict[str, str]:', caption: '_common.py is showcase helpers, no runnable agent' }],
    note: [
      'page only gives a run agent button and a stop button for an agent called sales',
      'the only backend code is _common.py, aimock_headers MODEL WORKSPACE SLUG never defined or imported',
      'no agent, no app, nothing registers sales anywhere',
      'so u have to guess the backend, i pointed sales at the quickstart agent just to run it',
      'and the button shows no output either so u cant see what the run did',
    ].join('\n'),
    demo: async (page, _config, _root, ctx) => {
      const run = page.getByRole('button', { name: 'Run agent' });
      await run.waitFor({ state: 'visible', timeout: 15000 });
      await sleep(1200);
      await glideClick(page, run);
      await sleep(1500);
      const done = await page
        .waitForFunction(() => !(document.querySelector('button') as HTMLButtonElement | null)?.disabled, null, { timeout: 60000 })
        .then(() => true)
        .catch(() => false);
      if (!done) ctx.warn('Run agent stayed disabled for 60 s');
      await glideTo(page, run, 3000);
    },
  },
  // FINDINGS.md #19, #20
  'tool-rendering': {
    evidence: [
      { text: 'return build(system_instructions=SYSTEM_PROMPT, tools=TOOLS)', caption: 'build, SYSTEM_PROMPT and 3 of the 4 tools never shown' },
      { text: 'parameters: z.object({ city: z.string() }),', caption: 'card reads city, backend arg is location' },
    ],
    note: [
      'backend snippet does return build with SYSTEM_PROMPT and TOOLS',
      'build SYSTEM_PROMPT search_flights get_stock_price roll_d20 are never shown on the page',
      'so as written its a nameerror, i had to pull the rest from the showcase to run it',
      'and even then the card reads city but the backend get_weather takes location',
      'so the weather card comes up with no city name in it',
    ].join('\n'),
  },
  // FINDINGS.md #21
  'state-rendering': {
    evidence: [
      { text: 'experimental_set_state({**experimental_get_state(), "steps": steps})', caption: 'the only Antigravity backend code writes steps' },
      { text: 'status?: string;', caption: 'the frontend reads status / draft / progress' },
    ],
    note: [
      'research progress panel reads status draft completed total from agent state',
      'but the only antigravity backend code on the page is set_steps and that only writes steps',
      'nothing on the page ever writes status or draft',
      'agent answers fine in chat but the panel just stays on idle the whole time',
    ].join('\n'),
  },
  // FINDINGS.md #23
  'mcp-apps': {
    evidence: [
      { text: 'agents: { default: agent },', caption: 'agent is never defined' },
      { text: 'https://mcp.example.com/mcp', caption: 'placeholder MCP server url' },
    ],
    note: [
      'runtime snippet registers agents default agent but agent is never defined anywhere',
      'and the mcp server url is just mcp.example.com/mcp, a placeholder',
      'filled both in, used the excalidraw mcp server',
      'agent says it drew the flowchart but the app frame in the chat stays blank',
    ].join('\n'),
  },
  // FINDINGS.md #32
  'shared-state-streaming': {
    evidence: [
      { text: 'Token-by-token state streaming is not available with Antigravity.', caption: 'the page says Antigravity cannot stream state' },
      { text: 'experimental_set_state({**experimental_get_state(), "steps": steps})', caption: 'the only backend code writes steps' },
      { text: '<p>{{ state.document ?? "Waiting for a draft…" }}</p>', caption: 'the frontend reads state.document' },
    ],
    note: [
      'page itself says token by token state streaming is not available with antigravity',
      'still shows a frontend that reads state.document from the writer agent',
      'only backend code is set_steps which writes steps, never document',
      'agent writes the poem in chat but the panel stays on waiting for a draft, nothing streams',
    ].join('\n'),
  },
  // FINDINGS.md #35
  'shared-state-readonly': {
    evidence: [
      { text: "Surfaced to the agent through the backend's CopilotKit middleware on every turn.", caption: 'the page promises the agent sees the context' },
      { text: "The agent sees them on every turn through the runtime's context injection", caption: 'same promise' },
    ],
    note: [
      'page says useAgentContext values reach the agent on every turn',
      'set workspace to northstar like the doc, asked which workspace am i in',
      'agent said C:/srv/agents/w1, it never saw northstar',
      'the antigravity adapter only passes app context with experimental_app_context=True on the agent',
      'page never mentions that and shows no backend code at all',
    ].join('\n'),
  },
  // FINDINGS.md #42
  'use-interrupt': {
    evidence: [
      { text: "Some runtimes cannot pause a run mid-tool the way LangGraph's", caption: 'the page says to use useHumanInTheLoop instead' },
      { text: 'The backend: agent instructed to call the frontend tool', caption: 'the frontend / backend sections have no code' },
      { text: 'import MeetingChat from', caption: 'MeetingChat is never shown' },
    ],
    note: [
      'page says antigravity cant pause mid tool so use useHumanInTheLoop',
      'but the frontend and backend sections for that are just text, no code',
      'only code is a useInterrupt approval panel and App.vue importing MeetingChat which is never shown',
      'got the approve card only by copying the backend from the hitl page and guessing MeetingChat',
    ].join('\n'),
    demo: async (page, config, _root, ctx) => {
      if (!(await promptAndWaitFor(page, config, /Pick a time/, 60000))) ctx.fail('No approval panel showed up');
    },
  },
  // FINDINGS.md #44
  'headless-interrupts': {
    evidence: [
      { text: 'import HeadlessInterruptPanel from "./components/HeadlessInterruptPanel.vue";', caption: 'HeadlessInterruptPanel.vue is never shown' },
      { text: 'Register a useHumanInTheLoop tool with a Vue render component', caption: 'the primitives section is prose only' },
    ],
    note: [
      'only code on the page is App.vue importing HeadlessInterruptPanel.vue',
      'that component is never shown anywhere',
      'vite fails, failed to resolve import ./components/HeadlessInterruptPanel.vue',
      'the primitives part is only text so theres nothing to build it from, page is blank',
    ].join('\n'),
    demo: async (page, _config, _root, ctx) => {
      await sleep(6000);
      const input = await page.locator('textarea, input').count();
      if (!input) ctx.fail('Page is blank: HeadlessInterruptPanel.vue does not exist (Vite import error)');
      await sleep(2000);
    },
  },
  // FINDINGS.md #46
  webmcp: {
    evidence: [{ text: 'const orders = await searchOrders(status);', caption: 'searchOrders is never defined' }],
    note: [
      'OrderSearch.vue calls searchOrders but the page never defines or imports it',
      'asked the agent to use the searchOrders tool to find my open orders',
      'chat never replies, just sits there',
      'webmcp side also needs a chrome flag so nothing else to try from the page',
    ].join('\n'),
    demo: async (page, config, _root, ctx) => {
      await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
      await sleep(30000);
      const text = await page.evaluate(() => document.body.innerText).catch(() => '');
      if (!/order/i.test(text.replace(config.prompt, ''))) ctx.fail('The agent never replied after the searchOrders tool was asked for');
    },
  },
  // FINDINGS.md #47
  subagents: {
    evidence: [
      { text: 'On the frontend, the delegation log is a reactive render of the', caption: 'no frontend code for the delegation log' },
      { text: 'pip install ag-ui-antigravity google-antigravity', caption: 'install step misses httpx' },
      { text: 'from agents._common import MODEL, aimock_headers, api_key, gemini_base_url', caption: 'agents._common never published' },
    ],
    // The supervisor delegates to three sub-agents before it answers: give it two minutes.
    demo: async (page, config, _root, ctx) => {
      if (!(await promptAndWaitFor(page, config, /scatter|Rayleigh|wavelength/i, 120000))) ctx.fail('The supervisor never replied');
    },
    note: [
      'delegation log section says the frontend renders the delegations slot but has no code at all',
      'install is pip install ag-ui-antigravity google-antigravity, subagents.py imports httpx',
      'so the server crashes, modulenotfound no module named httpx',
      'also imports agents._common which is never shown',
      'with httpx and the showcase _common it replies but theres no delegation log',
    ].join('\n'),
  },
};

export const runNewFindingAction: PageActionHandler = async (page, config, root, ctx) => {
  const f = NEW_FINDINGS[config.id];
  try {
    await (f.demo ?? runStandardAction)(page, config, root, ctx);
  } finally {
    await showFinding(page, config, f.evidence, f.note);
  }
};

/** Fully Headless UI (✅): the doc's own <input aria-label="Message"> + Send button, replies as <article data-role>. */
export const runHeadlessUiAction: PageActionHandler = async (page, config, _root, ctx) => {
  await sendPrompt(page, config.prompt, {
    inputSelector: 'input[aria-label="Message"]',
    submitSelector: 'button[type="submit"]',
    messageSelector: 'article[data-role="assistant"]',
    timeoutMs: 15000,
  });
  const reply = page.locator('article[data-role="assistant"]').last();
  const ok = await page
    .waitForFunction(() => [...document.querySelectorAll('article[data-role="assistant"]')].some((a) => (a.textContent ?? '').trim().length > 2), null, { timeout: 60000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) ctx.fail('No assistant reply rendered in the headless chat');
  else await glideTo(page, reply, 3000);
};

/** Human in the Loop (✅): the time picker card appears in the chat; pick a slot. */
export const runHitlAction: PageActionHandler = async (page, config, _root, ctx) => {
  if (!(await promptAndWaitFor(page, config, /Pick a time/, 90000))) return ctx.fail('No time picker card showed up');
  const slot = page.getByRole('button', { name: /Tomorrow/ }).first();
  if (await slot.isVisible().catch(() => false)) {
    await glideClick(page, slot);
    await sleep(8000);
  }
};

// ---------------------------------------------------------------------------------------------
// Threads pages, tested with the CopilotKit Intelligence key (2026-11-10). Runtime:
// my-copilot-app/server.threads.ts on 8154 (the headless page's server.ts). Threads are per user
// and persist between runs, so older rows can already be listed.
// ---------------------------------------------------------------------------------------------
const DRAWER_ROW = 'copilotkit-threads-drawer li[role="option"][data-thread-id]';
const promptHead = (config: PageRecordConfig) => config.prompt.slice(0, 24);

/** Threads Drawer: chat once, the thread is listed, New Conversation resets the chat, the row replays it. */
export const runThreadsDrawerAction: PageActionHandler = async (page, config, root, ctx) => {
  await page.locator('copilotkit-threads-drawer').first().waitFor({ state: 'attached', timeout: 30000 }).catch(() => {});
  await sleep(3000); // the drawer loads its list
  const rowsBefore = await page.locator(DRAWER_ROW).count();
  await runStandardAction(page, config, root, ctx);
  const listed = await page
    .waitForFunction((n) => (document.querySelector('copilotkit-threads-drawer')?.shadowRoot
      ?.querySelectorAll('li[role="option"][data-thread-id]').length ?? 0) > n, rowsBefore, { timeout: 45000, polling: 500 })
    .then(() => true)
    .catch(() => false);
  void checkpoint('thread', 'the new conversation is listed in the drawer', async () => `${await page.locator(DRAWER_ROW).count()} row(s), was ${rowsBefore}`, {
    ok: () => listed,
  });
  if (!listed) {
    ctx.fail('The Threads Drawer did not list the new conversation.');
    return;
  }
  await sleep(4000); // the thread name fills in
  await glideTo(page, page.locator(DRAWER_ROW).first(), 2000);
  mark('click', 'New Conversation');
  await glideClick(page, page.getByText('New Conversation', { exact: true }).first());
  const userBubble = page.getByText(config.prompt, { exact: false }).first();
  const reset = await userBubble.waitFor({ state: 'hidden', timeout: 15000 }).then(() => true).catch(() => false);
  void checkpoint('new', '"New Conversation" clears the chat', async () => reset);
  if (!reset) ctx.fail('"New Conversation" did not reset the chat.');
  await sleep(2500);
  mark('click', 'reopen thread');
  const mine = page.locator(DRAWER_ROW).filter({ hasText: promptHead(config) });
  await glideClick(page, (await mine.count()) > 0 ? mine.first() : page.locator(DRAWER_ROW).first());
  const replayed = await userBubble.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
  void checkpoint('replay', 'selecting the thread replays its history', () => probeText(page.getByText(config.prompt, { exact: false })));
  if (!replayed) ctx.fail('Selecting the thread in the drawer did not replay its conversation.');
  await sleep(2500);
  // The page's own "New conversation" toolbar button (useCopilotChatConfiguration().startNewThread()).
  mark('click', 'own New conversation button');
  await glideClick(page, page.getByRole('button', { name: 'New conversation', exact: true }).first());
  const ownReset = await userBubble.waitFor({ state: 'hidden', timeout: 15000 }).then(() => true).catch(() => false);
  void checkpoint('new-button', 'the own "New conversation" button clears the chat', async () => ownReset);
  if (!ownReset) ctx.fail('The own "New conversation" button did not reset the chat.');
  await sleep(3000);
};

/** Headless Threads: chat once, the useThreads list shows it, selecting another row switches the chat, and back. */
export const runHeadlessThreadsAction: PageActionHandler = async (page, config, root, ctx) => {
  await runStandardAction(page, config, root, ctx);
  // The doc's ThreadSidebar: <li><button>{name}</button><button>Rename</button><button>Archive</button><button>Delete</button></li>
  const rows = page.locator('li:has(> button:text-is("Rename")) > button:first-child');
  const listed = await rows.first().waitFor({ state: 'visible', timeout: 45000 }).then(() => true).catch(() => false);
  void checkpoint('thread', 'the useThreads list shows the thread (Rename / Archive / Delete row)', async () => `${await rows.count()} row(s)`, {
    ok: () => listed,
  });
  if (!listed) {
    ctx.fail('The chat ran, but the useThreads list shows no threads.');
    return;
  }
  await sleep(4000); // the thread name fills in
  const userBubble = page.getByText(config.prompt, { exact: false }).first();
  const other = rows.filter({ hasNotText: promptHead(config) });
  if ((await other.count()) > 0) {
    mark('click', 'other thread');
    await glideClick(page, other.first());
    const switched = await userBubble.waitFor({ state: 'hidden', timeout: 20000 }).then(() => true).catch(() => false);
    void checkpoint('switch', 'selecting another thread switches the chat away from this one', async () => switched);
    if (!switched) ctx.fail('Selecting another thread did not switch the chat.');
    await sleep(3000);
  }
  mark('click', 'reopen thread');
  const mine = rows.filter({ hasText: promptHead(config) });
  await glideClick(page, (await mine.count()) > 0 ? mine.first() : rows.first());
  const replayed = await userBubble.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
  void checkpoint('replay', 'selecting the thread replays its history', () => probeText(page.getByText(config.prompt, { exact: false })));
  if (!replayed) ctx.fail('Selecting the thread did not replay its conversation.');
  await sleep(4000);
};
