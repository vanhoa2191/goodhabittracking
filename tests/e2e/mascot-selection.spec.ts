import { expect, test } from '@playwright/test';
import { openLocalFamilySetup } from './open-local-family-setup';

test('a child can choose a 3D companion and keep its paired theme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();

  const leo = page.getByRole('img', { name: 'Leo' });
  await expect(leo).toBeVisible();
  await expect.poll(() => leo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

  await page.getByTitle('Đổi hình đại diện & Màu sắc').click();
  const picker = page.getByRole('dialog', { name: 'Chọn hình đại diện' });
  await expect(picker.getByRole('button', { name: 'Leo' })).toHaveAttribute('aria-pressed', 'true');
  await expect(picker.locator('img')).toHaveCount(7);
  await expect.poll(() => picker.locator('img').evaluateAll((images: HTMLImageElement[]) =>
    images.every((image) => image.complete && image.naturalWidth > 0),
  )).toBe(true);

  await picker.getByRole('button', { name: 'Fox' }).click();
  await expect(picker.getByRole('button', { name: 'Fox' })).toHaveAttribute('aria-pressed', 'true');
  await picker.getByRole('button', { name: 'Lưu lại' }).click();

  const fox = page.getByRole('img', { name: 'Fox' });
  await expect(fox).toBeVisible();
  await expect(page.getByTestId('kid-hero')).toHaveAttribute('data-mascot', 'mascot:fox');
  await expect(page.getByTestId('kid-hero')).toHaveAttribute('data-theme-color', '#F97316');
});

test('sound control stays visible in the child header across screen sizes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    const soundButton = page.locator('[data-app-shell="kid"]').getByTestId('sound-toggle');
    await expect(soundButton).toBeVisible();
    const before = await soundButton.getAttribute('aria-pressed');
    await soundButton.click();
    await expect(soundButton).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  }
});

test('a local family sees the next mascot change date after saving a choice', async ({ page }, testInfo) => {
  await page.goto('/');
  await openLocalFamilySetup(page);
  const setup = page.getByRole('dialog', { name: 'Thiết lập gia đình' });
  await setup.getByLabel('Tên của Ba Mẹ / Người nuôi dưỡng *').fill('Mẹ Kiểm Thử');
  await setup.getByRole('button', { name: /Tiếp Tục/ }).click();
  await setup.getByLabel('Họ và Tên bé *').fill('Bé Kiểm Thử');
  await setup.getByRole('checkbox', { name: /Tôi là cha mẹ/ }).check();
  await setup.getByRole('button', { name: /Hoàn Tất/ }).click();

  await page.getByTitle('Đổi hình đại diện & Màu sắc').click();
  const picker = page.getByRole('dialog', { name: 'Chọn hình đại diện' });
  await page.screenshot({ path: testInfo.outputPath('mascot-picker-ready.png') });
  await picker.getByRole('button', { name: 'Fox' }).click();
  await picker.getByRole('button', { name: 'Lưu lại' }).click();
  await expect(picker).toBeHidden();

  await page.reload();
  await page.getByTitle('Đổi hình đại diện & Màu sắc').click();
  await expect(picker.getByRole('status')).toContainText('Bé có thể đổi linh vật tiếp từ');
  await expect(picker.getByRole('button', { name: 'Bee' })).toBeDisabled();
  await expect(picker.getByRole('button', { name: 'Fox' })).toBeEnabled();
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    await expect(picker).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`mascot-picker-locked-${width}.png`) });
    if (width === 375) {
      await picker.locator('.overflow-y-auto').evaluate((body) => body.scrollTo(0, body.scrollHeight));
      await expect(picker.getByRole('button', { name: 'Chàm Thông Thái' })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('mascot-picker-locked-scrolled-375.png') });
    }
  }
});

test('a paired child saves a mascot through the child session and then sees the cooldown', async ({ page }) => {
  const childId = '11111111-1111-4111-8111-111111111111';
  let avatar = 'mascot:leo';
  let themeColor = '#3b82f6';
  let selectedAt: string | null = null;
  let savedChoices = 0;
  let parentExperienceRequests = 0;

  await page.addInitScript(() => localStorage.setItem('kidhabit_child_paired', 'true'));
  await page.route('**/api/child/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      familyPausedAt: null,
      child: {
        id: childId,
        name: 'Bé Kiểm Thử',
        avatar,
        themeColor,
        points: 0,
        totalEarned: 0,
        level: 1,
        streak: 0,
        createdAt: '2026-09-23T00:00:00.000Z',
      },
      activities: [], logs: [], rewards: [], redemptions: [],
    }),
  }));
  await page.route('**/api/child/mascot', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mascot_selected_at: selectedAt }) });
      return;
    }
    const choice: unknown = route.request().postDataJSON();
    if (typeof choice !== 'object' || choice === null || !('avatar' in choice) || !('themeColor' in choice)
      || typeof choice.avatar !== 'string' || typeof choice.themeColor !== 'string') {
      await route.fulfill({ status: 400 });
      return;
    }
    const mascotChanged = avatar !== choice.avatar;
    avatar = choice.avatar;
    themeColor = choice.themeColor;
    if (mascotChanged) selectedAt = new Date().toISOString();
    savedChoices += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.route('**/api/domain/experience', (route) => {
    parentExperienceRequests += 1;
    return route.fulfill({ status: 401 });
  });

  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Leo' })).toBeVisible();
  await page.getByTitle('Đổi hình đại diện & Màu sắc').click();
  let picker = page.getByRole('dialog', { name: 'Chọn hình đại diện' });
  await expect(picker.getByRole('button', { name: 'Fox' })).toBeEnabled();
  await picker.getByRole('button', { name: 'Fox' }).click();
  await picker.getByRole('button', { name: 'Lưu lại' }).click();
  await expect(page.getByRole('img', { name: 'Fox' })).toBeVisible();
  expect(savedChoices).toBe(1);
  const firstSelectionAt = selectedAt;

  await page.getByTitle('Đổi hình đại diện & Màu sắc').click();
  picker = page.getByRole('dialog', { name: 'Chọn hình đại diện' });
  await expect(picker.getByRole('button', { name: 'Bee' })).toBeDisabled();
  await picker.getByRole('button', { name: 'Chàm Thông Thái' }).click();
  await picker.getByRole('button', { name: 'Lưu lại' }).click();
  await expect(page.getByTestId('kid-hero')).toHaveAttribute('data-theme-color', '#6366f1');
  expect(savedChoices).toBe(2);
  expect(selectedAt).toBe(firstSelectionAt);
  expect(parentExperienceRequests).toBe(0);
});
