import { pairedChild } from './ui-audit-child-fixture';
import { expect, test } from '@playwright/test';
import { defaultCloudActivity, installCloudFamilyFixture, cloudFamilyIds } from './cloud-family-fixture';
import { enterDemoKid, enterParentApprovals, usableBand, taskTitleAndToggleBoxes } from './ui-audit-fixture';

/*
 * Phase 00 regression tests for the UI audit (plan.md coverage matrix), strengthened in
 * Phase 01 to the truthful parent-safety contract (see phase-01-parent-safety.md and the
 * coordinator decisions).
 *
 * Owned files (Kilo): tests/e2e/ui-audit-regression.spec.ts,
 * tests/e2e/ui-audit-fixture.ts, minimal extensions to tests/e2e/cloud-family-fixture.ts.
 *
 * No UI/store changes are made here. Cases that describe the truthful A04
 * contract or the all-family A02 heading may fail against the current build
 * (void async actions, flag-gated batch UI); those are documented below as
 * expected future-bug gaps, not weakened assertions.
 *
 * Run against the coordinator baseline server:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3107 rtk npx playwright test tests/e2e/ui-audit-regression.spec.ts --project=chromium
 */

const today = '2026-09-21';
const familyId = cloudFamilyIds.family;

// All ids are UUIDs and all row fields are snake_case to match the Supabase row schemas
// that cloud-family-sync parses (mappers.ts). cloud-family-fixture echoes these rows through
// **/rest/v1/** without further transformation.
const twoChildCloud = {
  profiles: [
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', family_id: familyId, name: 'Bé An', nickname: 'Bé An', show_real_name_on_leaderboard: false, is_public_on_leaderboard: true, avatar: 'mascot:leo', theme_color: '#F59E0B', points: 85, total_earned: 145, level: 2, streak: 4, birth_year: 2018, age_stage: '6-12', age: 8, created_at: today },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', family_id: familyId, name: 'Bé Chi', nickname: 'Bé Chi', show_real_name_on_leaderboard: false, is_public_on_leaderboard: true, avatar: 'mascot:bunny', theme_color: '#10B981', points: 45, total_earned: 65, level: 1, streak: 2, birth_year: 2022, age_stage: '3-6', age: 4, created_at: today },
  ],
  activities: [
    { ...defaultCloudActivity, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', family_id: familyId, child_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Đánh răng sáng của Bé An', points: 10, requires_approval: false },
    { ...defaultCloudActivity, id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', family_id: familyId, child_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'Đánh răng sáng của Bé Chi', points: 10, requires_approval: true },
  ],
  logs: [
    { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', family_id: familyId, activity_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', child_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', log_date: today, status: 'pending_approval', points_awarded: 10, completed_at: `${today}T07:00:00.000Z` },
    { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', family_id: familyId, activity_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', child_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', log_date: today, status: 'pending_approval', points_awarded: 10, completed_at: `${today}T07:30:00.000Z` },
  ],
  rewards: [
    { id: '11111111-1111-4111-8111-111111111111', family_id: familyId, title: 'Xem phim 30 phút', description: '', icon: '🎬', cost_points: 50, stock: 5, is_active: true, created_at: today },
  ],
  redemptions: [
    { id: '22222222-2222-4222-8222-222222222222', family_id: familyId, reward_id: '11111111-1111-4111-8111-111111111111', child_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', points_spent: 50, status: 'pending', requested_at: `${today}T08:00:00.000Z` },
    { id: '66666666-6666-4666-8666-666666666666', family_id: familyId, reward_id: '11111111-1111-4111-8111-111111111111', child_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', points_spent: 50, status: 'pending', requested_at: `${today}T08:10:00.000Z` },
  ],
};

const redemptionAn = twoChildCloud.redemptions[0].id;

test.describe('A01 — child task + primary button inside usable 375×812 viewport', () => {
  test('real paired child title and primary action fit without scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await pairedChild(page);
    const { top, bottom } = await usableBand(page);
    const boxes = await taskTitleAndToggleBoxes(page);
    expect(boxes.title).not.toBeNull();
    expect(boxes.toggle).not.toBeNull();
    for (const box of [boxes.title!, boxes.toggle!]) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
      expect(box.y).toBeGreaterThanOrEqual(top);
      expect(box.y + box.height).toBeLessThanOrEqual(bottom);
    }
  });
  test('task name and mark toggle stay inside the usable band between header and bottom nav (demo)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await enterDemoKid(page);

    const { top, bottom } = await usableBand(page);
    const boxes = await taskTitleAndToggleBoxes(page);

    if (boxes.title && boxes.toggle) {
      for (const box of [boxes.title, boxes.toggle]) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(375);
        expect(box.y).toBeGreaterThanOrEqual(top);
        expect(box.y + box.height).toBeLessThanOrEqual(bottom);
      }
    } else {
      // Empty state: an explanatory CTA is shown instead of asserting a task exists.
      await expect(page.getByRole('button', { name: /Quản lý việc|Tạo hoạt động/i })).toBeVisible();
    }
  });
});

test.describe('A02 — all-family scope labels (parent approvals)', () => {
  test('two children each with a pending task and reward appear in the all-family queue with an explicit scope label', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);

    // All-family scope: the queue spans both children, not just the first profile.
    const pendingTasks = page.getByRole('heading', { name: /Nhiệm vụ chờ bố mẹ duyệt|Tasks awaiting parent approval/ });
    await expect(pendingTasks).toBeVisible();
    await expect(pendingTasks).toContainText(/\(2\)/);
    // Explicit all-family wording on the queue heading (D03), not only per-row child names.
    await expect(pendingTasks).toContainText(/tất cả bé|all children/);

    // Each pending row carries the child name so scope is never ambiguous.
    await expect(page.locator('#pending-tasks').getByText('Bé An', { exact: true }).first()).toBeVisible();
    await expect(page.locator('#pending-tasks').getByText('Bé Chi', { exact: true }).first()).toBeVisible();

    // Pending reward queue carries both requests, its own all-family label, and child names.
    const pendingRewards = page.locator('#pending-rewards');
    const rewardsHeading = pendingRewards.getByRole('heading', { name: /Yêu cầu đổi quà từ các con|Reward requests from children/ });
    await expect(rewardsHeading).toBeVisible();
    await expect(rewardsHeading).toContainText(/\(2\)/);
    await expect(rewardsHeading).toContainText(/tất cả bé|all children/);
    await expect(pendingRewards.getByText('Bé An', { exact: true }).first()).toBeVisible();
    await expect(pendingRewards.getByText('Bé Chi', { exact: true }).first()).toBeVisible();
  });

  test('the child selector changes only the summary card, never the all-family queues', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);

    // The selector is an overview switch with an explicit accessible name (D03), not a queue filter.
    const chips = page.getByRole('group', { name: /Xem tổng quan của bé|View .*child.*overview/ });
    await expect(chips.getByRole('button')).toHaveCount(2);

    const todayCard = page.getByTestId('parent-today-card');
    await expect(todayCard).toContainText('Hôm nay của Bé An');

    const taskHeading = page.getByRole('heading', { name: /Nhiệm vụ chờ bố mẹ duyệt|Tasks awaiting parent approval/ });
    const rewardsHeading = page.locator('#pending-rewards').getByRole('heading', { name: /Yêu cầu đổi quà từ các con|Reward requests from children/ });
    await expect(taskHeading).toContainText(/\(2\)/);
    await expect(rewardsHeading).toContainText(/\(2\)/);

    await chips.getByRole('button', { name: 'Bé Chi' }).click();
    await expect(todayCard).toContainText('Hôm nay của Bé Chi');
    await expect(chips.getByRole('button', { name: 'Bé Chi' })).toHaveAttribute('aria-pressed', 'true');

    // Summary switched; both queues still show the whole family.
    await expect(taskHeading).toContainText(/\(2\)/);
    await expect(taskHeading).toContainText(/tất cả bé|all children/);
    await expect(rewardsHeading).toContainText(/\(2\)/);
    await expect(page.locator('#pending-tasks').getByText('Bé An', { exact: true }).first()).toBeVisible();
    await expect(page.locator('#pending-tasks').getByText('Bé Chi', { exact: true }).first()).toBeVisible();
  });

  test('batch summary lists the correct children and the all-family scope when the whole queue is selected', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);

    // The batch surface must exist on this build; silently returning would hide a missing feature.
    const selectAll = page.getByTestId('bulk-select-all');
    await expect(selectAll).toBeVisible();

    await selectAll.click();
    const summary = page.getByTestId('bulk-selection-summary');
    await expect(summary).toContainText('Bé An');
    await expect(summary).toContainText('Bé Chi');
    await expect(summary).toContainText(/tất cả bé|all children/);
  });
});

