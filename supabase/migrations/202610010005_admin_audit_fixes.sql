begin;

-- A person whose admin access was revoked while a request of theirs was in flight can no longer grant or revoke
-- access: the database re-checks the acting admin inside the same locked transaction.
create or replace function public.grant_admin_membership(
  target_user_id uuid,
  target_role text,
  target_expires_at timestamptz,
  actor_id uuid,
  reason text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_membership public.admin_memberships%rowtype;
  other_super_admins integer;
begin
  perform pg_advisory_xact_lock(732908221);
  if not exists (
    select 1 from public.admin_memberships actor_membership
    where actor_membership.user_id = actor_id
      and actor_membership.role = 'super_admin'
      and actor_membership.revoked_at is null
      and (actor_membership.expires_at is null or actor_membership.expires_at > now())
  ) then
    -- Only the emergency bootstrap may act without a standing super admin: it names itself, and only while no
    -- active super admin exists at all.
    if actor_id is distinct from target_user_id or exists (
      select 1 from public.admin_memberships any_super
      where any_super.role = 'super_admin' and any_super.revoked_at is null
        and (any_super.expires_at is null or any_super.expires_at > now())
    ) then
      raise exception 'actor_not_authorized' using errcode = '42501';
    end if;
  end if;
  if target_role not in ('support', 'finance', 'super_admin')
    or target_expires_at is null
    or target_expires_at <= now()
    or target_expires_at > now() + interval '366 days'
    or char_length(trim(reason)) not between 5 and 500 then
    raise exception 'invalid_admin_grant' using errcode = '22023';
  end if;

  select * into current_membership
  from public.admin_memberships
  where user_id = target_user_id
  for update;
  if current_membership.user_id is not null
    and current_membership.role = 'super_admin'
    and current_membership.revoked_at is null
    and (current_membership.expires_at is null or current_membership.expires_at > now())
    and target_role <> 'super_admin' then
    select count(*) into other_super_admins
    from public.admin_memberships membership
    where membership.user_id <> target_user_id
      and membership.role = 'super_admin'
      and membership.revoked_at is null
      and (membership.expires_at is null or membership.expires_at > now());
    if other_super_admins = 0 then
      raise exception 'last_super_admin_required' using errcode = '23514';
    end if;
  end if;

  insert into public.admin_memberships (
    user_id, role, granted_by, grant_reason, granted_at, expires_at,
    revoked_at, revoked_by, revoke_reason
  ) values (
    target_user_id, target_role, actor_id, trim(reason), now(), target_expires_at,
    null, null, null
  )
  on conflict (user_id) do update set
    role = excluded.role,
    granted_by = excluded.granted_by,
    grant_reason = excluded.grant_reason,
    granted_at = excluded.granted_at,
    expires_at = excluded.expires_at,
    revoked_at = null,
    revoked_by = null,
    revoke_reason = null;
  select count(*) into other_super_admins
  from public.admin_memberships membership
  where membership.role = 'super_admin'
    and membership.revoked_at is null
    and (membership.expires_at is null or membership.expires_at > now());
  if other_super_admins = 0 then
    raise exception 'last_super_admin_required' using errcode = '23514';
  end if;
  return true;
end;
$$;

create or replace function public.revoke_admin_membership(
  target_user_id uuid,
  actor_id uuid,
  reason text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_membership public.admin_memberships%rowtype;
  other_super_admins integer;
begin
  perform pg_advisory_xact_lock(732908221);
  if not exists (
    select 1 from public.admin_memberships actor_membership
    where actor_membership.user_id = actor_id
      and actor_membership.role = 'super_admin'
      and actor_membership.revoked_at is null
      and (actor_membership.expires_at is null or actor_membership.expires_at > now())
  ) then
    raise exception 'actor_not_authorized' using errcode = '42501';
  end if;
  if char_length(trim(reason)) not between 5 and 500 then
    raise exception 'invalid_admin_revocation' using errcode = '22023';
  end if;
  select * into current_membership
  from public.admin_memberships
  where user_id = target_user_id and revoked_at is null
  for update;
  if current_membership.user_id is null then return false; end if;
  if current_membership.role = 'super_admin'
    and (current_membership.expires_at is null or current_membership.expires_at > now()) then
    select count(*) into other_super_admins
    from public.admin_memberships membership
    where membership.user_id <> target_user_id
      and membership.role = 'super_admin'
      and membership.revoked_at is null
      and (membership.expires_at is null or membership.expires_at > now());
    if other_super_admins = 0 then
      raise exception 'last_super_admin_required' using errcode = '23514';
    end if;
  end if;
  update public.admin_memberships
  set revoked_at = now(), revoked_by = actor_id, revoke_reason = trim(reason)
  where user_id = target_user_id and revoked_at is null;
  return found;
end;
$$;

-- A payout is only marked paid under a claim that is still fresh, so an old page cannot instruct a second transfer.
create or replace function public.admin_resolve_affiliate_payout(
  target_payout_id uuid,
  resolution text,
  admin_user uuid,
  payout_reference text,
  payout_note text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  payout public.affiliate_payouts%rowtype;
  attached bigint;
begin
  if resolution not in ('paid', 'rejected') then raise exception 'invalid_resolution'; end if;
  select * into payout from public.affiliate_payouts where id = target_payout_id for update;
  if not found then return 'not_found'; end if;
  if payout.status <> 'requested' then return 'already_resolved'; end if;
  if payout.processing_by is not null and payout.processing_by is distinct from admin_user
    and payout.processing_at > now() - interval '2 hours' then
    return 'claimed_by_other';
  end if;
  -- Paying needs a claim that is still fresh: an expired claim means somebody else may have taken over and paid.
  if resolution = 'paid' and (
    payout.processing_by is distinct from admin_user
    or payout.processing_at is null
    or payout.processing_at <= now() - interval '2 hours'
  ) then
    return 'claim_required';
  end if;
  if resolution = 'paid' and coalesce(trim(payout_reference), '') = '' then return 'reference_required'; end if;
  if resolution = 'paid' then
    select coalesce(sum(commission.amount), 0) into attached
    from public.referral_commissions commission
    where commission.payout_id = payout.id and commission.status = 'requested';
    if attached <> payout.amount then return 'amount_mismatch'; end if;
  end if;

  update public.affiliate_payouts
  set status = resolution,
      resolved_at = now(),
      resolved_by = admin_user,
      reference = left(nullif(trim(coalesce(payout_reference, '')), ''), 120),
      note = left(nullif(trim(coalesce(payout_note, '')), ''), 500)
  where id = payout.id;

  if resolution = 'paid' then
    update public.referral_commissions set status = 'paid' where payout_id = payout.id and status = 'requested';
  else
    update public.referral_commissions set status = 'pending', payout_id = null where payout_id = payout.id and status = 'requested';
  end if;
  return resolution;
end
$$;

revoke all on function public.grant_admin_membership(uuid, text, timestamptz, uuid, text) from public, anon, authenticated;
grant execute on function public.grant_admin_membership(uuid, text, timestamptz, uuid, text) to service_role;
revoke all on function public.revoke_admin_membership(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.revoke_admin_membership(uuid, uuid, text) to service_role;
revoke all on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) to service_role;

commit;
