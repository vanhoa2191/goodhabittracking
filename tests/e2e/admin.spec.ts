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

  await page.route('**/api/admin/billing-cases', async (route) => {
    if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
      requests.push({ path: `billing-${route.request().method().toLowerCase()}`, body: route.request().postDataJSON() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cases: [{
          id: '44444444-4444-4444-8444-444444444444',
          family_id: '22222222-2222-4222-8222-222222222222',
          user_id: '11111111-1111-4111-8111-111111111111',
          order_code: 123456,
          case_type: 'refund',
          reason_code: 'duplicate_payment',
          status: 'reviewing',
          resolution_code: 'manual_refund_required',
          created_at: '2026-09-28T00:00:00.000Z',
        }],
      }),
    });
  });

  await page.route('**/api/admin/launch-offer', async (route) => {
    if (route.request().method() === 'POST') {
      requests.push({ path: 'launch-offer-revoke', body: route.request().postDataJSON() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        slots: 10,
        claims: [{ orderCode: 777001, familyShort: '22222222', claimedAt: '2026-10-08T00:00:00.000Z', revoked: false }],
      }),
    });
  });

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Quản trị khách hàng' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');

  await expect(page.getByRole('heading', { name: 'Ưu đãi ra mắt' })).toBeVisible();
  await expect(page.getByText('Đã dùng 1/10 suất.')).toBeVisible();
  await page.getByRole('button', { name: 'Thu hồi suất đơn 777001' }).click();
  await page.getByLabel(/Lý do thu hồi đơn 777001/).fill('Đơn đã hoàn tiền');
  await page.getByRole('button', { name: 'Xác nhận thu hồi' }).click();
  await expect.poll(() => requests.some((request) => request.path === 'launch-offer-revoke')).toBe(true);
  expect(requests.find((request) => request.path === 'launch-offer-revoke')?.body).toEqual({ orderCode: 777001, reason: 'Đơn đã hoàn tiền' });

  await page.getByRole('tab', { name: 'Khách hàng' }).click();
  await expect(page).toHaveURL(/#khach-hang$/);
  await expect(page.getByText('customer@example.com')).toBeVisible();
  await page.getByRole('button', { name: /Nguyễn An/ }).click();
  await page.getByLabel('Lý do thao tác quản trị').fill('Cập nhật theo yêu cầu chăm sóc khách hàng');

  await page.getByLabel('Gói đăng ký').selectOption('yearly');
  await page.getByLabel('Ngày hết hạn', { exact: true }).fill('2027-12-31');
  await page.getByRole('button', { name: 'Lưu gói đăng ký' }).click();
  await expect.poll(() => requests.some((request) => request.path === 'subscription')).toBe(true);
  await expect(page.getByText(/Đã cập nhật gói của/)).toBeVisible();
  expect(requests.find((request) => request.path === 'subscription')?.body).toEqual({
    familyId: '22222222-2222-4222-8222-222222222222',
    plan: 'yearly',
    status: 'active',
    endsAt: '2027-12-31T23:59:59.000Z',
    expectedUpdatedAt: null,
    reason: 'Cập nhật theo yêu cầu chăm sóc khách hàng',
  });

  await page.getByLabel('Lý do thao tác quản trị').fill('Cập nhật thông tin liên hệ khách hàng');
  await page.getByLabel('Số điện thoại').fill('0911222333');
  const tags = page.getByLabel(/Nhãn chăm sóc/);
  await tags.fill('');
  await tags.pressSequentially('ưu tiên, giới thiệu, ');
  await expect(tags).toHaveValue('ưu tiên, giới thiệu, ');
  await page.getByRole('button', { name: 'Lưu hồ sơ khách hàng' }).click();
  await expect.poll(() => requests.some((request) => request.path === 'customer')).toBe(true);
  await expect(page.getByText(/Đã lưu hồ sơ/)).toBeVisible();

  await page.getByRole('tab', { name: 'Coupon' }).click();
  await page.getByLabel('Lý do thao tác quản trị').fill('Tặng ưu đãi theo yêu cầu chăm sóc khách hàng');
  await page.getByPlaceholder('VD: TANG30NGAY').fill('TANG45');
  await page.getByLabel('Số ngày tặng').fill('45');
  await page.getByRole('button', { name: 'Tạo coupon' }).click();
  await expect.poll(() => requests.some((request) => request.path === 'coupon')).toBe(true);
  await expect(page.getByText('Đã tạo coupon mới.')).toBeVisible();

  await page.getByRole('tab', { name: 'Thanh toán' }).click();
  await page.getByLabel('Lý do thao tác quản trị').fill('Ghi nhận yêu cầu hỗ trợ thanh toán');
  await page.getByLabel('Khách hàng cần hỗ trợ', { exact: true }).selectOption('11111111-1111-4111-8111-111111111111');
  await page.getByLabel('Loại yêu cầu').selectOption('cancellation');
  await page.getByLabel('Lý do yêu cầu').selectOption('changed_mind');
  await page.getByLabel('Mã đơn hàng').fill('123456');
  await page.getByRole('button', { name: 'Tạo hồ sơ hỗ trợ' }).click();
  await expect.poll(() => requests.some((request) => request.path === 'billing-post')).toBe(true);
  await expect(page.getByText('Đã tạo hồ sơ hỗ trợ và ghi nhận lịch sử xử lý.')).toBeVisible();

  await page.getByLabel('Lý do thao tác quản trị').fill('Hoàn tất xử lý yêu cầu của khách hàng');
  await page.getByLabel('Trạng thái').last().selectOption('completed');
  await page.getByLabel('Kết quả xử lý').selectOption('manual_refund_confirmed');
  await page.getByRole('button', { name: 'Lưu xử lý' }).click();
  await expect.poll(() => requests.some((request) => request.path === 'billing-patch')).toBe(true);

  await page.screenshot({ path: testInfo.outputPath('admin-customer-management.png'), fullPage: true });
});
