import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

for (const width of [320, 360]) {
  for (const mode of ['kid', 'parent'] as const) {
    test(`the header fits a ${width}px phone in ${mode} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('/?demo=1');
      if (mode === 'parent') {
        await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
        await setupOrUnlockParent(page);
      }
      await expect(page.getByTestId('more-menu')).toBeVisible();

      const overflow = await page.evaluate(() => {
        const header = document.querySelector('header');
        const limit = innerWidth;
        return [...(header?.querySelectorAll('*') ?? [])]
          .map((el) => ({ el, box: el.getBoundingClientRect() }))
          .filter(({ box }) => box.width > 0 && (box.right > limit + 0.5 || box.left < -0.5))
          .map(({ el, box }) => `${el.tagName}.${(el.getAttribute('class') ?? '').slice(0, 40)} ${Math.round(box.left)}..${Math.round(box.right)}`);
      });
      expect(overflow, `elements outside the ${width}px viewport`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const toggle = await page.getByTestId('more-menu').boundingBox();
      expect(toggle!.x + toggle!.width).toBeLessThanOrEqual(width);
    });
  }
}