/**
 * A controllable, stateful mock of /api/domain/commands plus — when row data is passed — the
 * activity_logs / redemptions REST tables those commands mutate, so a successful reload after a
 * command shows the same truth the command reported. The mode can be switched at any time via
 * setMode without re-registering the route, so a single request is never counted twice.
 *
 * Routes must be installed AFTER installCloudFamilyFixture: Playwright matches the most recently
 * registered route first, so these tables win over the fixture's static catch-all.
 */
type CommandCall = { type: string; logId?: string; logIds?: string[]; redemptionId?: string; decision?: string };
type CommandMode = 'ok' | 'fail' | 'slow' | 'deliver-fail' | 'partial' | 'commit-lost' | 'pin' | 'missing-results' | 'wrong-status';

type StatefulRows = {
  readonly logRows?: readonly Record<string, unknown>[];
  readonly redemptionRows?: readonly Record<string, unknown>[];
};

async function installDomainCommandMock(page: import('@playwright/test').Page, rows: StatefulRows = {}): Promise<{
  readonly calls: CommandCall[];
  readonly setMode: (mode: CommandMode, delayMs?: number) => void;
  readonly setRefreshAvailable: (available: boolean) => void;
}> {
  const calls: CommandCall[] = [];
  let mode: CommandMode = 'ok';
  let delayMs = 0;
  let refreshAvailable = true;
  await page.route('**/rest/v1/**/child_profiles**', (route) => refreshAvailable ? route.fallback() : route.fulfill({
    status: 503, contentType: 'application/json', headers: { 'retry-after': '0' }, body: JSON.stringify({ message: 'snapshot unavailable' }),
  }));
  const logRows = (rows.logRows ?? []).map((row) => ({ ...row }));
  const redemptionRows = (rows.redemptionRows ?? []).map((row) => ({ ...row }));

  if (rows.logRows) {
    await page.route('**/rest/v1/**/activity_logs**', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(logRows),
    }));
  }
  if (rows.redemptionRows) {
    await page.route('**/rest/v1/**/redemptions**', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(redemptionRows),
    }));
  }

  await page.route('**/api/domain/commands', async (route) => {
    const body = (await route.request().postDataJSON()) as { type: string; logId?: string; logIds?: string[]; redemptionId?: string; decision?: string };
    calls.push(body);
    const m = mode;
    const d = delayMs;
    if (m === 'slow') await new Promise((resolve) => setTimeout(resolve, d));
    const deliveryRefused = m === 'deliver-fail' && body.type === 'transitionRedemption' && body.decision === 'deliver';
    if (m === 'fail' || deliveryRefused) {
      await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'RPC refused' }) });
      return;
    }
    if (m === 'pin') {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Parent PIN required.', code: 'parent_pin_required' }) });
      return;
    }
    if (body.type === 'reviewHabits') {
      if (m === 'missing-results' || m === 'wrong-status') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, result: m === 'missing-results'
          ? { status: 'reviewed' }
          : { status: 'completed', results: (body.logIds ?? []).map((logId) => ({ logId, status: 'approved' })) } }) });
        return;
      }
      const answeredIds = m === 'partial' ? (body.logIds ?? []).slice(0, 1) : (body.logIds ?? []);
      for (const row of logRows) if (answeredIds.includes(String(row.id))) row.status = body.decision === 'reject' ? 'rejected' : 'approved';
      if (m === 'commit-lost') { await route.abort('connectionreset'); return; }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, result: { status: 'reviewed', results: answeredIds.map((id) => ({ logId: id, status: body.decision === 'reject' ? 'rejected' : 'approved', pointsAwarded: body.decision === 'reject' ? 0 : 10 })) } }),
      });
      return;
    }
    if (body.type === 'reviewHabit') {
      for (const row of logRows) if (row.id === body.logId) row.status = 'approved';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, result: { status: 'approved', logId: body.logId, pointsAwarded: 10 } }) });
      return;
    }
    if (body.type === 'transitionRedemption') {
      const next = body.decision === 'approve' ? 'approved' : body.decision === 'deliver' ? 'delivered' : 'rejected';
      for (const row of redemptionRows) if (row.id === body.redemptionId) row.status = next;
      if (m === 'commit-lost') { await route.abort('connectionreset'); return; }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, result: { status: next, redemptionId: body.redemptionId } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, result: { status: 'completed' } }) });
  });
  return { calls, setRefreshAvailable: (available) => { refreshAvailable = available; }, setMode: (m: CommandMode, d = 0) => { mode = m; delayMs = d; } };
}

