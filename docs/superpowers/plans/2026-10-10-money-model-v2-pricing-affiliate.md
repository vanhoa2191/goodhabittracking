# Money Model v2 — Monthly Prices & Affiliate Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app charge and pay out exactly what Money Model v2.0 says: monthly prices 49.000 / 69.000 and a 20% referral commission that is paid only on yearly plans and Lifetime.

**Architecture:** Prices live in one TypeScript catalog (`src/lib/billing/plan-catalog.ts`) that the UI, marketing site and PayOS labels derive from. The database repeats the prices in `create_family_payment_order`, with a drift test that keeps the two in sync. Commission rules live in `accrue_referral_commission` and in the `affiliate_settings` row. One new migration changes both SQL functions and the settings row. Copy and docs are then updated to match.

**Tech Stack:** Next.js + TypeScript, Vitest, Supabase Postgres migrations, `@libpg-query/parser` for SQL parse tests, disposable-Postgres runners in `scripts/verify-local-*.mjs`, Playwright e2e.

**Spec:** `~/Downloads/KidHabit_Hero_Money_Model.pdf` (Money Model 2026-v2.0, 10/10/2026), plus the owner's decisions of 10/10/2026: Solo Năm **does** earn commission; the +5% tiered bonus is **out of scope**; a discounted price is **rounded down to the nearest 1.000 đ**; the checkout says **"Ba/mẹ được giảm X đồng thông qua giới thiệu của {tên người giới thiệu}"**.

This is plan 1 of 4. Later plans, each needing its own spec decisions:
2. Lifetime VIP 1.990.000 đ, 100 slots (sellable plan; commission rule is already added here).
3. Pro Plus AI add-on +299.000 đ/năm with a usage cap (replaces the announced 79k/790k Pro Plus tier and gates parent AI).
4. Printable & Ebook add-on 99.000 đ.

## Global Constraints

- Solo (Gói Cơ bản): **49.000 đ/tháng**, 399.000 đ/năm (yearly unchanged).
- Pro: **69.000 đ/tháng**, 590.000 đ/năm (yearly unchanged).
- Pro Plus announced prices (79.000 / 790.000) are **not touched** in this plan (plan 3 owns them).
- Commission: **20%** (`commission_bps = 2000`) of the amount actually paid, rounded down. Only orders with `plan_id in ('solo_yearly', 'yearly', 'lifetime')` earn it. Monthly orders never earn commission.
- Referred-family discount stays **10%** (`referred_discount_bps = 1000`) on the first yearly order of either tier. The charged amount is then **rounded down to the nearest 1.000 đ**: `charged = floor((list − floor(list × bps / 10000)) / 1000) × 1000` (Solo Năm 399.000 → 359.000, discount 40.000; Pro Năm 590.000 → 531.000, discount 59.000).
- Checkout copy (vi, exact): `Ba/mẹ được giảm {X} thông qua giới thiệu của {tên}.` X = list price − charged, formatted like other prices (`40.000 ₫` style of `formatCurrency`). {tên} = the referrer's `parent_profiles.display_name`, trimmed; when it is empty, use `một phụ huynh khác` (vi) / `another parent` (en).
- Commissions already recorded keep their stored `rate_bps` and `amount` (no rewrite of history).
- `affiliate_settings.terms_version` becomes **`'2026-10-10'`**, so every enrolled referrer must accept the new terms before sharing or withdrawing (existing behaviour of `terms_version`).
- Reference amounts the tests must hit: Pro Năm referred → pays 531.000, commission **106.200**; Solo Năm referred → pays **359.000**, commission **71.800**; any monthly order → commission **0**.
- No tiered bonus, no new admin settings.

## Review Focus

1. **A monthly order created at the old price (39.000 / 59.000) before deploy, then paid after.** Webhook compares against the stored order amount (`process_payos_webhook`, `target_order.amount <> incoming_amount`), so it must still settle. Pinned in Task 2 scenario `old_price_pending_settles`.
2. **A referred family pays monthly inside the 365-day window, then buys yearly.** The monthly payment earns nothing, and the yearly one still earns 20%. Pinned in Task 2 scenario `monthly_then_yearly`.
3. **A referrer with older 30% commissions.** Those rows keep `rate_bps = 3000` and their amounts. Pinned in Task 2 scenario `history_untouched`.
4. **A referrer with an empty display name, or a name containing HTML/emoji.** Checkout shows the fallback, or the name as plain text (React escapes it). Pinned in Task 3 tests.
5. **A referrer who accepted the 2026-10-09 terms.** They see the terms prompt again, because `termsAccepted` turns false. Pinned in Task 2 preflight assertion on `terms_version`.
6. **Copy that still promises commission "on every payment".** After Task 4, a grep finds no such claim in any language. Pinned by the Task 4 grep step.

