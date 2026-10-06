import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Runs against the static build served by scripts/preview-marketing.mjs (see the `marketing` project in
// playwright.config.ts). Build first: npm run build:marketing.

const offerRoute = '**/api/offers/launch';
const cors = { 'access-control-allow-origin': '*' };

test('the cycle switch changes the plan links and answers the arrow keys', async ({ page }) => {
  await page.goto('/');
  const soloLink = page.locator('[data-plan="solo"] [data-plan-cta]:visible');
  await expect(soloLink).toHaveAttribute('href', /plan=solo_yearly$/);

  const month = page.locator('[data-cycle-toggle] [role="radio"]', { hasText: 'Tháng' });
  await month.click();
  await expect(page.locator('#gia')).toHaveAttribute('data-pricing-cycle', 'month');
  await expect(soloLink).toHaveAttribute('href', /plan=solo_monthly$/);
  await expect(month).toHaveAttribute('aria-checked', 'true');

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#gia')).toHaveAttribute('data-pricing-cycle', 'year');
  await expect(soloLink).toHaveAttribute('href', /plan=solo_yearly$/);
});

test('choosing 2-5 kids recommends the Pro plan', async ({ page }) => {
  await page.goto('/');
  const pro = page.locator('[data-plan="pro"]');
  await expect(pro).not.toHaveClass(/recommended/);
  await page.locator('[data-kids] [role="radio"]', { hasText: '2–5 bé' }).click();
  await expect(pro).toHaveClass(/recommended/);
  await expect(page.locator('[data-plan="solo"]')).not.toHaveClass(/recommended/);
  await page.locator('[data-kids] [role="radio"]', { hasText: '1 bé' }).click();
  await expect(page.locator('[data-plan="solo"]')).toHaveClass(/recommended/);
});

test('the launch offer shows the live count, or nothing when the count is unavailable', async ({ page }) => {
  await page.route(offerRoute, (route) => route.fulfill({ status: 200, headers: cors, json: { code: 'launch', slots: 10, remaining: 3 } }));
  await page.goto('/');
  await expect(page.locator('[data-offer-remaining]')).toHaveText('Còn 3/10 suất');
});

test('the launch offer says it is gone when no places remain', async ({ page }) => {
  await page.route(offerRoute, (route) => route.fulfill({ status: 200, headers: cors, json: { code: 'launch', slots: 10, remaining: 0 } }));
  await page.goto('/');
  await expect(page.locator('[data-offer-remaining]')).toHaveText('Đã hết suất ưu đãi');
});

test('the launch offer shows no number when the count request fails', async ({ page }) => {
  let asked = false;
  await page.route(offerRoute, (route) => {
    asked = true;
    return route.fulfill({ status: 500, headers: cors, json: { error: 'down' } });
  });
  await page.goto('/');
  await expect.poll(() => asked).toBe(true);
  await expect(page.locator('[data-offer-remaining]')).toBeEmpty();
  await expect(page.locator('body')).not.toContainText('/10');
});

test('finishing the three demo tasks shows the stamp and the praise', async ({ page }) => {
  await page.goto('/');
  const stamp = page.locator('[data-demo-stamp]');
  await expect(stamp).toBeHidden();
  const tasks = page.locator('[data-demo-task]');
  for (let i = 0; i < 3; i += 1) await tasks.nth(i).click();
  await expect(stamp).toBeVisible();
  await expect(page.locator('[data-demo-praise]')).toBeVisible();
  await expect(page.locator('[data-demo-stars]')).toHaveText('20');
  await tasks.nth(0).click();
  await expect(stamp).toBeHidden();
});

test('the age tabs move with the arrow keys and show one panel', async ({ page }) => {
  await page.goto('/');
  const tabs = page.locator('[data-age-tab]');
  await tabs.nth(2).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-age-panel]:not([hidden])')).toHaveCount(1);
  await expect(page.locator('[data-age-panel="GD4"]')).toBeVisible();
});

test('the opening question rewrites the closing title, and tried cards count', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-quiz-option="mid"]').click();
  await expect(page.locator('[data-quiz-text="mid"]')).toBeVisible();
  await expect(page.locator('h2[data-final-title]')).toHaveText('Sáng mai, thử bớt một lần nhắc.');
  const tried = page.locator('[data-tried] .tried');
  await tried.nth(0).click();
  await tried.nth(1).click();
  await expect(tried.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-tried-n]')).toHaveText('2');
});

test('the chapter button opens the menu and follows the scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const pill = page.locator('[data-chapter-pill]');
  await pill.click();
  await expect(pill).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#chapter-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#chapter-menu')).toBeHidden();
  await page.locator('#gia').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-pill-name]')).toHaveText('Chọn gói');
});

test('the sticky bar shows for guests mid-story and hides over the plans', async ({ page }) => {
  await page.goto('/');
  const dock = page.locator('[data-dock]');
  await expect(dock).toBeHidden();
  await page.locator('#thu-lam-con').scrollIntoViewIfNeeded();
  await expect(dock).toBeVisible();
  await page.locator('#gia').scrollIntoViewIfNeeded();
  await expect(dock).toBeHidden();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all four checkout links and the yearly price are in the page', async ({ page }) => {
    await page.goto('/');
    for (const plan of ['solo_monthly', 'solo_yearly', 'monthly', 'yearly']) {
      await expect(page.locator(`a[href$="/checkout?plan=${plan}"]`).first()).toBeAttached();
    }
    await expect(page.getByText('399.000đ').first()).toBeVisible();
    const proPlus = page.locator('[data-plan="pro_plus"]');
    await expect(proPlus.getByText('790.000đ').first()).toBeVisible();
    await expect(proPlus.getByText('79.000đ').first()).toBeVisible();
  });
});

test('the page does not scroll sideways at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('everything is revealed and the counter reads 7', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/);
    await expect(page.locator('[data-nag-count]')).toHaveText('7');
    expect(await page.locator('.reveal:not(.is-in)').count()).toBe(0);
  });

  test('has no serious or critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });
});

test('the pricing page reveals its sections too', async ({ page }) => {
  await page.goto('/pricing/');
  await expect(page.locator('html')).toHaveAttribute('data-js', '');
  await expect(page.locator('.reveal').first()).toHaveClass(/is-in/);
});
