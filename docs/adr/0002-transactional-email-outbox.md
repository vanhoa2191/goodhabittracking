# ADR 0002: Transactional email outbox and provider boundary

- Status: accepted for implementation; production enablement pending
- Date: 2026-09-28

## Decision

KidHabit Hero keeps lifecycle state in a PostgreSQL outbox and uses Resend only as the delivery adapter. The application sends no email directly from profile, trial, payment or support request handlers.

The outbox owns deduplication, bounded retries, dead-letter state and suppression checks. Resend receives only the destination email address, generic transactional copy and the minimum payment/support fields required by the template. Names of children, activity content, pairing codes and family identifiers never enter email subject, body, provider tags or operational logs.

Marketing messages have a separate category and remain blocked unless the parent profile has active marketing consent and no applicable suppression. No marketing producer is enabled in this phase.

## Why Resend

- Cloudflare publishes an official Workers integration guide for Resend.
- The send API accepts an idempotency key, allowing the durable outbox key to protect retries from duplicate delivery.
- Provider suppression and webhook visibility exist for bounce and complaint handling.
- Direct HTTPS calls avoid adding an SDK to the runtime bundle.

Cloudflare Email Sending was considered but is still beta and requires the paid Workers plan. It remains a future adapter option because the product-owned outbox is provider-independent.

## Boundaries

- `LIFECYCLE_EMAILS_ENABLED=false` is the safe default.
- Production activation requires a verified sender domain, processor/privacy review, approved retention window, Worker secrets and a real inbox smoke test.
- Provider failure cannot fail profile, payment activation or support-case writes.
- PayOS documents cancellation of pending payment links, not automated refunds of completed bank transfers. Paid refunds therefore use an auditable manual workflow and cannot be marked complete without operator confirmation.

## Sources reviewed

- Cloudflare: <https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/>
- Resend idempotency: <https://resend.com/changelog/idempotency-keys>
- Resend suppression visibility: <https://resend.com/changelog/email-suppression-visibility>
- PayOS API: <https://payos.vn/docs/api/>
