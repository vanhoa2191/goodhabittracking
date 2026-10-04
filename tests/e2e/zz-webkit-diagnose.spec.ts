import { test } from '@playwright/test';

test('diagnose: why the app stays in the loading state', async ({ page }) => {
  test.setTimeout(120_000);
  const lines: string[] = [];
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) lines.push(`console.${message.type()}: ${message.text().slice(0, 400)}`); });
  page.on('pageerror', (error) => lines.push(`pageerror: ${String(error.stack ?? error.message).slice(0, 800)}`));
  page.on('requestfailed', (request) => lines.push(`requestfailed: ${request.url().slice(0, 160)} ${request.failure()?.errorText ?? ''}`));
  await page.goto('/');
  await page.waitForTimeout(25_000);
  const mode = await page.getByTestId('app-surface').getAttribute('data-app-mode');
  const storage = await page.evaluate(() => {
    try { localStorage.setItem('probe', '1'); return `localStorage ok, locks=${typeof navigator.locks}, crypto.subtle=${typeof crypto.subtle}, randomUUID=${typeof crypto.randomUUID}`; } catch (e) { return `localStorage failed: ${String(e)}`; }
  });
  // eslint-disable-next-line no-console
  console.log(`DIAGNOSE mode=${mode}\nDIAGNOSE ${storage}\n${lines.map((l) => `DIAGNOSE ${l}`).join('\n')}`);
});
