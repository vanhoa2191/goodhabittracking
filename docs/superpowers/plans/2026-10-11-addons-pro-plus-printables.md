# Add-ons: Pro Plus (AI, monthly) and Printable & Ebook (sale only) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sell two add-ons through the existing PayOS checkout: **Pro Plus** (AI Habit Coach, 29.000 đ/tháng) and **Printable & Ebook** (99.000 đ one-time, hidden until the content exists). Gate parent AI by add-on: 1 call/day for everyone, 10 calls/day with Pro Plus.

**Architecture:** Add-ons are order plan ids that never touch `user_subscriptions`. A new `family_addons` table holds what a family owns (`pro_plus` until a date, `printables` forever). `create_family_payment_order` prices them and checks eligibility. `process_payos_webhook` gets an add-on branch before the subscription logic. A SQL function `family_ai_tier(uuid)` returns `'plus'` or `'basic'`; the AI handler passes the matching daily limit into the existing `consume_ai_quota`. The UI replaces the announced 79k/790k Pro Plus tier card with the add-on.

**Tech Stack:** Next.js + TypeScript, Vitest, Supabase Postgres migrations (+ preflight verify, disposable-Postgres scenarios), Playwright.

**Spec:** Money Model v2.0 (`~/Downloads/KidHabit_Hero_Money_Model.pdf`) as changed by the owner on 11/10/2026: Pro Plus is **monthly 29.000 đ** (not 299.000/năm); everyone gets **1 AI call/day**, Pro Plus **10/day**; **no referral commission** on add-ons; Printable & Ebook: **build the sale now, hide it from customers until content exists**. Lifetime VIP is **out of scope**.

## Global Constraints

- Add-on order ids: `pro_plus_monthly` (29000 VND), `printables` (99000 VND). No referral discount on add-ons (the discount branch only runs for yearly ids today; keep it that way).
- `pro_plus_monthly`: buyable only while the family has an **active paid plan** (`solo_monthly`, `solo_yearly`, `monthly`, `yearly`, or `lifetime`, with `status = 'active'` and an end date in the future or none). The trial does not qualify. Each payment adds **1 month** to `active_until`, counting from `max(now(), current active_until)`.
- `printables`: buyable by any family manager; one-time and permanent (`active_until is null`). Buying it again when already owned → `already_owned`, no order created.
- Add-on payments never change `user_subscriptions`, never claim the launch offer, and never earn commission (`accrue_referral_commission` already returns early for these plan ids; the scenario must prove it).
- Launch-offer founding families (`launch_offer_claims` active, offer `pro_plus_founding`) count as Pro Plus while their subscription is active.
- AI limits: `AI_LIMITS.perFamilyPerDay` is replaced by `perFamilyPerDayBasic: 1` and `perFamilyPerDayPlus: 10`. `systemPerDay: 150` and `minSecondsBetweenCalls: 20` are unchanged. Consent rules are unchanged.
- A confirmed refund of an add-on order (`admin_resolve_billing_case` → `manual_refund_confirmed`) revokes that add-on: `pro_plus` loses one month (but never below `now()`); `printables` is deleted.
- Printables visibility: flag `NEXT_PUBLIC_PRINTABLES_SALE` (default `false`). When false, nothing about Printables shows to customers and the payment API refuses `printables` with 404 `not_available`.
- The Pro Plus **tier** (79.000/790.000, `PLAN_PRICES.pro_plus`, `UPCOMING_PLAN_IDS` `family_plus_*`) is removed and replaced by the add-on card: "Pro Plus · AI Habit Coach — 29.000đ/tháng, thêm cho gói trả phí".

## Review Focus

1. **A family with Pro Plus whose base plan expires.** The add-on keeps its own `active_until`. AI stays at 10/day until that date, because it was paid for. Pinned in Task 1 scenario `plus_outlives_plan`.
2. **The same add-on order arrives at the webhook twice.** The second call returns `duplicate`, and only one month is added. Pinned in Task 1 scenario `addon_duplicate_webhook`.
3. **A founding family and its expired subscription.** While the subscription is active, `family_ai_tier` is `plus`; once it expires, it falls back to `basic`. Pinned in Task 1 scenario `founding_tier`.
4. **The AI quota hits its daily limit for a basic family.** The UI shows the upsell text, not an error. Pinned in Task 3 test.
5. **Someone calls the payment API for `printables` while the flag is off.** It returns 404 and no order row is created. Pinned in Task 2 test.

---

### Task 1: Database — `family_addons`, pricing, webhook branch, tier, refund

