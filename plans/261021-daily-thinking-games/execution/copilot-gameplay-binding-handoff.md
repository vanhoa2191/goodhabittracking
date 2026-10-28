# Copilot gameplay and catalog binding handoff

## Implemented

- Added parent-account gameplay RPCs and domain routes for state, start,
  pause, and finish. Parent identity is obtained from the authenticated
  Supabase user, and every RPC derives family ownership and child membership
  server-side; no paired child cookie or fabricated device session is used.
- Added parent client wrappers while preserving the existing paired-child
  wrappers and response parser.
- Parent start uses the server day, stored settings/snapshot, approved catalog
  rows, age-track settings, immutable entitlement content pin, and deterministic
  child/day/slot/content ordering. Unknown or unapproved content cannot be
  granted.
- Parent and paired-child finish routes now invoke the reviewed pure-engine
  `parsePuzzleItem`/`checkAnswer` exports before the protected server-side
  finish mutation; forged `won`, points, or solution fields are not accepted
  as request inputs.
- Added protected parent pause/finish and child `thinking_game_finish_verified`
  mutation functions, with service-role-only grants and rollback coverage.

## Verification matrix

| Check | Result |
| --- | --- |
| SQL parser + `git diff --check` | PASS |
| Disposable PostgreSQL migration + preflight | PASS |
| `thinking-games-gameplay-runtime.mjs` | PASS: authenticated parent own-child state, foreign-family denial, parent RPC ACL |
| Prior gameplay runtime | PASS |
| Prior settings runtime | PASS |
| Prior habit integration runtime | PASS |
| Settings API tests | PASS (4/4) |
| TypeScript | PASS |
| Scoped ESLint | PASS |

## Remaining broader QA

The real PostgreSQL gameplay runner currently proves parent authorization and
RPC exposure boundaries, but does not yet exercise a seeded approved catalog
through parent start/finish with all three checker mechanics, concurrent
resume/finish races, or full forged-answer matrices. The existing child SQL
start path still uses the pilot content-version selector and the legacy direct
finish RPC remains fail-closed; production release-profile manifest rollout,
complete wrong-answer retry/skip semantics, parent UI integration, and
full P04/P05 concurrency evidence remain for follow-up.
