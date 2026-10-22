# AR-20 Fixture Clock Independence QA Handoff

**Date:** 2026-10-22  
**Agent:** Cline (ctx_e86b936f4866)  
**Task:** task_b4c6667c1cd9  
**Dispatch Context:** ctx_db3b40917e01  

---

## Summary

Fixed the AR-20 fixture clock independence issue where the test was incorrectly failing with "unexpected error: bedtime" due to the timezone selection logic picking a zone that placed the local time inside the bedtime blackout window (21:00–07:00).

**Result:** AR-20 now **PASS** (was FAIL with bedtime). 24/25 cases pass. The sole remaining failure (AR-06) is a pre-existing SQL bug unrelated to clock/bedtime.

---

## Root Cause

The original `zoneForLocalHour()` function selected a timezone based only on UTC hour, ensuring the local hour was 1–21 for cutoff purposes, but **did not account for the bedtime window (21:00–07:00)**.

At UTC hour 0 (the test run time):
- Original logic picked `Etc/GMT-2` (UTC+2) → local hour 02:00
- Bedtime is 21:00–07:00 → 02:00 is **inside bedtime**
- All `thinking_game_start` calls raised `bedtime` exception

This affected 14/25 cases including AR-20 (age track resolution), which has no intentional bedtime dependency.

---

## Fix Applied

**File:** `tests/integration/migrations/thinking-games-authority-races-runtime.mjs`

Replaced `zoneForLocalHour()` with `pickAwakeZone()` that:
1. Queries the **DB clock** (`now()`) for the current UTC hour
2. Iterates through 25 fixed-offset IANA zones (`Etc/GMT±12` … `Etc/GMT`)
3. Returns the first zone where **local hour ∈ [7, 20]** (awake window, outside bedtime)
4. Uses **real IANA zones**, no hardcoded dates, no client clock

```javascript
const AWAKE_ZONES = [
  'Etc/GMT+12', 'Etc/GMT+11', ..., 'Etc/GMT-12'
];

async function pickAwakeZone(db) {
  const { utc_hour } = await db.one(
    `select extract(hour from now() at time zone 'UTC')::int as utc_hour`);
  for (const zone of AWAKE_ZONES) {
    const { local_hour } = await db.one(
      `select extract(hour from now() at time zone $1)::int as local_hour`, [zone]);
    if (local_hour >= 7 && local_hour <= 20) return zone;
  }
  return 'UTC'; // fallback (never reached with 25 zones covering all offsets)
}
```

At UTC 00:46, the fix selected `Etc/GMT+12` (UTC−12) → local hour 12:00 (noon), safely outside bedtime.

---

## Verification

### Baseline (before fix) — `authority-races-2026-10-22T00-46-32-277Z.json`
| Metric | Value |
|--------|-------|
| Exit | 1 (FAIL) |
| Pass/Fail/Blocked | 11 / 14 / 0 |
| Timezone | `Etc/GMT-2` (UTC+2) |
| Local hour | 02:00 |
| Bedtime hits | 14 cases (AR-01, AR-03, AR-04, AR-05, AR-06, AR-07, AR-08, AR-09, AR-18, **AR-20**, AR-21, AR-22, plus AR-02 cascading) |

### After fix — `authority-races-2026-10-22T00-47-03-495Z.json`
| Metric | Value |
|--------|-------|
| Exit | 1 (FAIL) — **sole failure is AR-06, unrelated to bedtime** |
| Pass/Fail/Blocked | 24 / 1 / 0 |
| Timezone | `Etc/GMT+12` (UTC−12) |
| Local hour | 12:00 |
| **AR-20** | **PASS** — age track resolves correctly, unknown age returns `age_track_unavailable` |
| **AR-14** | **PASS** — negative bedtime control still works (explicitly sets bedtime to 00:00–23:59, expects `bedtime` refusal) |
| SQL SHA-256 | `783fd5a62c027f4871109316ecbc9f2357ab4800bd7cec32320be7a85a475425` (unchanged) |

---

## AR-06 Failure (Pre-existing, Not Clock-Related)

```
AR-06 FAIL: the bonus entitlement must become 'revoked_unused', got revoked_after_use
```

This is a **source SQL bug** in the undo path (`thinking_game_undo_habit_command` / bonus revocation logic), not a fixture issue. The bedtime fix merely allowed the test to reach this assertion. Per instructions: *don't fix tests around it; leave precise repro.*

---

## Constraints Satisfied

| Constraint | Status |
|------------|--------|
| Only AR-20 fixture setup modified | ✅ Only `zoneForLocalHour` → `pickAwakeZone` in the shared fixture |
| All 25 other cases preserved | ✅ 24 now pass (were 11); AR-14 negative bedtime test still passes |
| AR-14/other negative bedtime controls intact | ✅ AR-14 explicitly overrides bedtime to test blackout |
| No global time override / client clock loophole | ✅ Uses `now()` at DB + IANA zone |
| No hardcoded Oct 21 / browser date | ✅ Uses `now()` and dynamic zone selection |
| SQL unchanged (INTERIM label) | ✅ SQL SHA-256 identical before/after |
| AR-20 idempotence/pin/puzzle/version/age/noextraslot assertions preserved | ✅ All pass |

---

## Evidence Artifacts

- **Baseline JSON:** `/tmp/goodhabit-games-authority-races-evidence/authority-races-2026-10-22T00-46-32-277Z.json`
- **After-fix JSON:** `/tmp/goodhabit-games-authority-races-evidence/authority-races-2026-10-22T00-47-03-495Z.json`
- **After-fix Log:** `/tmp/goodhabit-games-authority-races-evidence/authority-races-2026-10-22T00-47-03-495Z.log`
- **SQL SHA-256:** `783fd5a62c027f4871109316ecbc9f2357ab4800bd7cec32320be7a85a475425`

---

## Handoff to SQL Owner (ctx_511c1880671b / Nvidia)

The fixture clock independence issue is resolved. AR-20 now correctly exercises the age-track resolution path without incidental bedtime interference.

**Remaining open issue (source, not test):** AR-06 bonus revocation state mismatch (`revoked_after_use` vs expected `revoked_unused`). This is a genuine SQL logic defect in the undo/bonus path. Precise repro left in place — run the suite and observe AR-06 detail.

No test changes needed for AR-06; the assertion correctly captures the contract expectation.