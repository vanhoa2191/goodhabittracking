import { expect, test } from '@playwright/test';

test('a verified paid return shows activation and removes provider query parameters', async ({ page }) => {
  // Given
  let requestedOrderCode: number | null = null;
  await page.route('**/api/payment/status', async (route) => {
    requestedOrderCode = (await route.request().postDataJSON()).orderCode;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, paid: true, status: 'PAID' }),
    });
  });

  // When
  await page.goto('/?payment=success&orderCode=654321&code=00&id=provider-link&cancel=false&status=PAID');

  // Then
  await expect(page.locator('[data-payment-state="activated"]')).toBeVisible();
  expect(requestedOrderCode).toBe(654321);
  await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('an unverified success return remains pending', async ({ page }) => {
  // Given
  await page.route('**/api/payment/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, paid: false, status: 'PENDING' }),
    });
  });

  // When
  await page.goto('/?payment=success&orderCode=654321');

  // Then
  await expect(page.locator('[data-payment-state="pending"]')).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('a failed status verification shows an error state', async ({ page }) => {
  // Given
  await page.route('**/api/payment/status', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'Could not read payment status.' }),
    });
  });

  // When
  await page.goto('/?payment=success&orderCode=654321');

  // Then
  await expect(page.locator('[data-payment-state="error"]')).toBeVisible();
  await expect(page.locator('[data-payment-state="error"]')).toHaveAttribute('role', 'alert');
  await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('a cancelled return does not claim payment success', async ({ page }) => {
  // Given
  let statusRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/payment/status')) statusRequests += 1;
  });

  // When
  await page.goto('/?payment=cancel&orderCode=654321&code=00&id=provider-link&cancel=true&status=CANCELLED');

  // Then
  await expect(page.locator('[data-payment-state="cancelled"]')).toBeVisible();
  expect(statusRequests).toBe(0);
  await expect.poll(() => new URL(page.url()).search).toBe('');
});
