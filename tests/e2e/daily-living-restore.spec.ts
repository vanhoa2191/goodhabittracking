import { expect, test, type Page, type Route } from '@playwright/test';
import type { ActivityMutation } from '../../src/lib/domain/activity-mutations';
import {
  cloudFamilyIds,
  defaultCloudActivity,
  defaultCloudProfile,
  installCloudFamilyFixture,
} from './cloud-family-fixture';
import { setupOrUnlockParent } from './pin-helper';

test.use({ reducedMotion: 'reduce', serviceWorkers: 'block' });

test.beforeEach(() => {
  test.setTimeout(90_000);
});

/**
 * Setup mock for parent PIN to allow quick unlocking in cloud fixtures.
 */
async function setupPinRoute(page: Page) {
  let pinConfigured = true;
  await page.route('**/api/parent-pin', async (route) => {
    const method = route.request().method();
    if (method === 'DELETE') {
      await route.fulfill({ status: 204 });
      return;
    }
    if (method === 'PUT') {
      pinConfigured = true;
      await route.fulfill({ status: 200, json: { status: 'updated' } });
      return;
    }
    if (method === 'POST') {
      await route.fulfill({ status: 200, json: { status: pinConfigured ? 'verified' : 'setup_required' } });
      return;
    }
    await route.fulfill({ status: 200, json: { configured: pinConfigured, lockedUntil: null } });
  });
}

/**
 * Helper to unlock parent mode when starting in or switching from kid mode.
 */
async function unlockParentFromKidMode(page: Page) {
  for (let attempt = 0; attempt < 5; attempt++) {
    if ((await page.getByTestId('app-surface').getAttribute('data-app-mode')) === 'parent') {
      return;
    }
    const dialog = page.getByRole('dialog', { name: /PIN/i });
    if (!(await dialog.isVisible().catch(() => false))) {
      const parentBtn = page.getByRole('button', { name: 'Phụ huynh', exact: true });
      if (await parentBtn.isVisible().catch(() => false)) {
        await parentBtn.click();
      }
    }
    page.setDefaultTimeout(10_000);
    try {
      await setupOrUnlockParent(page);
      await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent', { timeout: 10_000 });
      return;
    } catch {
      // Retry if dev server chunk compilation remounted Header while PIN dialog was open
    } finally {
      page.setDefaultTimeout(30_000);
    }
  }
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'parent');
}

/**
 * Helper to navigate to the Daily Living library tab.
 */
async function gotoDailyLivingLibrary(page: Page) {
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Quản lý việc' }).click();
  await page.getByRole('button', { name: 'Thư viện', exact: true }).click();
  await expect(page.getByTestId('daily-living-library')).toBeVisible();
}

/**
 * Helper to locate a daily living card by template ID in the library.
 */
function getLibraryCard(page: Page, templateId: string) {
  return page.locator(`[data-testid="daily-living-card"][data-template-id="${templateId}"]`);
}

/**
 * Helper to wait for a status message to appear.
 */
async function waitForStatus(page: Page, testId: string, timeout = 5000) {
  await expect(page.getByTestId(testId)).toBeVisible({ timeout });
}

/**
 * Helper to select a child in the daily living library.
 */
async function selectChild(page: Page, childName: string) {
  await page.getByTestId('daily-living-child-select').selectOption({ label: childName });
}

/**
 * Helper to add a habit by template ID from the library.
 */
async function addHabitFromLibrary(page: Page, templateId: string) {
  const card = getLibraryCard(page, templateId);
  const addButton = card.getByTestId('daily-living-add');
  await expect(addButton).toBeEnabled({ timeout: 5000 });
  await addButton.click();
  await Promise.race([
    waitForStatus(page, 'daily-living-saved-notice'),
    waitForStatus(page, 'daily-living-unconfirmed-notice'),
  ]);
}

/**
 * Helper to verify a habit shows as "added" in the library.
 */
