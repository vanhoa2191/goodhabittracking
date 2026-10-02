import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

// Ends colour transitions at once so axe does not measure a colour halfway between two states.
test.use({ reducedMotion: 'reduce' });

async function startAsChild(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
}

async function giveFirstHabitACue(page: Page, title: string, cue: string) {
  await page.getByRole('button', { name: /^Parent/ }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Habits' }).click();
  const habitCard = page.locator('h4', { hasText: title }).first().locator('xpath=ancestor::div[.//button[@data-testid="open-cue-editor"]][1]');
  await habitCard.getByTestId('open-cue-editor').click();
  const editor = page.getByRole('dialog', { name: /^Cue for/ });
  await editor.getByLabel('The plan, in your child\'s words').fill(cue);
  await editor.getByRole('button', { name: 'Save cue' }).click();
  await expect(editor).toHaveCount(0);
}

async function backToChild(page: Page) {
  await page.getByRole('button', { name: 'Back to child screen' }).click();
  await expect(page.locator('[data-task-card]').first()).toBeVisible();
}

test('a child sees the family\'s cue on the task, and a young child is never asked how it went', async ({ page }) => {
  test.setTimeout(90_000);
  await startAsChild(page);
  const card = page.locator('[data-task-card]').first();
  const title = (await card.getByRole('heading').first().textContent())?.trim() ?? '';
  await expect(card.getByTestId('child-cue-line')).toHaveCount(0);

  await giveFirstHabitACue(page, title, 'After brushing teeth, I do it');
  await backToChild(page);
  const cue = page.locator('[data-task-card]', { hasText: title }).first().getByTestId('child-cue-line');
  await expect(cue).toHaveText('After brushing teeth, I do it');

  await page.locator('[data-task-card]', { hasText: title }).first().getByRole('button', { name: /^Mark task .* as complete$/ }).click();
  await page.getByRole('button', { name: 'Awesome!' }).click();
  await expect(page.getByTestId('child-self-report')).toHaveCount(0);
});

test('a child of 15 can say how the habit went, or skip it without losing the completion', async ({ page }) => {
  test.setTimeout(90_000);
  await startAsChild(page);
  const title = (await page.locator('[data-task-card]').first().getByRole('heading').first().textContent())?.trim() ?? '';
  await giveFirstHabitACue(page, title, 'After school, I do it');
  await backToChild(page);

  // The demo child becomes 15 years old.
  await page.evaluate(() => {
    const snapshot = JSON.parse(sessionStorage.getItem('kidhabit_demo_state') || '{}');
    snapshot.profiles = snapshot.profiles.map((profile: Record<string, unknown>) => ({ ...profile, age: 15, birthYear: 2011, ageStage: '12-18' }));
    sessionStorage.setItem('kidhabit_demo_state', JSON.stringify(snapshot));
  });
  await page.reload();

  const card = page.locator('[data-task-card]', { hasText: title }).first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: /^Mark task .* as complete$/ }).click();
  const awesome = page.getByRole('button', { name: 'Awesome!' });
  if (await awesome.isVisible().catch(() => false)) await awesome.click();

  const prompt = page.getByTestId('child-self-report');
  await expect(prompt).toBeVisible();
  await expect(prompt.getByRole('group')).toBeVisible();
  await expect(prompt.getByTestId('child-self-report-habit')).toHaveText(title);
  await prompt.getByRole('button', { name: 'I did it myself' }).click();
  await expect(prompt.getByRole('status')).toHaveText('Saved. Thank you!');
  await expect(prompt.getByRole('status')).toBeFocused();

  const results = await new AxeBuilder({ page }).include('[data-testid="child-self-report"]').analyze();
  expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);

  await expect(page.locator('[data-task-card]', { hasText: title }).first()).toHaveAttribute('data-complete', 'true');
});

test('skipping the question keeps the habit completed and asks nothing more', async ({ page }) => {
  test.setTimeout(90_000);
  await startAsChild(page);
  const title = (await page.locator('[data-task-card]').first().getByRole('heading').first().textContent())?.trim() ?? '';
  await giveFirstHabitACue(page, title, 'After school, I do it');
  await backToChild(page);
  await page.evaluate(() => {
    const snapshot = JSON.parse(sessionStorage.getItem('kidhabit_demo_state') || '{}');
    snapshot.profiles = snapshot.profiles.map((profile: Record<string, unknown>) => ({ ...profile, age: 16, birthYear: 2010, ageStage: '12-18' }));
    sessionStorage.setItem('kidhabit_demo_state', JSON.stringify(snapshot));
  });
  await page.reload();

  const card = page.locator('[data-task-card]', { hasText: title }).first();
  await card.getByRole('button', { name: /^Mark task .* as complete$/ }).click();
  const awesome = page.getByRole('button', { name: 'Awesome!' });
  if (await awesome.isVisible().catch(() => false)) await awesome.click();

  await page.getByTestId('child-self-report-skip').click();
  await expect(page.getByTestId('child-self-report')).toHaveCount(0);
  await expect(page.locator('[data-task-card]', { hasText: title }).first()).toHaveAttribute('data-complete', 'true');
});
