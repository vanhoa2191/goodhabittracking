---
phase: 3
title: "Mascot and Kid shell"
status: in_progress
priority: P1
effort: "5-7 days"
dependencies: [1, 2]
---

# Phase 3: Mascot and Kid shell

## Overview

Finish named mascot selection, per-mascot Kid hero, visible sound control, and daily letter.

## Requirements

- [ ] Create a six-card accessible selector with seven-day change limit and persisted timestamp.
- [ ] Add local-day letter/read state; keep sound visible at every Kid breakpoint with night/reduced-motion rules.

## Implementation Steps

1. Define mascot/expression/season asset manifest and QC master assets before variants.
2. Persist selection, apply hero palette only, and test child/parent shells plus letter read behavior.

## Todo

- [x] Six mascot masters are 512 × 512 RGBA PNGs and pass a visual check for complete, consistent silhouettes.
- [x] Letter appears at most once per local day and stays readable in local-family and simulated paired-child browser flows.

## Progress

- Kid sound control is visible in the header at 375, 768, and 1280 px with a 44 px target and pressed state. Browser interaction checks pass on desktop and mobile Chromium.
- Mascot changes now have a 168-hour cooldown in local family state and a database trigger for cloud accounts. Legacy emoji and canonical IDs of the same mascot count as one choice; an explicit non-default choice at profile creation starts the timer. The picker shows the next available date and still permits color changes; demo sessions remain unrestricted. Desktop/mobile browser checks and static SQL checks pass. The production migration and privilege preflight succeeded on 2026-09-23; a valid-session concurrency check remains before release.
- A paired child device now has a session-scoped read and mutation path instead of relying on parent authentication. API contract tests and desktop/mobile browser tests with a simulated paired session pass. The production RPC rejects an invalid token; a real paired-session check remains before release.
- After explicit user confirmation, the mascot cooldown and daily letter migrations were applied to the Supabase production project on 2026-09-23. Both privilege preflights passed. The three public RPCs rejected invalid tokens via HTTP 200 plus `session_invalid`, and GET `/api/health` stayed `ready` with every dependency check true. No production test family, child, letter, or device session was created.
- The previously applied foundation migration also passes its live preflight. SQL Editor changes bypassed Supabase's migration ledger: versions `202609230001` through `202609230003` are absent there, while earlier versions are recorded. Reconcile them with the official migration-repair workflow before a future `db push`; do not rerun the already-applied SQL. No active paired-child session existed at verification time, so the authorized-token path remains untested on production.
- Adding a new mascot requires updating both the visual manifest and the database trigger's allowed IDs.
- Sound effect volume now halves from 20:00 to 06:59 in the device's local time. Canvas celebrations honor reduced-motion preference; CSS motion was already globally reduced.
- Daily letters have personality-specific three-sentence VI/EN copy (other locales fall back to EN), appear after 07:00 device time, and preserve one template/read state per child and local day. Local families persist through the existing experience state; cloud families use a family- or paired-session-scoped database command. Unit, API, SQL syntax, and desktop/mobile browser checks pass. The live command exists and rejects invalid sessions; a valid-session read/write check remains, so no Phase 3 release is claimed.
- A paired-child cookie now takes precedence over any leftover parent login cookie when opening or reading a letter. If saving the read state fails, the letter stays visible and the child can retry. API regression tests, desktop/mobile retry browser checks, the full unit suite, lint, typecheck, and Cloudflare build pass. The web app changes have not been committed or deployed.
- The daily letter UI now honors a build-time flag and remains off by default in production until a valid paired-child session is verified there. A follow-up migration rejects unknown avatar changes that could evade the mascot cooldown; it was applied on 2026-09-23 and its production preflight passed. The SQL Editor application also bypassed the migration ledger, which still needs reconciliation before a future CLI `db push`.

## Success Criteria

Ship masters first; unreviewed variants never block the loop.
