begin;

-- Supabase grants EXECUTE on new public functions to anon and authenticated directly,
-- so `revoke ... from public` alone never closed them. Payment settlement, the email
-- outbox and the trigger helpers must only be reachable by the service role (or by the
-- trigger machinery), and the older pairing exchange that accepted an empty verifier
-- is no longer called by any route.
do $$
declare
  target record;
begin
  for target in
    select function_row.oid::regprocedure as signature
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.proname in (
        'process_payos_webhook',
        'claim_lifecycle_messages',
        'enqueue_lifecycle_message',
        'finish_lifecycle_message',
        'schedule_trial_ending_messages',
        'audit_and_queue_billing_case',
        'audit_pairing_challenge_change',
        'queue_parent_welcome_message',
        'queue_payment_receipt_message',
        'queue_subscription_cancelled_message',
        'reject_overlapping_journey_assignments',
        'enforce_family_child_limit',
        'exchange_pairing_challenge'
      )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', target.signature);
    if target.signature::text not like 'exchange_pairing_challenge(%' then
      execute format('grant execute on function %s to service_role', target.signature);
    end if;
  end loop;
end $$;

commit;
