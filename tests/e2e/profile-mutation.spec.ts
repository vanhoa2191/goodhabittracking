import { expect, test } from '@playwright/test';
import { installCloudFamilyFixture } from './cloud-family-fixture';
import { setupOrUnlockParent } from './pin-helper';

async function openParentChildren(page: import('@playwright/test').Page) {
  if (await page.getByTestId('app-surface').getAttribute('data-app-mode') === 'kid') {
    await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
    await setupOrUnlockParent(page);
  }
  await page.getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: 'Hồ sơ các con' }).click();
}

test('a failed cloud profile update keeps the modal open and visible data unchanged', async ({ page, baseURL }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installCloudFamilyFixture(page, baseURL);
  await page.route('**/api/domain/profiles', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({
      success: false,
      error: 'Temporary failure',
      errorCode: 'profile_service_unavailable',
    }),
  }));
  await page.goto('/');
  await openParentChildren(page);
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ bé: Bé Cloud' }).click();
  const profileDialog = page.getByRole('dialog', { name: 'Chỉnh sửa hồ sơ bé' });
  await profileDialog.getByLabel('Tên thật của bé *').fill('Tên Không Được Lưu');

  await profileDialog.getByRole('button', { name: 'Lưu lại' }).click();

  await expect(profileDialog).toBeVisible();
  await expect(profileDialog.getByRole('alert')).toHaveText(
    'Không thể lưu hồ sơ của bé. Vui lòng thử lại.',
  );
  await expect(page.getByRole('heading', { name: 'Bé Cloud' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tên Không Được Lưu' })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('profile-cloud-error.png') });
});

test('a demo profile update closes the modal and persists after reload', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await openParentChildren(page);
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ bé: Nguyễn Minh An' }).click();
  const profileDialog = page.getByRole('dialog', { name: 'Chỉnh sửa hồ sơ bé' });
  await profileDialog.getByLabel('Tên thật của bé *').fill('Bé Đã Lưu');

  await profileDialog.getByRole('button', { name: 'Lưu lại' }).click();

  await expect(profileDialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Bé Đã Lưu' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bé Đã Lưu' })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('profile-demo-success.png') });
});
