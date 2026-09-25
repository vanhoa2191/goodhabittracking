import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from '@libpg-query/parser';

const migration = readFileSync(
  resolve('supabase/migrations/202609190001_family_tenancy.sql'),
  'utf8'
);
const schemaManifest = readFileSync(resolve('supabase/schema.sql'), 'utf8');
const legacyTemplateRefsMigration = readFileSync(
  resolve('supabase/migrations/202609240001_legacy_template_refs.sql'),
  'utf8'
);
const childSessionLegacyRefMigration = readFileSync(
  resolve('supabase/migrations/202609240002_child_session_legacy_ref.sql'),
  'utf8'
);
const childFamilyPauseMigration = readFileSync(
  resolve('supabase/migrations/202609240003_child_family_pause.sql'),
  'utf8'
);
const familyPauseHistoryMigration = readFileSync(
  resolve('supabase/migrations/202609240004_family_pause_history.sql'),
  'utf8'
);
const journeyHabitIdentityMigration = readFileSync(
  resolve('supabase/migrations/202609240005_journey_habit_identity.sql'),
  'utf8'
);
const dailyLetterReadTransitionMigration = readFileSync(
  resolve('supabase/migrations/202609240006_daily_letter_read_transition.sql'),
  'utf8'
);
const wishlistChangeTransitionMigration = readFileSync(
  resolve('supabase/migrations/202609240007_wishlist_change_transition.sql'),
  'utf8'
);
const wishlistChangeTransitionVerification = readFileSync(
  resolve('supabase/preflight/202609240007_wishlist_change_transition.verify.sql'),
  'utf8'
);
const rollback = readFileSync(
  resolve('supabase/rollbacks/202609190001_family_tenancy.rollback.sql'),
  'utf8'
);
const preflight = readFileSync(
  resolve('supabase/preflight/202609190001_family_tenancy.preflight.sql'),
  'utf8'
);
const postMigrationVerification = readFileSync(
  resolve('supabase/preflight/202609200002_post_migration.verify.sql'),
  'utf8'
);
const pairingMigration = readFileSync(
  resolve('supabase/migrations/202609190002_secure_pairing.sql'),
  'utf8'
);
const billingMigration = readFileSync(
  resolve('supabase/migrations/202609190003_billing_integrity.sql'),
  'utf8'
);
const domainMigration = readFileSync(
  resolve('supabase/migrations/202609190004_authoritative_domain.sql'),
  'utf8'
);
const privacyMigration = readFileSync(
  resolve('supabase/migrations/202609190005_privacy_lifecycle.sql'),
  'utf8'
);
const profileMigration = readFileSync(
  resolve('supabase/migrations/202609200001_authoritative_profiles.sql'),
  'utf8'
);
const socialMigration = readFileSync(
  resolve('supabase/migrations/202609200002_authoritative_social.sql'),
  'utf8'
);
const serverTableRlsMigration = readFileSync(
  resolve('supabase/migrations/202609210001_force_server_table_rls.sql'),
  'utf8'
);
const childDeviceCommandsMigration = readFileSync(
  resolve('supabase/migrations/202609210002_child_device_commands.sql'),
  'utf8'
);
const childDeviceCommandsRollback = readFileSync(
  resolve('supabase/rollbacks/202609210002_child_device_commands.rollback.sql'),
  'utf8'
);
const persistentPairingMigration = readFileSync(
  resolve('supabase/migrations/202609210003_persistent_pairing_credentials.sql'),
  'utf8'
);
const persistentPairingRollback = readFileSync(
  resolve('supabase/rollbacks/202609210003_persistent_pairing_credentials.rollback.sql'),
  'utf8'
);
const habitInstructionsMigration = readFileSync(
  resolve('supabase/migrations/202609210004_habit_instructions.sql'),
  'utf8'
);
const habitInstructionsRollback = readFileSync(
  resolve('supabase/rollbacks/202609210004_habit_instructions.rollback.sql'),
  'utf8'
);
const customerAdminMigration = readFileSync(
  resolve('supabase/migrations/202609210005_customer_admin.sql'),
  'utf8'
);
const customerAdminRollback = readFileSync(
  resolve('supabase/rollbacks/202609210005_customer_admin.rollback.sql'),
  'utf8'
);
const frameworkHabitRefsMigration = readFileSync(
  resolve('supabase/migrations/202609220001_framework_habit_refs.sql'),
  'utf8'
);
const frameworkHabitRefsRollback = readFileSync(
  resolve('supabase/rollbacks/202609220001_framework_habit_refs.rollback.sql'),
  'utf8'
);
const experienceFoundationMigration = readFileSync(
  resolve('supabase/migrations/202609230001_experience_foundation.sql'),
  'utf8'
);
const experienceFoundationRollback = readFileSync(
  resolve('supabase/rollbacks/202609230001_experience_foundation.rollback.sql'),
  'utf8'
);
const experienceFoundationVerification = readFileSync(
  resolve('supabase/preflight/202609230001_experience_foundation.verify.sql'),
  'utf8'
);
const mascotCooldownMigration = readFileSync(
  resolve('supabase/migrations/202609230002_mascot_selection_cooldown.sql'),
  'utf8'
);
const mascotCooldownRollback = readFileSync(
  resolve('supabase/rollbacks/202609230002_mascot_selection_cooldown.rollback.sql'),
  'utf8'
);
const mascotCooldownVerification = readFileSync(
  resolve('supabase/preflight/202609230002_mascot_selection_cooldown.verify.sql'),
  'utf8'
);
const journeyHabitIdentityVerification = readFileSync(
  resolve('supabase/preflight/202609240005_journey_habit_identity.verify.sql'),
  'utf8'
);
const journeyHabitIdentityBehavior = readFileSync(
  resolve('supabase/preflight/202609240005_journey_habit_identity.behavior.sql'),
  'utf8'
);
const socialRollback = readFileSync(
  resolve('supabase/rollbacks/202609200002_authoritative_social.rollback.sql'),
  'utf8'
);

