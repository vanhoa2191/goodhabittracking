begin;

alter table public.family_consents
  drop constraint if exists family_consents_consent_type_check;

alter table public.family_consents
  add constraint family_consents_consent_type_check
  check (consent_type in ('privacy', 'child_data', 'leaderboard', 'analytics', 'parent_reminders'));

commit;
