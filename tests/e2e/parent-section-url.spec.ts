import { expect, test, type Page } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

async function openParent(page: Page, url = '/') {
  await page.goto(url);
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
}

test('a section in the URL is ignored in child mode and applied only after the parent unlocks', async ({ page }) => {
  await page.goto('/?section=settings#settings-security');
  await page.getByTestId('landing-primary-action').click();
  await expect(page.locator('#parent-section-settings')).toHaveCount(0);
  await expect(page.locator('#settings-security')).toHaveCount(0);

  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await expect(page.locator('#parent-section-settings')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#settings-security')).toBeInViewport();
});

test('unknown section values fall back to approvals', async ({ page }) => {
  await openParent(page, '/?section=bogus');
  await expect(page.locator('#parent-section-approvals')).toHaveAttribute('aria-selected', 'true');
});

test('choosing a section updates the URL and Back returns to the previous section', async ({ page }) => {
  await openParent(page);
  await expect(page).not.toHaveURL(/section=/);

  await page.locator('#parent-area-design').click();
  await expect(page.locator('#parent-section-habits')).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/[?&]section=habits(&|$)/);

  await page.locator('#parent-area-family').click();
  await page.locator('#parent-section-settings').click();
  await expect(page).toHaveURL(/[?&]section=settings(&|$)/);

  await page.goBack();
  await expect(page.locator('#parent-section-children')).toHaveAttribute('aria-selected', 'true');
  await page.goBack();
  await expect(page.locator('#parent-section-habits')).toHaveAttribute('aria-selected', 'true');
  await page.goBack();
  await expect(page.locator('#parent-section-approvals')).toHaveAttribute('aria-selected', 'true');
  await expect(page).not.toHaveURL(/section=/);

  await page.goForward();
  await expect(page.locator('#parent-section-habits')).toHaveAttribute('aria-selected', 'true');
});

test('a settings anchor opens Settings and leaving Settings drops the anchor', async ({ page }) => {
  await openParent(page);
  await page.locator('#parent-area-family').click();
  await page.locator('#parent-section-settings').click();
  await page.getByRole('navigation', { name: 'Nhóm cài đặt' }).getByRole('link', { name: 'Bảo vệ bằng PIN' }).click();
  await expect(page).toHaveURL(/[?&]section=settings.*#settings-security$/);

  await page.locator('#parent-area-today').click();
  await expect(page.locator('#parent-section-approvals')).toHaveAttribute('aria-selected', 'true');
  expect(new URL(page.url()).hash).toBe('');
});
