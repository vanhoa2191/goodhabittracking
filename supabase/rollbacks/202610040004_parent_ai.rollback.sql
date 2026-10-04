begin;

drop function if exists public.consume_ai_quota(integer, integer, integer);
drop table if exists public.ai_usage;
drop table if exists public.ai_system_usage;

-- Agreements to the AI use go with the feature; the earlier consent types stay.
delete from public.family_consents where consent_type = 'parent_ai';
alter table public.family_consents drop constraint if exists family_consents_consent_type_check;
alter table public.family_consents
  add constraint family_consents_consent_type_check
  check (consent_type in ('privacy', 'child_data', 'leaderboard', 'analytics', 'parent_reminders'));

commit;
