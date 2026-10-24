import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type { ActivityMutation } from '../../src/lib/domain/activity-mutations';
import type { ProfileMutation } from '../../src/lib/domain/profile-mutations';
import type { RewardMutation } from '../../src/lib/domain/reward-mutations';
import { defaultCloudProfile, installCloudFamilyFixture } from './cloud-family-fixture';
import { setupOrUnlockParent } from './pin-helper';

// Ends colour transitions at once so axe does not measure a colour halfway between two states.
// Block service workers so route mocks handle requests directly.
test.use({ reducedMotion: 'reduce', serviceWorkers: 'block' });

test.beforeEach(() => {
  test.setTimeout(90_000);
});

/**
 * Helper to enter parent mode in demo/local from a fresh start.
 */
async function enterParentMode(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('landing-primary-action')).toBeVisible();
  await page.getByTestId('landing-primary-action').click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
  await unlockParentFromKidMode(page);
}

/**
 * Helper to unlock parent mode when already inside an active session (e.g. after reload or switching from kid mode).
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
 * Helper to select "Cả nhà" (shared) scope.
 */
async function selectSharedScope(page: Page) {
  await page.getByTestId('daily-living-child-select').selectOption('shared');
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

/**
 * Helper to open a daily living set modal.
 */
async function openDailyLivingSet(page: Page, setId: string) {
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Quản lý việc' }).click();
  await page.getByRole('button', { name: 'Chương trình', exact: true }).click();
  const setButton = page.locator(`[data-testid="daily-living-set-start"][data-set-id="${setId}"]`);
  await expect(setButton).toBeVisible();
  await setButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

// ============================================================================
// TEST 1: Thư viện - Sinh hoạt hằng ngày mặc định, tìm thấy Đánh răng buổi sáng và Rửa mặt
// ============================================================================
test('Thư viện: Sinh hoạt hằng ngày mặc định, có Đánh răng buổi sáng và Rửa mặt; thêm Đánh răng sáng → thông báo lưu, nút thành Đã thêm; tải lại vẫn Đã thêm', async ({ page }) => {
  await enterParentMode(page);
  await gotoDailyLivingLibrary(page);

  // Verify default selection is "Sinh hoạt hằng ngày"
  await expect(page.getByTestId('library-tab-daily')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('daily-living-library')).toContainText('Thư viện sinh hoạt');

  // Verify "Đánh răng buổi sáng" (WIT-DLY-01) and "Rửa mặt" (WIT-DLY-03) exist
  await expect(getLibraryCard(page, 'WIT-DLY-01')).toBeVisible();
  await expect(getLibraryCard(page, 'WIT-DLY-01')).toContainText('Đánh răng buổi sáng');
  await expect(getLibraryCard(page, 'WIT-DLY-03')).toBeVisible();
  await expect(getLibraryCard(page, 'WIT-DLY-03')).toContainText('Rửa mặt');

  // Select a child first (required to add)
  const childSelect = page.getByTestId('daily-living-child-select');
  await expect(childSelect).toBeVisible();
  const options = await childSelect.locator('option').allTextContents();
  const childOption = options.find((o) => o && o !== '— Chọn bé —' && o !== 'Cả nhà');
  expect(childOption).toBeTruthy();

  await selectChild(page, childOption!);

  // Add "Đánh răng buổi sáng"
  await addHabitFromLibrary(page, 'WIT-DLY-01');

  // Verify save notification appears
  await waitForStatus(page, 'daily-living-saved-notice');
  await expect(page.getByTestId('daily-living-saved-notice')).toContainText('Đã lưu thói quen sinh hoạt');

  // Verify button shows "Đã thêm"
  await expectHabitAdded(page, 'WIT-DLY-01');

  // Reload page (demo session persists in sessionStorage)
  await page.reload();
  await unlockParentFromKidMode(page);
  await gotoDailyLivingLibrary(page);

  // Select same child again
  await selectChild(page, childOption!);

  // Verify still shows "Đã thêm"
  await expectHabitAdded(page, 'WIT-DLY-01');
});

// ============================================================================
// TEST 2: Sáng/tối độc lập - thêm cả Đánh răng sáng và tối, hoàn thành sáng không làm tối
// ============================================================================
test('Sáng/tối độc lập: thêm cả Đánh răng sáng và tối; hoàn thành sáng không làm tối; hoàn tác chỉ mục đó; mục sáng/tối nằm đúng nhóm', async ({ page }) => {
  await enterParentMode(page);
  await gotoDailyLivingLibrary(page);

  const childSelect = page.getByTestId('daily-living-child-select');
  const options = await childSelect.locator('option').allTextContents();
  const childOption = options.find((o) => o && o !== '— Chọn bé —' && o !== 'Cả nhà');
  expect(childOption).toBeTruthy();

  await selectChild(page, childOption!);

  // Add both morning and evening brush
  await addHabitFromLibrary(page, 'WIT-DLY-01'); // Đánh răng buổi sáng
  await waitForStatus(page, 'daily-living-saved-notice');
  await addHabitFromLibrary(page, 'WIT-DLY-02'); // Đánh răng buổi tối
  await waitForStatus(page, 'daily-living-saved-notice');

  // Verify both show as added
  await expectHabitAdded(page, 'WIT-DLY-01');
  await expectHabitAdded(page, 'WIT-DLY-02');

  // Go to "Đang dùng" sub-view to verify morning/evening badges
  await page.getByRole('button', { name: 'Đang dùng', exact: true }).click();
  await expect(page.getByTestId('daily-living-library')).toHaveCount(0);

  const inUseSection = page.getByRole('region', { name: 'Đang dùng' });
  await expect(inUseSection).toBeVisible();

  const morningInUseCard = inUseSection.locator('div').filter({ hasText: 'Mã việc: WIT-DLY-01' }).first();
  await expect(morningInUseCard).toContainText('Đánh răng buổi sáng');
  await expect(morningInUseCard).toContainText('Buổi sáng');

  const eveningInUseCard = inUseSection.locator('div').filter({ hasText: 'Mã việc: WIT-DLY-02' }).first();
  await expect(eveningInUseCard).toContainText('Đánh răng buổi tối');
  await expect(eveningInUseCard).toContainText('Buổi tối');

  // Switch to kid dashboard
  await page.getByRole('button', { name: 'Bé vui học' }).click();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');

  // Verify morning/evening section headings and task cards on kid dashboard
  await expect(page.getByRole('heading', { name: 'Buổi sáng', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Buổi tối', exact: true })).toBeVisible();

  const morningTaskCard = page
    .locator('[data-task-card]')
    .filter({ has: page.getByRole('heading', { name: 'Đánh răng buổi sáng', exact: true }) });
  const eveningTaskCard = page
    .locator('[data-task-card]')
    .filter({ has: page.getByRole('heading', { name: 'Đánh răng buổi tối', exact: true }) });

  await expect(morningTaskCard).toHaveAttribute('data-complete', 'false');
  await expect(eveningTaskCard).toHaveAttribute('data-complete', 'false');

  // Complete morning habit → only morning is completed, evening remains uncompleted
  await morningTaskCard.locator('[data-task-toggle]').click();
  await expect(morningTaskCard).toHaveAttribute('data-complete', 'true');
  await expect(eveningTaskCard).toHaveAttribute('data-complete', 'false');

  // Dismiss badge celebration modal unlocked on first completion before undoing
  const badgeCelebration = page.getByTestId('badge-celebration');
  await expect(badgeCelebration).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(badgeCelebration).toHaveCount(0);

  // Undo morning habit → morning returns to uncompleted, evening stays uncompleted
  await morningTaskCard.locator('[data-task-toggle]').click();
  await expect(morningTaskCard).toHaveAttribute('data-complete', 'false');
  await expect(eveningTaskCard).toHaveAttribute('data-complete', 'false');
});

// ============================================================================
// TEST 3: Bộ thói quen - "Buổi sáng gọn gàng" modal
// ============================================================================
test('Bộ thói quen: "Buổi sáng gọn gàng" modal mặc định tick tối đa newHabitLimit mục chưa có, hiện tổng sao; hủy không tạo; xác nhận → về Đang dùng, lọc đúng bé, thông báo role=status có focus; mở lại bộ thì mục đã có hiện "Đã có" và không chọn được; bộ không còn mục thiếu báo rõ', async ({ page }) => {
  await enterParentMode(page);

  // Open "Buổi sáng gọn gàng" set (DLS-02)
  await openDailyLivingSet(page, 'DLS-02');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Buổi sáng gọn gàng');

  // Select Nguyễn Mai Chi (age 4 -> newHabitLimit = 2)
  const childSelect = page.getByTestId('daily-living-set-child-select');
  const options = await childSelect.locator('option').allTextContents();
  const childOption = options.find((o) => o.includes('Mai Chi')) ?? options.find((o) => o && o !== '— Chọn bé —');
  expect(childOption).toBeTruthy();

  await childSelect.selectOption({ label: childOption! });

  // Verify default selection: up to newHabitLimit items that are available
  const checkboxes = dialog.locator('input[type="checkbox"][data-testid^="set-item-checkbox-"]:not([disabled])');
  const checkedCount = await dialog.locator('input[type="checkbox"][data-testid^="set-item-checkbox-"]:not([disabled]):checked').count();
  const totalAvailable = await checkboxes.count();

  expect(totalAvailable).toBe(5);
  expect(checkedCount).toBeLessThanOrEqual(2);
  expect(checkedCount).toBeGreaterThan(0);

  // Verify total stars displayed
  await expect(page.getByTestId('daily-living-set-total-points')).toBeVisible();
  await expect(page.getByTestId('daily-living-set-total-points')).toContainText('Tổng sao: 10 ⭐');

  // Cancel - should not create anything
  await page.getByTestId('daily-living-set-cancel').click();
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Đang dùng', exact: true }).click();
  await expect(page.getByText('Mã việc: WIT-DLY-01')).toHaveCount(0);

  // Reopen and confirm
  await openDailyLivingSet(page, 'DLS-02');
  await childSelect.selectOption({ label: childOption! });
  await page.getByTestId('daily-living-set-confirm').click();

  // Should return to "Đang dùng" view with correct child filter
  await expect(page.getByRole('button', { name: 'Đang dùng', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const childFilter = page.getByLabel('Lọc theo bé');
  await expect(childFilter.locator('option:checked')).toHaveText(childOption!);

  // Verify status notification with focus (role=status)
  const statusNotice = page.getByTestId('program-started');
  await expect(statusNotice).toBeVisible();
  await expect(statusNotice).toBeFocused();

  // Reopen the same set - the 2 added items (WIT-DLY-01, WIT-DLY-03) should show "Đã có" and be disabled
  await openDailyLivingSet(page, 'DLS-02');
  await childSelect.selectOption({ label: childOption! });

  await expect(dialog.getByTestId('set-item-status-WIT-DLY-01')).toContainText('Đã có');
  await expect(dialog.getByTestId('set-item-status-WIT-DLY-03')).toContainText('Đã có');
  await expect(dialog.getByTestId('set-item-checkbox-WIT-DLY-01')).toBeDisabled();
  await expect(dialog.getByTestId('set-item-checkbox-WIT-DLY-03')).toBeDisabled();

  // Close modal
  await page.getByTestId('daily-living-set-cancel').click();
  await expect(dialog).toHaveCount(0);

  // Open DLS-01 ("Bắt đầu nhẹ nhàng" which only has WIT-DLY-01 and WIT-DLY-03) -> all items already added
  await openDailyLivingSet(page, 'DLS-01');
  await childSelect.selectOption({ label: childOption! });
  await expect(dialog.getByTestId('daily-living-set-all-added')).toBeVisible();
  await expect(dialog.getByTestId('daily-living-set-all-added')).toContainText('Bé đã có đầy đủ các thói quen trong bộ này.');
  await expect(dialog.getByTestId('daily-living-set-confirm')).toBeDisabled();
  await page.getByTestId('daily-living-set-cancel').click();
});

// ============================================================================
// TEST 4: Bấm nhanh hai lần nút Thêm / áp lại bộ - không trùng
// ============================================================================
test('Bấm nhanh hai lần nút Thêm / áp lại bộ: tổng số thói quen đúng, không trùng', async ({ page }) => {
  await enterParentMode(page);
  await gotoDailyLivingLibrary(page);

  const childSelect = page.getByTestId('daily-living-child-select');
  const options = await childSelect.locator('option').allTextContents();
  const childOption = options.find((o) => o && o !== '— Chọn bé —' && o !== 'Cả nhà');
  expect(childOption).toBeTruthy();

  await selectChild(page, childOption!);

  // Rapidly click "Thêm" twice for the same habit before React re-renders
  const card = getLibraryCard(page, 'WIT-DLY-01');
  const addButton = card.getByTestId('daily-living-add');
  await expect(addButton).toBeEnabled();
  await addButton.evaluate((btn: HTMLButtonElement) => {
    btn.click();
    btn.click();
  });

  await Promise.race([
    waitForStatus(page, 'daily-living-saved-notice'),
    waitForStatus(page, 'daily-living-unconfirmed-notice'),
  ]);

  // Should show as added
  await expectHabitAdded(page, 'WIT-DLY-01');

  // Also test applying a set that overlaps with WIT-DLY-01 (DLS-01 has WIT-DLY-01 and WIT-DLY-03)
  await openDailyLivingSet(page, 'DLS-01');
  await page.getByTestId('daily-living-set-child-select').selectOption({ label: childOption! });

  // WIT-DLY-01 is already added so only WIT-DLY-03 is selected
  await expect(page.getByTestId('set-item-checkbox-WIT-DLY-01')).toBeDisabled();
  await expect(page.getByTestId('set-item-checkbox-WIT-DLY-03')).toBeChecked();

  await page.getByTestId('daily-living-set-confirm').click();
  await expect(page.getByTestId('program-started')).toBeVisible();

  // Verify in "Đang dùng" that WIT-DLY-01 and WIT-DLY-03 each appear exactly once (no duplicates)
  await expect(page.getByText('Mã việc: WIT-DLY-01')).toHaveCount(1);
  await expect(page.getByText('Mã việc: WIT-DLY-03')).toHaveCount(1);
});

// ============================================================================
// TEST 5: Hai bé - bé A có mục không chặn thêm cho bé B; mục "Cả nhà" chỉ khi chọn rõ
// ============================================================================
test('Hai bé: bé A có mục không chặn thêm cho bé B; mục "Cả nhà" chỉ khi chọn rõ, rồi mọi bé thấy "Đã thêm (mục chung)"', async ({ page }) => {
  await enterParentMode(page);
  await gotoDailyLivingLibrary(page);

  const childSelect = page.getByTestId('daily-living-child-select');
  const options = await childSelect.locator('option').allTextContents();
  const childOptions = options.filter((o) => o && o !== '— Chọn bé —' && o !== 'Cả nhà');
  expect(childOptions.length).toBeGreaterThanOrEqual(2);

  const childA = childOptions[0];
  const childB = childOptions[1];

  // Add habit for child A
  await selectChild(page, childA);
  await addHabitFromLibrary(page, 'WIT-DLY-01');
  await waitForStatus(page, 'daily-living-saved-notice');
  await expectHabitAdded(page, 'WIT-DLY-01');

  // Switch to child B - should be able to add same habit
  await selectChild(page, childB);
  await expectHabitAvailable(page, 'WIT-DLY-01');

  await addHabitFromLibrary(page, 'WIT-DLY-01');
  await waitForStatus(page, 'daily-living-saved-notice');
  await expectHabitAdded(page, 'WIT-DLY-01');

  // Now test explicit shared scope ("Cả nhà")
  await selectSharedScope(page);
  await expect(page.getByTestId('daily-living-shared-note')).toBeVisible();

  // Add WIT-DLY-03 ("Rửa mặt") as shared
  await addHabitFromLibrary(page, 'WIT-DLY-03');
  await waitForStatus(page, 'daily-living-saved-notice');
  await expectHabitAdded(page, 'WIT-DLY-03', false);

  // Switch to child A - should see shared habit as "Đã thêm (mục chung)"
  await selectChild(page, childA);
  await expectHabitAdded(page, 'WIT-DLY-03', true);

  // Switch to child B - should also see shared habit as "Đã thêm (mục chung)"
  await selectChild(page, childB);
  await expectHabitAdded(page, 'WIT-DLY-03', true);
});

// ============================================================================
// TEST 6: Onboarding - phụ huynh mới chọn "Bắt đầu với sinh hoạt hằng ngày"
// ============================================================================
test('Onboarding: phụ huynh mới chọn "Bắt đầu với sinh hoạt hằng ngày", giữ đánh răng sáng + rửa mặt, hoàn tất → đúng 2 mục ở Đang dùng và ở màn hình bé', async ({ page, baseURL }) => {
  test.setTimeout(120_000);

  const profiles: Record<string, unknown>[] = [];
  const activities: Record<string, unknown>[] = [];
  const rewards: Record<string, unknown>[] = [];
  const subscription: Record<string, unknown> = {
    plan: 'free',
    status: 'active',
    trial_ends_at: null,
    subscription_ends_at: null,
  };
  let pinConfigured = false;

  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/referral/claim', (route) => route.fulfill({ status: 200, json: { state: 'hidden' } }));
  await installCloudFamilyFixture(page, baseURL, { profiles, activities, rewards, subscription });

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

  await page.route('**/api/privacy/consent', async (route) => {
    await route.fulfill({ status: 200, json: { success: true } });
  });

  await page.route('**/api/entitlement/trial', async (route) => {
    Object.assign(subscription, { plan: 'trial', trial_ends_at: '2099-01-01T00:00:00.000Z' });
    await route.fulfill({ status: 200, json: { success: true, entitlement: subscription } });
  });

  await page.route('**/api/domain/profiles', async (route) => {
    const mutation = route.request().postDataJSON() as Extract<ProfileMutation, { type: 'create' }>;
    expect(mutation.type).toBe('create');
    expect(mutation.starterActivities).toHaveLength(0);
    profiles.push({
      ...defaultCloudProfile,
      id: mutation.profile.id,
      name: mutation.profile.name,
      nickname: mutation.profile.nickname,
      points: mutation.profile.points,
      total_earned: mutation.profile.totalEarned,
      level: mutation.profile.level,
      streak: mutation.profile.streak,
      birth_year: mutation.profile.birthYear,
      age_stage: mutation.profile.ageStage,
      is_public_on_leaderboard: mutation.profile.isPublicOnLeaderboard,
    });
    await route.fulfill({ status: 200, json: { success: true, profileId: mutation.profile.id } });
  });

  await page.route('**/api/domain/activities', async (route) => {
    const mutation = route.request().postDataJSON() as Extract<ActivityMutation, { type: 'createMany' }>;
    expect(mutation.type).toBe('createMany');
    for (const activity of mutation.activities) {
      activities.push({
        id: activity.id,
        family_id: defaultCloudProfile.family_id,
        child_id: activity.childId,
        title: activity.title,
        description: activity.description ?? null,
        instructions: activity.instructions ?? null,
        icon: activity.icon,
        category: activity.category,
        points: activity.points,
        recurrence_type: activity.recurrenceType,
        recurrence_days: activity.recurrenceDays ?? [0, 1, 2, 3, 4, 5, 6],
        time_of_day: activity.timeOfDay,
        duration_minutes: activity.durationMinutes ?? 0,
        requires_approval: activity.requiresApproval,
        is_active: activity.isActive,
        target_age_stage: activity.targetAgeStage ?? 'all',
        is_parent_role: activity.isParentRole ?? false,
        portrait16_key: null,
        bo_thi7_key: null,
        framework_habit_id: null,
        framework_content_version: null,
        legacy_template_id: activity.legacyTemplateId ?? null,
        journey_habit_key: null,
        created_at: activity.createdAt,
      });
    }
    await route.fulfill({
      status: 200,
      json: { success: true, activityIds: mutation.activities.map((a) => a.id) },
    });
  });

  await page.route('**/api/domain/rewards', async (route) => {
    const mutation = route.request().postDataJSON() as Extract<RewardMutation, { type: 'create' }>;
    rewards.push({
      id: mutation.reward.id,
      family_id: defaultCloudProfile.family_id,
      title: mutation.reward.title,
      description: mutation.reward.description,
      icon: mutation.reward.icon,
      cost_points: mutation.reward.costPoints,
      stock: mutation.reward.stock,
      is_active: mutation.reward.isActive,
      created_at: mutation.reward.createdAt,
    });
    await route.fulfill({ status: 200, json: { success: true, rewardId: mutation.reward.id } });
  });

  // Start fresh onboarding
  await page.goto('/start');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Bước 1/5');

  // Step 1: Enter child name
  await dialog.locator('#onboarding-child-name').fill('Bé Test');
  await dialog.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

  // Step 2: Habits step - select "Bắt đầu với sinh hoạt hằng ngày"
  await expect(dialog).toContainText('Bước 2/5');
  await expect(dialog.getByRole('heading', { name: 'Thói quen đầu tiên', exact: true })).toBeFocused();

  await dialog.getByRole('radio', { name: 'Bắt đầu với sinh hoạt hằng ngày' }).check();

  // Verify it shows the "Bắt đầu nhẹ nhàng" set (DLS-01) habits: Đánh răng buổi sáng + Rửa mặt
  await expect(dialog).toContainText('Đánh răng buổi sáng');
  await expect(dialog).toContainText('Rửa mặt');
  await expect(dialog).toContainText('Đã chọn 2 · khuyến nghị 2');

  // Keep both selected (default)
  await dialog.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

  // Step 3: Rewards
  await expect(dialog).toContainText('Bước 3/5');
  await dialog.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

  // Step 4: Confirm
  await expect(dialog).toContainText('Bước 4/5');
  await expect(dialog).toContainText('Bé Test, 5 tuổi · 2 thói quen · 1 quà');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Bắt đầu 7 ngày dùng thử & tạo hồ sơ', exact: true }).click();

  // Step 5: Handoff
  await expect(dialog).toContainText('Bước 5/5');
  await dialog.getByRole('button', { name: 'Dùng chung máy này', exact: true }).click();

  // Skip PIN setup and open kid screen
  await dialog.getByRole('button', { name: 'Bỏ qua, mở màn hình của bé', exact: true }).click();
  await expect(dialog).toHaveCount(0);

  // Verify kid dashboard shows exactly the two habits
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid', { timeout: 20_000 });
  await expect(page.locator('[data-task-card]')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Đánh răng buổi sáng', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rửa mặt', exact: true })).toBeVisible();

  // Go to parent mode to verify in "Đang dùng"
  await unlockParentFromKidMode(page);
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Quản lý việc' }).click();

  const inUseSection = page.getByRole('region', { name: 'Đang dùng' });
  await expect(inUseSection).toBeVisible();
  await expect(inUseSection.getByRole('heading', { name: 'Đang dùng (2)' })).toBeVisible();
  await expect(inUseSection).toContainText('Mã việc: WIT-DLY-01');
  await expect(inUseSection).toContainText('Mã việc: WIT-DLY-03');
});

// ============================================================================
// TEST 7a: a11y - viewport 375px không tràn ngang
// ============================================================================
test('a11y 375px: viewport 375x800 không tràn ngang trên Thư viện sinh hoạt và modal bộ', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });

  await enterParentMode(page);
  await gotoDailyLivingLibrary(page);

  // Check no horizontal overflow on library
  const library = page.getByTestId('daily-living-library');
  await expect(library).toBeVisible();

  const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(375);

  // Open a set modal and check
  await openDailyLivingSet(page, 'DLS-01');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const dialogWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(dialogWidth).toBeLessThanOrEqual(375);

  // Close modal
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

// ============================================================================
// TEST 7b: a11y - AxeBuilder không có serious/critical trên thư viện và modal
// ============================================================================
test('a11y Axe: không có serious/critical violations trên Thư viện sinh hoạt và modal bộ', async ({ page }) => {
  await enterParentMode(page);
  await gotoDailyLivingLibrary(page);

  // Test library accessibility
  const libraryResults = await new AxeBuilder({ page })
    .include('[data-testid="daily-living-library"]')
    .analyze();

  const seriousCriticalLibrary = libraryResults.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(seriousCriticalLibrary).toEqual([]);

  // Test modal accessibility
  await openDailyLivingSet(page, 'DLS-01');

  const modalResults = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze();

  const seriousCriticalModal = modalResults.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(seriousCriticalModal).toEqual([]);

  // Test Escape closes modal and focus returns to trigger button
  const triggerButton = page.locator('[data-testid="daily-living-set-start"][data-set-id="DLS-01"]');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(triggerButton).toBeFocused();
});
