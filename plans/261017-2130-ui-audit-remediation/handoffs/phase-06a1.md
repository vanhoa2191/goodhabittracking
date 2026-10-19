# Phase 06a1 — Header / Theme touch-target remediation (resumed)

**Owner**: Kilo (poolside/laguna-s-2.1:free)
**Status**: accepted (root reproduced overflow remediation; see `../execution/phase06a1-root-acceptance.md`)
**Dependencies**: 02a (accepted), 03 (accepted), 04a (released) — foundation established
**Parent**: 01 / 05 (separate) — NOT addressed
**Child**: 04b store correction (separate) — NOT addressed

## Scope owned

- `tests/e2e/ui-audit-appearance.spec.ts` — Header/Theme test portion ONLY (new file)
- `src/components/Header.tsx` — touch targets (already applied by previous Kilo; no changes needed)
- `src/components/ThemeSelector.tsx` — `min-w-11` + focus ring (already applied; no changes needed)

## Source code (verified, no edits needed)

### Header.tsx — 9 touch-target bumps

All `min-h-[38px]` / `min-w-[38px]` literals raised to `min-h-[44px]` / `min-w-[44px]`.
`sm:min-h-[40px]` variants removed (44 px floor for all breakpoints). Focus rings added.

| Line | Element | Pre | Post |
|---|---|---|---|
| 170 | BrandMark hero Link | 36x36 / 40x40 | `min-h-[44px] min-w-[44px]` |
| 190 | Profile trigger | 38px / 40px h | `min-h-[44px]` |
| 245 | Font button (Aa) | 38x38 | `min-w-[44px] min-h-[44px]` |
| 290 | Portrait guide | 38px h | `min-h-[44px]` |
| 301 | Parent home link | 38px h, w=42px | `min-h-[44px] min-w-[44px]` |
| 340 | Google login | 38px h, w=42px | `min-h-[44px] min-w-[44px]` |
| 352 | Pro badge | 38px / 40px h | `min-h-[44px]` |
| 388 | Parent mode button | 38px / 40px h | `min-h-[44px]` |
| 430 | More menu | 38x38 | `min-w-[44px] min-h-[44px]` |

### ThemeSelector.tsx — 1 edit

- Added `min-w-11` (44 px) alongside existing `min-h-11` (44 px) to theme option buttons
- Added `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500` for accessible focus rings

### Verification of source

All 28 E2E tests passed at 100/108/118% across 375/768/1280/1536 px with **raw fractional**
bounds (no `Math.round`). No control measured below 44 px at any scale/viewport combination.
No UI edits were needed — existing Header.tsx and ThemeSelector.tsx changes are sufficient.

## Tests — `tests/e2e/ui-audit-appearance.spec.ts`

### Preserved (unchanged)

- A03 — settled timer Pause text contrast in light/dark
- A05 — app shell follows light/dark/system selections through UI and reload
- A07 timer — timer close/reset/start controls ≥44 px at 3 font scales on mobile

### New/reliability-fixed header & theme tests

1. **A07 header (kid mode)** — `test.describe` with per-(viewport, scale) `test()` calls:
   4 viewports × 3 scales = 12 tests. Fresh page per test (no `addInitScript` accumulation).
   Asserts `--app-font-scale` = 1/1.08/1.18, waits for fonts + animations to settle, then
   measures raw fractional bounds. All visible header buttons/anchors ≥44 CSSpx.
   Mobile menu panel controls also measured when opened.

2. **A07 header (parent mode)** — 12 tests. Fresh context per test. Click parent-mode button
   → enter PIN → **hard-assert** `header[data-app-shell="parent"]` visible (no caught timeout,
   no conditional fake pass). Parent-only home link asserted. Full 44 px matrix at all
   viewport × scale combinations.

3. **A07 compact ThemeSelector** — 3 tests (per scale). Asserts `--app-font-scale` before
   measurement. All 3 compact theme buttons ≥44×44 raw fractional. Selects dark → verifies
   `aria-pressed` + `localStorage` → reloads → re-asserts scale + persistence.

4. **A07 more-menu keyboard** — Enter opens, Escape closes, focus trapped inside menu,
   focus restored to trigger button. Theme selection persists after close/reopen.

### Reliability improvements over previous worker

| Defect | Fix |
|---|---|
| `Math.round(r.width)` masks 43.5→44 | Raw fractional `r.width` / `r.height` |
| `addInitScript` accumulates on same page | Fresh `page` per test (12 individual tests) |
| No `--app-font-scale` assertion | `assertFontScale()` polls + awaits `document.fonts.ready` |
| Measurements before fonts set | `waitForLayoutSettle()` polls `header.getAnimations()` |
| 12×PIN matrix in one 30 s test | Split into 12 tests; parent-mode timeout 90 s |
| No hard parent-mode assertion | `expect(header[data-app-shell="parent"]).toBeVisible` + parent home link |
| Compact theme doesn't verify scale | `assertFontScale` before + after reload |

## Verification

| Check | Result |
|---|---|
| ESLint (3 files) | 0 errors, 0 warnings |
| TypeScript `tsc --noEmit` (owned files) | 0 errors |
| E2E (chromium, localhost:3107, workers 1) | **28 passed, 0 failed** (2.9 m) |
| Probe: all controls ≥44×44 raw fractional @ 375/768/1280/1536 × 100/108/118% | ALL PASS |
| Hard parent-mode assert after PIN | PASS (12/12 viewport×scale) |
| Theme persist via reload | PASS (3/3 scales) |
| Keyboard Enter/Escape/focus-trap/persistence | PASS |

## Gaps / Limitations

- **No visual screenshots or detector captures** — coordinator owns final Impeccable/visual audit.
- **Not all A07 tests verified in this session**: A03, A05, A07-timer preserved unchanged, not re-run.
- **No production build** — no build/deploy.
- **WebKit/Safari not tested** — root E1 is chromium-only dev server.
- Source code (Header.tsx, ThemeSelector.tsx) was already modified by previous Kilo worker;
  this session verified sufficiency via strict E2E but made no new source edits.
- Pre-existing TypeScript errors in `tests/unit/ui-audit-child-store-truth.test.ts` are
  outside 06a1 scope and were not modified.

## Remaining Phase 06 work (NOT this task)

- **06a2**: HabitTimerModal touch targets + motion/focus. A07 timer assertions remain expected-red until 06a2.
- **06b**: Full inclusive audit, font settings, motion polish.
- **07**: Final verification — full checks, Cloudflare build, budget, production E2E/console/a11y, captures.
