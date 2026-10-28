# Test spec — daily thinking games (initial 6–12 slice)

Version: `test-spec-2026-10-21-r2`.
Status: planned verification; no feature test has run because no game source exists. T46–T50 cover the Kilo REWORK items.
Requirements: AC01–AC14 in [plan.md](./plan.md); behavior is normative in [contracts.md](./contracts.md).

No new dependency is allowed. Proposed file paths are placeholders until P01/P04 owners confirm the repository conventions.

## 1. Measured catalog invariants

These are content checks, not gameplay checks:

| Check | Expected today | Expected after a production release |
| --- | --- | --- |
| CSV day rows | 365 continuous | 365 |
| Slots | 730 unique ids | 730 per released track/locale |
| `type_id` count | 24 | 24 |
| `(type_id, rule_variant)` count | 96 | 96 |
| `main_skill == bonus_skill` | exactly 0 | exactly 0 |
| `main_skill != bonus_skill` | exactly 365 | exactly 365 |
| Rolling 8-day windows covering all 8 groups | 358 / 358 | 358 / 358 |
| Minimum format spacing | 11 days | ≥ 7 days |
| Approved playable payloads | 0 / 730 | 730 / 730 per released track |
| CSV status | all `design_only` | zero `design_only` in release manifest |

The validator must print `typeIds` and `variantPairs` separately. A report that says “24 formats” while counting 96 variants is a failure.

## 2. Minimum matrix

