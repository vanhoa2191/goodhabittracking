begin;

-- Sharing on the public board is a decision of each family, and children start private.
-- No family had shared anything before this migration, so nobody loses a choice they made.
alter table public.child_profiles alter column is_public_on_leaderboard set default false;
update public.child_profiles set is_public_on_leaderboard = false where is_public_on_leaderboard;

-- The earlier version ranked by the spendable balance and returned a child id. Replace it.
drop function if exists public.get_public_leaderboard(integer);

create function public.get_public_leaderboard(
  period_key text default 'weekly',
  viewer_today date default null,
  mine_child_id uuid default null,
  result_limit integer default 50
)
returns table (
  rank_number integer,
  nickname text,
  avatar text,
  theme_color text,
  points integer,
  streak integer,
  tier text,
  is_mine boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with clock as (
    select case
      when viewer_today between current_date - 1 and current_date + 1 then viewer_today
      else current_date
    end as today
  ), bounds as (
    select
      today,
      case period_key
        when 'daily' then today
        when 'monthly' then date_trunc('month', today)::date
        else date_trunc('week', today)::date
      end as first_day
    from clock
  ), shared as (
    select
      child.id,
      coalesce(nullif(trim(child.nickname), ''), 'Bé Siêu Nhân') as alias,
      child.avatar,
      child.theme_color,
      child.streak,
      child.total_earned,
      coalesce(sum(log.points_awarded), 0)::integer as earned
    from public.child_profiles child
    join public.parent_settings settings on settings.family_id = child.family_id
    cross join bounds
    left join public.activity_logs log
      on log.child_id = child.id
      and log.status in ('completed', 'approved')
      and log.log_date between bounds.first_day and bounds.today
    where settings.is_public_leaderboard
      and child.is_public_on_leaderboard
    group by child.id
  )
  select
    (row_number() over (order by shared.earned desc, shared.alias, md5(shared.id::text)))::integer,
    shared.alias,
    shared.avatar,
    shared.theme_color,
    shared.earned,
    shared.streak,
    case
      when shared.total_earned >= 300 then 'diamond'
      when shared.total_earned >= 150 then 'gold'
      when shared.total_earned >= 70 then 'silver'
      else 'bronze'
    end,
    coalesce(shared.id = mine_child_id, false)
  from shared
  order by 1
  limit least(greatest(result_limit, 1), 100)
$$;

revoke all on function public.get_public_leaderboard(text, date, uuid, integer) from public;
grant execute on function public.get_public_leaderboard(text, date, uuid, integer) to anon, authenticated;

create function public.set_family_public_leaderboard(target_family_id uuid, enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_family(target_family_id) then
    return jsonb_build_object('status', 'session_invalid');
  end if;

  insert into public.parent_settings (family_id, is_public_leaderboard, updated_at)
  values (target_family_id, enabled, now())
  on conflict (family_id) do update
    set is_public_leaderboard = excluded.is_public_leaderboard,
        updated_at = now();

  insert into public.family_consents (family_id, user_id, consent_type, policy_version, granted_at, revoked_at)
  values (target_family_id, auth.uid(), 'leaderboard', '2026-09-30', now(), case when enabled then null else now() end)
  on conflict (family_id, user_id, consent_type, policy_version) do update
    set granted_at = excluded.granted_at,
        revoked_at = excluded.revoked_at;

  return jsonb_build_object('status', 'saved', 'enabled', enabled);
end
$$;

revoke all on function public.set_family_public_leaderboard(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_family_public_leaderboard(uuid, boolean) to authenticated;

commit;
