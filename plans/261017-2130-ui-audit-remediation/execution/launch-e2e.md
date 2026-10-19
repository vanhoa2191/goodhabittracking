# LANE e2e — warm Playwright rerun (opencode)

Date: 2026-10-19T14:38Z (Asia/Ho_Chi_Minh 21:38)
Task: `task_f07ef95a0a1e` / dispatch `ctx_c4ddee8bda71` (lane=e2e)
Repo: `/home/opc/orca/goodhabittracking`, branch `main`, HEAD `83b118367fead8a79f7918c928e4f92dbdd0590e`
Result: **PASS — 55 passed, 7 skipped (by existing project guards), 0 failed, 0 flaky**
Scope: verification only. No source, test, config, stash, checkout, commit, push or deploy action. The intentional uncommitted UI-audit diff (51 porcelain entries) was left untouched.

## Environment and method

- Node `v26.11.1`, npm `11.20.0`, `@playwright/test` `1.63.0`, Next.js `16.3.8`.
- Own dev server started on a verified-free port `127.0.0.1:3210` (no other Next server for this repo was running; ports 3000/3107/3108/3109/3111 were closed). Command used the repo's existing Playwright webServer environment flags:
  `npm run dev -- --webpack --hostname 127.0.0.1 --port 3210`
  with the same `NEXT_PUBLIC_*`/`KIDHABIT_E2E_ADMIN_BYPASS` values as `playwright.config.ts`.
- Server was warmed before the measured run: `GET /` and `GET /start` each returned HTTP 200 (7.99s and 3.18s first compile). Immediately before the test run, a repeat `GET /` returned HTTP 200 in **0.110s**, confirming a warm route.
- Tests were pointed at that server with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3210`, so Playwright did **not** start its own webServer. Projects: `chromium` and `mobile-chromium`; `--workers=1`; `--timeout=90000` (as requested). No build was run.
- Server was stopped after the run; port 3210 is closed. Unrelated services were untouched.

Command:

```sh
PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3210 \
./node_modules/.bin/playwright test \
  tests/e2e/parent-navigation-locales.spec.ts \
  tests/e2e/accessibility.spec.ts \
  tests/e2e/appearance.spec.ts \
  tests/e2e/a11y-menus.spec.ts \
  --project=chromium --project=mobile-chromium \
  --workers=1 --timeout=90000 \
  --output=/tmp/opencode/lane-e2e/results2 --reporter=list