---

### Task 1: Monthly prices in the TypeScript catalog

**Files:**
- Modify: `src/lib/billing/plan-catalog.ts:12-15`
- Test: `tests/unit/plan-catalog.test.ts`, `tests/unit/pricing-view.test.ts`, `tests/unit/marketing-pricing.test.ts`, `tests/unit/marketing-build.test.ts`, `tests/unit/payos-server.test.ts`, `tests/api/payment-create.test.ts`, `tests/e2e/checkout-entry.spec.ts`

**Interfaces:**
- Produces: `PLAN_PRICES.solo.month === 49000`, `PLAN_PRICES.pro.month === 69000`. Every consumer (`pricing-view.ts`, `payos.ts`, `upcoming-plans.ts`, marketing build) already derives from this.

- [ ] **Step 1: Update the test expectations first**
  - `plan-catalog.test.ts:56-57` → `solo: { month: 49000, year: 399000 }`, `pro: { month: 69000, year: 590000 }`.
  - `pricing-view.test.ts:15` → `[49000, 69000, 79000]`. Add an assertion that the yearly cards' `savingPercent` are `[32, 29, …]` for solo and pro (spec: 32,1% and 28,7%).
  - `marketing-pricing.test.ts:57-58` → `['solo', 'solo_monthly', 49000, 1630, true]`, `['pro', 'monthly', 69000, 2300, true]` (perDay = round(price/30, 10)).
  - `marketing-build.test.ts:569` → `['49000', '399000', '69000', '590000']`.
  - `payos-server.test.ts:70` → `['solo_monthly', 'Gói Cơ bản · Tháng', 49000]`. Line 11 fixture amount may stay (it is an arbitrary order amount).
  - `tests/api/payment-create.test.ts:68,88` → monthly 69000, solo_monthly 49000.
  - `tests/e2e/checkout-entry.spec.ts:16,18` → `'49.000'`, `'69.000'`.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/unit/plan-catalog.test.ts tests/unit/pricing-view.test.ts tests/unit/marketing-pricing.test.ts tests/unit/marketing-build.test.ts tests/unit/payos-server.test.ts tests/api/payment-create.test.ts`
Expected: FAIL on 39000/59000 vs 49000/69000.

- [ ] **Step 3: Change `PLAN_PRICES`** — `solo: { month: 49000, year: 399000 }`, `pro: { month: 69000, year: 590000 }`. Leave `pro_plus` alone.

- [ ] **Step 4: Run the same tests**
Expected: PASS, except `tests/unit/billing-price-drift.test.ts`, which now fails because the SQL still says 39000/59000. Task 2 fixes it, so commit Tasks 1 and 2 together or run Task 2 immediately.

- [ ] **Step 5: Commit** (after Task 2 makes the drift test green)

```bash
git commit -m "feat(billing): monthly prices 49k/69k per money model v2"
```

---

### Task 2: Migration — checkout prices, commission scope and rate

**Files:**
- Create: `supabase/migrations/202610100001_money_model_v2.sql`
- Create: `supabase/preflight/202610100001_money_model_v2.verify.sql`
- Create: `tests/integration/migrations/money-model-v2.test.ts`
- Create: `tests/integration/migrations/money-model-v2.scenarios.sql`
- Modify: `tests/unit/billing-price-drift.test.ts:8` (read the new migration)
- Modify: `scripts/verify-local-affiliate.mjs` (apply the new migration + run the scenarios after `affiliate-commission-unfreeze`)
- Modify: `scripts/verify-local-billing.mjs` (apply the new migration after `202610090010` and assert monthly checkout amounts)

**Interfaces:**
- Consumes: Task 1 prices.
- Produces: `create_family_payment_order(uuid, uuid, bigint, text, timestamptz)` with the same signature and return type `table(amount integer, discount_bps integer, existing_order_code bigint)`, and `accrue_referral_commission(bigint) returns void`. Same signatures and grants as today.

- [ ] **Step 1: Write `money-model-v2.test.ts`** following `pricing-tiers-launch-offer.test.ts` (read the file, `parse()` it, slice function definitions). Assertions:
  - migration and verify files parse as PostgreSQL;
  - `create_family_payment_order` contains `when 'solo_monthly' then 49000` and `when 'monthly' then 69000`, and still `399000` / `590000`;
  - `create_family_payment_order` rounds a discounted amount down to 1000 (`/ 1000` and `* 1000` on `charged`, only when `discount > 0`);
  - `accrue_referral_commission` contains `paid_order.plan_id not in ('solo_yearly', 'yearly', 'lifetime')` followed by `return`, before the commission is computed;
  - migration contains `commission_bps = 2000` and `terms_version = '2026-10-10'`;
  - both functions keep `security definer` and `set search_path = ''`, and the file re-issues the existing `revoke`/`grant` lines for both (service_role only).
- [ ] **Step 2: Point `billing-price-drift.test.ts` at `202610100001_money_model_v2.sql`.**
- [ ] **Step 3: Run** `npx vitest run tests/integration/migrations/money-model-v2.test.ts tests/unit/billing-price-drift.test.ts`. Expected: FAIL (file missing).
- [ ] **Step 4: Write the migration** inside `begin; … commit;`:
  1. Copy `create_family_payment_order` verbatim from `202610090010_billing_payment_hardening.sql` (the `drop function if exists` line too). Change the two monthly prices. After the existing `charged := greatest(1, …)` line, add `if discount > 0 then charged := greatest(1000, (charged / 1000) * 1000); end if;` (integer division).
  2. Copy `accrue_referral_commission` verbatim from `202610090020_affiliate_account_privacy_freeze.sql`. Right after the `select … into paid_order …; if not found … return; end if;` line, add `if paid_order.plan_id not in ('solo_yearly', 'yearly', 'lifetime') then return; end if;`.
  3. `update public.affiliate_settings set commission_bps = 2000, terms_version = '2026-10-10', updated_at = now() where singleton;`
  4. Re-issue the revoke/grant statements for both functions.
  Do not touch `referral_commissions` rows.
- [ ] **Step 5: Write the preflight verify** (pattern: `202610090020_affiliate_account_privacy_freeze.verify.sql`). It raises an exception unless `commission_bps = 2000`, `terms_version = '2026-10-10'`, `referred_discount_bps = 1000`, and both function bodies (`pg_get_functiondef`) contain the new text.
- [ ] **Step 6: Write `money-model-v2.scenarios.sql`.** One `select … as scenario, … as ok` row per case, same style as `affiliate-commission-unfreeze.scenarios.sql`:
  - `pro_yearly_referred`: PAID `yearly` order amount 531000 → one commission, amount 106200, rate_bps 2000.
  - `solo_yearly_referred`: PAID `solo_yearly` 359000 → 71800.
  - `monthly_no_commission`: PAID `monthly` 69000 and `solo_monthly` 49000 → no commission row.
  - `monthly_then_yearly`: the same referred family pays monthly, then yearly → exactly one commission (the yearly one).
  - `lifetime_referred`: PAID `lifetime` 1990000 → 398000.
  - `history_untouched`: a commission inserted before the migration with rate_bps 3000 keeps its rate and amount.
  - `old_price_pending_settles`: a PENDING `monthly` order created with amount 59000 settles through `process_payos_webhook` with incoming 59000 (status PAID), and earns no commission.
- [ ] **Step 7: Wire the runners.**
  - `verify-local-affiliate.mjs`: apply the migration + verify after the unfreeze block, run the scenarios, and fail on any `ok = false`.
  - `verify-local-billing.mjs`: apply the migration after the 090010 block. Assert `create_family_payment_order` returns 49000 for `solo_monthly`, 69000 for `monthly`, 359000 for a referred family's first `solo_yearly` and 531000 for a referred family's first `yearly`. Update the existing preflight/test assertions that expect 359100 (`grep -rn 359100 supabase scripts tests`).
- [ ] **Step 8: Run**
  - `npx vitest run tests/integration/migrations/money-model-v2.test.ts tests/unit/billing-price-drift.test.ts` → PASS
  - `npm run test:sql` → exit 0, all scenarios `ok`.
- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/202610100001_money_model_v2.sql supabase/preflight/202610100001_money_model_v2.verify.sql tests/integration/migrations/money-model-v2.* tests/unit/billing-price-drift.test.ts scripts/verify-local-affiliate.mjs scripts/verify-local-billing.mjs src/lib/billing/plan-catalog.ts tests/
git commit -m "feat(billing): 20% commission on yearly and lifetime only, monthly 49k/69k in checkout"
```

