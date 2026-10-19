import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';
import { enterParentApprovals } from './ui-audit-fixture';
import { cloudFamilyIds, defaultCloudActivity, defaultCloudProfile, installCloudFamilyFixture } from './cloud-family-fixture';

const longChildName = 'Bé Chi với tên dài để kiểm tra xuống dòng';

function parentFamilyFixture({ empty = false }: { readonly empty?: boolean } = {}) {
  const childB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const rewardId = '11111111-1111-4111-8111-111111111111';
  return {
    profiles: [
      defaultCloudProfile,
      { ...defaultCloudProfile, id: childB, nickname: null, name: longChildName, avatar: 'mascot:bunny' },
    ],
    activities: [
      { ...defaultCloudActivity, child_id: defaultCloudProfile.id, title: 'Đánh răng sáng của Bé Cloud', requires_approval: true },
      { ...defaultCloudActivity, id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', child_id: childB, title: 'Xếp đồ dùng của Bé Chi', requires_approval: true },
    ],
    rewards: [{ id: rewardId, family_id: cloudFamilyIds.family, title: 'Chọn truyện cùng nhà', description: '', icon: '📖', cost_points: 15, stock: 5, is_active: true, created_at: '2026-09-20T00:00:00.000Z' }],
    logs: empty ? [] : [
      { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', family_id: cloudFamilyIds.family, activity_id: defaultCloudActivity.id, child_id: defaultCloudProfile.id, log_date: '2026-09-21', status: 'pending_approval', points_awarded: 10, completed_at: '2026-09-21T07:00:00.000Z' },
    ],
    redemptions: empty ? [] : [
      { id: '66666666-6666-4666-8666-666666666666', family_id: cloudFamilyIds.family, reward_id: rewardId, child_id: childB, points_spent: 15, status: 'approved', requested_at: '2026-09-21T08:10:00.000Z' },
      { id: '77777777-7777-4777-8777-777777777777', family_id: cloudFamilyIds.family, reward_id: rewardId, child_id: defaultCloudProfile.id, points_spent: 15, status: 'pending', requested_at: '2026-09-21T08:00:00.000Z' },
    ],
  };
}

test('the parent Today screen follows one child at a time and invites a first cue when none is set', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);

  const chips = page.getByRole('group', { name: 'Xem tổng quan của bé' });
  await expect(chips.getByRole('button')).toHaveCount(3);
  const card = page.getByTestId('parent-today-card');
  await expect(card).toContainText('Hôm nay của Bé An');
  await chips.getByRole('button', { name: /Bé Mai/ }).click();
  await expect(card).toContainText('Hôm nay của Bé Mai');
  await expect(chips.getByRole('button', { name: /Bé Mai/ })).toHaveAttribute('aria-pressed', 'true');

  await expect(page.getByRole('heading', { name: /Cần ba mẹ làm|Cần bạn xử lý/ })).toBeVisible();
  await expect(page.getByTestId('habit-progress-summary')).toContainText('Chưa có thói quen nào đang xây');
  await page.getByTestId('habit-progress-empty-cta').click();
  await expect(page.getByRole('tab', { name: /Quản lý việc/ })).toHaveAttribute('aria-selected', 'true');
});

test('the Needs you strip lists what waits and the batch bar stays idle until something is ticked', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?demo=1');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);

  const strip = page.getByTestId('parent-action-strip');
  await expect(strip.getByRole('heading', { name: 'Cần bạn xử lý' })).toBeVisible();
  await expect(strip).toContainText(/Hiện không có việc nào|Duyệt \d+ việc của bé|Xem \d+ gợi ý/);
  await expect(page.getByText(/Nhiệm vụ chờ bố mẹ duyệt \(\d+\)/)).toBeVisible();
  if (await page.getByTestId('bulk-approve').count()) {
    await expect(page.getByTestId('bulk-approve')).toBeDisabled();
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  }
});

test('the parent Today card leads with a steady weekly rhythm', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?demo=1');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await expect(page.getByTestId('week-rhythm')).toHaveText(/^\d\/7 ngày tuần này$/);

});

