import { expect, test } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';
import { installCustomerProfileFixture } from './customer-profile-fixture';

const freePlan = { plan: 'free', status: 'active', trial_ends_at: null, subscription_ends_at: null };
const checkoutName = 'Thanh Toán VietQR Tự Động';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/referral/claim', (route) => route.fulfill({ status: 200, json: { state: 'hidden' } }));
});

test('onboarding only creates a child and keeps extra customization collapsed', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { profiles: [], subscription: freePlan });
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/account/profile')) requests.push(request.url()); });
  await page.goto('/start');
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('#onboarding-child-name')).toBeVisible();
  await expect(dialog.locator('#onboarding-parent-name, #onboarding-parent-phone')).toHaveCount(0);
  await expect(dialog.locator('#onboarding-child-age')).toHaveValue('5');
  await expect(dialog.locator('#onboarding-child-nickname')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Leo', exact: true })).toBeHidden();
  await dialog.locator('summary').filter({ hasText: 'Tùy chỉnh thêm' }).click();
  await expect(dialog.getByRole('button', { name: 'Leo', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog.getByLabel('Tự động nạp mẫu')).toBeChecked();
  expect(requests).toEqual([]);
});

test('an incomplete account can use the app after login without a blocking prompt', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  const account = await installCustomerProfileFixture(page, { display_name: '', email: 'parent@example.test', phone: null, marketing_consent: false });
  await page.goto('/');
  await expect(page.getByTestId('app-surface')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Hoàn thiện thông tin khách hàng' })).toHaveCount(0);
  expect(account.saves).toEqual([]);
});

test('checkout asks once before terms and referral, validates the phone and remembers server details', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  const account = await installCustomerProfileFixture(page);
  const orders: unknown[] = [];
  await page.route('**/api/payment/create', async (route) => {
    orders.push(route.request().postDataJSON());
    await route.fulfill({ status: 503, json: { success: false } });
  });
  await page.goto('/checkout?plan=monthly');
  const dialog = page.getByRole('dialog', { name: checkoutName });
  const save = dialog.getByRole('button', { name: 'Lưu và tiếp tục' });
  await expect(save).toBeDisabled();
  await expect(dialog.getByLabel(/Tôi đồng ý nhận hướng dẫn/)).not.toBeChecked();
  await expect(dialog.getByRole('button', { name: 'Tiếp tục tạo đơn thanh toán' })).toHaveCount(0);
  await dialog.getByLabel('Số điện thoại', { exact: true }).fill('abc123');
  await expect(save).toBeDisabled();
  await expect(dialog.getByRole('alert')).toContainText('Số điện thoại chưa hợp lệ');
  expect(orders).toEqual([]);
  await dialog.getByLabel('Số điện thoại', { exact: true }).fill('0912 345 678');
  await dialog.getByLabel(/Tôi đồng ý nhận hướng dẫn/).check();
  await save.click();
  await expect(dialog.getByLabel('Số điện thoại', { exact: true })).toHaveCount(0);
  expect(account.saves).toEqual([{ displayName: 'Nguyễn An', phone: '0912 345 678', marketingConsent: true }]);
  expect(account.current().phone).toBe('0912345678');
  if (process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true') {
    expect(orders).toEqual([]);
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'Tiếp tục tạo đơn thanh toán' }).click();
  }
  await expect.poll(() => orders.length).toBe(1);
  await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục thanh toán' }).click();
  await expect(dialog).toContainText(process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true' ? 'Tiếp tục tạo đơn thanh toán' : 'Hệ thống thanh toán tạm thời chưa sẵn sàng.');
  await expect(dialog.getByLabel('Số điện thoại', { exact: true })).toHaveCount(0);
  expect(account.saves).toHaveLength(1);
  await page.reload();
  await expect(dialog).toContainText(process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true' ? 'Tiếp tục tạo đơn thanh toán' : 'Hệ thống thanh toán tạm thời chưa sẵn sàng.');
  await expect(dialog.getByLabel('Số điện thoại', { exact: true })).toHaveCount(0);
  expect(account.saves).toHaveLength(1);
});

test('checkout load failure retries before allowing payment and can be closed', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  let fail = true;
  await page.route('**/api/account/profile', (route) => route.fulfill(fail
    ? { status: 503, json: {} }
    : { status: 200, json: { profile: { display_name: 'Nguyễn An', email: 'parent@example.test', phone: null, marketing_consent: false } } }));
  const orders: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/payment/create')) orders.push(request.url()); });
  await page.goto('/checkout?plan=monthly');
  const dialog = page.getByRole('dialog', { name: checkoutName });
  await expect(dialog.getByRole('alert')).toContainText('Chưa tải được');
  fail = false;
  await dialog.getByRole('button', { name: 'Thử lại' }).click();
  await expect(dialog.getByLabel('Số điện thoại', { exact: true })).toBeVisible();
  expect(orders).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('the demo never asks for customer details', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/account/profile')) requests.push(request.url()); });
  await page.goto('/?demo=1');
  await expect(page.getByTestId('app-surface')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(requests).toEqual([]);
});