async function expectHabitAdded(page: Page, templateId: string, isSharedCovers = false) {
  const card = getLibraryCard(page, templateId);
  const addedButton = card.getByTestId('daily-living-added');
  await expect(addedButton).toBeVisible();
  if (isSharedCovers) {
    await expect(addedButton).toContainText('Đã thêm (mục chung)');
  } else {
    await expect(addedButton).toHaveText('Đã thêm');
  }
}

/**
 * Helper to verify a habit is available (not added).
 */
async function expectHabitAvailable(page: Page, templateId: string) {
  const card = getLibraryCard(page, templateId);
  const addButton = card.getByTestId('daily-living-add');
  await expect(addButton).toBeVisible();
  await expect(addButton).toContainText('Thêm');
}

// ============================================================================
// TEST 1: Mục đã lưu trữ (archived) -> nút Khôi phục đưa về Đang dùng
// ============================================================================
test('Mục đã lưu trữ (archived) -> nút Khôi phục đưa về Đang dùng', async ({ page, baseURL }) => {
  const archivedActivity: Record<string, unknown> = {
    ...defaultCloudActivity,
    id: '55555555-5555-4555-8555-555555555551',
    family_id: cloudFamilyIds.family,
    child_id: cloudFamilyIds.child,
    title: 'Đánh răng buổi sáng',
    legacy_template_id: 'WIT-DLY-01',
    is_active: false,
    graduated_at: null,
  };
  const activities = [archivedActivity];

  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/referral/claim', (route) => route.fulfill({ status: 200, json: { state: 'hidden' } }));
  await setupPinRoute(page);

  await page.route('**/api/domain/activities', async (route: Route) => {
    const mutation = route.request().postDataJSON() as Extract<ActivityMutation, { type: 'update' }>;
    expect(mutation.type).toBe('update');
    expect(mutation.activityId).toBe(archivedActivity.id);
    if (mutation.updates.isActive !== undefined) {
      archivedActivity.is_active = mutation.updates.isActive;
    }
    if (mutation.updates.graduatedAt !== undefined) {
      archivedActivity.graduated_at = mutation.updates.graduatedAt;
    }
    await route.fulfill({
      status: 200,
      json: { success: true, activityId: mutation.activityId },
    });
  });

  await installCloudFamilyFixture(page, baseURL, {
    profiles: [defaultCloudProfile],
    activities,
  });

  await page.goto('/');
  await unlockParentFromKidMode(page);
  await gotoDailyLivingLibrary(page);
  await selectChild(page, 'Bé Cloud');

  // Verify card shows as "archived" with "Khôi phục" button
  const card = getLibraryCard(page, 'WIT-DLY-01');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-status', 'archived');

  const restoreBtn = card.getByTestId('daily-living-restore');
  await expect(restoreBtn).toBeVisible();
  await expect(restoreBtn).toContainText('Khôi phục');

  // Click "Khôi phục"
  await restoreBtn.click();

  // Verify restore notice
  await waitForStatus(page, 'daily-living-saved-notice');
  await expect(page.getByTestId('daily-living-saved-notice')).toContainText('Đã khôi phục thói quen');

  // Card status updates to "Đã thêm"
  await expectHabitAdded(page, 'WIT-DLY-01');

  // Switch to "Đang dùng" view to verify it is active in the list
  await page.getByRole('button', { name: 'Đang dùng', exact: true }).click();
  const inUseSection = page.getByRole('region', { name: 'Đang dùng' });
  await expect(inUseSection).toBeVisible();

  const inUseCard = inUseSection.locator('div').filter({ hasText: 'Mã việc: WIT-DLY-01' }).first();
  await expect(inUseCard).toBeVisible();
  await expect(inUseCard).toContainText('Đánh răng buổi sáng');
  await expect(inUseCard).toContainText('Đang hoạt động');
});

