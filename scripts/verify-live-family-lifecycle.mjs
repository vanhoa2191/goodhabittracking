import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';

import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'osvsvegqietxcfoabdhx';
const projectUrl = `https://${projectRef}.supabase.co`;
const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://goodhabittracking.vanhoa2191.workers.dev';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readProjectKeys() {
  const output = execFileSync(
    'npm',
    [
      'exec', '--', 'supabase', 'projects', 'api-keys', '--project-ref', projectRef,
      '--reveal', '--output', 'json',
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const keys = JSON.parse(output);
  const anonKey = keys.find((entry) => entry.name === 'anon' && entry.type === 'legacy')?.api_key;
  const serviceRole = keys.find(
    (entry) => entry.name === 'service_role' && entry.type === 'legacy',
  )?.api_key;
  assert(anonKey && serviceRole, 'Supabase operator keys are unavailable.');
  return { anonKey, serviceRole };
}

function createParentClient(anonKey) {
  const cookieJar = new Map();
  const client = createBrowserClient(projectUrl, anonKey, {
    cookies: {
      getAll: () => [...cookieJar].map(([name, value]) => ({ name, value })),
      setAll: (items) => {
        for (const item of items) {
          if (item.value) cookieJar.set(item.name, item.value);
          else cookieJar.delete(item.name);
        }
      },
    },
    auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return {
    client,
    cookieHeader: () => [...cookieJar]
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join('; '),
  };
}

async function jsonRequest(path, init = {}) {
  const response = await fetch(`${appOrigin}${path}`, init);
  const body = await response.json().catch(() => null);
  return { response, body };
}

const { anonKey, serviceRole } = readProjectKeys();
const admin = createClient(projectUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const parent = createParentClient(anonKey);
const runId = `${Date.now()}-${randomBytes(5).toString('hex')}`;
const email = `lifecycle-${runId}@example.invalid`;
const password = `${randomBytes(24).toString('base64url')}aA1!`;
const childId = randomUUID();
const activityId = randomUUID();
const rewardId = randomUUID();
const completionId = randomUUID();
const redemptionId = randomUUID();
let userId;
let familyId;

async function cleanup() {
  if (familyId) {
    const familyDelete = await admin.from('families').delete().eq('id', familyId);
    if (familyDelete.error) throw new Error('Synthetic family cleanup failed.');
  }
  if (userId) {
    const userDelete = await admin.auth.admin.deleteUser(userId);
    if (userDelete.error) throw new Error('Synthetic user cleanup failed.');
  }
}

try {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Automated lifecycle verification' },
  });
  assert(!created.error && created.data.user, 'Synthetic parent creation failed.');
  userId = created.data.user.id;

  const signedIn = await parent.client.auth.signInWithPassword({ email, password });
  assert(!signedIn.error, 'Synthetic parent sign-in failed.');
  const membership = await admin
    .from('family_memberships')
    .select('family_id')
    .eq('user_id', userId)
    .single();
  assert(!membership.error && membership.data?.family_id, 'Synthetic family bootstrap failed.');
  familyId = membership.data.family_id;

  const childFixture = await admin.from('child_profiles').insert({
    id: childId,
    family_id: familyId,
    user_id: userId,
    name: `Lifecycle child ${runId}`,
    points: 0,
    total_earned: 0,
    is_public_on_leaderboard: false,
  });
  assert(!childFixture.error, 'Synthetic child fixture creation failed.');
  const fixtures = await Promise.all([
    admin.from('habit_activities').insert({
      id: activityId,
      family_id: familyId,
      user_id: userId,
      child_id: childId,
      title: `Lifecycle habit ${runId}`,
      category: 'study',
      points: 20,
      requires_approval: true,
      is_active: true,
    }),
    admin.from('rewards').insert({
      id: rewardId,
      family_id: familyId,
      user_id: userId,
      title: `Lifecycle reward ${runId}`,
      cost_points: 10,
      stock: 1,
      is_active: true,
    }),
  ]);
  assert(fixtures.every((result) => !result.error), 'Synthetic lifecycle fixture creation failed.');

  const parentHeaders = {
    'content-type': 'application/json',
    cookie: parent.cookieHeader(),
  };
  const credential = await jsonRequest('/api/pairing/credentials', {
    method: 'POST',
    headers: parentHeaders,
    body: JSON.stringify({ childId }),
  });
  assert(credential.response.status === 200 && credential.body?.code, 'Pairing credential failed.');

  const exchange = await jsonRequest('/api/pairing/exchange', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: credential.body.code, deviceLabel: 'Automated child device' }),
  });
  assert(exchange.response.status === 200, 'Pairing exchange failed.');
  const setCookie = exchange.response.headers.get('set-cookie') ?? '';
  const childCookieMatch = setCookie.match(/kidhabit_child_session=([^;]+)/);
  assert(childCookieMatch, 'Child session cookie was not issued.');
  const childHeaders = {
    'content-type': 'application/json',
    cookie: `kidhabit_child_session=${childCookieMatch[1]}`,
  };

  const reuse = await jsonRequest('/api/pairing/exchange', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: credential.body.code, deviceLabel: 'Automated second child device' }),
  });
  assert(reuse.response.status === 200, 'Persistent pairing credential could not be reused.');

  const rotated = await jsonRequest('/api/pairing/credentials/rotate', {
    method: 'POST',
    headers: parentHeaders,
    body: JSON.stringify({ childId }),
  });
  assert(
    rotated.response.status === 200
      && rotated.body?.code
      && rotated.body.code !== credential.body.code,
    'Pairing credential rotation failed.',
  );
  const staleCredential = await jsonRequest('/api/pairing/exchange', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: credential.body.code }),
  });
  assert(staleCredential.response.status === 404, 'Rotated pairing credential remained valid.');

  const initialSession = await jsonRequest('/api/child/session', { headers: childHeaders });
  assert(
    initialSession.response.status === 200 && initialSession.body?.child?.id === childId,
    'Child session hydration failed.',
  );

  const completion = await jsonRequest('/api/child/commands', {
    method: 'POST',
    headers: childHeaders,
    body: JSON.stringify({
      type: 'completeHabit',
      activityId,
      date: new Date().toISOString().slice(0, 10),
      commandId: completionId,
    }),
  });
  assert(
    completion.response.status === 200 && completion.body?.result?.status === 'pending_approval',
    'Child completion did not enter parent approval.',
  );

  const approval = await jsonRequest('/api/domain/commands', {
    method: 'POST',
    headers: parentHeaders,
    body: JSON.stringify({ type: 'reviewHabit', logId: completionId, decision: 'approve' }),
  });
  assert(
    approval.response.status === 200 && approval.body?.result?.status === 'approved',
    'Parent approval failed.',
  );

  const redemption = await jsonRequest('/api/child/commands', {
    method: 'POST',
    headers: childHeaders,
    body: JSON.stringify({ type: 'redeemReward', rewardId, commandId: redemptionId }),
  });
  assert(
    redemption.response.status === 200 && redemption.body?.result?.status === 'pending',
    'Child reward redemption failed.',
  );

  for (const decision of ['approve', 'deliver']) {
    const transition = await jsonRequest('/api/domain/commands', {
      method: 'POST',
      headers: parentHeaders,
      body: JSON.stringify({ type: 'transitionRedemption', redemptionId, decision }),
    });
    assert(
      transition.response.status === 200
        && transition.body?.result?.status === (decision === 'approve' ? 'approved' : 'delivered'),
      `Parent reward ${decision} failed.`,
    );
  }

  const reconnect = await jsonRequest('/api/child/session', { headers: childHeaders });
  assert(reconnect.response.status === 200, 'Child reconnect failed.');
  assert(reconnect.body?.child?.points === 10, 'Reconnected child balance is incorrect.');
  assert(
    reconnect.body?.logs?.some((log) => log.id === completionId && log.status === 'approved'),
    'Approved completion was not restored on reconnect.',
  );
  assert(
    reconnect.body?.redemptions?.some(
      (item) => item.id === redemptionId && item.status === 'delivered',
    ),
    'Delivered redemption was not restored on reconnect.',
  );

  const revoke = await jsonRequest(`/api/devices/${initialSession.body.deviceSessionId}`, {
    method: 'DELETE',
    headers: parentHeaders,
  });
  assert(revoke.response.status === 200, 'Parent device revocation failed.');
  const revokedSession = await jsonRequest('/api/child/session', { headers: childHeaders });
  assert(revokedSession.response.status === 401, 'Revoked child session remained active.');

  const familyDelete = await jsonRequest('/api/family', {
    method: 'DELETE',
    headers: parentHeaders,
    body: JSON.stringify({ confirmation: 'DELETE FAMILY' }),
  });
  assert(familyDelete.response.status === 200, 'Owner family deletion failed.');
  const deletedFamily = await admin.from('families').select('id').eq('id', familyId).maybeSingle();
  assert(!deletedFamily.error && deletedFamily.data === null, 'Deleted family remained accessible.');
  familyId = undefined;

  process.stdout.write(
    'Live family lifecycle passed: persistent pairing, rotation, child completion, parent approval, reward delivery, reconnect, revoke, and owner deletion.\n',
  );
} finally {
  await cleanup();
}
