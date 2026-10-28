# Copilot catalog SQL handoff (Recovery E2)

## Admission and security changes

The current SQL snapshot was preserved at
`/tmp/goodhabit-catalog-e2/202610210001_thinking_games.sql.before-catalog`
with pre-edit SHA-256
`aa3b03ae7b4e3336b24b334cc35c2c7163a915f3a0219bd094d6477aba2a7b1e`.

The migration now permits real pilot `design_only` content only inside the
trusted service-role gameplay functions; approved content remains the only
production catalog status. Child start moved to the service-role transport,
and direct anon/authenticated execution of start is denied. Parent and child
routes still use separate authenticated-parent versus paired-child contexts,
with server-derived child/family authority and no client profile/seed/puzzle
authority.

Both start functions bind a real catalog row and public payload before creating
an entitlement/attempt. Finish routes use the pinned content and reviewed
engine checker; SQL verified finish preserves the same attempt on a wrong
answer (`retry`) and transitions only a correct answer to `finished`.

## Real PostgreSQL evidence

`tests/integration/migrations/thinking-games-catalog-runtime.mjs` passed on
PostgreSQL 18.4 with all 28 actual pilot JSON payloads loaded as
`design_only` (no status changes). Cases passed:

- child start returns a trusted public puzzle payload;
- parent start returns a trusted public puzzle payload;
- wrong answer returns retry, then correct answer finishes the same attempt;
- direct authenticated start is denied;
- non-service profile cannot admit design-only content;
- restart returns the same pinned attempt.

Additional checks passed: migration + preflight; prior gameplay, settings, and
habit integration runtimes; catalog/settings API tests (6/6); SQL parser and
diff check; scoped ESLint. TypeScript completed successfully after the
independent engine narrowing fix.

## Final hashes

| File | SHA-256 |
| --- | --- |
| migration | `fb6af27a3f3e98bb1eec033b449bf6e7485dbe302883edf5f93fb6739c889d99` |
| catalog server | `c6b887413415f162081d073d86000bf4128a0c4c939c46d4828ddd5017c14f39` |
| child start route | `252a6be1a9e8147f31c39cdf97c07c1f62e7aa147d3eb72291303cf8e2926381` |
| child finish route | `29b6495beb64496952fe25171b222ce64c774b5dc029568f6cf39365baa945ff` |
| parent start route | `fa777358bf2a9e51c55482286b42f0d3818eacadd7383725ed7a812ede08817c` |
| parent finish route | `690c39e33ed44ab028a7ba9672a38f161d47387b7b7e88239ff3c940bf2d6ea7` |
| client | `f2291b468f8393a11b7e97e9c783b16f194c5792ac93717d62d9ae26c772ef6d` |
| catalog runtime | `37b6923d3ba6c81e658d169f490965130a3df2545d341f1f29be776282a72d5a` |

## Remaining QA

No real browser/Next combined transport test was claimed; Kilo integrated QA
must validate cookie/admin transport and UI behavior. Release catalog remains
fail-closed while the approved release manifest has zero approved rows.
