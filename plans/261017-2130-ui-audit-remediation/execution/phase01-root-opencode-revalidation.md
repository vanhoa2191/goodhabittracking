# Phase 01 — B1 Revalidation (read-only, bounded)

Verdict: **APPROVE** the narrow 01 correction. The B1 blocker (a real HTTP 403 `{error, code}` misclassified as `unknown`) is addressed in the supplied client, and the conservative handling of uncoded 403s is within contract. No remaining blocker in the reviewed surface. No whole-07 approval.

## B1 status: addressed

- `parentPinRefusalSchema` accepts exactly `{ error: string(min1), code: 'parent_pin_required' | 'parent_pin_not_set' }` and rejects envelopes that also carry `success`/`result`; it is consulted only at HTTP 403.
- A real PIN refusal `{ error, code }` at 403 now yields `outcome: 'refused'` (regression cases 4–6).
- A 403 with a valid PIN `code` but an added `result` branch stays `unknown` (case 7) — no false refusal from a contradictory body.
- A generic/uncoded 403 (`{ error: 'Unlock required' }`) stays `unknown` (case 13). This is the safe direction: `unknown` never proves non-commit and routes to reconciling sync rather than optimistic state.
- Mixed-branch envelopes (`success:true` + `error`, `success:false` + `result`) now fail the discriminated union and fall back to `unknown` (cases 1–3, 9, 11) — the newly confirmed bug is fixed without tightening legitimate on-branch fields.

## Safety choice: sound

`refused` is emitted only when the envelope validates and either the envelope declares `success:false` on a known 4xx (400/401/403/409/429) or a 403 carries an exact PIN machine code. 5xx, contradictory envelopes, malformed discriminators and unreadable bodies all fall back to `unknown` (cases 1–3, 8–13). Reconciliation resolves via `syncCloudFamily` only, with no `setProfiles`/`setRedemptions` mutation. Direction is correct: refusing a validated 403 is safe, and commit is never inferred from message text. The child path likewise defaults to `unknown` on any non-success.

## Non-blocking observation (outside B1 scope, not a regression)

`requestChildDomainCommand` reads the body with bare `await response.json()` (no `.catch(() => null)`), unlike `requestDomainCommand`. A non-JSON child body would surface a raw parse error rather than a `DomainCommandRequestError { outcome: 'unknown' }`. The sibling code and tests are unchanged from the prior review, so this is not part of B1; flag only as a possible future narrow follow-up if the child action handler catches `DomainCommandRequestError` exclusively.

## Source-review limits (honest)

Read-only source review of the supplied client and regression tests. I did **not** run vitest, scoped lint/typecheck, the route-faithful PIN E2E, D0 snapshot, or E1 parent suites, and I performed no repository/command discovery. Reported results (contradiction 5 RED→GREEN, bare-PIN 2 RED→GREEN, 121 focused tests pass, D0 two-case snapshot 2 pass/43.6s, E1 parent 16 pass, mock now `{error:'Parent PIN required.',code:'parent_pin_required'}` with failure-copy and explicit-retry/no-auto-replay assertions) are accepted as reported, not independently reproduced.
