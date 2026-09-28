# Lifecycle email and refund operations

## Email dispatch

1. Confirm `202609280001_lifecycle_revenue_operations.sql` is applied.
2. Keep `LIFECYCLE_EMAILS_ENABLED=false` until the sender domain and privacy review are complete.
3. Set Worker secrets `RESEND_API_KEY`, `LIFECYCLE_EMAIL_FROM`, `CRON_SECRET` and `RESEND_WEBHOOK_SECRET`.
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

1. Create a refund case linked to the order when available.
2. Move it to `reviewing`; verify customer, order, amount and policy eligibility outside child data surfaces.
3. If approved, set `manual_refund_required`.
4. Perform and independently verify the bank/provider refund using the approved operator process.
5. Only after verification, set status `completed` with `manual_refund_confirmed`.

Every state change writes an immutable case event and queues a generic customer status email. Do not put child names, activity details, pairing codes, bank account details or free-form sensitive notes in the case or email metadata.
