# KidHabit Experience Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a brighter, more readable KidHabit experience with reliable mobile dialogs, correct payOS details, persistent child QR pairing, useful task details, completion feedback, and public user documentation.

**Architecture:** Deliver seven independently testable slices. UI primitives land before their consumers; persistent pairing and task instructions use additive database migrations; payment keeps the existing server-verified entitlement path; the final slice performs complete browser and production-candidate verification.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, Playwright, PostgreSQL migrations, Cloudflare Workers/OpenNext, payOS REST API, `qrcode`, and lazy-loaded `qr-scanner`.

**Spec:** `plans/260921-2005-experience-refresh/design.md`

## Global Constraints

- New visitors default to light mode even when the operating system is dark.
- Theme choices are exactly `light`, `dark`, and `system`, and persist locally.
- Essential user-facing secondary text is at least 13px; normal body text targets 15–17px; touch controls are at least 44px.
- Product copy uses plain customer language and must not expose vendor, database, tenancy, RLS, or backend terminology.
- payOS account holder, account number, BIN, amount, description, QR payload, and checkout URL come from the provider response; the app must not invent a bank name.
- Pairing credentials are scoped to one child, stored only as hashes, rate-limited, rotatable, and never logged.
- Existing connected child devices remain valid after the pairing QR is refreshed.
- Camera access is requested only after a user action and always has manual-entry fallback.
- All dialogs use a shared body-level portal, internal scrolling, safe-area padding, focus containment, and body scroll locking.
- Completion feedback respects `prefers-reduced-motion` and never leaves a false completed state after a failed save.
- Existing brand colors, navigation structure, and verified payment entitlement path are preserved.

## Review Focus

- Dark operating-system preference with no saved app preference must still produce a light first paint; Task 1 pins this in Playwright.
- A 375px viewport opened after scrolling far down the page must keep every dialog inside the viewport; Task 2 pins this with bounding-box assertions.
- A rotated QR/manual code must fail while previously connected device sessions continue loading; Task 3 pins both database and API behavior.
- A payOS success response with valid account fields but no human-readable bank name must render BIN without fabricated text; Task 4 pins the response contract and UI.
- A completion API failure after optimistic interaction must restore the incomplete card and remove the point-burst feedback; Task 5 pins rollback behavior.

---

### Task 1: Light-default appearance, readable type, and plain-language copy

**Files:**
- Modify: `src/lib/appearance-context.tsx`
- Create: `src/components/ThemeSelector.tsx`
- Modify: `src/components/FontSettingsModal.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/ParentSettingsTab.tsx`
- Modify: `src/lib/i18n/translations.ts`
- Modify: `src/lib/i18n/parent-settings-copy.ts`
- Modify: `src/lib/i18n/locales/*.ts`
- Create: `tests/unit/appearance-preference.test.ts`
- Create: `tests/e2e/appearance.spec.ts`
- Modify: `DESIGN.md`

**Interfaces:**
- Produces: `ThemeChoice = 'light' | 'dark' | 'system'` and `useAppearance().theme`, `resolvedTheme`, `setTheme`.
- Produces: `<ThemeSelector compact?: boolean />` for header and settings.
- Consumes: existing font-family and font-size preference APIs.

- [ ] **Step 1: Add failing preference tests**

Create `tests/unit/appearance-preference.test.ts` around exported pure helpers:

```ts
import { describe, expect, it } from 'vitest';
import { resolveThemeChoice } from '@/lib/appearance-context';

describe('appearance preference', () => {
  it('defaults a new visitor to light even when the OS is dark', () => {
    expect(resolveThemeChoice(null, true)).toEqual({ choice: 'light', resolved: 'light' });
  });

  it('resolves the explicit system choice from the media query', () => {
    expect(resolveThemeChoice('system', true).resolved).toBe('dark');
    expect(resolveThemeChoice('system', false).resolved).toBe('light');
  });
});
```

- [ ] **Step 2: Verify the unit test fails**

Run: `npm test -- --run tests/unit/appearance-preference.test.ts`

Expected: FAIL because `resolveThemeChoice` is not exported.

- [ ] **Step 3: Implement theme state and first-paint behavior**

