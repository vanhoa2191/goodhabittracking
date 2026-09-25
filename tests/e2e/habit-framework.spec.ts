import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openParentDashboard(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }
}

test('parent can explore and add a canonical framework habit', async ({ page }) => {
  // Given
  await openParentDashboard(page);
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Quản lý việc' }).click();
  await page.getByRole('button', { name: 'Thư viện', exact: true }).click();

  // When
  await expect(page.getByRole('heading', { name: 'Khung 47 thói quen 0–18 tuổi' })).toBeVisible();
  await expect(page.getByRole('button', { name: /12-15 · Bản sắc & Cảm xúc/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /15-18 · Định hướng & Trách nhiệm/ })).toBeVisible();
  const card = page.getByRole('heading', { name: 'Vòng lặp phát – đáp (được nhìn thấy, được đáp lại)' }).locator('xpath=ancestor::article[1]');
  await card.getByText('Xem cách làm và cách đồng hành').click();
  await card.getByRole('button', { name: 'Thêm vào danh sách việc' }).click();

  // Then
  await expect(card.getByText('Người lớn đồng hành:')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Đã thêm vào gia đình' })).toBeDisabled();
});

test('parent can add meaningful non-material and material rewards', async ({ page }) => {
  // Given
  await openParentDashboard(page);
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Đổi quà' }).click();

  // When
  await expect(page.getByRole('heading', { name: 'Gợi ý quà tặng ý nghĩa' })).toBeVisible();
  await page.getByRole('button', { name: 'Quà phi vật chất' }).click();
  const experienceCard = page.getByRole('heading', { name: '30 phút riêng cùng ba hoặc mẹ' }).locator('xpath=ancestor::article[1]');
  await experienceCard.getByRole('button', { name: 'Thêm vào kho quà' }).click();
  await page.getByRole('button', { name: 'Quà vật chất' }).click();
  const materialCard = page.getByRole('heading', { name: 'Một cuốn sách con tự chọn' }).locator('xpath=ancestor::article[1]');
  await materialCard.getByRole('button', { name: 'Thêm vào kho quà' }).click();

  // Then
  await expect(page.getByRole('heading', { name: '30 phút riêng cùng ba hoặc mẹ' }).last()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Một cuốn sách con tự chọn' }).last()).toBeVisible();
});

test('parent keeps assigned habits separate from the filtered library', async ({ page }) => {
  await openParentDashboard(page);
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await expect(page.getByRole('button', { name: 'Đang dùng', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Mã việc').first()).toBeVisible();
  await expect(page.getByText(/lần hoàn thành trong 7 ngày/).first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Lọc theo bé' }).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Thư viện', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Khung 47 thói quen 0–18 tuổi' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Lọc theo bé' })).toHaveCount(0);
});

test('a legacy template keeps its catalog ID after joining the active collection', async ({ page }) => {
  // Given
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByRole('button', { name: /Try Demo Now/ }).first().click();
  await page.getByRole('button', { name: /^Parent/ }).click();
  const pinDialog = page.getByRole('dialog');
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Habits' }).click();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  const card = page.locator('[data-template-id="WIT-NUT-01"]');

  // When
  await card.getByRole('button', { name: 'Add to child' }).click();
  await page.getByRole('button', { name: 'In use', exact: true }).click();

  // Then
  await expect(page.getByText('Task ID: WIT-NUT-01')).toBeVisible();
});

test('a custom habit with a template title does not occupy the legacy library card', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByRole('button', { name: /Try Demo Now/ }).first().click();
  await page.getByRole('button', { name: /^Parent/ }).click();
  for (const digit of ['1', '2', '3', '4']) {
    await page.getByRole('dialog').getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Habits' }).click();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  const card = page.locator('[data-template-id="WIT-NUT-01"]');
  const templateTitle = await card.getByRole('heading').textContent();
  expect(templateTitle).toBeTruthy();

  await page.getByRole('button', { name: 'In use', exact: true }).click();
  await page.getByRole('button', { name: 'Create New Habit' }).click();
  const habitDialog = page.getByRole('dialog', { name: 'Create New Habit' });
  await habitDialog.getByPlaceholder('For example: Wash hands before eating…').fill(templateTitle ?? '');
  await habitDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(habitDialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Add to child' })).toBeEnabled();
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    await expect(card).toBeVisible();
    await card.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      window.scrollTo(0, Math.max(0, window.scrollY + bounds.top - (window.innerHeight - bounds.height) / 2));
    });
    await expect.poll(() => card.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThan(96);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await card.screenshot({ path: testInfo.outputPath(`legacy-template-available-${width}.png`) });
  }
  await page.setViewportSize({ width: 375, height: 812 });
  for (const locale of ['zh', 'ja', 'ko']) {
    const menuButton = page.getByTestId('more-menu');
    await menuButton.click();
    await menuButton.locator('xpath=..').getByRole('button', { name: new RegExp(`${locale.toUpperCase()}$`) }).click();
    await menuButton.click();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(card.getByRole('button')).toBeEnabled();
    await card.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      window.scrollTo(0, Math.max(0, window.scrollY + bounds.top - (window.innerHeight - bounds.height) / 2));
    });
    await card.screenshot({ path: testInfo.outputPath(`legacy-template-available-${locale}-375.png`) });
  }
});

test('a demo assignment remains available after reloading the same tab', async ({ page }) => {
  // Given
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByRole('button', { name: /Try Demo Now/ }).first().click();
  await page.getByRole('button', { name: /^Parent/ }).click();
  for (const digit of ['1', '2', '3', '4']) {
    await page.getByRole('dialog').getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await page.locator('[data-template-id="WIT-NUT-01"]').getByRole('button', { name: 'Add to child' }).click();

  // When
  await page.reload();
  await page.getByRole('button', { name: /^Parent/ }).click();
  for (const digit of ['1', '2', '3', '4']) {
    await page.getByRole('dialog').getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Design' }).click();

  // Then
  await expect(page.getByText('Task ID: WIT-NUT-01')).toBeVisible();
});
