import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const titles = {
  vi: 'Nhắc việc cho phụ huynh',
  en: 'Parent reminders',
  fr: 'Rappels pour les parents',
  de: 'Eltern-Erinnerungen',
  it: 'Promemoria per i genitori',
  es: 'Recordatorios para padres',
  zh: '家长待办提醒',
  ja: '保護者向けリマインダー',
  ko: '부모님 할 일 알림',
} as const;

async function captureCardWithMargin(page: Page, card: Locator, path: string) {
  const bounds = await card.boundingBox();
  const viewport = page.viewportSize();
  if (!bounds || !viewport) throw new Error('Reminder card bounds are unavailable.');
  const margin = 10;
  const x = Math.max(0, bounds.x - margin);
  const y = Math.max(0, bounds.y - margin);
  await page.screenshot({
    path,
    clip: {
      x,
      y,
      width: Math.min(viewport.width - x, bounds.width + margin * 2),
      height: Math.min(viewport.height - y, bounds.height + margin * 2),
    },
  });
}

test('a parent explicitly opts into actionable reminders and can revoke them', async ({ page }, testInfo) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  test.skip(!supabaseUrl, 'The browser auth client requires public Supabase configuration.');
  if (!supabaseUrl) return;

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  if (!projectRef) throw new Error('Supabase project reference is unavailable.');
  const user = {
    id: '55555555-5555-4555-8555-555555555555',
    aud: 'authenticated', role: 'authenticated', email: 'parent@example.test',
    app_metadata: {}, user_metadata: {}, created_at: '2026-09-26T00:00:00.000Z',
  };
  const session = {
    access_token: 'synthetic-access-token', refresh_token: 'synthetic-refresh-token',
    token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
  let enabled = false;
  let failNextSave = false;

  await page.addInitScript(() => {
    let permission = 'default';
    Reflect.set(window, '__notificationRequestCount', 0);
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        get permission() { return permission; },
        requestPermission: async () => {
          Reflect.set(window, '__notificationRequestCount', Number(Reflect.get(window, '__notificationRequestCount')) + 1);
          permission = 'granted';
          return permission;
        },
      },
    });
    localStorage.setItem('kidhabit_family_id', '77777777-7777-4777-8777-777777777777');
  });
  await page.context().addCookies([{
    name: `sb-${projectRef}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
    url: 'http://127.0.0.1:3000/',
  }]);
  await page.route('**/auth/v1/user', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }));
  await page.route('**/rest/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    const payload = path.endsWith('/family_memberships')
      ? { family_id: '66666666-6666-4666-8666-666666666666' }
      : path.endsWith('/user_subscriptions') || path.endsWith('/family_engagement_settings')
        ? null
        : [];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.route('**/api/privacy/analytics-consent', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ enabled: false }),
  }));
  await page.route('**/api/privacy/reminder-consent', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled }) });
      return;
    }
    if (failNextSave) {
      failNextSave = false;
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) });
      return;
    }
    const body: unknown = route.request().postDataJSON();
    enabled = typeof body === 'object' && body !== null && 'enabled' in body && body.enabled === true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled }) });
  });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Gia đình', exact: true }).click();
  await page.getByRole('tab', { name: 'Cài đặt', exact: true }).click();

  const card = page.getByRole('region', { name: titles.vi });
  const consent = card.getByRole('checkbox', { name: 'Cho phép nhắc việc cần xử lý' });
  await card.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(consent).not.toBeChecked();
  await expect(card.getByText('Đang tắt. Không có lời nhắc nào được gửi.')).toBeVisible();
  expect(await page.evaluate(() => Number(Reflect.get(window, '__notificationRequestCount')))).toBe(0);

  await consent.check();
  await expect(consent).toBeChecked();
  await expect(card.getByText('Đã bật lời nhắc.')).toBeVisible();
  await expect(card.getByText('Lời nhắc hiện chỉ xuất hiện trong ứng dụng.')).toBeVisible();
  expect(await page.evaluate(() => Number(Reflect.get(window, '__notificationRequestCount')))).toBe(0);

  await card.getByRole('button', { name: 'Cho phép thông báo trên thiết bị' }).click();
  expect(await page.evaluate(() => Number(Reflect.get(window, '__notificationRequestCount')))).toBe(1);
  await expect(card.getByText('Thiết bị đã sẵn sàng nhận thông báo.')).toBeVisible();

  failNextSave = true;
  await consent.uncheck();
  await expect(consent).toBeChecked();
  await expect(card.getByText('Chưa lưu được lựa chọn. Vui lòng thử lại.')).toBeVisible();

  await consent.uncheck();
  await expect(consent).not.toBeChecked();
  await expect(card.getByText('Đang tắt. Không có lời nhắc nào được gửi.')).toBeVisible();

  for (const [language, title] of Object.entries(titles)) {
    await page.evaluate((nextLanguage) => {
      localStorage.setItem('kidhabit_language', nextLanguage);
      document.cookie = `kidhabit_language=${nextLanguage}; Path=/; SameSite=Lax`;
      window.dispatchEvent(new Event('kidhabit-language-change'));
    }, language);
    const localizedCard = page.getByRole('region', { name: title });
    await localizedCard.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(localizedCard).toBeVisible();
    const iconBounds = await localizedCard.getByTestId('parent-reminder-title-icon').boundingBox();
    expect(iconBounds?.width).toBeGreaterThanOrEqual(20);
    expect(iconBounds?.height).toBeGreaterThanOrEqual(20);
    await expect(localizedCard.getByTestId('parent-reminder-title-icon')).toHaveCSS('flex-shrink', '0');
    expect(await localizedCard.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await localizedCard.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.left >= 0 && bounds.right <= window.innerWidth;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
    await captureCardWithMargin(page, localizedCard, testInfo.outputPath(`parent-reminders-${language}-mobile.png`));
  }

  for (const width of [768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const localizedCard = page.getByRole('region', { name: titles.ko });
    await localizedCard.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
    await captureCardWithMargin(page, localizedCard, testInfo.outputPath(`parent-reminders-ko-${width}.png`));
  }
});
