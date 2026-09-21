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

async function openLeaderboard(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /Bảng Xếp Hạng|BXH/ }).click();
  await expect(page.getByText(/Thi đua thói quen tốt/).first()).toBeVisible();
}

async function expectNoOverlap(
  first: import('@playwright/test').Locator,
  second: import('@playwright/test').Locator,
) {
  const [firstBox, secondBox] = await Promise.all([first.boundingBox(), second.boundingBox()]);
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  if (!firstBox || !secondBox) return;
  const overlaps = firstBox.x < secondBox.x + secondBox.width
    && firstBox.x + firstBox.width > secondBox.x
    && firstBox.y < secondBox.y + secondBox.height
    && firstBox.y + firstBox.height > secondBox.y;
  expect(overlaps).toBe(false);
}

test('a failed cloud group save keeps the modal open and visible groups unchanged', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await completeLocalSetup(page);
  await page.evaluate(() => localStorage.setItem('kidhabit_storage_mode', 'cloud'));
  await page.reload();
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

test('a failed cloud group join keeps the accessible dialog open', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await completeLocalSetup(page);
  await page.evaluate(() => localStorage.setItem('kidhabit_storage_mode', 'cloud'));
  await page.reload();
  await openLeaderboard(page);
  await page.getByRole('button', { name: 'Nhập mã vào nhóm' }).last().click();
  const dialog = page.getByRole('dialog', { name: 'Nhập mã vào nhóm' });
  await dialog.getByLabel('Mã mời của nhóm').fill('HERO2026');

  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();

  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toHaveText('Không thể tham gia nhóm bằng mã này.');
  await page.screenshot({ path: testInfo.outputPath('social-join-error.png') });
});

test('a local group save closes the modal and persists after reload', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await completeLocalSetup(page);
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
  await expectNoOverlap(
    page.getByText('ĐỒNG', { exact: false }).first(),
    page.getByText('sao tích lũy', { exact: true }).first(),
  );
  await page.getByText('Biệt đội Tử tế', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('social-local-success.png') });
});
