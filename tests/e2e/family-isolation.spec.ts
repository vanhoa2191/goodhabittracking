import { expect, test } from '@playwright/test';

test('revoked child session clears all stale family data before use', async ({ page }) => {
  const leakedRequests: string[] = [];
  page.on('request', (request) => {
    const payload = `${request.url()} ${request.postData() ?? ''}`;
    if (payload.includes('FAMILY_A_SECRET')) leakedRequests.push(payload);
  });

  await page.addInitScript(() => {
    localStorage.setItem('kidhabit_in_app', 'true');
    localStorage.setItem('kidhabit_child_paired', 'true');
    localStorage.setItem('kidhabit_family_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    localStorage.setItem('kidhabit_profiles', JSON.stringify([{
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      name: 'FAMILY_A_SECRET',
      avatar: '🦁',
      themeColor: '#000000',
      points: 1,
      totalEarned: 1,
      level: 1,
      streak: 0,
      createdAt: '2026-09-19T00:00:00.000Z',
    }]));
    localStorage.setItem('kidhabit_activities', JSON.stringify([{
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      childId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      title: 'FAMILY_A_SECRET_ACTIVITY',
    }]));
  });

  await page.goto('/');
  await expect(page.getByText('FAMILY_A_SECRET')).toHaveCount(0, { timeout: 10_000 });
  await expect.poll(
    () => page.evaluate(() => localStorage.getItem('kidhabit_child_paired')),
    { timeout: 10_000 }
  ).toBeNull();

  const familyState = await page.evaluate(() => ({
    marker: localStorage.getItem('kidhabit_child_paired'),
    familyId: localStorage.getItem('kidhabit_family_id'),
    profiles: localStorage.getItem('kidhabit_profiles'),
    activities: localStorage.getItem('kidhabit_activities'),
  }));

  expect(familyState.marker).toBeNull();
  expect(familyState.familyId).toBeNull();
  expect(familyState.profiles).not.toContain('FAMILY_A_SECRET');
  expect(familyState.activities).not.toContain('FAMILY_A_SECRET');
  expect(leakedRequests).toEqual([]);
});
