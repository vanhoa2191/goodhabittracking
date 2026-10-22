# Copilot internal catalog handoff

## Implemented in this lane

- Added a server-only catalog admission helper that loads the real pilot
  manifest and uses it only when `ENABLE_THINKING_GAMES_INTERNAL_CATALOG=true`
  and `NODE_ENV` is not `production`. Production always selects the release
  manifest and fails closed while it has zero approved items; pilot
  `design_only` content is never relabeled or marked approved.
- Added pinned catalog identity checks (id, content version, fingerprint, and
  profile-appropriate status) before both child and parent finish mutations.
  The routes still invoke the reviewed pure-engine checker, so browser
  `won`/solution/points claims cannot determine the result.
- Added parent/paired-child catalog-start admission gates, preserving the
  existing explicit child-cookie versus authenticated-parent route split.
- Added client boundary tests covering parent route selection, absence of
  child-session transport, and malformed-envelope rejection.

## Verification

| Check | Result |
| --- | --- |
| `tests/api/thinking-games-catalog.test.ts` | PASS (2/2) |
| Scoped ESLint | PASS |
| TypeScript | Existing unrelated failure in `src/lib/thinking-games/mechanics/remaining.ts:204` (`period` possibly undefined) |
| Source hashes | See coordinator status message; hashes were computed for all changed server/routes/client/test files |

## External coordination blocker

The current SQL `thinking_game_start` functions only admit
`status='approved'` rows and hardcode the pilot content version. The real 28
pilot payloads are `design_only`, so actual disposable-PostgreSQL start/finish
playability cannot be truthfully claimed until the coordinated SQL mutation
adds a server-controlled internal profile and preserves the production
fail-closed path. I requested OMP/Kilo acknowledgement before editing the
current migration/preflight/rollback because the task explicitly requires
preserving their SQL snapshot/source hash; no acknowledgement was available
before this handoff.

## Remaining

After SQL coordination: seed the real pilot rows into the disposable fixture
without changing their status, exercise both start paths and all three real
checkers with wrong-answer retry/pause/skip behavior, and add direct RPC ACL
negative cases. The existing prior SQL runners remain the source of truth for
regression; no SQL or fixture files were changed in this batch.
