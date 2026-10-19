import { expect, test, type Locator } from '@playwright/test';
import { cloudFamilyIds, defaultCloudActivity, installCloudFamilyFixture } from './cloud-family-fixture';
import { enterParentApprovals } from './ui-audit-fixture';

const today = '2026-09-21';
const familyId = cloudFamilyIds.family;
const twoChildCloud = {
  profiles: [
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', family_id: familyId, name: 'Bé An', nickname: 'Bé An', show_real_name_on_leaderboard: false, is_public_on_leaderboard: true, avatar: 'mascot:leo', theme_color: '#F59E0B', points: 85, total_earned: 145, level: 2, streak: 4, birth_year: 2018, age_stage: '6-12', age: 8, created_at: today },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', family_id: familyId, name: 'Bé Chi', nickname: 'Bé Chi', show_real_name_on_leaderboard: false, is_public_on_leaderboard: true, avatar: 'mascot:bunny', theme_color: '#10B981', points: 45, total_earned: 65, level: 1, streak: 2, birth_year: 2022, age_stage: '3-6', age: 4, created_at: today },
  ],
  activities: [
    { ...defaultCloudActivity, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', family_id: familyId, child_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Đánh răng sáng của Bé An', points: 10, requires_approval: false },
    { ...defaultCloudActivity, id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', family_id: familyId, child_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'Đánh răng sáng của Bé Chi', points: 10, requires_approval: true },
  ],
  logs: [
    { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', family_id: familyId, activity_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', child_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', log_date: today, status: 'pending_approval', points_awarded: 10, completed_at: `${today}T07:00:00.000Z` },
    { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', family_id: familyId, activity_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', child_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', log_date: today, status: 'pending_approval', points_awarded: 10, completed_at: `${today}T07:30:00.000Z` },
  ],
  rewards: [
    { id: '11111111-4111-4111-8111-111111111111', family_id: familyId, title: 'Xem phim', description: '', icon: '🎬', cost_points: 50, stock: 5, is_active: true, created_at: today },
  ],
  redemptions: [
    { id: '22222222-2222-4222-8222-222222222222', family_id: familyId, reward_id: '11111111-4111-4111-8111-111111111111', child_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', points_spent: 50, status: 'pending', requested_at: `${today}T08:00:00.000Z` },
    { id: '66666666-6666-4666-8666-666666666666', family_id: familyId, reward_id: '11111111-4111-4111-8111-111111111111', child_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', points_spent: 50, status: 'pending', requested_at: `${today}T08:10:00.000Z` },
  ],
};

function luminance(channels: number[]): number {
  if (channels.length !== 3) throw new Error(`Expected three sRGB channels, received ${channels.length}`);
  const linear = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

async function assertReadableText(button: Locator) {
  const colors = await button.evaluate((element) => {
    const rgb = (color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d', { colorSpace: 'srgb' });
      if (!context) throw new Error('Could not create sRGB canvas context');
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    const style = getComputedStyle(element);
    return {
      foreground: style.color,
      background: style.backgroundColor,
      foregroundChannels: rgb(style.color),
      backgroundChannels: rgb(style.backgroundColor),
    };
  });
  const foreground = luminance(colors.foregroundChannels);
  const background = luminance(colors.backgroundChannels);
  const ratio = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  expect(ratio, `${await button.innerText()} contrast (${colors.foreground} on ${colors.background})`).toBeGreaterThanOrEqual(4.5);
}

test('phase02b parent approval actions meet AA contrast in the real all-family queues', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, twoChildCloud);
  await enterParentApprovals(page);
  await expect(page.locator('#pending-tasks')).toBeVisible();
  await expect(page.locator('#pending-rewards')).toBeVisible();
  const bulkSelect = page.getByTestId('bulk-select-all');
  let approve: Locator;
  let rejectTask: Locator;
  if (await bulkSelect.count()) {
    await bulkSelect.click();
    approve = page.getByTestId('bulk-approve');
    rejectTask = page.getByTestId('bulk-reject');
  } else {
    approve = page.locator('#pending-tasks button.bg-emerald-700').first();
    rejectTask = page.locator('#pending-tasks button.bg-rose-50').first();
  }
  const deliver = page.locator('#pending-rewards button.bg-pink-600').first();
  await expect(approve).toBeVisible();
  await expect(rejectTask).toBeVisible();
  await expect(deliver).toBeVisible();
  await assertReadableText(approve);
  await assertReadableText(rejectTask);
  await assertReadableText(deliver);
});