---

### Task 3: Checkout line "Ba/mẹ được giảm X đồng thông qua giới thiệu của …"

**Files:**
- Modify: `src/lib/i18n/referral-discount-copy.ts` (new signature, all 9 languages)
- Modify: `src/app/api/payment/create/route.ts:104` (discount payload)
- Modify: `src/lib/payos.ts` (checkout payment type: `discountPercent` → `discountAmount`, `referrerName`)
- Modify: `src/lib/billing/payment-client.ts`, `src/components/CheckoutPaymentDetails.tsx:116-118`
- Test: `tests/unit/referral-discount.test.ts`, `tests/unit/small-copy-languages.test.ts`, `tests/api/payment-create.test.ts`

**Interfaces:**
- Consumes: Task 2 rounded `amount` from `create_family_payment_order`.
- Produces: `referralDiscountLine(language: Language, discount: string, referrerName: string | null): string`. Checkout payment JSON gets `listPrice: number`, `discountAmount: number` (= listPrice − amount) and `referrerName: string | null`, replacing `discountPercent`. Old stored `checkout_payment` rows that still have only `discountPercent` must render without crashing (show no referral line, or the line with the fallback name).

- [ ] **Step 1: Tests first.**
  - `referral-discount.test.ts`: `referralDiscountLine('vi', '40.000 ₫', 'Lan')` === `'Ba/mẹ được giảm 40.000 ₫ thông qua giới thiệu của Lan.'`; with `null` and with `'  '` → `'… thông qua giới thiệu của một phụ huynh khác.'`; en → `'You save 40,000 ₫ thanks to a referral from Lan.'` (fallback `another parent`).
  - `small-copy-languages.test.ts`: every language returns a string containing both the amount and the name.
  - `payment-create.test.ts`: a referred `solo_yearly` order (mock RPC returns amount 359000, discount_bps 1000) responds with `listPrice: 399000`, `discountAmount: 40000`, `referrerName: 'Lan'`, and no `discountPercent`. Non-referred orders have none of the three fields.
