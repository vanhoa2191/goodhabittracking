import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

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
const accounts = [
  { email: `aff-referrer-${runId}@example.invalid`, client: createBrowserClient(legacyAnon) },
  { email: `aff-referred-${runId}@example.invalid`, client: createBrowserClient(legacyAnon) },
  { email: `aff-late-${runId}@example.invalid`, client: createBrowserClient(legacyAnon) },
];
const orderCodes = [];
const userIds = [];
const familyIds = [];

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
  // The affiliate tables keep their rows when a user is deleted (they are financial records), so the
  // synthetic ones are removed explicitly, children before parents.
  const referrerId = userIds[0];
  if (referrerId) {
    const referrals = await admin.from('referrals').select('id').eq('referrer_user_id', referrerId);
    const referralIds = (referrals.data ?? []).map((row) => row.id);
    if (referralIds.length > 0) await admin.from('referral_commissions').delete().in('referral_id', referralIds);
    await admin.from('referrals').delete().eq('referrer_user_id', referrerId);
    await admin.from('affiliate_payouts').delete().eq('user_id', referrerId);
  }
  if (orderCodes.length > 0) {
    await admin.from('billing_webhook_events').delete().in('order_code', orderCodes);
    await admin.from('payment_orders').delete().in('order_code', orderCodes);
  }
  await removeSyntheticData(userIds, familyIds);
}