| ID | Case | Required result | Layer / owner | Phase / AC |
| --- | --- | --- | --- | --- |
| T01 | Same child/day/slot/version, reload or new tab | Same entitlement/attempt, no reroll, no journey advance | Unit + real browser / OpenCode, Kilo | P03/P09 AC01/05 |
| T02 | 20 concurrent `start main` | One entitlement + one attempt, consistent responses | PostgreSQL transaction + API / P04, Kilo | P04 AC01 |
| T03 | Replay `commandId`; responses out of order | No duplicate grant/finish; older response cannot overwrite newer state | API + browser / Kilo | P04/P08 AC01/05 |
| T04 | Task not done, valid play time | Main starts; bonus locked | API/e2e / Kilo | P05 AC02 |
| T05 | Empty day, paused day, deferred task | Empty does not auto-bonus; deferred is not complete; pause follows contract | Unit + SQL / Kilo | P04 AC02/03 |
| T06 | Received before cutoff, approved after cutoff before bedtime | Bonus unlocks on approval; timeliness uses `received_at` | SQL/API/browser / Kilo | P04 AC03 |
| T07 | Received before cutoff, approved in bedtime/next day | No invitation in blackout, no next-day make-up, calm message | SQL + e2e / Kilo | P04/P08 AC03/05 |
| T08 | Reject/undo before, during, after bonus start | `revoked_unused` vs `revoked_after_use`; audit kept; no re-grant | Real SQL race / P04, Kilo | P04 AC03 |
| T09 | Client clock/date/timezone tamper; DST spring/fall | Server day/entitlement unchanged; one snapshot per local date | Unit with IANA + SQL/API / Kilo | P04 AC05 |
| T10 | Change schedule/cutoff/timezone mid-day; add/remove task | Snapshot immutable; next-day effect; no silent promise change | SQL/e2e / Kilo | P04/P08 AC03/05 |
| T11 | Midnight while playing/background/reload | Old attempt `abandoned_rollover`; `attempt_expired`; no third slot | Browser + API / Kilo | P05/P09 AC01/05 |
| T12 | Offline start/finish; network loss after commit | No local grant; cached assigned attempt only; idempotent retry; no backdate | Browser network control / Kilo | P04/P08 AC01/14 |
| T13 | Child A reads/starts/finishes child B or another family | Denied, no payload/state leak | Real SQL RLS + API / P04, Kilo | P04 AC04 |
| T14 | Low-privilege parent; expired/revoked child cookie; cross-site | Fail closed, stale ready state cleared | API + browser / Kilo | P04/P08 AC04 |
| T15 | Active child changes while request pending | Response A not attached to B; state keys include child/day/version | Unit hook + e2e / Kilo | P08 AC04/05 |
| T16 | Two tabs share storage/cloud | Shared entitlement; finish/revoke propagates; no split mock state | Real browser shared context / Kilo | P08 AC01/05 |
| T17 | View previous day history | No start/resume/grant outside contract | E2e + API denial / Kilo | P08 AC05 |
| T18 | 365 days, slots, 24 type ids, 96 variant pairs, 52 themes + finale | Counts exact; bonus skill differs; 8-day coverage; spacing ≥7 | Calendar validator / OpenCode, Kilo | P03/P07 AC07/08 |
| T19 | Every released payload of a track/locale | Schema valid, approved, version correct; design_only rejected | Exhaustive checker / Kilo | P07 AC07 |
| T20 | Single-answer and multi-answer mechanics; variants/fingerprints | Valid solutions accepted; single unique where designed; structural duplicates rejected | Solver + adversarial fixtures / OpenCode, Kilo | P06/P07 AC06/08 |
| T21 | Hints/solutions/labels | No contradiction; labels do not contain the answer; human semantic review | Human review / AGY + independent reviewer | P07 AC06/09 |
| T22 | Vietnamese game surface all states | `mình–bạn`; no “con/bé”; praise matches observed event; habit flow unchanged | Inventory scan + human review / AGY, Kilo | P02/P07 AC09 |
| T23 | Missing locale/age/override | `age_track_unavailable` or explicit valid track; no silent fallback | Unit/e2e / Kilo | P03/P08 AC07/09 |
| T24 | Keyboard, tap alternative, focus return, screen reader, color, mute/reduced motion | All mechanics completable; zero serious/critical a11y in new flow | Browser + axe + manual / Kilo | P06/P09 AC10 |
| T25 | 375px/desktop; loading/error/bonus locked/long localization | No blocking overflow or hidden action | Visual verdict JSON + screenshots / AGY, Kilo | P02/P09 AC10 |
| T26 | Wrong/hints/skip/exit/many absent days | No star deduction, forced replay, lost collection or habit point change | Engine + e2e / Kilo | P05/P08 AC02/06 |
| T27 | Flag off/lazy load/slow device/network | No year prefetch; no game request when off; perf budget | Build/performance + browser / Kilo | P08/P09 AC13 |
| T28 | Missing migration/content withdrawn/kill switch mid-play | Calm fail-closed state, no unreviewed fallback, audit retained | SQL + API + drill / P04, Kilo | P04/P11 AC14 |
| T29 | Apply/preflight/rollback, then old app reads state | Local DB pass; no unrelated data loss; compatibility documented | Local real DB / P04, Kilo | P04/P09 AC13/14 |
| T30 | Human pilot per age track | Duration/comprehension/hints/exit/task quality with real sample | Human observation / P10 | P10 AC11/12 |
| T31 | Existing task/history/approval/deferral/reward flows | Unchanged before/after integration | Existing regression suites / Kilo | P08/P09 AC13 |
| T32 | Re-enable after rollback/kill switch; stale clients | No duplicate grant; old content version attempts remain valid | API + browser / Kilo | P11 AC01/14 |
| T33 | Common lock order / deadlock probe | 20 concurrent complete vs review vs undo vs start; no deadlock, deterministic winner, one bonus | Real PostgreSQL / P04, Kilo | P04 AC01/03 |
| T34 | Batch review mixed approve/reject | Bonus sync once after batch; no transient grant; correct final state | Real SQL / P04, Kilo | P04 AC03 |
| T35 | Game revoke vs approved habit | Approved log status/points unchanged; only game ledger changes | SQL/API / P04, Kilo | P04 AC03 |
| T36 | Main without habit / bonus without main | Main grants independently; bonus serves same journey index; journey advances only on main | API/e2e / Kilo | P05 AC01/02 |
| T37 | Settings timezone missing/invalid | No snapshot/entitlement; `timezone_required`/`timezone_invalid`; parent setup | API + UI / Kilo | P04/P08 AC14 |
| T38 | Age 6–8 vs 9–12 vs unknown/override | Correct track, correct tap target/duration target, no fallback | Unit + browser / Kilo | P02/P03 AC07/09/10 |
| T39 | Pilot manifest accepted only with pilot profile | Production validator rejects pilot spacing/coverage; pilot never adds 24/730 coverage | Validator / OpenCode, Kilo | P05/P07 AC07/08 |
| T40 | Production manifest repeated format at 3 days | Rejected for `<7` spacing; 11-day CSV passes | Validator / Kilo | P07 AC08 |
| T41 | Main/bonus skill equality | Any equal day fails; current CSV is 0 equal / 365 different | Validator / Kilo | P07 AC08 |
| T42 | 24 type ids vs 96 variant pairs | Both counts reported separately; a claim missing either fails | Validator / Kilo | P07 AC07/08 |
| T43 | Flags default off / bonus flag off / pilot flag off | No requests/content; main works when master on and bonus off | Unit + e2e / Kilo | P08 AC14 |
| T44 | Early usability checkpoint (3 games/7 days) | ≥3 children/track observed or gate BLOCKED; no P06/P07 start | Human observation / P10/P05A | P05A AC11 |
| T45 | Paused/finished attempt restored after reconnect | Same attempt/content version; no new entitlement; stable history | Browser + API / Kilo | P05/P08 AC05/14 |
| T46 | Pause vs main | Paused family/day returns `paused`, creates no new main/bonus grant; started attempt can finish | SQL/API + browser / Kilo | P04 AC02/03 |
| T47 | Game-owned receipt timestamps | Completion creates `thinking_game_habit_receipts.received_at`; review sets `reviewed_at`; no client timestamp and no assumed `activity_logs.completed_at` default | Real SQL / P04, Kilo | P04 AC03 |
| T48 | Game response envelope | `bonus_*` are `{ok:true}` HTTP 200 through `thinkingGameResponseSchema`; habit `domainCommandResultSchema` unchanged; malformed body fails closed | Unit/API / Kilo | P04/P08 AC14 |
| T49 | Advisory lock scope | All six habit RPCs take the unconditional child lock; exact key; 20-way race no deadlock; AC13 performance budget recorded | Real PostgreSQL / P04, Kilo | P04 AC01/03 |
| T50 | Not-found/route/rate-limit | `attempt_not_found` and cross-family id return identical `not_found`; new route prefixes deliberate; 429 has `Retry-After` and no data | API / Kilo | P04 AC04 |

