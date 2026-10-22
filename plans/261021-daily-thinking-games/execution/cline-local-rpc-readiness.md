# Local RPC transport readiness — Daily Thinking Games

**Status: TRANSPORT PROVEN. Report written by OMP (recovery ownership), not by the Cline lane.**
**Scope: transport readiness only — this is NOT P05 and NOT AC04.**

## 1. Provenance — read this first

Two Cline lanes ran and **neither produced a report**:

| Lane | Dispatch | Outcome |
|---|---|---|
| original | `ctx_8219c5465cac` (`task_8e1a095f1b42`) | exited 0, **no report file, no message**; root stopped and released it |
| recovery | `ctx_03d9d7bd9d9c` (`task_4cd0b5ea25fc`) | exited 0 after ~81 s (17:51:36 → 17:52:57 local); **no report file**; its log ends immediately before the write |

Root assigned OMP the recovery ownership: write this file as **OMP's own recovery evidence**, preserving the original failure history rather than presenting it as a Cline report. **No `worker_done` was faked for either lane.** Cline was not restarted a third time for a report.

Everything below is **measured by OMP directly** against the still-running services.

## 2. Infrastructure metadata

| Item | Value |
|---|---|
| Gateway URL (PostgREST) | `http://127.0.0.1:54121` |
| Admin server | `http://127.0.0.1:54123` (`admin-server-host/port` in the config) |
| Config file | `/tmp/goodhabit-rpc-cline/postgrest.conf` |
| Database (disposable) | `kidhabit_test_bc75e71bef884138a62de7522e9a2ef5` on `127.0.0.1:55432` |
| Schema cache | `1 Relations, 0 Relationships, 2 RPCs` (from the PostgREST log) |
| `db-anon-role` | `anon` |
| `db-schemas` | `public` |
| `jwt-role-claim-key` | `.role` |
| JWT secret | stored in the config file; **value deliberately not reproduced here** |
| Private DB credentials | `pgrst_authenticator` / `local-only` — the disposable local cluster only |

### Service topology (verified)

```
Supabase JS SDK  ->  http://127.0.0.1:54121/rpc/<fn>  ->  PostgREST  ->  PostgreSQL 18.4
                                                            (kidhabit_test_bc75e… on :55432)
```

- The **PostgREST process runs on the host** (`postgrest`, pid 3162380, started 17:40:12 local) — the container `cline-rpc-postgrest` (`postgrest/postgrest:v14.17`) runs with `NetworkMode=host`, so there is **no separate published port**: the port is bound directly on `127.0.0.1`.
- **Loopback binding is real and verified from outside Docker**: `ss -ltnp` shows `LISTEN 127.0.0.1:54121` owned by the `postgrest` pid, and a host-side TCP connect plus an HTTP `GET /` both succeed from the host shell. The service is **not** reachable from outside the host.
- The disposable PostgreSQL 18.4 container is `omp-pg-probe`, published `0.0.0.0:55432 -> 5432/tcp`.

### The two RPCs

| Function | Signature | Purpose |
|---|---|---|
| `rpc_transport_echo` | `(p_payload jsonb)` | echoes the payload and reports the resolved auth context (`auth_uid`, `auth_role`, `jwt_claims`, `current_user`, `request_user`, `session_user`) |
| `rpc_transport_pre_request` | `()` | a `pre_request` hook, exercised to confirm the hook path works |

## 3. Real SDK roundtrip — `@supabase/supabase-js`

**Installed SDK version: `2.117.2`** (`node_modules/@supabase/supabase-js/package.json`).

| # | Case | Result |
|---|---|---|
| A | `supabase-js` `createClient(...).rpc(...)` with the **default** `/rest/v1` prefix | **ERROR** `Invalid path specified in request URL` — this PostgREST is mounted at the **root**, not under `/rest/v1` |
| B | `postgrest-js` `PostgrestClient('http://127.0.0.1:54121').rpc('rpc_transport_echo', …)` with a **validly signed** `role: anon` JWT | **OK** → `{"echo":{"n":2,"probe":"B"},"auth_uid":null,"auth_role":"anon","jwt_claims":{…,"role":"anon"},"current_user":"anon","request_user":null,"session_user":"pgrst_authenticator"}` |
| C | same client, JWT signed with the **wrong secret** | **ERROR** `PGRST301` / *"No suitable key or wrong key type"* |
| D | `rpc_transport_pre_request` through the client | **OK** (204, no body) |

