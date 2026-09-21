import { expect, test } from '@playwright/test';

test('admin can update customer care data, subscription and a gift coupon', async ({ page }, testInfo) => {
  const requests: Array<{ readonly path: string; readonly body: unknown }> = [];

  await page.route('**/api/admin/customers', async (route) => {
    if (route.request().method() === 'PATCH') {
      requests.push({ path: 'customer', body: route.request().postDataJSON() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        customers: [{
          id: '11111111-1111-4111-8111-111111111111',
          email: 'customer@example.com',
          fullName: 'Nguyễn An',
          phone: '0900000000',
          marketingConsent: true,
          tags: ['ưu tiên'],
          notes: 'Khách hàng cần hỗ trợ onboarding',
          familyId: '22222222-2222-4222-8222-222222222222',
          subscription: {
            plan: 'monthly',
            status: 'active',
            subscription_ends_at: '2027-01-31T23:59:59.000Z',
            trial_ends_at: null,
          },
        }],
      }),
    });
  });

  await page.route('**/api/admin/subscriptions', async (route) => {
    requests.push({ path: 'subscription', body: route.request().postDataJSON() });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });

  await page.route('**/api/admin/coupons', async (route) => {
    if (route.request().method() === 'POST') {
      requests.push({ path: 'coupon', body: route.request().postDataJSON() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        coupons: [{
          id: '33333333-3333-4333-8333-333333333333',
          code: 'CHAO30',
          bonus_days: 30,
          active: true,
          redeemed_count: 2,
          max_redemptions: 100,
          expires_at: '2027-12-31T23:59:59.000Z',
        }],
      }),
    });
  });

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Quản trị khách hàng' })).toBeVisible();
  await expect(page.getByText('customer@example.com')).toBeVisible();

  await page.getByLabel('Gói').selectOption('yearly');
  await page.getByLabel('Ngày hết hạn', { exact: true }).fill('2027-12-31');
  await page.getByRole('button', { name: 'Lưu gói đăng ký' }).click();
  await expect.poll(() => requests.some((request) => request.path === 'subscription')).toBe(true);
  expect(requests.find((request) => request.path === 'subscription')?.body).toEqual({
    familyId: '22222222-2222-4222-8222-222222222222',
    plan: 'yearly',
    status: 'active',
    endsAt: '2027-12-31T23:59:59.000Z',
  });

  await page.getByLabel('Số điện thoại').fill('0911222333');
  await page.getByLabel(/Nhãn chăm sóc/).fill('ưu tiên, giới thiệu');
  await page.getByRole('button', { name: 'Lưu hồ sơ khách hàng' }).click();
  await expect.poll(() => requests.some((request) => request.path === 'customer')).toBe(true);

  await page.getByPlaceholder('VD: TANG30NGAY').fill('TANG45');
  await page.getByLabel('Số ngày tặng').fill('45');
  await page.getByRole('button', { name: 'Tạo coupon' }).click();
  await expect.poll(() => requests.some((request) => request.path === 'coupon')).toBe(true);

  await page.screenshot({ path: testInfo.outputPath('admin-customer-management.png'), fullPage: true });
});
