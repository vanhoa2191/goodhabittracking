# Lane C Report — Catalog & Data (daily-living-habits)

**Date:** 2026-10-24
**Task ID:** task_8d4061a19213
**Dispatch ID:** ctx_faab6a8ea330
**Worktree:** /home/opc/orca/workspaces/goodhabittracking/daily-living-habits (branch vanhoa2191/daily-living-habits)

---

## Files Created / Modified

### New Files
1. **src/data/daily-living-habits-v1.vi.json** — Catalog data: 12 templates (10 daily + 2 legacy), 4 sets (DLS-01..04)
2. **src/lib/daily-living-habits.ts** — Types, validation, template/set accessors, adapter `toHabitActivity`, status function `dailyLivingStatus`
3. **src/lib/daily-living-habits-id.ts** — Deterministic UUIDv5 ID generation (`dailyLivingActivityId`, `isDailyLivingTemplateId`, test vector)
4. **src/lib/i18n/daily-living-copy.ts** — Vietnamese copy (MVP) with English fallback; all UI strings mapped by ID

### Modified Files
1. **src/lib/experience-flags.ts** — Added `dailyLivingHabits` flag (env `NEXT_PUBLIC_DAILY_LIVING_HABITS`) to `defaultExperienceFlags` and zod overrides, following `habitPrograms` pattern

---

## Test Commands & Results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ Pass (0 errors, 0 warnings) |
| `npm run typecheck` | ✅ Pass |
| `npx vitest run tests/unit/daily-living-habits-id.test.ts` | ✅ 12/12 tests pass |
| `npx vitest run tests/unit/daily-living-habits.test.ts` | ✅ 28/28 tests pass |
| `npx vitest run tests/unit/habit-programs/programs.test.ts` | ✅ 6/6 tests pass (20 programs, 47 framework habits unchanged) |
| `npx vitest run tests/unit/legacy-template-identity.test.ts` | ✅ 8/8 tests pass |
| `npm run verify:habit-framework` | ✅ Verified: 47 records, source hash matches |

### Test Coverage Highlights
- **ID uniqueness**: 12 templates, all IDs unique; 4 sets reference only valid IDs
- **Legacy resolution**: WIT-NUT-01, WIT-CAP-01 pull title/icon/category/timeOfDay/points from `WIT_HABIT_PACKS` at runtime
- **UUIDv5 deterministic IDs**: Verified against Python `uuid.uuid5` reference vector
  - Reference command: `python3 -c "import uuid; n=uuid.UUID('6f1d5b2e-8a47-4c3e-9b0a-2d7e41c9a8f5'); print(uuid.uuid5(n, '11111111-1111-4111-8111-111111111111|22222222-2222-4222-8222-222222222222|WIT-DLY-01'))"`
  - Output: `99b8edd0-9b83-588b-b4f8-9b5ae8cba9ec` (matches TEST_VECTOR)
- **Morning/evening separate IDs**: WIT-DLY-01 and WIT-DLY-02 produce different UUIDv5 IDs for same family/child
- **Adapter**: `toHabitActivity` sets correct defaults (daily, 7 days, approval false, targetAgeStage='all', legacyTemplateId)
- **Status function**: Returns `available`/`added`/`archived`/`graduated`/`sharedCovers` correctly; legacy templates use `matchesLegacyTemplateAssignment`
- **Framework invariants**: 47 framework habits, 20 programs unchanged

---

## Uncertain Points / Follow-up Needed

1. **Points value (5 vs 10)**: Plan §10.4 notes "Cần chủ sản phẩm quyết" for default points (5 proposed vs framework's 10). Currently set to 5 for daily templates; legacy templates keep their original points (10, 15).

2. **English copy completeness**: MVP specifies Vietnamese only; English fallback is minimal. Full translation for other locales deferred per §10.5.

3. **Legacy template matching in status**: `dailyLivingStatus` uses `matchesLegacyTemplateAssignment` with a single localized copy (VI only). Multi-language matching may need refinement when i18n expands.

4. **Cue field usage**: `cue` field included in templates and copy but not yet consumed by UI (P2/P3).

5. **Migration/DB changes**: Lane B owns `activity-mutations.ts` regex update and migration `202610250001_daily_living_template_refs.sql` — not in this lane.

---

## Verification Checklist

- [x] 12 templates (10 WIT-DLY-*, 2 legacy WIT-NUT-01/WIT-CAP-01)
- [x] 4 sets (DLS-01..04) referencing valid IDs only
- [x] validateDailyLivingCatalog() passes
- [x] UUIDv5 deterministic IDs verified against external implementation
- [x] Morning/evening are separate activity IDs
- [x] Adapter produces correct HabitActivity shape
- [x] Status function covers all branches
- [x] 47 framework habits, 20 programs unchanged
- [x] Legacy template identity preserved (WIT-NUT-01, WIT-CAP-01)
- [x] Experience flag added per habitPrograms pattern
- [x] i18n copy maps by ID, includes hand-washing note
- [x] All lint/typecheck/unit tests pass