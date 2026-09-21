import { expect, test } from '@playwright/test';

test('first visit uses the Cloudflare country language', async ({ browser }) => {
  // Given
  const context = await browser.newContext({
    locale: 'en-US',
    extraHTTPHeaders: { 'cf-ipcountry': 'FR' },
  });
  const page = await context.newPage();

  // When
  await page.goto('/');

  // Then
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page).toHaveTitle(/Accompagner l’épanouissement/);
  await context.close();
});

test('Accept-Language selects the first supported locale when country detection is unavailable', async ({ browser }) => {
  // Given
  const context = await browser.newContext({ locale: 'fr-CA' });
  const page = await context.newPage();

  // When
  await page.goto('/');

  // Then
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page).toHaveTitle(/Accompagner l’épanouissement/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Accompagner l’épanouissement/
  );
  await context.close();
});

test('a saved local preference migrates to server metadata on reload', async ({ browser }) => {
  // Given
  const context = await browser.newContext({
    locale: 'fr-FR',
    extraHTTPHeaders: { 'cf-ipcountry': 'FR' },
  });
  await context.addInitScript(() => localStorage.setItem('kidhabit_language', 'en'));
  const page = await context.newPage();

  // When
  await page.goto('/');

  // Then
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/Journey to Building Great Habits/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Journey to Building Great Habits/
  );
  expect(await context.cookies()).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'kidhabit_language', value: 'en' }),
  ]));
  await context.close();
});

test('the server honors a persisted language choice before hydration', async ({ browser, baseURL }) => {
  // Given
  const context = await browser.newContext({
    javaScriptEnabled: false,
    locale: 'fr-FR',
    extraHTTPHeaders: { 'cf-ipcountry': 'FR' },
  });
  await context.addCookies([{
    name: 'kidhabit_language',
    value: 'en',
    url: new URL(baseURL ?? 'http://127.0.0.1:3000').origin,
  }]);
  const page = await context.newPage();

  // When
  await page.goto('/');

  // Then
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/Journey to Building Great Habits/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Journey to Building Great Habits/
  );
  await context.close();
});

test('the server cookie remains authoritative when local storage is stale', async ({ browser, baseURL }) => {
  // Given
  const context = await browser.newContext({
    locale: 'fr-FR',
    extraHTTPHeaders: { 'cf-ipcountry': 'FR' },
  });
  await context.addCookies([{
    name: 'kidhabit_language',
    value: 'en',
    url: new URL(baseURL ?? 'http://127.0.0.1:3000').origin,
  }]);
  await context.addInitScript(() => localStorage.setItem('kidhabit_language', 'fr'));
  const page = await context.newPage();

  // When
  await page.goto('/');

  // Then
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/Journey to Building Great Habits/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('kidhabit_language'))).toBe('en');
  await context.close();
});

test('manual language selection updates and persists localized metadata', async ({ page, baseURL }) => {
  // Given
  await page.context().addCookies([{
    name: 'kidhabit_language',
    value: 'en',
    url: new URL(baseURL ?? 'http://127.0.0.1:3000').origin,
  }]);
  await page.goto('/');

  // When
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: /FR/ }).click();

  // Then
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page).toHaveTitle(/Accompagner l’épanouissement/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Accompagner l’épanouissement/
  );
  expect(await page.context().cookies()).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'kidhabit_language', value: 'fr' }),
  ]));

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Accompagner l’épanouissement/
  );
});
