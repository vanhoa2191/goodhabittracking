# Security Sign-off

Date: 2026-09-21  
Scope: immutable implementation candidate `56d5f2d3bbc496e2ee19e92ec1c645b8ebde6779`  
Decision: **Pass for credentialed preview; live RLS and ingress verification complete, recovery/payment-provider and legal release gates remain**

## Coverage

- 372 tracked and non-ignored files checked by the repository secret scanner.
- 924 npm dependencies checked with `npm audit`.
- API authentication paths traced through parent JWT context, child-device session token, PayOS webhook signature and service-role-only admin paths.
- PostgreSQL RLS, composite family foreign keys, grants and every `security definer` function reviewed statically.
- Common OWASP source patterns scanned: SQL/command injection, XSS sinks, dynamic evaluation, path traversal, insecure randomness, disabled TLS and secret logging.
- Environment files checked against Git tracking and ignore rules.

## Summary

| Category | Critical | High | Medium | Low |
|---|---:|---:|---:|---:|
| Secrets | 0 | 0 | 0 | 0 |
| Dependencies | 0 | 0 | 0 | 0 |
| Application code | 0 | 0 | 1 | 1 |

## Verified controls

- `.env*` files are ignored and no local environment file is tracked.
- Previously exposed PayOS credentials are represented only by SHA-256 denylist fingerprints; runtime and release preflight reject them.
- Cloudflare builds remove server-only variables before invoking Next.js and reject non-empty server secrets in `.env.local`; the deployed bundle contains zero exposed PayOS fingerprint hits.
- Payment creation derives amount, plan, family and user server-side. Entitlement activation is restricted to a signature-verified webhook and a service-role-only, idempotent database function.
- Parent API routes resolve the authenticated user with Supabase `getUser()`, then select a membership protected by RLS. Client-supplied family/user ownership is not accepted.
- Family tables use forced RLS and composite foreign keys to prevent cross-family child/activity/reward/social references.
- `security definer` functions use an empty `search_path`, revoke public execution and grant only the minimum intended role.
- Pairing codes use Web Crypto randomness, five challenge attempts, a ten-minute expiry, one-time consumption and a rate-limit fingerprint protected with HMAC. Device session tokens contain 256 random bits and are stored only as SHA-256 hashes.
- Child session cookies are `HttpOnly`, `SameSite=Lax`, path-scoped and `Secure` in production; revoked or expired sessions are rejected and the cookie is cleared.
- Operational telemetry uses an allowlist and drops token, secret and credential fields.
- Production simulation and legacy pairing are fail-closed.
- A missing Supabase auth session is treated as the normal signed-out state without hiding other identity lookup failures; the generated Worker demo flow was observed with an empty browser error console.

## Open findings

### Medium: production CSP permits inline scripts

The current policy includes `script-src 'unsafe-inline'`. Other directives prevent framing, object embedding, foreign script origins and unsafe base/form targets, but an HTML injection flaw would have a wider execution path than under a nonce-based policy. A build-time SRI experiment on Next.js 16.3.5/OpenNext produced integrity attributes for external chunks but left four inline bootstrap scripts; removing `unsafe-inline` blocked them and caused a React hydration error in the real Worker browser flow. Next.js nonce CSP requires dynamic rendering for every page, disables static optimization/CDN caching and depends on request middleware; Cloudflare documents that Node.js middleware is not supported by this OpenNext adapter. Keep the supported non-nonce CSP until a separately benchmarked dynamic-rendering migration or adapter change can pass full Worker E2E.

### Low: pairing rate-limit trust boundary depends on Cloudflare ingress

The fingerprint prefers `CF-Connecting-IP` but falls back to `X-Forwarded-For`. This is appropriate behind the configured Worker, but direct origin exposure or an ingress that preserves spoofed forwarding headers would weaken per-client throttling. Verify the deployed route is reachable only through Cloudflare and that the platform overwrites the trusted IP header.

## Required production evidence

1. Exercise PayOS replay/mismatch cases against the production candidate without creating a billable transaction.
2. Confirm no service-role secret appears in the browser bundle, Worker response, telemetry or deployment logs after every release build.

## Closed during review

- Added `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` to every response, locked it with a configuration integration test and observed the exact header on the generated local Cloudflare Worker.
- Removed normal anonymous-session console noise by classifying only Supabase's named `AuthSessionMissingError` as signed out; focused unit coverage and live Worker browser QA passed.
- Applied migrations `202609190001` through `202609210002` to the linked `kidhabithero` project after a checksummed logical backup, live transaction rollback validation and schema-drift fixes. Post-migration verification found 21/21 tables, 1/1 account membership, zero quarantined rows, forced RLS on every protected table and no anonymous ownership bypass policy.
- Rotated PayOS credentials into encrypted Cloudflare Worker secrets, registered the production webhook through PayOS's signed validation probe, observed HTTP 401 for a schema-valid invalid signature, and verified all six public security-header controls on the live HTTPS origin.
- Ran the production family-boundary verifier with two ephemeral confirmed accounts: anonymous access, cross-family family/private-row reads and writes, and membership escalation were denied; same-family reads and writes succeeded; cleanup verification found zero synthetic users or families.
- Ran the production child-device lifecycle with an ephemeral family: pairing and replay denial, child completion, parent approval, points, reward redemption/delivery, reconnect hydration, revocation and owner deletion all passed; cleanup verification found zero synthetic lifecycle users or children.

This report is a static and local-runtime sign-off, not a penetration test or compliance certification.