### Finding from the roundtrip (important for the next lane)
**`supabase-js` cannot be pointed at this gateway by default** — case A fails because `supabase-js` hard-codes the `/rest/v1` path prefix, while this PostgREST serves the RPCs at the **root**. The working path today is `@supabase/postgrest-js` against the bare gateway root, or a gateway that mounts PostgREST under `/rest/v1`. For the real app the correct fix is to run the **real Supabase stack** (or mount this PostgREST under `/rest/v1`); the app's own `createServerSupabaseClient()` already speaks the `/rest/v1` shape.

## 4. Negative / no-fallback confirmation

| Case | Result |
|---|---|
| Wrong-secret JWT | `PGRST301` — **rejected, no fallback** |
| No `Authorization` header | rejected before any function runs (`Expected 3 parts in JWT`) — **no anonymous privilege escalation** |
| `anon` role | resolves to `auth_role: anon`, `current_user: anon`, `session_user: pgrst_authenticator` — the request runs as the **anon** role, not as a superuser |
| Cross-tenant | **not applicable at this layer** — the transport lane proves *transport and auth plumbing only*; tenant isolation is proven by the separate `thinking-games-security-runtime.mjs` suite (`cross-family-rls` case) |

There is **no production fallback**: the gateway is loopback-only, points at a disposable database, and the `anon` role is the configured anonymous role.

## 5. What this does and does not prove

**Proven**
- A real Supabase-style RPC transport works end to end against real PostgreSQL 18.4: SDK → HTTP → PostgREST → database, returning real rows and real resolved auth context.
- JWT validation is genuinely enforced, and the anonymous path carries no elevated privilege.
- The gateway is bound to loopback and is not externally reachable.
- The reusable harness pieces exist: `scripts/thinking-games-sql-fixture.mjs` and `tests/integration/migrations/thinking-games-harness-smoke.mjs` (independently reproduced by OMP: **PASS 7, FAIL 0, BLOCKED 0**, exit 0).

**NOT proven — explicitly out of scope for this lane**
- **Not P05.** No game content was served, no puzzle was played, no child browser flow was exercised.
- **Not AC04.** No game-policy RLS proof. The game-policy evidence lives in `thinking-games-security-runtime.mjs` and the other three game runners, and AC04 additionally needs the 20-way concurrency matrix and lock-latency measurement, which remain open.
- **No auth server.** There is no real Supabase Auth (GoTrue) in this stack, so `explicit`/`auth/v1` flows are unsupported; only JWT-signed role claims are exercised. There is **no production fallback** to a real auth server.
- **No real `supabase-js` path.** Case A shows the default `/rest/v1` prefix does not match this gateway.

## 6. Cleanup ownership

Per root's instruction, OMP takes over cleanup of the **Cline-owned** services and keeps the database until the final SQL QA.

| Resource | Owner | Cleanup command |
|---|---|---|
| PostgREST host process (pid 3162380) + container `cline-rpc-postgrest` | **OMP** | `docker rm -f cline-rpc-postgrest` and stop pid 3162380 |
| PostgREST config | **OMP** | `/tmp/goodhabit-rpc-cline/postgrest.conf` (contains the local secret) |
| Disposable DB `kidhabit_test_bc75e71bef884138a62de7522e9a2ef5` | OMP | `drop database` after the final SQL QA |
| PostgreSQL 18.4 container `omp-pg-probe` | **OMP** | `docker rm -f omp-pg-probe` — **only after** the game-policy harness runs finish |

**Do not remove the PostgREST service or the disposable database before the real game-API/browser integration lane has used them.**

## 7. Metadata for the next lane (Kilo real game API / browser integration)

- Gateway: `http://127.0.0.1:54121` · Admin: `http://127.0.0.1:54123`
- Config: `/tmp/goodhabit-rpc-cline/postgrest.conf` (secret inside; do not print it)
- DB: `kidhabit_test_bc75e71bef884138a62de7522e9a2ef5` @ `127.0.0.1:55432` (user `pgrst_authenticator`)
- `anon` JWT must be **HS256-signed with the secret from the config** and carry `{"role":"anon","iss":"postgrest","iat":…,"exp":…}`
- Use `@supabase/postgrest-js` against the gateway **root**, or mount PostgREST under `/rest/v1` if `supabase-js` must be used
- The SDK is `@supabase/supabase-js` **2.117.2**
