# Working in `autorecorder/`

**Before editing anything here, read [ADAPT.md](ADAPT.md).**

Bringing an older copy of this folder up to the CLI pipeline (recording
`copilotkit create`, the installs and the scaffolded app)? Read
[PORT-CLI.md](PORT-CLI.md) as well.

This folder is a portable screen-recording suite shared across every CopilotKit
framework repo adapted per framework.

Two rules override any instinct to tidy:

1. **`core/` is frozen.** It holds no framework-specific values — they all come
   from `config/`. If a port seems to need a `core/` change, report it instead of
   making it: it means something leaked into shared code and every other repo has
   the same bug. `npm run core:check` enforces this against
   `core/CORE_MANIFEST.json`; a deliberate core change is followed by
   `npm run core:write`, and the manifest diff is what tells the other repos
   what to port. `node scripts/core-manifest.mjs --diff <other>/autorecorder`
   lists how two copies differ.

2. **`npm run doctor` is the definition of done.** Not "the config looks right".
   The command exits 0, or the adaptation is not finished. Say which check fails
   rather than describing the work as complete.

The adaptation surface is exactly: `config/project.config.ts`,
`config/pages.config.ts`, `config/selectors.config.ts`, `config/cli.config.ts`,
and `actions/`.

A page handler in `actions/` reports through its fourth argument, `ctx`:
`ctx.warn(...)` for something the doc promises that was not observed (the run
shows `PASS*` with the note), `ctx.fail(...)` when the feature did not work
(the clip is still saved, the page reports `FAIL`). A `console.log` reaches
nobody — the summary and `videos/RECORD_RESULTS.json` only see what goes
through `ctx`.

When a change here is worth keeping across repos, it belongs in `core/` and
should be ported to the other copies — say so explicitly so it can be.

## `core/` change ported from DeepAgentspy-angular (2026-09-25)

- `console-capture.ts` / `engine.ts`: `breakingErrors`. An uncaught exception,
  Angular's `ERROR`/`NG0xxx`, or a failed request to a localhost harness server
  now FAILs the take instead of adding one warning line.
- `console-capture.ts`: hydration mismatches are no longer in `IGNORED`. They
  show as console errors (warnings on the take), not silence.
- This recorder has no `[ISSUE]` outcome. DeepAgentspy-angular's
  `ctx.reproduced` / `[ISSUE]`-only-when-observed is there if you need it.
