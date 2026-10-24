# Lane O — Onboarding Report

## Files Modified

1. `src/lib/onboarding/wizard.ts` - Core wizard logic with `StarterHabitChoice` union type
2. `src/lib/i18n/onboarding-wizard-copy.ts` - Added copy keys for daily/age habit source selection (all 9 locales)
3. `src/components/onboarding/HabitsStep.tsx` - Radio/segmented choice for "Bắt đầu với sinh hoạt hằng ngày" vs age-based
4. `src/components/onboarding/OnboardingWizard.tsx` - Creates daily living activities after profile creation
5. `tests/unit/onboarding-wizard.test.ts` - Tests for new union type and daily habit integration
6. `tests/unit/onboarding-modal.test.ts` - Updated test for new `StarterHabitChoice` structure

## Changes Summary

### 1. `StarterHabitChoice` Union Type (wizard.ts)
- `AgeStarterHabitChoice`: `source: 'age'`, `templateIndex`, `selected`, `requiresApproval`
- `DailyStarterHabitChoice`: `source: 'daily'`, `templateId`, `selected`, `requiresApproval`
- Type guards: `isAgeStarterHabitChoice`, `isDailyStarterHabitChoice`
- Existing behavior for `source: 'age'` preserved exactly

### 2. HabitsStep Radio/Select Source (HabitsStep.tsx)
- Only shows when `defaultExperienceFlags.dailyLivingHabits && language === 'vi'`
- Radio group with aria labels for accessibility
- "Bắt đầu với sinh hoạt hằng ngày" → shows DLS-01 set (2 items: WIT-DLY-01, WIT-DLY-03)
- "Theo khung phát triển theo tuổi" → shows age-adapted habits (6 items)
- Respects `newHabitLimit(childAge)` — defaults tick first N items
- Soft warning when exceeding limit (no blocking)
- Switching back to age preserves previous age selections

### 3. Wizard Completion (OnboardingWizard.tsx)
- Daily source habits created via `toHabitActivity` from lane C
- Uses `familyId` from store, `childId` from newly created profile
- `legacyTemplateId` set to template ID (e.g., "WIT-DLY-01")
- Age source habits use existing `starterHabits` path via `createProfile` options

### 4. Copy Keys Added (onboarding-wizard-copy.ts)
All 9 locales get:
- `habits.dailyOptionLabel` / `habits.dailyOptionExplain`
- `habits.ageOptionLabel` / `habits.ageOptionExplain`

## Test Commands Run & Results

```bash
npm run lint
# Passed (0 errors, 0 warnings)

npm run typecheck
# Passed (0 errors)

npx vitest run tests/unit/onboarding-wizard.test.ts
# 58 tests passed

npx vitest run tests/unit/onboarding-modal.test.ts
# 15 tests passed

npx vitest run tests/unit/onboarding-wizard-copy.test.ts
# 12 tests passed

npx vitest run tests/unit/daily-living-habits
# 41 tests passed
```

## Points of Uncertainty / Future Work

1. **ConfirmStep.tsx** - Not modified as it doesn't create activities; creation happens in OnboardingWizard.tsx after profile creation. Need to verify this matches expected flow.

2. **Integration with ConfirmStep** - The `submitOnboarding` function in `src/lib/onboarding/submit.ts` only handles age-source habits via `selectedStarterHabits`. Daily habits are created separately in OnboardingWizard.tsx after the profile is created. This is the intended design per contracts.md.

3. **Multi-language support** - MVP only activates for `language === 'vi'` per contract. Other locales only see age-based habits.

4. **Switching source behavior** - When switching from daily back to age, the age habits are preserved with their previous selection state. When switching from age to daily, new daily habits are created fresh (no previous state to restore). This matches the contract requirement: "Quay lại lựa chọn theo tuổi giữ nguyên lựa chọn cũ."

5. **Test coverage** - Added comprehensive tests for:
   - `initialDailyHabitSelection` with different ages/limits
   - `selectedDailyStarterHabits` returning only daily habits
   - `selectedStarterHabits` filtering out daily habits
   - `estimateDailyStars` working with mixed sources
   - `withAge` preserving daily habits when stage/limit same, resetting age when different