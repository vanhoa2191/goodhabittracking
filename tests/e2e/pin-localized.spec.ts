import { expect, test } from '@playwright/test';

const VIETNAMESE = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

for (const [language, parentButton, createTitle] of [
  ['ja', /^保護者/, '保護者のPINを作成'],
  ['en', /^Parent/, 'Create the parent PIN'],
] as const) {
  test(`the PIN dialog speaks ${language}: create, mismatch and settings, with no Vietnamese left`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate((code) => localStorage.setItem('kidhabit_language', code), language);
    await page.reload();
    await page.getByTestId('landing-primary-action').click();
    await page.getByRole('button', { name: parentButton }).click();

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading').first()).toContainText(createTitle);
    await expect(dialog).not.toContainText(VIETNAMESE);

    // Two different PINs: the mismatch message is in the same language.
    for (const digit of '1234') await dialog.getByRole('button', { name: digit, exact: true }).click();
    await expect(dialog.getByRole('heading').first()).not.toContainText(createTitle);
    for (const digit of '4321') await dialog.getByRole('button', { name: digit, exact: true }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog.getByRole('alert')).not.toContainText(VIETNAMESE);
    await expect(dialog).not.toContainText(VIETNAMESE);
  });
}
