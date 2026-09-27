# Phase 2: Child-Profile Save Reliability

## Objective

Make first and subsequent permitted child-profile creation transactional, idempotent, and recoverable, with clear user-facing feedback that preserves entered data.

## Depends On

- Phase 1 diagnostic evidence and error contract.

## Likely Change Surface

- `src/components/OnboardingModal.tsx`
- `src/components/ParentDashboard.tsx`
- `src/lib/store/profile-actions.ts`
- `src/lib/store/profile-mutation-client.ts`
- `src/app/api/domain/profiles/route.ts`
- Profile mutation RPC/migration and associated tests
- Locale dictionaries for all supported languages

## Work

1. Correct the proven server/database cause while preserving membership and child-limit enforcement.
2. Make create-profile submission idempotent so double taps, retries, and slow networks cannot create duplicates.
3. Return a stable error code and correlation ID for validation, authentication, authorization, child-limit, conflict, and temporary-service failures.
4. Map those codes to plain user language; keep name, birthday, avatar, and other entered values after a failed save.
5. Treat “write committed but refresh failed” as a successful creation followed by a retryable refresh, not as permission to create again.
6. Disable duplicate submits while pending and restore focus to the relevant field or error summary.
7. Add targeted tests for first child, allowed additional child, limit reached, duplicate request, unauthenticated request, and temporary network failure.

## Acceptance Criteria

- [ ] An authenticated parent can create the first child once and immediately sees the new profile.
- [ ] A repeated request with the same idempotency key returns the same profile and creates no duplicate.
- [ ] A rejected save preserves all entered values and provides a specific next action plus a support correlation ID.
- [ ] Server-side membership and child-limit checks cannot be bypassed by the client.
- [ ] Profile creation works from both onboarding and parent management surfaces.

## Validation

- Unit/integration tests for the mutation contract and client mapping.
- Database transaction test covering commit, rollback, duplicate request, and returned row.
- Real-browser mobile and desktop profile creation against a non-production project.
- Run `npm run test:api -- tests/api/profile-mutations.test.ts` and `npm run test:unit -- tests/unit/profile-mutation-client.test.ts tests/unit/profile-actions.test.ts`; expect all error-code, retry, and idempotency assertions to pass.
- Run `npm run test:e2e -- tests/e2e/profile-mutation.spec.ts`; submit once, double-tap, simulate a failed refresh, reload, and observe exactly one child with preserved form input on true rejection.

## Risks and Rollback

- RPC replacement can break existing callers. Keep one versioned transaction boundary and deploy API/database changes in a compatible order.
- Roll back application code first only if the prior RPC remains compatible; otherwise use the migration rollback documented with the schema change.
