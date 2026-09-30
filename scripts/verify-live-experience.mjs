import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Certifies the daily mascot letter, the one-line journal, the parent reminder consent and the dream city
// against the live project and the deployed app, with two synthetic families. Everything is removed afterwards.
// The dream city routes answer 404 until their build flag is on; then the city is certified through the database
// functions only (the same ones the routes call) and through the routes too once they are reachable.

const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'osvsvegqietxcfoabdhx';
const projectUrl = `https://${projectRef}.supabase.co`;
function readAppOrigin() {
  const url = new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.kidhabithero.com');
  assert(
    url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash,
    'NEXT_PUBLIC_APP_URL must be an HTTPS origin.',
  );
  return url.origin;
}

const appOrigin = readAppOrigin();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readProjectKeys() {
  const output = execFileSync(
    'npm',
    ['exec', '--', 'supabase', 'projects', 'api-keys', '--project-ref', projectRef, '--reveal', '--output', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const keys = JSON.parse(output);
  const anonKey = keys.find((entry) => entry.name === 'anon' && entry.type === 'legacy')?.api_key;
  const serviceRole = keys.find((entry) => entry.name === 'service_role' && entry.type === 'legacy')?.api_key;
  assert(anonKey && serviceRole, 'Supabase operator keys are unavailable.');
  return { anonKey, serviceRole };
}

function createParent(anonKey) {
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
    headers: () => ({
      'content-type': 'application/json',
      cookie: [...cookieJar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('; '),
    }),
  };
}

async function jsonRequest(path, init = {}) {
  const response = await fetch(`${appOrigin}${path}`, init);
  const body = await response.json().catch(() => null);
  return { response, body };
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const { anonKey, serviceRole } = readProjectKeys();
const admin = createClient(projectUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const anonymous = createClient(projectUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const runId = `${Date.now()}-${randomBytes(5).toString('hex')}`;
const families = [0, 1].map(() => ({ parent: createParent(anonKey), userId: null, familyId: null, childId: randomUUID() }));
const today = new Date().toISOString().slice(0, 10);

// The email provider is off in production (Google is the only sign-in), so a synthetic parent gets a session from
// an administrator-issued one-time link instead of a password.
async function signInSyntheticUser(client, email) {
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const tokenHash = link.data?.properties?.hashed_token;
  assert(!link.error && tokenHash, 'Synthetic sign-in link could not be issued.');
  return client.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
}

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
  await removeSyntheticData(families.map((family) => family.userId), families.map((family) => family.familyId));
}

let successMessage = '';
try {
  for (const [index, family] of families.entries()) {
    const email = `experience-${index}-${runId}@example.invalid`;
    const created = await admin.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { full_name: 'Automated experience verification' },
    });
    assert(!created.error && created.data.user, 'Synthetic parent creation failed.');
    family.userId = created.data.user.id;
    const signedIn = await signInSyntheticUser(family.parent.client, email);
    assert(!signedIn.error, 'Synthetic parent sign-in failed.');
    const membership = await admin.from('family_memberships').select('family_id').eq('user_id', family.userId).single();
    assert(!membership.error && membership.data?.family_id, 'Synthetic family bootstrap failed.');
    family.familyId = membership.data.family_id;
    const entitlement = await admin.from('user_subscriptions').upsert({
      family_id: family.familyId, user_id: family.userId, plan: 'solo_monthly', status: 'active',
      subscription_ends_at: new Date(Date.now() + 86_400_000).toISOString(),
    }, { onConflict: 'family_id' });
    assert(!entitlement.error, 'Synthetic entitlement fixture failed.');
    const child = await admin.from('child_profiles').insert({
      id: family.childId, family_id: family.familyId, user_id: family.userId,
      name: `Experience child ${index} ${runId}`, avatar: 'mascot:bunny', points: 0, total_earned: 0,
      is_public_on_leaderboard: false,
    });
    assert(!child.error, 'Synthetic child fixture failed.');
  }
  const [first, second] = families;

  // A paired child device for the first family.
  const credential = await jsonRequest('/api/pairing/credentials', {
    method: 'POST', headers: first.parent.headers(), body: JSON.stringify({ childId: first.childId }),
  });
  assert(credential.response.status === 200 && credential.body?.code, 'Pairing credential failed.');
  const exchange = await jsonRequest('/api/pairing/exchange', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: credential.body.code, deviceLabel: 'Automated experience device' }),
  });
  assert(exchange.response.status === 200, 'Pairing exchange failed.');
  const childToken = (exchange.response.headers.get('set-cookie') ?? '').match(/kidhabit_child_session=([^;]+)/)?.[1];
  assert(childToken, 'Child session cookie was not issued.');
  const childHeaders = { 'content-type': 'application/json', cookie: `kidhabit_child_session=${childToken}` };
  const tokenHash = sha256(childToken);

  // Daily mascot letter.
  const letterRead = await jsonRequest(`/api/mascot/letter?childId=${first.childId}&date=${today}`, { headers: childHeaders });
  assert(
    letterRead.response.status === 200 && /^(leo|bunny|panda|fox|turtle|bee)_[0-2]$/.test(letterRead.body?.templateKey ?? '')
      && letterRead.body?.readAt === null,
    'Child could not open today\'s mascot letter.',
  );
  const letterMark = await jsonRequest('/api/mascot/letter', {
    method: 'POST', headers: childHeaders, body: JSON.stringify({ childId: first.childId, date: today }),
  });
  assert(letterMark.response.status === 200 && letterMark.body?.readAt && letterMark.body?.newlyRead === true, 'Mascot letter was not marked read.');
  const letterAgain = await jsonRequest('/api/mascot/letter', {
    method: 'POST', headers: childHeaders, body: JSON.stringify({ childId: first.childId, date: today }),
  });
  assert(letterAgain.response.status === 200 && letterAgain.body?.newlyRead === false, 'Mascot letter read twice counted as new.');
  const parentLetter = await jsonRequest(`/api/mascot/letter?childId=${first.childId}&date=${today}`, { headers: first.parent.headers() });
  assert(parentLetter.response.status === 200 && parentLetter.body?.readAt, 'Parent could not see the letter state.');
  const foreignLetter = await jsonRequest(`/api/mascot/letter?childId=${first.childId}&date=${today}`, { headers: second.parent.headers() });
  assert(foreignLetter.response.status === 401, 'A parent of another family opened this child\'s letter.');
  const anonymousLetter = await jsonRequest(`/api/mascot/letter?childId=${first.childId}&date=${today}`);
  assert(anonymousLetter.response.status === 401, 'The mascot letter answered without a session.');
  const staleLetterDate = await jsonRequest('/api/mascot/letter?childId=' + first.childId + '&date=2020-01-01', { headers: childHeaders });
  assert(staleLetterDate.response.status === 400, 'A letter for a far-off date was accepted.');

  // One-line journal.
  const entryText = 'Hôm nay con đã giúp mẹ dọn bàn ăn.';
  const journalSave = await jsonRequest('/api/child/journal', {
    method: 'PUT', headers: childHeaders, body: JSON.stringify({ date: today, text: entryText }),
  });
  assert(journalSave.response.status === 200 && journalSave.body?.entry?.entry_text === entryText, 'Child journal save failed.');
  const journalEdit = await jsonRequest('/api/child/journal', {
    method: 'PUT', headers: childHeaders, body: JSON.stringify({ date: today, text: `${entryText} Con thấy vui.` }),
  });
  assert(journalEdit.response.status === 200, 'Child journal edit failed.');
  const journalRead = await jsonRequest('/api/child/journal', { headers: childHeaders });
  assert(
    journalRead.response.status === 200 && journalRead.body?.entries?.length === 1
      && journalRead.body.entries[0].entry_text.endsWith('Con thấy vui.'),
    'Child journal did not keep one edited entry per day.',
  );
  const journalEmpty = await jsonRequest('/api/child/journal', {
    method: 'PUT', headers: childHeaders, body: JSON.stringify({ date: today, text: '   ' }),
  });
  assert(journalEmpty.response.status === 400, 'An empty journal entry was accepted.');
  const journalFarDate = await jsonRequest('/api/child/journal', {
    method: 'PUT', headers: childHeaders, body: JSON.stringify({ date: '2020-01-01', text: 'Too old' }),
  });
  assert(journalFarDate.response.status === 409, 'A journal entry for a far-off date was accepted.');
  const journalNoSession = await jsonRequest('/api/child/journal');
  assert(journalNoSession.response.status === 401, 'The journal answered without a child session.');
  const parentJournal = await jsonRequest('/api/domain/journal', {
    method: 'PUT', headers: first.parent.headers(), body: JSON.stringify({ childId: first.childId, date: today, text: 'Ba mẹ ghi thêm một dòng.' }),
  });
  assert(parentJournal.response.status === 200, 'Parent journal save failed.');
  const foreignJournal = await jsonRequest('/api/domain/journal', {
    method: 'PUT', headers: second.parent.headers(), body: JSON.stringify({ childId: first.childId, date: today, text: 'Not my child' }),
  });
  assert([401, 409].includes(foreignJournal.response.status), 'A parent of another family wrote to this child\'s journal.');
  const journalRows = await first.parent.client.from('child_journal_entries').select('child_id').eq('family_id', first.familyId);
  assert(!journalRows.error && journalRows.data?.length === 1, 'Same-family parent could not read the journal rows.');
  const foreignRows = await second.parent.client.from('child_journal_entries').select('child_id').eq('family_id', first.familyId);
  assert(!foreignRows.error && foreignRows.data?.length === 0, 'Cross-family journal read was not denied.');
  const directJournal = await first.parent.client.from('child_journal_entries').insert({
    family_id: first.familyId, child_id: first.childId, local_date: today, entry_text: 'Direct write',
  });
  assert(Boolean(directJournal.error), 'Direct journal table write unexpectedly succeeded.');

  // Parent reminder consent.
  const consentDefault = await jsonRequest('/api/privacy/reminder-consent', { headers: first.parent.headers() });
  assert(consentDefault.response.status === 200 && consentDefault.body?.enabled === false, 'Reminder consent was not off by default.');
  const consentOn = await jsonRequest('/api/privacy/reminder-consent', {
    method: 'PUT', headers: first.parent.headers(), body: JSON.stringify({ enabled: true }),
  });
  assert(consentOn.response.status === 200 && consentOn.body?.enabled === true, 'Reminder consent could not be granted.');
  const consentOnRead = await jsonRequest('/api/privacy/reminder-consent', { headers: first.parent.headers() });
  assert(consentOnRead.body?.enabled === true, 'Reminder consent was not kept.');
  const otherConsent = await jsonRequest('/api/privacy/reminder-consent', { headers: second.parent.headers() });
  assert(otherConsent.body?.enabled === false, 'Reminder consent leaked to another family.');
  const consentOff = await jsonRequest('/api/privacy/reminder-consent', {
    method: 'PUT', headers: first.parent.headers(), body: JSON.stringify({ enabled: false }),
  });
  assert(consentOff.response.status === 200 && consentOff.body?.enabled === false, 'Reminder consent could not be revoked.');
  const consentOffRead = await jsonRequest('/api/privacy/reminder-consent', { headers: first.parent.headers() });
  assert(consentOffRead.body?.enabled === false, 'Reminder consent revocation was not kept.');
  const consentAnonymous = await jsonRequest('/api/privacy/reminder-consent');
  assert(consentAnonymous.response.status === 401, 'Reminder consent answered without a session.');
  const consentInvalid = await jsonRequest('/api/privacy/reminder-consent', {
    method: 'PUT', headers: first.parent.headers(), body: JSON.stringify({ enabled: 'yes' }),
  });
  assert(consentInvalid.response.status === 400, 'Invalid reminder consent was accepted.');

  // Dream city, through the database functions the routes call.
  const cityItem = 'garden';
  const cityEmpty = await anonymous.rpc('read_child_city', { session_token_hash: tokenHash });
  assert(!cityEmpty.error && cityEmpty.data?.status === 'ready' && cityEmpty.data.purchases.length === 0, 'Child city did not start empty.');
  const cityAnonymousBad = await anonymous.rpc('read_child_city', { session_token_hash: sha256('not-a-session') });
  assert(cityAnonymousBad.data?.status === 'session_invalid', 'Child city answered for an unknown session.');
  const poor = await anonymous.rpc('purchase_child_city_item', { session_token_hash: tokenHash, target_item_id: cityItem });
  assert(!poor.error && poor.data?.status === 'insufficient_points', 'A city item was built without enough points.');
  const funded = await admin.from('child_profiles').update({ points: 500, total_earned: 500 }).eq('id', first.childId);
  assert(!funded.error, 'Synthetic city funding failed.');
  const built = await anonymous.rpc('purchase_child_city_item', { session_token_hash: tokenHash, target_item_id: cityItem });
  assert(!built.error && built.data?.status === 'built' && built.data.remainingPoints < 500, 'Child city purchase failed.');
  const spent = 500 - built.data.remainingPoints;
  const builtAgain = await anonymous.rpc('purchase_child_city_item', { session_token_hash: tokenHash, target_item_id: cityItem });
  assert(
    !builtAgain.error && builtAgain.data?.status === 'already_built' && builtAgain.data.remainingPoints === built.data.remainingPoints,
    'A repeated city purchase charged points twice.',
  );
  const afterBuy = await admin.from('child_profiles').select('points,total_earned').eq('id', first.childId).single();
  assert(
    !afterBuy.error && afterBuy.data.points === 500 - spent && afterBuy.data.total_earned === 500,
    'City purchase changed the earned total or the balance unexpectedly.',
  );
  const beforeConcurrent = await admin.from('child_profiles').select('points').eq('id', first.childId).single();
  assert(!beforeConcurrent.error, 'Synthetic balance read failed.');
  const concurrent = await Promise.all([1, 2, 3].map(() => anonymous.rpc('purchase_child_city_item', { session_token_hash: tokenHash, target_item_id: 'library' })));
  assert(
    concurrent.every(({ error, data }) => !error && ['built', 'already_built'].includes(data?.status))
      && concurrent.filter(({ data }) => data?.status === 'built').length === 1,
    'Concurrent city purchases did not build the item exactly once.',
  );
  const afterConcurrentBalance = await admin.from('child_profiles').select('points').eq('id', first.childId).single();
  assert(
    !afterConcurrentBalance.error && beforeConcurrent.data.points - afterConcurrentBalance.data.points === 60,
    'Concurrent city purchases did not charge the price exactly once.',
  );
  const afterConcurrent = await admin.from('child_city_purchases').select('item_id').eq('child_id', first.childId);
  assert(
    !afterConcurrent.error && new Set(afterConcurrent.data.map((row) => row.item_id)).size === afterConcurrent.data.length,
    'Duplicate city purchases were stored.',
  );
  const parentCity = await first.parent.client.rpc('purchase_parent_city_item', {
    target_family_id: first.familyId, target_child_id: first.childId, target_item_id: 'bridge',
  });
  assert(!parentCity.error && ['built', 'already_built'].includes(parentCity.data?.status), 'Parent city purchase failed.');
  const foreignCity = await second.parent.client.rpc('purchase_parent_city_item', {
    target_family_id: first.familyId, target_child_id: first.childId, target_item_id: 'observatory',
  });
  assert(Boolean(foreignCity.error) || foreignCity.data?.status === 'session_invalid', 'A parent of another family built in this child\'s city.');
  const anonymousCity = await anonymous.rpc('purchase_parent_city_item', {
    target_family_id: first.familyId, target_child_id: first.childId, target_item_id: 'observatory',
  });
  assert(Boolean(anonymousCity.error), 'Anonymous parent city purchase unexpectedly succeeded.');
  const cityRows = await first.parent.client.from('child_city_purchases').select('child_id').eq('family_id', first.familyId);
  assert(!cityRows.error && cityRows.data?.length >= 1, 'Same-family parent could not read the city rows.');
  const foreignCityRows = await second.parent.client.from('child_city_purchases').select('child_id').eq('family_id', first.familyId);
  assert(!foreignCityRows.error && foreignCityRows.data?.length === 0, 'Cross-family city read was not denied.');
  const directCity = await first.parent.client.from('child_city_purchases').insert({
    family_id: first.familyId, child_id: first.childId, item_id: 'observatory', points_spent: 1,
  });
  assert(Boolean(directCity.error), 'Direct city table write unexpectedly succeeded.');

  // The city routes, when their build flag is on.
  const cityRoute = await jsonRequest('/api/child/city', { headers: childHeaders });
  let cityRouteNote = 'city routes are still off (404) and were checked through the database only';
  if (cityRoute.response.status !== 404) {
    assert(cityRoute.response.status === 200 && Array.isArray(cityRoute.body?.purchases), 'Child city route failed.');
    const routeNoSession = await jsonRequest('/api/child/city');
    assert(routeNoSession.response.status === 401, 'The city route answered without a child session.');
    const parentRoute = await jsonRequest('/api/domain/city', {
      method: 'POST', headers: first.parent.headers(), body: JSON.stringify({ childId: first.childId, itemId: 'observatory' }),
    });
    assert(parentRoute.response.status === 200, 'Parent city route failed.');
    const foreignRoute = await jsonRequest('/api/domain/city', {
      method: 'POST', headers: second.parent.headers(), body: JSON.stringify({ childId: first.childId, itemId: 'garden' }),
    });
    assert([401, 409].includes(foreignRoute.response.status), 'A parent of another family used the city route for this child.');
    cityRouteNote = 'city routes were checked too';
  }

  // The public leaderboard: shared only when the family and the child both agreed, by what was really earned.
  const alias = `Thử ${runId.slice(-6)}`;
  const publicRows = async (mine = null, period = 'daily') => {
    const { data, error } = await anonymous.rpc('get_public_leaderboard', {
      period_key: period, viewer_today: today, mine_child_id: mine, result_limit: 100,
    });
    assert(!error && Array.isArray(data), 'The public leaderboard could not be read.');
    return data;
  };
  const sharingOff = await jsonRequest('/api/privacy/leaderboard-sharing', { headers: first.parent.headers() });
  assert(sharingOff.response.status === 200 && sharingOff.body?.enabled === false, 'Sharing was not off by default.');
  const sharingAnonymous = await jsonRequest('/api/privacy/leaderboard-sharing');
  assert(sharingAnonymous.response.status === 401, 'The sharing setting answered without a session.');
  const childDefault = await admin.from('child_profiles').select('is_public_on_leaderboard').eq('id', first.childId).single();
  assert(!childDefault.error && childDefault.data.is_public_on_leaderboard === false, 'A new child was not private by default.');

  const publicFixtures = await Promise.all([
    admin.from('child_profiles').update({ is_public_on_leaderboard: true, nickname: alias, points: 999 }).eq('id', first.childId),
    admin.from('child_profiles').update({ is_public_on_leaderboard: true, nickname: `${alias} B` }).eq('id', second.childId),
  ]);
  assert(publicFixtures.every(({ error }) => !error), 'Synthetic public fixture failed.');
  const publicActivityId = randomUUID();
  const publicActivity = await admin.from('habit_activities').insert({
    id: publicActivityId, family_id: first.familyId, user_id: first.userId, child_id: first.childId,
    title: `Public board habit ${runId}`, category: 'study', points: 25, requires_approval: false, is_active: true,
  });
  assert(!publicActivity.error, 'Synthetic public activity failed.');
  const publicLog = await admin.from('activity_logs').insert({
    activity_id: publicActivityId, family_id: first.familyId, user_id: first.userId, child_id: first.childId,
    log_date: today, status: 'completed', points_awarded: 25,
  });
  assert(!publicLog.error, 'Synthetic public log failed.');

  assert(!(await publicRows()).some((row) => row.nickname.startsWith(alias)), 'A child appeared before its family chose to share.');

  const sharingOn = await jsonRequest('/api/privacy/leaderboard-sharing', {
    method: 'PUT', headers: first.parent.headers(), body: JSON.stringify({ enabled: true }),
  });
  assert(sharingOn.response.status === 200 && sharingOn.body?.enabled === true, 'The family could not choose to share.');
  const shared = await publicRows(first.childId);
  const own = shared.find((row) => row.nickname === alias);
  assert(own, 'A shared child did not appear on the public board.');
  assert(!shared.some((row) => row.nickname === `${alias} B`), 'A child of a family that did not choose to share appeared.');
  assert(own.points === 25 && own.is_mine === true, 'The public board did not show what was really earned, or did not mark the viewer\'s child.');
  assert(
    JSON.stringify(Object.keys(own).sort()) === JSON.stringify(['avatar', 'is_mine', 'nickname', 'points', 'rank_number', 'streak', 'theme_color', 'tier']),
    'The public board returned fields it must not return.',
  );
  assert(!JSON.stringify(shared).includes('Experience child') && !JSON.stringify(shared).includes(first.childId), 'The public board exposed a real name or an id.');
  assert((await publicRows(second.childId)).find((row) => row.nickname === alias)?.is_mine === false, 'Another family\'s child was marked as the viewer\'s.');
  assert((await publicRows(null, 'weekly')).find((row) => row.nickname === alias)?.points === 25, 'The weekly public board differs from what was earned.');

  const foreignSetter = await second.parent.client.rpc('set_family_public_leaderboard', { target_family_id: first.familyId, enabled: false });
  assert(Boolean(foreignSetter.error) || foreignSetter.data?.status === 'session_invalid', 'A parent of another family changed this family\'s sharing.');
  const anonymousSetter = await anonymous.rpc('set_family_public_leaderboard', { target_family_id: first.familyId, enabled: false });
  assert(Boolean(anonymousSetter.error), 'Anonymous sharing change unexpectedly succeeded.');
  const consent = await admin.from('family_consents').select('revoked_at').eq('family_id', first.familyId).eq('consent_type', 'leaderboard').single();
  assert(!consent.error && consent.data.revoked_at === null, 'The family\'s choice was not recorded as a consent.');

  await admin.from('child_profiles').update({ is_public_on_leaderboard: false }).eq('id', first.childId);
  assert(!(await publicRows()).some((row) => row.nickname === alias), 'A child stayed on the board after being taken off.');
  await admin.from('child_profiles').update({ is_public_on_leaderboard: true }).eq('id', first.childId);
  const sharingRevoked = await jsonRequest('/api/privacy/leaderboard-sharing', {
    method: 'PUT', headers: first.parent.headers(), body: JSON.stringify({ enabled: false }),
  });
  assert(sharingRevoked.response.status === 200 && sharingRevoked.body?.enabled === false, 'The family could not stop sharing.');
  assert(!(await publicRows()).some((row) => row.nickname === alias), 'A child stayed on the board after the family stopped sharing.');
  const consentRevoked = await admin.from('family_consents').select('revoked_at').eq('family_id', first.familyId).eq('consent_type', 'leaderboard').single();
  assert(!consentRevoked.error && consentRevoked.data.revoked_at !== null, 'Stopping to share was not recorded.');

  // Deleting the family removes every row these features created.
  const familyDelete = await jsonRequest('/api/family', {
    method: 'DELETE', headers: first.parent.headers(), body: JSON.stringify({ confirmation: 'DELETE FAMILY' }),
  });
  assert(familyDelete.response.status === 200, 'Owner family deletion failed.');
  const leftovers = await Promise.all([
    admin.from('child_journal_entries').select('child_id', { count: 'exact', head: true }).eq('child_id', first.childId),
    admin.from('child_city_purchases').select('child_id', { count: 'exact', head: true }).eq('child_id', first.childId),
    admin.from('daily_mascot_letters').select('child_id', { count: 'exact', head: true }).eq('child_id', first.childId),
    admin.from('family_consents').select('family_id', { count: 'exact', head: true }).eq('family_id', first.familyId),
  ]);
  assert(leftovers.every(({ error, count }) => !error && count === 0), 'Experience rows survived family deletion.');
  first.familyId = null;

  successMessage = `Live experience verification passed: mascot letter, journal, reminder consent, dream city (${cityRouteNote}) and the public leaderboard.\n`;
} finally {
  await cleanup();
}
process.stdout.write(successMessage);
