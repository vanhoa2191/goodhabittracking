# Product analytics

The application defines a strict, content-free event boundary in [`src/lib/product-analytics.ts`](../src/lib/product-analytics.ts). There is no configured destination, persistent analytics identifier, or outbound analytics request. Passing an explicit sink in tests does not enable collection in the application. Profile names, habit text, child/family/user IDs, pairing codes, payment data, and timestamps are not allowed in event payloads. Approval delay is represented only as a coarse bucket.

## Event contract

| Event | Meaning | Allowed detail |
|---|---|---|
| `session_started` | A child-facing session begins | demo/local/cloud mode |
| `task_ticked` | A saved completion, pending request, or undo | action and local/cloud mode |
| `habit_reviewed` | A saved parent approval or rejection | decision, coarse delay bucket, mode |
| `mascot_selected` | A mascot was selected | mode |
| `mascot_letter_read` | A mascot letter was opened | mode |
| `secret_quest_completed` | A secret quest was completed | mode |
| `wishlist_selected` | A wishlist item was selected | mode |

`session_started`, `task_ticked`, and `habit_reviewed` are connected to their corresponding app flows, but the destination remains unconfigured. The remaining event names are reserved for their future product flows. Failed saves and duplicate cloud commands must not emit an event.

## Dashboard definitions and prerequisites

| Metric | Formula | Additional data needed before it can be reported |
|---|---|---|
| DAU / MAU | distinct consented users with a session on a calendar day / rolling 30 days | stable pseudonymous identifier and explicit parental analytics consent |
| D7 retention | consented users active on day 7 after first session / consented users first active on day 0 | stable pseudonymous identifier, consent, cohort timestamps |
| Tasks per session | completed `task_ticked` events / child sessions | session lifecycle and a session-scoped key |
| Session duration | session end minus session start, median and distribution | session end/background event; cap idle time |
| Completion rate | completed eligible quests / eligible quests shown | eligibility/exposure event, excluding unavailable tasks |
| NPS | % promoters (9–10) minus % detractors (0–6) | optional parent-only survey; never ask the child |

None of these dashboard figures is available yet. Do not infer them from event counts or show them as real performance data. Before configuring PostHog or another vendor, obtain the required parental opt-in, document retention/deletion and regional processing, and validate the destination in non-production. Production collection stays disabled until those gates pass.
