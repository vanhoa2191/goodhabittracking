import { expect, test } from '@playwright/test';

test('public documentation exposes the complete Vietnamese guide', async ({ page }) => {
  await page.goto('/docs');
  await expect(page.getByRole('heading', { level: 1, name: 'Tài liệu sử dụng KidHabit' })).toBeVisible();
  for (const heading of ['Bắt đầu nhanh','Hồ sơ và thói quen','Kết nối thiết bị của bé','Hoàn thành và xác nhận','Sao và phần thưởng','Thanh toán và kích hoạt','Đồng bộ, sao lưu và thiết bị','Khắc phục sự cố và FAQ']) await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quay lại ứng dụng' })).toHaveAttribute('href','/');
});
