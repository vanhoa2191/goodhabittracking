import { expect, test } from '@playwright/test';

test('crawler receives meaningful landing HTML and complete share metadata', async ({ request, page }) => {
  const response = await request.get('/', { headers: { 'accept-language': 'vi-VN' } });
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('Cùng con xây thói quen tốt');
  expect(html).toContain('Chọn gói phù hợp với gia đình');
  expect(html).not.toContain('Opening KidHabit');

  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /workers\.dev\/?$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
  expect(structuredData).toContain('SoftwareApplication');
  expect(structuredData).not.toContain('aggregateRating');
});

test('public marketing routes render useful content without horizontal overflow', async ({ page }) => {
  const routes = [
    { path: '/pricing', heading: 'Chọn gói vừa đủ cho gia đình' },
    { path: '/framework', heading: 'Từ phẩm chất mong muốn đến hành động nhỏ mỗi ngày' },
    { path: '/roadmaps', heading: 'Có lộ trình rõ ràng, gia đình đỡ phải nghĩ xem hôm nay làm gì' },
  ] as const;

  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of routes) {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Nội dung công khai' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('discovery endpoints expose crawl, install and share resources', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap:');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain('/pricing');
  expect(sitemapBody).toContain('/framework');
  expect(sitemapBody).toContain('/roadmaps');

  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  expect(manifest.headers()['content-type']).toContain('application/manifest+json');
  expect((await manifest.json()).name).toBe('KidHabit Hero');

  const image = await request.get('/opengraph-image');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
});

test('pricing entry opens checkout choices in Vietnam and demo outside Vietnam', async ({ browser, page, baseURL }) => {
  await page.goto('/pricing');
  await page.getByRole('link', { name: 'Dùng thử hoặc chọn gói' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' })).toBeVisible();

  const internationalContext = await browser.newContext({
    baseURL,
    locale: 'en-US',
    extraHTTPHeaders: { 'cf-ipcountry': 'US' },
  });
  const internationalPage = await internationalContext.newPage();
  await internationalPage.goto('/pricing');
  await expect(internationalPage.getByRole('link', { name: 'Trải nghiệm bản demo' }).first()).toHaveAttribute('href', '/?demo=1');
  await internationalPage.getByRole('link', { name: 'Trải nghiệm bản demo' }).first().click();
  await expect(internationalPage.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
  await internationalContext.close();
});
