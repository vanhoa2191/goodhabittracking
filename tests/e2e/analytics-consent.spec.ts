import { expect, test } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

function deferred() {
  let release: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

test('an anonymous visitor does not request persisted analytics consent', async ({ page }) => {
  let requestCount = 0;
  await page.route('**/api/privacy/analytics-consent', (route) => {
    requestCount += 1;
    return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'unauthorized' }) });
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(requestCount).toBe(0);
});

test('a signed-in parent can manage anonymous measurement across responsive and CJK layouts', async ({ page }, testInfo) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  test.skip(!supabaseUrl, 'The browser auth client requires public Supabase configuration.');
  if (!supabaseUrl) return;

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  if (!projectRef) throw new Error('Supabase project reference is unavailable.');
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
  let enabled = false;
  let initialLoadReleased = false;
  let delayNextSave = false;
  let failNextSave = false;
  const initialLoad = deferred();
  const pendingSave = deferred();

  await page.setViewportSize({ width: 375, height: 812 });
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
  await page.route('**/api/privacy/analytics-consent', async (route) => {
    if (route.request().method() === 'GET') {
      if (!initialLoadReleased) await initialLoad.promise;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled }) });
      return;
    }

    const body: unknown = route.request().postDataJSON();
    const requestedEnabled = typeof body === 'object' && body !== null && 'enabled' in body && typeof body.enabled === 'boolean'
      ? body.enabled
      : null;
    if (delayNextSave) {
      delayNextSave = false;
      await pendingSave.promise;
    }
    if (failNextSave) {
      failNextSave = false;
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) });
      return;
    }
    if (requestedEnabled !== null) enabled = requestedEnabled;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled }) });
  });
  await page.addInitScript(() => localStorage.setItem('kidhabit_family_id', '44444444-4444-4444-8444-444444444444'));

  await page.goto('/');
  await page.getByRole('tab', { name: 'Gia đình', exact: true }).click();
  await page.getByRole('tab', { name: 'Cài đặt', exact: true }).click();
  const consent = page.getByRole('checkbox', { name: 'Cho phép đo lường ẩn danh' });
  const vietnameseConsentCard = page.getByRole('region', { name: 'Giúp KidHabit tốt hơn' });
  await vietnameseConsentCard.evaluate((element) => {
    document.documentElement.style.scrollBehavior = 'auto';
    element.scrollIntoView({ block: 'center', behavior: 'auto' });
  });
  await expect(consent).toBeDisabled();
  await expect(vietnameseConsentCard.getByText('Đang tải lựa chọn…')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('analytics-consent-vi-loading-mobile.png') });

  initialLoadReleased = true;
  initialLoad.release();
  await expect(consent).toBeEnabled();
  await expect(consent).not.toBeChecked();
  await expect(page.getByText('Đang tắt. Không có số liệu sử dụng nào được gửi đi.')).toBeVisible();

  delayNextSave = true;
  await consent.check();
  await expect(consent).toBeChecked();
  await expect(page.getByText('Đang lưu…')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('analytics-consent-vi-saving-mobile.png') });
  pendingSave.release();
  await expect(page.getByText('Đã lưu quyền cho phép đo lường ẩn danh.')).toBeVisible();

  failNextSave = true;
  await consent.click();
  await expect(consent).toBeChecked();
  await expect(page.getByText('Chưa lưu được lựa chọn. Vui lòng thử lại.')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('analytics-consent-vi-error-mobile.png') });

  await consent.uncheck();
  await expect(consent).not.toBeChecked();
  await expect(page.getByText('Đang tắt. Không có số liệu sử dụng nào được gửi đi.')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('analytics-consent-vi-revoked-mobile.png') });

  await consent.check();
  await expect(consent).toBeChecked();
  await expect(page.getByText('Đã lưu quyền cho phép đo lường ẩn danh.')).toBeVisible();
  const viewportStates = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ] as const;
  const languageStates = [
    { code: 'vi', title: 'Giúp KidHabit tốt hơn' },
    { code: 'ja', title: 'KidHabit の改善に協力' },
    { code: 'zh', title: '帮助改进 KidHabit' },
    { code: 'ko', title: 'KidHabit 개선에 도움 주기' },
  ] as const;

  for (const languageState of languageStates) {
    await page.evaluate((language) => {
      localStorage.setItem('kidhabit_language', language);
      document.cookie = `kidhabit_language=${language}; Path=/; SameSite=Lax`;
      window.dispatchEvent(new Event('kidhabit-language-change'));
    }, languageState.code);
    const consentCard = page.getByRole('region', { name: languageState.title });
    await expect(consentCard).toBeVisible();
    for (const viewport of viewportStates) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await consentCard.evaluate((element) => {
        document.documentElement.style.scrollBehavior = 'auto';
        element.scrollIntoView({ block: 'center', behavior: 'auto' });
      });
      await expect(consentCard).toBeInViewport();
      expect(await consentCard.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.top >= 0 && bounds.bottom <= window.innerHeight;
      })).toBe(true);
      expect(await consentCard.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`analytics-consent-${languageState.code}-${viewport.name}.png`) });
    }
  }

  await page.evaluate(() => {
    localStorage.setItem('kidhabit_language', 'vi');
    document.cookie = 'kidhabit_language=vi; Path=/; SameSite=Lax';
    window.dispatchEvent(new Event('kidhabit-language-change'));
  });
  await page.setViewportSize({ width: 375, height: 812 });

  await consent.uncheck();
  await expect(consent).not.toBeChecked();
  await expect(page.getByText('Đang tắt. Không có số liệu sử dụng nào được gửi đi.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
