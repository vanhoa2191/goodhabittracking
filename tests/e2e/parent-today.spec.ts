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

  await expect(page.getByRole('heading', { name: 'Cần ba mẹ làm' })).toBeVisible();
  await expect(page.getByTestId('habit-progress-summary')).toContainText('Chưa có thói quen nào đang xây');
  await page.getByTestId('habit-progress-empty-cta').click();
  await expect(page.getByRole('tab', { name: /Quản lý việc/ })).toHaveAttribute('aria-selected', 'true');
});
