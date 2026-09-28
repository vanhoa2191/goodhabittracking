---
title: "Phase 2 Data and Claim Inventory"
status: draft-reviewed-from-source
date: 2026-09-28
---

# Phase 2 Data and Claim Inventory

## Verified data and purpose

| Category | Purpose | Source |
|---|---|---|
| Parent identity, display name, email, optional phone, marketing choice | Account access and customer support | `src/app/api/account/profile/route.ts`, `supabase/migrations/202609210005_customer_admin.sql` |
| Family and child profiles | Scope every child-facing and parent-facing action to one family | `supabase/migrations/202609190001_family_tenancy.sql` |
| Habits, logs, points, rewards, badges, groups and kudos | Core habit and reward experience | `supabase/migrations/202609190001_family_tenancy.sql` |
| Pairing credentials and device sessions | Connect one child profile to a device, rotate/revoke access and rate-limit abuse | `supabase/migrations/202609190002_secure_pairing.sql`, `202609210003_persistent_pairing_credentials.sql` |
| Journal, wishlist, deferrals and dream-city purchases when enabled | Optional child experience features | migrations `20260923*` through `20260926*`; feature flags in `docs/deployment.md` |
| Subscription, payment order and entitlement | Create PayOS order, verify webhook and activate the paid period | `src/app/api/payment/*`, `supabase/migrations/202609190003_billing_integrity.sql` |
| Consent history | Record required child-data consent and separate analytics/reminder choices | `src/app/api/privacy/*`, `supabase/migrations/202609190005_privacy_lifecycle.sql` |

## Verified consent controls

- Cloud onboarding records privacy and child-data consent by policy version.
- Analytics and parent reminders are separate opt-in controls with revocation timestamps.
- Marketing consent is optional in the parent profile.
- Public leaderboard identity has a separate parent-controlled projection.
- Journal copy explicitly excludes journal text from measurement.

## Retention, export and deletion

- Family owner deletion is implemented by `DELETE /api/family` and `delete_owned_family`; family-scoped domain rows cascade.
- The code does not define an automatic inactivity-retention period.
- Payment orders can remain detached from the deleted family because their family foreign key uses `on delete set null`.
- Journal CSV export exists. A complete cloud-family export is described in older documentation but no current UI/API proves that claim; public copy therefore says to request other data through support.
- Operator backup targets in `docs/data-recovery.md` are operational goals, not a user-facing retention promise.

## Verified commercial claims

- One-time 7-day trial; no credit card and no automatic charge after expiry.
- Current paid plans in code: 29,000 VND/month for one child, 49,000 VND/month for family, 399,000 VND/year for family.
- Checkout creates a single PayOS transfer order. No recurring debit API exists.
- Entitlement activation is driven by verified payment status/webhook and idempotent database transitions.

## Claims safe only with qualifications

- “Đồng bộ đám mây đa thiết bị” only when the user is signed in and production migrations are current.
- “PayOS/VietQR tự động” only when production secrets and webhook are correctly configured.
- “50+ thói quen” is catalog-dependent and must not imply an educational outcome.

## Owner/legal decisions still required

- `[CẦN DUYỆT]` Official support inbox configured as `SUPPORT_EMAIL`.
- `[CẦN DUYỆT]` Exact refund eligibility, evidence, decision owner and response window.
- `[CẦN DUYỆT]` Retention period for transaction/support/security records after family deletion.
- `[CẦN DUYỆT]` Legal entity/controller identity and jurisdiction text, if a public policy must name them.
- `[CẦN DUYỆT]` The statement that the current product does not sell child data, as a durable business commitment rather than merely an observation of current code.

Until these decisions are approved, `NEXT_PUBLIC_LEGAL_PAGES_APPROVED` must remain `false`; routes stay `noindex`, footer links are hidden and checkout keeps its existing flow.
