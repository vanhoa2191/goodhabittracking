import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@a11y landing page has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious'
  );

  expect(blockingViolations).toEqual([]);
});

test('@a11y pricing dialog traps focus, closes with Escape, and restores focus', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();

  const opener = page.getByRole('button', { name: 'PRO' });
  await opener.focus();
  await opener.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('@a11y document language follows the selected locale', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('@a11y every supported locale renders without application errors or horizontal overflow', async ({ page }) => {
  const locales = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const;

  for (const locale of locales) {
    await page.goto('/');
    await page.evaluate((nextLocale) => localStorage.setItem('kidhabit_language', nextLocale), locale);
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByText(/application error/i)).toHaveCount(0);
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasHorizontalOverflow, `${locale} should fit the viewport`).toBe(false);
  }
});
