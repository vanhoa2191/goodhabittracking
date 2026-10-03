import { expect, test } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const marketingOrigin = 'https://www.example.test';

test('a signed-in parent opens the parent dashboard and Home leaves for marketing', async ({ page, baseURL }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://e2e-test.supabase.co';
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const user = {
    id: '22222222-2222-4222-8222-222222222222',
    aud: 'authenticated', role: 'authenticated', email: 'parent@example.test',
    app_metadata: {}, user_metadata: {}, created_at: '2026-09-20T00:00:00.000Z',
  };
  const session = {
    access_token: 'synthetic-access-token', refresh_token: 'synthetic-refresh-token',
    token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
  await page.context().addCookies(Array.from(new Set([projectRef, 'e2e-test']), (ref) => ({
    name: `sb-${ref}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
    url: new URL(baseURL ?? 'http://127.0.0.1:3000').origin,
  })));
  await page.route('**/auth/v1/user', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }));
  await page.route('**/rest/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/rpc/family_snapshot')) return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST202', message: 'function not found' }) });
    const payload = path.endsWith('/family_memberships')
      ? { family_id: '33333333-3333-4333-8333-333333333333', role: 'owner' }
      : path.endsWith('/user_subscriptions') || path.endsWith('/family_engagement_settings') ? null : [];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.addInitScript(() => localStorage.setItem('kidhabit_family_id', '44444444-4444-4444-8444-444444444444'));
  await page.goto('/');

  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');
  await expect(page.getByRole('heading', { name: 'Phụ huynh' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Trang chủ' }).first()).toHaveAttribute('href', `${marketingOrigin}/`);
  await expect(page.getByText('Bạn muốn vào KidHabit theo cách nào?')).toHaveCount(0);
});

test('a returning paired child sees only the child surface', async ({ page }) => {
  await page.route('**/api/child/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      familyPausedAt: null,
      child: { id: '11111111-1111-4111-8111-111111111111', name: 'Bé kiểm thử', avatar: '🦁', themeColor: '#eab308', points: 0, totalEarned: 0, level: 1, streak: 0, createdAt: '2026-09-20T00:00:00.000Z' },
      activities: [], logs: [], rewards: [], redemptions: [],
    }),
  }));
  await page.addInitScript(() => localStorage.setItem('kidhabit_child_paired', 'true'));
  await page.goto('/');

  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
  await expect(page.getByRole('heading', { name: 'Bé kiểm thử' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Trang chủ' })).toHaveCount(0);
  await expect(page.getByText('Bạn muốn vào KidHabit theo cách nào?')).toHaveCount(0);
});

test('a signed-out visitor receives only the compact app gateway', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'gateway');
  await expect(page.getByRole('heading', { name: 'Bạn muốn vào KidHabit theo cách nào?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp tục với tư cách phụ huynh' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Khám phá bản demo' })).toBeVisible();
  // The child entry is folded away until asked for; the email-code option does not exist while its flag is off.
  await expect(page.getByTestId('gate-child-block')).not.toHaveJSProperty('open', true);
  await expect(page.getByRole('button', { name: 'Nhập mã hoặc quét QR' })).toBeHidden();
  await expect(page.getByTestId('gate-other-ways')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Xem trang giới thiệu' })).toHaveAttribute('href', `${marketingOrigin}/`);
  await expect(page.getByText('Chọn gói phù hợp với gia đình')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('the child entry opens from its folded block and exposes camera scanning and manual code', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('gate-child-block-toggle').click();
  await page.getByRole('button', { name: 'Nhập mã hoặc quét QR' }).click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quét QR', exact: true })).toBeVisible();
  await expect(page.getByLabel(/mã/i).first()).toBeVisible();
});

test('the preserved demo entry opens the child demo without a sales page', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
  await expect(page.getByText('Bạn muốn vào KidHabit theo cách nào?')).toHaveCount(0);
});
