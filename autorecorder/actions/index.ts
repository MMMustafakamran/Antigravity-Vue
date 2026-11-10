/**
 * Which handler serves which page id. Pages not listed here use runStandardAction
 * (send the page's prompt, wait for the reply).
 */
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction } from '../core/actions';
import { type Page } from 'playwright';

import { waitForPageReady } from './page-ready';
import { runVueFrontendToolsAction, runVueQuickstartAction } from './antigravity.actions';
import { NEW_FINDINGS, runHeadlessUiAction, runHitlAction, runNewFindingAction } from './new-pages.actions';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  quickstart: runVueQuickstartAction,
  'frontend-tools': runVueFrontendToolsAction,
  'headless-ui': runHeadlessUiAction,
  hitl: runHitlAction,
  ...Object.fromEntries(Object.keys(NEW_FINDINGS).map((id) => [id, runNewFindingAction])),
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  // Vite serves modules lazily, so markup can be on screen before anything is wired to it.
  await waitForPageReady(page, { label: config.id });

  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath, ctx);
}