**Files:**
- Create: `supabase/migrations/202610110001_addons.sql`, `supabase/preflight/202610110001_addons.verify.sql`
- Create: `tests/integration/migrations/addons.test.ts`, `tests/integration/migrations/addons.scenarios.sql`
- Modify: `scripts/verify-local-billing.mjs` (apply + run scenarios), `supabase/schema.sql` (append, same pattern as previous migrations), `src/lib/schema-version.ts` → `'202610110001'`, `tests/unit/billing-price-drift.test.ts` (read the new migration; also assert the add-on prices against `ADDON_PRICES` from Task 2 — coordinate: until Task 2 lands, assert the literals 29000/99000)

**Interfaces (produced):**
- Table `public.family_addons(family_id uuid references families(id) on delete cascade, addon text check (addon in ('pro_plus','printables')), active_until timestamptz null, source text not null check (source in ('purchase','admin')), last_order_code bigint, updated_at timestamptz not null default now(), primary key (family_id, addon))`. RLS enabled + forced. `select` for `can_manage_family(family_id)`; no client writes.
- `create_family_payment_order(...)`: same signature. Adds `when 'pro_plus_monthly' then 29000 when 'printables' then 99000`. Eligibility raises `addon_requires_plan` / `already_owned`.
- `process_payos_webhook(...)`: same signature. Allowlist gains both ids. The add-on branch runs after the duplicate/event insert and the PAID update. It upserts `family_addons`, skips the subscription upsert and the launch claim, still calls `accrue_referral_commission` (which returns early), and returns `'activated'`.
- `family_ai_tier(target_family uuid) returns text` (`'plus' | 'basic'`), `security definer`, `stable`, granted to `service_role` only.
- `family_addons_snapshot() returns jsonb` → `{"proPlusUntil": timestamptz|null, "proPlusSource": "purchase"|"launch_offer"|null, "printables": boolean}` for `current_family_id()`, granted to `authenticated`.
- `admin_resolve_billing_case`: same signature; the add-on revocation is added inside the existing `manual_refund_confirmed` branch.

- [ ] **Step 1: Write `addons.test.ts`** (parse + text assertions, pattern of `money-model-v2.test.ts`): both files parse; the price case has both add-on lines; the webhook allowlist has both ids; the webhook has no `user_subscriptions` write inside the add-on branch; every new or changed function keeps `security definer` + `set search_path = ''` and the right grants.
- [ ] **Step 2: Write `addons.scenarios.sql`** — rows `scenario, ok`:
  `plus_requires_plan` (free family → `addon_requires_plan`; trial → `addon_requires_plan`; active `solo_monthly` → order 29000),
  `plus_purchase_extends` (pay twice → `active_until ≈ now + 2 months`, `user_subscriptions` row unchanged),
  `plus_outlives_plan` (subscription ends yesterday, add-on until next month → tier `plus`),
  `addon_duplicate_webhook`,
  `addon_no_commission` (referred family pays `pro_plus_monthly` → no `referral_commissions` row),
  `addon_no_discount` (referred family, first order is `pro_plus_monthly` → amount 29000, discount_bps 0),
  `printables_once` (pay → `printables` true; second create → `already_owned`),
  `founding_tier` (active claim + active yearly → `plus`; subscription expired → `basic`),
  `refund_revokes_addon` (confirm refund of a `pro_plus_monthly` order → `active_until` reduced by 1 month, not below now; of `printables` → row gone),
  `snapshot_shape` (`family_addons_snapshot()` keys and values for a family with both).
- [ ] **Step 3: Run** `npx vitest run tests/integration/migrations/addons.test.ts` → FAIL (missing).
- [ ] **Step 4: Write the migration** (`begin; … commit;`). Copy each changed function **verbatim** from its latest definition, then add only the listed changes:
  - `create_family_payment_order` from `202610100001_money_model_v2.sql`
  - `process_payos_webhook` from `202610070001_pricing_tiers_launch_offer.sql`
  - `admin_resolve_billing_case` from `202610090010_billing_payment_hardening.sql`

  New: the table, `family_ai_tier`, `family_addons_snapshot`. Re-issue grants.
- [ ] **Step 5: Write the preflight verify.** It raises unless the table exists with RLS forced, both functions exist with the expected grants, and `create_family_payment_order` and `process_payos_webhook` mention both add-on ids.
- [ ] **Step 6: Wire `verify-local-billing.mjs`** (apply after `202610100001`, run the scenarios, fail on any `ok = false`). Append to `supabase/schema.sql`. Bump `schema-version.ts`.
- [ ] **Step 7: Run** `npx vitest run tests/integration/migrations/addons.test.ts tests/unit/billing-price-drift.test.ts tests/unit/schema-version.test.ts` → PASS. Then `EMBEDDED_POSTGRES_MODULE_PATH=/tmp/kidhabit-sql-runtime/node_modules/embedded-postgres/dist/index.js npm run test:sql` → exit 0.
- [ ] **Step 8: Commit** `feat(billing): add-on orders, family_addons and AI tier`

