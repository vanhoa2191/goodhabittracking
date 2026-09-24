import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { openLocalFamilySetup } from './open-local-family-setup';

test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

test('a local child reads one morning letter and keeps it after reload', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-09-23T01:00:00.000Z'));
  await page.goto('/');
  await openLocalFamilySetup(page);
  const setup = page.getByRole('dialog', { name: 'Thiết lập gia đình' });
  await setup.getByLabel('Tên của Ba Mẹ / Người nuôi dưỡng *').fill('Mẹ Kiểm Thử');
  await setup.getByRole('button', { name: /Tiếp Tục/ }).click();
  await setup.getByLabel('Họ và Tên bé *').fill('Bé Kiểm Thử');
  await setup.getByRole('checkbox', { name: /Tôi là cha mẹ/ }).check();
  await setup.getByRole('button', { name: /Hoàn Tất/ }).click();

  const letter = page.getByTestId('morning-mascot-letter');
  await expect(letter).toContainText('Thư buổi sáng từ Leo');
  await expect(letter.getByRole('button', { name: 'Mình đã đọc' })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include('[data-testid="morning-mascot-letter"]').analyze();
  expect(accessibility.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  await letter.screenshot({ path: testInfo.outputPath('morning-letter-unread-375.png') });
  await letter.getByRole('button', { name: 'Mình đã đọc' }).click();
  await expect(letter).toContainText('Đã đọc');

  await page.reload();
  await expect(letter).toContainText('Đã đọc');
  await expect(letter.getByRole('button', { name: 'Mình đã đọc' })).toHaveCount(0);

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    await expect(letter).toBeVisible();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await letter.screenshot({ path: testInfo.outputPath(`morning-letter-${width}.png`) });
  }
});

test('a paired child reads through the child session and preserves the server template', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-23T01:00:00.000Z'));
  const childId = '11111111-1111-4111-8111-111111111111';
  let readAt: string | null = null;
  let openCount = 0;
  let readAttempts = 0;

  await page.addInitScript(() => localStorage.setItem('kidhabit_child_paired', 'true'));
  await page.route('**/api/child/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      familyPausedAt: null,
      child: {
        id: childId, name: 'Bé Kiểm Thử', avatar: 'mascot:leo', themeColor: '#F59E0B',
        points: 0, totalEarned: 0, level: 1, streak: 0, createdAt: '2026-09-23T00:00:00.000Z',
      },
      activities: [], logs: [], rewards: [], redemptions: [],
    }),
  }));
  await page.route('**/api/mascot/letter**', async (route) => {
    const request = route.request();
    const target = request.method() === 'POST'
      ? z.object({ childId: z.string(), date: z.string() }).parse(request.postDataJSON())
      : { childId: new URL(request.url()).searchParams.get('childId'), date: new URL(request.url()).searchParams.get('date') };
    expect(target.childId).toBe(childId);
    expect(target.date).toBe('2026-09-23');
    openCount += 1;
    if (request.method() === 'POST') {
      readAttempts += 1;
      if (readAttempts === 1) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary failure' }) });
        return;
      }
      readAt = '2026-09-23T01:00:00.000Z';
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ templateKey: 'fox_1', readAt }) });
  });

  await page.goto('/');
  const letter = page.getByTestId('morning-mascot-letter');
  await expect(letter).toContainText('Thư buổi sáng từ Fox');
  await expect(letter).toContainText('Fox');
  await letter.getByRole('button', { name: 'Mình đã đọc' }).click();
  await expect(letter.getByRole('alert')).toContainText('Chưa lưu được trạng thái đã đọc');
  await expect(letter).toContainText('Thư buổi sáng từ Fox');
  await letter.getByRole('button', { name: 'Mình đã đọc' }).click();
  await expect(letter).toContainText('Đã đọc');
  expect(readAttempts).toBe(2);
  expect(openCount).toBeGreaterThanOrEqual(2);
});
