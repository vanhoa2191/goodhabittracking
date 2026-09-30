import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

async function startAsChild(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
}

const openLeaderboard = async (page: Page) => page.getByRole('button', { name: /Leaderboard/ }).first().click();
const pickScope = (page: Page, name: RegExp) => page.getByRole('button', { name }).first().click();
const rowPoints = async (page: Page) => (await page.getByTestId('leaderboard-row').evaluateAll((rows) => rows.map((row) => Number((row as HTMLElement).dataset.points))));

test('the leaderboard opens on the global board, says plainly that it needs a connected family, and invents no points', async ({ page }) => {
  test.setTimeout(90_000);
  await startAsChild(page);
  await openLeaderboard(page);

  await expect(page.getByTestId('leaderboard-needs-account')).toBeVisible();
  await expect(page.getByTestId('leaderboard-row')).toHaveCount(0);

  await pickScope(page, /Family/);
  await expect(page.getByTestId('leaderboard-row').first()).toBeVisible();
  for (const period of [/Today/, /This Week/, /This Month/]) {
    await page.getByRole('button', { name: period }).first().click();
    expect((await rowPoints(page)).every((points) => points === 0)).toBe(true);
  }
});

test('the family board shows exactly what was earned, in the same amount for today, this week and this month', async ({ page }) => {
  test.setTimeout(90_000);
  await startAsChild(page);
  const card = page.locator('[data-task-card]').first();
  const earned = Number(((await card.textContent()) ?? '').match(/\+(\d+)/)?.[1]);
  expect(earned).toBeGreaterThan(0);
  await card.getByRole('button', { name: /^Mark task .* as complete$/ }).click();
  await page.getByRole('button', { name: 'Awesome!' }).click();

  await openLeaderboard(page);
  await pickScope(page, /Family/);
  for (const period of [/Today/, /This Week/, /This Month/]) {
    await page.getByRole('button', { name: period }).first().click();
    await expect.poll(async () => (await rowPoints(page)).includes(earned)).toBe(true);
    expect((await rowPoints(page)).filter((points) => points > 0)).toEqual([earned]);
  }
  await expect(page.locator('[data-testid="leaderboard-row"][data-current="true"]')).toHaveAttribute('data-points', String(earned));
});

test('the group board lists the children of the child\'s groups, and the group cards count only children who exist', async ({ page }) => {
  await startAsChild(page);
  await openLeaderboard(page);
  await pickScope(page, /Squad \/ Clan/);
  await expect(page.getByTestId('leaderboard-group-empty')).toHaveCount(0);
  expect(await page.getByTestId('leaderboard-row').count()).toBeGreaterThanOrEqual(2);
  const groupText = (await page.locator('body').innerText());
  expect(groupText).not.toMatch(/\b4 (members|thành viên)\b/i);
});
