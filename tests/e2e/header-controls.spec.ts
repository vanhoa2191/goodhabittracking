import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

async function openParent(page: import('@playwright/test').Page) {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
}

for (const width of [1280, 1440]) {
  test(`at ${width}px the language, text size, sound and theme controls are in the header, not behind the menu`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openParent(page);
    const header = page.locator('header');
    await expect(header.getByTestId('sound-toggle')).toBeVisible();
    await expect(header.getByRole('button', { name: /Aa/ })).toBeVisible();
    await expect(header.getByRole('button', { expanded: false, name: /Tiếng Việt|VI/i }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll').toBe(true);
  });
}

test('the "more" menu is a dialog: it traps focus, closes on Escape and gives focus back to its button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await openParent(page);
  const opener = page.getByTestId('more-menu');
  await expect(opener).toHaveAttribute('aria-expanded', 'false');
  await opener.click();
  await expect(opener).toHaveAttribute('aria-expanded', 'true');

  const menu = page.getByRole('dialog', { name: /Menu|Thêm|More/i });
  await expect(menu).toBeVisible();
  const close = menu.getByRole('button', { name: /Đóng|Close/ });
  const box = await close.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(43.5);
  expect(box!.height).toBeGreaterThanOrEqual(43.5);

  for (let press = 0; press < 12; press += 1) await page.keyboard.press('Tab');
  expect(await menu.evaluate((node) => node.contains(document.activeElement)), 'focus stays inside the menu').toBe(true);

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute('aria-expanded', 'false');
});

test('the parent-mode button says where it leads', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openParent(page);
  await expect(page.locator('header').getByRole('button', { name: 'Về màn hình của bé' })).toBeVisible();
});

test('the language menu opens from the keyboard, moves with the arrows and gives focus back on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openParent(page);
  const trigger = page.locator('header').getByRole('button', { name: 'Tiếng Việt', exact: true });
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const menu = page.getByRole('menu', { name: 'Ngôn ngữ hiển thị' });
  const items = menu.getByRole('menuitemradio');
  await expect(items).toHaveCount(9);
  await expect(menu.getByRole('menuitemradio', { checked: true })).toHaveCount(1);
  await expect(items.first()).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(items.last()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.first()).toBeFocused();
  for (const index of Array.from({ length: 9 }, (_, item) => item)) {
    expect((await items.nth(index).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
  }

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(menu).toHaveCount(0);
  await expect(page.locator('header').getByRole('button', { name: 'English', exact: true })).toBeFocused();
});

test('pressing outside the language menu closes it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openParent(page);
  const trigger = page.locator('header').getByRole('button', { name: 'Tiếng Việt', exact: true });
  await trigger.click();
  const menu = page.getByRole('menu', { name: 'Ngôn ngữ hiển thị' });
  await expect(menu).toBeVisible();
  await page.locator('header').click({ position: { x: 6, y: 32 } });
  await expect(menu).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('the "more" menu keeps everyday settings in view and folds the rest behind "Thêm"', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await openParent(page);
  await page.getByTestId('more-menu').click();
  const menu = page.getByTestId('more-menu-panel');

  await expect(menu.getByRole('group', { name: 'Tài khoản', exact: true })).toBeVisible();
  await expect(menu.getByRole('group', { name: 'Cài đặt nhanh', exact: true })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Tài liệu sử dụng' })).toBeVisible();

  const more = menu.getByTestId('more-menu-more');
  const pricing = menu.getByRole('button', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(pricing).toHaveCount(0);

  await more.click();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(pricing).toBeVisible();
  await expect(menu.getByRole('button', { name: /Cẩm nang/ })).toBeVisible();

  const rows = [
    more,
    pricing,
    menu.getByRole('link', { name: 'Tài liệu sử dụng' }),
    menu.getByRole('button', { name: /Kích thước chữ/ }),
    ...(await menu.getByRole('group', { name: /Ngôn ngữ hiển thị/ }).getByRole('button').all()),
  ];
  for (const row of rows) {
    await row.scrollIntoViewIfNeeded();
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
  }

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await page.getByTestId('more-menu').click();
  await expect(menu.getByTestId('more-menu-more')).toHaveAttribute('aria-expanded', 'false');
});