test.describe('A04 — truthful slow / fail / retry approval and reward outcomes', () => {
  test('bulk task approval disables while busy, sends one request with correct payload, reports failure without faking success, and recovers on retry', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);

    const taskHeading = page.getByRole('heading', { name: /Nhiệm vụ chờ bố mẹ duyệt|Tasks awaiting parent approval/ });
    await expect(taskHeading).toContainText(/\(2\)/);

    // Select Bé An's pending task row so the batch approve is enabled.
    await page.getByRole('checkbox', { name: 'Chọn “Đánh răng sáng của Bé An” của Bé An' }).check();
    await expect(page.getByTestId('bulk-approve')).not.toBeDisabled();

    const { calls, setMode } = await installDomainCommandMock(page, { logRows: twoChildCloud.logs, redemptionRows: twoChildCloud.redemptions });
    setMode('fail');
    await page.getByTestId('bulk-approve').click();

    // Request contract (runnable evidence): exactly one reviewHabits command for the selected row.
    expect(calls.length).toBe(1);
    expect(calls[0].type).toBe('reviewHabits');
    expect(calls[0].logIds).toEqual(['eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee']);

    // Truthful contract: a failed server response is reported (alert) and never fakes a success status.
    await expect(page.getByTestId('bulk-result')).toHaveText(/Chưa lưu được|Could not save/);
    await expect(page.getByTestId('bulk-result')).toHaveAttribute('role', 'alert');

    // Failure keeps both the rows and the selection so an explicit retry needs no rework.
    await expect(page.getByRole('checkbox', { name: 'Chọn “Đánh răng sáng của Bé An” của Bé An' })).toBeChecked();
    await expect(taskHeading).toContainText(/\(2\)/);

    // Retry after failure succeeds authoritatively; only the reviewed row leaves the queue.
    setMode('ok');
    await page.getByTestId('bulk-approve').click();
    await expect(page.getByTestId('bulk-result')).toHaveText(/Đã duyệt|Approved/);
    await expect(page.getByTestId('bulk-result')).toHaveAttribute('role', 'status');
    expect(calls.length).toBe(2);
    await expect(taskHeading).toContainText(/\(1\)/);
    await expect(page.locator('#pending-tasks').getByText('Bé Chi', { exact: true }).first()).toBeVisible();
    await expect(page.locator('#pending-tasks').getByText('Đánh răng sáng của Bé An', { exact: true })).toHaveCount(0);
    await expect(page.locator('#pending-tasks')).toBeFocused();
  });

  test('task approval keeps the batch button disabled while in flight and issues exactly one request', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);

    await page.getByRole('checkbox', { name: 'Chọn “Đánh răng sáng của Bé An” của Bé An' }).check();
    const { calls, setMode } = await installDomainCommandMock(page, { logRows: twoChildCloud.logs, redemptionRows: twoChildCloud.redemptions });
    setMode('slow', 400);
    const approve = page.getByTestId('bulk-approve');
    await expect(approve).not.toBeDisabled();
    await approve.click();
    // While the review is in flight the button is disabled (busy guard).
    await expect(approve).toBeDisabled();
    expect(calls.length).toBe(1);
    await expect(page.getByTestId('bulk-result')).toHaveText(/Đã duyệt|Approved/);
    // No duplicate request from the single click.
    expect(calls.length).toBe(1);
  });

  test('a double click on batch approve issues exactly one review request, not two', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);

    await page.getByRole('checkbox', { name: 'Chọn “Đánh răng sáng của Bé An” của Bé An' }).check();
    const { calls, setMode } = await installDomainCommandMock(page, { logRows: twoChildCloud.logs, redemptionRows: twoChildCloud.redemptions });
    setMode('slow', 300);
    const approve = page.getByTestId('bulk-approve');
    await expect(approve).not.toBeDisabled();
    await approve.dblclick();
    await expect(page.getByTestId('bulk-result')).toHaveText(/Đã duyệt|Approved/);
    expect(calls.length).toBe(1);
    expect(calls[0].logIds).toEqual(['eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee']);
  });

  test('reward delivery keeps the row honest: acknowledge, report the failed deliver, retry with only the remaining command', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);

    const rewardsHeading = page.locator('#pending-rewards').getByRole('heading', { name: /Yêu cầu đổi quà từ các con|Reward requests from children/ });
    await expect(rewardsHeading).toBeVisible();

    const { calls, setMode } = await installDomainCommandMock(page, { logRows: twoChildCloud.logs, redemptionRows: twoChildCloud.redemptions });
    setMode('deliver-fail');
    const row = page.getByTestId(`redemption-row-${redemptionAn}`);
    const deliver = row.getByRole('button', { name: 'Đã trao quà', exact: true });
    await expect(deliver).toBeVisible();
    await deliver.click();

    // The approve command was acknowledged and the deliver command failed: exactly two requests,
    // an error report, and the row recovered as approved-but-not-delivered — never as delivered.
    await expect(page.getByTestId('reward-result')).toHaveText(/Chưa trao được quà|could not be handed over/i);
    expect(calls.map((call) => call.decision)).toEqual(['approve', 'deliver']);
    await expect(page.getByTestId('reward-result')).toHaveAttribute('role', 'alert');
    await expect(page.getByTestId('redemption-awaiting')).toBeVisible();
    await expect(row).toBeVisible();
    await expect(rewardsHeading).toContainText(/\(2\)/);

    // Retry sends only the remaining deliver command: no second approve replay.
    setMode('ok');
    await deliver.click();
    await expect(page.getByTestId('reward-result')).toHaveText(/Đã trao quà\.|Gift handed over\./);
    await expect(page.getByTestId('reward-result')).toHaveAttribute('role', 'status');
    expect(calls.map((call) => call.decision)).toEqual(['approve', 'deliver', 'deliver']);
    expect(calls.filter((call) => call.decision === 'approve')).toHaveLength(1);
    await expect(row).toHaveCount(0);
    await expect(rewardsHeading).toContainText(/\(1\)/);
    await expect(page.locator('#pending-rewards')).toBeFocused();
  });

  test('a double click on deliver issues one approve and deliver pair, not two', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);

    const { calls } = await installDomainCommandMock(page, { logRows: twoChildCloud.logs, redemptionRows: twoChildCloud.redemptions });
    const row = page.getByTestId(`redemption-row-${redemptionAn}`);
    const deliver = row.getByRole('button', { name: 'Đã trao quà', exact: true });
    await expect(deliver).toBeVisible();
    await deliver.dblclick();

    await expect(page.getByTestId('reward-result')).toHaveText(/Đã trao quà\.|Gift handed over\./);
    expect(calls.map((call) => `${call.type}:${call.decision}`)).toEqual([
      'transitionRedemption:approve',
      'transitionRedemption:deliver',
    ]);
    await expect(row).toHaveCount(0);
  });

  test('deliver success with a failed reload reports stale truth without replaying the delivery', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);
    const { calls } = await installDomainCommandMock(page, { logRows: twoChildCloud.logs, redemptionRows: twoChildCloud.redemptions });

    // The reload fails from here on, while the initial data load above already succeeded.
    let reloaded = 0;
    await page.route('**/rest/v1/**/child_profiles**', (route) => {
      reloaded += 1;
      return route.fulfill({ status: 503, contentType: 'application/json', headers: { 'retry-after': '0' }, body: JSON.stringify({ message: 'reload unavailable' }) });
    });

    const row = page.getByTestId(`redemption-row-${redemptionAn}`);
    const deliver = row.getByRole('button', { name: 'Đã trao quà', exact: true });
    await deliver.click();

    // One approve + one deliver were acknowledged; the reload failed, so the UI says the fresh
    // data is missing and offers a refresh — it never claims an up-to-date state and never
    // repeats the delivery commands. The reload retries the failing table a few times first, so
    // this waits longer than the default.
    await expect(page.getByTestId('reward-result')).toHaveText(/chưa tải lại được dữ liệu mới|fresh data has not loaded/i, { timeout: 15000 });
    await expect(page.getByTestId('reward-result')).toHaveAttribute('role', 'status');
    expect(calls.map((call) => call.decision)).toEqual(['approve', 'deliver']);

    const refresh = page.getByTestId('reward-refresh');
    await expect(refresh).toBeVisible();
    await refresh.click();
    await expect.poll(() => reloaded).toBeGreaterThan(0);
    // Refresh only reloads; the acknowledged delivery is not sent again.
    expect(calls.map((call) => call.decision)).toEqual(['approve', 'deliver']);
  });
});


