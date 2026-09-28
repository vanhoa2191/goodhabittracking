import { expect, test } from '@playwright/test';

test('production shell has a valid install manifest and active service worker', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await page.goto('/');
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('service_worker_unavailable');
    await navigator.serviceWorker.ready;
  });

  const manifest = await cdp.send('Page.getAppManifest');
  expect(manifest.errors).toEqual([]);
  const manifestData = JSON.parse(manifest.data ?? '{}') as { display?: string; icons?: Array<{ src?: string }> };
  expect(manifestData.display).toBe('standalone');
  expect(manifestData.icons?.map((icon) => icon.src)).toEqual(expect.arrayContaining([
    '/pwa/icon-192.png',
    '/pwa/icon-512.png',
  ]));

  const installability = await cdp.send('Page.getInstallabilityErrors');
  expect(installability.installabilityErrors).toEqual([]);
});

test('sensitive routes never appear in CacheStorage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    await fetch('/api/health');
    await fetch('/pricing');
  });

  const cachedUrls = await page.evaluate(async () => {
    const keys = await caches.keys();
    const requests = await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()));
    return requests.flat().map((request) => new URL(request.url).pathname);
  });
  expect(cachedUrls.some((path) => path.startsWith('/api/'))).toBe(false);
  expect(cachedUrls.some((path) => path.startsWith('/admin'))).toBe(false);
  expect(cachedUrls.some((path) => path.startsWith('/invite/'))).toBe(false);
  expect(cachedUrls).not.toContain('/pricing');
});
