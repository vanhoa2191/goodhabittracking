# Hygiene scan: UI audit remediation (lane claude-haiku, lane=hygiene)

Scope: read-only scan of the uncommitted diff and untracked files in `/home/opc/orca/goodhabittracking` on `main`. Nothing was edited, staged, stashed, committed, pushed, or deployed. The only file written is this report.

Snapshot: 35 modified tracked files (+2,207 / -733), 16 untracked entries (122 files once directories are expanded), 157 paths in total.

## Verdict: PASS (with a commit-ordering constraint)

No blockers found. The diff is clean of debug code, skip markers, suppressions, whitespace errors, and secrets. The one real constraint is that the commits must land in the order given in section 4, because `FontSettingsModal.tsx` imports the untracked `font-settings-copy.ts`.

## 1. Hygiene findings

| Check | Result |
|---|---|
| `console.log`, `console.debug`, `console.warn`, `debugger` in added lines | none (tracked diff and untracked `src/` + `tests/`) |
| `.only(`, `.skip(`, `xit(`, `xdescribe(`, `fdescribe(`, `test.fixme`, `*.todo(` | none |
| `TODO` / `FIXME` markers in added lines or untracked source | none |
| `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `as any`, `: any` in added lines | none |
| `git diff --check` (whitespace errors) | clean |
| Secret patterns in added lines and untracked text files (AWS keys, `sk_live_`/`sk_test_`, `ghp_`/`github_pat_`, `xox*-`, PEM private keys, JWT `eyJ`, `service_role`, literal `api_key`/`password`/`token` assignments) | none |
| Tracked env or key files | only `.env.example` (template). `src/app/api/pairing/credentials/*` and `supabase/migrations/202609210003_*` match by filename only and are code, not secret values. |
| Absolute `/home/opc/` paths in added diff lines | 0 |
| Absolute `/home/opc/` paths in untracked files | 18 files (local-machine paths in plan and execution notes). Not secrets; noise only. |
| Binaries or screenshots in this diff or the untracked set | none |
| `test-results/`, `playwright-report/`, `*.tsbuildinfo` | present on disk but already ignored (`/test-results/`, `/playwright-report/`, `*.tsbuildinfo`). Not in `git status`. |
| `.playwright-mcp/` | untracked, 1 file (2.5 KB Playwright MCP page snapshot). Should not be committed. |
| `.impeccable/hook.cache.json` | excluded locally via `.git/info/exclude`, not via `.gitignore`. Not portable. |
| `docs/research/2026-10-17-daily-thinking-games-365.csv` | 174 KB text data. Not a binary. Commit is fine; flagged only for size. |
| Pre-existing tracked images (not part of this diff) | `apps/marketing/assets/og-image.jpg` and several `plans/260919-*/reports/**/*.png`. Already tracked; FYI only. |

## 2. Proposed `.gitignore` additions

The current diff only adds `.omx/`, which the working tree already has at the bottom of the file (`# local agent review artifacts`). Proposed additions:

```gitignore
# playwright MCP snapshots and impeccable hook state (local-only)
/.playwright-mcp/
/.impeccable/hook.cache.json
/.impeccable/hook.pending.json
/.impeccable/config.local.json
```

Rationale: `.playwright-mcp/` is tool output. The three `.impeccable/hook.*` and `config.local.json` files are per-machine state. The current exclusion lives only in `.git/info/exclude` and would not reach a fresh clone. `.impeccable/config.json`, `.impeccable/critique/*`, and `.impeccable/surfaces/*` are design records that belong with `DESIGN.md` and should stay committed.

## 3. Full file assignment

Every modified and untracked file appears exactly once below. `.playwright-mcp/page-2026-10-18T15-20-15-954Z.yml` is excluded from commits (see section 2).

### C1: `.gitignore` plus planning, research, and design records (110 files)
- `.gitignore`
- `.impeccable/config.json`
- `.impeccable/critique/2026-10-17T14-25-11Z__src-components-kiddashboard-tsx.md`
- `.impeccable/surfaces/src-components-kiddashboard-tsx.md`
- `.impeccable/surfaces/src-components-parentdashboard-tsx.md`
- `docs/research/2026-10-17-daily-thinking-games.md`
- `docs/research/2026-10-17-daily-thinking-games-365.csv`
- `plans/261017-2130-ui-audit-remediation/` (all 103 files: `decisions.md`, `orchestration.md`, `plan.md`, `test-spec.md`, `phase-00-baseline.md` through `phase-07-verification.md`, `research/audit-baseline.md`, `reviews/*` (7), `handoffs/*` (14), `execution/*` (69))

### C2: store and domain command routing (8 files)
- `src/lib/store.tsx`
- `src/lib/store/domain-command-client.ts`
- `src/lib/store/habit-actions.ts`
- `src/lib/store/reward-actions.ts`
- `tests/unit/domain-command-client.test.ts`
- `tests/unit/habit-actions.test.ts`
- `tests/unit/reward-actions.test.ts`
- `tests/unit/ui-audit-child-store-truth.test.ts`

