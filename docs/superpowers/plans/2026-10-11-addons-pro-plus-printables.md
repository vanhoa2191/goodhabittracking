# Pro Plus on sale, AI add-on, Printables sale — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open the **Pro Plus** plan for sale (79.000 đ/tháng, 790.000 đ/năm; Pro benefits + AI 10 calls/day). Sell an **AI add-on** (29.000 đ/tháng) to Solo/Pro families. Sell **Printable & Ebook** (99.000 đ one-time), hidden until content exists. Everyone else gets 1 AI call/day.

**Architecture:** Pro Plus becomes two more subscription plan ids (`pro_plus_monthly`, `pro_plus_yearly`), ranked above Pro, and goes through every place that enumerates paid plans. Add-ons (`ai_addon_monthly`, `printables`) are order plan ids that never touch `user_subscriptions`. They live in a new `family_addons` table, written by an add-on branch in `process_payos_webhook`. `family_ai_tier(uuid)` returns `'plus' | 'basic'`, and the AI handler passes 10 or 1 into the existing `consume_ai_quota`.

**Tech Stack:** Next.js + TypeScript, Vitest, Supabase Postgres migrations (+ preflight verify, disposable-Postgres scenarios), Playwright.

**Spec:** Money Model v2.0 (`~/Downloads/KidHabit_Hero_Money_Model.pdf`) as changed by the owner on 11/10/2026:
- Keep the Pro Plus plan and open it for sale now.
- Solo/Pro buy an AI add-on at 29.000 đ/tháng if they need AI.
- Everyone gets 1 AI call/day; Pro Plus and the add-on give 10/day.
- No commission or referral discount on add-ons.
- Printables: build the sale, keep it hidden.
- Lifetime VIP is out of scope.