---

### Task 2: Add-on catalog, payment API, checkout, entitlement

**Files:**
- Create: `src/lib/billing/addon-catalog.ts`, `tests/unit/addon-catalog.test.ts`
- Modify: `src/lib/billing/schemas.ts` (`checkoutItemSchema` = paid plans ∪ add-ons), `src/app/api/payment/create/route.ts`, `src/lib/payos.ts` (labels for the two ids), `src/app/checkout/page.tsx` + the `CheckoutEntry` component it renders (accept `?plan=pro_plus_monthly` / `printables`), `src/app/api/entitlement/route.ts` (add `addons` from `family_addons_snapshot`), `src/lib/experience-flags.ts` (`printablesSale: process.env.NEXT_PUBLIC_PRINTABLES_SALE === 'true'`), `.env.example`
- Test: `tests/api/payment-create.test.ts`, `tests/unit/checkout-intent.test.ts`, a new `tests/api/entitlement-addons.test.ts`

**Interfaces:**
- Produces `addon-catalog.ts`:
  `export const ADDON_IDS = ['pro_plus_monthly', 'printables'] as const; export type AddonId = (typeof ADDON_IDS)[number];`
  `export const ADDON_PRICES: Readonly<Record<AddonId, number>> = { pro_plus_monthly: 29000, printables: 99000 };`
  `export function isAddonId(value: unknown): value is AddonId`
  `export function addonVisible(id: AddonId, flags: { printablesSale: boolean }): boolean` (`printables` only when the flag is on).
- Entitlement JSON gains `addons: { proPlusUntil: string | null; proPlusSource: 'purchase' | 'launch_offer' | null; printables: boolean }`.
- The client types for the entitlement response (find the consumer of `/api/entitlement` in `src/lib/store`) gain the same field, defaulting to `{ proPlusUntil: null, proPlusSource: null, printables: false }`.

- [ ] **Step 1: Tests.**
  - `addon-catalog.test.ts`: the prices, `isAddonId`, and `addonVisible('printables', { printablesSale: false }) === false`.
  - `payment-create.test.ts`: `pro_plus_monthly` creates an order of 29000 with label "Pro Plus · Tháng". The RPC error `addon_requires_plan` → 409 with code `addon_requires_plan`. `already_owned` → 409. `printables` with the flag off → 404 `not_available` and no RPC call. No `listPrice`/`discountAmount` on add-on orders.
  - `entitlement-addons.test.ts`: the snapshot is mapped into `addons`; when the snapshot RPC fails, the defaults are used (entitlement still 200).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Give the RPC errors the same treatment as the existing `invalid_plan` handling in `route.ts`.
