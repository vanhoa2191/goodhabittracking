import { expect, test } from '@playwright/test';

test('a child saves one reflection and the parent can review and export it', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();

  const childJournal = page.getByRole('region', { name: 'Một điều con muốn ghi nhớ' });
  await expect(childJournal).toBeVisible();
  const reflection = 'Hôm nay con đã kiên trì hoàn thành việc của mình.';
  await childJournal.getByLabel('Điều con muốn ghi nhớ hôm nay').fill(reflection);
  await childJournal.getByRole('button', { name: 'Lưu nhật ký' }).click();
  await expect(childJournal.getByText('Đã lưu cho hôm nay.')).toBeVisible();

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await childJournal.scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await childJournal.screenshot({ path: testInfo.outputPath(`child-journal-${width}.png`) });
  }

  await page.reload();
  await expect(page.getByLabel('Điều con muốn ghi nhớ hôm nay')).toHaveValue(reflection);
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  await page.getByRole('tab', { name: 'Thống kê' }).click();

  const parentJournal = page.getByRole('region', { name: 'Nhật ký một câu của con' });
  await expect(parentJournal).toContainText(reflection);
  const downloadPromise = page.waitForEvent('download');
  await parentJournal.getByRole('button', { name: 'Xuất nhật ký' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('kidhabit-child-journal.csv');

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await parentJournal.scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await parentJournal.screenshot({ path: testInfo.outputPath(`parent-journal-${width}.png`) });
  }
});
