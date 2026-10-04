import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';
import { setupOrUnlockParent } from './pin-helper';

// Same setup as accessibility.spec.ts: reduced motion ends every colour transition at once, so a slow
// runner cannot be measured by axe halfway between two colours and report a false contrast failure.
test.use({ reducedMotion: 'reduce' });

function seriousOrCritical(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
}

async function expectNoSeriousViolations(page: Page) {
  expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
}

async function openKidDemo(page: Page) {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An' })).toBeVisible();
}

async function openParentDemo(page: Page) {
  await openKidDemo(page);
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
}

test.describe('header dropdowns (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'The header dropdowns only exist from 1280px up');

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('@a11y the child switcher menu is named, announced and free of serious violations', async ({ page }) => {
    await openParentDemo(page);
    const trigger = page.locator('header').getByRole('button', { name: /Nguyễn Minh An/ });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAccessibleName(/\S/);
    await expect(menu.getByRole('menuitemradio').first()).toBeVisible();
    await expect(menu.getByRole('menuitemradio', { checked: true })).toHaveCount(1);
    await expectNoSeriousViolations(page);
  });

  test('the child switcher opens from the keyboard, moves with the arrows and gives focus back on Escape', async ({ page }) => {
    await openParentDemo(page);
    const trigger = page.locator('header').getByRole('button', { name: /Nguyễn Minh An/ });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const items = page.getByRole('menu').getByRole('menuitemradio');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    const checkedIndex = await items.evaluateAll((nodes) => nodes.findIndex((node) => node.getAttribute('aria-checked') === 'true'));
    await expect(items.nth(checkedIndex)).toBeFocused();

    if (count > 1) {
      const next = (checkedIndex + 1) % count;
      await page.keyboard.press('ArrowDown');
      await expect(items.nth(next)).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await expect(items.nth(checkedIndex)).toBeFocused();
    }

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('@a11y the language menu is named, announced and free of serious violations', async ({ page }) => {
    await openParentDemo(page);
    const trigger = page.locator('header').getByRole('button', { name: 'Tiếng Việt', exact: true });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = page.getByRole('menu', { name: 'Ngôn ngữ hiển thị' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitemradio')).toHaveCount(9);
    await expect(menu.getByRole('menuitemradio', { checked: true })).toHaveCount(1);
    await expectNoSeriousViolations(page);
  });

  test('the language menu moves with Down and Up, wraps around and gives focus back on Escape', async ({ page }) => {
    await openParentDemo(page);
    const trigger = page.locator('header').getByRole('button', { name: 'Tiếng Việt', exact: true });
    await trigger.focus();
    await page.keyboard.press('ArrowUp');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const items = page.getByRole('menu', { name: 'Ngôn ngữ hiển thị' }).getByRole('menuitemradio');
    await expect(items.first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(2)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(items.first()).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(items.last()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('"more" menu', () => {
  test('@a11y the open "more" menu is a named dialog and has no serious or critical violations', async ({ page }) => {
    await openParentDemo(page);
    const opener = page.getByTestId('more-menu');
    await expect(opener).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(opener).toHaveAttribute('aria-expanded', 'false');
    await opener.click();
    await expect(opener).toHaveAttribute('aria-expanded', 'true');

    const panel = page.getByTestId('more-menu-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveRole('dialog');
    await expect(panel).toHaveAccessibleName(/\S/);
    await expectNoSeriousViolations(page);
  });

  test('@a11y the "more" menu stays free of serious violations once the folded "Thêm" section is open', async ({ page }) => {
    await openParentDemo(page);
    await page.getByTestId('more-menu').click();
    const panel = page.getByTestId('more-menu-panel');
    const more = panel.getByTestId('more-menu-more');
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.getByRole('button', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' })).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('@a11y the "more" menu is free of serious violations on the child screen too', async ({ page }) => {
    await openKidDemo(page);
    await page.getByTestId('more-menu').click();
    await expect(page.getByTestId('more-menu-panel')).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('the "more" menu closes on Escape, gives focus back and flips aria-expanded', async ({ page }) => {
    await openParentDemo(page);
    const opener = page.getByTestId('more-menu');
    await opener.focus();
    await page.keyboard.press('Enter');
    await expect(opener).toHaveAttribute('aria-expanded', 'true');
    const panel = page.getByTestId('more-menu-panel');
    await expect(panel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(opener).toHaveAttribute('aria-expanded', 'false');
  });

  test('the folded "Thêm" section opens and closes from the keyboard with aria-expanded following', async ({ page }) => {
    await openParentDemo(page);
    await page.getByTestId('more-menu').click();
    const more = page.getByTestId('more-menu-panel').getByTestId('more-menu-more');
    await more.focus();
    await page.keyboard.press('Enter');
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(more).toHaveAttribute('aria-controls', /\S/);
    await page.keyboard.press('Space');
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await expect(more).toBeFocused();
  });
});

test.describe('child navigation', () => {
  test('@a11y the child bottom bar has no serious or critical violations', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The bottom bar only exists below 640px');
    await openKidDemo(page);
    const bar = page.getByTestId('kid-bottom-nav');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAccessibleName(/\S/);
    await expect(bar.getByRole('button').first()).toHaveAttribute('aria-pressed', /true|false/);
    await expectNoSeriousViolations(page);
  });

  test('@a11y the child bottom bar stays free of serious violations while the tasks button nudges', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The bottom bar only exists below 640px');
    await openKidDemo(page);
    const bar = page.getByTestId('kid-bottom-nav');
    const tasksButton = bar.getByRole('button', { name: /^Nhiệm vụ/ });
    // The nudge shows while the tasks tab is selected, tasks are still due and the top of the list has scrolled out of view.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(tasksButton).toHaveAttribute('data-nudge', 'true');
    await expectNoSeriousViolations(page);
  });

  test('@a11y the child tabs on a wide screen have no serious or critical violations', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The in-page tabs are hidden below 640px');
    await page.setViewportSize({ width: 1280, height: 800 });
    await openKidDemo(page);
    const tabs = page.getByTestId('kid-tabs');
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole('button', { name: 'Đổi quà', exact: true })).toBeVisible();
    await expectNoSeriousViolations(page);

    await tabs.getByRole('button', { name: 'Đổi quà', exact: true }).click();
    await expect(tabs.getByRole('button', { name: 'Đổi quà', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expectNoSeriousViolations(page);
  });
});

test('@a11y the offers and referral group in parent settings has no serious or critical violations', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/account/profile', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ profile: { display_name: 'Nguyễn An', email: 'parent@example.test', phone: '0912345678', marketing_consent: false } }),
  }));
  await page.route('**/api/affiliate', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      enabled: true,
      enrolled: false,
      settings: { commissionBps: 3000, attributionDays: 30, earningWindowDays: 365, holdDays: 14, minPayout: 200000 },
    }),
  }));

  await page.goto('/');
  await page.locator('#parent-area-family').click();
  await page.locator('#parent-section-settings').click();
  const offers = page.locator('#settings-offers');
  await offers.scrollIntoViewIfNeeded();
  await expect(offers).toBeVisible();
  await expect(page.getByTestId('affiliate-card')).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('@a11y the opened "is this the child\'s device?" block on the entry gate has no serious or critical violations', async ({ page }) => {
  await page.goto('/');
  const block = page.getByTestId('gate-child-block');
  const toggle = page.getByTestId('gate-child-block-toggle');
  await expect(block).toBeVisible();
  await expect(block).not.toHaveJSProperty('open', true);

  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(block).toHaveJSProperty('open', true);
  await expect(page.getByTestId('gate-child-open')).toBeVisible();
  await expectNoSeriousViolations(page);

  await page.keyboard.press('Enter');
  await expect(block).toHaveJSProperty('open', false);
  await expect(toggle).toBeFocused();
});
