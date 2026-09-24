import type { Locator, Page } from '@playwright/test';

export async function getVisiblePricingOpener(page: Page): Promise<Locator> {
  const badge = page.getByRole('button', { name: 'PRO', exact: true });
  if (await badge.isVisible()) return badge;

  await page.getByTestId('more-menu').click();
  return page.getByRole('button', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' });
}