// ============================================================================
// TEST 2: Mục graduated -> nút Luyện lại
// ============================================================================
test('Mục graduated -> nút Luyện lại đưa về Đang dùng và bỏ trạng thái tốt nghiệp', async ({ page, baseURL }) => {
  const graduatedActivity: Record<string, unknown> = {
    ...defaultCloudActivity,
    id: '55555555-5555-4555-8555-555555555552',
    family_id: cloudFamilyIds.family,
    child_id: cloudFamilyIds.child,
    title: 'Đánh răng buổi sáng',
    legacy_template_id: 'WIT-DLY-01',
    is_active: false,
    graduated_at: '2026-10-01T00:00:00.000Z',
  };
  const activities = [graduatedActivity];

  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/referral/claim', (route) => route.fulfill({ status: 200, json: { state: 'hidden' } }));
  await setupPinRoute(page);

  await page.route('**/api/domain/activities', async (route: Route) => {
    const mutation = route.request().postDataJSON() as Extract<ActivityMutation, { type: 'update' }>;
    expect(mutation.type).toBe('update');
    expect(mutation.activityId).toBe(graduatedActivity.id);
    if (mutation.updates.isActive !== undefined) {
      graduatedActivity.is_active = mutation.updates.isActive;
    }
    if (mutation.updates.graduatedAt !== undefined) {
      graduatedActivity.graduated_at = mutation.updates.graduatedAt;
    }
    await route.fulfill({
      status: 200,
      json: { success: true, activityId: mutation.activityId },
    });
  });

  await installCloudFamilyFixture(page, baseURL, {
    profiles: [defaultCloudProfile],
    activities,
  });

  await page.goto('/');
  await unlockParentFromKidMode(page);
  await gotoDailyLivingLibrary(page);
  await selectChild(page, 'Bé Cloud');

  // Verify card shows as "graduated" with graduation badge and "Luyện lại" button
  const card = getLibraryCard(page, 'WIT-DLY-01');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-status', 'graduated');

  const graduatedBadge = card.getByTestId('daily-living-graduated-badge');
  await expect(graduatedBadge).toBeVisible();
  await expect(graduatedBadge).toContainText('Bé đã tự làm');

  const practiceBtn = card.getByTestId('daily-living-practice-again');
  await expect(practiceBtn).toBeVisible();
  await expect(practiceBtn).toContainText('Luyện lại');

  // Click "Luyện lại"
  await practiceBtn.click();

  // Verify practice again notice
  await waitForStatus(page, 'daily-living-saved-notice');
  await expect(page.getByTestId('daily-living-saved-notice')).toContainText('Đã đặt lại thói quen để luyện tập');

  // Card status updates to "Đã thêm" and graduated badge is no longer rendered
  await expectHabitAdded(page, 'WIT-DLY-01');
  await expect(card.getByTestId('daily-living-graduated-badge')).toHaveCount(0);

  // Switch to "Đang dùng" view to verify it is active in the list
  await page.getByRole('button', { name: 'Đang dùng', exact: true }).click();
  const inUseSection = page.getByRole('region', { name: 'Đang dùng' });
  await expect(inUseSection).toBeVisible();

  const inUseCard = inUseSection.locator('div').filter({ hasText: 'Mã việc: WIT-DLY-01' }).first();
  await expect(inUseCard).toBeVisible();
  await expect(inUseCard).toContainText('Đánh răng buổi sáng');
  await expect(inUseCard).toContainText('Đang hoạt động');
});

