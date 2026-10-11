# Pro Plus promotions: 690k upsell (200 slots) and buy-1-get-1 (100 slots) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two limited Pro Plus Năm offers.
- **Upsell:** shown when a parent picks Pro Năm. "Thêm 100.000đ để lên Pro Plus": Pro Plus Năm at 690.000đ, first 200 paid orders.
- **Buy 1 get 1:** Pro Plus Năm for 790.000đ gives 2 years. First 100 paid orders, until 31/12/2026 23:59 (Asia/Saigon).

**Architecture:** Each offer is a promo order id that maps to the subscription plan `pro_plus_yearly` (`subscription.plan` is always `pro_plus_yearly`), with its own price and duration. Slots reuse the existing `launch_offers` / `launch_offer_claims` tables: one row per offer. `create_family_payment_order` refuses new promo orders when no slots remain or the offer is closed. `process_payos_webhook` claims the slot at settlement and always honours a paid order. `GET /api/offers/launch` reports every offer's remaining slots.

**Spec (owner, 11/10/2026):** upsell Pro Plus Năm 690k, 200 slots; Pro Plus mua 1 năm tặng 1 năm, 100 slots, ends 31/12/2026. Offers do not stack with the 10% referral discount. The 20% commission applies to the amount paid. There are no real customers yet. Builds on `feat/addons` (PR #190); migration `202610110001` is not deployed and is **edited in place**.

## Global Constraints

- Promo order ids (`PROMO_PLAN_IDS`):
  - `pro_plus_yearly_upsell`: price 690000, +1 year, offer code `pro_plus_upsell_690`, 200 slots, no end date.
  - `pro_plus_yearly_b1g1`: price 790000, +2 years, offer code `pro_plus_b1g1`, 100 slots, `closed_at = '2026-12-31 17:00:00+00'` (= 01/01/2027 00:00 Asia/Saigon).
- Both are subscription orders for rank 3 (Pro Plus) and settle exactly like `pro_plus_yearly`. The only differences are the duration above and the slot claim. They count everywhere a yearly id counts:
  - the one-pending-yearly lock;
  - the "prior paid yearly" check;
  - `higher_plan_active` / `lifetime_active`;
  - the commission filter: 20% of the amount, so 690000 → **138000** and 790000 → **158000**.
- **No referral discount** on promo ids: discount_bps is 0 even for a referred first order.
- Slots:
  - Order creation refuses with `offer_unavailable` when `launch_offer_remaining(code) = 0` or the offer is closed.
  - Settlement inserts a claim (`launch_offer_claims`, `offer_code`, `order_code`). It always activates the plan, even if the slots ran out between creation and payment, which can overfill a little. Such an overfill is still a claim and is counted.
  - A family can claim each promo at most once (the existing unique index per offer and family). A second order for the same promo after a claim → `offer_already_used` at creation.
  - A confirmed refund revokes the claim (`revoked_at`), the same way as the founding offer, and frees the slot.
- The existing founding offer (`pro_plus_founding`, 10 slots on `yearly`) is unchanged.
- UI copy (vi, exact; translate for all 9 languages):
  - Upsell (on the Pro Năm card and in checkout when the chosen plan is `yearly`): `Thêm 100.000đ để lên Pro Plus: AI không giới hạn. Còn {n}/200 suất.` → `/checkout?plan=pro_plus_yearly_upsell`. Hidden when remaining = 0 or the count cannot be read.
  - B1G1 (on the Pro Plus Năm card): `Mua 1 năm tặng 1 năm: 790.000đ cho 2 năm Pro Plus. Còn {n}/100 suất, đến hết 31/12/2026.` → `/checkout?plan=pro_plus_yearly_b1g1`. Hidden when closed, at 0 slots, or when the count cannot be read.
  - Checkout labels: `Pro Plus · Năm (ưu đãi nâng cấp)` 690.000đ; `Pro Plus · 2 năm (mua 1 tặng 1)` 790.000đ.
  - Refusals: `offer_unavailable` → `Ưu đãi này đã hết suất hoặc đã kết thúc.`; `offer_already_used` → `Gia đình bạn đã dùng ưu đãi này.` No Retry button.
- The referral-code step is skipped for promo ids, as it is for add-ons.

## Review Focus

1. **The last slot is paid by two families at once.** Both orders activate, the claim count becomes 201, and new promo orders are refused. Pinned by the SQL scenario `slot_overfill_honoured`.
2. **A buy-1-get-1 order created on 31/12 and paid on 01/01.** It is honoured (2 years), because closing only blocks new orders. Pinned by `b1g1_closed_after_creation`.
3. **A referred family buys the upsell.** It pays 690000 (no extra 10%), and the referrer earns 138000. Pinned by `upsell_referral_no_stack`.
4. **A family that already has Pro Plus buys buy-1-get-1.** It is allowed (same rank) and adds 2 years. Pinned by `b1g1_extends_pro_plus`.
5. **The offer-count API fails.** No promo banner is shown; the plans are still buyable at list price. Pinned by a UI test.

---

### Task A (codex): SQL

**Files:** `supabase/migrations/202610110001_pro_plus_and_addons.sql` (in place: insert the two `launch_offers` rows; extend `create_family_payment_order`, `process_payos_webhook`, `referral_discount_bps`, `accrue_referral_commission`, `admin_resolve_billing_case` (claim revocation on refund) and the ranks), its preflight, `tests/integration/migrations/pro-plus-and-addons.{test.ts,scenarios.sql}`, the runner allowlists in `scripts/verify-local-*.mjs`. `supabase/schema.sql` must keep only `\ir` lines.

**Scenarios:**
- `upsell_price_and_claim`;
- `upsell_referral_no_stack`;
- `b1g1_two_years`;
- `b1g1_extends_pro_plus`;
- `slot_overfill_honoured`;
- `offer_unavailable_when_full`;
- `b1g1_closed_after_creation`;
- `b1g1_closed_refuses_new`;
- `offer_already_used`;
- `promo_refund_frees_slot`;
- `promo_pending_lock`;
- `promo_commission` (138000 and 158000).

**Acceptance:** the targeted vitest and `EMBEDDED_POSTGRES_MODULE_PATH=/tmp/kidhabit-sql-runtime/node_modules/embedded-postgres/dist/index.js npm run test:sql` → 0.

### Task B (sonnet): catalog, payment API, offers API, checkout

**Files:**
- `src/lib/billing/plan-catalog.ts`: `PROMO_PLAN_IDS`, `PROMO_PLANS` (price, years, offerCode, slots, endsAt), `promoBasePlan()`.
- `src/lib/billing/schemas.ts`: `checkoutItemSchema` includes the promo ids.
- `src/lib/payos.ts`: labels.
- `src/app/api/payment/create/route.ts`: 409 for `offer_unavailable` and `offer_already_used`.
- `src/app/api/offers/launch/route.ts`: response `{ offers: [{ code, slots, remaining, endsAt|null }] }`; keep the old top-level `code/slots/remaining` fields for `pro_plus_founding` for compatibility.
- `src/lib/billing/payment-client.ts`, `src/lib/i18n/payment-error-copy.ts`: new refusal codes, no Retry.
- `src/components/CheckoutModal.tsx`: skip the referral step for promo ids.
- Tests for each.

**Interfaces:** `PROMO_PLAN_IDS = ['pro_plus_yearly_upsell', 'pro_plus_yearly_b1g1'] as const`; `PromoPlanId`; `isPromoPlanId`.

### Task C (omp): pricing surfaces, banners, terms

**Files:**
- `src/lib/billing/pricing-view.ts`, `src/components/PricingModal.tsx`, `src/components/public/PricingPlans.tsx`: the upsell banner on the Pro Năm card, the B1G1 banner on the Pro Plus Năm card, both reading `GET /api/offers/launch`.
- `src/lib/i18n/addons-copy.ts` (or a new `promo-copy.ts`): 9 languages.
- `apps/marketing/pricing.mjs`, `site-content.mjs`, `client.js`: the same banners on marketing, using the same endpoint as the founding count.
- `apps/marketing/legal-content.mjs`: one terms paragraph per offer covering price, slots, the end date, no stacking with the referral discount and refunds; plus the tests.

**Acceptance:** the touched tests pass; the marketing build passes.

### Task D (agy): docs

`docs/huong-dan/07-goi-va-thanh-toan.md` (+ `i18n/en`), `docs/affiliate-program.md` (commission examples 138000 / 158000; no stacking), `docs/claims-ledger.md` (one row per offer).

Then the coordinator runs `npm run guide:build`.
