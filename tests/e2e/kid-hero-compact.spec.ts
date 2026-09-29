import { expect, test } from '@playwright/test';

const sizes = [
  { name: 'phone', width: 390, height: 844, maxHeight: 340 },
  { name: 'small phone', width: 320, height: 640, maxHeight: 400 },
  { name: 'desktop', width: 1280, height: 800, maxHeight: 250 },
] as const;

for (const size of sizes) {
  test(`the kid hero card stays compact on a ${size.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('/?demo=1');
    const hero = page.getByTestId('kid-hero');
    await expect(hero).toBeVisible();
    const box = await hero.boundingBox();
    await hero.screenshot({ path: testInfo.outputPath(`hero-${size.width}.png`) });
    expect(box!.height).toBeLessThanOrEqual(size.maxHeight);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
  });
}
