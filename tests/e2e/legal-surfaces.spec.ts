import { expect, test } from '@playwright/test';
import { getVisiblePricingOpener } from './open-pricing';

for (const entry of [
  { path: '/privacy', heading: 'Quyền riêng tư của gia đình' },
  { path: '/terms', heading: 'Điều khoản sử dụng' },
  { path: '/contact', heading: 'Liên hệ hỗ trợ' },
] as const) {
  test(`${entry.path} renders a keyboard-usable mobile information surface`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(entry.path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: entry.heading, level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Thông tin pháp lý và hỗ trợ' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('draft policy routes stay noindex and hidden from the product footer', async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true', 'Publication gate is enabled in this run.');
  await page.goto('/privacy');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.goto('/');
  await expect(page.locator('footer').getByRole('link', { name: 'Quyền riêng tư' })).toHaveCount(0);
  await expect(page.locator('footer').getByRole('link', { name: 'Điều khoản' })).toHaveCount(0);
  await expect(page.locator('footer').getByRole('link', { name: 'Liên hệ' })).toHaveCount(0);
});

test('approved checkout waits for explicit policy acceptance before creating an order', async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED !== 'true', 'Publication gate is disabled in this run.');
  let createRequests = 0;
  await page.route('**/api/payment/create', (route) => {
    createRequests += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        payment: {
          orderCode: 777777,
          amount: 49000,
          description: 'KIDHABIT 777777',
          accountNumber: '0123456789',
          accountName: 'KIDHABIT HERO',
          bankBin: '970422',
          bankName: 'MBBank · Ngân hàng TMCP Quân đội',
          qrCode: '000201010212',
          vietQrUrl: 'data:image/png;base64,cXJjb2Rl',
          checkoutUrl: 'https://pay.payos.vn/web/777777',
          planId: 'monthly',
        },
      }),
    });
  });

  await page.goto('/');
  await (await getVisiblePricingOpener(page)).click();
  const pricing = page.getByRole('dialog', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' });
  await pricing.getByRole('button', { name: 'Chọn Gói Gia Đình · Tháng' }).click();
  const checkout = page.getByRole('dialog', { name: 'Thanh Toán VietQR Tự Động' });
  await expect(checkout.getByRole('heading', { name: 'Xác nhận trước khi tạo đơn' })).toBeVisible();
  expect(createRequests).toBe(0);
  await checkout.getByRole('checkbox', { name: /Tôi đã đọc và đồng ý/ }).check();
  expect(createRequests).toBe(0);
  await checkout.getByRole('button', { name: 'Tiếp tục tạo đơn thanh toán' }).click();
  await expect.poll(() => createRequests).toBe(1);
  await expect(checkout.getByText('0123456789')).toBeVisible();
});

test('approved policy routes expose the official contact and footer navigation', async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED !== 'true', 'Publication gate is disabled in this run.');
  await page.goto('/contact');
  await expect(page.getByRole('link', { name: 'Gửi email tới support@example.test' })).toHaveAttribute('href', /^mailto:support@example\.test/);
  await expect(page.getByText(/chờ chủ sản phẩm duyệt/)).toHaveCount(0);
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'Quyền riêng tư' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Điều khoản' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Liên hệ' })).toBeVisible();
});