## 3. Test files and commands

Proposed new paths (not created):

- `tests/unit/thinking-games/*.test.ts`
- `tests/api/thinking-games.test.ts`
- `tests/integration/migrations/thinking-games.test.ts`
- `tests/e2e/thinking-games*.spec.ts`
- `scripts/check-thinking-games-content.mjs`

Commands already in `package.json` (run only when the files exist):

```sh
npm run lint
npm run typecheck
npm run test:unit
npm run test:api
npm run test:integration
npm run test:e2e -- tests/e2e/thinking-games.spec.ts
npm run test:a11y
npm run check:secrets
npm run check:audit
npm run build:cloudflare
npm run check:performance
npm run ci
```

The local SQL concurrency/RLS runner must be added following the project's real pattern; do not use the existing `test:sql` as evidence for game schema until cases exist. Do not run parallel jobs that write `.next`, manifests, DB fixtures or browser ports.

Baseline suites to read before integration: `kid-history`, `morning-mascot-letter`, `quest-deferral`, `reward-mutation`, `family-isolation`, `kid-praise-copy`, `age-band`, `active-child` (use actual names).

## 4. Evidence contract

Every case records: verdict `PASS | FAIL | MOCK-ONLY | NOT-RUN | BLOCKED`, command, exit code, timestamp, environment/DB version, commit, contract/content/schema versions, and report path.

- Mock-only does not satisfy SQL/RLS or real-browser gates.
- No tokens, child emails or raw personal content in logs/screenshots.
- P1/P2 unresolved, missing required case, build failure, unreviewed content or absent real pilot blocks the corresponding gate.
- A passing CSV structure check is not gameplay evidence.
- No observed error is not evidence of sufficient data.

## 5. Pilot / checkpoint gate

- Initial: at least 3 children per track (6–8, 9–12) for the P05A checkpoint, each with parent consent and 7 days of exposure; then at least 5 per track for the fuller P10 pilot.
- ≥80% of uninterrupted sessions finish in 60–120 seconds; ≥80% understand the rule after the example.
- Report sample size and distribution; do not hide a weak subgroup in a pooled average.
- Stop a cohort if >20% of 6–8 sessions exceed 180 seconds, if distress is observed, or if habit quality degrades.
- If real observation/consent is unavailable: `BLOCKED`/`NOT-RUN`; do not start P06/P07 or claim usability.
- No IQ/cognitive improvement claim from a small pilot.
