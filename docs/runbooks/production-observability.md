# Production observability

## Signals and privacy boundary

The public `/api/health` endpoint verifies application, database, billing and pairing readiness. The protected `/api/internal/operations/health` endpoint reads only aggregate counters. It never returns event rows, user IDs, family IDs, child data, payment payloads, pairing credentials, email addresses or phone numbers.

`operational_events` stores only an allowlisted signal type, reason code, HTTP status, random correlation ID and timestamp. Application error objects and request payloads must stay out of this table and out of logs. `src/lib/observability/logger.ts` rejects values outside its safe code/path/UUID formats.

## Alert thresholds

The rolling window is 15 minutes:

- payment webhook processing failures: 3;
- child profile mutation failures: 5;
- pairing failures: 20;
- lifecycle outbox dead letters: 1;
- lifecycle messages locked for more than 15 minutes: 1.

The scheduled `production-observability.yml` workflow checks production every 15 minutes. The first failure opens one GitHub issue; repeated failures append sanitized evidence; recovery comments on and closes the same issue. A deployment also fails immediately when the post-deploy public health check is not ready.

## Triage

1. Start with the timestamp, signal name, aggregate count and correlation IDs from sanitized Worker logs. Do not copy payloads or personal data into an issue.
2. Payment: verify webhook signature failures separately from processing failures, then reconcile the affected order in PayOS and the local order state.
3. Profile or pairing: compare the failure spike with the latest deploy and database migration; preserve family isolation while diagnosing.
4. Outbox: inspect dead-letter reason codes and locked timestamps. Do not manually mark mail sent without provider evidence.
5. Roll back the Worker for a deploy regression. Do not roll back or reset the database until migration compatibility has been assessed.

## Drill

In preview, insert only synthetic `operational_events` rows without user or family identifiers until one threshold is reached. Confirm the protected endpoint returns `503`, the workflow creates one issue, then remove the synthetic rows and confirm the next run posts recovery and closes it. Never run the drill against production without an announced maintenance window.
