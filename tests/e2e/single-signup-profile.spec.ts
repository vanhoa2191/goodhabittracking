import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';

const freePlan = { plan: 'free', status: 'active', trial_ends_at: null, subscription_ends_at: null };
const promptName = 'Hoàn thiện thông tin khách hàng';

type StoredProfile = { display_name: string; email: string; phone: string | null; marketing_consent: boolean };

// Mirrors the server contract: a real phone number is required and stored compactly.
async function mockAccountProfile(page: Page, initial: StoredProfile) {
  let profile = { ...initial };
  const saves: Array<{ displayName: string; phone: string; marketingConsent: boolean }> = [];
  await page.route('**/api/account/profile', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: { profile } });
      return;
    }
    const body = route.request().postDataJSON() as { displayName: string; phone?: string; marketingConsent: boolean };
    const digits = (body.phone ?? '').replace(/\D/g, '').length;
    if (digits < 9 || digits > 15) {
      await route.fulfill({ status: 400, json: { error: 'Invalid profile.' } });
      return;
    }
    saves.push({ displayName: body.displayName, phone: body.phone ?? '', marketingConsent: body.marketingConsent });
    profile = { ...profile, display_name: body.displayName, phone: (body.phone ?? '').replace(/[\s().-]/g, ''), marketing_consent: body.marketingConsent };
    await route.fulfill({ status: 200, json: { success: true, profile } });
  });
  return { saves, current: () => profile };
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
});

test('a new parent enters their details once, and the phone number is required', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { profiles: [], subscription: freePlan });
  const account = await mockAccountProfile(page, { display_name: 'Nguyễn An', email: 'parent@example.test', phone: null, marketing_consent: false });
  await page.goto('/start');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const phone = dialog.locator('#onboarding-parent-phone');
  await expect(phone).toHaveAttribute('aria-required', 'true');
  await expect(dialog.locator('#onboarding-parent-name')).toHaveValue('Nguyễn An');

  await dialog.getByRole('button', { name: /tiếp tục/i }).click();
  await expect(dialog.getByRole('alert')).toContainText('Vui lòng nhập số điện thoại của bạn.');
  expect(account.saves).toEqual([]);

  await phone.fill('abc123');
  await dialog.getByRole('button', { name: /tiếp tục/i }).click();
  await expect(dialog.getByRole('alert')).toContainText('Số điện thoại chưa hợp lệ');
  expect(account.saves).toEqual([]);

  await phone.fill('0912 345 678');
  await dialog.getByLabel(/Tôi đồng ý nhận hướng dẫn/).check();
  await dialog.getByRole('button', { name: /tiếp tục/i }).click();

  await expect(dialog.locator('#onboarding-child-name')).toBeVisible();
  expect(account.saves).toEqual([{ displayName: 'Nguyễn An', phone: '0912 345 678', marketingConsent: true }]);
  expect(account.current().phone).toBe('0912345678');
});

test('once the details are on file the app never asks for them again', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  const account = await mockAccountProfile(page, { display_name: 'Nguyễn An', email: 'parent@example.test', phone: '0912345678', marketing_consent: false });
  const loaded = page.waitForResponse('**/api/account/profile');
  await page.goto('/');
  await loaded;
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog', { name: promptName })).toHaveCount(0);
  expect(account.saves).toEqual([]);
});

test('a returning parent with details on file goes straight to the child step of family setup', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { profiles: [], subscription: freePlan });
  const account = await mockAccountProfile(page, { display_name: 'Nguyễn An', email: 'parent@example.test', phone: '0912345678', marketing_consent: false });
  await page.goto('/start');

  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('#onboarding-child-name')).toBeVisible();
  await expect(dialog.locator('#onboarding-parent-name')).toHaveCount(0);
  await expect(dialog.locator('#onboarding-parent-phone')).toHaveCount(0);
  expect(account.saves).toEqual([]);
});

test('an older account without a phone is asked once, and only for a valid number', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  const account = await mockAccountProfile(page, { display_name: 'Nguyễn An', email: 'parent@example.test', phone: null, marketing_consent: false });
  await page.goto('/');

  const dialog = page.getByRole('dialog', { name: promptName });
  const save = dialog.getByRole('button', { name: 'Lưu và tiếp tục' });
  await expect(save).toBeDisabled();
  await dialog.getByLabel('Số điện thoại').fill('12345');
  await expect(save).toBeDisabled();
  await expect(dialog.getByRole('alert')).toContainText('Số điện thoại chưa hợp lệ');

  await dialog.getByLabel('Số điện thoại').fill('0912 345 678');
  await expect(save).toBeEnabled();
  await save.click();
  await expect(dialog).toHaveCount(0);
  expect(account.saves).toHaveLength(1);

  await page.reload();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog', { name: promptName })).toHaveCount(0);
});

test('once signed in the details are required: the prompt cannot be dismissed, only completed or signed out of', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  const account = await mockAccountProfile(page, { display_name: '', email: 'parent@example.test', phone: null, marketing_consent: false });
  await page.goto('/');

  const dialog = page.getByRole('dialog', { name: promptName });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Để sau' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Đăng xuất' })).toBeVisible();

  await page.keyboard.press('Escape');
  await page.mouse.click(4, 4);
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Họ và tên').fill('Nguyễn An');
  await dialog.getByLabel('Số điện thoại').fill('0912345678');
  await dialog.getByRole('button', { name: 'Lưu và tiếp tục' }).click();
  await expect(dialog).toHaveCount(0);
  expect(account.saves).toHaveLength(1);
});

test('the demo never asks for details', async ({ page }) => {
  const profileRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/account/profile')) profileRequests.push(request.url());
  });
  await page.goto('/?demo=1');
  await expect(page.getByTestId('app-surface')).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(profileRequests).toEqual([]);
});