let successMessage = '';
try {
  for (const account of accounts) {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      email_confirm: true,
      user_metadata: { full_name: 'Automated affiliate verification' },
    });
    assert(!error && data.user, 'Synthetic account creation failed.');
    userIds.push(data.user.id);
    const signIn = await signInSyntheticUser(account.client, account.email);
    assert(!signIn.error && signIn.data.user, 'Synthetic account sign-in failed.');
    const membership = await account.client.from('family_memberships').select('family_id').eq('user_id', data.user.id).single();
    assert(!membership.error && membership.data?.family_id, 'Synthetic family bootstrap failed.');
    familyIds.push(membership.data.family_id);
  }
  const [referrer, referred, late] = accounts;

  const settings = await admin.from('affiliate_settings').select('commission_bps,hold_days,min_payout_vnd').single();
  assert(!settings.error && settings.data.commission_bps === 3000, 'The commission must default to 30 percent.');

  // Anonymous callers and plain table reads are refused.
  for (const [name, args] of [['affiliate_enroll', { accept_terms: true }], ['claim_referral', { referral_code: 'AAAAAAAA' }], ['affiliate_overview', {}], ['referral_claim_state', {}]]) {
    const result = await anonymous.rpc(name, args);
    assert(Boolean(result.error), `${name} was callable by an anonymous client.`);
  }
  for (const table of ['affiliate_accounts', 'referrals', 'referral_commissions', 'affiliate_payouts', 'affiliate_settings']) {
    const read = await referrer.client.from(table).select('*').limit(1);
    assert(Boolean(read.error), `${table} was readable by a signed-in client.`);
  }
  for (const [name, args] of [
    ['admin_affiliate_overview', {}],
    ['accrue_referral_commission', { target_order_code: 1 }],
    ['admin_reverse_referral_commission', { target_order_code: 1, reason: 'x' }],
  ]) {
    const result = await referrer.client.rpc(name, args);
    assert(Boolean(result.error), `${name} was callable by a signed-in client.`);
  }

  // Enrolment needs the terms and is idempotent.
  const before = await referrer.client.rpc('affiliate_overview');
  assert(!before.error && before.data.enrolled === false, 'A new parent must not look enrolled.');
  const withoutTerms = await referrer.client.rpc('affiliate_enroll', { accept_terms: false });
  assert(Boolean(withoutTerms.error), 'Enrolment without accepting the terms succeeded.');
  const enrolled = await referrer.client.rpc('affiliate_enroll', { accept_terms: true });
  assert(!enrolled.error && /^[A-HJ-NP-Z2-9]{8}$/.test(enrolled.data), 'Enrolment did not return a code.');
  const code = enrolled.data;
  const again = await referrer.client.rpc('affiliate_enroll', { accept_terms: true });
  assert(again.data === code, 'Enrolling twice must return the same code.');

  // Attribution rules.
  const selfClaim = await referrer.client.rpc('claim_referral', { referral_code: code });
  assert(selfClaim.data === 'self', 'A parent could refer their own family.');
  const wrongCode = await referred.client.rpc('claim_referral', { referral_code: 'ZZZZZZZZ' });
  assert(wrongCode.data === 'invalid', 'An unknown code was accepted.');
  const stateBefore = await referred.client.rpc('referral_claim_state');
  assert(!stateBefore.error && stateBefore.data === 'eligible', 'A new unreferred family must be allowed to enter a code.');
  const claim = await referred.client.rpc('claim_referral', { referral_code: code.toLowerCase() });
  assert(!claim.error && claim.data === 'claimed', 'A new family could not be attributed.');
  const secondClaim = await referred.client.rpc('claim_referral', { referral_code: code });
  assert(secondClaim.data === 'already_referred', 'A family was attributed twice.');
  const stateAfter = await referred.client.rpc('referral_claim_state');
  assert(stateAfter.data === 'referred', 'The family must show as referred after a code was recorded.');
  const oldFamily = await admin.from('families').update({ created_at: new Date(Date.now() - 90 * 86_400_000).toISOString() }).eq('id', familyIds[2]);
  assert(!oldFamily.error, 'Could not age the late family.');
  const lateClaim = await late.client.rpc('claim_referral', { referral_code: code });
  assert(lateClaim.data === 'expired', 'A family outside the attribution window was attributed.');
  const lateState = await late.client.rpc('referral_claim_state');
  assert(lateState.data === 'closed', 'A family outside the attribution window must not be offered the code box.');

  // Paid orders earn 30 percent, once each.
  let orderNumber = Date.now() * 100;
  async function settleOrder(planId, amount) {
    orderNumber += 1;
    const orderCode = orderNumber;
    orderCodes.push(orderCode);
    const description = `AFF ${orderCode}`.slice(0, 25);
    const insert = await admin.from('payment_orders').insert({
      order_code: orderCode, family_id: familyIds[1], user_id: userIds[1], plan_id: planId,
      amount, description, status: 'PENDING', expires_at: new Date(Date.now() + 900_000).toISOString(),
    });
    assert(!insert.error, 'Synthetic order could not be created.');
    const args = {
      incoming_order_code: orderCode, incoming_amount: amount, incoming_description: description,
      incoming_reference: `aff-ref-${orderCode}`, incoming_payment_link_id: '', incoming_payload: { synthetic: true },
    };
    const settled = await admin.rpc('process_payos_webhook', args);
    assert(!settled.error && settled.data === 'activated', `Synthetic payment was not settled (${settled.error?.message ?? settled.data}).`);
    const repeated = await admin.rpc('process_payos_webhook', args);
    assert(repeated.data === 'duplicate', 'A repeated payment notice was processed twice.');
    return orderCode;
  }

  const firstOrder = await settleOrder('yearly', 399000);
  let overview = await referrer.client.rpc('affiliate_overview');
  assert(!overview.error && overview.data.signups === 1 && overview.data.paying === 1, 'The referrer does not see the signup and the paying family.');
  assert(overview.data.amounts.held === 119700 && overview.data.amounts.available === 0, 'A 399,000 order must earn 119,700 and hold it.');
  assert(!JSON.stringify(overview.data).includes(userIds[1]) && !JSON.stringify(overview.data).includes(familyIds[1]), 'The referrer can see who was referred.');
  const commissionCount = await admin.from('referral_commissions').select('id', { count: 'exact', head: true }).eq('order_code', firstOrder);
  assert(commissionCount.count === 1, 'A repeated payment notice earned a second commission.');

  // Payout controls are reachable only through the server (service role) with the user named explicitly,
  // so the parent PIN checked in the route cannot be skipped with the parent's own session.
  const referrerId = userIds[0];
  const requestPayout = () => admin.rpc('request_affiliate_payout', { target_user: referrerId });
  const savePayoutDetails = (details) => admin.rpc('affiliate_save_payout_details', { target_user: referrerId, ...details });
  const direct = await referrer.client.rpc('request_affiliate_payout', { target_user: referrerId });
  assert(Boolean(direct.error), 'A signed-in parent could call the payout request directly.');
  const directSave = await referrer.client.rpc('affiliate_save_payout_details', { target_user: referrerId, bank: 'Vietcombank', account_number: '0123456789', account_name: 'Nguyen Van Test' });
  assert(Boolean(directSave.error), 'A signed-in parent could change payout details directly.');
  const oldRequest = await referrer.client.rpc('request_affiliate_payout');
  assert(Boolean(oldRequest.error), 'The old payout request function is still reachable.');

  // Nothing can be requested while the hold lasts or details are missing, or below the minimum.
  const early = await requestPayout();
  assert(early.data?.status === 'missing_details', 'A payout was possible without payout details.');
  const badDetails = await savePayoutDetails({ bank: 'X', account_number: '1', account_name: '' });
  assert(badDetails.data?.status === 'invalid_details', 'Invalid payout details were accepted.');
  const saved = await savePayoutDetails({ bank: 'Vietcombank', account_number: '0123456789', account_name: 'Nguyen Van Test' });
  assert(saved.data?.status === 'saved', 'Payout details could not be saved.');
  // A bank account changed in the last day cannot receive a payout yet, whatever is owed.
  const tooSoon = await requestPayout();
  assert(tooSoon.data?.status === 'details_recent', 'A payout was possible right after the bank details changed.');
  const ageDetails = () => admin.from('affiliate_accounts').update({ payout_details_changed_at: new Date(Date.now() - 2 * 86_400_000).toISOString() }).eq('user_id', referrerId);
  const aged = await ageDetails();
  assert(!aged.error, 'Could not age the payout details change.');
  const stillHeld = await requestPayout();
  assert(stillHeld.data?.status === 'below_minimum' && stillHeld.data.available === 0, 'A commission inside the hold was paid out.');

  const secondOrder = await settleOrder('yearly', 399000);
  const refundedOrder = await settleOrder('monthly', 49000);
  const reversed = await admin.rpc('admin_reverse_referral_commission', { target_order_code: refundedOrder, reason: 'Synthetic refund' });
  assert(reversed.data === 'reversed', 'A held commission could not be reversed after a refund.');
  const reversedAgain = await admin.rpc('admin_reverse_referral_commission', { target_order_code: refundedOrder, reason: 'Synthetic refund' });
  assert(reversedAgain.data === 'already_reversed', 'A commission was reversed twice.');

  const release = await admin.from('referral_commissions').update({ available_at: new Date(Date.now() - 86_400_000).toISOString() }).in('order_code', [firstOrder, secondOrder]);
  assert(!release.error, 'Could not release the held commissions.');
  overview = await referrer.client.rpc('affiliate_overview');
  assert(overview.data.amounts.available === 239400 && overview.data.amounts.held === 0, 'Released commissions are not available (reversed ones must not count).');

  const requested = await requestPayout();
  assert(requested.data?.status === 'requested' && requested.data.amount === 239400, 'The payout was not requested for the available amount.');
  const second = await requestPayout();
  assert(second.data?.status === 'below_minimum', 'The same commissions were requested twice.');

  // Admin side.
  const adminView = await admin.rpc('admin_affiliate_overview');
  const payout = (adminView.data?.payouts ?? []).find((entry) => entry.amount === 239400 && entry.accountNumber === '0123456789');
  assert(!adminView.error && payout, 'The admin cannot see the payout request.');
  const inPayout = await admin.rpc('admin_reverse_referral_commission', { target_order_code: firstOrder, reason: 'Synthetic' });
  assert(inPayout.data === 'in_payout', 'A commission inside a payout request was reversed.');
  // One admin handles a payout at a time: it must be claimed before it is paid, and nobody else can touch it meanwhile.
  const unclaimedPaid = await admin.rpc('admin_resolve_affiliate_payout', {
    target_payout_id: payout.id, resolution: 'paid', admin_user: userIds[0], payout_reference: 'SYNTHETIC-UNCLAIMED', payout_note: '',
  });
  assert(unclaimedPaid.data === 'claim_required', 'A payout was marked paid without being claimed first.');
  const firstClaim = await admin.rpc('admin_claim_affiliate_payout', { target_payout_id: payout.id, admin_user: userIds[0] });
  assert(firstClaim.data === 'claimed', 'An admin could not claim a waiting payout.');
  const secondClaim2 = await admin.rpc('admin_claim_affiliate_payout', { target_payout_id: payout.id, admin_user: userIds[1] });
  assert(secondClaim2.data === 'taken', 'A second admin claimed a payout somebody else is handling.');
  const otherPaid = await admin.rpc('admin_resolve_affiliate_payout', {
    target_payout_id: payout.id, resolution: 'paid', admin_user: userIds[1], payout_reference: 'SYNTHETIC-OTHER', payout_note: '',
  });
  assert(otherPaid.data === 'claimed_by_other', 'A second admin paid a payout somebody else is handling.');
  const otherReject = await admin.rpc('admin_resolve_affiliate_payout', {
    target_payout_id: payout.id, resolution: 'rejected', admin_user: userIds[1], payout_reference: '', payout_note: '',
  });
  assert(otherReject.data === 'claimed_by_other', 'A second admin rejected a payout somebody else is handling.');
  const noReference = await admin.rpc('admin_resolve_affiliate_payout', {
    target_payout_id: payout.id, resolution: 'paid', admin_user: userIds[0], payout_reference: '', payout_note: '',
  });
  assert(noReference.data === 'reference_required', 'A payout was marked paid without a bank reference.');
  // A payout whose commissions no longer add up to its amount cannot be marked paid.
  const inflate = await admin.from('affiliate_payouts').update({ amount: 239401 }).eq('id', payout.id);
  assert(!inflate.error, 'Could not inflate the payout for the mismatch check.');
  const mismatch = await admin.rpc('admin_resolve_affiliate_payout', {
    target_payout_id: payout.id, resolution: 'paid', admin_user: userIds[0], payout_reference: 'SYNTHETIC-MISMATCH', payout_note: '',
  });
  assert(mismatch.data === 'amount_mismatch', 'A payout larger than its commissions was marked paid.');
  const restore = await admin.from('affiliate_payouts').update({ amount: 239400 }).eq('id', payout.id);
  assert(!restore.error, 'Could not restore the payout amount.');
  const rejected = await admin.rpc('admin_resolve_affiliate_payout', {
    target_payout_id: payout.id, resolution: 'rejected', admin_user: userIds[0], payout_reference: '', payout_note: 'Synthetic rejection',
  });
  assert(rejected.data === 'rejected', 'The payout could not be rejected.');
  overview = await referrer.client.rpc('affiliate_overview');
  assert(overview.data.amounts.available === 239400 && overview.data.amounts.requested === 0, 'A rejected payout did not return the commissions.');
  const again2 = await requestPayout();
  assert(again2.data?.status === 'requested', 'The commissions could not be requested again after a rejection.');
  const newView = await admin.rpc('admin_affiliate_overview');
  const secondPayout = (newView.data?.payouts ?? []).find((entry) => entry.status === 'requested');
  const secondClaimed = await admin.rpc('admin_claim_affiliate_payout', { target_payout_id: secondPayout.id, admin_user: userIds[0] });
  assert(secondClaimed.data === 'claimed', 'The second payout could not be claimed.');
  const paid = await admin.rpc('admin_resolve_affiliate_payout', {
    target_payout_id: secondPayout.id, resolution: 'paid', admin_user: userIds[0], payout_reference: 'SYNTHETIC-FT', payout_note: '',
  });
  assert(paid.data === 'paid', 'The payout could not be marked paid.');
  const resolvedTwice = await admin.rpc('admin_resolve_affiliate_payout', {
    target_payout_id: secondPayout.id, resolution: 'paid', admin_user: userIds[0], payout_reference: 'AGAIN', payout_note: '',
  });
  assert(resolvedTwice.data === 'already_resolved', 'A payout was resolved twice.');
  overview = await referrer.client.rpc('affiliate_overview');
  assert(overview.data.amounts.paid === 239400 && overview.data.amounts.available === 0, 'A paid payout is not reflected for the referrer.');
  assert(overview.data.payout.accountLast4 === '6789' && !JSON.stringify(overview.data).includes('0123456789'), 'The full account number reached the client.');
  const paidReverse = await admin.rpc('admin_reverse_referral_commission', { target_order_code: secondOrder, reason: 'Synthetic' });
  assert(paidReverse.data === 'already_paid', 'A paid commission was reversed silently.');

  // The referred family sees nothing of the programme.
  const referredView = await referred.client.rpc('affiliate_overview');
  assert(referredView.data?.enrolled === false, 'The referred family looks enrolled.');

  successMessage = 'Live affiliate verification passed: enrolment, attribution rules, 30 percent commission once per paid order, hold, reversal, payout controls reachable only by the server, 24-hour bank-change hold, payout request, one-admin claim, amount check, admin resolution and privacy.\n';
} finally {
  await cleanup();
}
process.stdout.write(successMessage);
