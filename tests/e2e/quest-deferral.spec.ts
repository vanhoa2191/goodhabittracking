import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test('a child can defer and restore a task without losing it on reload', async ({ page }) => {
  // Given: a child is exploring the local demo and has an unfinished task.
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  const firstTask = page.locator('[data-task-card]').first();
  const activityId = await firstTask.getAttribute('data-activity-id');
  expect(activityId).not.toBeNull();
  const task = page.locator(`[data-task-card][data-activity-id="${activityId}"]`);
  await expect(task).toHaveAttribute('data-deferred', 'false');

  // When: the child chooses the visible later action.
  await task.getByRole('button', { name: 'Để sau', exact: true }).click();

  // Then: the task stays on today's board, in its later group, after reload.
  await expect(task).toHaveAttribute('data-deferred', 'true');
  await expect(page.getByRole('heading', { name: 'Để sau hôm nay' })).toBeVisible();
  await page.reload();
  const deferredTask = page.locator(`[data-task-card][data-activity-id="${activityId}"]`);
  await expect(deferredTask).toBeVisible();
  await expect(deferredTask).toHaveAttribute('data-deferred', 'true');

  // When: the child chooses to do it now.
  await deferredTask.getByRole('button', { name: 'Làm ngay' }).focus();
  await page.keyboard.press('Enter');

  // Then: the task returns to its time-of-day group without a completion point.
  await expect(page.locator('[data-task-card][data-deferred="true"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Để sau hôm nay' })).toHaveCount(0);
  await expect(task).toHaveAttribute('data-complete', 'false');
});

test('a phone swipe defers left and completes right without stealing vertical scroll', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch gestures are verified on a mobile browser.');
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  const cards = page.locator('[data-task-card]');
  const firstId = await cards.nth(0).getAttribute('data-activity-id');
  const secondId = await cards.nth(1).getAttribute('data-activity-id');
  expect(firstId).not.toBeNull();
  expect(secondId).not.toBeNull();
  const first = page.locator(`[data-task-card][data-activity-id="${firstId}"]`);
  const second = page.locator(`[data-task-card][data-activity-id="${secondId}"]`);
  const client = await page.context().newCDPSession(page);

  async function swipe(card: typeof first, dx: number, dy: number) {
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    if (!box) throw new Error('Task card has no visible bounds.');
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + box.height / 2);
    const point = (shiftX: number, shiftY: number) => ({ x: x + shiftX, y: y + shiftY });
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0, 0)] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(dx / 2, dy / 2)] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(dx, dy)] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  await swipe(first, 10, -110);
  await expect(first).toHaveAttribute('data-deferred', 'false');
  await expect(first).toHaveAttribute('data-complete', 'false');

  await swipe(first, -100, 3);
  await expect(first).toHaveAttribute('data-deferred', 'true');

  await swipe(second, 100, 2);
  await expect(second).toHaveAttribute('data-complete', 'true');
});

test('completing a deferred task clears its choice even after undo', async ({ page }) => {
  // Given: a task is deferred in the local demo.
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  const activityId = await page.locator('[data-task-card]').first().getAttribute('data-activity-id');
  const task = page.locator(`[data-task-card][data-activity-id="${activityId}"]`);
  await task.getByRole('button', { name: 'Để sau', exact: true }).click();
  await expect(task).toHaveAttribute('data-deferred', 'true');

  // When: the child completes that deferred task.
  await task.getByRole('button', { name: 'Nhiệm vụ', exact: true }).click();

  // Then: the completed task is no longer deferred, including after undo.
  const sameTask = page.locator(`[data-task-card][data-activity-id="${activityId}"]`);
  await expect(sameTask).toHaveAttribute('data-complete', 'true');
  await expect(sameTask).toHaveAttribute('data-deferred', 'false');
  await sameTask.getByRole('button', { name: 'Đã xong', exact: true }).click();
  await expect(sameTask).toHaveAttribute('data-complete', 'false');
  await expect(sameTask).toHaveAttribute('data-deferred', 'false');
});

async function loadPairedChild(page: Page) {
  await page.clock.setFixedTime(new Date('2026-09-25T05:00:00.000Z'));
  await page.addInitScript(() => localStorage.setItem('kidhabit_child_paired', 'true'));
  await page.route('**/api/child/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      familyPausedAt: null,
      familyPausePeriods: [],
      child: {
        id: '11111111-1111-4111-8111-111111111111', name: 'Bé Kiểm Thử',
        avatar: 'mascot:leo', themeColor: '#F59E0B', points: 0, totalEarned: 0,
        level: 1, streak: 0, createdAt: '2026-09-24T00:00:00.000Z',
      },
      activities: [{
        id: '22222222-2222-4222-8222-222222222222', childId: '11111111-1111-4111-8111-111111111111',
        title: 'Xếp sách gọn gàng', icon: '📚', category: 'chores', points: 10,
        recurrenceType: 'daily', recurrenceDays: [], timeOfDay: 'afternoon',
        requiresApproval: false, isActive: true, createdAt: '2026-09-24T00:00:00.000Z',
      }],
      logs: [], rewards: [], redemptions: [],
    }),
  }));
}

