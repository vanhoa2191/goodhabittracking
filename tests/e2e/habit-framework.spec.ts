import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openParentDashboard(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }
}

test('parent can explore and add a canonical framework habit', async ({ page }) => {
  // Given
  await openParentDashboard(page);
  await page.getByRole('tab', { name: 'Quản lý việc' }).click();

  // When
  await expect(page.getByRole('heading', { name: 'Khung 47 thói quen 0–18 tuổi' })).toBeVisible();
  await expect(page.getByRole('button', { name: /12-15 · Bản sắc & Cảm xúc/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /15-18 · Định hướng & Trách nhiệm/ })).toBeVisible();
  const card = page.getByRole('heading', { name: 'Vòng lặp phát – đáp (được nhìn thấy, được đáp lại)' }).locator('xpath=ancestor::article[1]');
  await card.getByText('Xem cách làm và cách đồng hành').click();
  await card.getByRole('button', { name: 'Thêm vào danh sách việc' }).click();

  // Then
  await expect(card.getByText('Người lớn đồng hành:')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Đã thêm vào gia đình' })).toBeDisabled();
});

test('parent can add meaningful non-material and material rewards', async ({ page }) => {
  // Given
  await openParentDashboard(page);
  await page.getByRole('tab', { name: 'Đổi quà' }).click();

  // When
  await expect(page.getByRole('heading', { name: 'Gợi ý quà tặng ý nghĩa' })).toBeVisible();
  await page.getByRole('button', { name: 'Quà phi vật chất' }).click();
  const experienceCard = page.getByRole('heading', { name: '30 phút riêng cùng ba hoặc mẹ' }).locator('xpath=ancestor::article[1]');
  await experienceCard.getByRole('button', { name: 'Thêm vào kho quà' }).click();
  await page.getByRole('button', { name: 'Quà vật chất' }).click();
  const materialCard = page.getByRole('heading', { name: 'Một cuốn sách con tự chọn' }).locator('xpath=ancestor::article[1]');
  await materialCard.getByRole('button', { name: 'Thêm vào kho quà' }).click();

  // Then
  await expect(page.getByRole('heading', { name: '30 phút riêng cùng ba hoặc mẹ' }).last()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Một cuốn sách con tự chọn' }).last()).toBeVisible();
});
