import { expect, test } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

test('a signed-in parent opens the parent dashboard on return', async ({ page }, testInfo) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  test.skip(!supabaseUrl, 'The browser auth client requires public Supabase configuration.');
  const projectRef = new URL(supabaseUrl!).hostname.split('.')[0];
  const user = {
    id: '22222222-2222-4222-8222-222222222222',
    aud: 'authenticated', role: 'authenticated',
    email: 'parent@example.test',
    app_metadata: {}, user_metadata: {},
    created_at: '2026-09-20T00:00:00.000Z',
  };
  const session = {
    access_token: 'synthetic-access-token', refresh_token: 'synthetic-refresh-token',
    token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
  await page.context().addCookies([{
    name: `sb-${projectRef}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
    url: 'http://127.0.0.1:3000/',
  }]);
  await page.route('**/auth/v1/user', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }));
  await page.route('**/rest/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    const payload = path.endsWith('/family_memberships')
      ? { family_id: '33333333-3333-4333-8333-333333333333' }
      : path.endsWith('/user_subscriptions') || path.endsWith('/family_engagement_settings')
        ? null
        : [];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.addInitScript(() => localStorage.setItem('kidhabit_family_id', '44444444-4444-4444-8444-444444444444'));
  await page.goto('/');

  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');
  await expect(page.getByRole('heading', { name: 'Phụ huynh' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trang chủ' }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('signed-in-parent.png') });
  await page.getByRole('button', { name: 'Trang chủ' }).first().click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'landing');
  await page.screenshot({ path: testInfo.outputPath('parent-visits-home.png') });
  await page.getByRole('button', { name: 'Vào bảng điều khiển' }).last().click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');
  await page.reload();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('a returning child sees only the child surface without a parent or sales entry', async ({ page }, testInfo) => {
  await page.route('**/api/child/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        child: {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Bé kiểm thử',
          avatar: '🦁',
          themeColor: '#eab308',
          points: 0,
          totalEarned: 0,
          level: 1,
          streak: 0,
          createdAt: '2026-09-20T00:00:00.000Z',
        },
        activities: [], logs: [], rewards: [], redemptions: [],
      }),
    });
  });
  await page.addInitScript(() => localStorage.setItem('kidhabit_child_paired', 'true'));
  await page.goto('/');

  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
  await expect(page.getByRole('heading', { name: 'Bé kiểm thử' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Phụ huynh' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Trang chủ' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Bật âm thanh' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Ngôn ngữ hiển thị' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tùy chỉnh Phông & Kích thước chữ' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('paired-child.png') });
  await page.reload();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('a first-time visitor sees the landing page before choosing a journey', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'landing');
  await expect(page.getByRole('button', { name: 'Trang chủ' })).toHaveCount(0);
  await expect(page.getByTestId('landing-primary-action')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Khám phá thử ngay/ })).toHaveCount(1);
  await expect(page.locator('main details')).toHaveCount(3);
  await expect(page.locator('main details').first()).not.toHaveAttribute('open', '');
  await expect(page.locator('main details').nth(1)).not.toHaveAttribute('open', '');
  const desktopHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(desktopHeight).toBeLessThanOrEqual(2495);
  await page.setViewportSize({ width: 768, height: 1024 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('first-visit.png') });
  await page.locator('main details').first().locator('summary').click();
  await expect(page.locator('main details').first().getByRole('button', { name: 'Bé vào bằng mã' })).toBeVisible();
});

test('an active family can deliberately visit Home and return to the app', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');

  const home = page.getByRole('button', { name: 'Trang chủ' }).first();
  if (!(await home.isVisible())) await page.getByRole('button', { name: 'Menu' }).click();
  await home.click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'landing');
  await page.getByRole('button', { name: 'Vào bảng điều khiển' }).last().click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
});

test('a parent on a narrow screen can open Home directly and return', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();

  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');
  const home = page.getByRole('button', { name: 'Trang chủ' }).first();
  await expect(home).toBeVisible();
  await home.click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'landing');
  await page.getByRole('button', { name: 'Vào bảng điều khiển' }).last().click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('returning from the landing page preserves the parent session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');

  await page.getByRole('button', { name: 'Trang chủ' }).first().click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'landing');
  await page.getByRole('button', { name: 'Vào bảng điều khiển' }).last().click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An' }).first()).toBeVisible();
});
