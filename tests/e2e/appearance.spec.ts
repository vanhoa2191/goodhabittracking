import { expect, test } from '@playwright/test';

test.use({ colorScheme: 'dark' });

test('new visitors start light and can follow the device preference', async ({ page }) => {
  const hydrationErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  await page.goto('/');
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'gateway');

  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);

  const systemTheme = page.locator('[data-testid="theme-system"]:visible');
  if (!(await systemTheme.isVisible())) await page.getByTestId('more-menu').click();
  await page.locator('[data-testid="theme-system"]:visible').click();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);

  await page.reload();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'gateway');
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
  expect(await page.evaluate(() => Number.parseFloat(getComputedStyle(document.body).fontSize))).toBeGreaterThanOrEqual(15);
  expect(hydrationErrors, 'theme initialization must not cause hydration errors').toEqual([]);
  expect(pageErrors, 'theme initialization and reload must not cause application errors').toEqual([]);
});
