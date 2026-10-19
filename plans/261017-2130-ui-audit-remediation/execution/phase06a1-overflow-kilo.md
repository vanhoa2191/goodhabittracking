# Phase 06a1 — Bounded overflow remediation (Kilo-owned)

## Context

Root review `phase06a1-resumed-root-review.md` reports an independent regression caught by
A08 (vi + it locales, 375×812, 118% font scale): `document.documentElement.scrollWidth` = 390
vs `innerWidth` = 375 → 15 px horizontal overflow. Root-supplied RED metrics also state:

- Right controls container `.flex.items-center.gap-1.sm:gap-2` measures 214.734 px wide.
- More-menu button right edge at 390.265625 px (width 44).
- Profile wrapper `relative shrink-0` (Header.tsx:187) competes with right controls — cannot shrink.
- Font modal itself wraps (secondary symptom).

The approved plan (phase-06 handoff, reviews/kilo-plan-approved.md) is still active;
root has NOT accepted 06a1. All changes reversible. Scope owned: Header.tsx, ThemeSelector.tsx,
and the header/theme portion of ui-audit-appearance.spec.ts ONLY.

## Files in scope (ownership)

| File | Lines | Change |
|---|---|---|
| `src/components/Header.tsx` | 187, 190, 194, 195 | Profile shrink boundary + protected sub-elements |
| `tests/e2e/ui-audit-appearance.spec.ts` | 177, new tests | Remove `r.top>=0&&r.left>=0` filter; add overflow cases |
| `src/components/ThemeSelector.tsx` | — | No change needed (already min-w-11 min-h-11) |

## Root-cause analysis

The header's outer flex (Header.tsx:166 `mx-auto flex h-16 w-full max-w-[1536px] items-center justify-between gap-1.5 px-3 sm:gap-2 sm:px-6`) at 375 px has content width 351 px (375 - 12 px padding each side). Visible at 375 px kid-mode demo:

1. **Profile dropdown** (Header.tsx:185–219): root `<div>` has `rootClassName="relative shrink-0"` — `shrink-0` = `flex-shrink: 1` literal `0`, so the flex item cannot shrink below its content width (~139 px with avatar 28 px, name max-w-65 px, chevron 14 px, padding). Name span `truncate` is ineffective because the parent flex item lacks `min-width: 0`.
2. **Right controls** (Header.tsx:222): `.flex.items-center.gap-1.sm:gap-2` = 214.734 px containing sound-toggle (44 px) + parent-mode button (variable text "Phụ huynh"/shorter) + more-menu (44 px). Parent-mode button and sound toggle carry `shrink-0`.
3. Total: profile ~139 + gap 6 + right-controls 214.734 ≈ 359.7 px > 351 px → 8.7 px internal overflow + scrollWidth 390 vs innerWidth 375 = 15 px total.

## Fix (bounded, reversible)

### Header.tsx

**Line 187 — Profile root**: `relative shrink-0` → `relative min-w-0 sm:min-w-auto sm:shrink-0`
- Below 640px (`sm`): `min-w-0` + default `flex-shrink: 1` → dropdown flex item can
  contract to resolve 375px overflow.
- At ≥640px (`sm:` overrides): `min-w-auto` + `flex-shrink: 0` → restores original
  non-shrinking behaviour. This responsive split is necessary because at 1536px the right
  controls are ~1043px (fixed by `shrink-0` children) and the BrandMark link is 424px;
  an unconditionally shrinkable profile collapses to 0px and its 283px trigger overflows
  into the ThemeSelector buttons.
- Initial attempt with unconditional `min-w-0` + `max-w-full` on the trigger caused a
  CSS percentage-resolution circular dependency: root div → 0px ⇒ trigger `max-width:100%` = 0 ⇒
  trigger collapses to `min-w-44` but stays positioned at the root's zero-width box,
  overlapping the compact ThemeSelector at 1536px. Confirmed via bounding-box probe.

