import { expect, test } from '@playwright/test';

test('a child can choose a 3D companion and keep its paired theme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();

  const leo = page.getByRole('img', { name: 'Leo' });
  await expect(leo).toBeVisible();
  await expect.poll(() => leo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

  await page.getByTitle('Đổi hình đại diện & Màu sắc').click();
  const picker = page.getByRole('dialog', { name: 'Chọn hình đại diện' });
  await expect(picker.getByRole('button', { name: 'Leo' })).toHaveAttribute('aria-pressed', 'true');
  await expect(picker.locator('img')).toHaveCount(7);
  await expect.poll(() => picker.locator('img').evaluateAll((images: HTMLImageElement[]) =>
    images.every((image) => image.complete && image.naturalWidth > 0),
  )).toBe(true);

  await picker.getByRole('button', { name: 'Fox' }).click();
  await expect(picker.getByRole('button', { name: 'Fox' })).toHaveAttribute('aria-pressed', 'true');
  await picker.getByRole('button', { name: 'Lưu lại' }).click();

  const fox = page.getByRole('img', { name: 'Fox' });
  await expect(fox).toBeVisible();
  await expect(page.getByTestId('kid-hero')).toHaveAttribute('data-mascot', 'mascot:fox');
  await expect(page.getByTestId('kid-hero')).toHaveAttribute('data-theme-color', '#F97316');
});
