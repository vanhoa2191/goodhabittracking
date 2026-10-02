import type { Page } from '@playwright/test';

export async function setupOrUnlockParent(page: Page, pin = '1234'): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /PIN/i });
  for (const digit of pin) {
    await dialog.getByRole('button', { name: digit, exact: true }).click();
  }
  const requiresConfirmation = await page
    .getByRole('heading', { name: /Nhập lại mã PIN|Confirm new PIN|Enter the new PIN again/i })
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);
  if (requiresConfirmation) {
    for (const digit of pin) {
      await dialog.getByRole('button', { name: digit, exact: true }).click();
    }
  }
}