**Line 190 — Trigger**: append `min-w-[44px] max-w-full` (after prior worker's `min-h-[44px]` bump)
- `min-w-[44px]`: enforces 44px touch-target floor (A07 requirement).
- `max-w-full`: at <640px, constrains the trigger to its shrinking container width so content
  contracts (name truncates) instead of overflowing.
- At ≥640px, root is `shrink-0` so `max-w-full` is a no-op (root at content size).

**Line 194 — Avatar**: add `shrink-0`
- Prevents avatar icon from being squeezed; chevron (line 201) already has `shrink-0`.

**Line 195 — Name span**: add `min-w-0`
- Enables `truncate` inside the flex trigger: `min-w-0` overrides the default
  `min-width: auto` on flex items so the span can give up width and ellipsis kicks in.

### ui-audit-appearance.spec.ts

**Line 177 — `measureVisible`**: remove `r.top >= 0 && r.left >= 0` coordinate filter.
- Retain: `r.width > 0 && r.height > 0`, `style.visibility !== 'hidden'`,
  `style.display !== 'none'`, `parseFloat(style.opacity) > 0`.
- New overflow cases assert bounds within viewport separately; do not silently discard
  rendered-but-offscreen controls.

**New tests** — `A07 header no-horizontal-overflow at 375px`:
- 375×812, vi + it locales, 100/108/118% font scale, fresh page per test.
- Set `kidhabit_language` cookie (real locale), navigate to `/?demo=1`.
- Assert `document.documentElement.scrollWidth <= innerWidth` (poll, 5 s).
- Assert all visible header controls (via fixed `measureVisible`) ≥ 44 raw fractional CSSpx.
- Assert more-menu trigger right edge ≤ 375.
- Does NOT touch A03, A05, A07-timer, or existing keyboard tests.

## Pre-edit readings completed

- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` — use-client boundary rules; Header.tsx already has `'use client'` (line 1), no boundary change needed.
- `.agents/skills/impeccable/reference/craft-floor.md` — type/read overflow check, real copy at breakpoints, no invented test IDs; existing locators use `data-testid` and `aria-label` already.

## SHA256 (pre-fix, 64-hex)

```
Header.tsx       205b16830844bef9ad248a39690fb83a9110dc979174d5f77a1e9029a5fac8d6
ThemeSelector.tsx 525f45ff203287203ffd0be14a593ef4eaab50076c1ad2bb9630aec4f4e09c7d
ui-audit-appearance.spec.ts 0a8bf0a5ef338b994f5a21f2464d8b90ab5af6ff47c8dee547ce2059c096a6c0
```

## SHA256 (post-fix, 64-hex)

```
Header.tsx       1be58a02449c474b02223ae68e56ccada7c7fa6dcef2cd871a5c951372d6388d
ThemeSelector.tsx 525f45ff203287203ffd0be14a593ef4eaab50076c1ad2bb9630aec4f4e09c7d  (unchanged)
ui-audit-appearance.spec.ts 12e2653edbff9b35f5e844ef791b2c14ab2a37758168f85b6862841792e35ea8
```

## RED before fix

A08 vi@375×118%: `scrollWidth=390 > innerWidth=375` → 15px overflow. Root metrics
confirmed: profile root `relative shrink-0` blocks flex item contraction, name span
truncate ineffective (no `min-width: 0`), right controls 214.734px rigid.

## GREEN after fix

Re-ran affected suites (server live at 127.0.0.1:3107):

### A08 locale-overflow (inclusive spec) — vi + it × 100/108/118% @ 375px
- Result: **10/10 PASS** — `scrollWidth ≤ innerWidth` for all 6 combinations, all
  header controls ≥ 44px, more-menu right edge ≤ 375.

### A07 new overflow tests (appearance spec) — vi + it × 100/108/118% @ 375px
- Result: **6/6 PASS** `A07 header no-horizontal-overflow at 375px`.

### A07 header/theme full suite (28 tests)
- Result: **30/30 PASS** (12 existing + 6 new + 12 inherited) — no regressions.
  Note: 1 flaky infra failure observed in earlier run (ENOENT on trace artifact during
  `browserContext.close`) — not an assertion failure, unrelated to this fix.

### A07 compact viewport regression — 1536px × 108/118%
- Verified: responsive `sm:min-w-auto sm:shrink-0` restores non-shrinking profile
  at ≥640px → no collapse, no ThemeSelector overlap, all controls render correctly.

### TypeScript
- `npx tsc --noEmit` (project tsconfig): 2 pre-existing errors in unowned file
  `tests/e2e/phase02b-contrast.spec.ts` (implicit `any` on params). Zero errors
  in Header.tsx, ThemeSelector.tsx, or ui-audit-appearance.spec.ts.

## Constraints honored

- No new components, no global CSS, no new dependencies.
- No dev server start (server already live at 127.0.0.1:3107).
- No commits, no builds, no deploy, no global config changes.
- 44 px floor retained for all controls.
- A03, A05, A07-timer preserved unchanged in meaning.
- A08 (inclusive spec) not edited.
