begin;

-- Only a verified finance operator can release a persisted dispute freeze.
-- Refunds remain irreversible here; order -> commission matches billing/payout lock order.
create or replace function public.admin_unfreeze_referral_commission(
  target_order_code bigint, admin_user uuid, reason text, audit_correlation_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
  commission public.referral_commissions%rowtype;
begin
  select membership.role into actor_role from public.admin_memberships membership
  where membership.user_id = admin_user and membership.role in ('finance', 'super_admin')
    and membership.revoked_at is null and (membership.expires_at is null or membership.expires_at > now())
  for share;
  if not found then return 'not_authorized'; end if;
  if audit_correlation_id is null or char_length(trim(coalesce(reason, ''))) not between 5 and 500 then
    raise exception 'invalid_audit_context';
  end if;
  perform 1 from public.payment_orders where order_code = target_order_code for update;
  select * into commission from public.referral_commissions where order_code = target_order_code for update;
  if not found then return 'no_commission'; end if;
  if commission.refund_confirmed_at is not null or exists (
    select 1 from public.billing_support_cases where order_code = target_order_code
      and resolution_code = 'manual_refund_confirmed'
  ) then return 'refund_confirmed'; end if;
  if exists (select 1 from public.billing_support_cases where order_code = target_order_code
    and status in ('requested', 'reviewing', 'approved')) then return 'billing_case_open'; end if;
  if commission.status not in ('pending', 'requested') then return 'invalid_status'; end if;
  if commission.dispute_opened_at is null then return 'not_frozen'; end if;

  update public.referral_commissions set dispute_opened_at = null where id = commission.id;
  insert into public.admin_audit_events (
    actor_user_id, actor_role, action, target_type, target_id, outcome,
    before_data, after_data, reason, correlation_id
  ) values (
    admin_user, actor_role, 'affiliate.commission.unfreeze', 'referral_commission', target_order_code::text,
    'succeeded', '{"status":"frozen"}'::jsonb, '{"status":"unfrozen"}'::jsonb,
    trim(reason), audit_correlation_id
  );
  return 'unfrozen';
end
$$;
revoke all on function public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid) to service_role;

create or replace function public.admin_affiliate_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'affiliates', (select count(*) from public.affiliate_accounts),
    'referrals', (select count(*) from public.referrals),
    'owed', jsonb_build_object(
      'held', coalesce((select sum(amount) from public.referral_commissions where status = 'pending' and (available_at > now() or public.affiliate_commission_block_reason(order_code) is not null)), 0),
      'available', coalesce((select sum(amount) from public.referral_commissions where status = 'pending' and available_at <= now() and public.affiliate_commission_block_reason(order_code) is null), 0),
      'requested', coalesce((select sum(amount) from public.referral_commissions where status = 'requested'), 0),
      'paid', coalesce((select sum(amount) from public.referral_commissions where status = 'paid'), 0)
    ),
    'frozenCommissions', coalesce((
      select jsonb_agg(row_to_json(frozen)::jsonb order by frozen."orderCode") from (
        select commission.order_code as "orderCode", commission.amount, commission.status,
               commission.dispute_opened_at as "frozenAt"
        from public.referral_commissions commission
        where commission.dispute_opened_at is not null and commission.refund_confirmed_at is null
          and commission.status in ('pending', 'requested')
          and not exists (select 1 from public.billing_support_cases support_case
            where support_case.order_code = commission.order_code
              and (support_case.status in ('requested', 'reviewing', 'approved')
                or support_case.resolution_code = 'manual_refund_confirmed'))
        order by commission.order_code limit 50
      ) frozen
    ), '[]'::jsonb),
    'payouts', coalesce((
      select jsonb_agg(row_to_json(payout)::jsonb order by payout."requestedAt")
      from (
        (select affiliate_payout.id, affiliate_payout.amount, affiliate_payout.status, affiliate_payout.bank,
                affiliate_payout.account_number as "accountNumber", affiliate_payout.account_name as "accountName",
                affiliate_payout.requested_at as "requestedAt", affiliate_payout.resolved_at as "resolvedAt",
                affiliate_payout.reference,
                affiliate_payout.processing_by as "processingBy", affiliate_payout.processing_at as "processingAt",
                exists (select 1 from public.referral_commissions commission
                        where commission.payout_id = affiliate_payout.id
                          and public.affiliate_commission_block_reason(commission.order_code) is not null) as blocked,
                array(select commission.order_code from public.referral_commissions commission
                      where commission.payout_id = affiliate_payout.id
                        and public.affiliate_commission_block_reason(commission.order_code) is not null
                      order by commission.order_code) as "blockedOrderCodes"
         from public.affiliate_payouts affiliate_payout
         where affiliate_payout.status = 'requested')
        union all
        (select affiliate_payout.id, affiliate_payout.amount, affiliate_payout.status, affiliate_payout.bank,
                affiliate_payout.account_number, affiliate_payout.account_name,
                affiliate_payout.requested_at, affiliate_payout.resolved_at,
                affiliate_payout.reference, null::uuid, null::timestamptz, false, array[]::bigint[]
         from public.affiliate_payouts affiliate_payout
         where affiliate_payout.status <> 'requested' and affiliate_payout.resolved_at > now() - interval '60 days'
         order by affiliate_payout.resolved_at desc
         limit 50)
      ) payout
    ), '[]'::jsonb)
  ) into result;
  return result;
end
$$;

revoke all on function public.admin_affiliate_overview() from public, anon, authenticated;
grant execute on function public.admin_affiliate_overview() to service_role;

commit;
