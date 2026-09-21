# Release Evidence

Date: 2026-09-21  
Release candidate commit: `73814211ef63a80bcce11ba005329ec6ce192e68`  
Evidence scope: immutable release candidate with clean local certification and GitHub CI

## Verified locally

| Gate | Evidence | Result |
|---|---|---|
| Lint | `npm run lint` | Pass, zero warnings |
| Types | `npm run typecheck` | Pass |
| Unit/API/integration | `npm run release:verify -- --allow-dirty` with safe non-production test credentials | Pass, 49 files / 185 tests, including PayOS verification-probe compatibility and official SDK canonicalization in addition to live database-readiness rejection, fail-closed configuration readiness, compromised credential rejection, signed-out auth handling, family-scoped domain CRUD, migration syntax, local/cloud transitions, pairing boundaries, billing validation, auth races, backup normalization, nine-locale parity, leaderboard privacy and subscription rules |
| Browser E2E | The same release harness started the production `next start` bundle on `127.0.0.1:3420`, required `/api/health` readiness, then ran Playwright | Pass, clean 46/46 desktop and mobile run in 2.0 minutes; harness stopped the process and port 3420 was verified clear. This is working-tree evidence because `--allow-dirty` was intentionally used; the real release gate forbids it |
| Accessibility | Axe serious/critical scan, modal keyboard flow, linked onboarding labels, document locale | Pass on desktop and mobile |
| Demo isolation | Explicit session sandbox, complete/undo task while observing `/api/domain/commands`, clean real-mode default | Pass, no domain mutation request or local-family contamination |
| Local lifecycle | Local-only onboarding, consent, seeded-data exclusion, JSON export, deletion, landing-page restore and reload | Pass on desktop and mobile with zero API mutations |
| Locale rendering | All nine document languages at desktop/mobile widths; localized landing samples, onboarding, demo content, child rewards, badges, header, parent approvals, habits, WIT library, age packs, journeys, rewards, children, analytics, settings, child-device connection and the 16-strength/7-giving guide; all 37 journey habits have native locale content | Pass for scoped rendering and horizontal overflow; guide matrix, giving and parent-modeling views captured at 375px and 1280px under `reports/phase-07-primary/` |
| Next.js production build | `npm run build` | Pass |
| Cloudflare bundle | `npm run build:cloudflare` | Pass with OpenNext 1.19.11 |
| Performance budget | `npm run check:performance` | Pass; total JS 2,092,143 bytes, largest chunk 936,185 bytes |
| Dependencies | `npm audit --audit-level=high` | Pass, zero known vulnerabilities |
| Secret scan | `npm run check:secrets` | Pass for 367 tracked and non-ignored files; Cloudflare bundle independently contains zero exposed PayOS credential fingerprint hits |
| Release preflight | `npm run release:verify` | Pass on clean commit `73814211ef63a80bcce11ba005329ec6ce192e68` with live Supabase readiness and safe non-production PayOS verifier values. The harness rejects exposed credential fingerprints, weak/missing pairing configuration, unsafe feature flags, non-HTTPS origin, dirty candidates and SHA mismatch before certification |
| GitHub CI | [Run 35549869780](https://github.com/vanhoa2191/goodhabittracking/actions/runs/35549869780) | Pass on the same immutable commit: quality job 1m10s; Chromium browser job 2m01s |
| Operational telemetry | Payment webhook, pairing exchange and domain-command failures emit allowlisted structured events with correlation IDs | Pass in targeted API/unit tests; production alert delivery pending |
| Diff hygiene | `git diff --check` | Pass |
| Visual QA | Existing localized baseline set plus fresh viewport captures for profile, reward and social create-failure/join-failure/local-success states at desktop 1280×720 and Pixel 7 1082×2202 under `test-results/{profile,reward,social}-mutation-*` | Profile, reward and group dialogs are portaled above the sticky header, lock background scroll, trap focus and retain fixed header/footer around internally scrolling content. Six social captures show full localized error/actions without clipping, 44px modal actions, non-overlapping leaderboard metadata and wrapping group-card content at both viewports; group reward copy and color use the documented amber semantic role. Independent final functional and visual-fidelity verdicts are recorded under `.omo/evidence/` |
| Store/component refactor QA | Live app and production bundle: complete and undo a demo habit while observing points/progress/badges, inspect Ranks/Pro, open and exercise all three portrait-guide tabs and its checklist, complete local setup/reload, create then edit a local activity/profile/reward/group, apply a four-item journey, attempt cloud activity/profile/reward/group saves without a session, earn stars, redeem/deliver a reward, revoke a child session and inspect signed-out pairing; unit-drive local habit transitions, single/batch activity mutations, profile/reward/social CRUD, device management, trial activation, domain-command responses, auth races and cloud rows through boundary validation | Pass; cloud mutation failures preserve visible state, local changes survive reload on desktop/mobile, unauthenticated cloud mutations cannot fall through to local state, malformed server payloads are rejected, local completion/undo/badge transitions remain atomic, device state remounts per parent, and sign-out clears family state; domain actions plus cloud identity, local persistence and pairing lifecycles now live in focused modules, `store.tsx` is reduced to 772 lines, `LeaderboardSection.tsx` is a 77-line coordinator backed by six focused components of 57 lines or fewer, and `Portrait16Modal.tsx` is a 189-line coordinator backed by three panels of 133 lines or fewer |

### Portrait guide decomposition QA

- Production-bundle E2E passed the complete English parent-secondary flow on desktop and Pixel 7, including opening the guide, switching to giving/modeling tabs, checking a reflection item, and closing the modal.
- Direct browser QA on the Vietnamese guide confirmed all three tabs, independent content scrolling, 1/5 checklist state, keyboard Escape close, and focus restoration to the `Tra cứu` trigger with no clipping or overlap at the active compact viewport.

## Cloudflare runtime smoke

The generated Worker was started with Wrangler on localhost and stopped cleanly after verification.

| Request | Observed |
|---|---|
| `GET /` | 200 |
| `GET /api/health` | 503, `degraded` when every config field is present but PostgREST rejects the supplied credential; `databaseConfig: true`, `databaseConnection: false` |
| `POST /api/family/code` | 404 |
| Unauthenticated `POST /api/payment/status` | 401 |
| Unsigned `POST /api/payment/webhook` | 400 |
| Unauthenticated `POST /api/domain/activities` | 401 |
| Unauthenticated `POST /api/domain/profiles` | 401 |
| Unauthenticated `POST /api/domain/rewards` | 401 |
| Unauthenticated `POST /api/domain/social` | 401 |
| Production CSP | Present; no development-only `unsafe-eval` |

## Production rollout evidence

| Surface | Result |
|---|---|
| Cloudflare Worker | `goodhabittracking` deployed at `https://goodhabittracking.vanhoa2191.workers.dev`; final verified version `6c40a736-feac-4249-8b62-f6dcbeee417b` |
| Runtime health | HTTP 200 `ready`; app, database configuration/connection, billing and pairing checks all true |
| PayOS credentials | New `kidhabitprod` channel created; Client ID, API key and checksum key stored as encrypted Worker secrets without entering the repository or release logs |
| PayOS webhook | Provider validation accepted and persisted `https://goodhabittracking.vanhoa2191.workers.dev/api/payment/webhook` |
| Invalid webhook signature | Schema-valid request with an invalid signature returns HTTP 401 and a correlation ID without database processing |
| Public security headers | HTTPS origin returns HSTS, CSP, MIME, referrer, permissions and framing controls |
| Build-secret isolation | Cloudflare wrapper removes server-only variables from build subprocesses and blocks non-empty server secrets in `.env.local`; post-build compromised fingerprint scan reports zero hits |
| Live family boundaries | `npm run verify:live-boundaries` created two confirmed synthetic parents, exercised anonymous denial, same-family family/private-row read-write, cross-family read/write and membership-escalation denial, then removed every synthetic user and family; independent cleanup query returned zero leftovers |

## Release blockers

1. Full two-device pairing/concurrency, production deletion and restore scenarios still require live E2E evidence against the migrated project.
2. Production alert delivery and a recovery restore drill remain unverified.
3. Child-privacy legal review depends on launch markets and remains a product-owner/legal gate.

## Independent security review

The source, dependency, secret, auth/RLS, pairing, payment and privacy boundaries were reviewed on 2026-09-21. No Critical or High finding remains in the release candidate. The bounded sign-off and its production evidence requirements are recorded in [security-sign-off.md](./security-sign-off.md). HSTS is enforced, while the supported CSP boundary and rejected nonce/SRI experiment are documented there; live RLS and ingress checks are verified rather than inferred from local tests.

## Production access audit

Access and rollout audit updated on 2026-09-21. No secret values were printed or written to the repository.

| Surface | Observed state | Consequence |
|---|---|---|
| Git remote | `origin/main` contains release candidate `73814211ef63a80bcce11ba005329ec6ce192e68` | The hardening implementation and visual evidence are immutable and remotely recoverable |
| GitHub Actions | [CI run 35549869780](https://github.com/vanhoa2191/goodhabittracking/actions/runs/35549869780) passed both jobs on the release candidate | Commit-bound quality and Chromium gates are green |
| Cloudflare Wrangler | Authenticated with Workers/Pages write access; `goodhabittracking` is deployed and healthy at its HTTPS workers.dev origin | Production candidate, encrypted secrets, security headers and invalid-signature ingress are live; alert/rollback evidence remains |
| Supabase CLI | Linked to healthy project `kidhabithero`; migrations `202609190001` through `202609210001` are applied and remote history matches local | Live schema rollout is complete; credentialed behavior matrix remains |
| Supabase live verification | Preflight found six empty legacy tables and two absent billing tables; migrations were validated under forced rollback, applied, then verified; the automated live boundary runner exercised anonymous, same-family and cross-family access with ephemeral accounts | 21/21 expected tables exist, 1/1 pre-existing auth user has a family membership, quarantine is empty, all protected tables force RLS, no `auth.uid() IS NULL` policy remains, the live access matrix passes, and cleanup left zero synthetic users/families |
| Local release environment | `.env.local` server secrets are empty and Cloudflare build wrappers strip inherited server-only variables | Build-time secret inlining is blocked while runtime secrets remain encrypted platform bindings |
| Runtime dependency readiness | Live `/api/health` returns HTTP 200 `ready` with every dependency check true | Production configuration is connected; invalid credentials remain covered by fail-closed tests |

The pre-migration schema/data/role dump, preflight, rollback-validation transcript and post-migration schema are mode-600 files with a checksum manifest outside the repository at `/Volumes/DATA/Backups/goodhabittracking/pre-migration-20260921-9DRc5Q`. No secret values, access tokens, user rows or provider credentials were printed or recorded in release evidence.

## Promotion decision

Production candidate: deployed and approved for credentialed behavior testing.  
General availability: blocked until the remaining full two-device, alert/restore and legal gates are closed.
