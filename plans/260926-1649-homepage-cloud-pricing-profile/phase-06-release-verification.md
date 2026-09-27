# Phase 6: Release Verification

## Objective

Ship the profile, cloud-only, entitlement, and homepage changes in a controlled order and prove the complete production customer journey.

## Depends On

- Phases 2-5 complete and reviewed.

## Release Order

1. Backward-compatible database migration and functions.
2. Server/API and entitlement logic.
3. Client cloud-only and profile behavior.
4. Pricing and homepage UI.
5. Production smoke verification and monitoring.

## Work

1. Run targeted tests first, then lint, typecheck, production build, migration checks, and the full relevant suite.
2. Review migration safety, payment signatures/amounts, authorization, privacy, and rollback instructions.
3. Commit and push focused changes only after all local gates pass.
4. Verify whether GitHub Actions actually has deployment credentials; a green job that skipped deploy is not release evidence.
5. If CI deployment is not configured, use the documented direct Cloudflare Worker deployment path with existing authorized credentials.
6. Verify `/api/health` returns HTTP 200, `ready`, and all dependency checks true.
7. Run production smoke paths with dedicated test identities and no personal data: landing → Google sign-in → parent app → first child save → refresh; demo isolation; pricing → checkout creation; signed activation using the safest available PayOS test method.
8. Confirm existing monthly/yearly families remain active and 29k enforces one child.
9. Monitor sanitized Worker errors, database errors, and failed payments after rollout; define rollback thresholds.
10. Update the owning user documentation and both plan records from observed release evidence.

## Required Commands and Observations

1. `npm run lint && npm run typecheck && npm run test`: exit 0 with no hidden or skipped critical contract failures.
2. `npm run build:cloudflare && npm run check:performance && npm run check:secrets`: exit 0; generated Worker bundle stays within the recorded budget and contains no detected secret.
3. `npm run release:verify`: exit 0 against the exact release candidate.
4. `npm run deploy:cloudflare`: use only after approval and green gates; record the deployment version without copying credentials.
5. `curl -fsS https://goodhabittracking.vanhoa2191.workers.dev/api/health`: receive HTTP 200 with `ready` and every dependency check true.
6. Run the Manual QA Matrix in a real browser using dedicated test identities; record sanitized screenshots/status and exact observed results.

## Acceptance Criteria

- [ ] Tests, lint, typecheck, build, and migration checks pass without hidden failures.
- [ ] Deployment is proven by production version/evidence, not inferred from a CI status.
- [ ] Health and every controlled production customer path pass.
- [ ] No secrets, PII, family data, or full payment details appear in logs or reports.
- [ ] Rollback can restore the prior application while preserving newly written compatible data and historical orders.
- [ ] `260923-0030-complete-experience-roadmap` is unblocked only after this plan's release evidence is recorded.

## Manual QA Matrix

| Journey | Required observation |
|---|---|
| New visitor | Sees truthful landing, demo path, trial guidance, and three paid offers |
| Returning parent | Opens parent app directly and can deliberately navigate to homepage |
| Paired child | Opens child UI only |
| Parent onboarding | Creates first child once; refresh retains it |
| 29k family | One child works; second child is rejected with upgrade guidance |
| 49k/399k family | Existing and newly allowed profiles retain current entitlement |
| Payment | Correct amount and plan activate once; mismatch and duplicate callbacks are safe |
| Cloud-only | Second device/refresh agrees; outage is visible and does not create local divergence |

## Rollback

- Roll back homepage/client first if presentation or routing fails.
- Disable the new 29k public offer if checkout or entitlement verification fails, without modifying existing subscriptions.
- Keep schema changes additive until the observation window passes; use the documented reversible mapping rather than deleting records.
