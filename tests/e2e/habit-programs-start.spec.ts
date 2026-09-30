import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

// Ends colour transitions at once so axe does not measure a colour halfway between two states.
test.use({ reducedMotion: 'reduce' });

test('a parent starts a program for a child in three steps and the habits arrive with their cues', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Quản lý việc' }).click();
  await page.getByRole('button', { name: 'Chương trình' }).click();

  const panel = page.getByTestId('habit-programs');
  await expect(panel).toBeVisible();
  const firstChild = panel.locator('[data-child-id]').first();
  await firstChild.getByTestId('program-start').first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Bước 1/3');
  const ticked = dialog.locator('input[type="checkbox"]:checked');
  const tickedCount = await ticked.count();
  expect(tickedCount).toBeGreaterThanOrEqual(1);
  expect(tickedCount).toBeLessThanOrEqual(2);

  await dialog.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(dialog).toContainText('Bước 2/3');
  await expect(dialog.getByRole('button', { name: 'Tiếp tục' })).toBeDisabled();
  const cueInputs = dialog.locator('input[data-cue-for]');
  for (let index = 0; index < tickedCount; index += 1) {
    await cueInputs.nth(index).fill(`Sau bữa tối, con làm việc ${index + 1}.`);
  }
  await dialog.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(dialog).toContainText('Bước 3/3');

  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);

  await dialog.getByTestId('program-confirm').click();
  await expect(page.getByTestId('program-started')).toBeVisible();
  await expect(page.getByTestId('program-started')).toBeFocused();
  await expect(page.getByTestId('open-cue-editor').filter({ hasText: '✓' })).toHaveCount(tickedCount);
});

test('the older journeys tab points to the new programs', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Lộ trình Tuần / Tháng' }).click();
  await expect(page.getByTestId('journeys-programs-note')).toContainText('Chương trình');
});

test('the programs view is hidden outside Vietnamese, where the habit library is not offered either', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: /^Parent/ }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Habits' }).click();
  await expect(page.getByRole('button', { name: 'Programs' })).toHaveCount(0);
});
