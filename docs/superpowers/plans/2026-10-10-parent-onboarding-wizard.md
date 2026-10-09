# Parent Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the one-form `OnboardingModal` with a 5-step wizard (child → habits → rewards → confirm & trial → hand the app to the child) where every step sets something up and explains its role.

**Architecture:** Pure logic in `src/lib/onboarding/` (draft, selection, estimates, submit sequence) is unit-tested without React. Five presentational step components under `src/components/onboarding/` render the draft; `OnboardingWizard` owns state and calls `submitOnboarding`; `OnboardingModal` keeps its export and props and only wraps the wizard in `ModalShell`. The store gains one optional `createProfile` option; no server or migration change.

**Tech Stack:** Next.js (read `node_modules/next/dist/docs/` before touching app code — see AGENTS.md), React client components, TypeScript, Tailwind, Vitest (node env, no DOM library), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-10-parent-onboarding-wizard-design.md`

## Global Constraints

- `OnboardingModal({ isOpen, onClose })` keeps its export and props; `src/app/page.tsx` and `src/components/StartTrialEntry.tsx` are not modified.
- No Supabase migration, no new API route, no new npm dependency (`qrcode` already present).
- Consent request body stays exactly `{ policyVersion: '2026-09-19', childDataConsent: true }` to `POST /api/privacy/consent`.
- New profile fields stay as today: `points: 20, totalEarned: 20, level: 1, streak: 1, showRealNameOnLeaderboard: false, isPublicOnLeaderboard: false`, nickname fallback `` `${copy.nicknamePrefix} ${lastWordOfName}` ``, `birthYear = currentYear - age`.
- Data is saved only by the step-4 button; steps 1–3 have Back; step 4 and 5 have no Back.
- Every user-visible string comes from `src/lib/i18n/onboarding-wizard-copy.ts` (or existing onboarding copy files), all 9 languages: `vi en zh ja ko fr de it es`.
- Tap targets ≥ 44px (`min-h-11`), matching existing modal styles.
- Lint (`--max-warnings=0`) and `tsc --noEmit` must pass after every task.

## Review Focus

1. Parent changes age after unticking habits → selection resets to the new stage's defaults (no stale `templateIndex` from another stage). Test in Task 1.
2. Parent clears or types `0`/`-5`/`2.5` into a reward cost → Next is disabled on step 3, never saves a non-positive or fractional cost. Test in Task 1.
3. Step-4 retry after a `createProfile` failure → same `requestId` reused, consent/trial not double-charged in a way that breaks (trial already active is treated as success via `isPro` re-read). Test in Task 4.
4. Rewards fail but profile succeeded → wizard reaches step 5 with the rewards-failed note, never stays stuck on step 4. Test in Task 4.
5. Demo / signed-out session → no consent or trial request, step 5 offers only "shared device". Test in Task 4 (no requests) and Task 5 (option hidden).

---

### Task 1: Wizard logic (`src/lib/onboarding/wizard.ts`)

**Files:**
- Create: `src/lib/onboarding/wizard.ts`
- Test: `tests/unit/onboarding-wizard.test.ts`

**Interfaces:**
- Consumes: `generateAgeAdaptedHabits(childId, stage)`, `getStageFromAge(age)` from `@/lib/wit-framework`; `newHabitLimit(ageYears)` from `@/lib/habit-programs/config`; `MEANINGFUL_REWARD_TEMPLATES` from `@/lib/reward-templates`.
- Produces:
  ```ts
  export type WizardStep = 1 | 2 | 3 | 4 | 5;
  export type OnboardingRewardId = 'experience-bedtime-story' | 'experience-meal-choice' | 'experience-parent-time';
  export const ONBOARDING_REWARD_IDS: readonly OnboardingRewardId[]; // in that order
  export type StarterHabitChoice = { readonly templateIndex: number; readonly selected: boolean; readonly requiresApproval: boolean };
  export type RewardChoice = { readonly id: OnboardingRewardId; readonly selected: boolean; readonly costPoints: number };
  export type WizardDraft = {
    readonly childName: string; readonly childNickname: string; readonly childAge: number;
    readonly childAvatar: string; readonly childThemeColor: string;
    readonly habits: readonly StarterHabitChoice[]; readonly rewards: readonly RewardChoice[];
    readonly hasConsent: boolean;
  };
  export function createInitialDraft(): WizardDraft;            // age 5, 'mascot:leo', '#F59E0B', habits = initialHabitSelection(5), rewards = initialRewardSelection(), consent false
  export function initialHabitSelection(age: number): StarterHabitChoice[];
  export function initialRewardSelection(): RewardChoice[];      // 3 entries, only first selected, costs 25 / 35 / 40 from templates
  export function withAge(draft: WizardDraft, age: number): WizardDraft; // sets childAge AND resets habits = initialHabitSelection(age)
  export function selectedStarterHabits(draft: WizardDraft): Array<{ templateIndex: number; requiresApproval: boolean }>;
  export function estimateDailyStars(draft: WizardDraft): number; // sum of template `points` of selected habits for the draft's stage
  export function daysToReward(costPoints: number, dailyStars: number): number | null; // null when dailyStars <= 0, else Math.ceil(cost / daily)
  export function isParentRoleStage(age: number): boolean;      // true when getStageFromAge(age) === '0-3'
  export function canAdvance(step: WizardStep, draft: WizardDraft): boolean;
  ```

- [ ] **Step 1: Write the failing tests** in `tests/unit/onboarding-wizard.test.ts`:
  - `initialHabitSelection` returns 6 entries for ages 2, 4, 8, 16, and the count of `selected` is 1, 2, 3, 4 respectively; the selected ones are indexes `0..N-1`; every `requiresApproval` equals `generateAgeAdaptedHabits(null, stage)[i].requiresApproval`.
  - `withAge(draftWithAllHabitsUnticked, 8)` → `childAge === 8` and habits equal `initialHabitSelection(8)`.
  - `initialRewardSelection()` → ids in `ONBOARDING_REWARD_IDS` order, costs `[25, 35, 40]`, `selected` `[true, false, false]`.
  - `estimateDailyStars` of a draft with no selected habit → `0`; with selections → sum of the selected templates' `points`.
  - `daysToReward(40, 0)` → `null`; `daysToReward(40, 30)` → `2`; `daysToReward(30, 30)` → `1`.
  - `canAdvance(1, …)`: false for `''` and `'   '`, true for `'An'`. `canAdvance(2, …)` true even with no habit selected. `canAdvance(3, …)` false when any **selected** reward cost is `0`, `-5`, `2.5` or `NaN`; true when the only invalid cost is on an unselected reward; true when no reward selected. `canAdvance(4, …)` equals `hasConsent`. `canAdvance(5, …)` true.
- [ ] **Step 2: Run** `npx vitest run tests/unit/onboarding-wizard.test.ts` — expect FAIL (module not found).
- [ ] **Step 3: Implement** the interface above in `src/lib/onboarding/wizard.ts`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/onboarding-wizard.test.ts && npm run typecheck && npx eslint src/lib/onboarding tests/unit/onboarding-wizard.test.ts --max-warnings=0` — expect PASS.
- [ ] **Step 5: Commit** `feat(onboarding): wizard draft and selection logic`.

