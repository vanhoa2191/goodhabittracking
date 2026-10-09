-- Run on an isolated PostgreSQL fixture after the affiliate migrations; never against production.
-- The fixture retains order 1's original release date in test_original_release.
create function pg_temp.assert(ok boolean, message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', message; end if; end $$;

select pg_temp.assert((select available_at = original_release from public.referral_commissions cross join test_original_release where order_code = 1), 'old release date unchanged');
select pg_temp.assert((select hold_days = 40 and terms_version = '2026-10-09' from public.affiliate_settings), 'current settings');
select pg_temp.assert((select status = 'reversed' and refund_confirmed_at is not null and reversed_at is not null and available_at = original_release from public.referral_commissions cross join test_original_refund_release where order_code = 90), 'legacy pending confirmed refund reversed without changing release');
select pg_temp.assert((select dispute_opened_at is not null from public.referral_commissions where order_code = 91), 'pre-migration open case backfilled onto commission');
select pg_temp.assert((select dispute_opened_at is null from public.referral_commissions where order_code = 90), 'closed refund case is not a dispute freeze');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select pg_temp.assert((public.affiliate_overview()->>'termsAccepted')::boolean = false, 'existing referrer must reaccept');
select pg_temp.assert(public.request_affiliate_payout('00000000-0000-0000-0000-000000000001')->>'status' = 'terms_required', 'stale terms block payout');
do $$ begin
  perform public.affiliate_enroll(false);
  raise exception 'FAIL: stale terms accepted without consent';
exception when others then if sqlerrm <> 'terms_required' then raise; end if; end $$;
select pg_temp.assert(public.affiliate_enroll(true) = 'ABCDEFGH', 'reaccept keeps code');
select pg_temp.assert((public.affiliate_overview()->>'termsAccepted')::boolean, 'reaccept updates overview');
select pg_temp.assert((select terms_version = '2026-10-09' and terms_accepted_at >= now() - interval '1 minute' from public.affiliate_accounts), 'consent persisted');

-- The guardian pays for the referred owner's family; the payer is not the referred user.
insert into public.payment_orders(order_code, user_id, family_id, amount, status, plan_id) values
(2, '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 1000000, 'PAID', 'yearly'),
(3, '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 1000000, 'PAID', 'yearly');
select public.accrue_referral_commission(2), public.accrue_referral_commission(3);
select pg_temp.assert((select amount = 300000 and available_at between now() + interval '40 days' - interval '1 minute' and now() + interval '40 days' + interval '1 minute' from public.referral_commissions where order_code = 2), 'guardian payment earns and uses 40-day hold');
select pg_temp.assert(not exists(select 1 from public.referral_commissions where order_code = 3), 'referred payer for non-owned family earns nothing');

-- An open support case excludes the mature commission from a payout, not the whole account.
update public.referral_commissions set available_at = now() - interval '1 day' where order_code = 2;
insert into public.billing_support_cases(family_id, user_id, order_code, status, case_type, reason_code, created_by) values
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 2, 'reviewing', 'refund', 'other', '00000000-0000-0000-0000-000000000002');
select pg_temp.assert(public.request_affiliate_payout('00000000-0000-0000-0000-000000000001')->>'status' = 'requested', 'eligible old commission requests payout');
select pg_temp.assert((select status = 'pending' and payout_id is null and dispute_opened_at is not null from public.referral_commissions where order_code = 2), 'open case excluded and persisted on commission');
select pg_temp.assert((select status = 'pending' and payout_id is null from public.referral_commissions where order_code = 91), 'backfilled open case excluded');
select pg_temp.assert((select status = 'requested' from public.referral_commissions where order_code = 1), 'unblocked commission included');
select pg_temp.assert(public.admin_reverse_referral_commission(1, 'confirmed refund in payout') = 'in_payout', 'refund preserves in_payout code');
select pg_temp.assert((select refund_confirmed_at is not null from public.referral_commissions where order_code = 1), 'refund in payout persisted');
select pg_temp.assert(public.admin_resolve_affiliate_payout((select payout_id from public.referral_commissions where order_code = 1), 'rejected', '00000000-0000-0000-0000-000000000001', null, 'refund') = 'rejected', 'payout rejected');
select pg_temp.assert((select status = 'reversed' and reversed_at is not null and payout_id is null from public.referral_commissions where order_code = 1), 'refund becomes reversed on rejection');

-- Closing or cascading away the case/account must not erase a refund in a payout.
update public.billing_support_cases set status = 'rejected' where order_code = 2;
select pg_temp.assert((select dispute_opened_at is null from public.referral_commissions where order_code = 2), 'case resolved without refund clears the freeze');
select pg_temp.assert(public.request_affiliate_payout('00000000-0000-0000-0000-000000000001')->>'status' = 'requested', 'closed non-refund case releases commission');
select pg_temp.assert(public.admin_reverse_referral_commission(2, 'confirmed refund before deletion') = 'in_payout', 'second refund in payout');
update public.billing_support_cases set status = 'completed', resolution_code = 'manual_refund_confirmed', resolved_at = now() where order_code = 2;
-- A refund case left open when the customer deletes the account keeps the commission frozen.
insert into public.payment_orders(order_code, user_id, family_id, amount, status, plan_id) values (6, '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1000000, 'PAID', 'yearly');
insert into public.referral_commissions(referral_id, order_code, base_amount, rate_bps, amount, available_at)
select id, 6, 1000000, 3000, 300000, now() - interval '1 day' from public.referrals where referred_user_id = '00000000-0000-0000-0000-000000000002';
insert into public.billing_support_cases(family_id, user_id, order_code, status, case_type, reason_code, created_by) values
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 6, 'requested', 'refund', 'other', '00000000-0000-0000-0000-000000000002');
delete from public.families where id = '10000000-0000-0000-0000-000000000002';
delete from auth.users where id = '00000000-0000-0000-0000-000000000002';
select pg_temp.assert(not exists(select 1 from public.billing_support_cases where order_code = 2), 'case cascaded away');
select pg_temp.assert(public.affiliate_commission_block_reason(2) = 'refund_confirmed', 'refund survives family and user deletion');
update public.affiliate_payouts set processing_by = '00000000-0000-0000-0000-000000000001', processing_at = now() where id = (select payout_id from public.referral_commissions where order_code = 2);
select pg_temp.assert(public.admin_resolve_affiliate_payout((select payout_id from public.referral_commissions where order_code = 2), 'paid', '00000000-0000-0000-0000-000000000001', 'bank-reference', null) = 'refund_confirmed', 'deleted customer refund still not payable');
select pg_temp.assert(public.admin_resolve_affiliate_payout((select payout_id from public.referral_commissions where order_code = 2), 'rejected', '00000000-0000-0000-0000-000000000001', null, null) = 'rejected', 'deleted customer payout rejected');
select pg_temp.assert((select status = 'reversed' from public.referral_commissions where order_code = 2), 'deleted customer commission reversed');
select pg_temp.assert(not exists(select 1 from public.billing_support_cases where order_code in (6, 91)), 'open cases cascaded away with the family');
select pg_temp.assert(public.affiliate_commission_block_reason(6) = 'billing_case_open' and public.affiliate_commission_block_reason(91) = 'billing_case_open', 'open-case freeze survives family deletion');
select pg_temp.assert(public.request_affiliate_payout('00000000-0000-0000-0000-000000000001')->>'status' = 'below_minimum', 'deleted customer open case is not payable');
select pg_temp.assert((select status = 'pending' and payout_id is null from public.referral_commissions where order_code = 6), 'deleted customer disputed commission stays pending');
select pg_temp.assert((public.admin_affiliate_overview()->'owed'->>'available')::integer = 0, 'frozen commission is not reported as available');
select pg_temp.assert(public.admin_reverse_referral_commission(6, 'refund confirmed after account deletion') = 'reversed', 'admin can still reverse the frozen commission');

-- Paid commissions remain recorded for manual recovery, including reason/timestamp.
insert into public.referral_commissions(referral_id, order_code, base_amount, rate_bps, amount, available_at, status)
select id, 99, 1000000, 3000, 300000, now(), 'paid' from public.referrals limit 1;
select pg_temp.assert(public.admin_reverse_referral_commission(99, 'manual recovery') = 'already_paid', 'already_paid return retained');
select pg_temp.assert((select status = 'paid' and refund_confirmed_at is not null and reverse_reason = 'manual recovery' from public.referral_commissions where order_code = 99), 'manual recovery evidence retained');

-- Recreating a family does not reset attribution or the referred owner's account window.
insert into public.families(id, created_by) values ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005');
insert into public.family_memberships(family_id, user_id, role) values ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'owner');
insert into public.referrals(referrer_user_id, referred_family_id, referred_user_id, code) values ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'ABCDEFGH');
delete from public.families where id = '10000000-0000-0000-0000-000000000005';
insert into public.families(id, created_by) values ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005');
insert into public.family_memberships(family_id, user_id, role) values ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', 'owner');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000005', false);
select set_config('test.family_id', '10000000-0000-0000-0000-000000000006', false);
select pg_temp.assert(public.claim_referral('ABCDEFGH') = 'already_referred', 'recreated family cannot reattribute');
insert into public.payment_orders(order_code, user_id, family_id, amount, status, plan_id) values (4, '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 1000000, 'PAID', 'yearly');
insert into public.billing_support_cases(family_id, user_id, order_code, status, case_type, reason_code, created_by) values
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', 4, 'requested', 'refund', 'other', '00000000-0000-0000-0000-000000000005');
select public.accrue_referral_commission(4);
select pg_temp.assert((select amount = 300000 from public.referral_commissions where order_code = 4), 'new family with same owner uses original attribution');
select pg_temp.assert((select dispute_opened_at is not null from public.referral_commissions where order_code = 4), 'case opened before settlement freezes the new commission');
update auth.users set created_at = now() - interval '366 days' where id = '00000000-0000-0000-0000-000000000005';
insert into public.payment_orders(order_code, user_id, family_id, amount, status, plan_id) values (5, '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 1000000, 'PAID', 'yearly');
select public.accrue_referral_commission(5);
select pg_temp.assert(not exists(select 1 from public.referral_commissions where order_code = 5), 'new family cannot reset expired account window');
select 'PASS: historical release preserved; 40-day new hold; guardian pays owned family; non-owned family excluded; open case excluded; open-case freeze persisted, backfilled, carried into accrual, cleared on non-refund resolution and kept after family deletion; in-payout refund reversed on rejection; refund survives customer deletion and blocks payment; paid refund manual recovery retained; reaccept terms required and persisted; family recreation preserves attribution and account window' as result;
