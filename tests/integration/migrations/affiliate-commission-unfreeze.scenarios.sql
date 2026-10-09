-- Extends the affiliate fixture after the existing money scenarios.
insert into public.admin_memberships(user_id,role,granted_by,grant_reason)
values ('00000000-0000-0000-0000-000000000001','finance','00000000-0000-0000-0000-000000000001','Local regression fixture');
select pg_temp.assert(not has_function_privilege('anon','public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid)','EXECUTE')
  and not has_function_privilege('authenticated','public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid)','EXECUTE')
  and has_function_privilege('service_role','public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid)','EXECUTE'), 'service-only release');
select pg_temp.assert(public.admin_unfreeze_referral_commission(91,'00000000-0000-0000-0000-000000000005','Resolved without refund',gen_random_uuid()) = 'not_authorized', 'non-admin refused');
update public.admin_memberships set role='support';
select pg_temp.assert(public.admin_unfreeze_referral_commission(91,'00000000-0000-0000-0000-000000000001','Resolved without refund',gen_random_uuid()) = 'not_authorized', 'support refused');
update public.admin_memberships set role='finance',expires_at=now()-interval '1 minute',granted_at=now()-interval '1 day';
select pg_temp.assert(public.admin_unfreeze_referral_commission(91,'00000000-0000-0000-0000-000000000001','Resolved without refund',gen_random_uuid()) = 'not_authorized', 'expired admin refused');
update public.admin_memberships set expires_at=null;
select pg_temp.assert(public.admin_unfreeze_referral_commission(1,'00000000-0000-0000-0000-000000000001','Resolved without refund',gen_random_uuid()) = 'refund_confirmed', 'confirmed refund cannot release');
select pg_temp.assert(public.admin_unfreeze_referral_commission(99999,'00000000-0000-0000-0000-000000000001','Resolved without refund',gen_random_uuid()) = 'no_commission', 'missing commission refused');
create temporary table unfreeze_original as select available_at,status,amount from referral_commissions where order_code=91;
select pg_temp.assert(exists(select 1 from jsonb_array_elements(public.admin_affiliate_overview()->'frozenCommissions') item where item->>'orderCode'='91'), 'orphan freeze shown to admin');
-- Force audit failure: the commission update must roll back with it.
create function pg_temp.reject_unfreeze_audit() returns trigger language plpgsql as $$ begin raise exception 'audit_unavailable'; end $$;
create trigger test_audit_failure before insert on public.admin_audit_events for each row execute function pg_temp.reject_unfreeze_audit();
do $$ begin
  perform public.admin_unfreeze_referral_commission(91,'00000000-0000-0000-0000-000000000001','Resolved without refund',gen_random_uuid());
  raise exception 'FAIL: audit failure was ignored';
exception when others then if sqlerrm <> 'audit_unavailable' then raise; end if; end $$;
select pg_temp.assert((select dispute_opened_at is not null from referral_commissions where order_code=91), 'failed audit rolls back release');
drop trigger test_audit_failure on public.admin_audit_events;
select pg_temp.assert(public.admin_unfreeze_referral_commission(91,'00000000-0000-0000-0000-000000000001','Resolved without refund',gen_random_uuid()) = 'unfrozen', 'deleted-family orphan released');
select pg_temp.assert((select c.dispute_opened_at is null and c.available_at=o.available_at and c.status=o.status and c.amount=o.amount from referral_commissions c cross join unfreeze_original o where order_code=91), 'release preserves original amount, hold and status');
select pg_temp.assert((select count(*)=1 from admin_audit_events where action='affiliate.commission.unfreeze' and outcome='succeeded' and target_id='91' and reason='Resolved without refund'), 'successful release audited once');
select pg_temp.assert(public.admin_unfreeze_referral_commission(91,'00000000-0000-0000-0000-000000000001','Resolved without refund',gen_random_uuid()) = 'not_frozen', 'release retry does not audit twice');
select pg_temp.assert(not exists(select 1 from jsonb_array_elements(public.admin_affiliate_overview()->'frozenCommissions') item where item->>'orderCode'='91'), 'released freeze removed from overview');
-- A live support case cannot be overridden even by finance.
update referral_commissions set dispute_opened_at=now() where order_code=91;
insert into public.billing_support_cases(family_id,user_id,order_code,status,case_type,reason_code,created_by)
values ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000005',91,'reviewing','refund','other','00000000-0000-0000-0000-000000000005');
select pg_temp.assert(public.admin_unfreeze_referral_commission(91,'00000000-0000-0000-0000-000000000001','Resolved without refund',gen_random_uuid()) = 'billing_case_open', 'live dispute refused');
select pg_temp.assert(not exists(select 1 from jsonb_array_elements(public.admin_affiliate_overview()->'frozenCommissions') item where item->>'orderCode'='91'), 'live dispute not listed as releasable');
