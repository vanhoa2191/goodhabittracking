# Phase 08 — Production health investigation

Observed: 2026-10-19, 13:39–13:42 UTC (20:39–20:42 Asia/Ho_Chi_Minh).

## Result

The previously reported transient HTTP 503/degraded could not be reproduced. Production returned HTTP 200/ready throughout this bounded investigation, with live version `83b118367fea`. This establishes current sampled readiness, not the cause or permanent resolution of the earlier failure. No production implementation, environment, deployment, payment, messaging, or GitHub issue mutation was performed.

One regression test was added in `tests/api/health-route.test.ts:224` to verify honest failure reporting and recovery at the existing health-cache expiry. No production behavior was changed or outage hidden by retries.

## Live evidence

Initial curl at 13:39:32 UTC returned HTTP 200, `{ "status": "ready", "version": "83b118367fea" }`, through Cloudflare/OpenNext. Eight further individual requests, spaced by 11 seconds after each response, crossed the ten-second application cache TTL:

| Completed at (UTC) | HTTP | Status | Elapsed ms | Cloudflare request ID |
| --- | --- | --- | ---: | --- |
| 13:39:57.003 | 200 | ready | 1522 | a4d031128adf9b08-CDG |
| 13:40:09.864 | 200 | ready | 1857 | a4d0315e4d548209-SIN |
| 13:40:23.297 | 200 | ready | 2431 | a4d031b11e213a77-CDG |
| 13:40:37.243 | 200 | ready | 2944 | a4d0320508854482-LHR |
| 13:40:50.610 | 200 | ready | 2363 | a4d0325c0be7ee70-MXP |
| 13:41:04.083 | 200 | ready | 2468 | a4d032b23b90edac-MXP |
| 13:41:17.377 | 200 | ready | 2294 | a4d03303cb51ff34-CDG |
| 13:41:31.125 | 200 | ready | 2747 | a4d033571fe9e208-MRS |

The Node environment inherited `NODE_TLS_REJECT_UNAUTHORIZED=0` for the eight-request series. To avoid treating that as certificate-validation evidence, four additional requests explicitly set `NODE_TLS_REJECT_UNAUTHORIZED=1`; all returned HTTP 200/ready and the same live version, at 13:40:10.412 (2717 ms), 13:41:05.770 (2273 ms), 13:41:17.417 (630 ms), and 13:41:30.385 UTC (1955 ms). Curl also used its normal TLS verification. No request was automatically retried. Client elapsed time includes network/edge transit and cannot identify database probe duration.

No `CRON_SECRET` was available from the current process or existing `.env`/`.env.local` files (checked in memory without printing file contents or credentials). Authenticated dependency checks and protected `/api/internal/operations/health` were therefore not directly probed in this session. Anonymous health intentionally exposes only status and version.

## Read-only operational history

- The latest 12 `production-observability.yml` runs listed on GitHub succeeded, spanning 2026-10-17T20:24:40Z through 2026-10-19T06:40:56Z. Latest run: https://github.com/vanhoa2191/goodhabittracking/actions/runs/39211316983 . Its logs show the configured authenticated public health and operational-health workflow completed successfully. These are older scheduled samples, not continuous monitoring of the current interval.
- There were no open issues titled `KidHabit production alert`. The latest historical alert, https://github.com/vanhoa2191/goodhabittracking/issues/191 , recorded a generic public/dependency readiness failure at 2026-10-12T17:44:19Z and recovery at 23:46:42Z; it does not identify the failed dependency or establish a connection to the earlier status-check observation.
- The workflow declaration schedules checks every 15 minutes, but the returned run timestamps are not evenly spaced. Do not equate that configuration with proof of continuous 15-minute coverage. Its curl probes retry failures twice; a successful workflow can coexist with a transient first-attempt failure.

## Code-path findings and confidence

- `src/app/api/health/route.ts:52–65` performs an authenticated REST-root database probe with a 3000 ms timeout; HTTP errors or thrown errors return false. `route.ts:23–49` independently probes schema RPC with the same timeout and requires a readable, sufficiently new schema version.
- `route.ts:80–91` combines database, billing configuration, pairing configuration, schema version, and parent-unlock configuration; `route.ts:97–113` returns HTTP 503/degraded when configured dependencies fail, and HTTP 200 only when every requirement passes. `route.ts:93–108` guards detailed checks and schema error reasons behind the operations bearer secret.
- `src/lib/health-cache.ts:1–19` caches successful and failed answers for ten seconds in each process/worker, from probe start. Cold concurrent requests intentionally run independently. A transient probe failure can therefore remain degraded until expiry; separate requests/workers need not share answers. This is a verified mechanism, not proof that it caused the earlier production event.
- The installed Next 16.3.8 route-handler guide states GET route handlers are uncached by default. The health route makes `no-store` fetches and uses the explicit helper cache above. No evidence was found for a stale statically rendered health response.

High confidence: sampled production readiness, existing fail-closed semantics, and ten-second recovery behavior. Low confidence in any specific explanation of the earlier 503: its timestamp, operator `checks`, schema failure reason, and matching Worker/dependency log were not available. Database/schema timeout or upstream HTTP failure remains a possible explanation, not an established root cause. Increasing timeouts, retrying inside readiness, or serving stale success would be speculative and could conceal a real outage; none was done.

## Regression coverage and checks

`tests/api/health-route.test.ts:224` adds a controlled-clock transient dependency test:

1. At t=0 the database returns 503: route is 503/degraded, databaseConnection and schemaVersion false, and schema RPC is skipped.
2. The database becomes available, but at t=9.999 s anonymous health remains 503/degraded using the cached failure, with no dependency details exposed and no extra database call.
3. At exactly t=10 s the route rechecks database and schema once and returns HTTP 200/ready.

Using Node v26.11.1:

- `npx vitest run tests/api/health-route.test.ts tests/unit/operational-health.test.ts tests/unit/bearer-secret.test.ts`: **31 tests passed in 3 files** (baseline before regression: 30 passed).
- `npx eslint tests/api/health-route.test.ts --max-warnings=0`: passed.
- `git diff --check`: passed at investigation completion.

The regression adds coverage only; no cleanup abstraction or dependency was introduced. The leader owns aggregate project lint, typecheck, tests, static analysis, and release disposition.

## Remaining risk / next observation

The earlier intermittent 503 remains unattributed. If it recurs, preserve the exact UTC timestamp, HTTP status, version and Cloudflare request ID; obtain authenticated `checks` and `schemaVersionFailure` in a protected channel, then correlate sanitized Worker/dependency logs. Do not print bearer tokens or secrets. Persistent configuration/schema errors and brief upstream unavailability require different fixes; this investigation supplies no evidence to choose one. A local preview's known 503/unavailable without backend configuration (phase 07 report) is a separate condition and must not be conflated with production degradation.
