# Lifecycle email and refund operations

## Email dispatch

1. Confirm `202609280001_lifecycle_revenue_operations.sql` is applied.
2. Keep `LIFECYCLE_EMAILS_ENABLED=false` until the sender domain and privacy review are complete.
3. Set Worker secrets `RESEND_API_KEY`, `LIFECYCLE_EMAIL_FROM`, `CRON_SECRET` and `RESEND_WEBHOOK_SECRET`. To deliver through Brevo instead, set `LIFECYCLE_EMAIL_PROVIDER=brevo` and `BREVO_API_KEY` (bounce and complaint handling then lives in the Brevo dashboard; the suppression webhook below is Resend-only).
4. Set GitHub secret `LIFECYCLE_CRON_SECRET` to the same value as `CRON_SECRET`.
5. Register the signed provider webhook documented in `docs/deployment.md`.
6. Enable lifecycle email and manually dispatch once.
7. Confirm the outbox row becomes `sent`, has one provider message ID and contains no child/activity content.
8. Replay the same lifecycle source event and confirm the unique dedupe key prevents another row and another email.

If the provider is unavailable, leave messages in retry/dead-letter state. Do not fail profile, payment or support writes. Disable `LIFECYCLE_EMAILS_ENABLED` to stop sending while preserving the outbox for controlled replay.

## Bounce, complaint and unsubscribe

- A valid signed bounce, complaint or suppression webhook adds an `all` suppression for that user.
- Marketing messages additionally require `parent_profiles.marketing_consent=true`; changing it to false blocks dispatch immediately.
- Do not remove an `all` suppression until the destination issue is confirmed resolved and the operator has evidence for the change.
- No marketing producer is enabled by this phase.

## Pending payment cancellation

1. Open `/admin` and create a cancellation case with the PayOS order code.
2. Verify the order belongs to the selected family and remains `PENDING`.
3. Set the result to `payment_link_cancelled` and save.
4. The application calls PayOS first, then marks the local order `CANCELLED` only after provider confirmation.
5. If PayOS does not confirm, keep the case open and reconcile in the PayOS dashboard.

## Paid refund

PayOS has no automated refund endpoint in the contract used by this application. Never mark a refund complete merely because it was approved.

Published policy: a customer who is not satisfied may request a refund within 30 days of the payment date. Treat a request received inside that window as eligible; only check that the order exists, was paid and has not already been refunded.

1. Create a refund case linked to the order when available.
2. Move it to `reviewing`; verify customer, order, amount and policy eligibility outside child data surfaces.
3. If approved, set `manual_refund_required`.
4. Perform and independently verify the bank/provider refund using the approved operator process.
5. Only after verification, set status `completed` with `manual_refund_confirmed`.

Confirmation also revokes the subscription grant from that order in the same transaction. Later purchases are replayed from recorded settlement snapshots, retaining their own plan and term; retrying the same confirmed case does not revoke time twice. Add-on refunds retain their separate revocation rules.

If the API returns `subscription_grant_review_required`, the case stays open and the subscription is unchanged. Historical orders settled before grant recording, or a chain interrupted by an admin/coupon entitlement change, require an operator to verify the original grant and the intervening purchases before a reviewed repair. Do not bypass this check by cancelling the family's whole subscription, subtracting an estimated month/year, or marking the case completed separately. If money has already been returned, retain the verified refund evidence in the approved finance system while resolving the entitlement review.

Every state change writes an immutable case event and queues a generic customer status email. Do not put child names, activity details, pairing codes, bank account details or free-form sensitive notes in the case or email metadata.

## Family deletion and late payments

Family deletion returns `family_has_pending_payments` while any order is `PENDING`. Reconcile the provider outcome or complete the provider-confirmed cancellation flow first, then retry deletion. Expiry on the local clock alone does not establish that no money arrived.

A verified payment received for a cancelled checkout or an order with no owner is recorded in the service-only `billing_late_payments` queue, keyed by provider reference and independent of the family. The webhook acknowledges it as `late_payment_recorded`; it does not grant a subscription. Finance must inspect `status = 'needs_review'`, match the order/reference/amount in the provider dashboard, then perform the approved manual refund or reconciliation. Only after independent verification should an authorized operator set `status = 'resolved'` and `resolved_at` together. The queue stores no bank details or raw provider payload, and a duplicate webhook cannot create another task. The original order can remain cancelled or pending while this independent receipt is reviewed.

## Uncertain lifecycle delivery

Each claim supplies a fresh `claim_token`; completion must include it as `lease_token`. A stale or tokenless completion cannot modify the row. Each provider request times out after 30 seconds and the dispatcher claims ten rows per batch to leave margin inside the ten-minute lease.

Only a successful `finish_lifecycle_message` result of `true` counts as persisted delivery/failure. The dispatcher returns HTTP 503 with separate `uncertain` and `persistenceFailures` counters when provider acceptance or the persistence result is unclear. When possible it saves the accepted provider message ID on a quarantined row. It never turns an accepted message with a failed state write into a retryable provider failure.

Transport timeouts, malformed acceptance responses and expired `processing` leases are held as `dead_letter` for reconciliation, including attempts below the retry limit. Brevo enqueue dedupe does not provide delivery idempotency. Before manually requeueing an uncertain row, check the provider using the existing dedupe key, time and any saved provider ID; record a verified acceptance as sent or retry only after verifying non-delivery. Keep uncertain rows quarantined if the provider cannot establish the outcome. Ordinary explicit provider rejections retain bounded retries.

## Deploy and rollback of billing/lifecycle recovery

Pause dispatch scheduling and drain in-flight sends before applying `202610270001_billing_lifecycle_recovery.sql`; deploy the matching dispatcher before resuming. The old completion signature fails closed, and the new dispatcher refuses to send tokenless claims, so an app/schema mismatch requires rollout correction. Execute the scenario fixture `tests/integration/migrations/billing-lifecycle-recovery.scenarios.sql` only in an authorized disposable database; parser checks do not establish database behavior or concurrency safety.

The rollback is guarded: it refuses when grant records, late-payment records or uncertain/in-flight delivery evidence exist. After monetary activity, use a reviewed forward repair; preserve receipt/grant history. Do not delete records to force rollback through the guard.
