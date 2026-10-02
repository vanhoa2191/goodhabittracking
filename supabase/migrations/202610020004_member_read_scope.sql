begin;

-- A caregiver is promised a read-only view of progress: the children, their habits, completions,
-- points, rewards and groups. Every other private row used to be readable by any family member,
-- including the child's journal, wishes, support observations, cue plans, device and payment records.
-- Those reads now need the same managing role that already guards writes.
do $$
declare
  target record;
begin
  for target in
    select * from (values
      ('child_journal_entries', 'child_journal_entries_read'),
      ('child_wishlists', 'child_wishlists_read'),
      ('habit_support_observations', 'habit_support_observations_read'),
      ('habit_cue_plans', 'habit_cue_plans_read'),
      ('family_engagement_settings', 'family_engagement_settings_read'),
      ('child_engagement_profiles', 'child_engagement_profiles_read'),
      ('daily_mascot_letters', 'daily_mascot_letters_read'),
      ('secret_quests', 'secret_quests_read'),
      ('child_task_deferrals', 'child_task_deferrals_read'),
      ('child_city_purchases', 'child_city_purchases_read'),
      ('payment_orders', 'payment_orders_select_family'),
      ('device_sessions', 'device_sessions_select_family'),
      ('device_audit_log', 'device_audit_select_family'),
      ('pairing_challenges', 'pairing_challenges_select_family')
    ) as policy(table_name, policy_name)
  loop
    execute format('drop policy if exists %I on public.%I', target.policy_name, target.table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (family_id is not null and public.can_manage_family(family_id))',
      target.policy_name, target.table_name
    );
  end loop;
end
$$;

-- A member still sees the consent they gave themselves; the family's managers see every consent.
drop policy if exists family_consents_select on public.family_consents;
create policy family_consents_select on public.family_consents for select to authenticated
  using (user_id = auth.uid() or public.can_manage_family(family_id));

-- Every lookup of "the caller's family" takes one membership, so an account belongs to one family.
-- Accepting a caregiver invitation already removes the account's empty family before joining.
create unique index if not exists family_memberships_one_family_per_user
  on public.family_memberships (user_id);

