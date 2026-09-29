import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { getVisiblePricingOpener } from './open-pricing';
import { setupOrUnlockParent } from './pin-helper';

// The app honours prefers-reduced-motion by ending every colour transition at once. Without it,
// a slow runner can be measured by axe halfway between two colours and report a false contrast failure.
test.use({ reducedMotion: 'reduce' });

function seriousOrCritical(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
}

test('@a11y landing page has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious'
  );

  expect(blockingViolations).toEqual([]);
});

test('@a11y trial start entry has no serious or critical accessibility violations', async ({ page }) => {
  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
  await page.goto('/start');
  await expect(page.getByRole('button', { name: 'Đăng nhập bằng Google để bắt đầu' })).toBeVisible();
  expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});

test('@a11y child dashboard and task details have no serious or critical violations', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  await page.locator('[data-task-card]').first().getByRole('button', { name: /Xem chi tiết/ }).click();
  expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});

test('@a11y parent approvals, rewards and settings have no serious or critical violations', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);

  for (const destination of [
    { area: 'Hôm nay', section: 'Duyệt việc' },
    { area: 'Thiết kế', section: 'Đổi quà' },
    { area: 'Gia đình', section: 'Cài đặt' },
  ]) {
    await page.getByRole('tab', { name: destination.area }).click();
    await page.getByRole('tab', { name: destination.section }).click();
    expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
  }
});

test('@a11y pricing dialog traps focus, closes with Escape, and restores focus', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);

  const opener = await getVisiblePricingOpener(page);
  await opener.focus();
  await opener.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('@a11y document language follows the selected locale', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

const locales = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const;

for (const locale of locales) {
  test(`@a11y ${locale} renders without application errors or horizontal overflow`, async ({ page, baseURL }) => {
    const applicationUrl = new URL(baseURL ?? 'http://127.0.0.1:3000').origin;
    await page.context().addCookies([{
      name: 'kidhabit_language',
      value: locale,
      url: applicationUrl,
    }]);
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByText(/application error/i)).toHaveCount(0);
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasHorizontalOverflow, `${locale} should fit the viewport`).toBe(false);
  });
}