- [ ] **Step 2: Run them** → FAIL.
- [ ] **Step 3: Look up the name in `payment/create`.** Only when `amount < plan.price`: with the admin client, read `referrals.referrer_user_id` for the family owner (same join `accrue_referral_commission` uses: `referrals.referred_user_id` = owner), then `parent_profiles.display_name` of that user. Trim it, cut it to 40 characters, and treat empty as `null`. A lookup error must not fail the checkout: log a warning and use `null`.
- [ ] **Step 4: Render** in `CheckoutPaymentDetails` with `formatCurrency(payment.discountAmount, language)`. The name goes in as plain text (no `dangerouslySetInnerHTML`).
- [ ] **Step 5: Affiliate terms disclosure.** In Task 4's copy pass, the referrer-facing terms (`affiliate-copy.ts` rules and `/gioi-thieu/`) must add: vi `Tên hiển thị của bạn sẽ hiện cho gia đình được giới thiệu khi họ thanh toán.` (and translations). The `terms_version` bump in Task 2 makes referrers re-accept.
- [ ] **Step 6: Run** `npx vitest run tests/unit/referral-discount.test.ts tests/unit/small-copy-languages.test.ts tests/api/payment-create.test.ts` → PASS; `npm run typecheck` → 0.
- [ ] **Step 7: Commit** `feat(checkout): show referral discount amount and referrer name`

---

### Task 4: Copy, help topics and docs