test('a failed paired-device save leaves the task available to retry', async ({ page }) => {
  await loadPairedChild(page);
  await page.route('**/api/child/task-deferrals', (route) => route.fulfill({
    status: route.request().method() === 'GET' ? 200 : 503,
    contentType: 'application/json',
    body: route.request().method() === 'GET'
      ? JSON.stringify({ deferredTasks: [] })
      : JSON.stringify({ error: 'Task could not be saved.' }),
  }));

  await page.goto('/');
  const task = page.locator('[data-task-card]').first();
  await task.getByRole('button', { name: 'Để sau', exact: true }).click();
  await expect(task).toHaveAttribute('data-deferred', 'false');
  await expect(task.getByRole('alert')).toContainText('Chưa lưu được');
  await expect(task.getByRole('button', { name: 'Để sau', exact: true })).toBeEnabled();
});

test('a successful paired save stays successful when a later read fails', async ({ page }) => {
  await loadPairedChild(page);
  let readCount = 0;
  await page.route('**/api/child/task-deferrals', (route) => {
    if (route.request().method() === 'GET') {
      readCount += 1;
      return route.fulfill({
        status: readCount === 1 ? 200 : 503,
        contentType: 'application/json',
        body: readCount === 1 ? JSON.stringify({ deferredTasks: [] }) : JSON.stringify({ error: 'Read unavailable.' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ changed: true, deferredTask: {
        family_id: '33333333-3333-4333-8333-333333333333',
        child_id: '11111111-1111-4111-8111-111111111111',
        activity_id: '22222222-2222-4222-8222-222222222222',
        local_date: '2026-09-25',
        deferred_at: '2026-09-25T05:00:00.000Z',
      } }),
    });
  });

  await page.goto('/');
  const task = page.locator('[data-task-card]').first();
  await task.getByRole('button', { name: 'Để sau', exact: true }).click();
  await expect(task).toHaveAttribute('data-deferred', 'true');
  await expect(task.getByRole('alert')).toHaveCount(0);
  expect(readCount).toBe(1);
});

test('an older paired read cannot overwrite a newly saved choice', async ({ page }) => {
  await loadPairedChild(page);
  let releaseRead = () => {};
  const firstRead = new Promise<void>((resolve) => { releaseRead = resolve; });
  await page.route('**/api/child/task-deferrals', async (route) => {
    if (route.request().method() === 'GET') {
      await firstRead;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deferredTasks: [] }) });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ changed: true, deferredTask: {
        family_id: '33333333-3333-4333-8333-333333333333',
        child_id: '11111111-1111-4111-8111-111111111111',
        activity_id: '22222222-2222-4222-8222-222222222222',
        local_date: '2026-09-25',
        deferred_at: '2026-09-25T05:00:00.000Z',
      } }),
    });
  });

  await page.goto('/');
  const task = page.locator('[data-task-card]').first();
  const olderResponse = page.waitForResponse((response) =>
    response.url().includes('/api/child/task-deferrals') && response.request().method() === 'GET',
  );
  await task.getByRole('button', { name: 'Để sau', exact: true }).click();
  await expect(task).toHaveAttribute('data-deferred', 'true');
  releaseRead();
  await olderResponse;
  await expect(task).toHaveAttribute('data-deferred', 'true');
});

test('deferred quest labels fit all locales and screen widths', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.locator('[data-task-card]').first().getByRole('button', { name: 'Để sau', exact: true }).click();
  const locales = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const;
  for (const locale of locales) {
    await page.evaluate((language) => {
      localStorage.setItem('kidhabit_language', language);
      document.cookie = `kidhabit_language=${language}; Path=/`;
      window.dispatchEvent(new Event('kidhabit-language-change'));
    }, locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 812 });
      const deferred = page.locator('[data-task-card][data-deferred="true"]').first();
      await deferred.scrollIntoViewIfNeeded();
      await expect(deferred.getByRole('button').last()).toBeEnabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${locale} should fit ${width}px`).toBe(true);
      if (width === 375 || locale === 'vi') {
        await page.screenshot({ path: testInfo.outputPath(`quest-deferred-${locale}-${width}.png`) });
      }
    }
  }
});
