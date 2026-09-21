# Release Evidence

Date: 2026-09-21  
Release candidate implementation commit: `e5c249e9663ef578aadd0943b0c8cc2aa077515a`
Evidence scope: immutable implementation candidate with GitHub CI and production lifecycle certification

## Verified locally

| Gate | Evidence | Result |
|---|---|---|
| Lint | `npm run lint` | Pass, zero warnings |
| Types | `npm run typecheck` | Pass |
| Unit/API/integration | `npm test` after the adaptive locale boundary was added | Pass, 51 files / 209 tests, including 17 language-detection cases plus session-derived child commands, PayOS verification-probe compatibility, live database-readiness rejection, fail-closed configuration readiness, compromised credential rejection, signed-out auth handling, family-scoped domain CRUD, migration syntax, local/cloud transitions, pairing boundaries, billing validation, auth races, backup normalization, nine-locale parity, leaderboard privacy and subscription rules |
| Browser E2E | Production-bundle Playwright on desktop and mobile, with CI Chromium replay | Pass, 74/74 local desktop/mobile tests; GitHub CI Chromium browser job also passed on the implementation commit |
| Accessibility | Axe serious/critical scan, modal keyboard flow, linked onboarding labels, document locale | Pass on desktop and mobile |
| Demo isolation | Explicit session sandbox, complete/undo task while observing `/api/domain/commands`, clean real-mode default | Pass, no domain mutation request or local-family contamination |
| Local lifecycle | Local-only onboarding, consent, seeded-data exclusion, JSON export, deletion, landing-page restore and reload | Pass on desktop and mobile with zero API mutations |
| Locale rendering | All nine document languages at desktop/mobile widths; adaptive first-visit selection uses saved preference, Cloudflare country and `Accept-Language` in that order, with English fallback; metadata, onboarding, demo content, child rewards, badges, header, parent approvals, habits, WIT library, age packs, journeys, rewards, children, analytics, settings, child-device connection and the 16-strength/7-giving guide are localized | Pass for scoped rendering and horizontal overflow. Cookie/localStorage reconciliation, malformed quality values and unsupported locales are covered by unit/E2E tests; 18 fresh desktop/mobile captures cover all nine locales, including CJK wrapping |
| Next.js production build | `npm run build` | Pass |
| Cloudflare bundle | `npm run build:cloudflare` | Pass with OpenNext 1.19.11 |
| Performance budget | `npm run check:performance` | Pass; total JS 2,095,536 bytes, largest chunk 939,526 bytes |
| Dependencies | `npm audit --audit-level=high` | Pass, zero known vulnerabilities |
| Secret scan | `npm run check:secrets` | Pass for 375 tracked and non-ignored files; Cloudflare bundle independently contains zero exposed PayOS credential fingerprint hits |
| Release preflight | `npm run release:verify` | The clean SHA-bound harness passed on the previous documentation-only release commit; the adaptive-locale implementation then passed the same lint, type, unit, build and browser components in GitHub CI plus production health and locale probes. The harness rejects exposed credential fingerprints, weak/missing pairing configuration, unsafe feature flags, non-HTTPS origin, dirty candidates and SHA mismatch before certification |
| GitHub CI | [Run 35581502489](https://github.com/vanhoa2191/goodhabittracking/actions/runs/35581502489) | Pass on `e5c249e9663ef578aadd0943b0c8cc2aa077515a`: quality and Chromium browser jobs succeeded |
| Operational telemetry | Payment webhook, pairing exchange and domain-command failures emit allowlisted structured events with correlation IDs | Pass in targeted API/unit tests; live health and platform signals are checked by the active hourly monitor |
| Production monitor | Active hourly Codex heartbeat `Giám sát production KidHabit` checks live dependency readiness, latest GitHub CI, Cloudflare Worker signals and Supabase health when available | Active; quiet while healthy and configured to notify only on a new failure, severity increase, recovery, lost visibility or required user action |
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
| Cloudflare Worker | `goodhabittracking` deployed at `https://goodhabittracking.vanhoa2191.workers.dev`; adaptive-locale implementation version `247f181b-1740-4709-b6ca-0f3d34ff6f48` |
| Runtime health | HTTP 200 `ready`; app, database configuration/connection, billing and pairing checks all true |
| Adaptive locale smoke | A production request with `kidhabit_language=fr` returned HTTP 200 with `lang=fr` and localized French title and description |
| PayOS credentials | New `kidhabitprod` channel created; Client ID, API key and checksum key stored as encrypted Worker secrets without entering the repository or release logs |
| PayOS webhook | Provider validation accepted and persisted `https://goodhabittracking.vanhoa2191.workers.dev/api/payment/webhook` |
| Invalid webhook signature | Schema-valid request with an invalid signature returns HTTP 401 and a correlation ID without database processing |
| Public security headers | HTTPS origin returns HSTS, CSP, MIME, referrer, permissions and framing controls |
| Build-secret isolation | Cloudflare wrapper removes server-only variables from build subprocesses and blocks non-empty server secrets in `.env.local`; post-build compromised fingerprint scan reports zero hits |
| Live family boundaries | `npm run verify:live-boundaries` created two confirmed synthetic parents, exercised anonymous denial, same-family family/private-row read-write, cross-family read/write and membership-escalation denial, then removed every synthetic user and family; independent cleanup query returned zero leftovers |
| Live family lifecycle | `npm run verify:live-lifecycle` paired a child device, denied code replay, completed a habit with session-derived child scope, approved it as the parent, redeemed and delivered a reward, restored both records on reconnect, revoked the device, proved the revoked session returned 401, then deleted the family through the owner API; independent cleanup found zero synthetic lifecycle users or children |

## Release blockers

1. An isolated database recovery restore remains blocked: the Supabase organization returned HTTP 402 because Branching is not included, and this host has no local container runtime. No preview resource was created and no charge was incurred.
2. A provider-signed PayOS replay/mismatch exercise remains pending because the encrypted production checksum key is intentionally non-exportable from Cloudflare and PayOS exposes no non-billable webhook simulator for this channel; invalid signatures and local signed replay/mismatch paths pass.
3. Child-privacy legal review depends on launch markets and remains a product-owner/legal gate.

## Independent security review

The source, dependency, secret, auth/RLS, pairing, payment and privacy boundaries were reviewed on 2026-09-21. No Critical or High finding remains in the release candidate. The bounded sign-off and its production evidence requirements are recorded in [security-sign-off.md](./security-sign-off.md). HSTS is enforced, while the supported CSP boundary and rejected nonce/SRI experiment are documented there; live RLS and ingress checks are verified rather than inferred from local tests.

## Production access audit

Access and rollout audit updated on 2026-09-21. No secret values were printed or written to the repository.

| Surface | Observed state | Consequence |
|---|---|---|
| Git remote | `origin/main` contains adaptive-locale implementation `e5c249e9663ef578aadd0943b0c8cc2aa077515a` | The hardening implementation, scoped child-device boundary and adaptive locale behavior are immutable and remotely recoverable |
| GitHub Actions | [CI run 35581502489](https://github.com/vanhoa2191/goodhabittracking/actions/runs/35581502489) passed both jobs on the implementation candidate | Commit-bound quality and Chromium gates are green |
| Cloudflare Wrangler | Authenticated with Workers/Pages write access; `goodhabittracking` is deployed and healthy at its HTTPS workers.dev origin | Production candidate, encrypted secrets, security headers and invalid-signature ingress are live; an hourly quiet-unless-actionable production monitor is active |
| Supabase CLI | Linked to healthy project `kidhabithero`; migrations `202609190001` through `202609210002` are applied and remote history matches local | Live schema rollout and session-derived child command functions are complete |
| Supabase live verification | Preflight found six empty legacy tables and two absent billing tables; migrations were validated under forced rollback, applied, then verified; the automated live boundary runner exercised anonymous, same-family and cross-family access with ephemeral accounts | 21/21 expected tables exist, 1/1 pre-existing auth user has a family membership, quarantine is empty, all protected tables force RLS, no `auth.uid() IS NULL` policy remains, the live access matrix passes, and cleanup left zero synthetic users/families |
| Local release environment | `.env.local` server secrets are empty and Cloudflare build wrappers strip inherited server-only variables | Build-time secret inlining is blocked while runtime secrets remain encrypted platform bindings |
| Runtime dependency readiness | Live `/api/health` returns HTTP 200 `ready` with every dependency check true | Production configuration is connected; invalid credentials remain covered by fail-closed tests |

The pre-migration schema/data/role dump, preflight, rollback-validation transcript and post-migration schema are mode-600 files with a checksum manifest outside the repository at `/Volumes/DATA/Backups/goodhabittracking/pre-migration-20260921-9DRc5Q`. No secret values, access tokens, user rows or provider credentials were printed or recorded in release evidence.

## Promotion decision

Production candidate: deployed; family boundaries, child-device lifecycle and owner deletion are approved.  
General availability: blocked until the isolated database restore, provider-signed PayOS replay/mismatch and launch-market legal gates are closed.