### Task 2: `createProfile` accepts chosen starter habits

**Files:**
- Modify: `src/lib/store/profile-actions.ts` (type + `createProfile` around lines 129–138)
- Modify: `src/lib/store.tsx` (`AppStore.createProfile` type ~line 162, wrapper ~line 989)
- Test: `tests/unit/profile-actions.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // profile-actions.ts
  export type CreateProfileOptions = {
    readonly starterHabits?: ReadonlyArray<{ readonly templateIndex: number; readonly requiresApproval: boolean }>;
  };
  createProfile(profile: NewProfile, requestId?: string, options?: CreateProfileOptions): Promise<ProfileCreateResult>
  // store.tsx AppStore: same third parameter, forwarded unchanged.
  ```
  Semantics: `options.starterHabits` defined → starters are exactly `generateAgeAdaptedHabits(id, ageStage)[templateIndex]` for each entry, in the given order, with `requiresApproval` overridden; an empty array means no starters; out-of-range indexes are ignored; requires `profile.ageStage` (none if absent). `options.starterHabits` undefined → current behaviour unchanged.

- [ ] **Step 1: Write failing tests** in `tests/unit/profile-actions.test.ts`, reusing the existing cloud-mutation setup (`requestProfileMutation` mock):
  - `'sends only the chosen starter habits with overridden approval'`: `createProfile({ ...baseProfile, ageStage: '3-6' }, 'req-1', { starterHabits: [{ templateIndex: 3, requiresApproval: true }, { templateIndex: 0, requiresApproval: false }] })` → mutation `starterActivities` has length 2; titles equal templates `[3]` then `[0]` of `generateAgeAdaptedHabits(null, '3-6')`; `requiresApproval` `[true, false]`.
  - `'sends no starter habits for an empty selection'`: `starterHabits: []` → `starterActivities` `[]`.
  - `'ignores out-of-range template indexes'`: `[{ templateIndex: 99, requiresApproval: true }]` → `[]`.
  - Existing test `'sends profile and starter activities in one cloud mutation'` stays green (no options → full bundle).