-- The PIN status carries a version that changes whenever the PIN is set or changed, so an unlock
-- cookie issued for an earlier PIN stops working.
create or replace function public.get_parent_pin_status(target_family_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.parent_settings%rowtype;
begin
  if not public.can_manage_family(target_family_id) then
    raise exception 'Family management is required' using errcode = '42501';
  end if;

  insert into public.parent_settings (family_id)
  values (target_family_id)
  on conflict (family_id) do nothing;

  select * into settings
  from public.parent_settings
  where family_id = target_family_id;

  return jsonb_build_object(
    'configured', settings.parent_pin_hash is not null,
    'version', case
      when settings.parent_pin_hash is null then null
      else (extract(epoch from settings.parent_pin_configured_at) * 1000000)::bigint::text
    end,
    'lockedUntil', case
      when settings.parent_pin_locked_until > clock_timestamp() then settings.parent_pin_locked_until
      else null
    end
  );
end;
$$;

revoke all on function public.get_parent_pin_status(uuid) from public, anon;
grant execute on function public.get_parent_pin_status(uuid) to authenticated;

-- Each caller is checked against its own budget first, so a caller that is already refused does not
-- spend the shared budget. The shared budget only counts manual codes, the one credential short enough
-- to guess; a scanned QR token carries 32 random bytes and is never held back by other callers.
create or replace function public.exchange_pairing_credential(
  manual_code_id text,
  manual_verifier_hash text,
  pairing_token_hash text,
  session_token_hash text,
  request_fingerprint_hex text,
  requested_device_label text default null
)
returns table (
  exchange_status text,
  device_session_id uuid,
  family_id uuid,
  child_id uuid,
  session_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  credential public.pairing_credentials%rowtype;
  rate_record public.pairing_rate_limits%rowtype;
  global_record public.pairing_rate_limits%rowtype;
  global_key constant bytea := decode(repeat('00', 32), 'hex');
  created_session_id uuid;
  created_session_expiry timestamptz := now() + interval '30 days';
begin
  if random() < 0.02 then
    delete from public.pairing_rate_limits stale
    where stale.window_started_at < now() - interval '1 day' and stale.fingerprint_hash <> global_key;
  end if;

  insert into public.pairing_rate_limits (fingerprint_hash, window_started_at, attempts)
  values (decode(request_fingerprint_hex, 'hex'), now(), 1)
  on conflict (fingerprint_hash) do update set
    window_started_at = case
      when public.pairing_rate_limits.window_started_at < now() - interval '10 minutes' then now()
      else public.pairing_rate_limits.window_started_at
    end,
    attempts = case
      when public.pairing_rate_limits.window_started_at < now() - interval '10 minutes' then 1
      else public.pairing_rate_limits.attempts + 1
    end
  returning * into rate_record;

  if rate_record.attempts > 10 then
    return query select 'rate_limited', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if pairing_token_hash is null then
    insert into public.pairing_rate_limits (fingerprint_hash, window_started_at, attempts)
    values (global_key, now(), 1)
    on conflict (fingerprint_hash) do update set
      window_started_at = case
        when public.pairing_rate_limits.window_started_at < now() - interval '1 minute' then now()
        else public.pairing_rate_limits.window_started_at
      end,
      attempts = case
        when public.pairing_rate_limits.window_started_at < now() - interval '1 minute' then 1
        else public.pairing_rate_limits.attempts + 1
      end
    returning * into global_record;

    if global_record.attempts > 120 then
      return query select 'rate_limited', null::uuid, null::uuid, null::uuid, null::timestamptz;
      return;
    end if;
  end if;

  -- A shared row lock keeps a rotation from committing between reading the credential and
  -- creating the session, so a replaced credential cannot finish pairing.
  if pairing_token_hash is not null then
    select * into credential
    from public.pairing_credentials stored
    where stored.token_hash = decode(pairing_token_hash, 'hex')
    for share;
  elsif manual_code_id is not null and manual_verifier_hash is not null then
    select * into credential
    from public.pairing_credentials stored
    where stored.display_code_id = upper(manual_code_id)
      and stored.verifier_hash = decode(manual_verifier_hash, 'hex')
    for share;
  else
    return query select 'invalid', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if not found then
    return query select 'invalid', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  insert into public.device_sessions (
    family_id, child_id, token_hash, capabilities, expires_at, device_label, last_seen_at
  ) values (
    credential.family_id,
    credential.child_id,
    session_token_hash,
    array['child:read', 'child:complete'],
    created_session_expiry,
    nullif(left(requested_device_label, 80), ''),
    now()
  ) returning id into created_session_id;

  insert into public.device_audit_log (family_id, child_id, device_session_id, event_type)
  values (credential.family_id, credential.child_id, created_session_id, 'paired');

  return query select 'ok', created_session_id, credential.family_id, credential.child_id, created_session_expiry;
end
$$;

revoke all on function public.exchange_pairing_credential(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.exchange_pairing_credential(text, text, text, text, text, text) to service_role;

-- The snapshot names every column it returns, so a column added to a table later does not reach the
-- browser until someone chooses to add it here (tests/unit/family-snapshot-columns.test.ts keeps this
-- list equal to the columns the app parses). It still runs as the caller, so the policies above decide
-- which rows a caregiver receives.
create or replace function public.family_snapshot(
  include_experience boolean default true,
  include_journal boolean default true,
  include_city boolean default true
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  membership record;
  fid uuid;
begin
  select m.family_id, m.role into membership
  from public.family_memberships m
  where m.user_id = auth.uid()
  order by m.created_at asc
  limit 1;
  if not found then return null; end if;
  fid := membership.family_id;

  return jsonb_build_object(
    'familyId', fid,
    'familyRole', membership.role,
    'profiles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'name', t.name, 'nickname', t.nickname,
        'show_real_name_on_leaderboard', t.show_real_name_on_leaderboard,
        'is_public_on_leaderboard', t.is_public_on_leaderboard, 'avatar', t.avatar, 'theme_color', t.theme_color,
        'points', t.points, 'total_earned', t.total_earned, 'level', t.level, 'streak', t.streak,
        'birth_year', t.birth_year, 'age_stage', t.age_stage, 'age_band_override', t.age_band_override,
        'last_active_date', t.last_active_date, 'league_tier', t.league_tier, 'created_at', t.created_at
      ))
      from public.child_profiles t where t.family_id = fid
    ), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'child_id', t.child_id, 'title', t.title,
        'description', t.description, 'instructions', t.instructions, 'icon', t.icon, 'category', t.category,
        'points', t.points, 'recurrence_type', t.recurrence_type, 'recurrence_days', t.recurrence_days,
        'time_of_day', t.time_of_day, 'duration_minutes', t.duration_minutes,
        'requires_approval', t.requires_approval, 'is_active', t.is_active,
        'target_age_stage', t.target_age_stage, 'is_parent_role', t.is_parent_role,
        'portrait16_key', t.portrait16_key, 'bo_thi7_key', t.bo_thi7_key,
        'framework_habit_id', t.framework_habit_id, 'framework_content_version', t.framework_content_version,
        'legacy_template_id', t.legacy_template_id, 'journey_habit_key', t.journey_habit_key,
        'created_at', t.created_at
      ))
      from public.habit_activities t where t.family_id = fid
    ), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'activity_id', t.activity_id,
        'child_id', t.child_id, 'log_date', t.log_date, 'status', t.status, 'points_awarded', t.points_awarded,
        'completed_at', t.completed_at, 'proof_note', t.proof_note
      ))
      from public.activity_logs t where t.family_id = fid
    ), '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'title', t.title,
        'description', t.description, 'icon', t.icon, 'cost_points', t.cost_points, 'stock', t.stock,
        'is_active', t.is_active, 'created_at', t.created_at
      ))
      from public.rewards t where t.family_id = fid
    ), '[]'::jsonb),
    'redemptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'reward_id', t.reward_id,
        'child_id', t.child_id, 'points_spent', t.points_spent, 'status', t.status,
        'requested_at', t.requested_at, 'resolved_at', t.resolved_at
      ))
      from public.redemptions t where t.family_id = fid
    ), '[]'::jsonb),
    'childBadges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'family_id', t.family_id, 'child_id', t.child_id, 'badge_id', t.badge_id, 'unlocked_at', t.unlocked_at
      ))
      from public.child_badges t where t.family_id = fid
    ), '[]'::jsonb),
    'kudos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'family_id', t.family_id, 'from_child_id', t.from_child_id, 'to_child_id', t.to_child_id,
        'emoji', t.emoji, 'sent_at', t.sent_at
      ))
      from (select * from public.kudos where kudos.family_id = fid order by sent_at desc limit 50) t
    ), '[]'::jsonb),
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'family_id', t.family_id, 'name', t.name, 'invite_code', t.invite_code, 'icon', t.icon,
        'created_by_child_id', t.created_by_child_id, 'weekly_target_points', t.weekly_target_points,
        'reward_type', t.reward_type, 'custom_reward_text', t.custom_reward_text, 'created_at', t.created_at
      ))
      from public.group_teams t where t.family_id = fid
    ), '[]'::jsonb),
    'groupMembers', coalesce((
      select jsonb_agg(jsonb_build_object('group_id', t.group_id, 'child_id', t.child_id))
      from public.group_members t where t.family_id = fid
    ), '[]'::jsonb),
    'subscription', (
      select jsonb_build_object(
        'plan', s.plan,
        'status', s.status,
        'trial_ends_at', s.trial_ends_at,
        'subscription_ends_at', s.subscription_ends_at
      )
      from public.user_subscriptions s where s.family_id = fid limit 1
    ),
    'experience', jsonb_build_object(
      'children', case when include_experience then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'mascot_selected_at', t.mascot_selected_at
        ))
        from public.child_engagement_profiles t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
      'settings', case when include_experience then (
        select jsonb_build_object(
          'family_id', t.family_id, 'paused_at', t.paused_at, 'pause_reason', t.pause_reason,
          'pause_periods', t.pause_periods
        )
        from public.family_engagement_settings t where t.family_id = fid limit 1
      ) else null end,
      'letters', case when include_experience then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'local_date', t.local_date,
          'template_key', t.template_key, 'read_at', t.read_at
        ))
        from public.daily_mascot_letters t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
      'quests', case when include_experience then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'local_date', t.local_date, 'quest_key', t.quest_key,
          'unlocked_at', t.unlocked_at, 'expires_at', t.expires_at, 'completed_at', t.completed_at
        ))
        from public.secret_quests t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
      'wishlists', coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'reward_id', t.reward_id, 'chosen_at', t.chosen_at
        ))
        from public.child_wishlists t where t.family_id = fid
      ), '[]'::jsonb),
      'deferredTasks', coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'activity_id', t.activity_id,
          'local_date', t.local_date, 'deferred_at', t.deferred_at
        ))
        from public.child_task_deferrals t where t.family_id = fid
      ), '[]'::jsonb),
      'supportObservations', coalesce((
        select jsonb_agg(jsonb_build_object(
          'log_id', t.log_id, 'family_id', t.family_id, 'child_id', t.child_id, 'activity_id', t.activity_id,
          'support_level', t.support_level, 'recorded_by', t.recorded_by, 'recorded_at', t.recorded_at
        ))
        from public.habit_support_observations t where t.family_id = fid
      ), '[]'::jsonb),
      'cuePlans', coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'activity_id', t.activity_id, 'cue_kind', t.cue_kind,
          'cue_text', t.cue_text, 'cue_time', t.cue_time, 'place_text', t.place_text,
          'weekend_variant_text', t.weekend_variant_text, 'created_at', t.created_at, 'updated_at', t.updated_at
        ))
        from public.habit_cue_plans t where t.family_id = fid
      ), '[]'::jsonb),
      'journalEntries', case when include_journal then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'local_date', t.local_date,
          'entry_text', t.entry_text, 'created_at', t.created_at, 'updated_at', t.updated_at
        ))
        from public.child_journal_entries t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
      'cityPurchases', case when include_city then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'item_id', t.item_id,
          'points_spent', t.points_spent, 'purchased_at', t.purchased_at
        ))
        from public.child_city_purchases t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end
    )
  );
end
$$;

revoke all on function public.family_snapshot(boolean, boolean, boolean) from public, anon;
grant execute on function public.family_snapshot(boolean, boolean, boolean) to authenticated;

commit;
