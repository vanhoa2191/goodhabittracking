import { expect, test } from '@playwright/test';
import { defaultCloudActivity, installCloudFamilyFixture } from './cloud-family-fixture';

test('a failed cloud habit save keeps the form open and does not change the visible list', async ({ page, baseURL }) => {
  // Given
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/domain/activities', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, error: 'Temporary failure' }),
  }));
  await page.goto('/');
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
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

test('a failed cloud completion restores the task and removes success feedback', async ({ page, baseURL }) => {
  // Given
  await installCloudFamilyFixture(page, baseURL, { activities: [defaultCloudActivity] });
  await page.route('**/api/domain/commands', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Temporary failure' }),
  }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Bé vui học' }).click();
  const taskCard = page
    .getByRole('heading', { name: defaultCloudActivity.title })
    .locator('xpath=ancestor::*[@data-task-card][1]');
  const wasComplete = await taskCard.getAttribute('data-complete');

  // When
  await taskCard.getByRole('button', { name: /Nhiệm vụ|Đã xong/ }).click();

  // Then
  await expect(taskCard).toHaveAttribute('data-complete', wasComplete ?? 'false');
  await expect(taskCard.getByRole('alert')).toContainText('thử lại');
  await expect(taskCard.getByTestId('point-burst')).toHaveCount(0);
});