**Files:**
- Modify: `src/lib/i18n/affiliate-copy.ts` (lines 47, 49, 117 and the matching lines in every other language block in the file)
- Modify: `apps/marketing/legal-content.mjs:260,272` (`/gioi-thieu/` terms)
- Modify: `src/lib/guide/help-topics.ts`, `help-topics-{de,es,fr,it,ja,ko,zh}.ts` (plan prices and commission sentences)
- Modify: `docs/affiliate-program.md`, `docs/claims-ledger.md`, `docs/deployment.md`, `docs/huong-dan/07-goi-va-thanh-toan.md`, `08-gioi-thieu-ban-be.md`, `12-ban-do-lien-ket.md`, `13-thuat-ngu.md`, `README.md`, `docs/huong-dan/i18n/en/*`, `docs/huong-dan/translations-pending/*/*` (same files)
- Test: `tests/unit/i18n-batch-c-copy.test.ts` and any copy test that pins the old sentence

**Interfaces:**
- Consumes: the `percent` argument the copy functions already take from `overview.settings.commissionBps` (it becomes 20 automatically). Only the scope wording changes.

- [ ] **Step 1: Add a copy test** in the existing affiliate copy test file (or `tests/unit/i18n-batch-c-copy.test.ts` if that is where affiliate copy is pinned). For every language: `intro(20)` and the rules line contain `20` and do not contain the "every payment" phrase of that language (vi: `mỗi khoản thanh toán`, `mọi thanh toán`; en: `every payment`). The vi rules line mentions `gói Năm` and `Trọn đời`.
- [ ] **Step 2: Run it** → FAIL.
- [ ] **Step 3: Rewrite the sentences.** Vietnamese source wording (translate the same meaning in each language block):
  - intro: ``Chia sẻ liên kết của bạn. Khi một gia đình mới đăng ký qua đó và mua gói Năm hoặc gói Trọn đời, bạn nhận hoa hồng ${percent}% số tiền họ thực trả, và bạn bè được giảm 10% khi mua gói Năm đầu tiên.`` (keep any trailing text of the current line).
  - rules: ``Hoa hồng ${percent}% trên số tiền thực trả cho mỗi đơn gói Năm hoặc Trọn đời trong ${months} tháng đầu từ ngày tạo tài khoản người dùng được giới thiệu, không phải ngày tạo gia đình. Gói tháng không sinh hoa hồng.``
  - `legal-content.mjs`: the same rule, 20%, the description line too.
  - help topics: prices 49.000đ/tháng and 69.000đ/tháng (vi formatting per language as today); commission sentence as above.
  - docs: prices, `commission_bps | 2000`, `terms_version | 2026-10-10`, worked examples 106.200 đ (Pro Năm, 531.000 đ) and 71.800 đ (Solo Năm, 359.000 đ, giảm 40.000 đ), "gói tháng không sinh hoa hồng"; `verify:live-affiliate` example amount line in `affiliate-program.md:46` (399.000 → 119.700 becomes a yearly order at 20%).
- [ ] **Step 4: Run the copy test** → PASS. Then grep:

```bash
grep -rIn --exclude-dir={node_modules,.next,.git,dist,plans,test-results} -E "39[.,  ]000|59[.,  ]000|\b30 ?%|mỗi khoản thanh toán|every payment" src apps docs
```
Expected: no hit about plan prices or commission (unrelated "30%" hits such as CSS or chart values are fine; check each one).
- [ ] **Step 5: Check `scripts/verify-live-affiliate*`** (run by `npm run verify:live-affiliate`). If it asserts `399.000 → 119.700`, change the scenario to a yearly order at 20% (`399000 → 79800` without a referral discount, or `359000 → 71800` with one, whichever the script creates). Do not run it against production in this task.
- [ ] **Step 6: Commit**

```bash
git commit -m "docs(affiliate): 20% on yearly and lifetime, monthly prices 49k/69k"
```

---

### Task 5: Full verification

- [ ] **Step 1:** `npm run lint && npm run typecheck && npm test` → all exit 0.
- [ ] **Step 2:** `npm run test:sql` → exit 0.
- [ ] **Step 3:** `npx playwright test tests/e2e/checkout-entry.spec.ts tests/e2e/marketing-home.spec.ts`. Run only when no other worker is editing the tree (see memory: e2e concurrent-edit flakiness). Expected: pass with 49.000 / 69.000, and the referral line in `checkout-entry` (add an assertion there if the spec mocks a referred order).
- [ ] **Step 4: Deploy note for the PR description:** apply the migration with `db push` to project `evkwelozdcmsmwdzhlxz` (check the project ref first, per `docs/deployment.md`). Then run the preflight verify. Enrolled referrers will be asked to accept the 2026-10-10 terms.