test('family inbox leads, the summary selector sits inside the later summary, and headings have a meaningful outline', async ({ page, baseURL }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await installCloudFamilyFixture(page, baseURL, parentFamilyFixture());
  await enterParentApprovals(page);

  await expect(page.getByRole('heading', { level: 1, name: 'Phụ huynh' })).toBeVisible();
  const inbox = page.getByTestId('parent-family-inbox');
  const summary = page.getByTestId('parent-child-summary');
  await expect(inbox.getByRole('heading', { level: 2, name: 'Cần duyệt — tất cả bé' })).toBeVisible();
  await expect(summary.getByRole('heading', { level: 2, name: 'Tổng quan từng bé' })).toBeVisible();
  await expect(page.locator('#pending-tasks').getByRole('heading', { level: 3 })).toBeVisible();
  await expect(page.locator('#pending-rewards').getByRole('heading', { level: 3 })).toBeVisible();

  const inboxBeforeSummary = await page.evaluate(() => {
    const inboxElement = document.querySelector('[data-testid="parent-family-inbox"]');
    const summaryElement = document.querySelector('[data-testid="parent-child-summary"]');
    if (!inboxElement || !summaryElement) return null;
    return Boolean(inboxElement.compareDocumentPosition(summaryElement) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(inboxBeforeSummary).toBe(true);
  await expect(summary.getByRole('group', { name: 'Xem tổng quan của bé' })).toBeVisible();
  await expect(summary.getByTestId('parent-summary-scope-note')).toContainText('Chỉ đổi phần tổng quan');

  const inboxBox = await inbox.boundingBox();
  const firstTaskRow = await page.locator('#pending-tasks li').first().boundingBox();
  expect(inboxBox).not.toBeNull();
  expect(firstTaskRow).not.toBeNull();
  expect(inboxBox!.y).toBeLessThan(812);
  expect(firstTaskRow!.y).toBeLessThan(812);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

  await expect(page.locator('#pending-rewards').getByText(longChildName, { exact: true }).first()).toBeVisible();
});

test('actionable counts include an approved-but-undelivered reward request', async ({ page, baseURL }) => {
  test.setTimeout(90_000);
  await installCloudFamilyFixture(page, baseURL, parentFamilyFixture());
  await enterParentApprovals(page);

  const inbox = page.getByTestId('parent-family-inbox');
  await expect(inbox.getByTestId('parent-inbox-count')).toHaveText('3');
  await expect(page.getByRole('tab', { name: /^Hôm nay/ })).toContainText('3');
  await expect(page.locator('#pending-tasks').getByRole('heading', { level: 3 })).toContainText('(1)');
  const rewardsHeading = page.locator('#pending-rewards').getByRole('heading', { level: 3 });
  await expect(rewardsHeading).toContainText('(2)');
  await expect(page.getByTestId('redemption-awaiting')).toContainText('Đã duyệt, chờ trao quà');
  await expect(page.locator('#pending-rewards').getByText(longChildName, { exact: true }).first()).toBeVisible();
});

test('an empty family inbox offers an honest next step and no approval action', async ({ page, baseURL }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await installCloudFamilyFixture(page, baseURL, parentFamilyFixture({ empty: true }));
  await enterParentApprovals(page);

  const inbox = page.getByTestId('parent-family-inbox');
  await expect(inbox.getByTestId('parent-inbox-empty')).toContainText('Khi bé hoàn thành việc cần duyệt hoặc xin đổi quà, việc đó sẽ xuất hiện ở đây.');
  await expect(inbox.getByTestId('bulk-approve')).toHaveCount(0);
  const cta = inbox.getByRole('button', { name: 'Quản lý việc' });
  await expect(cta).toBeVisible();
  const ctaBox = await cta.boundingBox();
  expect(ctaBox).not.toBeNull();
  expect(ctaBox!.y + ctaBox!.height).toBeLessThan(812);
  await cta.click();
  await expect(page.getByRole('tab', { name: /Quản lý việc/ })).toHaveAttribute('aria-selected', 'true');
});
