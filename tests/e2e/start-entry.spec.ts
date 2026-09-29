import { expect, test } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';

const redirectTimeout = { timeout: 20_000 } as const;
const freePlan = { plan: 'free', status: 'active', trial_ends_at: null, subscription_ends_at: null };

// The dev server compiles the app root on first request; warm it once so redirect
// assertions measure the product, not the compiler.
test.beforeAll(async ({ request, baseURL }) => {
  test.setTimeout(180_000);
  await request.get(`${baseURL}/`, { timeout: 170_000 });
});

test.beforeEach(async ({ page }) => {
  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
});

test('a signed-out visitor sees the trial promise and exactly one login action, never a payment step', async ({ page }) => {
  const payments: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/payment/')) payments.push(request.url());
  });
  await page.goto('/start');
  await expect(page.getByRole('heading', { name: 'Bắt đầu 7 ngày dùng thử', level: 1 })).toBeVisible();
  await expect(page.getByText('Không cần thẻ tín dụng')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đăng nhập bằng Google để bắt đầu' })).toHaveCount(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(/Gói .*(Tháng|Năm|Một Bé)/)).toHaveCount(0);
  expect(payments).toEqual([]);
});

test('Google login returns only to /start and drops any other destination', async ({ page, baseURL }) => {
  let returnUrl = '';
  await page.route('**/auth/v1/authorize?**', async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('provider')).toBe('google');
    returnUrl = url.searchParams.get('redirect_to') ?? '';
    await route.fulfill({ contentType: 'text/html', body: '<p>OAuth boundary</p>' });
  });
  await page.goto('/start?next=https://evil.example&plan=yearly');
  await page.getByRole('button', { name: 'Đăng nhập bằng Google để bắt đầu' }).click();
  await expect.poll(() => returnUrl).toBe(`${baseURL}/start`);
});

test('a new parent with no child profile lands in family setup, which activates the trial', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { profiles: [], subscription: freePlan });
  const trials: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/entitlement/trial')) trials.push(request.url());
  });
  await page.goto('/start');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(trials).toEqual([]);
});

test('a parent who already has an active plan and a child goes straight into the app', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.goto('/start');
  await expect(page).toHaveURL(`${baseURL}/`, redirectTimeout);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a parent with children but no active plan can start the trial with one action', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { subscription: freePlan });
  const trials: string[] = [];
  await page.route('**/api/entitlement/trial', async (route) => {
    trials.push(route.request().method());
    await route.fulfill({ status: 200, json: { success: true, entitlement: { plan: 'trial', status: 'active', trial_ends_at: '2099-01-01T00:00:00.000Z', subscription_ends_at: null } } });
  });
  await page.goto('/start');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Bắt đầu dùng thử 7 ngày' }).click();
  await expect(page).toHaveURL(`${baseURL}/`, redirectTimeout);
  expect(trials).toEqual(['POST']);
});

test('a used-up trial explains the next step instead of failing silently', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { subscription: freePlan });
  await page.route('**/api/entitlement/trial', (route) => route.fulfill({ status: 409, json: { success: false, error: 'Free trial has already been used.' } }));
  await page.goto('/start');
  await page.getByRole('button', { name: 'Bắt đầu dùng thử 7 ngày' }).click();
  await expect(page.getByTestId('start-summary').getByRole('alert')).toContainText('đã dùng thử');
  const origin = process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://www.example.test';
  await expect(page.getByRole('link', { name: 'Xem bảng giá' })).toHaveAttribute('href', new URL('/pricing/', origin).href);
  await expect(page).toHaveURL(`${baseURL}/start`);
});

test('a caregiver is told the trial belongs to a parent and nothing is activated', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { familyRole: 'caregiver', subscription: freePlan });
  const trials: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/entitlement/trial')) trials.push(request.url());
  });
  await page.goto('/start');
  await expect(page.getByText('Chỉ phụ huynh trong gia đình mới có thể bắt đầu dùng thử.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(trials).toEqual([]);
});

test('on a phone the login action stays in view and the page never scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/start');
  const login = page.getByRole('button', { name: 'Đăng nhập bằng Google để bắt đầu' });
  await expect(login).toBeInViewport();
  expect((await login.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
