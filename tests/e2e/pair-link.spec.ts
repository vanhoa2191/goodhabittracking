import { expect, test } from '@playwright/test';

const token = 'a'.repeat(48);
const session = {
  familyPausedAt: null,
  familyPausePeriods: [],
  child: {
    id: '44444444-4444-4444-8444-444444444444', name: 'Bé Quét', avatar: 'mascot:leo', themeColor: '#3B82F6',
    points: 20, totalEarned: 20, level: 1, streak: 0, createdAt: '2026-09-20T00:00:00.000Z',
  },
  activities: [{
    id: '55555555-5555-4555-8555-555555555555', childId: '44444444-4444-4444-8444-444444444444', title: 'Thói quen buổi sáng',
    icon: '🌞', category: 'kindness', points: 10, recurrenceType: 'daily', recurrenceDays: [], timeOfDay: 'morning',
    requiresApproval: false, isActive: true, createdAt: '2026-09-20T00:00:00.000Z',
  }],
  logs: [], rewards: [], redemptions: [],
};

test('opening the pairing link with any QR scanner pairs the device and shows the child app without further taps', async ({ page }) => {
  test.setTimeout(90_000);
  let exchanged = 0;
  let paired = false;
  await page.route('**/api/pairing/exchange', async (route) => {
    exchanged += 1;
    paired = true;
    expect(route.request().postDataJSON()).toEqual({ token });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.route('**/api/child/session', (route) => paired
    ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session) })
    : route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'no session' }) }));

  await page.goto(`/?pair=${token}`);

  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid', { timeout: 15_000 });
  await expect(page.getByText('Thói quen buổi sáng').first()).toBeVisible();
  expect(exchanged).toBe(1);
  expect(page.url()).not.toContain('pair=');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.reload();
  expect(exchanged).toBe(1);
});

test('a pairing link that was already used or has expired explains it and offers the typed code, without leaving the link in the address bar', async ({ page }) => {
  test.setTimeout(90_000);
  await page.route('**/api/pairing/exchange', (route) => route.fulfill({
    status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Mã đã được sử dụng. Mỗi mã chỉ dùng được một lần.' }),
  }));
  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'no session' }) }));

  await page.goto(`/?pair=${token}`);

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Mỗi mã chỉ dùng được một lần.')).toBeVisible();
  await expect(page.locator('#family-connect-code')).toBeVisible();
  expect(page.url()).not.toContain('pair=');
});

