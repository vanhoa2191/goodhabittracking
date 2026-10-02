import { expect, test } from '@playwright/test';
import {
  defaultCloudActivity,
  defaultCloudProfile,
  installCloudFamilyFixture,
} from './cloud-family-fixture';

test('caregiver invitation scrubs the token before asking for sign-in', async ({ page }) => {
  const token = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaabbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  await page.goto(`/invite/caregiver#token=${token}`);

  await expect(page).toHaveURL(/\/invite\/caregiver$/);
  await expect(page.getByRole('heading', { name: 'Tham gia với vai trò người chăm sóc' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đăng nhập Google để tiếp tục' })).toBeVisible();
});

test('caregiver enters a clearly read-only family view', async ({ page, baseURL }, testInfo) => {
  await installCloudFamilyFixture(page, baseURL, {
    familyRole: 'caregiver',
    profiles: [defaultCloudProfile],
    activities: [defaultCloudActivity],
  });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Góc người chăm sóc' })).toBeVisible();
  await expect(page.getByText('Bạn đang xem tiến độ với quyền chỉ đọc.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bé Cloud' })).toBeVisible();
  await expect(page.getByText('Thói quen buổi sáng')).toBeVisible();
  await expect(page.getByRole('button', { name: /Tạo|Sửa|Xóa|Duyệt/ })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath(`caregiver-${testInfo.project.name}.png`), fullPage: true });
});

test('owner previews a generic milestone before explicitly sharing it', async ({ page, baseURL }, testInfo) => {
  await installCloudFamilyFixture(page, baseURL, {
    profiles: [defaultCloudProfile],
    activities: [defaultCloudActivity],
  });
  await page.goto('/');
  await page.locator('#parent-section-analytics').click();
  await page.getByRole('button', { name: 'Chia sẻ cột mốc gia đình' }).click();

  const dialog = page.getByRole('dialog', { name: 'Cột mốc gia đình cùng KidHabit Hero' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Gia đình mình vừa duy trì thêm một tuần tích cực');
  await expect(dialog).not.toContainText('Bé Cloud');
  await expect(dialog).not.toContainText('Thói quen buổi sáng');
  await expect(dialog.getByRole('button', { name: 'Xác nhận chia sẻ' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath(`share-preview-${testInfo.project.name}.png`), fullPage: true });
});

test('owner can create and revoke a one-time caregiver invitation from settings', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  const token = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaabbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  let revoked = false;
  await page.route('**/api/caregiver/invites', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
        invite: { id: '11111111-1111-4111-8111-111111111111', token, expiresAt: '2026-10-01T00:00:00.000Z' },
      }) });
    }
    if (route.request().method() === 'DELETE') {
      revoked = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ invites: revoked ? [] : [] }) });
  });
  await page.goto('/');
  await page.locator('#parent-area-family').click();
  await page.locator('#parent-section-settings').click();
  await page.getByRole('button', { name: 'Tạo lời mời người chăm sóc' }).click();

  await expect(page.getByLabel('Liên kết mời một lần')).toHaveValue(new RegExp(`/invite/caregiver#token=${token}$`));
  await expect(page.getByText('Liên kết chỉ hiện trong lần tạo này')).toBeVisible();
  await page.getByRole('button', { name: 'Thu hồi lời mời' }).click();
  await expect.poll(() => revoked).toBe(true);
});

test('settings explain install and recovery without requiring a hidden browser prompt', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  await page.goto('/');
  await page.locator('#parent-area-family').click();
  await page.locator('#parent-section-settings').click();

  await expect(page.getByRole('heading', { name: 'Cài KidHabit Hero' })).toBeVisible();
  await page.getByRole('button', { name: 'Xem cách cài' }).click();
  await expect(page.getByText(/Safari.*Chia sẻ.*Thêm vào Màn hình chính/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Làm mới dữ liệu ứng dụng' })).toBeVisible();
});