```

`a11y-menus.spec.ts` was added because the two cold-timeout cases described for this lane (the menu case and the offers/referral case) live in that file, not in `accessibility.spec.ts`; `accessibility.spec.ts` itself is fully covered below. Raw list log: `/tmp/opencode/lane-e2e/run-all-list.log`. Run metadata: `/tmp/opencode/lane-e2e/results2/.last-run.json` (`status: passed`, empty `failedTests`).

## Per-test results

### chromium (desktop) — 29 passed, 2 skipped, 0 failed

| # | Spec / test | Result | Time |
|---|---|---|---|
| 1 | a11y-menus: header dropdowns — child switcher menu named/announced | PASS | 7.8s |
| 2 | a11y-menus: header dropdowns — child switcher keyboard, arrows, Escape | PASS | 5.8s |
| 3 | a11y-menus: header dropdowns — language menu named/announced | PASS | 8.0s |
| 4 | a11y-menus: header dropdowns — language menu Down/Up wrap, Escape | PASS | 6.3s |
| 5 | a11y-menus: "more" menu — open menu is a named dialog, no serious/critical | PASS | 7.9s |
| 6 | a11y-menus: "more" menu — folded "Thêm" section open, no serious/critical | PASS | 7.3s |
| 7 | a11y-menus: "more" menu — child screen, no serious/critical | PASS | 6.3s |
| 8 | a11y-menus: "more" menu — Escape closes, restores focus, aria-expanded | PASS | 6.0s |
| 9 | a11y-menus: "more" menu — folded "Thêm" keyboard open/close | PASS | 8.1s |
| 10 | a11y-menus: child bottom bar no serious/critical | SKIP (mobile-only surface) | — |
| 11 | a11y-menus: child bottom bar tasks-button nudge | SKIP (mobile-only surface) | — |
| 12 | a11y-menus: wide-screen child tabs no serious/critical | PASS | 8.9s |
| 13 | a11y-menus: **offers/referral group in parent settings** | PASS | 16.9s |
| 14 | a11y-menus: entry-gate "is this the child's device?" block | PASS | 7.8s |
| 15 | accessibility: landing page no serious/critical | PASS | 4.9s |
| 16 | accessibility: trial start entry no serious/critical | PASS | 4.7s |
| 17 | accessibility: child dashboard + task details no serious/critical | PASS | 8.4s |
| 18 | accessibility: parent approvals, rewards and settings no serious/critical | PASS | 10.7s |
| 19 | accessibility: pricing dialog focus trap / Escape / focus restore | PASS | 7.3s |
| 20 | accessibility: document language follows selected locale | PASS | 4.2s |
| 21 | accessibility: vi renders, no app error or horizontal overflow | PASS | 3.5s |
| 22 | accessibility: en renders, no app error or horizontal overflow | PASS | 3.1s |
| 23 | accessibility: fr renders, no app error or horizontal overflow | PASS | 3.3s |
| 24 | accessibility: de renders, no app error or horizontal overflow | PASS | 3.5s |
| 25 | accessibility: it renders, no app error or horizontal overflow | PASS | 3.6s |
| 26 | accessibility: es renders, no app error or horizontal overflow | PASS | 3.7s |
| 27 | accessibility: zh renders, no app error or horizontal overflow | PASS | 4.1s |
| 28 | accessibility: ja renders, no app error or horizontal overflow | PASS | 3.5s |
| 29 | accessibility: ko renders, no app error or horizontal overflow | PASS | 4.3s |
| 30 | appearance: new visitors start light, follow device preference, reload, hydration guards | PASS | 9.9s |
| 31 | parent-navigation-locales: parent areas keyboard-usable at 375px, all 9 locales (incl. German) | PASS | 16.6s |

### mobile-chromium (Pixel 7) — 26 passed, 5 skipped, 0 failed

| # | Spec / test | Result | Time |
|---|---|---|---|
| 32–35 | a11y-menus: 4 desktop header-dropdown tests | SKIP (desktop guard, `isMobile`) | — |
| 36 | a11y-menus: open "more" menu named dialog, no serious/critical | PASS | 7.1s |
| 37 | a11y-menus: folded "Thêm" open, no serious/critical | PASS | 7.1s |
| 38 | a11y-menus: "more" menu on child screen, no serious/critical | PASS | 7.2s |
| 39 | a11y-menus: "more" menu Escape/focus/aria-expanded | PASS | 5.7s |
| 40 | a11y-menus: folded "Thêm" keyboard open/close | PASS | 7.1s |
| 41 | a11y-menus: child bottom bar no serious/critical | PASS | 7.2s |
| 42 | a11y-menus: child bottom bar tasks-button nudge | PASS | 7.5s |
| 43 | a11y-menus: wide-screen child tabs | SKIP (desktop-only surface) | — |
| 44 | a11y-menus: **offers/referral group in parent settings** | PASS | 9.9s |
| 45 | a11y-menus: entry-gate child-device block | PASS | 5.9s |
| 46 | accessibility: landing page no serious/critical | PASS | 5.5s |
| 47 | accessibility: trial start entry no serious/critical | PASS | 5.4s |
| 48 | accessibility: child dashboard + task details | PASS | 9.5s |
| 49 | accessibility: parent approvals, rewards and settings | PASS | 11.4s |
| 50 | accessibility: pricing dialog focus trap / Escape / restore | PASS | 8.5s |
| 51 | accessibility: document language | PASS | 5.1s |
| 52 | accessibility: vi no error/overflow | PASS | 4.8s |
| 53 | accessibility: en no error/overflow | PASS | 4.8s |
| 54 | accessibility: fr no error/overflow | PASS | 3.9s |
| 55 | accessibility: de no error/overflow | PASS | 4.1s |
| 56 | accessibility: it no error/overflow | PASS | 3.9s |
| 57 | accessibility: es no error/overflow | PASS | 4.7s |
| 58 | accessibility: zh no error/overflow | PASS | 4.5s |
| 59 | accessibility: ja no error/overflow | PASS | 4.2s |
| 60 | accessibility: ko no error/overflow | PASS | 4.8s |
| 61 | appearance: light start, system dark, reload, hydration guards | PASS | 10.7s |
| 62 | parent-navigation-locales: 9-locale parent keyboard/375px | PASS | 19.9s |

Total run: 62 tests, **55 passed / 7 skipped / 0 failed** in 6.3 minutes (earlier identical main-suite-only run on the same warm server was 34/34 passed in 3m11s, exit 0).

## Findings

- **No real product failure reproduced in this lane.** The German 375px overflow case in `parent-navigation-locales.spec.ts` passes on both desktop and Pixel 7 contexts: all nine locales keep `scrollWidth <= innerWidth`, the 3 tabs remain keyboard operable, and the approvals HelpTip stays fully inside 375px.
- **Cold-timeout cases now pass:** the `a11y-menus` "more"-menu cases and the parent-settings offers/referral case pass on both projects (offers/referral 16.9s desktop, 9.9s mobile; all under the 90s budget). `accessibility.spec.ts` and `appearance.spec.ts` also pass on both projects.
- **Root cause of the earlier phase-08 cold failures** is consistent with a cold Next dev-server compile, not an a11y or product defect: the phase-08 shared log recorded a 25.8s first `GET /` (23.6s Next compile) against a 30s per-test budget, so setup/axe crossed the deadline without producing a violation. On this warm server a repeat `GET /` is 0.110s and the same cases finish in 6–17s with the unchanged 5s assertion timeout. `appearance.spec.ts` likewise passes warm (9.9s/10.7s) including its hydration-error and page-error guards.
- **Skipped cases are existing, intentional project guards**, not disabled failures: 2 desktop-only a11y-menus cases skip under mobile, and 5 mobile/desktop-specific a11y-menus cases skip under the other project.
- **Not covered / limitations:** dev-mode server only (no `npm build`, no production/OpenNext preview); Chromium engines only (no WebKit/iOS Safari host run); axe + keyboard/geometry assertions are automated browser checks, not manual screen-reader or physical-device verification. No failures means no root-cause fix was required and no files were edited.

## Evidence

- Per-test log: `/tmp/opencode/lane-e2e/run-all-list.log`
- Dev server log: `/tmp/opencode/lane-e2e/dev.log`
- Playwright output dir: `/tmp/opencode/lane-e2e/results2` (`.last-run.json`: passed, no failed tests)
- Earlier main-suite-only run (3 files, both projects, exit 0): `/tmp/opencode/lane-e2e/run-main.log`
- Report file (only repo write): `plans/261017-2130-ui-audit-remediation/execution/launch-e2e.md`
