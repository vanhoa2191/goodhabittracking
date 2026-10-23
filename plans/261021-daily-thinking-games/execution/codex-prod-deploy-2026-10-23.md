# Production deployment and recovery — 2026-10-23

## Authorization and first attempt

The product owner instructed: “duyệt, push, deploy nhé”. Root verified all five PR199 checks on `d46dd4c`, merged with an expected-head guard and a Lore message, and preserved the shared dirty checkout. PR199 merged at 05:13:25 UTC as `516729e7ae16d93ca48858bfb97b9e92667a6cb6`. GitHub comparison confirms the merge and reviewed PR head have identical file contents.

Main CI/deploy run: https://github.com/vanhoa2191/goodhabittracking/actions/runs/39904567418

Marketing run: https://github.com/vanhoa2191/goodhabittracking/actions/runs/39904567545

Marketing deployed successfully; its public `release.json` reports full SHA `516729e7ae16d93ca48858bfb97b9e92667a6cb6`. Main quality, SQL, thinking-games E2E and browser jobs passed. General browser results include 331 passed, 9 skipped and **one flaky reward-delivery test that passed an automatic retry** (`ui-audit-regression.spec.ts:325`); marketing tests passed 16/16. This is not a zero-flake claim.

## Runtime failure and emergency rollback

The app published Worker version `e6308d9f-3f01-4bd1-8a41-dbe510d24f6b` at 05:41:47 UTC. Post-deploy verification failed: both `/` and `/api/health` returned HTTP500 / Cloudflare1101. CI correctly failed its production-health gate at 05:44:44 UTC. A successful upload was not accepted as a successful deployment.

Root immediately used the documented emergency rollback exception, selecting the exact previous healthy Worker version `96207db4-ba5a-46cc-912b-3eac370875ff` (deployed 2026-10-22 15:35 UTC). Wrangler confirmed restoration to 100% traffic. At 05:45:08 UTC the independent public health probe returned HTTP200, `status:ready`, version `d1b9313ec2da`; the app root also returned HTTP200. No database, bound resources, secrets or feature flags were changed by the rollback.

The first deployment attempt therefore **failed and was rolled back**. Marketing remains on the new static release; the app is restored to its prior healthy build while the repair is verified.

## Cause and scoped repair

A native debugger reproduced the exact error with the built Worker under local Wrangler: `Unexpected loadManifest(/.next/server/preview-props.json) call!` in `NextNodeServer.getPreviewProps`. Next16.4's manifest is missing from OpenNext1.20.7's build-time manifest inlining. The adapter's broad peer range and a successful build/dev-browser suite did not prove production Worker compatibility.

Root independently verified official upstream PR1356 merged on 2026-10-15 and release `@opennextjs/cloudflare@1.20.12` includes the manifest fix plus AWS adapter support for Next16.4. The debugger also verified actual npm tarball contents. No handwritten adapter patch is needed.

Repair owners and boundaries:

- `runtime_1101_debug`: existing adapter dependency upgrade and required lockfile closure, official-source evidence, audit/lint/typecheck/tests/build/performance and local Worker proof. No git or production writes.
- `worker_smoke_gate`: a real local Worker bootstrap smoke script and a CI quality step after the build. It rejects500/nonJSON/1101; it distinguishes secret-free degraded/unavailable health from production readiness. No package, build-output or production writes.
- Root: integration review, sole git ownership, official pipeline deployment and independent production-health verification.

Root fetched main and verified its tracked tree was identical to the current reviewed head before creating `fix/cloudflare-next-164-runtime` from `516729e7`. All unrelated dirty files were preserved.

Adapter1.20.12 introduces `@node-minify/core@9.0.2`, which pins vulnerable `glob@10.3.3`; the audit gate correctly blocked it. Adapter1.20.13 retains the same pin. Root verified the official glob advisory and authorized a narrowly scoped existing-transitive override to `glob@10.5.0` only beneath `@node-minify/core`. No audit exception, new direct dependency or unsafe major override is authorized.

Local repair verification is complete: root's secure-TLS `npm run ci` exited0 (lint/typecheck, 344 files / 3730 tests, framework/translations, secrets/audit, Cloudflare build/performance). The new runtime gate rejects the old bundle with HTTP500/exit1 and accepts the repaired bundle with application health JSON503/`unavailable`/exit0. The latter proves secret-free Worker initialization, not production readiness. Native executors hit usage limits; root took over the remaining checks/integration. Reports: `codex-cloudflare-1101-debug.md` and `codex-cloudflare-runtime-gate.md`.

Only existing adapter/dependency versions and one narrowly scoped transitive override changed; the supported upstream fix replaces any need for custom adapter patching. The new script/CI step and deployment documentation preserve the existing pipeline and make the missing runtime check explicit.

Pre-push code scope: `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `scripts/check-cloudflare-runtime.mjs`, `docs/deployment.md`, these three repair/recovery reports and the existing continuation checkpoint. Unrelated dirty files remain excluded. The healthy old Worker remains active until the repair passes the normal GitHub Actions pipeline and production health verification.

## Repair publication checkpoint

Committed the exact nine-path repair scope with Lore trailers as `fa185cc479ceb6b811fa37af41e078acafa3e72e`. Staged whitespace and secrets checks passed; unrelated dirty files were excluded.

GitHub rejected the normal fast-forward push to main with GH013 because repository rules require a pull request and status checks. No rule bypass or force push was attempted. Root pushed `fix/cloudflare-next-164-runtime` and opened [PR201](https://github.com/vanhoa2191/goodhabittracking/pull/201).

PR CI run: https://github.com/vanhoa2191/goodhabittracking/actions/runs/39932253919

PR marketing build run: https://github.com/vanhoa2191/goodhabittracking/actions/runs/39932253917

The first PR201 quality job passed, including all3730 tests, audit/build and the new Worker gate on the GitHub runner (HTTP503 with normal `unavailable` JSON). Build, SQL and thinking-games E2E also passed. The general browser job failed one settings-scroll test after all retries and recorded one flaky reward-delivery test; root inspected its logs and downloaded screenshots instead of blindly rerunning it.

The settings screenshot shows appearance heading near220px and security heading near440px, so the UI correctly highlights appearance. The test's fixed200px wheel movement did not reliably position the security section in the reading area. Root kept its nav-visibility/current-section/account-return assertions and replaced the arbitrary wheel delta with the actual security-heading position relative to the sticky navigation. No settings component or scrollspy behavior was changed.

The reward screenshot shows the button still saving while the test already inspects request counts. Root moved the same exact request-order assertion after the existing auto-waited delivery-error UI assertion. Retry-only-deliver and no-approve-replay checks remain intact; no timeout was increased.

Focused root verification: both scenarios repeated three times, **6/6 passed**, exit0 in1.4m; changed-test/gate ESLint and whole-project typecheck exit0. The Worker gate also passed again after explicitly disabling redirects, ensuring only the loopback Worker can supply its health response. Logs: `ci-fixtures-repeated.log` and the earlier full-CI/runtime-gate evidence under `/tmp/codex-resume-20261023/`.

Production app remains on the restored healthy build. Root will merge only the expected reviewed head after all checks pass, then monitor the main-branch deployment and expected-SHA production health.

## Content release scope

The code deployment authorization does not fabricate editorial signatures, child-pilot observations or release-manifest promotion. No thinking-games rollout flag was changed; all candidate content remains behind its existing release gates.
