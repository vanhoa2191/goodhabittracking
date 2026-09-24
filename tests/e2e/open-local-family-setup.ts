import type { Page } from '@playwright/test';

export async function openLocalFamilySetup(
  page: Page,
  buttonName = 'Thiết lập trên thiết bị này',
): Promise<void> {
  await page.locator('main details').first().locator('summary').click();
  await page.getByRole('button', { name: buttonName }).click();
}
