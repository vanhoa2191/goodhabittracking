# Phase02a — Kilo visual foundations implementation

## Status
in-progress → ready-for-review (02b pending before full phase-02 accepted)

## Scope executed (verified, no new dependencies, no commits)

### 1. globals.css semantic dark overrides
- Added `--border: #e8ded1` to `:root`
- Added full dark values for `--surface`, `--surface-kid`, `--surface-parent`, `--ink`, `--border`, `--primary`, `--success`, `--destructive` under `html.dark`
- Added `--color-border: var(--border)` to `@theme inline`

### 2. layout.tsx
- Replaced hardcoded `dark:bg-zinc-950 dark:text-slate-100` with semantic `text-ink` (dark value now comes from `--ink` token)

### 3. page.tsx footer
- Replaced `border-slate-100 dark:border-zinc-800` with `border-border` (dark value now comes from `--border` token)

### 4. HabitTimerModal.tsx color contrast fixes
- `bg-emerald-600` → `bg-emerald-700` (Complete button, line 178)
- `bg-amber-500` → `bg-amber-700` (Pause button, line 198)

### 5. ParentDashboard.tsx points-confirm
- `bg-amber-500` → `bg-amber-700` (confirm button, line 963)

### 6. KidIndependence.tsx
- `bg-emerald-600` → `bg-emerald-700` (cheer OK button, line 79)

### 7. FamilyDataCard.tsx
- `bg-amber-600` → `bg-amber-700` (import confirm button, line 73)

## Test results (external server localhost:3107)

```
PLAYWRIGHT_BASE_URL=http://localhost:3107 npx playwright test tests/e2e/ui-audit-appearance.spec.ts --project=chromium
```

| Test | Result | Evidence |
|---|---|---|
| A03 settled timer Pause text ≥4.5:1 in light and dark | PASS | Contrast ratio verified for amber-700 on both themes |
| A05 app shell follows light/dark/system through UI and reload | PASS | Background luminance <0.1 in dark, >0.7 in light |
| A07 timer controls ≥44 CSSpx at every font scale on mobile | FAIL (expected) | Close button 36px, reset 40px — pre-existing, deferred to phase 06 per plan |

Output saved: `.omx/ui-execution/phase02a-test-output.txt`

## Lint / typecheck
- `npm run typecheck`: PASS (no errors)
- `npm run lint`: 1 pre-existing error in `.omx/ui-execution/capture-final.ts` (out of scope, not introduced by this phase)

## Files changed
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/HabitTimerModal.tsx`
- `src/components/ParentDashboard.tsx`
- `src/components/KidIndependence.tsx`
- `src/components/FamilyDataCard.tsx`

## Not touched (per scope)
- ParentApprovalsTab.tsx, BulkTaskReview.tsx (owned by 01)
- Header.tsx, font labels, motion, child layout
- Reduced-motion rule
- Global settings, new dependencies, commits, production deployment

## Next
- 02b: ParentApprovalsTab/BulkTaskReview color fixes after 01 accepted
- Then phase-02 handoff → ready-for-review