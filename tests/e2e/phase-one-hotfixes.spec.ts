import { expect, test } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';

async function enterPin(page: import('@playwright/test').Page, pin: string) {
  const dialog = page.getByRole('dialog', { name: /PIN/i });
  for (const digit of pin) {
    await dialog.getByRole('button', { name: digit, exact: true }).click();
  }
}

test('a demo parent creates and confirms a private PIN before entering parent mode', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Tạo mã PIN phụ huynh' })).toBeVisible();
  await expect(page.getByText(/mặc định: 1234/i)).toHaveCount(0);
  await enterPin(page, '2468');
  await expect(page.getByRole('heading', { name: 'Nhập lại mã PIN mới' })).toBeVisible();
  await enterPin(page, '2468');

  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');
});

test('camera fallback returns focus to the manually entered child code', async ({ page }) => {
  await page.context().clearPermissions();
  await page.goto('/');
  await page.getByTestId('gate-child-block-toggle').click();
  await page.getByRole('button', { name: 'Nhập mã hoặc quét QR' }).click();

  await page.getByRole('button', { name: 'Quét QR', exact: true }).click();
  const scanner = page.getByRole('region', { name: 'Máy quét mã QR kết nối' });
  await expect(scanner).toBeVisible();
  await scanner.getByRole('button', { name: 'Nhập mã thủ công' }).click();
  await expect(page.getByLabel('Mã kết nối của bé')).toBeFocused();
});

test('profile save recovers from a service failure without losing entered data', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/account/profile', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ profile: { display_name: 'Nguyễn An', email: 'parent@example.test', phone: null, marketing_consent: false } }),
      });
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Could not save profile.', correlationId: '11111111-1111-4111-8111-111111111111' }),
    });
  });

  await page.goto('/checkout?plan=monthly');
  const dialog = page.getByRole('dialog', { name: 'Thanh Toán VietQR Tự Động' });
  await dialog.getByLabel('Số điện thoại').fill('0912345678');
  await dialog.getByRole('button', { name: 'Lưu và tiếp tục' }).click();

  await expect(dialog.getByRole('alert')).toContainText('Mã hỗ trợ: 11111111-1111-4111-8111-111111111111');
  await expect(dialog.getByLabel('Số điện thoại')).toHaveValue('0912345678');
await expect(dialog.getByRole('button', { name: 'Thử lại' })).toBeEnabled();
});

test('signed-in PIN settings stay read-only until authoritative status is loaded', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/account/profile', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ profile: { display_name: 'Nguyễn An', email: 'parent@example.test', phone: '0912345678', marketing_consent: false } }),
  }));
  let statusReady = false;
  await page.route('**/api/parent-pin', (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    return route.fulfill({
      status: statusReady ? 200 : 503,
      contentType: 'application/json',
      body: JSON.stringify(statusReady ? { configured: true, lockedUntil: null } : { error: 'unavailable' }),
    });
  });

  await page.goto('/');
  await page.getByRole('tab', { name: 'Gia đình', exact: true }).click();
  await page.getByRole('tab', { name: 'Cài đặt', exact: true }).click();

  await expect(page.getByText('Chưa thể kiểm tra trạng thái mã PIN. Chưa có thay đổi nào được gửi.')).toBeVisible();
  await expect(page.getByLabel('Mã PIN mới')).toHaveCount(0);
  statusReady = true;
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByLabel('Mã PIN hiện tại')).toBeVisible();
  await expect(page.getByLabel('Mã PIN mới', { exact: true })).toBeVisible();
});

test('each child task completion control includes its visible task title', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  const title = 'Nhan thí: Tươi cười chào buổi sáng';
  await expect(page.getByRole('button', { name: `Đánh dấu nhiệm vụ “${title}” là hoàn thành` })).toBeVisible();
});
