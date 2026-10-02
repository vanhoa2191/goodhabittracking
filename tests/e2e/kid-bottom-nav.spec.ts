import { expect, test } from '@playwright/test';

test.describe('child bottom bar on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'The bottom bar only exists on a phone-width screen');

  test('stays at the bottom and brings the task list to the top of the screen in one tap', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-primary-action').click();
    await expect(page.getByRole('heading', { name: 'Nguyễn Minh An' })).toBeVisible();

    const bar = page.getByTestId('kid-bottom-nav');
    await expect(bar).toBeVisible();
    const viewport = page.viewportSize();
    const box = await bar.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBeGreaterThanOrEqual((viewport?.height ?? 0) - 1);

    await bar.getByRole('button', { name: /^Nhiệm vụ/ }).click();
    const firstTask = page.locator('[data-task-card]').first();
    await expect(firstTask).toBeInViewport();
    await expect(page.getByTestId('kid-hero')).not.toBeInViewport();

    await bar.getByRole('button', { name: 'Đổi quà', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Đổi quà', exact: true }).first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-task-card]')).toHaveCount(0);
  });

  test('counts what is left today on the tasks button', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-primary-action').click();
    const tasksButton = page.getByTestId('kid-bottom-nav').getByRole('button').first();
    await expect(tasksButton.locator('span[aria-hidden="true"]')).toHaveText(/^\d+$/);
  });
});

test('the in-page tabs still serve a wide screen and the bottom bar is hidden there', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Wide screens only');
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An' })).toBeVisible();
  await expect(page.getByTestId('kid-bottom-nav')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Đổi quà', exact: true })).toBeVisible();
});
