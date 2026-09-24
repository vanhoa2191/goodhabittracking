import { expect, test } from '@playwright/test';

test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

test('a paired child sees a resting fire and separate pending approval', async ({ page }, testInfo) => {
  // Given: one verified day yesterday and an approval still pending today.
  await page.clock.setFixedTime(new Date('2026-09-23T05:00:00.000Z'));
  await page.addInitScript(() => localStorage.setItem('kidhabit_child_paired', 'true'));
  await page.route('**/api/child/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      familyPausedAt: null,
      child: {
        id: '11111111-1111-4111-8111-111111111111', name: 'Bé Kiểm Thử',
        avatar: 'mascot:leo', themeColor: '#F59E0B', points: 10, totalEarned: 10,
        level: 1, streak: 1, createdAt: '2026-09-21T00:00:00.000Z',
      },
      activities: [{
        id: '44444444-4444-4444-8444-444444444444', childId: '11111111-1111-4111-8111-111111111111',
        title: 'Xếp sách gọn gàng', icon: '📚', category: 'chores', points: 10,
        recurrenceType: 'daily', recurrenceDays: [], timeOfDay: 'afternoon',
        requiresApproval: false, isActive: true, createdAt: '2026-09-21T00:00:00.000Z',
      }],
      logs: [
        { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', activityId: '22222222-2222-4222-8222-222222222222', childId: '11111111-1111-4111-8111-111111111111', date: '2026-09-22', status: 'approved', pointsAwarded: 10, completedAt: '2026-09-22T02:00:00.000Z' },
        { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', activityId: '33333333-3333-4333-8333-333333333333', childId: '11111111-1111-4111-8111-111111111111', date: '2026-09-23', status: 'pending_approval', pointsAwarded: 0, completedAt: '2026-09-23T02:00:00.000Z' },
      ],
      rewards: [], redemptions: [],
    }),
  }));

  // When: the child opens the dashboard on a phone.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const fire = page.getByTestId('habit-fire');

  // Then: yesterday is preserved but today's pending work is not counted.
  await expect(fire).toHaveAttribute('data-state', 'resting');
  await expect(fire).toContainText('1 ngày liên tiếp, sẵn sàng hôm nay');
  await expect(fire).toContainText('Chờ bố mẹ duyệt');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('fire-resting-pending-375.png') });
});

test('a paired child keeps their fire after a completed family break', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-24T05:00:00.000Z'));
  await page.addInitScript(() => localStorage.setItem('kidhabit_child_paired', 'true'));
  await page.route('**/api/child/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      familyPausedAt: null,
      familyPausePeriods: [{ startedAt: '2026-09-20T17:00:00.000Z', endedAt: '2026-09-23T16:59:59.000Z' }],
      child: {
        id: '11111111-1111-4111-8111-111111111111', name: 'Bé Kiểm Thử',
        avatar: 'mascot:leo', themeColor: '#F59E0B', points: 10, totalEarned: 10,
        level: 1, streak: 1, createdAt: '2026-09-19T00:00:00.000Z',
      },
      activities: [],
      logs: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', activityId: '22222222-2222-4222-8222-222222222222', childId: '11111111-1111-4111-8111-111111111111', date: '2026-09-20', status: 'approved', pointsAwarded: 10, completedAt: '2026-09-20T02:00:00.000Z' }],
      rewards: [], redemptions: [],
    }),
  }));

  await page.goto('/');
  await expect(page.getByTestId('habit-fire')).toHaveAttribute('data-state', 'resting');
  await expect(page.getByTestId('habit-fire')).toContainText('1 ngày liên tiếp');
});
