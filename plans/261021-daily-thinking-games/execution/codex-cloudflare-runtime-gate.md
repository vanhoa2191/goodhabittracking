# Built Worker bootstrap regression gate — 2026-10-23

## Change and purpose

Added `scripts/check-cloudflare-runtime.mjs` and one quality-job step in `.github/workflows/ci.yml` after `npm run ci`. The existing build and Next-dev browser tests passed while the deployed OpenNext1.20.7/Next16.4.2 bundle crashed during server construction. The new check runs the actual built Worker through local Wrangler/workerd, so that mismatch blocks deployment.

The script reuses the existing Wrangler config, compatibility flags, binding names and `.open-next` output. It starts a local-only Worker on127.0.0.1:8798, with an explicit empty env file, dotenv/process-env loading disabled, a small environment whitelist, isolated configuration/cache/persistence and ignored raw child output. Legacy global Wrangler configuration is rejected rather than read. No production credentials, user data or remote AI calls are required.

Acceptance is HTTP200/`ready`, or HTTP503/`degraded` or `unavailable`, with normal application health JSON and a nonempty version. HTTP500, Cloudflare1101, nonJSON and invalid health responses fail. Secret-free HTTP503 is bootstrap evidence only, explicitly not production readiness. Startup is bounded to60s; success/failure/interruption cleans up only the owned process group and temporary directory. A port already in use fails before startup.

No custom adapter patch or new dependency was introduced. `docs/deployment.md` now explains the distinction between local runtime bootstrap and required production200/ready/SHA checks.

## Regression evidence

- Before repair, the gate author ran the new script against the existing bad bundle: exit1, `Worker /api/health returned HTTP 500; its runtime did not initialize correctly.` Its process cleanup freed the same port for the later run.
- After the supported adapter upgrade and scoped glob patch, root ran the unchanged script on the rebuilt bundle: exit0, `{status:passed, scope:local-worker-bootstrap, healthStatus:unavailable, httpStatus:503, productionReadiness:not-verified}`.
- Root reviewed the script's environment isolation, response checks, deadline and process-group cleanup. Root's full `npm run ci` passed including lint, typecheck, 3730 tests, audit, build and performance. No weakened assertion, increased test timeout, secret exception or audit exception was used.

The native author hit a usage limit after implementing the script/CI step and obtaining the negative proof; root completed the positive validation and this report. Detailed logs are under `/tmp/codex-resume-20261023/runtime-gate-{negative,positive}.log`.
