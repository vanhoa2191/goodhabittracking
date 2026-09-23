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

async function cleanup() {
  if (familyIds.length > 0) {
    const { error } = await admin.from('families').delete().in('id', familyIds);
    if (error) throw new Error('Synthetic family cleanup failed.');
  }
  for (const userId of userIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error('Synthetic user cleanup failed.');
  }
}

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
    .insert({ id: childId, family_id: familyIds[0], name: `Boundary child ${runId}` })
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
  assert(!engagementInsert.error, 'Same-family engagement write failed.');

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
    !crossEngagementUpdate.error && crossEngagementUpdate.data?.length === 0,
    'Cross-family engagement update was not denied.',
  );

  const pauseSetting = await accounts[0].client.from('family_engagement_settings').insert({
    family_id: familyIds[0],
    paused_at: new Date().toISOString(),
  });
  assert(!pauseSetting.error, 'Same-family pause write failed.');
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

  process.stdout.write(
    'Live family boundary verification passed: anonymous access denied, same-family access allowed, cross-family access denied.\n',
  );
} finally {
  await cleanup();
}