Add the following public contract in `appearance-context.tsx`:

```ts
export type ThemeChoice = 'light' | 'dark' | 'system';
export function resolveThemeChoice(saved: string | null, prefersDark: boolean): {
  choice: ThemeChoice;
  resolved: 'light' | 'dark';
};
```

Use storage key `kidhabit_theme`. Missing or invalid values resolve to `{ choice: 'light', resolved: 'light' }`. `system` alone follows `matchMedia('(prefers-color-scheme: dark)')`. Set the root class and `color-scheme` property from one `applyResolvedTheme` helper.

Add a small inline script in `layout.tsx` before application content that reads the same key and applies `dark` only for saved `dark`, or saved `system` plus a dark media match. The no-storage branch must remove `dark`.

Replace the `@media (prefers-color-scheme: dark)` root override with class-driven dark values:

```css
:root { color-scheme: light; }
html.dark { --background: #09090b; --foreground: #f4f4f5; color-scheme: dark; }
```

- [ ] **Step 4: Add the selector and typography floor**

Implement `ThemeSelector` as a three-option segmented control with Sun, Moon, and Monitor icons, `aria-pressed`, and translated labels. Mount compact controls in the header menu and full controls in parent settings.

Keep the existing font choices, set `large` as the default, and replace essential `text-[10px]`/`text-[11px]` copy in header, settings, checkout, child cards, task cards, and modals with `text-xs` or `text-sm`. Badge-only metadata may stay compact if it is not required to complete a task.

- [ ] **Step 5: Remove technical product language**

Replace visible strings such as “Supabase”, “backend”, “RLS”, raw user IDs, and provider-specific database wording with “đồng bộ đám mây”, “tài khoản gia đình”, “kết nối an toàn”, and “thiết bị đã kết nối”. Keep implementation names in maintainer code and docs.

- [ ] **Step 6: Add and run browser tests**

In `tests/e2e/appearance.spec.ts`, create a dark-emulated context with empty storage and assert `document.documentElement.classList.contains('dark') === false`; then choose System and assert it becomes true; reload and assert the choice persists. Assert key body and secondary-copy computed font sizes are at least 15px and 13px respectively.

Run:

```bash
npm test -- --run tests/unit/appearance-preference.test.ts
npx playwright test tests/e2e/appearance.spec.ts --project=chromium
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 7: Commit this slice**

```bash
git add DESIGN.md src/app/layout.tsx src/app/globals.css src/lib/appearance-context.tsx src/components/ThemeSelector.tsx src/components/FontSettingsModal.tsx src/components/Header.tsx src/components/ParentSettingsTab.tsx src/lib/i18n tests/unit/appearance-preference.test.ts tests/e2e/appearance.spec.ts
git commit -m "feat: add light-default appearance controls"
```

---

### Task 2: Shared portal modal that stays inside the mobile viewport

**Files:**
- Create: `src/components/ui/ModalShell.tsx`
- Modify: `src/lib/use-modal-focus.ts`
- Modify: `src/components/CheckoutModal.tsx`
- Modify: `src/components/PricingModal.tsx`
- Modify: `src/components/DeviceConnectModal.tsx`
- Modify: `src/components/HabitTimerModal.tsx`
- Modify: `src/components/Portrait16Modal.tsx`
- Modify: `src/components/OnboardingModal.tsx`
- Modify: `src/components/FontSettingsModal.tsx`
- Modify: `src/components/AvatarPickerModal.tsx`
- Modify: `src/components/CreateGroupModal.tsx`
- Modify: `src/components/JoinGroupModal.tsx`
- Modify: `src/components/ParentJourneysTab.tsx`
- Modify: `src/components/ParentRewardsTab.tsx`
- Modify: `src/components/PinModal.tsx`
- Modify: `src/components/ParentDashboard.tsx`
- Create: `tests/e2e/mobile-dialogs.spec.ts`

**Interfaces:**
- Produces: `<ModalShell isOpen onClose label maxWidth mobileSheet>{children}</ModalShell>`.
- Consumes: `useModalFocus` for keyboard focus semantics.

- [ ] **Step 1: Write the mobile-position regression test**

Open a demo session at a 375×812 viewport, scroll near the bottom, open the task timer and pricing dialogs, and assert for each visible dialog:

```ts
const box = await dialog.boundingBox();
expect(box).not.toBeNull();
expect(box!.y).toBeGreaterThanOrEqual(0);
expect(box!.y + box!.height).toBeLessThanOrEqual(812);
await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
```

Also tab through the dialog, press Escape, and assert focus returns to the trigger.

- [ ] **Step 2: Verify the current implementation fails after deep scrolling**

Run: `npx playwright test tests/e2e/mobile-dialogs.spec.ts --project=mobile-chromium`

Expected: at least one inline dialog violates viewport/focus/body-lock expectations.

- [ ] **Step 3: Implement `ModalShell`**

Use `createPortal(..., document.body)`, render only after mount, lock and restore `document.body.style.overflow`, and use this root geometry:

```tsx
<div className="fixed inset-0 z-50 grid min-h-dvh place-items-end overflow-hidden bg-slate-950/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
  <section className="flex max-h-[calc(100dvh-env(safe-area-inset-top))] w-full flex-col overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl dark:bg-zinc-900 sm:max-h-[90dvh] sm:rounded-3xl">
    {children}
  </section>
