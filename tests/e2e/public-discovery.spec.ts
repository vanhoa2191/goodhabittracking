import { expect, test } from '@playwright/test';

test('app pages are noindex and keep marketing discovery off the app origin', async ({ request, page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /127\.0\.0\.1:3000\/?$/);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Disallow: /');
  expect(await robots.text()).not.toContain('Sitemap:');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).not.toContain('<url>');
  expect(sitemapBody).not.toContain('/pricing');
});

test('app navigation sends public journeys to the marketing origin', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Xem trang giới thiệu' })).toHaveAttribute('href', 'https://www.example.test/');
  await expect(page.getByRole('link', { name: 'Bảng giá' })).toHaveAttribute('href', 'https://www.example.test/pricing/');
  await expect(page.getByRole('link', { name: 'Tài liệu sử dụng' })).toHaveAttribute('href', 'https://www.example.test/docs/');
});

test('app origin still owns install and share resources', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  expect(manifest.headers()['content-type']).toContain('application/manifest+json');
  expect((await manifest.json()).name).toBe('KidHabit Hero');

  // The share image is a static file; the page's own og:image tag says where it is.
  const page = await request.get('/');
  const imagePath = new URL(/property="og:image" content="([^"]+)"/.exec(await page.text())?.[1] ?? '', 'http://localhost').pathname;
  expect(imagePath).toMatch(/opengraph-image/);
  const image = await request.get(imagePath);
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
});
