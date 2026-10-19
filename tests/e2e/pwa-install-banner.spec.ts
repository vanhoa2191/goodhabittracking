import { expect, test } from '@playwright/test';

test.describe('PWA install banner', () => {
  test('shows an install button when the browser offers the install prompt, and stays dismissed', async ({ page }) => {
    await page.addInitScript(() => {
      const fire = () => {
        const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: 'accepted' }>;
        };
        event.prompt = async () => {};
        event.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);
        if (event.defaultPrevented) window.clearInterval(timer);
      };
      const timer = window.setInterval(fire, 250);
    });
    await page.goto('/');
    const banner = page.getByRole('complementary', { name: /KidHabit Hero/ });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('button').first()).toBeVisible();
    await banner.getByRole('button', { name: /Để sau|Not now/ }).first().click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByRole('complementary', { name: /KidHabit Hero/ })).toBeHidden();
  });
});