</div>
```

The shell owns `role="dialog"`, `aria-modal`, accessible label, overlay close behavior, focus trap, Escape handling, and focus restoration.

- [ ] **Step 4: Migrate every dialog**

Replace each component’s local `fixed inset-0` wrapper with `ModalShell`. Preserve its header/body/footer; put scrolling on the body area only. Split dialog sections out of `ParentDashboard.tsx` if needed so no modified TypeScript file exceeds 250 non-comment lines added ownership.

- [ ] **Step 5: Run dialog and accessibility tests**

```bash
npx playwright test tests/e2e/mobile-dialogs.spec.ts tests/e2e/accessibility.spec.ts
npm run typecheck
```

Expected: all PASS at desktop and mobile projects.

- [ ] **Step 6: Commit this slice**

```bash
git add src/components src/lib/use-modal-focus.ts tests/e2e/mobile-dialogs.spec.ts
git commit -m "fix: keep dialogs inside the mobile viewport"
```

---

### Task 3: Persistent child QR, camera scanner, manual code, and rotation

**Files:**
- Create: `supabase/migrations/202609210003_persistent_pairing_credentials.sql`
- Create: `supabase/rollbacks/202609210003_persistent_pairing_credentials.rollback.sql`
- Modify: `supabase/schema.sql`
- Modify: `src/lib/pairing/crypto.ts`
- Create: `src/app/api/pairing/credentials/route.ts`
- Create: `src/app/api/pairing/credentials/rotate/route.ts`
- Modify: `src/app/api/pairing/exchange/route.ts`
- Modify: `src/lib/store/pairing-client.ts`
- Modify: `src/lib/store/use-pairing-lifecycle.ts`
- Modify: `src/components/ParentChildrenTab.tsx`
- Create: `src/components/ChildQrScanner.tsx`
- Modify: `src/components/DeviceConnectModal.tsx`
- Modify: `src/lib/i18n/device-connect-copy.ts`
- Modify: `src/lib/i18n/parent-primary-copy.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/api/pairing-credentials.test.ts`
- Modify: `tests/api/pairing-exchange.test.ts`
- Create: `tests/unit/pairing-payload.test.ts`
- Create: `tests/e2e/pairing-camera.spec.ts`
- Modify: `tests/integration/migrations/family-tenancy.test.ts`

**Interfaces:**
- Produces: `PairingCredential = { childId: string; code: string; qrPayload: string; rotatedAt: string }`.
- Produces: `readPairingCredential(childId)`, `rotatePairingCredential(childId)`, and `connectChildDevice({ code } | { token })`.
- Produces: `<ChildQrScanner onDetected onCancel />`, lazy-loading `qr-scanner` only after the scan action.

- [ ] **Step 1: Add failing crypto and API tests**

Pin deterministic, domain-separated derivation in `tests/unit/pairing-payload.test.ts`:

```ts
it('creates different manual and QR credentials for one rotation nonce', async () => {
  const result = await derivePairingCredential('child-id', 'rotation-nonce', 'test-secret-at-least-32-characters');
  expect(result.code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  expect(result.token.length).toBeGreaterThanOrEqual(32);
  expect(result.code).not.toContain(result.token);
});
```

API tests must prove: parent can read/create one stable credential; repeated reads return the same code/payload; rotation changes both; wrong-family child returns 404; response never includes hashes.

- [ ] **Step 2: Verify tests fail**

Run:

```bash
npm test -- --run tests/unit/pairing-payload.test.ts tests/api/pairing-credentials.test.ts
```

Expected: FAIL because the derivation and routes do not exist.

- [ ] **Step 3: Add the persistent credential migration**

Create `public.pairing_credentials` with one active row per child:

```sql
create table public.pairing_credentials (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  rotation_nonce uuid not null default gen_random_uuid(),
  display_code_id text not null unique check (display_code_id ~ '^[A-Z2-9]{4}$'),
  verifier_hash bytea not null,
  token_hash bytea not null unique,
  rotated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade,
  unique (family_id, child_id),
  foreign key (child_id, family_id) references public.child_profiles(id, family_id) on delete cascade
);
```

Add family-manager RLS policies and `exchange_pairing_credential(...)`, which accepts either a QR token hash or manual verifier hash, enforces the existing fingerprint rate limit, and creates a new device session without consuming the credential. Rotation updates nonce and hashes but never touches `device_sessions`.

- [ ] **Step 4: Implement deterministic credential derivation and routes**

Derive manual code and a 32-byte base64url QR token with HMAC-SHA256 using `PAIRING_RATE_LIMIT_SECRET` and explicit domains `manual-code:` and `qr-token:` plus child ID and rotation nonce. Store only SHA-256 hashes. Return QR payload as `${origin}/?pair=${encodeURIComponent(token)}`.

`POST /api/pairing/credentials` reads or creates; `POST /api/pairing/credentials/rotate` atomically rotates. Both verify the parent’s family ownership before returning derived material.

- [ ] **Step 5: Update client state and parent management**

Replace automatic ten-minute challenge generation with stable credential loading. The parent card always exposes QR/manual code, an enlarged QR view, copy controls, and a confirmed rotate action. Keep connected-device revoke controls unchanged.

- [ ] **Step 6: Add camera scanning with manual fallback**

Install the scanner dependency:

```bash
npm install qr-scanner
```

Dynamically import it only when the user presses “Quét QR”, use the environment-facing camera, stop/destroy the scanner on detection/close/unmount, and pass only `pair` values from the current application origin to `connectChildDevice({ token })`. Permission denial, missing camera, insecure context, and unsupported device show plain-language guidance while preserving the manual input.

- [ ] **Step 7: Add runtime and E2E coverage**

Extend exchange API tests for token and manual code. Add a migration test proving rotation invalidates old credential hashes while an existing `device_sessions` row remains valid. In Playwright, mock the scanner module result rather than camera hardware; assert detected payload connects, denial displays fallback, and manual entry remains usable.

Run:

```bash
npm test -- --run tests/unit/pairing-payload.test.ts tests/api/pairing-credentials.test.ts tests/api/pairing-exchange.test.ts tests/integration/migrations/family-tenancy.test.ts
npx playwright test tests/e2e/pairing-camera.spec.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 8: Commit this slice**

```bash
git add package.json package-lock.json supabase src/app/api/pairing src/lib/pairing src/lib/store/pairing-client.ts src/lib/store/use-pairing-lifecycle.ts src/components/ParentChildrenTab.tsx src/components/ChildQrScanner.tsx src/components/DeviceConnectModal.tsx src/lib/i18n tests
git commit -m "feat: add persistent child QR pairing"
```

---

### Task 4: Align checkout details with the official payOS response

**Files:**
- Modify: `src/lib/payos.ts`
- Modify: `src/lib/billing/payos-server.ts`
- Modify: `src/lib/billing/payment-client.ts`
- Modify: `src/components/CheckoutPaymentDetails.tsx`
- Modify: `src/components/CheckoutModal.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/lib/i18n/translations.ts`
- Modify: `tests/api/payment-create.test.ts`
- Modify: `tests/e2e/smoke.spec.ts`
- Create: `tests/e2e/payment-return.spec.ts`

**Interfaces:**
- Produces: `PaymentResult.bankBin` instead of the fabricated `bankName` field.
- Consumes: official payOS create response fields `bin`, `accountNumber`, `accountName`, `amount`, `description`, `qrCode`, `checkoutUrl`.

- [ ] **Step 1: Write failing provider-contract tests**

Mock a successful payOS response with a BIN but no bank name. Assert the API response preserves exact provider values and exposes `bankBin`, never the string “Ngân hàng nhận thanh toán qua PayOS”. Add a UI test that expects account holder, account number, BIN, amount, memo, QR image, and secure checkout link.

- [ ] **Step 2: Verify the tests fail**

Run:

```bash
npm test -- --run tests/api/payment-create.test.ts
npx playwright test tests/e2e/smoke.spec.ts --grep "payment"
```

Expected: FAIL on the current `bankName` contract or missing secure-link action.

- [ ] **Step 3: Implement the exact response contract**

Parse and return provider `amount`, `description`, and `orderCode` in addition to the existing fields; verify they equal the server-owned order before returning. Rename the public display field to `bankBin`. Generate the QR image from the exact provider `qrCode`. Do not add a bank lookup or hard-coded bank label.

- [ ] **Step 4: Improve checkout and return states**

Display labelled rows in this order: account holder, account number, bank/BIN, amount, transfer memo. Add copy confirmation and an external `checkoutUrl` button with `rel="noopener noreferrer"`. On `?payment=success`, read status from the server and show activated/pending/error; on cancel show cancellation. Remove payment query parameters with `history.replaceState` after processing.

- [ ] **Step 5: Run payment coverage**

```bash
npm test -- --run tests/api/payment-create.test.ts tests/api/payment-status.test.ts tests/api/payment-webhook.test.ts
npx playwright test tests/e2e/smoke.spec.ts tests/e2e/payment-return.spec.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 6: Commit this slice**

```bash
git add src/lib/payos.ts src/lib/billing src/components/CheckoutPaymentDetails.tsx src/components/CheckoutModal.tsx src/app/page.tsx src/lib/i18n tests/api tests/e2e
git commit -m "fix: show verified payOS account details"
```

---

### Task 5: Full task details and completion feedback

**Files:**
- Create: `supabase/migrations/202609210004_habit_instructions.sql`
- Create: `supabase/rollbacks/202609210004_habit_instructions.rollback.sql`
- Modify: `supabase/schema.sql`
- Modify: `src/types/index.ts`
- Modify: `src/lib/supabase/mappers.ts`
- Modify: `src/lib/store/pairing-client.ts`
- Modify: `src/lib/domain/activity-mutations.ts`
- Modify: `src/lib/store/local-habit-actions.ts`
- Modify: `src/components/KidDashboard.tsx`
- Create: `src/components/KidTaskCard.tsx`
- Create: `src/components/TaskDetailsModal.tsx`
- Modify: `src/components/ParentDashboard.tsx`
- Modify: `src/components/ParentHabitsTab.tsx`
- Modify: `src/lib/i18n/kid-dashboard-copy.ts`
- Modify: `src/lib/i18n/parent-primary-copy.ts`
- Modify: `tests/unit/domain-rules.test.ts`
- Modify: `tests/unit/habit-actions.test.ts`
- Modify: `tests/api/activity-mutations.test.ts`
- Modify: `tests/e2e/smoke.spec.ts`
- Modify: `tests/e2e/activity-mutation.spec.ts`

**Interfaces:**
- Produces: `HabitActivity.instructions?: string` through local and cloud paths.
- Produces: `<KidTaskCard activity state onOpenDetails onToggle />` and `<TaskDetailsModal activity />`.

- [ ] **Step 1: Write failing data and interaction tests**

Add tests proving `instructions` survives create/update/session mapping. Extend the demo E2E test to assert the full description is visible without ellipsis, clicking the card opens purpose/instructions, and clicking the completion control does not also open details.

Add a failure-path E2E assertion:

```ts
await completionButton.click();
await expect(taskCard).not.toHaveAttribute('data-complete', 'true');
await expect(taskCard.getByRole('alert')).toContainText('thử lại');
await expect(taskCard.getByTestId('point-burst')).toHaveCount(0);
```

- [ ] **Step 2: Verify tests fail**

Run:

```bash
npm test -- --run tests/unit/domain-rules.test.ts tests/unit/habit-actions.test.ts tests/api/activity-mutations.test.ts
npx playwright test tests/e2e/smoke.spec.ts tests/e2e/activity-mutation.spec.ts
```

Expected: FAIL because instructions and detail behavior are absent.

- [ ] **Step 3: Add the optional instructions field end to end**

Add nullable `instructions text` to `habit_activities`, update RPC JSON projections, mappers, Zod schemas, local persistence, domain command inputs, and parent edit forms. Empty strings normalize to `undefined` in TypeScript and `null` in storage.

- [ ] **Step 4: Extract a focused task card and details dialog**

Move task-card rendering out of `KidDashboard.tsx`. Render title and description with wrapping, no `truncate`. Make the card’s detail area a button with an accessible name; keep the completion button independent and stop propagation. Details show purpose, instructions when present, duration/timer, points, and approval requirements.

- [ ] **Step 5: Add completion feedback with rollback**

After a confirmed completion, apply a `data-complete` state, animate the checkmark and a short `+N ⭐` point burst, update progress, and play the existing success sound. Only milestone completion may trigger confetti. Under reduced motion, render static status text/icon. If persistence fails, restore the previous card state and present a retry message.

- [ ] **Step 6: Run focused and browser tests**

```bash
npm test -- --run tests/unit/domain-rules.test.ts tests/unit/habit-actions.test.ts tests/api/activity-mutations.test.ts
npx playwright test tests/e2e/smoke.spec.ts tests/e2e/activity-mutation.spec.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 7: Commit this slice**

```bash
git add supabase src/types/index.ts src/lib src/components/KidDashboard.tsx src/components/KidTaskCard.tsx src/components/TaskDetailsModal.tsx src/components/ParentDashboard.tsx src/components/ParentHabitsTab.tsx tests
git commit -m "feat: add task guidance and completion feedback"
```

---

### Task 6: Public user documentation and navigation

**Files:**
- Create: `src/app/docs/page.tsx`
- Create: `src/components/docs/DocsNavigation.tsx`
- Create: `src/components/docs/DocsSection.tsx`
- Create: `src/lib/i18n/docs-copy.ts`
- Modify: `src/components/Header.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/ParentSettingsTab.tsx`
- Modify: `src/components/OnboardingModal.tsx`
- Create: `tests/e2e/docs.spec.ts`
- Modify: `DESIGN.md`

**Interfaces:**
- Produces: public `/docs` route and translated `getDocsCopy(language)` content.
- Consumes: existing language detection and brand/header primitives.

- [ ] **Step 1: Write the failing docs navigation test**

Assert `/docs` loads without authentication, has one H1, exposes the eight approved sections, has keyboard-accessible section navigation, and links back to the app. From header/footer/settings, assert the documentation link resolves to `/docs`.

- [ ] **Step 2: Verify the test fails**

Run: `npx playwright test tests/e2e/docs.spec.ts`

Expected: FAIL with a 404 or missing documentation link.

- [ ] **Step 3: Implement the documentation route**

Create concise Vietnamese-first content for: quick start, child profiles/habits, QR/manual device connection, completing/approving tasks, rewards/stars, payment/activation, cloud sync/backup/devices, and troubleshooting/FAQ. Keep infrastructure names out of general instructions; put unavoidable implementation details in a collapsed “Thông tin kỹ thuật” FAQ entry.

- [ ] **Step 4: Add navigation entry points**

Add “Tài liệu” to the header, footer, onboarding finish screen, and parent settings. Ensure the mobile header entry is visible without horizontal overflow.

- [ ] **Step 5: Run docs, locale, and accessibility tests**

```bash
npx playwright test tests/e2e/docs.spec.ts tests/e2e/locale-detection.spec.ts tests/e2e/accessibility.spec.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 6: Commit this slice**

```bash
git add DESIGN.md src/app/docs src/components/docs src/lib/i18n/docs-copy.ts src/components/Header.tsx src/app/page.tsx src/components/ParentSettingsTab.tsx src/components/OnboardingModal.tsx tests/e2e/docs.spec.ts
git commit -m "feat: add public KidHabit user guides"
```

---

### Task 7: Whole-product verification, release evidence, and production rollout

**Files:**
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `scripts/check-performance-budget.mjs` only if the lazy scanner chunk needs an explicit budget entry
- Modify: `docs/claims-ledger.md`
- Modify: `docs/deployment.md`
- Create: `plans/260921-2005-experience-refresh/reports/release-evidence.md`

**Interfaces:**
- Consumes: all behavior from Tasks 1–6.
- Produces: a clean release-candidate evidence record and verified production deployment.

- [ ] **Step 1: Run the narrow full suite**

```bash
npm run lint
npm run typecheck
npm test -- --run tests/unit tests/api tests/integration
npm run check:secrets
npm run build:cloudflare
npm run check:performance
```

Expected: every command exits 0; no secret values appear in output.

- [ ] **Step 2: Run all browser projects**

```bash
npx playwright test
```

Expected: desktop and mobile Chromium pass, including light default, modal position, pairing fallback, payment data, task details, reduced motion, docs, and accessibility.

- [ ] **Step 3: Capture fresh visual evidence**

Capture landing, parent dashboard, child tasks, checkout, QR management, camera fallback, task detail, and docs at 375×812, 768×900, and 1280×900 into `output/playwright/experience-refresh/`. Inspect every capture for clipping, tiny essential copy, dark first paint, modal displacement, and horizontal overflow. Do not commit the captures.

- [ ] **Step 4: Validate migrations and rollback safety**

Run migration tests and SQL preflight against an isolated project. Prove old one-time challenges remain readable during rollout, new persistent credentials work, rotation does not revoke existing device sessions, and `instructions` remains optional. Record redacted evidence only.

- [ ] **Step 5: Update durable documentation**

Update claims only where behavior is now verified. Document the new additive migrations, `qr-scanner` secure-context requirement, and rollback ordering. Keep implementation phase IDs out of source comments and public UI.

- [ ] **Step 6: Prepare and verify the release candidate**

After the implementation commits are complete and the worktree is clean, run:

```bash
RELEASE_SHA=$(git rev-parse HEAD) npm run release:verify
```

Expected: health is ready, full Playwright passes against the production bundle, and the wrapper stops its preview process.

- [ ] **Step 7: Push and observe deployment**

```bash
git push origin main
gh run watch --repo vanhoa2191/goodhabittracking --exit-status
```

After Cloudflare deploys, verify `/api/health`, `/`, `/docs`, and static logo/favicon assets. Perform one real parent-authenticated pairing flow and one low-value real payOS payment only with explicit owner approval before money is transferred.

- [ ] **Step 8: Record release evidence**

Write commit SHA, CI run URL, Cloudflare deployment version, migration identifiers, health result, test counts, viewport captures, and any untested external boundary to `reports/release-evidence.md`. Do not include credentials, child data, payment account data, or session identifiers.

- [ ] **Step 9: Commit documentation evidence**

```bash
git add docs plans/260921-2005-experience-refresh/reports/release-evidence.md
git commit -m "docs: record experience refresh release evidence"
```

## Plan self-review

- Spec coverage: every section of `design.md` maps to Tasks 1–7.
- Placeholder scan: every implementation step names its concrete behavior, file, and verification command.
- Type consistency: `ThemeChoice`, `PairingCredential`, token/manual exchange union, `PaymentResult.bankBin`, and `HabitActivity.instructions` are defined before downstream use.
- Review-focus coverage: all five high-risk conditions have an owning test task.
- Dependency order: appearance and modal primitives precede dependent screens; pairing/payment/task migrations are additive; docs consumes final terminology; release runs last.
