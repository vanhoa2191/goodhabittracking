# Card/Player integration CI repair — 2026-10-23

## Cause and repair

On commit `74c4062`, CI job `120183240916` failed the local-demo case on all three attempts: it expected `rule-sequence-game`, while the failure snapshot showed the working day-2 memory-sequence renderer. The test's fixture selected the current calendar day, but its assertions and answer controls always assumed the day-1 rule-sequence game. This makes the test fail when the pilot calendar rotates to another mechanic.

Read `thinking-games-local.ts`, Card/Player code, the CI error-context artifact, local Next upgrading docs and the installed Playwright Clock API documentation. Changed only `tests/e2e/thinking-games-integration.spec.ts`: choose the day-1 fixture explicitly and set browser time to local noon on 2026-10-22 before navigation (pilot day 1 under the existing seven-day rotation). `setFixedTime` preserves timer execution. No product clock, game logic, assertions or timeout changed.

This is an E2E fixture correction, not a change to server entitlement dates or a claim that every mechanic was exercised by this one scenario. Existing separate mechanic suites remain in place.

## Verification

Node 26.11.1, Next 16.4.2, existing dependencies and installed Chromium.

- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3217 npx playwright test tests/e2e/thinking-games-integration.spec.ts --project=chromium --workers=1`: **exit 0, 3 passed in 3.7 minutes**. The harness starts its own isolated servers on 3217/3218; setting the base URL avoids starting an unused third server.
- Covered local demo start/finish, cloud start with pause failure/recovery, and default-off mounting/request isolation.
- ESLint on the changed test: exit 0.
- Root typecheck: exit 0.
- Full root `npm test`: exit 0, 344 files / 3730 tests.
- Scoped whitespace check: exit 0.

Logs: `/tmp/codex-resume-20261023/root-e2e-integration.log`, `root-e2e-lint.log`, `root-next-typecheck.log`, `root-next-test.log`.

Native debugger hit an account usage limit; root completed this bounded repair directly. No new dependencies, git reset/stash, product/source edits, promotion, signatures, flags, production calls, merge or deployment.
