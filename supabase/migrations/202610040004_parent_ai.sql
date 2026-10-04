begin;

-- A parent can agree, separately and revocably, to send a habit title or weekly counts to an AI model for a suggestion.
alter table public.family_consents
  drop constraint if exists family_consents_consent_type_check;

alter table public.family_consents
  add constraint family_consents_consent_type_check
  check (consent_type in ('privacy', 'child_data', 'leaderboard', 'analytics', 'parent_reminders', 'parent_ai'));

-- How many suggestions a family asked for today and when it last asked (UTC days, like the model allowance resets).
create table public.ai_usage (
  family_id uuid not null references public.families(id) on delete cascade,
  day date not null,
  calls integer not null default 0 check (calls >= 0),
  last_call_at timestamptz,
  primary key (family_id, day)
);

-- The free allowance is shared by the whole account, so the total across families is counted too.
create table public.ai_system_usage (
  day date primary key,
  calls integer not null default 0 check (calls >= 0)
);

alter table public.ai_usage enable row level security;
alter table public.ai_usage force row level security;
alter table public.ai_system_usage enable row level security;
alter table public.ai_system_usage force row level security;
revoke all on public.ai_usage, public.ai_system_usage from public, anon, authenticated;

-- Takes one suggestion from the family's day and from the account's day in one step, or says why not. A call that
-- fails later still counts, because it may have spent the shared allowance.
create function public.consume_ai_quota(per_day integer, system_per_day integer, min_gap_seconds integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  today date := (now() at time zone 'utc')::date;
  system_calls integer;
  family_calls integer;
  last_call timestamptz;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if per_day is null or per_day not between 1 and 100
    or system_per_day is null or system_per_day not between 1 and 100000
    or min_gap_seconds is null or min_gap_seconds not between 0 and 3600 then
    raise exception 'invalid_ai_quota';
  end if;

  insert into public.ai_system_usage (day) values (today) on conflict (day) do nothing;
  select calls into system_calls from public.ai_system_usage where day = today for update;
  if system_calls >= system_per_day then return jsonb_build_object('allowed', false, 'reason', 'system_day'); end if;

  insert into public.ai_usage (family_id, day) values (actor_family_id, today) on conflict (family_id, day) do nothing;
  select calls, last_call_at into family_calls, last_call
  from public.ai_usage where family_id = actor_family_id and day = today for update;
  if family_calls >= per_day then return jsonb_build_object('allowed', false, 'reason', 'family_day'); end if;
  if last_call is not null and now() - last_call < make_interval(secs => min_gap_seconds) then
    return jsonb_build_object('allowed', false, 'reason', 'too_fast');
  end if;

  update public.ai_system_usage set calls = calls + 1 where day = today;
  update public.ai_usage set calls = calls + 1, last_call_at = now() where family_id = actor_family_id and day = today;
  return jsonb_build_object('allowed', true, 'remainingToday', per_day - family_calls - 1);
end
$$;

revoke all on function public.consume_ai_quota(integer, integer, integer) from public, anon, service_role;
grant execute on function public.consume_ai_quota(integer, integer, integer) to authenticated;

commit;
