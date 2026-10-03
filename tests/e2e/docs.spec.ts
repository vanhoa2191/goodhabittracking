import { expect, test } from '@playwright/test';

test('the in-app guide lists every chapter, answers a search and opens a chapter at a section', async ({ page }) => {
  await page.goto('/docs');
  await expect(page.getByRole('heading', { level: 1, name: 'Tài liệu sử dụng KidHabit' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quay lại ứng dụng' })).toHaveAttribute('href', '/');
  for (const chapter of ['Bắt đầu', 'Màn hình của bé', 'Hôm nay và duyệt việc', 'Thiết kế thói quen', 'Gia đình và cài đặt', 'Gói và thanh toán', 'Bảo mật và riêng tư']) {
    await expect(page.getByRole('list').getByRole('link', { name: new RegExp(chapter) }).first()).toBeVisible();
  }
  // Operator chapters are not part of the parents' guide.
  await expect(page.getByRole('link', { name: /Quản trị và vận hành/ })).toHaveCount(0);

  await page.getByRole('searchbox', { name: 'Tìm trong hướng dẫn' }).fill('ghep may');
  const results = page.getByTestId('guide-search-results');
  await expect(results).toBeVisible();
  await results.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/docs\/[a-z-]+#/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('a chapter loads its text, scrolls to the section in the link and links onward', async ({ page }) => {
  await page.goto('/docs/goi-va-thanh-toan#coupon');
  await expect(page.getByRole('heading', { level: 1, name: 'Gói và thanh toán' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Mã tặng (coupon)' })).toBeInViewport();
  await page.getByRole('link', { name: /Chương sau: Giới thiệu bạn bè/ }).click();
  await expect(page).toHaveURL(/\/docs\/gioi-thieu-ban-be$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Giới thiệu bạn bè' })).toBeVisible();
});

test('an unknown chapter is a 404, not an empty page', async ({ page }) => {
  const response = await page.goto('/docs/khong-co-chuong-nay');
  expect(response?.status()).toBe(404);
});

test('a reader whose language is English gets the English guide, and a language without one gets English too', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.goto('/docs/goi-va-thanh-toan');
  await expect(page.getByRole('heading', { level: 1, name: 'Plans and payment' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { level: 2, name: /Gift codes/ })).toBeVisible();
  await expect(page.getByText('The full guide is currently in Vietnamese')).toHaveCount(0);

  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'ja'));
  await page.goto('/docs/goi-va-thanh-toan');
  await expect(page.getByRole('heading', { level: 1, name: 'Plans and payment' })).toBeVisible({ timeout: 20_000 });
});
