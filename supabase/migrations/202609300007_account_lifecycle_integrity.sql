begin;

-- 1. A caregiver who signs in with Google first gets an automatic, empty family. That family
--    must not block accepting an invitation, so an untouched one is replaced by the invited family.
create or replace function public.accept_caregiver_invite(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target public.caregiver_invites%rowtype;
  own_family_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if raw_token is null or length(raw_token) <> 72 then
    raise exception 'invalid_invite' using errcode = '22023';
  end if;

  select invite.* into target
  from public.caregiver_invites invite
  where invite.token_hash = extensions.digest(raw_token, 'sha256')
  for update;
  if target.id is null
    or target.accepted_at is not null
    or target.revoked_at is not null
    or target.expires_at <= now() then
    raise exception 'invite_unavailable' using errcode = '22023';
  end if;

  for own_family_id in
    select membership.family_id
    from public.family_memberships membership
    where membership.user_id = actor_id
  loop
    if own_family_id = target.family_id then
      raise exception 'account_already_belongs_to_family' using errcode = '23505';
    end if;
    if exists (
        select 1 from public.families family
        where family.id = own_family_id and family.created_by = actor_id
      )
      and not exists (select 1 from public.child_profiles child where child.family_id = own_family_id)
      and not exists (select 1 from public.habit_activities activity where activity.family_id = own_family_id)
      and not exists (select 1 from public.rewards reward where reward.family_id = own_family_id)
      and not exists (select 1 from public.payment_orders payment_order where payment_order.family_id = own_family_id)
      and not exists (
        select 1 from public.family_memberships other
        where other.family_id = own_family_id and other.user_id <> actor_id
      )
      and not exists (
        select 1 from public.user_subscriptions subscription
        where subscription.family_id = own_family_id
          and (subscription.plan <> 'free' or subscription.trial_consumed_at is not null)
      )
    then
      delete from public.families where id = own_family_id;
    else
      raise exception 'account_already_belongs_to_family' using errcode = '23505';
    end if;
  end loop;

  insert into public.family_memberships (family_id, user_id, role)
  values (target.family_id, actor_id, 'caregiver');
  update public.caregiver_invites
  set accepted_at = now(), accepted_by = actor_id
  where id = target.id;
  insert into public.caregiver_invite_events (invite_id, family_id, actor_user_id, event_type)
  values (target.id, target.family_id, actor_id, 'accepted');
  return target.family_id;
end;
$$;

-- 2. Deleting a family keeps the minimum a payment record needs (order code, amount, plan,
--    status, dates) and drops the provider payloads that can hold names and bank details.
create or replace function public.delete_owned_family(confirmation text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_family_id uuid;
begin
  if confirmation <> 'DELETE FAMILY' then raise exception 'confirmation_required'; end if;
  select family.id into target_family_id
  from public.families family
  where family.created_by = actor_id
  limit 1;
  if target_family_id is null then raise exception 'owned_family_not_found'; end if;

  update public.billing_webhook_events event
  set payload = jsonb_build_object('orderCode', event.order_code, 'minimised', true)
  where event.order_code in (
    select payment_order.order_code from public.payment_orders payment_order
    where payment_order.family_id = target_family_id
  );
  update public.payment_orders payment_order
  set metadata = jsonb_build_object('minimised', true),
      payment_url = null,
      qr_code = null
  where payment_order.family_id = target_family_id;

  delete from public.families where id = target_family_id and created_by = actor_id;
  delete from public.parent_profiles where user_id = actor_id;
  return true;
end
$$;

-- 3. A message left in `processing` by a worker that died is claimed again after ten minutes,
--    or dead-lettered once it has used all its attempts.
create or replace function public.claim_lifecycle_messages(batch_size integer default 25)
returns table (
  id uuid,
  user_id uuid,
  template_key text,
  locale text,
  payload jsonb,
  dedupe_key text,
  recipient_email text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.lifecycle_outbox message
  set status = 'dead_letter', locked_at = null, updated_at = now(), last_error_code = 'worker_lost'
  where message.status = 'processing'
    and message.locked_at < now() - interval '10 minutes'
    and message.attempts >= 5;

  update public.lifecycle_outbox message
  set status = 'suppressed', updated_at = now(), last_error_code = 'suppressed'
  where message.status in ('pending', 'failed')
    and (
      exists (
        select 1 from public.email_suppressions suppression
        where suppression.user_id = message.user_id
          and (suppression.scope = 'all' or message.category = 'marketing')
      )
      or (
        message.category = 'marketing'
        and not exists (
          select 1 from public.parent_profiles profile
          where profile.user_id = message.user_id and profile.marketing_consent = true
        )
      )
    );

  return query
  with candidates as (
    select message.id
    from public.lifecycle_outbox message
    where (
        message.status in ('pending', 'failed')
        or (message.status = 'processing' and message.locked_at < now() - interval '10 minutes')
      )
      and message.available_at <= now()
      and message.attempts < 5
      and (message.locked_at is null or message.locked_at < now() - interval '10 minutes')
    order by message.created_at
    for update skip locked
    limit greatest(1, least(coalesce(batch_size, 25), 100))
  ), claimed as (
    update public.lifecycle_outbox message
    set status = 'processing', attempts = message.attempts + 1,
        locked_at = now(), updated_at = now()
    from candidates
    where message.id = candidates.id
    returning message.*
  )
  select claimed.id, claimed.user_id, claimed.template_key, claimed.locale,
         claimed.payload, claimed.dedupe_key, auth_user.email::text
  from claimed
  join auth.users auth_user on auth_user.id = claimed.user_id
  where auth_user.email is not null;
end
$$;

revoke all on function public.claim_lifecycle_messages(integer) from public, anon, authenticated;
grant execute on function public.claim_lifecycle_messages(integer) to service_role;
revoke all on function public.accept_caregiver_invite(text) from public, anon;
grant execute on function public.accept_caregiver_invite(text) to authenticated;
revoke all on function public.delete_owned_family(text) from public, anon;
grant execute on function public.delete_owned_family(text) to authenticated;

commit;
