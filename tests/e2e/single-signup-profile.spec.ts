import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { ProfileMutation } from '../../src/lib/domain/profile-mutations';
import type { RewardMutation } from '../../src/lib/domain/reward-mutations';
import { defaultCloudProfile, installCloudFamilyFixture } from './cloud-family-fixture';
import { installCustomerProfileFixture } from './customer-profile-fixture';

const freePlan = { plan: 'free', status: 'active', trial_ends_at: null, subscription_ends_at: null };
const checkoutName = 'Thanh Toán VietQR Tự Động';

// Route mocks must handle requests directly, without the PWA worker taking over.
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.route('**/api/child/session', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/referral/claim', (route) => route.fulfill({ status: 200, json: { state: 'hidden' } }));
});

test('onboarding wizard opens on step 1 with defaults', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { profiles: [], subscription: freePlan });
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/account/profile')) requests.push(request.url()); });
  await page.goto('/start');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Bước 1/5');
  await expect(dialog.locator('#onboarding-child-name')).toBeVisible();
  await expect(dialog.locator('#onboarding-parent-name, #onboarding-parent-phone')).toHaveCount(0);
  await expect(dialog.locator('#onboarding-child-age')).toHaveValue('5');
  await expect(dialog.locator('#onboarding-child-nickname')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Leo', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(requests).toEqual([]);
});

test('onboarding wizard recommends habits by age', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL, { profiles: [], subscription: freePlan });
  await page.goto('/start');
  const dialog = page.getByRole('dialog');
  await dialog.locator('#onboarding-child-name').fill('Minh An');
  await dialog.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(dialog).toContainText('Đã chọn 2 · khuyến nghị 2');
  await dialog.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await dialog.locator('#onboarding-child-age').fill('8');
  await dialog.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(dialog).toContainText('Đã chọn 3 · khuyến nghị 3');
});

