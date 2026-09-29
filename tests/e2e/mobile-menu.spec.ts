import { expect, test } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';
import { setupOrUnlockParent } from './pin-helper';

const phones = [
  { name: '320px small phone', width: 320, height: 640 },
  { name: '360px Android', width: 360, height: 780 },
  { name: '390px iPhone', width: 390, height: 844 },
  { name: 'landscape phone', width: 740, height: 360 },
  { name: '1024px tablet', width: 1024, height: 768 },
] as const;

for (const phone of phones) {
  test(`the more menu stays fully inside the screen on a ${phone.name}`, async ({ page }) => {
    await page.setViewportSize({ width: phone.width, height: phone.height });
    await page.goto('/?demo=1');
    await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
    await setupOrUnlockParent(page);

    await page.getByTestId('more-menu').click();
    const panel = page.getByTestId('more-menu-panel');
    await expect(panel).toBeVisible();

    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(phone.width);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(phone.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(panel.getByRole('button', { name: /đóng|close/i })).toBeInViewport();
  });
}

test('every action in a tall menu can be scrolled to and used on a short screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 520 });
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.getByTestId('more-menu').click();

  const panel = page.getByTestId('more-menu-panel');
  const scrolls = await panel.evaluate((element) => element.scrollHeight > element.clientHeight);
  expect(scrolls).toBe(true);
  const last = panel.locator('button, a').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
});

test('a signed-in parent on a narrow phone can reach the whole menu, including sign out', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/account/profile', (route) => route.fulfill({
    status: 200,
    json: { profile: { display_name: 'Nguyễn An', email: 'parent@example.test', phone: '0912345678', marketing_consent: false } },
  }));
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await page.getByTestId('more-menu').click();

  const panel = page.getByTestId('more-menu-panel');
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  const signOut = panel.getByTitle(/đăng xuất|logout|sign out/i);
  await signOut.scrollIntoViewIfNeeded();
  await expect(signOut).toBeInViewport();
});

test('the backdrop and the close button both dismiss the menu', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/?demo=1');
  await page.getByTestId('more-menu').click();
  const panel = page.getByTestId('more-menu-panel');
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: /đóng|close/i }).click();
  await expect(panel).toHaveCount(0);

  await page.getByTestId('more-menu').click();
  await expect(panel).toBeVisible();
  await page.mouse.click(8, 500);
  await expect(panel).toHaveCount(0);
});