### C3: i18n copy and copy tests (8 files)
- `src/lib/i18n/kid-quest-copy.ts`
- `src/lib/i18n/parent-actions-copy.ts`
- `src/lib/i18n/parent-approvals-copy.ts`
- `src/lib/i18n/parent-today-copy.ts`
- `src/lib/i18n/font-settings-copy.ts`
- `tests/parent-approvals-copy.test.ts`
- `tests/unit/parent-today-copy-languages.test.ts`
- `tests/unit/font-settings-copy.test.ts`

### C4: visual foundations, font settings, appearance (12 files)
- `DESIGN.md`
- `PRODUCT.md`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/Header.tsx`
- `src/components/ThemeSelector.tsx`
- `src/components/FontSettingsModal.tsx`
- `tests/e2e/appearance.spec.ts`
- `tests/e2e/ui-audit-appearance.spec.ts`
- `tests/e2e/phase02b-contrast.spec.ts`
- `tests/e2e/ui-audit-fixture.ts`

### C5: child (kid) experience (5 files)
- `src/components/KidDashboard.tsx`
- `src/components/KidIndependence.tsx`
- `src/components/HabitTimerModal.tsx`
- `tests/e2e/ui-audit-child-fixture.ts`
- `tests/e2e/ui-audit-child-recovery.spec.ts`

### C6: parent experience (9 files)
- `src/components/ParentDashboard.tsx`
- `src/components/ParentApprovalsTab.tsx`
- `src/components/BulkTaskReview.tsx`
- `src/components/FamilyDataCard.tsx`
- `src/components/LeaderboardSection.tsx`
- `src/components/LeaderboardTable.tsx`
- `tests/e2e/cloud-family-fixture.ts`
- `tests/e2e/parent-navigation-locales.spec.ts`
- `tests/e2e/parent-today.spec.ts`

### C7: UI audit regression coverage and health route test (4 files)
- `tests/e2e/ui-audit-regression.spec.ts`
- `tests/e2e/ui-audit-inclusive.spec.ts`
- `tests/e2e/ui-audit-motion.spec.ts`
- `tests/api/health-route.test.ts`

Count check: C1 110 + C2 8 + C3 8 + C4 12 + C5 5 + C6 9 + C7 4 = 156. Add the excluded `.playwright-mcp` file = 157 paths, which matches the snapshot.

## 4. Commit order and dependencies

Land the commits in this order: C1, C2, C3, C4, C5, C6, C7.

- **C3 must precede C4.** `src/components/FontSettingsModal.tsx` (C4) imports `@/lib/i18n/font-settings-copy` (C3). Its own test, `tests/unit/font-settings-copy.test.ts`, imports the same module.
- **C4 must precede C6.** `tests/e2e/parent-today.spec.ts` (C6) imports `./ui-audit-fixture`, which I moved into C4 for that reason.
- **C4 must precede C5 and C7.** `tests/e2e/phase02b-contrast.spec.ts` (C4) imports `ui-audit-fixture`. `ui-audit-child-recovery.spec.ts` (C5) imports it too.
- **C5 must precede C7.** `ui-audit-regression`, `ui-audit-inclusive`, and `ui-audit-motion` (C7) import `ui-audit-child-fixture` (C5).
- **C2 before C5 and C6 is likely but unverified.** The components in C5 and C6 may use the new store actions from C2. I did not check this by building.

Suggested messages (fill in the summary lines):

```text
C1 docs(ui-audit): record remediation plan, research, and design review artifacts
C2 refactor(store): route habit and reward mutations through domain command client
C3 feat(i18n): add font settings copy and parent copy for remediation
C4 feat(appearance): tighten visual foundations and font settings
C5 fix(child): remediate kid dashboard, independence, and timer flows
C6 fix(parent): remediate parent dashboard, approvals, and leaderboard
C7 test(e2e): add ui-audit regression, inclusive, and motion coverage
```

Every message needs the attribution trailer `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>`.

## 5. Not verified

- I did not run `tsc`, lint, Vitest, or Playwright. Those would write caches or `tsconfig.tsbuildinfo`, and this lane is read-only. Per-commit buildability is therefore unverified.
- The import graph above comes from grep. It is a sound lower bound on dependencies, but a type-only or dynamic import could be missed.

## 6. Recommended next steps (not executed)

1. Apply the `.gitignore` additions in section 2 as part of C1.
2. Land the commits in the order in section 4, running `tsc --noEmit`, `vitest run`, and the ui-audit Playwright specs at each step, or at least at C3, C4, and C7.
3. Decide whether `docs/research/*-365.csv` (174 KB) should be committed.
