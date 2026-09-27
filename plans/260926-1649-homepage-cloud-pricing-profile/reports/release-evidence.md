# Release Evidence

Released: 2026-09-27

## Application

- Commit: `d62c559b737d4349bd0d10a01fa8dffb98c096be`
- Production URL: `https://goodhabittracking.vanhoa2191.workers.dev`
- Cloudflare version: `d14b69e0-4c32-433d-be77-150ae1bd7592`
- Health: HTTP 200, status `ready`; app, database configuration, database connection, billing configuration, and pairing configuration checks all returned `true`.

## Database

- Remote migration history contains `202609270001` and `202609270002` with matching local versions.
- The migrations are additive: profile request idempotency and the one-child paid entitlement were added without deleting family, subscription, or payment history.

## Automated Verification

- ESLint: passed with zero warnings.
- TypeScript: passed.
- Vitest: 100 files, 442 tests passed.
- Customer-journey, responsive, localization, and accessibility E2E: 40 tests passed locally on desktop and mobile Chromium.
- Controlled production journey and accessibility smoke suite: 36 tests passed on desktop and mobile Chromium.
- Nine supported locales rendered without application errors or horizontal overflow.
- Secret scan, dependency audit, habit-framework source verification, Cloudflare build, and performance budget: passed.

## Visual and Operational QA

- Production landing was rendered and inspected at the 375px mobile breakpoint; heading, body text, navigation, primary Google action, demo action, and product preview remained readable and unclipped.
- Returning-parent, paired-child, new-visitor, explicit Home navigation, and demo journeys were exercised with isolated browser fixtures against the production deployment.
- Pricing focus trap, Escape behavior, focus restoration, document locale, and serious/critical accessibility checks passed.

## Payment Boundary

No real payment or charge was made during release verification. Plan, amount, signature, ownership, callback idempotency, activation, expiry, and lifetime-grandfathering behavior were verified through API/unit fixtures and migration contracts.

This report contains no secrets, personal data, family payloads, or payment account details.
