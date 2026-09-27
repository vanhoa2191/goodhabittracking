# Phase 1: Contract and Diagnostic Freeze

## Objective

Turn the requested product changes into testable contracts and make the child-profile failure observable before changing persistence, billing, or production data.

## Requirements

- Preserve the approved customer journey: visitor landing → Google sign-in → parent app → cloud-synced family → child profile.
- Confirm the offer matrix and user-visible names in `plan.md` before implementation.
- Keep the 7-day trial explicit, with no card and no automatic charge.
- Do not create a real PayOS charge or mutate production family data during diagnosis.
- Never expose database details, tokens, family identifiers, or personal data in UI errors or logs.

## Files and Surfaces to Inspect

- `src/components/OnboardingModal.tsx`
- `src/components/ParentDashboard.tsx`
- `src/lib/store/profile-actions.ts`
- `src/lib/store/profile-mutation-client.ts`
- `src/app/api/domain/profiles/route.ts`
- Supabase migrations defining `mutate_child_profile_command`, family membership, and child limits
- Current production Worker logs and sanitized request correlation, when available

## Work

1. Reproduce first-child creation with an authenticated test parent in a controlled environment.
2. Trace the request through the client, API route, RPC, membership check, child-limit trigger, and returned row.
3. Record the exact failing boundary and a sanitized correlation identifier; distinguish validation, authorization, conflict, quota, and unavailable-service failures.
4. Inventory all code paths and tests that branch on `storageMode`, and classify each item as family-domain data, demo data, session state, or UI preference.
5. Freeze a plan-capability matrix for trial, 29k, 49k, 399k, grandfathered lifetime, legacy free, expired, and cancelled states. Existing lifetime grants remain active indefinitely and cannot be newly sold.
6. Freeze analytics names for viewed pricing, checkout started, payment activated, profile save succeeded, and profile save failed, excluding personal data.

## Acceptance Criteria

- [x] The profile failure has a proven cause or a reproducible, instrumented boundary; no fix is based on a guessed database cause.
- [x] The plan-capability matrix defines `maxChildren`, write access, and checkout availability for every state.
- [x] Every current local/cloud branch has an owner and removal or retention decision.
- [x] Error and analytics payloads have explicit privacy constraints.

## Validation

- Reproduce with one signed-in test account and capture only sanitized status, error class, and correlation ID.
- Compare API response semantics with database logs without copying PII into reports.
- Review the contract with payment, profile, and persistence tests before implementation starts.
- Run `npm run test:api -- tests/api/profile-mutations.test.ts` and `npm run test:unit -- tests/unit/profile-actions.test.ts`; expect the current failure to be reproducible or the new diagnostic boundary to identify a stable error class.
- Run `npm run test:e2e -- tests/e2e/profile-mutation.spec.ts`; create one child from onboarding and one from parent management, observing one persisted row per submission.

## Risks and Rollback

- Diagnostic logging can leak user context. Use allow-listed fields and remove temporary detail before release.
- If production logs cannot prove the cause, reproduce against the same schema in staging rather than experimenting on live families.