describe('family tenancy migration', () => {
  it('is valid PostgreSQL syntax', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(preflight)).resolves.toBeDefined();
    await expect(parse(postMigrationVerification)).resolves.toBeDefined();
    await expect(parse(rollback)).resolves.toBeDefined();
    await expect(parse(pairingMigration)).resolves.toBeDefined();
    await expect(parse(billingMigration)).resolves.toBeDefined();
    await expect(parse(domainMigration)).resolves.toBeDefined();
    await expect(parse(privacyMigration)).resolves.toBeDefined();
    await expect(parse(profileMigration)).resolves.toBeDefined();
    await expect(parse(socialMigration)).resolves.toBeDefined();
    await expect(parse(serverTableRlsMigration)).resolves.toBeDefined();
    await expect(parse(childDeviceCommandsMigration)).resolves.toBeDefined();
    await expect(parse(childDeviceCommandsRollback)).resolves.toBeDefined();
    await expect(parse(persistentPairingMigration)).resolves.toBeDefined();
    await expect(parse(persistentPairingRollback)).resolves.toBeDefined();
    await expect(parse(habitInstructionsMigration)).resolves.toBeDefined();
    await expect(parse(habitInstructionsRollback)).resolves.toBeDefined();
    await expect(parse(customerAdminMigration)).resolves.toBeDefined();
    await expect(parse(customerAdminRollback)).resolves.toBeDefined();
    await expect(parse(frameworkHabitRefsMigration)).resolves.toBeDefined();
    await expect(parse(frameworkHabitRefsRollback)).resolves.toBeDefined();
    await expect(parse(experienceFoundationMigration)).resolves.toBeDefined();
    await expect(parse(experienceFoundationRollback)).resolves.toBeDefined();
    await expect(parse(experienceFoundationVerification)).resolves.toBeDefined();
    await expect(parse(mascotCooldownMigration)).resolves.toBeDefined();
    await expect(parse(mascotCooldownRollback)).resolves.toBeDefined();
    await expect(parse(mascotCooldownVerification)).resolves.toBeDefined();
    await expect(parse(socialRollback)).resolves.toBeDefined();
    await expect(parse(legacyTemplateRefsMigration)).resolves.toBeDefined();
    await expect(parse(childSessionLegacyRefMigration)).resolves.toBeDefined();
    await expect(parse(childFamilyPauseMigration)).resolves.toBeDefined();
    await expect(parse(familyPauseHistoryMigration)).resolves.toBeDefined();
    await expect(parse(journeyHabitIdentityMigration)).resolves.toBeDefined();
    await expect(parse(dailyLetterReadTransitionMigration)).resolves.toBeDefined();
    await expect(parse(wishlistChangeTransitionMigration)).resolves.toBeDefined();
    await expect(parse(wishlistChangeTransitionVerification)).resolves.toBeDefined();
    await expect(parse(journeyHabitIdentityVerification)).resolves.toBeDefined();
    await expect(parse(journeyHabitIdentityBehavior)).resolves.toBeDefined();
  });

  it('keeps the schema manifest aligned with every ordered migration', () => {
    const migrationNames = [
      '202609190001_family_tenancy.sql',
      '202609190002_secure_pairing.sql',
      '202609190003_billing_integrity.sql',
      '202609190004_authoritative_domain.sql',
      '202609190005_privacy_lifecycle.sql',
      '202609200001_authoritative_profiles.sql',
      '202609200002_authoritative_social.sql',
      '202609210001_force_server_table_rls.sql',
      '202609210002_child_device_commands.sql',
      '202609210003_persistent_pairing_credentials.sql',
      '202609210004_habit_instructions.sql',
      '202609210005_customer_admin.sql',
      '202609220001_framework_habit_refs.sql',
      '202609230001_experience_foundation.sql',
      '202609230002_mascot_selection_cooldown.sql',
      '202609230003_daily_mascot_letter.sql',
      '202609230004_reject_unknown_mascot_changes.sql',
      '202609230005_child_wishlist_commands.sql',
      '202609240001_legacy_template_refs.sql',
      '202609240002_child_session_legacy_ref.sql',
      '202609240003_child_family_pause.sql',
      '202609240004_family_pause_history.sql',
      '202609240005_journey_habit_identity.sql',
      '202609240006_daily_letter_read_transition.sql',
      '202609240007_wishlist_change_transition.sql',
      '202609240008_legacy_template_backfill.sql',
      '202609250001_child_task_deferrals.sql',
    ];

    expect(schemaManifest.trim().split('\n')).toEqual(
      migrationNames.map((name) => `\\ir migrations/${name}`)
    );
  });

  it('reports a daily letter read only on the first persisted read transition', () => {
    expect(dailyLetterReadTransitionMigration).toContain('newly_read := mark_read and affected_rows = 1;');
    expect(dailyLetterReadTransitionMigration).toContain('if mark_read and not newly_read then');
    expect(dailyLetterReadTransitionMigration).toContain('and read_at is null;');
    expect(dailyLetterReadTransitionMigration).toContain('newly_read := affected_rows = 1;');
    expect(dailyLetterReadTransitionMigration).toContain("'newly_read', newly_read");
  });

  it('reports a wishlist change only when the stored reward differs', () => {
    expect(wishlistChangeTransitionMigration).toContain('create or replace function public.choose_child_wishlist(');
    expect(wishlistChangeTransitionMigration).toContain('create or replace function public.choose_parent_wishlist(');
    expect(wishlistChangeTransitionMigration.match(/on conflict \(child_id\) do update/g)).toHaveLength(2);
    expect(wishlistChangeTransitionMigration.match(/where child_wishlists\.reward_id is distinct from excluded\.reward_id/g)).toHaveLength(2);
    expect(wishlistChangeTransitionMigration.match(/changed := found;/g)).toHaveLength(2);
    expect(wishlistChangeTransitionMigration.match(/if not changed then/g)).toHaveLength(2);
    expect(wishlistChangeTransitionMigration.match(/'changed', changed/g)).toHaveLength(2);
    expect(wishlistChangeTransitionMigration).toContain('public.can_manage_family(target_family_id)');
    expect(wishlistChangeTransitionMigration).toContain("'child_unavailable'");
    expect(wishlistChangeTransitionMigration).toContain("'reward_unavailable'");
    expect(wishlistChangeTransitionMigration).toContain("'session_invalid'");
    expect(wishlistChangeTransitionVerification).toContain('choose_parent_wishlist(uuid,uuid,uuid)');
  });

  it('includes the stable legacy template ID in paired child sessions', () => {
    expect(childSessionLegacyRefMigration).toContain("'legacyTemplateId', activity.legacy_template_id");
    expect(childSessionLegacyRefMigration).toContain('activity.family_id = child_session.family_id');
    expect(childSessionLegacyRefMigration).toContain('activity.is_active');
  });

  it('keeps customer care notes and tags server-admin only', () => {
    expect(customerAdminMigration).toContain(
      'revoke select, insert, update on public.parent_profiles from authenticated'
    );
    expect(customerAdminMigration).toContain(
      'grant update (display_name, email, phone, marketing_consent, updated_at)'
    );
    expect(customerAdminMigration).not.toContain(
      'grant update (customer_tags, admin_notes)'
    );
  });

  it('keeps experience records family-scoped and protected by forced RLS', () => {
    expect(experienceFoundationMigration).toContain('create table if not exists public.daily_mascot_letters');
    expect(experienceFoundationMigration).toContain('create table if not exists public.secret_quests');
    expect(experienceFoundationMigration).toContain('create table if not exists public.child_wishlists');
    expect(experienceFoundationMigration).toContain('create table if not exists public.family_engagement_settings');
    expect(experienceFoundationMigration).toContain('force row level security');
    expect(experienceFoundationMigration).toContain('public.is_family_member(family_id)');
    expect(experienceFoundationMigration).toContain('public.can_manage_family(family_id)');
    expect(experienceFoundationMigration.match(/foreign key \(child_id, family_id\)/g)).toHaveLength(4);
    expect(experienceFoundationMigration).toContain('foreign key (reward_id, family_id)');
    expect(experienceFoundationMigration).toContain('grant select on public.daily_mascot_letters, public.secret_quests to authenticated');
    expect(experienceFoundationMigration).toContain('from public, anon, authenticated');
    expect(experienceFoundationMigration).not.toMatch(/grant.*(?:insert|update|delete).*public\.secret_quests/i);
    expect(experienceFoundationRollback).not.toMatch(/drop\s+schema/i);
    expect(experienceFoundationVerification).toContain('relation.relforcerowsecurity');
    expect(experienceFoundationVerification).toContain("'child_wishlists_reward_family_fk'");
    expect(experienceFoundationVerification).toContain("has_table_privilege('anon', 'public.child_engagement_profiles', 'SELECT')");
  });

  it('records mascot changes atomically and prevents direct timestamp writes', () => {
    expect(mascotCooldownMigration).toContain('after update of avatar on public.child_profiles');
    expect(mascotCooldownMigration).toContain('after insert on public.child_profiles');
    expect(mascotCooldownMigration).toContain("'🦁', '🐰', '🐼', '🦊', '🐢', '🐝'");
    expect(mascotCooldownMigration).toContain('if new_mascot_id = old_mascot_id then return new; end if;');
    expect(mascotCooldownMigration).toContain("interval '168 hours'");
    expect(mascotCooldownMigration).toContain('revoke insert, update, delete on public.child_engagement_profiles from authenticated');
    expect(mascotCooldownMigration).toContain('create or replace function public.read_child_mascot_selection(session_token_hash text)');
    expect(mascotCooldownMigration).toContain('create or replace function public.update_child_mascot_command(');
    expect(mascotCooldownMigration).toContain('where id = child_session.child_id and family_id = child_session.family_id');
    expect(mascotCooldownVerification).toContain("has_table_privilege('authenticated', 'public.child_engagement_profiles', 'UPDATE')");
    expect(mascotCooldownVerification).toContain('owner_role.rolbypassrls');
    expect(mascotCooldownVerification).toContain('trigger_row.tgfoid');
    expect(mascotCooldownRollback).toContain('grant insert, update on public.child_engagement_profiles to authenticated');
    expect(mascotCooldownRollback).toContain('drop function if exists public.update_child_mascot_command(text, text, text)');
  });

  it('mutates groups and kudos through one family-owned command', () => {
    expect(socialMigration).toContain('create or replace function public.mutate_social_command');
    expect(socialMigration).toContain('actor_family_id uuid := public.current_family_id()');
    expect(socialMigration).toContain("mutation_type = 'createGroup'");
    expect(socialMigration).toContain("mutation_type = 'joinGroup'");
    expect(socialMigration).toContain("mutation_type = 'sendKudo'");
    expect(socialMigration).toContain('where id = child_id and family_id = actor_family_id');
    expect(socialMigration).toContain('on conflict (group_id, child_id) do nothing');
    expect(socialMigration).toContain('grant execute on function public.mutate_social_command(jsonb) to authenticated');
    expect(socialRollback).not.toMatch(/drop\s+table/i);
  });

  it('creates profiles and starter habits in one tenant-owned transaction', () => {
    expect(profileMigration).toContain('create or replace function public.mutate_child_profile_command');
    expect(profileMigration).toContain('actor_family_id uuid := public.current_family_id()');
    expect(profileMigration).toContain("mutation_type = 'create'");
    expect(profileMigration).toContain('insert into public.child_profiles');
    expect(profileMigration).toContain('insert into public.habit_activities');
    expect(profileMigration).toContain('starter_activity_child_mismatch');
    expect(profileMigration).toContain('invalid_initial_progress');
    expect(profileMigration).not.toContain("updates_input ? 'points'");
    expect(profileMigration).toContain('grant execute on function public.mutate_child_profile_command(jsonb) to authenticated');
  });

  it('serializes points and reward mutations through locked transactions', () => {
    expect(domainMigration).toContain('for update');
    expect(domainMigration).toContain('on conflict (activity_id, child_id, log_date) do nothing');
    expect(domainMigration).toContain("decision not in ('approve', 'deliver', 'reject')");
    expect(domainMigration).toContain('revoke insert, update, delete on public.activity_logs from authenticated');
    expect(domainMigration).toContain('revoke insert, update, delete on public.redemptions from authenticated');
  });

  it('records consent and limits family deletion to the authenticated owner', () => {
    expect(privacyMigration).toContain('create table if not exists public.family_consents');
    expect(privacyMigration).toContain("confirmation <> 'DELETE FAMILY'");
    expect(privacyMigration).toContain('where family.created_by = actor_id');
    expect(privacyMigration).toContain('delete from public.families');
  });

  it('makes billing idempotent and server-authoritative', () => {
    expect(billingMigration).toContain('unique (provider, provider_reference)');
    expect(billingMigration).toContain('target_order.amount <> incoming_amount');
    expect(billingMigration).toContain('target_order.description <> incoming_description');
    expect(billingMigration).toContain('for update');
    expect(billingMigration).toContain('grant execute on function public.process_payos_webhook');
    expect(billingMigration).toContain('to service_role');
    expect(billingMigration).toContain('free_plan_child_limit_reached');
    expect(billingMigration).toContain('trial_already_consumed_or_plan_active');
  });

  it('forces RLS on server-owned billing and consent audit tables', () => {
    expect(serverTableRlsMigration).toContain(
      'alter table public.billing_webhook_events force row level security'
    );
    expect(serverTableRlsMigration).toContain(
      'alter table public.family_consents force row level security'
    );
  });

  it('enforces one-time scoped device pairing in durable storage', () => {
    expect(pairingMigration).toContain('attempts_remaining smallint not null default 5');
    expect(pairingMigration).toContain("expires_at <= now()");
    expect(pairingMigration).toContain("challenge.consumed_at is not null");
    expect(pairingMigration).toContain("rate_record.attempts > 10");
    expect(pairingMigration).toContain("array['child:read', 'child:complete']");
    expect(pairingMigration).toContain('session_token_hash');
    expect(pairingMigration).not.toContain('data_snapshot');
    expect(pairingMigration).not.toMatch(/parent_?pin/i);
  });

  it('scopes child commands to the active device session and paired child', () => {
    expect(childDeviceCommandsMigration).toContain("'child:complete' = any(device.capabilities)");
    expect(childDeviceCommandsMigration).toContain('device.revoked_at is null');
    expect(childDeviceCommandsMigration).toContain('device.expires_at > now()');
    expect(childDeviceCommandsMigration).toContain('family_id = child_session.family_id');
    expect(childDeviceCommandsMigration).toContain('child_id = child_session.child_id');
    expect(childDeviceCommandsMigration).toContain(
      'grant execute on function public.complete_child_habit_command(text, uuid, date, uuid) to anon, authenticated'
    );
    expect(childDeviceCommandsRollback).not.toMatch(/drop\s+table/i);
  });

  it('rotates hash-only persistent credentials without revoking child sessions', () => {
    expect(persistentPairingMigration).toContain('create table public.pairing_credentials');
    expect(persistentPairingMigration).toContain('verifier_hash bytea not null');
    expect(persistentPairingMigration).toContain('token_hash bytea not null unique');
    expect(persistentPairingMigration).toContain('create or replace function public.rotate_pairing_credential');
    expect(persistentPairingMigration).toContain('create or replace function public.exchange_pairing_credential');
    const rotationFunction = persistentPairingMigration.slice(
      persistentPairingMigration.indexOf('create or replace function public.rotate_pairing_credential'),
      persistentPairingMigration.indexOf('create or replace function public.exchange_pairing_credential'),
    );
    expect(rotationFunction).not.toMatch(/update\s+public\.device_sessions/i);
    expect(rotationFunction).not.toMatch(/delete\s+from\s+public\.device_sessions/i);
    expect(persistentPairingMigration).not.toMatch(/\btoken\s+text\b/i);
    expect(persistentPairingRollback).not.toMatch(/drop\s+table/i);
  });

  it('adds optional task instructions to storage and child sessions', () => {
    expect(habitInstructionsMigration).toContain(
      'add column if not exists instructions text'
    );
    expect(habitInstructionsMigration).toContain("'instructions', activity.instructions");
    expect(habitInstructionsRollback).not.toMatch(/drop\s+table/i);
  });

  it('removes anonymous ownership bypasses and public table access', () => {
    expect(migration).not.toMatch(/auth\.uid\(\)\s+is\s+null/i);
    expect(migration).not.toMatch(/using\s*\(\s*true\s*\)/i);
    expect(migration).toContain("to_regclass('public.family_access_codes') is not null");
    expect(migration).toContain("execute 'revoke all on public.family_access_codes from anon, authenticated'");
    expect(migration).toContain('revoke all on public.device_sessions from anon, authenticated');
  });

  it('enforces family ownership and preserves unowned legacy rows', () => {
    expect(migration).toContain('create table if not exists public.user_subscriptions');
    expect(migration).toContain('create table if not exists public.payment_orders');
    expect(migration).toContain('select id as user_id from auth.users');
    expect(migration).toContain('create table if not exists public.family_memberships');
    expect(migration).toContain('create or replace function public.is_family_member');
    expect(migration).toContain('alter table public.child_profiles alter column family_id set not null');
    expect(migration).toContain('insert into public.migration_quarantine');
  });

  it('preflights partially provisioned legacy schemas without writing durable data', () => {
    expect(preflight).toContain('create temporary table migration_preflight_row_counts');
    expect(preflight).toContain("to_regclass(format('public.%I', inspected_table)) is null");
    expect(preflight).toContain('relation_exists boolean not null');
  });

  it('verifies tenant bootstrap, forced RLS, quarantine, and anonymous bypass removal', () => {
    expect(postMigrationVerification).toContain('count(distinct user_id) from public.family_memberships');
    expect(postMigrationVerification).toContain('count(*) from public.migration_quarantine');
    expect(postMigrationVerification).toContain('not class.relrowsecurity or not class.relforcerowsecurity');
    expect(postMigrationVerification).toContain("coalesce(qual, '') ~* 'auth\\.uid\\(\\)\\s+is\\s+null'");
  });

  it('publishes only the approved leaderboard projection', () => {
    const leaderboardFunction = migration.slice(
      migration.indexOf('create or replace function public.get_public_leaderboard'),
      migration.indexOf('create or replace function public.bootstrap_new_parent')
    );
    const publicProjection = leaderboardFunction.slice(
      leaderboardFunction.indexOf('returns table'),
      leaderboardFunction.indexOf('language sql')
    );

    expect(leaderboardFunction).toContain('grant execute on function public.get_public_leaderboard(integer) to anon, authenticated');
    expect(publicProjection).not.toContain('created_at');
    expect(publicProjection).not.toContain('user_id');
    expect(publicProjection).not.toContain('family_id');
  });

  it('keeps rollback non-destructive', () => {
    expect(rollback).not.toMatch(/drop\s+table/i);
    expect(rollback).not.toMatch(/drop\s+column/i);
    expect(rollback).not.toMatch(/truncate/i);
    expect(rollback).not.toMatch(/delete\s+from/i);
  });
});
