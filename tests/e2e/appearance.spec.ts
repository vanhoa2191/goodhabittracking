import { expect, test } from '@playwright/test';

test.use({ colorScheme: 'dark' });

test('new visitors start light and can follow the device preference', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('hydrated')) {
      hydrationErrors.push(message.text());
    }
  });

  await page.goto('/');

  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);

  const systemTheme = page.locator('[data-testid="theme-system"]:visible');
  if (!(await systemTheme.isVisible())) await page.getByTestId('more-menu').click();
  await page.locator('[data-testid="theme-system"]:visible').click();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);

  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
  expect(await page.evaluate(() => Number.parseFloat(getComputedStyle(document.body).fontSize))).toBeGreaterThanOrEqual(15);
  expect(hydrationErrors, 'theme initialization must not cause hydration errors').toEqual([]);
});
