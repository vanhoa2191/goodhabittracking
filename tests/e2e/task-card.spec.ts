import { expect, test } from '@playwright/test';

test('the child task card keeps to the essentials and the labels are in the task details', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  // Bé Đậu's first habit carries all three teaching labels (parent role, 7 ways of giving, 16 portraits).
  await page.getByRole('button', { name: /Nguyễn Minh An/ }).click();
  await page.getByRole('button', { name: /Bé Đậu/ }).first().click();

  const card = page
    .getByRole('heading', { name: /Nụ cười rạng rỡ đón bé thức dậy/ })
    .locator('xpath=ancestor::*[@data-task-card][1]');
  await expect(card).toBeVisible();

  // On the card: the title, the reward, read aloud and the tick; not the three teaching labels.
  await expect(card.getByText('+15')).toBeVisible();
  await expect(card.getByText('🎁')).toHaveCount(0);
  await expect(card.getByText('✨')).toHaveCount(0);

  await card.getByRole('button', { name: /Xem chi tiết/ }).click();
  const details = page.getByRole('dialog', { name: 'Chi tiết nhiệm vụ' });
  const labels = details.getByTestId('task-detail-labels');
  await expect(labels).toBeVisible();
  await expect(labels).toContainText('🎁');
  await expect(labels).toContainText('✨');
});