test.describe('A04 parent reconciliation safety', () => {
  test.setTimeout(90_000);
  for (const mode of ['missing-results', 'wrong-status'] as const) {
    test(`${mode} reconciles without claiming approval or clearing unresolved selection`, async ({ page, baseURL }) => {
      await installCloudFamilyFixture(page, baseURL, twoChildCloud);
      await enterParentApprovals(page);
      const mock = await installDomainCommandMock(page, { logRows: twoChildCloud.logs });
      mock.setMode(mode);
      await page.getByTestId('bulk-select-all').click();
      await page.getByTestId('bulk-approve').click();
      await expect(page.getByTestId('bulk-result')).toContainText('Chưa xác nhận');
      await expect(page.getByTestId('bulk-result')).not.toContainText('Đã duyệt');
      const boxes = page.locator('#pending-tasks input[type=checkbox]');
      await expect(boxes).toHaveCount(2);
      await expect(boxes.nth(0)).toBeChecked();
      await expect(boxes.nth(1)).toBeChecked();
      // A successful authoritative reconciliation permits an explicit retry; it sends nothing itself.
      await expect(page.getByTestId('bulk-approve')).toBeEnabled();
      expect(mock.calls).toHaveLength(1);
      mock.setMode('ok');
      await boxes.nth(0).uncheck();
      await page.getByTestId('bulk-approve').click();
      await expect(boxes).toHaveCount(1);
      expect(mock.calls.map((call) => call.logIds)).toEqual([twoChildCloud.logs.map((log) => log.id), [twoChildCloud.logs[1].id]]);
    });
  }

  test('partial batch preserves unresolved selection and gates stale IDs through repeated refresh failures', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);
    const mock = await installDomainCommandMock(page, { logRows: twoChildCloud.logs });
    mock.setMode('partial'); mock.setRefreshAvailable(false);
    await page.getByTestId('bulk-select-all').click();
    await page.getByTestId('bulk-approve').click();
    await expect(page.getByTestId('bulk-result')).toContainText('Chưa tải lại', { timeout: 15000 });
    const boxes = page.locator('#pending-tasks input[type=checkbox]');
    await expect(boxes.nth(0)).not.toBeChecked();
    await expect(boxes.nth(1)).toBeChecked();
    await expect(page.getByTestId('bulk-approve')).toBeDisabled();
    await expect(page.getByTestId('bulk-reject')).toBeDisabled();
    await page.getByTestId('bulk-refresh').click();
    await expect(page.getByTestId('bulk-refresh')).toBeEnabled({ timeout: 15000 });
    await expect(page.getByTestId('bulk-approve')).toBeDisabled();
    expect(mock.calls).toHaveLength(1);
    mock.setRefreshAvailable(true); mock.setMode('ok');
    await page.getByTestId('bulk-refresh').click();
    await expect(page.getByTestId('bulk-approve')).toBeEnabled();
    await expect(boxes).toHaveCount(1);
    await expect(boxes.first()).toBeChecked();
    await page.getByTestId('bulk-approve').click();
    await expect(boxes).toHaveCount(0);
    expect(mock.calls.map((call) => call.logIds)).toEqual([twoChildCloud.logs.map((log) => log.id), [twoChildCloud.logs[1].id]]);
  });

  test('committed batch with lost response reconciles before retry and never replays old selection', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);
    const mock = await installDomainCommandMock(page, { logRows: twoChildCloud.logs });
    mock.setMode('commit-lost'); mock.setRefreshAvailable(false);
    await page.getByTestId('bulk-select-all').click();
    await page.getByTestId('bulk-approve').click();
    await expect(page.getByTestId('bulk-refresh')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('bulk-approve')).toBeDisabled();
    await expect(page.getByTestId('bulk-reject')).toBeDisabled();
    expect(mock.calls).toHaveLength(1);
    mock.setRefreshAvailable(true);
    await page.getByTestId('bulk-refresh').click();
    await expect(page.locator('#pending-tasks input[type=checkbox]')).toHaveCount(0);
    expect(mock.calls).toHaveLength(1);
  });

  test('acknowledged stale task rows cannot receive an opposite command and refresh never replays', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);
    const mock = await installDomainCommandMock(page, { logRows: twoChildCloud.logs });
    mock.setRefreshAvailable(false);
    await page.getByTestId('bulk-select-all').click();
    await page.getByTestId('bulk-approve').click();
    await expect(page.getByTestId('bulk-refresh')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#pending-tasks input[type=checkbox]').first()).toBeDisabled();
    await page.getByTestId('bulk-select-all').click();
    await expect(page.getByTestId('bulk-reject')).toBeDisabled();
    expect(mock.calls).toHaveLength(1);
    mock.setRefreshAvailable(true);
    await page.getByTestId('bulk-refresh').click();
    await expect(page.locator('#pending-tasks input[type=checkbox]')).toHaveCount(0);
    expect(mock.calls).toHaveLength(1);
  });

  test('lost committed reward answer stays unknown and cannot replay or reject until authoritative refresh', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);
    const mock = await installDomainCommandMock(page, { redemptionRows: twoChildCloud.redemptions });
    mock.setMode('commit-lost'); mock.setRefreshAvailable(false);
    const row = page.getByTestId(`redemption-row-${redemptionAn}`);
    const deliver = row.getByRole('button', { name: 'Đã trao quà', exact: true });
    await deliver.click();
    await expect(page.getByTestId('reward-refresh')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('reward-result')).not.toContainText('Đã duyệt, chờ');
    await expect(deliver).toBeDisabled();
    await expect(row.getByRole('button', { name: 'Từ chối', exact: true })).toBeDisabled();
    await page.getByTestId('reward-refresh').click();
    await expect(page.getByTestId('reward-refresh')).toBeEnabled({ timeout: 15000 });
    await expect(deliver).toBeDisabled();
    expect(mock.calls.map((call) => call.decision)).toEqual(['approve']);
    // Queue remount cannot discard the safety gate or its refresh-only recovery.
    await page.getByRole('tab', { name: 'Thống kê', exact: true }).click();
    await page.getByRole('tab', { name: /^Duyệt việc/ }).click();
    await expect(deliver).toBeDisabled();
    await expect(page.getByTestId('reward-refresh')).toBeVisible();
    expect(mock.calls).toHaveLength(1);
    mock.setRefreshAvailable(true); mock.setMode('ok');
    await page.getByTestId('reward-refresh').click();
    await expect(deliver).toBeEnabled();
    await expect(row.getByTestId('redemption-awaiting')).toBeVisible();
    await deliver.click();
    await expect(row).toHaveCount(0);
    expect(mock.calls.map((call) => call.decision)).toEqual(['approve', 'deliver']);
  });

  test('real403 parent_pin_required preserves selection and unlock requires an explicit mutation retry', async ({ page, baseURL }) => {
    await installCloudFamilyFixture(page, baseURL, twoChildCloud);
    await enterParentApprovals(page);
    await page.route('**/api/parent-pin', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(route.request().method() === 'GET'
        ? { configured: true, lockedUntil: null } : { status: 'verified' }) });
    });
    const mock = await installDomainCommandMock(page, { logRows: twoChildCloud.logs });
    mock.setMode('pin');
    await page.getByTestId('bulk-select-all').click();
    await page.getByTestId('bulk-approve').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(mock.calls).toHaveLength(1);
    for (const digit of ['1', '2', '3', '4']) await dialog.getByRole('button', { name: digit, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#pending-tasks input[type=checkbox]').first()).toBeChecked();
    expect(mock.calls).toHaveLength(1);
    mock.setMode('ok');
    await page.getByTestId('bulk-approve').click();
    await expect(page.locator('#pending-tasks input[type=checkbox]')).toHaveCount(0);
    expect(mock.calls).toHaveLength(2);
  });
});
