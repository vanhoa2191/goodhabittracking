# Copilot contract review — P01 R2

**Status: ACCEPTED**  
**Review:** independent implementation-contract readiness only; no implementation, SQL, browser, human-pilot, or semantic-age approval is claimed.  
**Handoff:** `p01-2026-10-21-r2` (`plans/261021-daily-thinking-games/execution/contracts-handoff.md`)

## Exact reviewed inputs

| Input | Declared version/status | SHA-256 |
| --- | --- | --- |
| `contracts.md` | R2; pending independent review | `38a39700aa6e32aa21710495adba92e76f8cf30c6bd7d9a21b80e81cb98ab988` |
| `decisions.md` | `decisions-2026-10-21-r2`; D01–D24 and D31–D40 locked | `b27c71d8739cc105525a4fda1936aa2fa82c8740ff9c728308214cd0b4247df6` |
| `prd.md` | `prd-2026-10-21-r2` | `0427bd3c75f204caef8eb785e101479fe9afed53e4343ea4892970aacc39ac23` |
| `test-spec.md` | `test-spec-2026-10-21-r2`; planned verification | `f55ab39b5356a75de88d81dde47b239eebc0cbe776c3901dad2f551ebdf03d51` |
| `execution/contracts-handoff.md` | `p01-2026-10-21-r2` | `0f8c081bd6c737300239a712229163dc52b1c16c54a7b519d5b77d8b353676cc` |
| `execution/kilo-backend-test-review.md` | §7.3 R1–R12 | `ca0f70b91e9b0e2f8ffb0458339eeae9f9e2e17ed9a536b6c92684405524bec4` |

## R2 blocker matrix

| Concern | Contract evidence | Source/evidence check | Verdict |
| --- | --- | --- | --- |
| Server local day, invalid/missing IANA zone, stable clock | `contracts.md:67-73`; SQL `(now() at time zone p_timezone)::date`, invalid maps `timezone_invalid`, missing maps `timezone_required`; `now()` is transaction-start authority and `clock_timestamp()` is excluded | Implementable as a SQL/RPC requirement; no client date or TS helper is authoritative | **No blocker** |
| Receipt/review timestamps and legacy activity log | `contracts.md:174-203`; game-owned `thinking_game_habit_receipts`, explicit server `received_at`/`reviewed_at`, no client backdating, fail-closed missing log/receipt | `supabase/migrations/202609230001_experience_foundation.sql:39` is `secret_quests.completed_at` (`:32-44`), not `activity_logs`; repository migrations contain no original `CREATE activity_logs`. Existing RPC evidence shows hard delete at `supabase/migrations/202609190004_authoritative_domain.sql:77-94`, which R2 explicitly accepts as residual. | **No blocker** |
| Lock key, scope, batch order and six-RPC integration | `contracts.md:244-287`; exact namespaced `thinking_game_lock_key`, unconditional child lock, ascending batch child IDs, explicit row order, family-auth-first wrappers and one batch sync | Existing habit RPCs are pre-feature code; R2 correctly makes P04 changes a prerequisite and requires real concurrency/performance evidence | **No contract blocker** |
| Game revoke versus habit deletion and approval/race semantics | `contracts.md:205-213,226-242`; separate game ledger, `revoked_unused`/`revoked_after_use`, approved habit status/points untouched, receipt audit retained, PIN boundary, atomic sync | Existing source hard-delete behavior is acknowledged rather than misrepresented; implementation must preserve it and add compensating game controls | **No blocker** |
| Main journey and rollover | `contracts.md:119-164`; main starts independently, consumes current `nextDayIndex` once, rollover closes read-only with no third slot, pause blocks new main/bonus while started attempts may finish | Normative behavior is explicit and testable (T11/T36/T46/T45) | **No blocker** |
| Versioned response schema | `contracts.md:454-481`; new `thinkingGameResponseSchema`, bonus informational successes are `ok:true`/200, existing habit envelope remains closed | Existing source has domain/child route families but no game routes; R2 identifies new route ownership without claiming they already exist | **No blocker** |
| Content IDs, variants, age tracks | `contracts.md:295-301,316-341`; 24 measured IDs `g01-t1..g08-t3`, 96 rule-variant pairs, distinct rule IDs, independent 4-game age tracks, only `vi`/`age_6_8`/`age_9_12` initially | PRD/test spec separately preserve 24 vs 96 and 3–5/13+ deferral; no inflated readiness claim | **No blocker** |
| Pilot fixture and release validation | `contracts.md:373-382`; explicit `isPilotFixture`, internal spacing exception, 28 payloads, explicit profile permission, validator rejection outside pilot, no 24/730 coverage increment | PRD/test spec mark all payloads `design_only` and playable approval 0/730; no 730-coverage claim is made | **No blocker** |
| Real PostgreSQL release gate | `test-spec.md:3, T33-T35, §4`; `contracts-handoff.md` R9 and validation notes require real PostgreSQL 18.4-style two-tenant/auth-role RLS/concurrency evidence, with MOCK-ONLY otherwise | No feature source or tests exist, so this remains a future release gate rather than a contract defect | **No blocker** |
| Routes, registry ownership, versions, errors | `contracts.md:389-391,407-481,485-507`; master client registry versus server-only pilot/bonus/serve flags, deliberate child/parent prefixes, v1 schema, stable errors including `not_found`, `journey_complete`, `paused`, `format_unavailable`, explicit rate limits | Existing `src/app/api/child/*` and `/api/domain/*` establish conventions; new game route files and schemas are explicitly P04-owned and not presented as implemented | **No blocker** |

## Verdict and remaining gates

R2 resolves the justified R1–R12 contract defects without relying on the incorrect `secret_quests` citation or inferring legacy `activity_logs` defaults/nullability/live values. The contract is ready for the next implementation phase; it does not authorize claiming feature correctness.

Still required before enablement/release: P04 implementation and migration preflight, real PostgreSQL 18.4 two-tenant/auth-role RLS and concurrency/lock-budget harness, API/client/schema and route tests, real-browser coverage, content solver/fingerprint checks, human semantic/age approval, and the target-age pilot. Until those exist, gameplay and usability remain `NOT-RUN`/`BLOCKED` as applicable, and the pilot cannot be promoted to production coverage.

## Current-input hash addendum (2026-10-21)

The canonical review remains scoped to the accepted R2 inputs. The current SHA-256 values are:

| Input | Current SHA-256 |
| --- | --- |
| `contracts.md` | `38a39700aa6e32aa21710495adba92e76f8cf30c6bd7d9a21b80e81cb98ab988` |
| `decisions.md` | `712d30e8908895862de167e05f0ceb48d6226d23c6c2250637d2d03e3f910442` |
| `prd.md` | `0427bd3c75f204caef8eb785e101479fe9afed53e4343ea4892970aacc39ac23` |
| `test-spec.md` | `f55ab39b5356a75de88d81dde47b239eebc0cbe776c3901dad2f551ebdf03d51` |
| `execution/contracts-handoff.md` | `0f8c081bd6c737300239a712229163dc52b1c16c54a7b519d5b77d8b353676cc` |
| `execution/copilot-contract-review.md` | `6798e094eeefd7b7776042259ab1bd627d37163be1e30027365e0ee69c721a74` |

`decisions.md` differs from the reviewed hash only in its summary wording (`D01–D24` now also names `D30`); no locked decision body was changed.
