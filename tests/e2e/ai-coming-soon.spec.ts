import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

test('parents see that AI suggestions are coming, and nothing about them can be pressed', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?demo=1');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);

  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: /Cài đặt/ }).click();
  const card = page.getByTestId('ai-coming-soon-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Sắp ra mắt');
  await expect(card).toContainText('không bao giờ gửi tên hay nhật ký của bé');
  await expect(page.getByTestId('ai-consent-card')).toHaveCount(0);

  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Hôm nay' }).click();
  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: /Quản lý việc/ }).click();
  await page.getByRole('button', { name: /Thêm|Tạo/ }).first().click();
  const breakdown = page.getByTestId('ai-coming-soon-breakdown');
  await expect(breakdown).toBeVisible();
  await expect(breakdown).toBeDisabled();
  await expect(breakdown).toContainText('Sắp ra mắt');
});

test('the pricing dialog previews Pro Plus with its price for the chosen cycle and nothing to buy', async ({ page }) => {
  test.setTimeout(90_000);
  await page.route('**/api/offers/launch', (route) => route.fulfill({ status: 200, json: { code: 'pro_plus_founding', slots: 10, remaining: 7 } }));
  await page.goto('/?pricing=1');
  const card = page.getByTestId('upcoming-plans');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card).toHaveAttribute('data-plan', 'family_plus_yearly');
  await expect(card).toContainText('Sắp ra mắt');
  await expect(card).toContainText('Chưa mở bán');
  await expect(card).toContainText('790.000');
  await expect(card).toContainText('Huấn luyện viên thói quen');
  await expect(card.getByRole('button')).toHaveCount(0);
  await expect(card.getByRole('link')).toHaveCount(0);
  await expect(page.getByTestId('launch-offer-status')).toHaveText('Còn 7/10 suất');

  await page.getByRole('radio', { name: 'Tháng' }).click();
  await expect(card).toHaveAttribute('data-plan', 'family_plus_monthly');
  await expect(card).toContainText('79.000');
  // Pro Plus plus the two plans that can be bought.
  await expect(page.getByTestId('paid-plan-grid').locator('> div')).toHaveCount(3);
});

test('the launch offer shows no number when the count cannot be read, and says so when the places are gone', async ({ page }) => {
  test.setTimeout(90_000);
  await page.route('**/api/offers/launch', (route) => route.fulfill({ status: 503, json: { error: 'unavailable' } }));
  await page.goto('/?pricing=1');
  const strip = page.getByTestId('launch-offer');
  await expect(strip).toBeVisible({ timeout: 30_000 });
  await expect(strip).toContainText('10 gia đình đầu tiên');
  await expect(page.getByTestId('launch-offer-status')).toHaveCount(0);

  await page.unroute('**/api/offers/launch');
  await page.route('**/api/offers/launch', (route) => route.fulfill({ status: 200, json: { code: 'pro_plus_founding', slots: 10, remaining: 0 } }));
  await page.goto('/?pricing=1');
  await expect(page.getByTestId('launch-offer-status')).toHaveText('Đã hết suất ưu đãi');
});
