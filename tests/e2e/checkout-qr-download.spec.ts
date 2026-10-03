import { expect, test } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';
import { getVisiblePricingOpener } from './open-pricing';

test('a parent on a phone can save the payment QR to pay from their banking app', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/payment/create', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      payment: {
        orderCode: 123456,
        amount: 49000,
        description: 'KIDHABIT 123456',
        accountNumber: '0123456789',
        accountName: 'KIDHABIT HERO',
        bankBin: '970422',
        bankName: 'MBBank · Ngân hàng TMCP Quân đội',
        qrCode: '000201010212',
        vietQrUrl: 'data:image/png;base64,cXJjb2Rl',
        checkoutUrl: 'https://pay.payos.vn/web/123456',
        planId: 'monthly',
      },
    }),
  }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await (await getVisiblePricingOpener(page)).click();
  await page.getByRole('dialog', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' })
    .getByRole('button', { name: 'Chọn Gói Gia Đình · Tháng' }).click();

  const checkout = page.getByRole('dialog', { name: 'Thanh Toán VietQR Tự Động' });
  if (process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true') {
    await checkout.getByRole('checkbox').check();
    await checkout.getByRole('button', { name: 'Tiếp tục tạo đơn thanh toán' }).click();
  }
  const button = checkout.getByTestId('download-qr');
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeInViewport();
  await expect(button).toHaveText('Tải mã QR về máy');

  const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
  expect(download.suggestedFilename()).toBe('kidhabit-qr-123456.png');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toBe('qrcode');

  await expect(button).toHaveText('Đã tải mã QR');
  await expect(checkout.getByText('0123456789')).toBeVisible();
});
