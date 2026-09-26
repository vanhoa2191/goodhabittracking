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

`session_started`, `task_ticked`, `habit_reviewed`, `mascot_selected`, `mascot_letter_read`, and `wishlist_selected` are connected to their corresponding app flows. Mascot events require an actual mascot change; a color-only update does not count. Letter and wishlist events follow successful state changes. The destination remains unconfigured, so these events do not leave the device even after a parent opts in. `secret_quest_completed` is reserved for its future product flow. Failed saves and duplicate cloud commands must not emit an event; the latter depends on the atomic transition results introduced by migrations `202609240006` and `202609240007`.

## Parental consent gate

Authenticated parents can explicitly enable or revoke anonymous measurement in family settings. The choice is stored per family, parent, consent type, and policy version; the default is off when no record exists. Revocation is retained as a timestamp rather than deleting the consent history. The application loads this durable choice into the store's `analyticsOptIn` gate, but it still does not configure an event sink or send analytics requests. Migration `202609250002_analytics_parent_consent.sql` extends the existing consent scope for this record and must be applied before the production UI is deployed.

## Dashboard definitions and prerequisites

| Metric | Formula | Additional data needed before it can be reported |
|---|---|---|
| DAU / MAU | distinct consented users with a session on a calendar day / rolling 30 days | stable pseudonymous identifier and explicit parental analytics consent |
| D7 retention | consented users active on day 7 after first session / consented users first active on day 0 | stable pseudonymous identifier, consent, cohort timestamps |
| Tasks per session | completed `task_ticked` events / child sessions | session lifecycle and a session-scoped key |
| Session duration | session end minus session start, median and distribution | session end/background event; cap idle time |
| Completion rate | completed eligible quests / eligible quests shown | eligibility/exposure event, excluding unavailable tasks |
| NPS | % promoters (9–10) minus % detractors (0–6) | optional parent-only survey; never ask the child |

None of these dashboard figures is available yet. Do not infer them from event counts or show them as real performance data. The store accepts an event sink only when its explicit `analyticsOptIn` gate is true, and the application now derives that gate from the authenticated parent's durable choice. Before configuring PostHog or another vendor, document retention/deletion and regional processing, add a stable pseudonymous identifier, and validate the destination in non-production. Production collection stays disabled until those gates pass.

## Safe versus Evolve pre-registration

The `safe-vs-evolve-v1` analysis contract is pre-registered in [`src/lib/experiment-report.ts`](../src/lib/experiment-report.ts). Safe is the control experience; Evolve is the feature-flagged engagement experience. The North Star is completed tasks per child-facing session. The mandatory stop guardrail is the Evolve arm's average child-session duration: if it exceeds 480 seconds, pause Evolve and reduce engagement prompts before any restart.

The reporter accepts only aggregate-ready observations with an opaque, externally salted participant key, arm, exposure state, and bounded session summaries. Its strict boundary rejects extra fields such as names, free text, full identifiers, timestamps, pairing data, and payment data. It never emits participant keys. Generate a report with:

```bash
npm run report:experiment -- /absolute/path/to/anonymized-observations.json
```

The output reports assigned sample, actual exposure, completed tasks per session, and the eight-minute guardrail. It is deliberately descriptive-only until a baseline, minimum detectable effect, power, and approved sample size are registered. It cannot declare a winning arm. With no real consented export, the experiment remains not started; do not substitute demo or synthetic fixtures for product evidence.