- [ ] **Step 4: Run** the three test files + `npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `feat(billing): sell Pro Plus and Printables add-ons through checkout`

---

### Task 3: AI daily limit by tier + upsell

**Files:**
- Modify: `src/lib/ai/config.ts` (`AI_LIMITS`: `perFamilyPerDayBasic: 1`, `perFamilyPerDayPlus: 10`, keep the others), `src/lib/ai/handler.ts` (before `consume_ai_quota`: admin RPC `family_ai_tier(familyId)`; on error use `basic`), the parent AI UI components that render the `ai_quota` error (find them with `grep -rn "ai_quota" src/components`), the AI copy file they use (all 9 languages)
- Test: the existing handler test (`grep -rln "consume_ai_quota" tests`) + the component test for the quota message

**Interfaces:**
- Consumes `family_ai_tier` (Task 1) and the entitlement `addons` (Task 2) for the UI.
- The 429 body for `family_day` gains `tier: 'basic' | 'plus'`.

- [ ] **Step 1: Tests.**
  - Handler: tier `plus` → `consume_ai_quota` is called with `per_day: 10`; `basic` → `1`; tier RPC error → `1`; the 429 for `family_day` includes the tier.
  - UI: `ai_quota` with `reason: 'family_day', tier: 'basic'` shows vi `Hôm nay bạn đã dùng 1 lượt gợi ý miễn phí. Thêm Pro Plus (29.000đ/tháng) để có 10 lượt mỗi ngày.` with a link to `/checkout?plan=pro_plus_monthly`. For `tier: 'plus'`, vi `Bạn đã dùng hết 10 lượt hôm nay. Quay lại vào ngày mai nhé.`. Both have translations in every language.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS, `npx tsc --noEmit` → 0.
- [ ] **Step 5: Commit** `feat(ai): 1 call a day for everyone, 10 with Pro Plus`

---

### Task 4: Pricing surfaces — replace the Pro Plus tier with the add-on; Printables card behind the flag

**Files:**
- Modify: `src/lib/billing/plan-catalog.ts` (remove `pro_plus` from `PlanTier` and `PLAN_PRICES`; keep `LAUNCH_OFFER`), `src/lib/billing/pricing-view.ts` (two tier cards + an `addonCards` export built from `ADDON_PRICES`), `src/lib/upcoming-plans.ts` + `src/lib/i18n/upcoming-plans-copy.ts` (remove `family_plus_*`, or delete the module if nothing else uses it), the pricing page components that render these cards (`src/app/pricing`, the components it imports), `apps/marketing/pricing.mjs`, `apps/marketing/site-content.mjs`, `apps/marketing/render-site.mjs`, `apps/marketing/client.js` (wherever Pro Plus 79k/790k is shown), the settings screen section for add-ons (new `src/components/AddonsCard.tsx`, rendered next to the existing plan/billing card in settings)
- Test: `tests/unit/pricing-view.test.ts`, `tests/unit/marketing-pricing.test.ts`, `tests/unit/marketing-build.test.ts`, `tests/unit/plan-catalog.test.ts`, `tests/e2e/ai-coming-soon.spec.ts`, `tests/unit/addons-card.test.ts` (new)

**Interfaces:**
- Consumes `ADDON_PRICES`, `addonVisible` (Task 2), and entitlement `addons` (Task 2).
- `AddonsCard`:
  - Pro Plus: status "Đang dùng đến {date}" or "Đang dùng (ưu đãi sáng lập)", plus a button "Thêm 1 tháng · 29.000đ" → `/checkout?plan=pro_plus_monthly`. The button is disabled with the hint "Cần gói trả phí đang hoạt động" when the family has no active paid plan.
  - Printables: rendered only when `addonVisible('printables', flags)`. Shows "Đã sở hữu" when owned, otherwise a buy button 99.000đ.

- [ ] **Step 1: Tests.**
  - `pricing-view`: two tier cards `[49000, 69000]`; `addonCards` = `[{ id: 'pro_plus_monthly', price: 29000 }]` with the flag off and both cards with it on.
  - Marketing: no `79.000` / `790.000` / `79000` / `790000` remain in the build output; the add-on line "29.000đ/tháng" is present.
  - `addons-card.test.ts`: the states above.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `grep -rnE "79[.,]?000|790[.,]?000|family_plus" src apps` → nothing left. **Step 5: Commit** `feat(pricing): Pro Plus becomes a 29k monthly add-on`

---

### Task 5: Copy, help topics, docs

**Files:** `src/lib/guide/help-topics*.ts` (Pro Plus / AI entries, 9 languages), `docs/huong-dan/07-goi-va-thanh-toan.md` (+ `i18n/en`, `translations-pending/*`), `docs/claims-ledger.md`, `docs/security-privacy.md` (AI section: daily limits), `docs/deployment.md` (new flag `NEXT_PUBLIC_PRINTABLES_SALE`, migration `202610110001`), then `npm run guide:build`.

- [ ] **Step 1:** Write the facts as in Global Constraints. Printables is **not** mentioned in customer-facing docs while the flag is off; mention it only in `deployment.md` and `claims-ledger.md` (as hidden).
- [ ] **Step 2:** `npx vitest run tests/unit/help-topics.test.ts tests/unit/help-topics-translations.test.ts tests/unit/guide-build.test.ts` → PASS; `grep -rnE "79[.,  ]000|790[.,  ]000" docs src` → nothing.
- [ ] **Step 3: Commit** `docs: Pro Plus add-on and AI daily limits`

---

### Task 6: Full verification

- [ ] `npm run lint && npm run typecheck && npm test` → 0.
- [ ] `EMBEDDED_POSTGRES_MODULE_PATH=/tmp/kidhabit-sql-runtime/node_modules/embedded-postgres/dist/index.js npm run test:sql` → 0.
- [ ] Playwright (no other worker editing): `checkout-entry`, `marketing-home`, `ai-coming-soon`. The 3 WebKit `checkout-entry` failures are pre-existing on `main`.
- [ ] Independent review of the branch, then PR. Deploy order: migration `202610110001` → preflight → app.
