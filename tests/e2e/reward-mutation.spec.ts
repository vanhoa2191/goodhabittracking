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

async function openParentRewards(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('tab', { name: /Đổi quà/ }).click();
}

test('a failed cloud reward save keeps the modal open and visible data unchanged', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await completeLocalSetup(page);
  await page.evaluate(() => localStorage.setItem('kidhabit_storage_mode', 'cloud'));
  await page.reload();
  await openParentRewards(page);
  await page.getByRole('button', { name: 'Tạo phần thưởng mới' }).click();
  const rewardDialog = page.getByRole('dialog', { name: 'Tạo phần thưởng mới' });
  await rewardDialog.getByLabel(/^Tên quà/).fill('Phần thưởng không được lưu');

  await rewardDialog.getByRole('button', { name: 'Lưu lại' }).click();

  await expect(rewardDialog).toBeVisible();
  await expect(rewardDialog.getByRole('alert')).toHaveText(
    'Không thể lưu phần thưởng. Dữ liệu chưa thay đổi; vui lòng thử lại.',
  );
  await expect(page.getByText('Phần thưởng không được lưu', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('reward-cloud-error.png') });
});

test('a local reward save closes the modal and persists after reload', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await completeLocalSetup(page);
  await openParentRewards(page);
  await page.getByRole('button', { name: 'Tạo phần thưởng mới' }).click();
  const rewardDialog = page.getByRole('dialog', { name: 'Tạo phần thưởng mới' });
  await rewardDialog.getByLabel(/^Tên quà/).fill('Chuyến đi cuối tuần');

  await rewardDialog.getByRole('button', { name: 'Lưu lại' }).click();

  await expect(rewardDialog).toBeHidden();
  await expect(page.getByText('Chuyến đi cuối tuần', { exact: true })).toBeVisible();
  await page.reload();
  await openParentRewards(page);
  await expect(page.getByText('Chuyến đi cuối tuần', { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('reward-local-success.png') });
});
