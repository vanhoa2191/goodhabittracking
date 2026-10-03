import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export type StoredCustomerProfile = { display_name: string; email: string; phone: string | null; marketing_consent: boolean };

export async function installCustomerProfileFixture(page: Page, initial: StoredCustomerProfile = { display_name: 'Nguyễn An', email: 'parent@example.test', phone: null, marketing_consent: false }) {
  let profile = { ...initial };
  const saves: Array<{ displayName: string; phone: string; marketingConsent: boolean }> = [];
  await page.route('**/api/account/profile', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: { profile } });
      return;
    }
    const body = route.request().postDataJSON() as { displayName: string; phone: string; marketingConsent: boolean };
    const digits = body.phone.replace(/\D/g, '').length;
    if (body.displayName.trim().length < 2 || !/^\+?[\d\s().-]+$/.test(body.phone) || digits < 9 || digits > 15) {
      await route.fulfill({ status: 400, json: { error: 'Invalid profile.' } });
      return;
    }
    saves.push(body);
    profile = { ...profile, display_name: body.displayName.trim(), phone: body.phone.trim().replace(/[\s().-]/g, ''), marketing_consent: body.marketingConsent };
    await route.fulfill({ status: 200, json: { success: true, profile } });
  });
  return { saves, current: () => profile };
}

export async function completeCheckoutProfile(dialog: Locator) {
  await expect(dialog.getByLabel('Họ và tên', { exact: true })).toHaveValue('Nguyễn An');
  await dialog.getByLabel('Số điện thoại', { exact: true }).fill('0912 345 678');
  await dialog.getByRole('button', { name: 'Lưu và tiếp tục' }).click();
  await expect(dialog.getByLabel('Số điện thoại', { exact: true })).toHaveCount(0);
}
