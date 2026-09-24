import { expect, test } from '@playwright/test';

test('a parent pauses a local family and the child sees a pressure-free break', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();

  await page.getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: 'Cài đặt' }).click();
  const pausePanel = page.getByRole('region', { name: 'Nhịp nghỉ của gia đình' });
  await pausePanel.getByRole('button', { name: 'Tạm nghỉ' }).click();
  await expect(pausePanel).toContainText('không mất nhiệm vụ hay phần thưởng');
  await pausePanel.getByRole('button', { name: 'Tạm nghỉ' }).click();
  await expect(pausePanel).toContainText('Gia đình đang nghỉ');

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await pausePanel.screenshot({ path: testInfo.outputPath(`parent-pause-${width}.png`) });
  }

  await page.getByRole('button', { name: 'Bé vui học' }).click();
  await expect(page.getByTestId('family-pause-child')).toBeVisible();
  await expect(page.getByRole('button', { name: /Bảng Xếp Hạng|BXH/ })).toHaveCount(0);
  await expect(page.getByTestId('habit-fire')).toHaveCount(0);
  await expect(page.getByText('Tiến độ hôm nay')).toHaveCount(0);
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`child-pause-${width}.png`) });
  }
  await page.reload();
  await expect(page.getByTestId('family-pause-child')).toBeVisible();
  await expect(page.getByTestId('habit-fire')).toHaveCount(0);

  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const unlock = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await unlock.getByRole('button', { name: digit, exact: true }).click();
  await page.getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: 'Cài đặt' }).click();
  const resumedPanel = page.getByRole('region', { name: 'Nhịp nghỉ của gia đình' });
  await resumedPanel.getByRole('button', { name: 'Tiếp tục' }).click();
  await resumedPanel.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('button', { name: 'Bé vui học' }).click();
  await expect(page.getByTestId('family-pause-child')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Bảng Xếp Hạng|BXH/ })).toBeVisible();
});

test('a paired child receives the family break from the child session', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidhabit_child_paired', 'true'));
  await page.route('**/api/child/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      familyPausedAt: '2026-09-24T10:00:00.000Z',
      child: {
        id: '11111111-1111-4111-8111-111111111111', name: 'Bé thử',
        avatar: 'mascot:leo', themeColor: '#F59E0B', points: 0, totalEarned: 0,
        level: 1, streak: 0, createdAt: '2026-09-24T00:00:00.000Z',
      },
      activities: [], logs: [], rewards: [], redemptions: [],
    }),
  }));

  await page.goto('/');

  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
  await expect(page.getByTestId('family-pause-child')).toBeVisible();
  await expect(page.getByTestId('habit-fire')).toHaveCount(0);
});
