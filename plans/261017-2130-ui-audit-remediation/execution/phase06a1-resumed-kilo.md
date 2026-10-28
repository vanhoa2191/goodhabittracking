# Phase 06a1 — Resumed Kilo (Laguna S2.1) — Bounded Cleanup / Regression Plan + Results

## Context

- Previous Kilo worker (`phase06a1-kilo-laguna.md`) reported 5 E2E pass but coordinator review
  (`phase06a1-coordinator-review-notes.md`) flagged test-reliability defects.
- Root has NOT accepted. Code diff (Header.tsx, ThemeSelector.tsx) is applied on disk but
  must verify against strict, non-relaxed assertions.
- Dev server E1 on `http://127.0.0.1:3107` is live (HTTP 200 verified).
- Node v26.11.1 at `/home/opc/.nvm/versions/node/v26.11.1/bin`. Playwright 1.63.0.

## Owned files (write scope)

1. `tests/e2e/ui-audit-appearance.spec.ts` — Header/Theme test portion ONLY
   (preserve A03, A05, A07-timer tests and their helpers `enterDemo`, `selectTheme`,
   `openTimer`, `colors`, `settledColors`).
2. `src/components/Header.tsx` — touch targets only IF strict measurement fails (not preemptive).
3. `src/components/ThemeSelector.tsx` — `min-w-11` + focus ring only IF strict measurement fails.

## Defects fixed

### D1. `Math.round` masks sub-44 fractional values — FIXED
- `measureVisible()`: `width: Math.round(r.width)` → `width: r.width`; `height: Math.round(r.height)` → `height: r.height`.
- Compact ThemeSelector: removed `Math.round` from `evaluateAll` bounds (now uses raw `getBoundingClientRect`).
- Added `r.top >= 0 && r.left >= 0` guard to `measureVisible` to filter off-screen elements.
- Floor assertion stays `toBeGreaterThanOrEqual(44)` — raw fractional, exact.

### D2. `addInitScript` accumulation across iterations — FIXED
- Split single test with nested loops (4×3=12 iterations on one page) into 12 individual
  `test()` calls via `test.describe` + loop. Each test gets a fresh `page` + `context`
  (Playwright default isolation). `addInitScript` called exactly once per test — no accumulation.

### D3. No computed `--app-font-scale` assertion — FIXED
- Added `assertFontScale(page, percentage)` helper that polls
  `getComputedStyle(document.documentElement).getPropertyValue('--app-font-scale')`
  to equal `String(parseInt(percentage)/100)` (= '1', '1.08', '1.18'), then awaits
  `document.fonts.ready`. Called in every kid, parent, compact, and keyboard test before measuring.

### D4. No settle wait for fonts / transitions — FIXED
- Added `waitForLayoutSettle(page)` helper: awaits `document.fonts.ready` + polls
  `header.getAnimations()` until zero running animations (5 s timeout). Called after
  font scale assert and before measurement. Also called after opening more-menu panel.

### D5. Parent-mode test: 12 iterations in one 30 s timeout — FIXED
- Split into 12 individual `test()` calls (per viewport × scale) in `test.describe`.
- Parent mode `test.setTimeout(90_000)` — justified: setup + PIN entry + measurement per iteration.

### D6. Parent-mode test: no hard assertion that mode actually switched — FIXED
- After `setupOrUnlockParent`, hard-assert `expect(page.locator('header[data-app-shell="parent"]')).toBeVisible({timeout: 10_000})`.
- Added `expect(page.locator('header[data-app-shell="parent"]')).toHaveCount(1)`.
- Added hard-assert on parent-only home link: `expect(page.locator('header a[aria-label="Trang chủ"]')).toBeVisible({timeout: 5_000})`.
- Added explicit `toBeVisible({timeout: 10_000})` on parent-mode button before click, and
  `expect(page.getByRole('dialog', { name: /PIN/i })).toBeVisible({timeout: 10_000})` before PIN entry.

