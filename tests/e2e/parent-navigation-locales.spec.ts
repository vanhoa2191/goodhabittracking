import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

const locales = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const;

test('the parent areas stay usable by keyboard at 375px in every supported language', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);

  for (const locale of locales) {
    const menuButton = page.getByTestId('more-menu');
    await menuButton.click();
    await page.getByTestId('more-menu-panel').getByRole('button', { name: new RegExp(`${locale.toUpperCase()}$`) }).click();
    await menuButton.click();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);

    const areas = page.locator('[role="tablist"]').filter({ has: page.locator('#parent-area-today') });
    await expect(areas.getByRole('tab')).toHaveCount(3);
    await areas.locator('#parent-area-family').click();
    await expect(page.locator('#parent-section-children')).toHaveAttribute('aria-selected', 'true');
    await areas.locator('#parent-area-family').focus();
    await page.keyboard.press('Home');
    await expect(areas.locator('#parent-area-today')).toHaveAttribute('aria-selected', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${locale} should fit 375px`).toBe(true);
    const taskHelp = page.locator('[data-help-topic="approvals.tasks"]');
    await expect(taskHelp).toBeVisible();
    const taskHelpBox = await taskHelp.boundingBox();
    expect(taskHelpBox, `${locale} task help trigger should have a box`).not.toBeNull();
    if (!taskHelpBox) throw new Error(`${locale} task help trigger should have a box`);
    expect(taskHelpBox.x, `${locale} task help trigger should not start off screen`).toBeGreaterThanOrEqual(0);
    expect(taskHelpBox.x + taskHelpBox.width, `${locale} task help trigger should stay inside 375px`).toBeLessThanOrEqual(375);
  }
});
