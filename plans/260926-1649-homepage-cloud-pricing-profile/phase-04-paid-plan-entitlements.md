# Phase 4: Paid Plan and Entitlement Model

## Objective

Replace the customer-facing free tier with a 29k one-child plan, preserve the 49k and 399k offers, and enforce every entitlement consistently from UI through PayOS and the database.

## Depends On

- Phase 1 approved offer matrix.
- Phase 2 profile command behavior.
- Phase 3 cloud-authoritative family data.

## Proposed Offer Contract

| Stable ID | Customer name | Price | Child limit | Billing |
|---|---|---:|---:|---|
| `solo_monthly` | Gói Một Bé | 29.000đ | 1 | monthly |
| `monthly` | Gói Gia Đình · Tháng | 49.000đ | current family/unlimited entitlement | monthly |
| `yearly` | Gói Gia Đình · Năm | 399.000đ | current family/unlimited entitlement | yearly |

Customer-facing labels are **Khởi đầu nhẹ nhàng**, **Phổ biến nhất**, and **Tiết kiệm nhất**, respectively. The yearly card may state the verified 189.000đ saving versus twelve monthly payments.

The existing explicit 7-day trial remains an onboarding state, not a fourth purchasable card. `free` may survive temporarily only as an internal legacy/no-entitlement value during migration.

Existing `lifetime` subscriptions are grandfathered indefinitely with their current entitlement. They remain valid in authorization and admin history but are removed from every new-sale, checkout, and marketing surface.

## Likely Change Surface

- `src/lib/payos.ts` and checkout schemas/routes
- Subscription types, selectors, and pricing components
- PayOS webhook/order activation logic
- Child-limit functions/triggers and subscription migrations
- Admin member/subscription management and coupon handling
- Analytics events, docs, FAQ, and locale dictionaries

## Work

1. Add `solo_monthly` without renaming `monthly` or `yearly`, preserving existing order and subscription references.
2. Replace broad `isPro` decisions with explicit capabilities such as `canWrite`, `maxChildren`, and feature access.
3. Enforce the one-child limit server-side for 29k; keep the existing family entitlement for 49k and 399k.
4. Remove free and lifetime offers from customer UI, new checkout input, onboarding defaults, and public documentation while continuing to honor existing lifetime records.
5. Define safe behavior for no-entitlement/expired/cancelled families: existing data stays readable, no records are deleted, and new domain writes guide the parent to trial or purchase.
6. Validate PayOS plan ID, expected amount, order ownership, signature, idempotency, and webhook activation for all three paid offers.
7. Update admin controls, coupons, reporting, and customer-service views to recognize the new plan and preserve an auditable history.
8. Migrate existing subscriptions without charging or automatically converting anyone: active lifetime remains lifetime indefinitely; monthly/yearly retain their IDs; legacy free becomes no-entitlement/read-only; historical orders remain immutable.

## Acceptance Criteria

- [x] Pricing and checkout expose exactly 29k, 49k, and 399k paid offers plus explicit trial guidance.
- [x] 29k permits one child and rejects a second child with a clear upgrade path at the server boundary.
- [x] 49k and 399k retain current entitlements and existing subscribers remain active.
- [x] Existing lifetime families retain indefinite access, while no new lifetime checkout can be created.
- [x] PayOS activation occurs only for the matching signed order, expected amount, and family.
- [x] Duplicate callbacks are idempotent and cannot extend or duplicate the subscription incorrectly.
- [x] Expiry never deletes family data or silently downgrades existing records.

## Validation

- Contract tests for offer registry, checkout input, signed callback, amount mismatch, duplicate callback, and entitlement projection.
- Migration tests using snapshots for trial, legacy free, active monthly, active yearly, expired, cancelled, and any prior lifetime record.
- Controlled PayOS sandbox/test transactions when available; otherwise use signed fixture verification and one explicitly approved low-value production smoke transaction.
- Run `npm run test:api -- tests/api/payment-create.test.ts tests/api/payment-webhook.test.ts tests/api/payment-status.test.ts` and `npm run test:unit -- tests/unit/payos-signature.test.ts tests/unit/store-subscription.test.ts`; expect exact-plan/amount/signature/idempotency and grandfathered-lifetime cases to pass.
- Run `npm run test:e2e -- tests/e2e/payment-return.spec.ts`; exercise each public plan with mocked signed callbacks and observe one activation, while lifetime is absent from checkout.

## Risks and Rollback

- Billing mistakes have financial impact. Deploy schema compatibility first, application second, and public pricing last.
- Keep a reversible entitlement mapping, preserve grandfathered lifetime authorization, and do not mutate historical orders.
