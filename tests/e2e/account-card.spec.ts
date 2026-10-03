import { expect, test } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';

const completeProfile = { display_name: 'Nguyễn An', email: 'parent@example.test', phone: '0912345678', marketing_consent: false };

async function openAccountSection(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('#parent-area-family').click();
  await page.locator('#parent-section-settings').click();
  await page.locator('#settings-account').scrollIntoViewIfNeeded();
}

test('the account card says so when it cannot load, and Try again brings the form back', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  let healthy = false;
  await page.route('**/api/account/profile', (route) => healthy
    ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profile: completeProfile }) })
    : route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'down' }) }));

  await openAccountSection(page);
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Thông tin khách hàng' }) });
  await expect(card.getByRole('alert')).toContainText('Chưa tải được thông tin');
  await expect(card.getByLabel('Họ và tên')).toHaveCount(0);

  healthy = true;
  await card.getByRole('button', { name: 'Thử lại' }).click();
  await expect(card.getByLabel('Họ và tên')).toHaveValue('Nguyễn An');
  await expect(card.getByRole('alert')).toHaveCount(0);
});

test('a dropped connection while saving ends in an error, not in "Đang lưu…" for ever, and the button works again', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/account/profile', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profile: completeProfile }) });
    }
    return route.abort('connectionreset');
  });

  await openAccountSection(page);
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Thông tin khách hàng' }) });
  const save = card.getByRole('button', { name: /^(Lưu thông tin|Đang lưu…)$/ });
  await save.click();
  await expect(card.getByRole('alert')).toContainText('Chưa lưu được');
  await expect(card.getByRole('button', { name: 'Lưu thông tin', exact: true })).toBeEnabled();
  await expect(card.getByText('Đang lưu…')).toHaveCount(0);
});

test('redeeming needs a code, and a failed request reports instead of staying silent', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/account/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profile: completeProfile }) }));
  await page.route('**/api/coupons/redeem', (route) => route.abort('connectionreset'));

  await openAccountSection(page);
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Thông tin khách hàng' }) });
  const redeem = card.getByRole('button', { name: 'Áp dụng mã' });
  await expect(redeem).toBeDisabled();
  await card.getByLabel('Mã coupon').fill('ABC123');
  await expect(redeem).toBeEnabled();
  await redeem.click();
  await expect(card.getByRole('alert')).toBeVisible();
});

test('referral and affiliate cards sit in their own offers group after the PIN group', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/account/profile', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profile: completeProfile }) }));

  await openAccountSection(page);
  const nav = page.getByRole('navigation', { name: 'Nhóm cài đặt' });
  await expect(nav.getByRole('link', { name: 'Ưu đãi & giới thiệu' })).toHaveAttribute('href', '#settings-offers');
  const order = await page.evaluate(() => {
    const top = (id: string) => document.getElementById(id)?.getBoundingClientRect().top ?? Number.NaN;
    return { security: top('settings-security'), offers: top('settings-offers') };
  });
  expect(order.offers).toBeGreaterThan(order.security);
});
