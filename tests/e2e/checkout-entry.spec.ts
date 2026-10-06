import { expect, test } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';
import { completeCheckoutProfile, installCustomerProfileFixture } from './customer-profile-fixture';

test.afterEach(async ({ page }, testInfo) => {
  await page.screenshot({ path: testInfo.outputPath('checkout.png'), fullPage: true });
});

test.beforeEach(async ({ page }) => {
  await installCustomerProfileFixture(page);
  await page.route('**/api/referral/claim', (route) => route.fulfill({ status: 200, json: { state: 'hidden' } }));
  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
});

for (const [plan, name, price] of [
  ['solo_monthly', 'Gói 1 bé · Tháng', '39.000'],
  ['monthly', 'Gói Pro · Tháng', '59.000'],
  ['yearly', 'Gói Pro · Năm', '590.000'],
]) {
  test(`signed-out ${plan} shows the selected summary and one login action`, async ({ page }) => {
    const payments: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/payment/create')) payments.push(request.url());
    });
    await page.goto(`/checkout?plan=${plan}`);
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(page.getByTestId('checkout-summary')).toContainText(price);
    await expect(page.getByRole('button', { name: 'Đăng nhập để thanh toán', exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Đăng nhập để thanh toán', exact: true })).toBeEnabled();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(payments).toEqual([]);
  });
}

for (const query of ['', 'plan=', 'plan=trial', 'plan=lifetime', 'plan=unknown', 'plan=monthly&plan=yearly', 'plan=monthly&plan=monthly']) {
  test(`invalid intent ${query || 'missing'} recovers to marketing pricing`, async ({ page }) => {
    await page.goto(`/checkout?${query}`);
    await expect(page.getByRole('heading', { name: 'Gói thanh toán không hợp lệ' })).toBeVisible();
    const origin = process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://www.example.test';
    await expect(page.getByRole('link', { name: 'Xem bảng giá' })).toHaveAttribute('href', new URL('/pricing', origin).href);
    await expect(page.getByRole('button', { name: 'Đăng nhập để thanh toán' })).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}

test('Google login preserves only the selected plan and resumes after auth', async ({ page, baseURL }) => {
  let returnUrl = '';
  await page.route('**/auth/v1/authorize?**', async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('provider')).toBe('google');
    returnUrl = url.searchParams.get('redirect_to') ?? '';
    await route.fulfill({ contentType: 'text/html', body: '<p>OAuth boundary</p>' });
  });
  await page.goto('/checkout?plan=yearly&next=https://evil.example&noise=discard');
  await page.getByRole('button', { name: 'Đăng nhập để thanh toán' }).click();
  await expect.poll(() => returnUrl).toBe(`${baseURL}/checkout?plan=yearly`);
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/payment/create', (route) => route.fulfill({ status: 503, json: { success: false, error: 'Payment provider unavailable in test.' } }));
  await page.goto(returnUrl);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Gói Pro · Năm');
});

test('authenticated checkout waits for family readiness then opens once without reselection', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  let releaseFamily!: () => void;
  const familyReady = new Promise<void>((resolve) => { releaseFamily = resolve; });
  await page.route('**/rest/v1/family_memberships?**', async (route) => {
    await familyReady;
    await route.fallback();
  });
  const plans: unknown[] = [];
  await page.route('**/api/payment/create', async (route) => {
    plans.push(route.request().postDataJSON());
    await route.fulfill({ status: 503, json: { success: false, error: 'Payment provider unavailable in test.' } });
  });
  await page.goto('/checkout?plan=solo_monthly');
  await expect(page.getByRole('heading', { name: 'Gói 1 bé · Tháng', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('gia đình');
  expect(plans).toEqual([]);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  releaseFamily();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Gói 1 bé · Tháng');
  await completeCheckoutProfile(dialog);
  if (process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true') {
    expect(plans).toEqual([]);
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'Tiếp tục tạo đơn thanh toán' }).click();
  }
  await expect(dialog).toContainText('Hệ thống thanh toán tạm thời chưa sẵn sàng.');
  expect(plans).toEqual([{ planId: 'solo_monthly' }]);
  await dialog.getByRole('button', { name: /Đóng|Close/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tiếp tục thanh toán' })).toBeVisible();
  expect(plans).toHaveLength(1);
});

test('a caregiver cannot open checkout or create a payment', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { familyRole: 'caregiver' });
  const payments: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/payment/create')) payments.push(request.url()); });
  await page.goto('/checkout?plan=monthly');
  await expect(page.getByText('Chỉ phụ huynh trong gia đình mới có thể thanh toán.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(payments).toEqual([]);
});

test('mobile checkout keeps the selected summary and login action in view', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/checkout?plan=monthly');
  await expect(page.getByRole('heading', { name: 'Gói Pro · Tháng', exact: true })).toBeVisible();
  const login = page.getByRole('button', { name: 'Đăng nhập để thanh toán' });
  await expect(login).toBeInViewport();
  const box = await login.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
