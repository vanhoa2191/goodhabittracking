import { expect, test } from '@playwright/test';

test.describe('child looks back at earlier days', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-primary-action').click();
    await expect(page.getByTestId('kid-hero')).toBeVisible();
  });

  const previous = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^(Ngày trước|Previous day)$/ });
  const next = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^(Ngày tiếp theo|Next day)$/ });

  test('cannot go past today', async ({ page }) => {
    await expect(next(page)).toBeDisabled();
    await expect(previous(page)).toBeEnabled();
    await expect(page.getByTestId('kid-history-note')).toHaveCount(0);
  });

  test('an earlier day is only for looking: no tick, no put-off, a history line instead', async ({ page }) => {
    const todayCards = page.locator('[data-task-card]');
    await expect(todayCards.first()).toBeVisible();
    await expect(todayCards.first().locator('[data-task-toggle]')).toHaveCount(1);
    const heroProgress = await page.getByTestId('kid-hero').textContent();

    await previous(page).click();

    const note = page.getByTestId('kid-history-note');
    await expect(note).toContainText(/Đây là lịch sử|This is history/);
    await expect(next(page)).toBeEnabled();
    const cards = page.locator('[data-task-card]');
    await expect(cards.first()).toBeVisible();
    await expect(page.locator('[data-task-card] [data-task-toggle]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^(Đánh dấu|Bỏ đánh dấu|Mark task)/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^(Để sau|Làm ngay|Do later|Do now)$/ })).toHaveCount(0);
    await expect(page.getByTestId('swipe-hint')).toHaveCount(0);
    await expect(page.locator('[data-task-card] [data-task-status]').first()).toBeVisible();
    expect(await page.getByTestId('kid-hero').textContent()).toBe(heroProgress);

    await next(page).click();
    await expect(page.getByTestId('kid-history-note')).toHaveCount(0);
    await expect(page.locator('[data-task-card] [data-task-toggle]').first()).toBeVisible();
  });

  test('goes back at most seven days', async ({ page }) => {
    for (let step = 0; step < 7; step += 1) {
      await expect(previous(page)).toBeEnabled();
      await previous(page).click();
    }
    await expect(previous(page)).toBeDisabled();
    await expect(page.getByTestId('kid-history-note')).toBeVisible();
    await expect(page.locator('[data-task-card] [data-task-toggle]')).toHaveCount(0);
  });
});
