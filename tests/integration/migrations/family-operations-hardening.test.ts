import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';
import { EXPECTED_SCHEMA_VERSION } from '@/lib/schema-version';

const migration = readFileSync(resolve(process.env.OPS_MIGRATION_UNDER_TEST ?? 'supabase/migrations/202610090030_family_operations_hardening.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202610090030_family_operations_hardening.verify.sql'), 'utf8');
function definition(name: string) {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  expect(start, name).toBeGreaterThan(-1);
  return migration.slice(start, migration.indexOf('\n$$;', start));
}

describe('family operations hardening migration', () => {
  it('parses migration and preflight as PostgreSQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });
  it('registers the new migration in the schema entrypoint and build health version', () => {
    expect(readFileSync(resolve('supabase/schema.sql'), 'utf8')).toContain('\\ir migrations/202610090030_family_operations_hardening.sql');
    expect(BigInt(EXPECTED_SCHEMA_VERSION)).toBeGreaterThanOrEqual(BigInt('202610090030'));
  });
  it('O1 removes the direct activity write bypass', () => {
    expect(migration).toContain('revoke insert, update, delete on public.habit_activities from public, anon, authenticated');
  });
  it('O1 closes original profile RPC and exposes only the service identity wrapper', () => {
    expect(migration).toContain('revoke all on function public.mutate_child_profile_command(jsonb) from public, anon, authenticated, service_role');
    expect(migration).toContain('grant execute on function public.mutate_child_profile_command_as(uuid,jsonb) to service_role');
    expect(definition('mutate_child_profile_command')).toContain('not public.can_manage_family(actor_family_id)');
    expect(definition('mutate_child_profile_command')).toContain('not between 0 and 10000');
    expect(definition('mutate_child_profile_command')).toContain("jsonb_typeof(activity->'requiresApproval') is distinct from 'boolean'");
    expect(definition('mutate_child_profile_command_as')).toContain('public.act_as_user(actor_user_id)');
  });
  it('O2 enforces daily/weekdays/weekends/custom on child dates and retains parent backfill', () => {
    const child = definition('complete_child_habit_command');
    for (const recurrence of ['daily', 'weekdays', 'weekends', 'custom']) expect(child).toContain(`when '${recurrence}'`);
    expect(child).toContain('extract(dow from target_log_date)');
    expect(child).not.toMatch(/=\s*any\s*\(\s*activity\.recurrence_days/i);
    expect(child).toContain("coalesce(activity.recurrence_days, '[]'::jsonb)");
    expect(child).toContain('@> jsonb_build_array(extract(dow from target_log_date)::integer)');
    expect(child).toContain("(activity.created_at at time zone 'UTC')::date - 1");
    expect(child.indexOf('activity_not_started')).toBeLessThan(child.indexOf('insert into public.activity_logs'));
    expect(child.indexOf('activity_not_scheduled')).toBeLessThan(child.indexOf('insert into public.activity_logs'));
    expect(definition('complete_habit_command')).not.toContain('activity_not_scheduled');
  });
  it('O3 refunds pending and approved requests before cascade, with durable audit', () => {
    const body = definition('refund_deleted_reward');
    expect(body).toContain("status in ('pending', 'approved')");
    expect(body).toContain('points = points + request.points_spent');
    expect(body).toContain("'reward_deleted'");
    expect(body).toContain('insert into public.reward_refund_events');
    expect(body).toContain('if not exists (select 1 from public.families where id = old.family_id) then return old; end if;');
    expect(migration).toContain('before delete on public.rewards');
    expect(migration).not.toMatch(/reward_id uuid[^,]*references public\.rewards/);
  });
  it('O4 returns the verified/set version under the existing row lock', () => {
    const verify = definition('verify_parent_pin');
    const set = definition('set_parent_pin');
    expect(verify).toContain('for update');
    expect(verify).toContain("'verified', 'version'");
    expect(set).toContain('returning * into settings');
    expect(set).toContain("'updated', 'version'");
  });
  it('O5 remembers finite reservations and restores stock once on rejection', () => {
    for (const name of ['redeem_reward_command', 'redeem_child_reward_command']) {
      expect(definition(name)).toContain('stock_reserved');
      expect(definition(name)).toContain("'pending', reward.stock > 0");
    }
    const reject = definition('transition_redemption_command');
    expect(reject).toContain("redemption.status in ('pending', 'approved')");
    expect(reject).toContain('if redemption.stock_reserved then');
    expect(reject).toContain('stock = stock + 1');
    expect(reject).toContain('stock >= 0');
    expect(reject).toContain('stock_reserved = false');
    expect(reject.indexOf('perform 1 from public.rewards')).toBeLessThan(reject.indexOf('select * into redemption'));
  });
  it.each(['complete_habit_command', 'complete_child_habit_command', 'undo_habit_command', 'undo_child_habit_command', 'review_habit_command'])('O6 %s recomputes even for zero stars', (name) => {
    const body = definition(name);
    expect(body).toContain('public.recompute_child_streak(');
    expect(body).not.toContain('streak = case');
    if (name.startsWith('complete')) expect(body).toMatch(/end if;\s+perform public.recompute_child_streak/);
  });
  it('O6 uses distinct verified days independently of backfill order', () => {
    const body = definition('recompute_child_streak');
    expect(body).toContain('select distinct log_date');
    expect(body).toContain("status in ('completed', 'approved')");
    expect(body).toContain('max(log_date) over ()');
    expect(body).toContain('last_day - (position - 1)');
  });
  it('O7 applies suppression/consent to stale processing before claim', () => {
    const body = definition('claim_lifecycle_messages');
    const suppression = body.slice(body.indexOf("set status = 'suppressed'"), body.indexOf('return query'));
    expect(suppression).toContain("message.status = 'processing'");
    expect(suppression).toContain("interval '10 minutes'");
    expect(suppression).toContain('email_suppressions');
    expect(suppression).toContain('marketing_consent = true');
    expect(suppression).toContain('locked_at = null');
  });
  it('S1/S3 child session and PIN status GET RPCs have no writes', () => {
    for (const name of ['get_child_session', 'get_parent_pin_status']) expect(definition(name)).not.toMatch(/\b(insert into|update public\.|delete from)\b/i);
  });
  it('S2 letter preview returns before INSERT/UPDATE', () => {
    const body = definition('open_daily_mascot_letter');
    const preview = body.slice(body.indexOf('if not mark_read then'), body.indexOf('insert into public.daily_mascot_letters'));
    expect(preview).toContain("return jsonb_build_object('status', 'ready'");
    expect(preview).not.toMatch(/insert into|update public\./);
  });
});