// ============================================================================
// TEST 3: Thêm cùng một mục từ hai tab trình duyệt cùng lúc (hai page cùng context/auth)
// -> chỉ còn 1 activity (không trùng)
// ============================================================================
test('Thêm cùng một mục từ hai tab trình duyệt cùng lúc (hai page cùng context/auth) -> chỉ còn 1 activity (không trùng)', async ({ context, baseURL }) => {
  const activities: Record<string, unknown>[] = [];

  const handleActivityMutation = async (route: Route) => {
    const mutation = route.request().postDataJSON() as ActivityMutation;
    if (mutation.type === 'createMany' || mutation.type === 'create') {
      const newItems = mutation.type === 'createMany' ? mutation.activities : [mutation.activity];
      const createdIds: string[] = [];
      for (const item of newItems) {
        if (!activities.some((a) => a.id === item.id)) {
          activities.push({
            id: item.id,
            family_id: defaultCloudProfile.family_id,
            child_id: item.childId,
            title: item.title,
            description: item.description ?? null,
            instructions: item.instructions ?? null,
            icon: item.icon,
            category: item.category,
            points: item.points,
            recurrence_type: item.recurrenceType,
            recurrence_days: item.recurrenceDays ?? [0, 1, 2, 3, 4, 5, 6],
            time_of_day: item.timeOfDay,
            duration_minutes: item.durationMinutes ?? 0,
            requires_approval: item.requiresApproval,
            is_active: item.isActive,
            target_age_stage: item.targetAgeStage ?? 'all',
            is_parent_role: item.isParentRole ?? false,
            portrait16_key: null,
            bo_thi7_key: null,
            framework_habit_id: null,
            framework_content_version: null,
            legacy_template_id: item.legacyTemplateId ?? null,
            journey_habit_key: null,
            created_at: item.createdAt,
          });
        }
        createdIds.push(item.id);
      }
      await route.fulfill({
        status: 200,
        json: { success: true, activityIds: createdIds },
      });
      return;
    }
    await route.continue();
  };

  const page1 = await context.newPage();
  const page2 = await context.newPage();

  for (const p of [page1, page2]) {
    await p.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
    await p.route('**/api/referral/claim', (route) => route.fulfill({ status: 200, json: { state: 'hidden' } }));
    await setupPinRoute(p);
    await p.route('**/api/domain/activities', handleActivityMutation);
    await installCloudFamilyFixture(p, baseURL, {
      profiles: [defaultCloudProfile],
      activities,
    });
  }

  // Open both tabs in the same context/auth
  await page1.goto('/');
  await page2.goto('/');

  await unlockParentFromKidMode(page1);
  await unlockParentFromKidMode(page2);

  await gotoDailyLivingLibrary(page1);
  await gotoDailyLivingLibrary(page2);

  await selectChild(page1, 'Bé Cloud');
  await selectChild(page2, 'Bé Cloud');

  // Both tabs see the habit as available
  await expectHabitAvailable(page1, 'WIT-DLY-01');
  await expectHabitAvailable(page2, 'WIT-DLY-01');

  // Concurrently click "Thêm" on both tabs
  await Promise.all([
    addHabitFromLibrary(page1, 'WIT-DLY-01'),
    addHabitFromLibrary(page2, 'WIT-DLY-01'),
  ]);

  // Both tabs now show "Đã thêm"
  await expectHabitAdded(page1, 'WIT-DLY-01');
  await expectHabitAdded(page2, 'WIT-DLY-01');

  // Check the backend activities array has exactly 1 entry for WIT-DLY-01 (no duplicate)
  const dly01Activities = activities.filter((a) => a.legacy_template_id === 'WIT-DLY-01');
  expect(dly01Activities).toHaveLength(1);

  // Navigate to "Đang dùng" on tab 1 and verify exactly 1 activity appears
  await page1.getByRole('button', { name: 'Đang dùng', exact: true }).click();
  const inUseSection1 = page1.getByRole('region', { name: 'Đang dùng' });
  await expect(inUseSection1).toBeVisible();
  await expect(page1.getByText('Mã việc: WIT-DLY-01')).toHaveCount(1);

  // Navigate to "Đang dùng" on tab 2 and verify exactly 1 activity appears
  await page2.getByRole('button', { name: 'Đang dùng', exact: true }).click();
  const inUseSection2 = page2.getByRole('region', { name: 'Đang dùng' });
  await expect(inUseSection2).toBeVisible();
  await expect(page2.getByText('Mã việc: WIT-DLY-01')).toHaveCount(1);
});
