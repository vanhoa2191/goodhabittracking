import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the science page says what is known, what is not, and cites its sources', async ({ page }) => {
  await page.goto('/science');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('điều đã biết và điều chưa biết');
  await expect(page.getByRole('heading', { name: 'Không có con số "21 ngày"' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Điều chúng tôi chưa biết' })).toBeVisible();
  await expect(page.locator('#sources-title')).toBeVisible();
  await expect(page.locator('article').first()).toContainText('Giới hạn.');

  const link = page.getByRole('link', { name: 'Lally P, van Jaarsveld CHM, Potts HWW, Wardle J' }).first();
  await link.click();
  await expect(page.locator('#source-lally-2010')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);
});

test('the science page fits a phone without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/science');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
