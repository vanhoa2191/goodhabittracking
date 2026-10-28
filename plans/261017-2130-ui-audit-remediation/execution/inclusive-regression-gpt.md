# Inclusive regression correction — test plan

Scope: only `tests/e2e/ui-audit-inclusive.spec.ts` and this report. No Phase06 implementation or acceptance.

1. Preserve the real demo and paired-child entry paths; remove conditional fallback clicks, CSS-class option locators, hardcoded locale-cookie origin and nonempty-body focus checks.
2. Exercise font/size UI, selected states, persistent IDs and computed scale before/after reload. Keep full Vietnamese size phrases as explicit regression expectations.
3. Smoke all nine locales in separate browser contexts. Hard-assert 4 font/3 size options before inspecting labels; verify translated modal/section copy, semantic localized full option names and previews, and reject every actual Vietnamese font name/preview outside VI. Soft product assertions allow the entire matrix to execute while remaining red.
4. Reuse the read-only child fixture, advance 60 separate one-second ticks, verify completion under reduced motion, meaningful completion focus, live announcement, Escape and trigger restoration, without saving.
5. Run Chromium against existing port3107 only; retain raw stdout/stderr and exit. Run targeted ESLint and full typecheck under Node26. Record assertion reds separately from fixture/navigation failures and release ownership to06.

No current-session OMX execution mode was activated; the cancel keyword hook needs no state mutation. Unrelated coordinator state remains untouched.

## Result — corrected tests, expected pre06 RED

Changed authored files: `tests/e2e/ui-audit-inclusive.spec.ts` and this report only. No app/store/CSS/helper/other-test edits, agents, dependencies, commits, deployments, server lifecycle operations or final detector. The child fixture was read and reused without edits. Existing unrelated working-tree changes were preserved.

Simplifications: removed catch-and-ignore/optional fallback clicks, arbitrary sleeps, CSS utility-class font discovery, broad unnamed dialogs, hardcoded locale origin, shared locale contexts, second-page persistence substitution, vacuous body-text focus and a single61s clock jump. Font discovery uses the real button role intersected with the actual inline font-family attribute; size discovery uses actual percentage accessible names. Header desktop title and mobile menu/button paths both require a real click and labelled modal. Label assertions run only after hard 4/3 count guards.

### Verification on 2026-10-19

All commands used Node26.11.1 via process-local PATH `/home/opc/.nvm/versions/node/v26.11.1/bin:/usr/local/bin:/usr/bin:/bin` and `rtk proxy env`. No global settings changed.

| Command | Real exit | Evidence |
| --- | --- | --- |
| `npx eslint tests/e2e/ui-audit-inclusive.spec.ts --max-warnings=0` | 0 | `.omx/ui-execution/inclusive-correction-eslint.log` |
| `npm run typecheck` (`tsc --noEmit`) | 0 | `.omx/ui-execution/inclusive-correction-typecheck.log` |
| `PLAYWRIGHT_BASE_URL=http://localhost:3107 npx playwright test tests/e2e/ui-audit-inclusive.spec.ts --project=chromium --workers=1 --output=.omx/ui-execution/inclusive-correction-output` | 1 | Raw unfiltered stdout/stderr: `.omx/ui-execution/inclusive-correction-playwright.log`; saved real exit: `.omx/ui-execution/inclusive-correction-playwright.exit`; per-case traces/screenshots/error contexts in the output directory |

The shell captured raw output through redirection, retained the real Playwright status and exited with that same status. No pipeline, pass-on-failed, skip or fixme was used. Full typecheck passed on the current concurrent source snapshot; no04a type error occurred in this run.

Runtime results: **3 executed / 3 failed, all expected product assertions; no fixture/navigation failures**.

1. **A08 appearance persistence** (27.7s): real UI selected `serif` and `xlarge`; aria-pressed, localStorage keys and computed `--app-font-scale=1.18` passed before and after actual reload. Modal reopened and both selected-state assertions passed. Final full phrase assertion correctly failed: expected `Chữ to rõ ràng`, actual button text `118%Chữ`.
2. **A08 nine-locale matrix** (about1min): trace confirms steps `vi,en,fr,de,it,es,zh,ja,ko` all executed in separate contexts. Each reached the translated labelled modal, heading/section-copy assertions and exactly4font/3size checks, then closed the dialog/context. VI full font names/previews passed; all3VI size labels failed as truncated (`Vừa`, `Lớn`, `Chữ`). All8non-VI locales retained the actual Vietnamese font names/previews and truncated VI sizes, failing semantic localized category/full-description checks and explicit rejection of the full real VI strings (also the descriptive names without “Phông”). These remain RED rather than accepting arbitrary nonempty copy. Semantic category patterns allow translation/editorial wording changes without prescribing invented exact translations.
3. **V02 auto-end**: real paired-child task trigger `1m Bắt đầu` opened labelled `Đồng hồ thói quen`; real dialog Start transitioned to Pause. All60 separate `clock.runFor(1000)` calls ran. Completion `Hoàn thành thời gian` and enabled `Đã xong & Đóng` CTA appeared with reduced-motion media verified. The meaningful activeElement check failed (cannot pass on body, dialog container or unrelated controls); live-region/status completion check failed because no matching announced completion exists. Soft assertions allowed the rest of the case to run: result remained visible after another tick, no save commands were sent, Escape removed the labelled dialog, trigger focus restored, and commands remained empty. Trace confirms these final assertions passed.

### Remaining coverage and handoff

This is test preparation and diagnostic evidence, **not Phase06 acceptance**. Pending06 must repair A08 font/size localization/full labels and V02 automatic completion focus/live announcement, then rerun the same command without weakening assertions. No production code changed here.

Unexercised: mobile more-menu branch, other browser engines, normal-motion comparison, touch bounds,200%zoom/reflow, actual screen-reader announcement and device behavior. Only serif/xlarge persistence is exercised; other stored-ID combinations are outside these three bounded cases. Font option order follows the current four persistent-ID options; meaningful category patterns may need editorial coordination for a legitimate semantic rename. Normal save/failure recovery is deliberately unexercised and remains in the child recovery owner's suite; no04b fixture/store mutation is required here. The read-only shared child fixture currently owns its own language-cookie/setup details.

Ownership released: the inclusive spec and this report are ready for coordinator review and subsequent06 rerun. GPT04a child/timer/fixture and Full01/OpenCode parent/store/test ownership remain untouched. Coordinator retains final detector and all Phase06 acceptance decisions. No further work is running from this task.
