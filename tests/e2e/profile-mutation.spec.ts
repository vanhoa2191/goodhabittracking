import { expect, test } from '@playwright/test';

async function completeLocalSetup(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Thiết lập trên thiết bị này' }).click();
  const setupDialog = page.getByRole('dialog', { name: 'Thiết lập gia đình' });
  await setupDialog.getByLabel('Tên của Ba Mẹ / Người nuôi dưỡng *').fill('Mẹ Kiểm Thử');
  await setupDialog.getByRole('button', { name: /Tiếp Tục/ }).click();
  await setupDialog.getByLabel('Họ và Tên bé *').fill('Bé Ban Đầu');
  await setupDialog.getByRole('checkbox', { name: /Tôi là cha mẹ/ }).check();
  await setupDialog.getByRole('button', { name: /Hoàn Tất/ }).click();
}

async function openParentChildren(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: 'Hồ sơ các con' }).click();
}

test('a failed cloud profile update keeps the modal open and visible data unchanged', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await completeLocalSetup(page);
  await page.evaluate(() => localStorage.setItem('kidhabit_storage_mode', 'cloud'));
  await page.reload();
  await openParentChildren(page);
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ bé: Bé Ban Đầu' }).click();
  const profileDialog = page.getByRole('dialog', { name: 'Chỉnh sửa hồ sơ bé' });
  await profileDialog.getByLabel('Tên thật của bé *').fill('Tên Không Được Lưu');

  await profileDialog.getByRole('button', { name: 'Lưu lại' }).click();

  await expect(profileDialog).toBeVisible();
  await expect(profileDialog.getByRole('alert')).toHaveText(
    'Không thể lưu hồ sơ của bé. Vui lòng thử lại.',
  );
  await expect(page.getByRole('heading', { name: 'Bé Ban Đầu' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tên Không Được Lưu' })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('profile-cloud-error.png') });
});

test('a local profile update closes the modal and persists after reload', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await completeLocalSetup(page);
  await openParentChildren(page);
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ bé: Bé Ban Đầu' }).click();
  const profileDialog = page.getByRole('dialog', { name: 'Chỉnh sửa hồ sơ bé' });
  await profileDialog.getByLabel('Tên thật của bé *').fill('Bé Đã Lưu');

  await profileDialog.getByRole('button', { name: 'Lưu lại' }).click();

  await expect(profileDialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Bé Đã Lưu' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bé Đã Lưu' })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('profile-local-success.png') });
});
