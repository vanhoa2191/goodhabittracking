import { expect, test } from '@playwright/test';

test('a child is congratulated automatically the moment a badge milestone is reached', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
  await expect(page.getByTestId('kid-hero')).toBeVisible();

  const celebration = page.getByTestId('badge-celebration');
  const openTasks = page.getByRole('button', { name: /^Mark task .* as complete$/ });
  // Nothing is celebrated just for opening the app: progress that already exists is recorded silently.
  await expect(celebration).toHaveCount(0);

  // A demo day holds six quests; walk back through earlier days until a milestone is crossed.
  for (let day = 0; day < 4 && await celebration.count() === 0; day += 1) {
    for (let attempts = 0; attempts < 8 && await celebration.count() === 0 && await openTasks.count() > 0; attempts += 1) {
      await openTasks.first().click();
      await page.waitForTimeout(150);
    }
    if (await celebration.count() === 0) await page.getByRole('button', { name: 'Previous day' }).click();
  }
  await expect(celebration).toBeVisible();
  const title = await celebration.getByRole('heading').textContent();
  // The very first quest ever completed earns the first badge straight away.
  expect(title).toBe('First Step');

  await celebration.getByRole('button', { name: 'See collection' }).click();
  await expect(celebration).toHaveCount(0);
  const unlocked = page.locator('[data-testid="badge-collection"] [data-unlocked="true"]');
  await expect(unlocked.filter({ hasText: title ?? '' })).toHaveCount(1);
  await expect(page.locator('[data-testid="badge-collection"] [data-unlocked="false"]').first()).toContainText(/\d+\/\d+/);
});