test('onboarding wizard ends in the child screen on a shared device', { tag: '@a11y' }, async ({ page, baseURL }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const profiles: Record<string, unknown>[] = [];
  const rewards: Record<string, unknown>[] = [];
  const subscription: Record<string, unknown> = { ...freePlan };
  const pinRequests: string[] = [];
  let releasePinStatus: () => void = () => undefined;
  const pinStatusReady = new Promise<void>((resolve) => { releasePinStatus = resolve; });
  await installCloudFamilyFixture(page, baseURL, { profiles, rewards, subscription });
  await page.route('**/api/parent-pin', async (route) => {
    const method = route.request().method();
    pinRequests.push(method);
    if (method === 'GET') await pinStatusReady;
    await route.fulfill(method === 'DELETE'
      ? { status: 204 }
      : method === 'PUT'
        ? { status: 429, json: { status: 'locked', retryAfterSeconds: 60 } }
      : { status: 200, json: { configured: false, lockedUntil: null } });
  });
  await page.route('**/api/privacy/consent', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ policyVersion: '2026-09-19', childDataConsent: true });
    await route.fulfill({ status: 200, json: { success: true } });
  });
  await page.route('**/api/entitlement/trial', async (route) => {
    Object.assign(subscription, { plan: 'trial', trial_ends_at: '2099-01-01T00:00:00.000Z' });
    await route.fulfill({ status: 200, json: { success: true, entitlement: subscription } });
  });
  await page.route('**/api/domain/profiles', async (route) => {
    const mutation = route.request().postDataJSON() as Extract<ProfileMutation, { type: 'create' }>;
    expect(mutation.type).toBe('create');
    expect(mutation.starterActivities).toHaveLength(2);
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
  await page.route('**/api/domain/rewards', async (route) => {
    const mutation = route.request().postDataJSON() as Extract<RewardMutation, { type: 'create' }>;
    expect(mutation.type).toBe('create');
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
  await page.goto('/start');
  const dialog = page.getByRole('dialog');
  const checkStep = async (step: number, title: string) => {
    await expect(dialog).toContainText(`Bước ${step}/5`);
    if (step > 1) await expect(dialog.getByRole('heading', { name: title, exact: true })).toBeFocused();
    const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')).toEqual([]);
  };
  await checkStep(1, 'Bé của bạn');
  await dialog.locator('#onboarding-child-name').fill('Minh An');
  await dialog.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await checkStep(2, 'Thói quen đầu tiên');
  await dialog.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await checkStep(3, 'Quà để đổi sao');
  await dialog.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await checkStep(4, 'Xác nhận & bắt đầu');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Bắt đầu 7 ngày dùng thử & tạo hồ sơ', exact: true }).click();
  await checkStep(5, 'Đưa app cho bé');
  await expect(dialog).not.toContainText('Chưa thêm được quà');
  expect(subscription.plan).toBe('trial');
  await expect(page).toHaveURL(/\/start$/);
  await dialog.getByRole('button', { name: 'Dùng chung máy này', exact: true }).click();
  await expect(dialog.locator('#onboarding-parent-pin')).toHaveCount(0);
  await expect(dialog.getByRole('status')).toHaveText('Đang kiểm tra mã PIN…');
  releasePinStatus();
  await dialog.locator('#onboarding-parent-pin').fill('12');
  await dialog.getByRole('button', { name: 'Đặt PIN & mở màn hình của bé', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('PIN cần đúng 4 chữ số.');
  await dialog.locator('#onboarding-parent-pin').fill('1234');
  await dialog.getByRole('button', { name: 'Đặt PIN & mở màn hình của bé', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Chưa thể lưu mã PIN. Vui lòng thử lại.');
  await dialog.getByRole('button', { name: 'Bỏ qua, mở màn hình của bé', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
  await expect.poll(() => pinRequests).toContain('DELETE');
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /PIN/i })).toBeVisible();
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid');
});

test('an incomplete account can use the app after login without a blocking prompt', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  const account = await installCustomerProfileFixture(page, { display_name: '', email: 'parent@example.test', phone: null, marketing_consent: false });
  await page.goto('/');
  await expect(page.getByTestId('app-surface')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Hoàn thiện thông tin khách hàng' })).toHaveCount(0);
  expect(account.saves).toEqual([]);
});

test('checkout asks once before terms and referral, validates the phone and remembers server details', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  const account = await installCustomerProfileFixture(page);
  const orders: unknown[] = [];
  await page.route('**/api/payment/create', async (route) => {
    orders.push(route.request().postDataJSON());
    await route.fulfill({ status: 503, json: { success: false } });
  });
  await page.goto('/checkout?plan=monthly');
  const dialog = page.getByRole('dialog', { name: checkoutName });
  const save = dialog.getByRole('button', { name: 'Lưu và tiếp tục' });
  await expect(save).toBeDisabled();
  await expect(dialog.getByLabel(/Tôi đồng ý nhận hướng dẫn/)).not.toBeChecked();
  await expect(dialog.getByRole('button', { name: 'Tiếp tục tạo đơn thanh toán' })).toHaveCount(0);
  await dialog.getByLabel('Số điện thoại', { exact: true }).fill('abc123');
  await expect(save).toBeDisabled();
  await expect(dialog.getByRole('alert')).toContainText('Số điện thoại chưa hợp lệ');
  expect(orders).toEqual([]);
  await dialog.getByLabel('Số điện thoại', { exact: true }).fill('0912 345 678');
  await dialog.getByLabel(/Tôi đồng ý nhận hướng dẫn/).check();
  await save.click();
  await expect(dialog.getByLabel('Số điện thoại', { exact: true })).toHaveCount(0);
  expect(account.saves).toEqual([{ displayName: 'Nguyễn An', phone: '0912 345 678', marketingConsent: true }]);
  expect(account.current().phone).toBe('0912345678');
  if (process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true') {
    expect(orders).toEqual([]);
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'Tiếp tục tạo đơn thanh toán' }).click();
  }
  await expect.poll(() => orders.length).toBe(1);
  await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục thanh toán' }).click();
  await expect(dialog).toContainText(process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true' ? 'Tiếp tục tạo đơn thanh toán' : 'Hệ thống thanh toán tạm thời chưa sẵn sàng.');
  await expect(dialog.getByLabel('Số điện thoại', { exact: true })).toHaveCount(0);
  expect(account.saves).toHaveLength(1);
  await page.reload();
  await expect(dialog).toContainText(process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true' ? 'Tiếp tục tạo đơn thanh toán' : 'Hệ thống thanh toán tạm thời chưa sẵn sàng.');
  await expect(dialog.getByLabel('Số điện thoại', { exact: true })).toHaveCount(0);
  expect(account.saves).toHaveLength(1);
});

test('checkout load failure retries before allowing payment and can be closed', async ({ page, baseURL }) => {
  await installCloudFamilyFixture(page, baseURL);
  let fail = true;
  await page.route('**/api/account/profile', (route) => route.fulfill(fail
    ? { status: 503, json: {} }
    : { status: 200, json: { profile: { display_name: 'Nguyễn An', email: 'parent@example.test', phone: null, marketing_consent: false } } }));
  const orders: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/payment/create')) orders.push(request.url()); });
  await page.goto('/checkout?plan=monthly');
  const dialog = page.getByRole('dialog', { name: checkoutName });
  await expect(dialog.getByRole('alert')).toContainText('Chưa tải được');
  fail = false;
  await dialog.getByRole('button', { name: 'Thử lại' }).click();
  await expect(dialog.getByLabel('Số điện thoại', { exact: true })).toBeVisible();
  expect(orders).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('the demo never asks for customer details', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/account/profile')) requests.push(request.url()); });
  await page.goto('/?demo=1');
  await expect(page.getByTestId('app-surface')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(requests).toEqual([]);
});
