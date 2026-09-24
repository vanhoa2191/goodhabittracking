import { expect, test } from '@playwright/test';

test('kid and parent modes use distinct readable shells', async ({ page }) => {
  // Given: a family is exploring the child experience.
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();

  // Then: the child shell is warm, uses the emotional display face, and has no sales CTA.
  const appSurface = page.getByTestId('app-surface');
  await expect(appSurface).toHaveAttribute('data-app-mode', 'kid');
  await expect(page.locator('header')).toHaveAttribute('data-app-shell', 'kid');
  await expect(page.getByRole('button', { name: 'PRO' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Nâng cấp Pro/i })).toHaveCount(0);

  const bodyFont = await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily);
  expect(bodyFont).toContain('Plus Jakarta Sans');
  const greetingFont = await page.getByRole('heading', { name: 'Nguyễn Minh An' })
    .evaluate((element) => getComputedStyle(element).fontFamily);
  expect(greetingFont).toContain('Fraunces');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.locator('header').evaluate((element) => ({
    position: getComputedStyle(element).position,
    top: Math.round(element.getBoundingClientRect().top),
  }))).toEqual({ position: 'sticky', top: 0 });

  // When: the parent unlocks the management area.
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }

  // Then: the parent shell is explicit and the subscription control is available there.
  await expect(appSurface).toHaveAttribute('data-app-mode', 'parent');
  await expect(page.locator('header')).toHaveAttribute('data-app-shell', 'parent');
  const proBadge = page.getByRole('button', { name: 'PRO', exact: true });
  if (await proBadge.isVisible()) {
    await expect(proBadge).toBeVisible();
  } else {
    await page.getByTestId('more-menu').click();
    await expect(page.getByRole('button', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' })).toBeVisible();
  }
});
