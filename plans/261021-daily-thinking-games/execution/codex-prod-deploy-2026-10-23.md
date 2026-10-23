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

## Content release scope

The code deployment authorization does not fabricate editorial signatures, child-pilot observations or release-manifest promotion. No thinking-games rollout flag was changed; all candidate content remains behind its existing release gates.