Builds on branch `feat/money-model-v2` (PR #189).

## Global Constraints

- Prices (VND): `pro_plus_monthly` 79000, `pro_plus_yearly` 790000, `ai_addon_monthly` 29000, `printables` 99000. Existing: solo 49000/399000, pro 69000/590000.
- Pro Plus = Pro benefits (child limit 5, Pro entitlement) + AI tier `plus`. Plan rank: solo 1 < pro 2 < pro_plus 3. Durations: `pro_plus_yearly` +1 year, `pro_plus_monthly` +1 month, stacking exactly like the existing plans.
- `pro_plus_yearly` is a yearly plan everywhere yearly matters:
  - the referral discount, 10% then rounded down to 1.000 đ: 790.000 → **711.000**;
  - the one-yearly-pending-link lock;
  - "prior paid yearly" checks;
  - commission 20%: 711.000 → **142.200**.
- `pro_plus_monthly` earns no commission. The launch-offer claim stays on `yearly` only.
- `ai_addon_monthly`: buyable only with an active paid plan among `solo_monthly`, `solo_yearly`, `monthly`, `yearly`, `lifetime` (status active, end in future or null). Errors: no plan or trial → `addon_requires_plan`; active Pro Plus → `already_included`. Each payment adds 1 month from `max(now(), active_until)`. Name in UI: **"Add-on AI"** (vi), "AI add-on" (en).
- `printables`: any family manager; permanent; a second purchase → `already_owned`. Flag `NEXT_PUBLIC_PRINTABLES_SALE` (default false): when false, nothing shows to customers and the payment API returns 404 `not_available` without calling the database.
- Add-on payments never change `user_subscriptions`, never claim the launch offer, never earn commission, never get the referral discount.
- AI tier `plus` when any of these hold: active `pro_plus_*` subscription; `family_addons.ai` active; active founding claim (`pro_plus_founding`) with an active subscription. Otherwise `basic`. `AI_LIMITS`: `perFamilyPerDayBasic: 1`, `perFamilyPerDayPlus: 10`; `systemPerDay: 150` and `minSecondsBetweenCalls: 20` are unchanged.
- A confirmed refund (`admin_resolve_billing_case` → `manual_refund_confirmed`) of an add-on order revokes it: AI add-on −1 month (never below now()); printables row deleted. Refunds of plan orders keep today's behaviour.
- The "upcoming" Pro Plus announcement (`UPCOMING_PLAN_IDS` `family_plus_*`) is removed: the plan is now on sale.

## Review Focus

1. **A family on Pro Năm with an active founding claim buys Pro Plus monthly.** The rank goes up to pro_plus, the end date stacks, and AI stays `plus`. Pinned in Task 1 scenario `pro_to_pro_plus`.
2. **A Solo family has the AI add-on and upgrades to Pro Plus.** The add-on row stays; the tier is `plus` either way; buying the add-on again → `already_included`. Pinned in Task 1 `addon_then_pro_plus`.
3. **The same add-on order reaches the webhook twice.** Only one month is added. Pinned in Task 1 `addon_duplicate_webhook`.
4. **A basic family hits the daily AI limit.** It sees the upsell (Add-on AI 29k or Pro Plus), not an error. Pinned in Task 3.
5. **`printables` is requested with the flag off.** The API returns 404 and creates no order. Pinned in Task 2.

---

### Task 1 (codex): Database

**Files:**
- Create: `supabase/migrations/202610110001_pro_plus_and_addons.sql`, `supabase/preflight/202610110001_pro_plus_and_addons.verify.sql`, `tests/integration/migrations/pro-plus-and-addons.test.ts`, `tests/integration/migrations/pro-plus-and-addons.scenarios.sql`
- Modify: `scripts/verify-local-billing.mjs` (and `verify-local-affiliate.mjs` for the commission scenarios), `supabase/schema.sql`, `src/lib/schema-version.ts` → `'202610110001'`, `tests/unit/billing-price-drift.test.ts` (read the new migration; the price case must equal `PLAN_PRICES` for every `PAID_PLAN_IDS` entry + literals 29000/99000 for add-ons)

**Interfaces produced:**
- Every function below is copied **verbatim from its latest definition** (paths in the table) and changed only as stated. Signatures, `security definer`, `set search_path = ''` and grants stay the same.

| Function | Latest file | Change |
|---|---|---|
| `create_family_payment_order` | 202610100001 | prices for the 4 new ids; yearly branch `in ('yearly','solo_yearly','pro_plus_yearly')`; add-on eligibility + errors |
| `referral_discount_bps` | 202610090010 | yearly lists include `pro_plus_yearly` |
| `process_payos_webhook` | 202610070001 | allowlist + 4 ids; `has_paid_time` list + pro_plus ids; ranks solo 1/pro 2/pro_plus 3; +1 year for `pro_plus_yearly`; add-on branch (upsert `family_addons`, skip subscription + launch claim) |
| `accrue_referral_commission` | 202610100001 | plan filter + `pro_plus_yearly` |
| `family_has_pro_entitlement`, `family_child_limit`, `admin_retention_snapshot`, `admin_revoke_launch_offer_claim` | 202610070001 | paid plan lists + pro_plus ids (child limit 5) |
| `activate_family_trial`, `admin_update_family_subscription`, `redeem_family_coupon` | 202610090010 | paid plan lists + pro_plus ids |
| `admin_resolve_billing_case` | 202610090010 | add-on revocation inside the `manual_refund_confirmed` branch |

- New: table `public.family_addons(family_id uuid references public.families(id) on delete cascade, addon text check (addon in ('ai','printables')), active_until timestamptz, source text not null check (source in ('purchase','admin')), last_order_code bigint, updated_at timestamptz not null default now(), primary key (family_id, addon))`, RLS enabled + forced, select policy `can_manage_family(family_id)`, no client writes.
- New: `family_ai_tier(target_family uuid) returns text` (stable, service_role only).
- New: `family_addons_snapshot() returns jsonb` → `{"aiUntil": ts|null, "aiIncluded": bool, "printables": bool}` for `current_family_id()`, granted to authenticated. `aiIncluded` is true for an active Pro Plus or founding claim.

- [ ] **Step 1:** Write `pro-plus-and-addons.test.ts` (parse + text checks per the table, pattern of `money-model-v2.test.ts`).
- [ ] **Step 2:** Write the scenarios, as rows `scenario, ok`:
  - `pro_plus_prices` (79000/790000; referred first `pro_plus_yearly` → 711000);
  - `pro_plus_commission` (711000 → 142200; `pro_plus_monthly` → none);
  - `pro_plus_child_limit` (5);
  - `pro_to_pro_plus`;
  - `addon_requires_plan` (free, trial);
  - `addon_then_pro_plus`;
  - `addon_extends` (paid twice → +2 months, subscription unchanged);
  - `addon_duplicate_webhook`;
  - `addon_no_commission_no_discount`;
  - `printables_once`;
  - `founding_tier` (claim + active yearly → plus; expired → basic);
  - `refund_revokes_addon`;
  - `snapshot_shape`;
  - `regression_existing_plans` (solo/pro monthly & yearly still activate as before).
- [ ] **Step 3:** Run → FAIL. **Step 4:** Write the migration and preflight. **Step 5:** Wire the runners, `schema.sql`, schema version.
- [ ] **Step 6:** `npx vitest run tests/integration/migrations/pro-plus-and-addons.test.ts tests/unit/billing-price-drift.test.ts tests/unit/schema-version.test.ts` → PASS; `EMBEDDED_POSTGRES_MODULE_PATH=/tmp/kidhabit-sql-runtime/node_modules/embedded-postgres/dist/index.js npm run test:sql` → 0.

---

### Task 2 (sonnet): Plan catalog, add-on catalog, payment API, entitlement, admin

**Files:**
- Modify:
  - `src/lib/billing/plan-catalog.ts`, `src/types/index.ts` (`SubscriptionPlan`), `src/lib/billing/schemas.ts`
  - `src/lib/payos.ts` (Pro Plus `PRICING_PLANS` entries, savings 158.000đ (17%), add-on labels)
  - `src/lib/i18n/pricing-plan-copy.ts` (Pro Plus names/features, 9 languages)
  - `src/app/api/payment/create/route.ts`, `src/app/checkout/page.tsx` + the `CheckoutEntry` component, `src/app/api/entitlement/route.ts`
  - `src/lib/store/subscription.ts`, `src/lib/store/cloud-family-sync.ts`, `src/lib/supabase.ts`, `src/lib/public-funnel.ts`
  - `src/lib/admin/admin-view.ts`, `src/app/api/admin/subscriptions/route.ts`, `src/components/AdminCustomerManager.tsx`, `src/components/AdminOverviewPanel.tsx`
  - `src/lib/experience-flags.ts` (`printablesSale`), `.env.example`
- Create: `src/lib/billing/addon-catalog.ts`
- Tests: `plan-catalog`, `store-subscription`, `payos-server`, `checkout-intent`, `admin-view`, `admin-subscriptions`, `payment-create`, new `addon-catalog.test.ts`, new `tests/api/entitlement-addons.test.ts`

**Interfaces produced (later tasks rely on these exact names):**
- `PAID_PLAN_IDS = ['solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly']`; `planTier` returns `'solo' | 'pro' | 'pro_plus'`; `planIdFor('pro_plus', cycle)` works; `planChildLimit('pro_plus_*') === 5`; `PLAN_PRICES.pro_plus = { month: 79000, year: 790000 }` (unchanged values).
- `addon-catalog.ts`: `ADDON_IDS = ['ai_addon_monthly', 'printables'] as const`, `type AddonId`, `ADDON_PRICES = { ai_addon_monthly: 29000, printables: 99000 }`, `isAddonId(v)`, `addonVisible(id, { printablesSale })`.
- `checkoutItemSchema = z.enum([...PAID_PLAN_IDS, ...ADDON_IDS])` used by `payment/create`.
- Entitlement JSON gains `addons: { aiUntil: string | null; aiIncluded: boolean; printables: boolean }` (defaults when the RPC fails: `null/false/false`). The store type gets the same field.
- Payment errors: `addon_requires_plan` / `already_included` / `already_owned` → 409 with that `code`; `printables` with the flag off → 404 `not_available`.

- [ ] **Step 1:** Tests first, with the Global Constraints values. A referred `pro_plus_yearly` order returns `listPrice: 790000`, `discountAmount: 79000` (mock RPC amount 711000). Add-on orders carry no discount fields.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Targeted tests + `npx tsc --noEmit` → PASS.

---

### Task 3 (omp): AI daily limit by tier + upsell; help topics

**Files:** `src/lib/ai/config.ts`, `src/lib/ai/handler.ts`, the components that render the `ai_quota` error (`grep -rn "ai_quota" src/components`) and their copy file (9 languages), `src/lib/guide/help-topics*.ts` (Pro Plus + AI add-on + daily limits), tests for each.

**Interfaces:** consumes `family_ai_tier` (Task 1) via the admin client; on any error use `basic`. The 429 for `family_day` adds `tier`.

- [ ] **Step 1:** Tests first:
  - handler: `plus` → `per_day: 10`; `basic` → `1`; RPC error → `1`; `tier` included in the 429.
  - UI vi, basic: `Hôm nay bạn đã dùng 1 lượt gợi ý miễn phí. Thêm Add-on AI (29.000đ/tháng) hoặc nâng lên Pro Plus để có 10 lượt mỗi ngày.` with links `/checkout?plan=ai_addon_monthly` and `/checkout?plan=pro_plus_monthly`.
  - UI vi, plus: `Bạn đã dùng hết 10 lượt hôm nay. Quay lại vào ngày mai nhé.`
  - All 9 languages; the help-topic length tests pass.
- [ ] **Step 2–4:** FAIL → implement → PASS + `npx tsc --noEmit`.

---

### Task 4 (codex #2): Pricing surfaces and the Add-ons card

**Files:**
- Modify: `src/lib/billing/pricing-view.ts` (Pro Plus card purchasable with `planId`; `addonCards` export), `src/components/PricingModal.tsx` and the pricing page under `src/app/pricing`
- Remove: `src/lib/upcoming-plans.ts` and `src/lib/i18n/upcoming-plans-copy.ts` and their uses (Pro Plus is on sale now)
- Modify: `apps/marketing/pricing.mjs`, `site-content.mjs`, `render-site.mjs`, `client.js` (Pro Plus buyable; the AI add-on line; no "sắp ra mắt")
- Create: `src/components/AddonsCard.tsx`, rendered in settings next to the current plan/billing card
- Tests: `pricing-view`, `marketing-pricing`, `marketing-build`, `upcoming-plans` tests (delete or rewrite), `tests/e2e/ai-coming-soon.spec.ts` (update to the new reality), new `addons-card.test.ts`

**Interfaces:** consumes Task 2's `PAID_PLAN_IDS`, `ADDON_PRICES`, `addonVisible`, entitlement `addons`. `AddonsCard`:
- **AI:**
  - with Pro Plus/founding: "Đã gồm trong gói của bạn";
  - with an active add-on: "Đang dùng đến {date}" + "Thêm 1 tháng · 29.000đ";
  - Solo/Pro without the add-on: "Thêm Add-on AI · 29.000đ/tháng";
  - no active paid plan: disabled, "Cần gói trả phí đang hoạt động".
- **Printables:** only when `addonVisible('printables', flags)`; shows "Đã sở hữu" or a buy button 99.000đ.

- [ ] **Step 1:** Tests: pricing-view gives three purchasable tier cards (monthly `[49000, 69000, 79000]`, yearly `[399000, 590000, 790000]`); `addonCards` gives the AI add-on only while the flag is off; the marketing build has no "sắp ra mắt"/"coming soon" for Pro Plus; the AddonsCard states above. **Steps 2–4:** FAIL → implement → PASS.

---

### Task 5 (agy): Docs

`docs/huong-dan/07-goi-va-thanh-toan.md` (+ `i18n/en`, `translations-pending/*`), `docs/claims-ledger.md`, `docs/security-privacy.md` (AI limits), `docs/affiliate-program.md` (Pro Plus Năm: 711.000 → 142.200; add-ons earn nothing), `docs/deployment.md` (migration 202610110001, flag `NEXT_PUBLIC_PRINTABLES_SALE`). Printables appears only in `deployment.md` and `claims-ledger.md` (as hidden). Then the coordinator runs `npm run guide:build`.

---

### Task 6 (coordinator): Full verification, review, PR

- [ ] `npm run lint && npm run typecheck && npm test` → 0. The SQL runner (command above) → 0. `npm run guide:build`.
- [ ] Playwright with no worker editing: `checkout-entry`, `marketing-home`, `ai-coming-soon` (the 3 WebKit `checkout-entry` failures are pre-existing).
- [ ] Independent review (Claude Opus), fix the findings, then open the PR (base: `feat/money-model-v2` until #189 merges). Deploy order: migration → preflight → app.
