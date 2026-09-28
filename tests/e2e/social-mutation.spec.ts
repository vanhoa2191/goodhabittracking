import { expect, test } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';

async function openLeaderboard(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', /^(kid|parent)$/);
  if (await page.getByTestId('app-surface').getAttribute('data-app-mode') === 'parent') {
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Bé vui học' }).click();
    await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
  }
  await page.getByRole('button', { name: /Bảng Xếp Hạng|BXH/ }).click();
  await expect(page.getByText(/Thi đua thói quen tốt/).first()).toBeVisible();
}

test('a failed cloud group save keeps the modal open and visible groups unchanged', async ({ page, baseURL }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/domain/social', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, error: 'Temporary failure' }),
  }));
  await page.goto('/');
  await openLeaderboard(page);
  await page.getByRole('button', { name: 'Tạo nhóm thi đua' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Tạo nhóm thi đua' });
  await dialog.getByLabel(/Tên nhóm/).fill('Nhóm không được lưu');

  await dialog.getByRole('button', { name: 'Tạo mới', exact: true }).click();

  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toHaveText(
    'Không thể tạo nhóm. Dữ liệu chưa thay đổi; vui lòng thử lại.',
  );
  await expect(page.getByText('Nhóm không được lưu', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('social-cloud-error.png') });
});

test('a failed cloud group join keeps the accessible dialog open', async ({ page, baseURL }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/domain/social', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, error: 'Temporary failure' }),
  }));
  await page.goto('/');
  await openLeaderboard(page);
  await page.getByRole('button', { name: 'Nhập mã vào nhóm' }).last().click();
  const dialog = page.getByRole('dialog', { name: 'Nhập mã vào nhóm' });
  await dialog.getByLabel('Mã mời của nhóm').fill('HERO2026');

  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();

  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toHaveText('Không thể tham gia nhóm bằng mã này.');
  await page.screenshot({ path: testInfo.outputPath('social-join-error.png') });
});

test('a demo group save closes the modal and persists after reload', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await openLeaderboard(page);
  await page.getByRole('button', { name: 'Tạo nhóm thi đua' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Tạo nhóm thi đua' });
  await dialog.getByLabel(/Tên nhóm/).fill('Biệt đội Tử tế');

  await dialog.getByRole('button', { name: 'Tạo mới', exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText('Biệt đội Tử tế', { exact: true })).toBeVisible();
  await page.reload();
  await openLeaderboard(page);
  await expect(page.getByText('Biệt đội Tử tế', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByText('Biệt đội Tử tế', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('social-demo-success.png') });
});
