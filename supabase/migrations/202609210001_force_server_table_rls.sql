begin;

alter table public.billing_webhook_events force row level security;
alter table public.family_consents force row level security;

commit;