### D7. Theme persistence not verified at all scales — FIXED
- Compact ThemeSelector split into 3 individual `test()` calls (per scale).
- `assertFontScale` called before each measurement.
- After reload: re-assert `assertFontScale` + `theme-light` `aria-pressed="true"` (proves persistence).

### D8. Keyboard test: un-awaited focus — VERIFIED OK
- `moreBtn.focus()` is already awaited (line in original code).
- Added `assertFontScale` + `waitForLayoutSettle` calls before interaction.
- "compactlight.focus()missingawait" in review notes appears garbled — no such pattern found.

### D9. `measureVisible` filters enhanced — FIXED
- Added `r.top >= 0 && r.left >= 0` guard for off-screen element filtering.

## Source code verification (no edits needed)

Read Next.js docs in `node_modules/next/dist/docs/` and impeccable craft-floor before any UI edits.
The existing Header.tsx and ThemeSelector.tsx diffs are correct and sufficient:
- Header.tsx: all buttons/links raised from `min-h-[38px]`/`min-h-[40px]` to `min-h-[44px]`,
  added `min-w-[44px]` where width was unconstrained, focus-visible rings added.
- ThemeSelector.tsx: `min-w-11` (44px) added alongside `min-h-11` (44px), focus ring added.

No strict measurement failures were triggered — all 28 tests passed at 100/108/118% across
375/768/1280/1536 px. No UI edits were needed.

## Execution results

### Lint + Typecheck
- ESLint (`tests/e2e/ui-audit-appearance.spec.ts`, `src/components/Header.tsx`, `src/components/ThemeSelector.tsx`): **0 errors, 0 warnings**.
- TypeScript `tsc --noEmit`: **0 errors** in owned files.
  (Pre-existing errors in `tests/unit/ui-audit-child-store-truth.test.ts` are outside scope; not modified.)

### E2E run
```
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107 \
  npx playwright test tests/e2e/ui-audit-appearance.spec.ts \
  -g "A07 (header|compact|more-menu)" \
  --project=chromium --workers=1 --reporter=list --output=/tmp/kilo/pw-output4
```
- **28 passed, 0 failed** in 2.9m.

Test breakdown:
| Group | Tests | Status |
|---|---|---|
| A07 header (kid mode) — 4vp × 3scale | 12 | ALL PASS |
| A07 header (parent mode) — 4vp × 3scale | 12 | ALL PASS |
| A07 compact ThemeSelector — 3scale | 3 | ALL PASS |
| A07 more-menu keyboard | 1 | PASS |
| **Total** | **28** | **28 passed** |

### File fingerprints
- `tests/e2e/ui-audit-appearance.spec.ts` — 421 lines, new file (untracked). SHA256: `a43fb1a5ed6bef9612691f790f6bea606dcdc59d`
- `src/components/Header.tsx` — 739 lines, 10 changes (20-line diff). SHA256: `9fb3c5da49bc20ff62ca3493b2c718dc7a0d0d59`
- `src/components/ThemeSelector.tsx` — 40 lines, 1 change (2-line diff). SHA256: `aaab2ede44d6f18b7ef17a33fa0b4049616954d6`
- Git HEAD: `83b118367fead8a79f7918c928e4f92dbdd0590e`

## Constraints honored
- No edits to globals, layout, store, fonts, timers, or parent/other test files.
- No build, dev, global settings, deps, commit, deploy.
- Root owns E1 dev server (localhost:3107); not restarted.
- workers=1, chromium only, PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107.
- stdout outside `--output` directory (`--reporter=list`).
- Never self-accept; root owns final acceptance.

## Limitations
- No visual screenshots or detector captures — coordinator owns final visual audit.
- Did not run A03, A05, A07-timer tests (outside header/theme scope; preserved unchanged).
- WebKit/Safari not tested — root E1 is chromium-only dev server.
- Production build not run — no build/deploy.
