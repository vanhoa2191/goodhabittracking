# Copilot day-gates recovery checkpoint

## Recovery status

This recovery dispatch resumed after the prior day-gates process exited and its
terminal was released. The prior output log confirms that the migration and
day-gates runtime had reached a real-Postgres PASS for age-track resolution,
main start, pause blocking, and bedtime blocking; the settings and admission
security runtimes also passed after their fixture setup corrections. No prior
day-gates handoff existed on disk at recovery start, so this file records the
observed state before continuing.

## Known limitations at checkpoint

The existing day-gates runtime covers only a narrow pause/bedtime/age smoke
set. It does not yet prove master-disable immediacy, quiet/bonus behavior,
invalid or missing IANA timezone fail-closed behavior, strict age cases and
next-day override timing, or rollover closure/no-third-slot semantics. Those
cases remain open and must be validated against the actual SQL functions before
claiming completion.

## Owned files at checkpoint

- `supabase/migrations/202610210001_thinking_games.sql`
- `tests/integration/migrations/thinking-games-day-gates-runtime.mjs`
- this handoff

The recovery will preserve the prior security and lock-key changes and will not
reset unrelated work.

## Recovery completion evidence

The migration now:

- gates child and parent starts before snapshot/entitlement creation on family
  pause, feature disablement, invalid/missing timezone, and server-local
  bedtime blackout (including cross-midnight windows);
- resolves age from `birth_year` against the family IANA-local server date,
  returning only `age_6_8`, `age_9_12`, or `age_track_unavailable`, while
  retaining the two-track settings override and ignoring `age_band_override`;
- closes prior-day granted entitlements as `expired` and unfinished attempts as
  `abandoned_rollover` under the child advisory lock, without changing journey
  progress; old finishes return `attempt_expired`.

The expanded runtime passed against disposable PostgreSQL 18.4 at
`127.0.0.1:55432`:

```text
thinking-games-day-gates-runtime.mjs: PASS
  age-track-resolution, strict-age-boundaries, main-start, pause-block,
  bedtime-block, master-disable, rollover-abandon, rollover-finish-expired
thinking-games-runtime.mjs: PASS (6 cases)
thinking-games-settings-runtime.mjs: PASS (5 cases)
thinking-games-admission-security-runtime.mjs: PASS (3 cases)
thinking-games-gameplay-runtime.mjs: PASS (3 cases)
thinking-games-habit-integration-runtime.mjs: PASS (4 cases)
thinking-games-habit-parity-runtime.mjs: PASS (4 cases)
thinking-games-security-runtime.mjs: PASS (5 cases)
```

The read-only catalog runtime was not claimable because its fixture does not
create `public.family_engagement_settings`; it fails with PostgreSQL `42P01`
before exercising catalog behavior. It was not edited because that test is
outside this dispatch's exclusive write scope.

Final hashes:

```text
a26f1113796b4f8c3116ea080df2d453caf7250adf75554c173a01adae8e4787  supabase/migrations/202610210001_thinking_games.sql
6925bb4d158927d6c20af2ac2a5e45fb4df244fac831b79d4fc664378622f75b  tests/integration/migrations/thinking-games-day-gates-runtime.mjs
```
