import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

// Ends colour transitions at once so axe does not measure a colour halfway between two states.
test.use({ reducedMotion: 'reduce' });

test('a parent sets a cue for a habit, then records how the child did it and sees where it stands', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();

  // The child completes one habit.
  const card = page.locator('[data-task-card]').first();
  const title = (await card.getByRole('heading').first().textContent())?.trim() ?? '';
  expect(title).not.toBe('');
  await card.getByRole('button', { name: /^Mark task .* as complete$/ }).click();
  await page.getByRole('button', { name: 'Awesome!' }).click();

  // The parent gives that habit a cue.
  await page.getByRole('button', { name: /^Parent/ }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Habits' }).click();
  const habitCard = page.locator('h4', { hasText: title }).first().locator('xpath=ancestor::div[.//button[@data-testid="open-cue-editor"]][1]');
  await habitCard.getByTestId('open-cue-editor').click();
  const editor = page.getByRole('dialog', { name: /^Cue for/ });
  await editor.getByLabel('The plan, in your child\'s words').fill('After brushing teeth, I do it');
  await editor.getByRole('button', { name: 'Save cue' }).click();
  await expect(editor).toHaveCount(0);
  await expect(habitCard.getByTestId('open-cue-editor')).toContainText('Cue set');

  // Back on Today, the parent says how it went and the habit shows up as one being set up.
  await page.getByRole('tab', { name: 'Today' }).click();
  const prompt = page.getByTestId('habit-support-prompt');
  await expect(prompt).toBeVisible();
  await prompt.getByRole('button', { name: 'On their own' }).first().click();
  await expect(prompt.getByRole('status').first()).toHaveText('Saved');

  const summary = page.getByTestId('habit-progress-summary');
  await expect(summary.locator('[data-phase="anchor"]')).toHaveCount(1);
  await expect(summary).toContainText('Setting the cue');

  // Both new panels are usable with assistive technology.
  const results = await new AxeBuilder({ page }).include('[data-testid="habit-support-prompt"]').include('[data-testid="habit-progress-summary"]').analyze();
  expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);
});

test('a cue that needs a time cannot be saved without one, and nothing is asked when no habit has a cue', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: /^Parent/ }).click();
  await setupOrUnlockParent(page);

  await expect(page.getByTestId('habit-support-prompt')).toHaveCount(0);
  await expect(page.getByTestId('habit-progress-summary')).toContainText('No habits have a cue yet');

  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Habits' }).click();
  await page.getByTestId('open-cue-editor').first().click();
  const editor = page.getByRole('dialog', { name: /^Cue for/ });
  await editor.getByLabel('At a fixed time').check();
  await editor.getByLabel('The plan, in your child\'s words').fill('At seven');
  await editor.getByLabel('Time of day').fill('');
  await editor.getByRole('button', { name: 'Save cue' }).click();
  await expect(editor.getByRole('alert')).toBeVisible();
  await expect(editor).toBeVisible();
});
