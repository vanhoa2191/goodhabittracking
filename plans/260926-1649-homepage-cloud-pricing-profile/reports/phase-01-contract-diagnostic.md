# Phase 1 Contract and Diagnostic Freeze

Date: 2026-09-27
Plan: `goodhabittracking/260926-1649`
Status: complete

## Proven profile-save boundary

Production has the required RPC, consent table, and child-limit trigger. A read-only production aggregate check returned three families, zero child profiles, and two active subscriptions; no identifiers or personal data were read.

The deterministic defect is in the client command boundary: after `requestProfileMutation()` returns a committed `profileId`, `profile-actions.ts` returns the result of the broad `syncCloudFamily()` refresh. If any refresh query fails, the client reports the profile as unsaved even though the command committed. A focused failing test proves this boundary. Retrying can submit a new UUID and create a duplicate.

The onboarding surface also uses the same visible message when `/api/privacy/consent` fails before the profile request. The two boundaries must receive separate error contracts. Historical logs cannot distinguish the original incident because the current Supabase plan retains one day.

## Capability matrix

| State | `maxChildren` | Read existing family data | Domain writes | Checkout shown | Notes |
|---|---:|---|---|---|---|
| eligible trial | unlimited | yes | yes after explicit activation | 29k, 49k, 399k | 7 days, no card, no automatic charge |
| active trial | unlimited | yes | yes until `trial_ends_at` | 29k, 49k, 399k | expiry never deletes data |
| `solo_monthly` | 1 | yes | yes within one-child limit | 49k, 399k upgrade | `Gói Một Bé`, 29.000đ/month |
| `monthly` | unlimited | yes | yes until `subscription_ends_at` | 399k alternative | `Gói Gia Đình · Tháng`, 49.000đ/month |
| `yearly` | unlimited | yes | yes until `subscription_ends_at` | none required | `Gói Gia Đình · Năm`, 399.000đ/year |
| grandfathered `lifetime` | unlimited | yes | yes indefinitely | none | never sold or auto-converted |
| legacy `free` / no entitlement | 0 new children | yes | no new domain writes | trial if eligible, then paid plans | not customer-facing as a plan |
| expired | current stored count | yes | no domain writes | 29k, 49k, 399k | retain all data |
| cancelled before paid end | paid-plan limit until end | yes | yes until end, then no | renewal plans | cancellation does not shorten paid access |

`monthly` and `yearly` identifiers remain stable. `solo_monthly` is the only new paid identifier.

## Local/cloud branch inventory

| Owner | Classification | Decision |
|---|---|---|
| `store/profile-actions.ts` | family-domain mutations | remove local branch; cloud command only |
| `store/activity-actions.ts` | family-domain mutations | remove local branch; cloud command only |
| `store/habit-actions.ts` | family-domain mutations/reviews | remove local branch; cloud command only |
| `store/reward-actions.ts` | family-domain mutations | remove local branch; cloud command only |
| `store/social-actions.ts` | family-domain groups/kudos | remove local branch; cloud command only |
| `store/family-pause-actions.ts` | family-domain configuration | remove local branch; cloud command only |
| `store/journal-actions.ts` and local letter paths | family-domain journal/letter state | remove local family writes; retain demo-only state where explicitly isolated |
| `store/local-family-persistence.ts`, `use-local-family-lifecycle.ts`, `local-domain-actions.ts`, `family-backup.ts` | authoritative browser family data | remove from signed-in product; do not silently migrate browser data into a real family |
| `ParentSettingsTab.tsx`, `Header.tsx`, locale storage copy | user-facing storage choice/status | remove selector and “local/private” product language; say “Đồng bộ cloud” where status is useful |
| `use-pairing-lifecycle.ts`, pairing markers and child session keys | short-lived paired-device session | retain; not authoritative family storage |
| demo session data | demo data | retain only in isolated session storage; clear when real identity starts |
| language, theme, font, sound | UI preference | retain locally |
| analytics consent | privacy preference | cloud when signed in; only privacy-safe local bootstrap if needed |
| tests using `storageMode` | contract coverage | replace family-local tests with cloud command tests; keep explicit demo/session/UI-preference tests |

## Stable operational error contract

Profile and consent responses may expose only:

- a stable allow-listed code;
- HTTP status;
- a random correlation ID;
- a plain-language next action.

Profile codes: `authentication_required`, `family_membership_required`, `invalid_profile_mutation`, `child_limit_reached`, `profile_not_found`, `profile_conflict`, `profile_service_unavailable`, `profile_mutation_failed`.

Consent codes: `consent_invalid`, `consent_service_unavailable`, `consent_save_failed`.

Never log or return child names, birth years, activity text, family/user/profile IDs, tokens, pairing codes, payment account details, raw database errors, or request bodies.

## Analytics freeze

Events are recorded only after analytics opt-in:

| Event | Allowed fields |
|---|---|
| `pricing_viewed` | locale, anonymous surface |
| `checkout_started` | plan: `solo_monthly`, `monthly`, `yearly` |
| `payment_activated` | plan only |
| `profile_save_succeeded` | operation: create/update/delete; refresh: succeeded/failed |
| `profile_save_failed` | operation; stable error code |

No event may include names, contact data, child attributes, free text, identifiers, URLs with query data, pairing codes, bank/payment details, or raw errors. Correlation IDs stay in operational logs and support messages, not product analytics.

## Phase 2 implementation boundary

1. Separate command commit from broad refresh success.
2. Preserve one client-generated profile UUID across retries so create is idempotent.
3. Map server failures to stable codes and correlation IDs.
4. Keep onboarding values on true rejection and distinguish consent from profile errors.
5. Enforce membership and child limits in the database, never from client state alone.
