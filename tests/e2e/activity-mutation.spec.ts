import { expect, test } from '@playwright/test';

test('a failed cloud habit save keeps the form open and does not change the visible list', async ({ page }) => {
  // Given
  await page.goto('/');
  await page.getByRole('button', { name: 'Thiết lập trên thiết bị này' }).click();
  const setupDialog = page.getByRole('dialog', { name: 'Thiết lập gia đình' });
  await setupDialog.getByLabel('Tên của Ba Mẹ / Người nuôi dưỡng *').fill('Mẹ Kiểm Thử');
  await setupDialog.getByRole('button', { name: /Tiếp Tục/ }).click();
  await setupDialog.getByLabel('Họ và Tên bé *').fill('Bé Cloud');
  await setupDialog.getByRole('checkbox', { name: /Tôi là cha mẹ/ }).check();
  await setupDialog.getByRole('button', { name: /Hoàn Tất/ }).click();
  await page.evaluate(() => localStorage.setItem('kidhabit_storage_mode', 'cloud'));
  await page.reload();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Quản lý việc' }).click();
  await page.getByRole('button', { name: 'Tạo hoạt động mới' }).click();
  const habitDialog = page.getByRole('dialog', { name: 'Tạo hoạt động mới' });
  await habitDialog.getByPlaceholder('Ví dụ: Rửa tay trước khi ăn, mời cơm…').fill('Thói quen không được lưu');

  // When
  await habitDialog.getByRole('button', { name: 'Lưu lại' }).click();

  // Then
  await expect(habitDialog).toBeVisible();
  await expect(habitDialog.getByRole('alert')).toHaveText(
    'Không thể lưu thói quen. Dữ liệu chưa thay đổi; vui lòng thử lại.',
  );
  await expect(page.getByRole('heading', { name: 'Thói quen không được lưu' })).toHaveCount(0);
});

test('a failed cloud completion restores the task and removes success feedback', async ({ page }) => {
  // Given
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  await page.getByRole('tab', { name: 'Cài đặt' }).click();
  await page.getByRole('button', { name: /Lưu và đồng bộ đám mây/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const taskCard = page
    .getByRole('heading', { name: 'Nhan thí: Tươi cười chào buổi sáng' })
    .locator('xpath=ancestor::*[@data-task-card][1]');
  const wasComplete = await taskCard.getAttribute('data-complete');

  // When
  await taskCard.getByRole('button', { name: /Nhiệm vụ|Đã xong/ }).click();

  // Then
  await expect(taskCard).toHaveAttribute('data-complete', wasComplete ?? 'false');
  await expect(taskCard.getByRole('alert')).toContainText('thử lại');
  await expect(taskCard.getByTestId('point-burst')).toHaveCount(0);
});
