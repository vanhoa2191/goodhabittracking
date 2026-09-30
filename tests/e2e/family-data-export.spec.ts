import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

test('a parent downloads a copy of the family data without the PIN or plan, and cannot restore over cloud data', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: /^Parent/ }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tab', { name: 'Family' }).click();
  await page.getByRole('tab', { name: 'Settings' }).click();

  const card = page.getByTestId('family-data');
  await expect(card).toBeVisible();
  await expect(card.getByTestId('family-data-import')).toHaveCount(0);
  await expect(card).toContainText('already stored on the server');

  const download = page.waitForEvent('download');
  await card.getByTestId('family-data-export').click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^kidhabit-family-\d{4}-\d{2}-\d{2}\.json$/);
  const backup = JSON.parse(await readFile((await file.path())!, 'utf8'));
  expect(backup.version).toBe(2);
  expect(backup.profiles.length).toBeGreaterThan(0);
  expect(backup.activities.length).toBeGreaterThan(0);
  expect(backup.experience).toBeTruthy();
  for (const forbidden of ['pin', 'subscriptionPlan', 'trialEndsAt', 'subscriptionEndsAt']) expect(backup, forbidden).not.toHaveProperty(forbidden);
  await expect(card.getByRole('status')).toContainText('The file was created');
});
