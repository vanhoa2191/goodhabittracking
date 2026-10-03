import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

test('the parent Today screen follows one child at a time and invites a first cue when none is set', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);

  const chips = page.getByRole('group', { name: 'Chọn bé' });
  await expect(chips.getByRole('button')).toHaveCount(3);
  const card = page.getByTestId('parent-today-card');
  await expect(card).toContainText('Hôm nay của Bé An');
  await chips.getByRole('button', { name: /Bé Mai/ }).click();
  await expect(card).toContainText('Hôm nay của Bé Mai');
  await expect(chips.getByRole('button', { name: /Bé Mai/ })).toHaveAttribute('aria-pressed', 'true');

  await expect(page.getByRole('heading', { name: /Cần ba mẹ làm|Cần bạn xử lý/ })).toBeVisible();
  await expect(page.getByTestId('habit-progress-summary')).toContainText('Chưa có thói quen nào đang xây');
  await page.getByTestId('habit-progress-empty-cta').click();
  await expect(page.getByRole('tab', { name: /Quản lý việc/ })).toHaveAttribute('aria-selected', 'true');
});

test('the Needs you strip lists what waits and the batch bar stays idle until something is ticked', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?demo=1');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);

  const strip = page.getByTestId('parent-action-strip');
  await expect(strip.getByRole('heading', { name: 'Cần bạn xử lý' })).toBeVisible();
  await expect(strip).toContainText(/Hiện không có việc nào|Duyệt \d+ việc của bé|Xem \d+ gợi ý/);
  await expect(page.getByText(/Nhiệm vụ chờ bố mẹ duyệt \(\d+\)/)).toBeVisible();
  if (await page.getByTestId('bulk-approve').count()) {
    await expect(page.getByTestId('bulk-approve')).toBeDisabled();
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  }
});

test('the parent Today card leads with a steady weekly rhythm', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?demo=1');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await expect(page.getByTestId('week-rhythm')).toHaveText(/^\d\/7 ngày tuần này$/);

});
