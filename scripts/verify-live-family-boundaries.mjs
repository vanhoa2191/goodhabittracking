import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'osvsvegqietxcfoabdhx';
const projectUrl = `https://${projectRef}.supabase.co`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readProjectKeys() {
  const output = execFileSync(
    'npm',
    [
      'exec',
      '--',
      'supabase',
      'projects',
      'api-keys',
      '--project-ref',
      projectRef,
      '--reveal',
      '--output',
      'json',
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const keys = JSON.parse(output);
  const legacyAnon = keys.find((entry) => entry.name === 'anon' && entry.type === 'legacy')?.api_key;
  const serviceRole = keys.find(
    (entry) => entry.name === 'service_role' && entry.type === 'legacy',
  )?.api_key;
  assert(legacyAnon && serviceRole, 'Supabase legacy API keys are unavailable.');
  return { legacyAnon, serviceRole };
}

function createBrowserClient(anonKey) {
  return createClient(projectUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const { legacyAnon, serviceRole } = readProjectKeys();
const admin = createClient(projectUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const anonymous = createBrowserClient(legacyAnon);
const runId = `${Date.now()}-${randomBytes(5).toString('hex')}`;
const password = `${randomBytes(24).toString('base64url')}aA1!`;
const accounts = [
  { email: `rls-a-${runId}@example.invalid`, client: createBrowserClient(legacyAnon) },
  { email: `rls-b-${runId}@example.invalid`, client: createBrowserClient(legacyAnon) },
];
const userIds = [];
const familyIds = [];

async function removeSyntheticData(userIdList, familyIdList) {
  const failures = [];
  const families = new Set(familyIdList.filter(Boolean));
  for (const userId of userIdList.filter(Boolean)) {
    // A family may exist for a user whose bootstrap did not finish, so find it by membership too.
    const found = await admin.from('family_memberships').select('family_id').eq('user_id', userId);
    for (const row of found.data ?? []) families.add(row.family_id);
  }
  if (families.size > 0) {
    const { error } = await admin.from('families').delete().in('id', [...families]);
    if (error) failures.push('families');
  }
  for (const userId of userIdList.filter(Boolean)) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) failures.push(`user ${userId}`);
  }
  if (failures.length > 0) throw new Error(`Synthetic cleanup failed for: ${failures.join(', ')}. Remove them by hand.`);
}

async function cleanup() {
  await removeSyntheticData(userIds, familyIds);
}

let successMessage = '';
try {
  for (const account of accounts) {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Automated RLS verification' },
    });
    assert(!error && data.user, 'Synthetic account creation failed.');
    userIds.push(data.user.id);

    const signIn = await account.client.auth.signInWithPassword({ email: account.email, password });
    assert(!signIn.error && signIn.data.user, 'Synthetic account sign-in failed.');

    const membership = await account.client
      .from('family_memberships')
      .select('family_id')
      .eq('user_id', data.user.id)
      .single();
    assert(!membership.error && membership.data?.family_id, 'Synthetic family bootstrap failed.');
    familyIds.push(membership.data.family_id);
  }

  const entitlementFixtures = await Promise.all(familyIds.map((familyId, index) => admin.from('user_subscriptions').upsert({
    family_id: familyId,
    user_id: userIds[index],
    plan: 'solo_monthly',
    status: 'active',
    subscription_ends_at: new Date(Date.now() + 86_400_000).toISOString(),
  }, { onConflict: 'family_id' })));
  assert(entitlementFixtures.every(({ error }) => !error), 'Synthetic entitlement fixture failed.');

  const anonymousRead = await anonymous.from('families').select('id').limit(1);
  assert(
    Boolean(anonymousRead.error) || anonymousRead.data?.length === 0,
    'Anonymous family read unexpectedly returned private data.',
  );
  const anonymousWrite = await anonymous.from('families').insert({
    id: randomUUID(),
    name: 'Unauthorized family',
    created_by: randomUUID(),
  });
  assert(Boolean(anonymousWrite.error), 'Anonymous family write unexpectedly succeeded.');

  const ownFamily = await accounts[0].client
    .from('families')
    .select('id,name')
    .eq('id', familyIds[0])
    .single();
  assert(!ownFamily.error && ownFamily.data?.id === familyIds[0], 'Same-family read failed.');

  const verificationName = `RLS verification ${runId}`;
  const ownUpdate = await accounts[0].client
    .from('families')
    .update({ name: verificationName })
    .eq('id', familyIds[0])
    .select('name')
    .single();
  assert(
    !ownUpdate.error && ownUpdate.data?.name === verificationName,
    'Same-family write failed.',
  );

  const childId = randomUUID();
  const ownChildInsert = await accounts[0].client
    .from('child_profiles')
    .insert({
      id: childId,
      family_id: familyIds[0],
      name: `Boundary child ${runId}`,
      avatar: 'mascot:bunny',
      theme_color: '#6366f1',
    })
    .select('id')
    .single();
  assert(
    !ownChildInsert.error && ownChildInsert.data?.id === childId,
    'Same-family private-row write failed.',
  );

  const ownChildRead = await accounts[0].client
    .from('child_profiles')
    .select('id')
    .eq('id', childId)
    .single();
  assert(
    !ownChildRead.error && ownChildRead.data?.id === childId,
    'Same-family private-row read failed.',
  );

  const engagementInsert = await accounts[0].client.from('child_engagement_profiles').insert({
    family_id: familyIds[0],
    child_id: childId,
    mascot_selected_at: new Date().toISOString(),
  });
  assert(Boolean(engagementInsert.error), 'Client engagement write unexpectedly succeeded.');

  const engagementRead = await accounts[0].client
    .from('child_engagement_profiles').select('child_id').eq('child_id', childId);
  assert(
    !engagementRead.error && engagementRead.data?.length === 1,
    'Same-family engagement read failed.',
  );

  const crossEngagementRead = await accounts[1].client
    .from('child_engagement_profiles').select('child_id').eq('child_id', childId);
  assert(
    !crossEngagementRead.error && crossEngagementRead.data?.length === 0,
    'Cross-family engagement read was not denied.',
  );

  const crossEngagementInsert = await accounts[1].client.from('child_engagement_profiles').insert({
    family_id: familyIds[1],
    child_id: childId,
  });
  assert(Boolean(crossEngagementInsert.error), 'Cross-family child reference was accepted.');

  const crossEngagementUpdate = await accounts[1].client
    .from('child_engagement_profiles')
    .update({ mascot_selected_at: null })
    .eq('child_id', childId)
    .select('child_id');
  assert(
    Boolean(crossEngagementUpdate.error) || crossEngagementUpdate.data?.length === 0,
    'Cross-family engagement update was not denied.',
  );

  const pauseSetting = await accounts[0].client.from('family_engagement_settings').insert({
    family_id: familyIds[0],
    paused_at: new Date().toISOString(),
  });
  assert(Boolean(pauseSetting.error), 'Client family-pause write unexpectedly succeeded.');
  const pauseFixture = await admin.from('family_engagement_settings').upsert({
    family_id: familyIds[0],
    paused_at: new Date().toISOString(),
  }, { onConflict: 'family_id' });
  assert(!pauseFixture.error, 'Synthetic family-pause fixture failed.');
  const crossPauseRead = await accounts[1].client
    .from('family_engagement_settings').select('family_id').eq('family_id', familyIds[0]);
  assert(
    !crossPauseRead.error && crossPauseRead.data?.length === 0,
    'Cross-family pause read was not denied.',
  );

  const letterWrite = await accounts[0].client.from('daily_mascot_letters').insert({
    family_id: familyIds[0], child_id: childId,
    local_date: '2026-09-23', template_key: 'boundary-check',
  });
  assert(Boolean(letterWrite.error), 'Client-generated mascot letter was accepted.');
  const questWrite = await accounts[0].client.from('secret_quests').insert({
    family_id: familyIds[0], child_id: childId,
    local_date: '2026-09-23', quest_key: 'boundary-check',
    unlocked_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });
  assert(Boolean(questWrite.error), 'Client-generated secret quest was accepted.');

  const rewardId = randomUUID();
  const rewardInsert = await accounts[0].client.from('rewards').insert({
    id: rewardId, family_id: familyIds[0], user_id: userIds[0],
    title: `Boundary reward ${runId}`, cost_points: 10, stock: 1, is_active: true,
  });
  assert(!rewardInsert.error, 'Same-family reward fixture failed.');
  const wishlistInsert = await accounts[0].client.from('child_wishlists').insert({
    family_id: familyIds[0], child_id: childId, reward_id: rewardId,
  });
  assert(!wishlistInsert.error, 'Same-family wishlist write failed.');
  const crossWishlistRead = await accounts[1].client
    .from('child_wishlists').select('child_id').eq('child_id', childId);
  assert(
    !crossWishlistRead.error && crossWishlistRead.data?.length === 0,
    'Cross-family wishlist read was not denied.',
  );
  const secondChildId = randomUUID();
  const secondChildInsert = await accounts[1].client.from('child_profiles').insert({
    id: secondChildId, family_id: familyIds[1], name: `Boundary child ${runId}`,
  });
  assert(!secondChildInsert.error, 'Second-family child fixture failed.');
  const crossWishlistInsert = await accounts[1].client.from('child_wishlists').insert({
    family_id: familyIds[1], child_id: secondChildId, reward_id: rewardId,
  });
  assert(Boolean(crossWishlistInsert.error), 'Cross-family reward reference was accepted.');

  const programActivityId = randomUUID();
  const programLogId = randomUUID();
  const programFixtures = await Promise.all([
    admin.from('habit_activities').insert({
      id: programActivityId, family_id: familyIds[0], user_id: userIds[0], child_id: childId,
      title: `Boundary habit ${runId}`, category: 'study', points: 10, is_active: true,
    }),
  ]);
  assert(programFixtures.every(({ error }) => !error), 'Habit program activity fixture failed.');
  const programLog = await admin.from('activity_logs').insert({
    id: programLogId, family_id: familyIds[0], user_id: userIds[0], child_id: childId,
    activity_id: programActivityId, log_date: new Date().toISOString().slice(0, 10),
    status: 'completed', points_awarded: 10,
  });
  assert(!programLog.error, 'Habit program log fixture failed.');

  const cueArguments = {
    target_family_id: familyIds[0], target_child_id: childId, target_activity_id: programActivityId,
    target_cue_kind: 'event', target_cue_text: 'After dinner', target_cue_time: null,
    target_place_text: null, target_weekend_variant_text: null,
  };
  const anonymousCue = await anonymous.rpc('save_parent_habit_cue_plan', cueArguments);
  assert(Boolean(anonymousCue.error), 'Anonymous cue plan write unexpectedly succeeded.');
  const crossCue = await accounts[1].client.rpc('save_parent_habit_cue_plan', cueArguments);
  assert(
    Boolean(crossCue.error) || crossCue.data?.status === 'session_invalid',
    'Cross-family cue plan write was not denied.',
  );
  const ownCue = await accounts[0].client.rpc('save_parent_habit_cue_plan', cueArguments);
  assert(!ownCue.error && ownCue.data?.status === 'saved', 'Same-family cue plan write failed.');
  const directCue = await accounts[0].client.from('habit_cue_plans').insert({
    family_id: familyIds[0], child_id: childId, activity_id: programActivityId,
    cue_kind: 'event', cue_text: 'Direct write',
  });
  assert(Boolean(directCue.error), 'Direct cue plan table write unexpectedly succeeded.');

  const supportArguments = { target_family_id: familyIds[0], target_log_id: programLogId, target_level: 'alone' };
  const anonymousSupport = await anonymous.rpc('set_parent_habit_support', supportArguments);
  assert(Boolean(anonymousSupport.error), 'Anonymous support record unexpectedly succeeded.');
  const crossSupport = await accounts[1].client.rpc('set_parent_habit_support', supportArguments);
  assert(
    Boolean(crossSupport.error) || crossSupport.data?.status === 'session_invalid',
    'Cross-family support record was not denied.',
  );
  const ownSupport = await accounts[0].client.rpc('set_parent_habit_support', supportArguments);
  assert(!ownSupport.error && ownSupport.data?.status === 'saved', 'Same-family support record failed.');
  const directSupport = await accounts[0].client.from('habit_support_observations').insert({
    log_id: randomUUID(), family_id: familyIds[0], child_id: childId, activity_id: programActivityId,
    support_level: 'alone', recorded_by: 'parent',
  });
  assert(Boolean(directSupport.error), 'Direct support table write unexpectedly succeeded.');
  const internalSupport = await accounts[0].client.rpc('record_habit_support_internal', {
    target_family_id: familyIds[0], target_child_id: null, target_log_id: programLogId,
    target_level: 'together', recorder: 'parent',
  });
  assert(Boolean(internalSupport.error), 'Internal support function was callable by a client.');

  for (const table of ['habit_cue_plans', 'habit_support_observations']) {
    const ownRead = await accounts[0].client.from(table).select('family_id').eq('family_id', familyIds[0]);
    assert(!ownRead.error && ownRead.data?.length === 1, `Same-family ${table} read failed.`);
    const crossReadRows = await accounts[1].client.from(table).select('family_id').eq('family_id', familyIds[0]);
    assert(!crossReadRows.error && crossReadRows.data?.length === 0, `Cross-family ${table} read was not denied.`);
    const anonymousReadRows = await anonymous.from(table).select('family_id').limit(1);
    assert(
      Boolean(anonymousReadRows.error) || anonymousReadRows.data?.length === 0,
      `Anonymous ${table} read returned private data.`,
    );
  }

  const crossRead = await accounts[1].client
    .from('families')
    .select('id')
    .eq('id', familyIds[0]);
  assert(!crossRead.error && crossRead.data?.length === 0, 'Cross-family read was not denied.');

  const crossChildRead = await accounts[1].client
    .from('child_profiles')
    .select('id')
    .eq('id', childId);
  assert(
    !crossChildRead.error && crossChildRead.data?.length === 0,
    'Cross-family private-row read was not denied.',
  );

  const crossChildInsert = await accounts[1].client.from('child_profiles').insert({
    id: randomUUID(),
    family_id: familyIds[0],
    name: 'Unauthorized child',
  });
  assert(Boolean(crossChildInsert.error), 'Cross-family private-row write succeeded.');

  const crossUpdate = await accounts[1].client
    .from('families')
    .update({ name: 'Cross-family overwrite' })
    .eq('id', familyIds[0]);
  assert(!crossUpdate.error, 'Cross-family update returned an unexpected transport error.');
  const unchanged = await admin.from('families').select('name').eq('id', familyIds[0]).single();
  assert(
    !unchanged.error && unchanged.data?.name === verificationName,
    'Cross-family update changed protected data.',
  );

  const membershipEscalation = await accounts[1].client.from('family_memberships').insert({
    family_id: familyIds[0],
    user_id: userIds[1],
    role: 'parent',
  });
  assert(Boolean(membershipEscalation.error), 'Cross-family membership escalation succeeded.');

  successMessage = 'Live family boundary verification passed: anonymous access denied, same-family access allowed, cross-family access denied, including habit programs.\n';
} finally {
  await cleanup();
}
process.stdout.write(successMessage);