- [ ] **Step 2: Run** `npx vitest run tests/unit/profile-actions.test.ts` — expect the 3 new tests FAIL.
- [ ] **Step 3: Implement** the option in `profile-actions.ts` and thread it through `store.tsx`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/profile-actions.test.ts && npm run typecheck` — expect PASS.
- [ ] **Step 5: Commit** `feat(store): let createProfile take a chosen starter habit list`.

### Task 3: Wizard copy in 9 languages

**Files:**
- Create: `src/lib/i18n/onboarding-wizard-copy.ts`
- Test: `tests/unit/onboarding-wizard-copy.test.ts`

**Interfaces:**
- Consumes: `OnboardingRewardId` from `@/lib/onboarding/wizard` (Task 1). If Task 1 is not merged yet, declare the same union locally and switch to the import when merging.
- Produces: `export function getOnboardingWizardCopy(language: Language): OnboardingWizardCopy` with exactly this shape (follow the `Record<Language, …>` + getter pattern of `onboarding-extra-copy.ts`):
  ```ts
  export type OnboardingWizardCopy = {
    readonly stepOf: (step: number, total: number) => string;
    readonly next: string; readonly back: string;
    readonly child: { readonly title: string; readonly explain: string; readonly mascotLabel: string };
    readonly habits: {
      readonly title: string; readonly explain: string;
      readonly counter: (selected: number, recommended: number) => string;
      readonly overLimit: string; readonly none: string; readonly parentRole: string; readonly approval: string;
    };
    readonly rewards: {
      readonly title: string; readonly explain: string; readonly flow: string;
      readonly estimate: (dailyStars: number, cost: number, days: number) => string;
      readonly costLabel: string; readonly later: string; readonly invalidCost: string;
    };
    readonly confirm: { readonly title: string; readonly summary: (name: string, age: number, habits: number, rewards: number) => string };
    readonly handoff: {
      readonly title: string; readonly ownDevice: string; readonly sharedDevice: string;
      readonly ownDeviceSteps: readonly [string, string, string];
      readonly codeLabel: string; readonly codeError: string;
      readonly pinExplain: string; readonly pinLabel: string; readonly setPinAndOpen: string; readonly skipPin: string;
      readonly pinError: string; readonly openKid: string;
      readonly rewardsFailed: string; readonly finalExplain: string; readonly toDashboard: string;
    };
    readonly rewardTitles: Record<OnboardingRewardId, { readonly title: string; readonly description: string }>;
  };
  ```
  **Vietnamese values (verbatim):**
  - `stepOf`: `` (s, t) => `Bước ${s}/${t}` ``; `next` `Tiếp tục`; `back` `Quay lại`
  - `child.title` `Bé của bạn`; `child.explain` `Tuổi quyết định giao diện con thấy và các thói quen được gợi ý.`; `child.mascotLabel` `Linh vật đồng hành của bé`
  - `habits.title` `Thói quen đầu tiên`; `habits.explain` `Con chạm Xong → được sao. Việc có Ba mẹ duyệt thì sao chỉ cộng sau khi ba mẹ xác nhận. Ít thói quen một lúc giúp con dễ thành nếp hơn.`; `counter` `` (n, r) => `Đã chọn ${n} · khuyến nghị ${r}` ``; `overLimit` `Bạn đang chọn nhiều hơn mức khuyến nghị. Vẫn được, nhưng con có thể khó giữ nhịp.`; `none` `Ba mẹ có thể thêm thói quen sau ở Thiết kế.`; `parentRole` `Ở tuổi này con học bằng cách nhìn ba mẹ. Đây là những việc ba mẹ làm gương mỗi ngày.`; `approval` `Ba mẹ duyệt`
  - `rewards.title` `Quà để đổi sao`; `rewards.explain` `Sao con kiếm được dùng để đổi quà ba mẹ đặt ra.`; `flow` `Con xin đổi quà → ba mẹ duyệt → trao quà. Nếu ba mẹ từ chối, con được hoàn sao.`; `estimate` `` (s, c, d) => `Con kiếm khoảng ${s} sao/ngày → quà ${c} sao ≈ ${d} ngày cố gắng.` ``; `costLabel` `Giá (sao)`; `later` `Để sau`; `invalidCost` `Giá sao phải là số nguyên lớn hơn 0.`
  - `confirm.title` `Xác nhận & bắt đầu`; `summary` `` (name, age, h, r) => `${name}, ${age} tuổi · ${h} thói quen · ${r} quà` ``
  - `handoff.title` `Đưa app cho bé`; `ownDevice` `Máy riêng của bé`; `sharedDevice` `Dùng chung máy này`; `ownDeviceSteps` `['Mở app trên máy của bé.', 'Chọn “Đây là thiết bị của bé?”.', 'Quét mã QR hoặc nhập mã bên dưới.']`; `codeLabel` `Mã kết nối của bé`; `codeError` `Chưa lấy được mã. Ba mẹ lấy mã ở Gia đình → Hồ sơ các con.`; `pinExplain` `PIN 4 số giữ khu phụ huynh khỏi tay bé.`; `pinLabel` `PIN phụ huynh (4 số)`; `setPinAndOpen` `Đặt PIN & mở màn hình của bé`; `skipPin` `Bỏ qua, mở màn hình của bé`; `pinError` `PIN cần đúng 4 chữ số.`; `openKid` `Mở màn hình của bé`; `rewardsFailed` `Chưa thêm được quà, ba mẹ thêm lại ở Thiết kế → Đổi quà.`; `finalExplain` `Ba mẹ xem tiến độ và duyệt ở Hôm nay → Duyệt việc. Nhấn ? cạnh mỗi mục để đọc hướng dẫn.`; `toDashboard` `Vào bảng phụ huynh`
  - `rewardTitles`: bedtime-story / meal-choice / parent-time = titles and descriptions copied verbatim from `MEANINGFUL_REWARD_TEMPLATES`.
  
  **English** is a faithful translation in the tone of `onboarding-extra-copy.ts` (e.g. `Step ${s} of ${t}`, `Next`, `Back`, `Parent approves`, `Hand the app to your child`). The other 7 languages translate the English; keep `?` and `→` as-is.

- [ ] **Step 1: Write failing test** `tests/unit/onboarding-wizard-copy.test.ts`: for every language in `['vi','en','zh','ja','ko','fr','de','it','es']`, every string leaf is non-empty, `ownDeviceSteps.length === 3`, all three `rewardTitles` exist, `stepOf(2, 5)` contains `2` and `5`, `estimate(30, 40, 2)` contains `30`, `40` and `2`; `vi` values equal the verbatim strings above for `next`, `habits.approval`, `handoff.toDashboard`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/onboarding-wizard-copy.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** the copy file.
- [ ] **Step 4: Run** the test + `npm run typecheck` — expect PASS.
- [ ] **Step 5: Commit** `feat(i18n): onboarding wizard copy in nine languages`.

### Task 4: Submit sequence (`src/lib/onboarding/submit.ts`)

Depends on Tasks 1, 2, 3.

**Files:**
- Create: `src/lib/onboarding/submit.ts`
- Rewrite: `tests/unit/onboarding-modal.test.ts` (old form-tree tests are replaced; the file now tests `submitOnboarding`)

**Interfaces:**
- Consumes: `WizardDraft`, `selectedStarterHabits` (Task 1); `CreateProfileOptions` and the 3-arg `createProfile` (Task 2); `getOnboardingWizardCopy(language).rewardTitles` (Task 3); `getStageFromAge`; `getOnboardingCopy(language).nicknamePrefix`; `getOnboardingExtraCopy(language).trialFailed`; `getProfileMutationCopy(language).privacyError`; `getProfileMutationError(language, result)`; `MEANINGFUL_REWARD_TEMPLATES` (icon).
- Produces:
  ```ts
  export type SubmitDeps = {
    readonly language: Language;
    readonly requestId: string;          // created once per wizard
    readonly signedIn: boolean;          // Boolean(currentUser)
    readonly isPro: boolean;
    readonly fetcher: typeof fetch;
    readonly activateFreeTrial: () => Promise<{ readonly success: boolean }>;
    readonly createProfile: (profile: Omit<ChildProfile, 'id' | 'createdAt'>, requestId?: string, options?: CreateProfileOptions) => Promise<ProfileCreateResult>;
    readonly createReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => Promise<boolean>;
  };
  export type SubmitResult =
    | { readonly ok: true; readonly profileId: string; readonly rewardsFailed: boolean }
    | { readonly ok: false; readonly message: string };
  export async function submitOnboarding(draft: WizardDraft, deps: SubmitDeps): Promise<SubmitResult>;
  ```
  Order: consent (signed in only) → trial (signed in and `!isPro`) → `createProfile(profile, requestId, { starterHabits: selectedStarterHabits(draft) })` with `ageStage: getStageFromAge(draft.childAge)` → `createReward` for each selected reward sequentially (`title`/`description` from wizard copy, `icon` from template, `costPoints` from draft, `stock: -1`, `isActive: true`). Error messages mirror today's `OnboardingModal`: consent non-OK or throw → `privacyError`; trial failure or throw → `trialFailed`; profile `success:false` → `getProfileMutationError`; profile throw → generic `getProfileMutationError(language, { success: false, code: 'profile_mutation_failed' })`. `createReward` returning `false` or throwing sets `rewardsFailed: true` and continues.

- [ ] **Step 1: Write failing tests** (`describe('submitOnboarding')`, mocked deps, `vi.fn` fetcher):
  - `'runs consent, trial, profile, rewards in order'`: record call order → `['consent','trial','profile','reward']`; consent called with `'/api/privacy/consent'` and body `JSON.stringify({ policyVersion: '2026-09-19', childDataConsent: true })`; profile called with `objectContaining({ name: 'Minh An', nickname: 'Bé An', age: 5, avatar: 'mascot:leo', ageStage: '3-6', isPublicOnLeaderboard: false })`, `'req-1'`, `{ starterHabits: [{ templateIndex: 0, … }, { templateIndex: 1, … }] }`; reward called with `objectContaining({ costPoints: 25, stock: -1, isActive: true, title: getOnboardingWizardCopy('vi').rewardTitles['experience-bedtime-story'].title })`; result `{ ok: true, profileId, rewardsFailed: false }`.
  - `'skips the trial for a Pro family'` and `'skips consent and trial when signed out'` (no fetcher, no trial call; profile still created).
  - `'stops on consent failure'` (non-OK `Response` and rejected fetch) → `{ ok:false, message: privacyError }`, no trial/profile calls.
  - `'stops on trial failure'` → `trialFailed`, no profile call.
  - `'reports the profile error and keeps the request id for retry'`: first `createProfile` → `{ success:false, code:'profile_mutation_failed' }` → `ok:false`; second call succeeds; both calls used `'req-1'`.
  - `'continues when a reward fails'`: `createReward` returns `false` for the first and throws for the second of two selected → `{ ok:true, rewardsFailed:true }`, both attempted.
  - `'creates no reward when none selected'`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/onboarding-modal.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** `submitOnboarding`.
- [ ] **Step 4: Run** the test + `npm run typecheck` — expect PASS.
- [ ] **Step 5: Commit** `feat(onboarding): submit sequence with non-blocking rewards`.

### Task 5: Wizard UI and modal shell

Depends on Tasks 1–4.

**Files:**
- Create: `src/components/onboarding/OnboardingWizard.tsx`, `ChildStep.tsx`, `HabitsStep.tsx`, `RewardsStep.tsx`, `ConfirmStep.tsx`, `HandoffStep.tsx`
- Modify: `src/components/OnboardingModal.tsx` (shrink to `ModalShell` + header with title/close + `<OnboardingWizard onClose={onClose} />`; keep `label={copy.dialogLabel}`, `maxWidth="2xl"`, close button `aria-label={copy.close}` with `min-w-11 min-h-11 … focus-visible:ring-2`)

**Interfaces:**
- Consumes: everything from Tasks 1, 3, 4; store fields `currentUser, isPro, activateFreeTrial, createProfile, createReward, parentPinConfigured, updateParentPin, setActiveChildId, setMode`; `readPairingCredential(childId)` from `@/lib/store/pairing-client` (returns `{ code, qrPayload } | null`); `QRCode.toDataURL(payload, { width: 320, margin: 1 })`; `MASCOTS`, `getMascotLabel`, `MascotAvatar`; existing `getOnboardingCopy` (stage card, habit titles via `stages[stage].habitTitles[i]`, consent text, labels) and `getOnboardingExtraCopy` (legal line, `startTrial`, guide link).
- Produces (props):
  ```ts
  type StepProps = { readonly draft: WizardDraft; readonly onChange: (draft: WizardDraft) => void };
  ChildStep(props: StepProps & { readonly nameError: string | null; readonly nameRef: RefObject<HTMLInputElement | null> })
  HabitsStep(props: StepProps)
  RewardsStep(props: StepProps)
  ConfirmStep(props: StepProps & { readonly error: string | null })
  HandoffStep(props: { readonly childId: string; readonly rewardsFailed: boolean; readonly onFinish: () => void })
  OnboardingWizard(props: { readonly onClose: () => void })
  ```
- Keep the existing DOM ids `onboarding-child-name`, `onboarding-child-nickname`, `onboarding-child-age` (e2e relies on them).

Behaviour to implement (spec "Luồng" section is authoritative):
- Wizard: `useState` for `draft` (`createInitialDraft`), `step`, `requestId` (`crypto.randomUUID()` once), `submitting`, `error`, `result`. Header shows `stepOf(step, 5)` in an `aria-live="polite"` region; on step change focus the step heading (`tabIndex={-1}`). Back on steps 2–3 (and 4 before submit) — never after a successful submit. Next disabled when `!canAdvance(step, draft)`, except step 1 where pressing Next with an empty name shows `childNameRequired` under the input (`role="alert"`, `aria-invalid`, `aria-describedby`) and focuses it. Step-4 button label: `extra.startTrial` when signed in and not Pro, otherwise `copy.complete`; while submitting `copy.saving` and disabled. On `ok:true` → `sounds.playLevelUp()` and go to step 5.
- ChildStep: name, nickname, age range 0–18 using `withAge`, stage card (always visible, no `<details>`), mascot buttons with `aria-pressed`, `child.explain`.
- HabitsStep: list the 6 templates of the current stage with checkbox + "Ba mẹ duyệt" switch (hidden when `isParentRoleStage(age)`, which instead shows `habits.parentRole`); counter; `overLimit` when selected > `newHabitLimit(age)`; `none` when 0 selected.
- RewardsStep: 3 rewards with checkbox and number input (`min=1 step=1`, `invalidCost` on invalid selected cost), `later` button deselects all; `estimate` only when `daysToReward(...) !== null` for the cheapest selected reward; always show `flow`.
- ConfirmStep: `summary`, existing consent checkbox text, legal line with privacy/terms links (copy current markup), guide link, error `role="alert"`.
- HandoffStep: two choice buttons; `ownDevice` only when signed in. Own device: load `readPairingCredential(childId)` once, show code + QR image (`alt={codeLabel}`), on null/throw show `codeError`. Shared: if `parentPinConfigured !== true` show 4-digit `inputMode="numeric"` PIN input, `setPinAndOpen` (validates `/^\d{4}$/`, calls `updateParentPin({ newPin })`, shows `pinError` unless `status === 'updated'`) and `skipPin`; otherwise just `openKid`. Opening kid mode = `setActiveChildId(childId); setMode('kid'); onFinish()`. Show `rewardsFailed` when flagged, `finalExplain`, and `toDashboard` → `onFinish()`.

- [ ] **Step 1: Read** `node_modules/next/dist/docs/` entries relevant to client components and `next/link`; confirm nothing used here is deprecated.
- [ ] **Step 2: Implement** the six components and shrink `OnboardingModal.tsx`.
- [ ] **Step 3: Run** `npm run lint && npm run typecheck && npm run test` — expect PASS.
- [ ] **Step 4: Manually verify** with `npm run dev`: walk steps 1→5 in demo (`/?demo=1` then open setup) at 375px and 1280px; check focus moves to each step heading and that Esc closes on step 1.
- [ ] **Step 5: Commit** `feat(onboarding): five-step parent setup wizard`.

### Task 6: E2E, accessibility and user guide

Depends on Task 5.

**Files:**
- Modify: `tests/e2e/single-signup-profile.spec.ts` (replace test `'onboarding only creates a child and keeps extra customization collapsed'`)
- Modify: `docs/huong-dan/01-bat-dau.md` (section `<a id="thiet-lap">` "Tạo hồ sơ bé đầu tiên"), `docs/huong-dan/i18n/en/01-bat-dau.md` ("Create your first child profile")
- Regenerate: `public/guide/*.json` via `npm run guide:build`

- [ ] **Step 1: Write e2e tests** using `installCloudFamilyFixture(page, baseURL, { profiles: [], subscription: freePlan })` and `page.goto('/start')`:
  - `'onboarding wizard opens on step 1 with defaults'`: dialog shows `Bước 1/5`; `#onboarding-child-age` value `5`; Leo `aria-pressed="true"`; no `/api/account/profile` request.
  - `'onboarding wizard recommends habits by age'`: fill name, Next → `Đã chọn 2 · khuyến nghị 2`; Back, set age to 8, Next → `Đã chọn 3 · khuyến nghị 3`.
  - `'onboarding wizard ends in the child screen on a shared device'`: complete steps (route `/api/privacy/consent`, trial and profile mutation endpoints to succeed — reuse fixture helpers if they already do), on step 5 choose `Dùng chung máy này` → `Bỏ qua, mở màn hình của bé` → `page.getByTestId('app-surface')` has `data-app-mode="kid"`.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/single-signup-profile.spec.ts` — expect PASS (fix the UI, not the test, if a spec behaviour is missing).
- [ ] **Step 3: Run** `npm run test:a11y` — expect PASS.
- [ ] **Step 4: Update the guide** sections to describe the 5 steps (what each sets up and why), keep anchors `thiet-lap` unchanged; run `npm run guide:build` then `npm run guide:check` — expect PASS.
- [ ] **Step 5: Commit** `test(onboarding): wizard e2e and guide update`.

### Task 7: Branch verification

- [ ] Run `npm run lint && npm run typecheck && npm run test && npm run guide:check && npm run build` — all PASS.
- [ ] Whole-branch review against the spec (fresh reviewer), fix findings, re-run the failing check only.
