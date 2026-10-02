import { expect, test } from '@playwright/test';

const VIETNAMESE = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const PAGES = ['/contact', '/pricing', '/framework', '/science', '/roadmaps'] as const;

for (const path of PAGES) {
  for (const language of ['ja', 'vi'] as const) {
    test(`${path} is shown in ${language}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.addInitScript((code) => localStorage.setItem('kidhabit_language', code), language);
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      const main = page.locator('main');
      await expect(main).toBeVisible();
      const text = await main.innerText();
      expect(text.length).toBeGreaterThan(200);
      if (language === 'ja') expect(text, `${path} still shows Vietnamese in Japanese`).not.toMatch(VIETNAMESE);
      else expect(text).toMatch(VIETNAMESE);
    });
  }
}

test('the legal pages stay Vietnamese on purpose until a lawyer has reviewed a translation', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => localStorage.setItem('kidhabit_language', 'ja'));
  await page.goto('/privacy');
  await expect(page.locator('main')).toContainText(/quyền riêng tư|dữ liệu/i);
});
