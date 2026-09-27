# Phase 3: Cloud-Only Family Data

## Objective

Remove the local/cloud product choice and make cloud persistence authoritative for authenticated family data while retaining a safe, isolated no-account demo.

## Depends On

- Phase 1 storage inventory.
- Phase 2 reliable cloud profile mutation.

## Likely Change Surface

- `src/lib/store/**`
- `src/lib/store/cloud-family-sync.ts`
- `src/lib/store/cloud-identity-session.ts`
- `src/lib/store/use-cloud-family-identity.ts`
- `src/components/ParentSettingsTab.tsx`
- `src/components/Header.tsx`
- `src/app/page.tsx`
- Local persistence lifecycle and hydration tests
- Onboarding, docs, FAQ, and all locale dictionaries

## Data Ownership Contract

| Data | Authority |
|---|---|
| Family, profiles, tasks, completions, points, rewards, journeys, subscriptions | Cloud database |
| Anonymous product demo | Ephemeral isolated demo state |
| Theme, language, font size, short-lived session hints | Browser preference/session storage |

## Work

1. Replace public `storageMode` branching with explicit session roles: anonymous visitor, isolated demo, authenticated parent, and paired child.
2. Remove the storage-mode selector, local-family setup CTA, and copy that asks users to choose where family data is stored.
3. Route every authenticated family mutation through cloud commands; remove local fallback behavior that could silently diverge.
4. Keep optimistic UI only where rollback and reconciliation are defined.
5. Detect whether any non-demo local family records exist in previously shipped keys. If they do, provide a one-time authenticated import with preview and explicit confirmation; if they do not, remove the dead keys without inventing a migration wizard.
6. Ensure demo data cannot be promoted to or mixed with a real family accidentally.
7. Update tests, docs, and translated copy to say “đồng bộ đám mây” without naming infrastructure vendors.

## Acceptance Criteria

- [ ] No user-facing local/cloud mode choice remains.
- [ ] Authenticated family-domain mutations have no browser-local authoritative or fallback path.
- [ ] Refreshing or using a second device returns the same server state.
- [ ] Demo remains usable without sign-in and cannot contaminate authenticated data.
- [ ] UI preferences still persist locally as intended.
- [ ] Any legacy local-data decision is based on observed shipped data, not assumption.

## Validation

- Search/type checks show no domain mutation branch on `storageMode`.
- Browser tests cover visitor demo, Google parent session, paired-child session, offline failure, reconnect, refresh, and second device.
- Verify no family-domain payload is written to local storage during authenticated use.
- Run `npm run test:unit -- tests/unit/local-family-persistence.test.ts tests/unit/cloud-family-sync.test.ts tests/unit/cloud-identity-session.test.ts`; expect only demo/session/UI preferences to retain browser-local behavior.
- Run `npm run test:e2e -- tests/e2e/entry-journey.spec.ts tests/e2e/family-isolation.spec.ts`; inspect `localStorage` after authenticated mutations and observe no authoritative family payload, then refresh and confirm the cloud state returns.
- Before using `npm run verify:live-boundaries`, change the script to require an explicit staging project reference and opt-in flag, and to reject the known production project reference. Only then run it against approved staging; expect synthetic parent/child tenancy and second-session reads to remain isolated, followed by verified cleanup.

## Risks and Rollback

- Removing an unnoticed local dataset could lose user-created records. Inventory shipped keys and gate deletion on evidence.
- Cloud outages must fail visibly and preserve form state; do not silently write a competing local copy.
- The current live-boundary script defaults to a fixed project and creates synthetic accounts/data; it must not run until the staging-only preflight guard above exists.
