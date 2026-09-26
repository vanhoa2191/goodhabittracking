import { expect, test } from '@playwright/test';
import { openLocalFamilySetup } from './open-local-family-setup';
import { getVisiblePricingOpener } from './open-pricing';

test('landing page renders without an application error', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByText(/application error/i)).toHaveCount(0);
});

test('demo entry opens the child dashboard without reloading', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();

  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An' })).toBeVisible();
  await expect(page.getByText('Tiến độ hôm nay')).toBeVisible();
  await expect(page.getByText(/Chế độ khám phá:/)).toBeVisible();
});

test('reward goal appears only after the child chooses it', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Đổi quà', exact: true }).click();
  await expect(page.getByText('Mục tiêu quà mơ ước')).toHaveCount(0);

  const rewardCard = page.getByRole('heading', { name: 'Xem phim hoạt hình 30 phút' })
    .locator('xpath=ancestor::div[contains(@class,"rounded-3xl")][1]');
  const goalButton = rewardCard.getByRole('button', { name: 'Đặt làm mục tiêu' });
  await goalButton.click();
  await expect(goalButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Mục tiêu quà mơ ước')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('reward-goal.png') });
});

test('habit fire follows verified completion and undo on mobile', async ({ page }, testInfo) => {
  // Given: a child in the local demo with no verified completion today.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An' })).toBeVisible();
  const fire = page.getByTestId('habit-fire');
  const taskCard = page
    .getByRole('heading', { name: 'Nhan thí: Tươi cười chào buổi sáng' })
    .locator('xpath=ancestor::*[@data-task-card][1]');

  // When: the child completes today's task.
  await taskCard.getByRole('button', { name: 'Nhiệm vụ' }).click();

  // Then: the verified day is visible without horizontal overflow.
  await expect(fire).toHaveAttribute('data-state', 'active');
  await expect(fire).toContainText('1 ngày liên tiếp');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('fire-mobile.png') });
  for (const width of [768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`fire-${width}.png`) });
  }

  // When: the child undoes that completion.
  await taskCard.getByRole('button', { name: 'Đã xong' }).click();

  // Then: the fire no longer claims a completed day.
  await expect(fire).toHaveAttribute('data-state', 'cold');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('fire-cold.png') });
});

test('demo child can inspect and independently complete a full task card', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-25T05:00:00.000Z'));
  const domainMutationRequests: string[] = [];
  const invalidButtonErrors: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/domain/commands')) {
      domainMutationRequests.push(request.method());
    }
  });
  page.on('console', (message) => {
    if (
      message.type() === 'error'
      && (message.text().includes('cannot be a descendant') || message.text().includes('cannot contain a nested'))
    ) {
      invalidButtonErrors.push(message.text());
    }
  });

  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();

  const taskCard = page
    .getByRole('heading', { name: 'Nhan thí: Tươi cười chào buổi sáng' })
    .locator('xpath=ancestor::*[@data-task-card][1]');
  const taskToggle = taskCard.getByRole('button', { name: 'Nhiệm vụ' });

  await expect(taskCard.getByText('Nở nụ cười rạng rỡ và khoanh tay chào ông bà, bố mẹ khi ngủ dậy'))
    .toBeVisible();
  await taskCard.getByRole('button', { name: /Xem chi tiết/ }).click();
  const details = page.getByRole('dialog', { name: 'Chi tiết nhiệm vụ' });
  await expect(details.getByText('Nở nụ cười rạng rỡ và khoanh tay chào ông bà, bố mẹ khi ngủ dậy'))
    .toBeVisible();
  await details.getByRole('button', { name: 'Đóng' }).click();

  const pointBurst = expect(taskCard.getByTestId('point-burst')).toContainText('+10');
  await taskToggle.click();
  await pointBurst;
  await expect(page.getByRole('dialog', { name: 'Chi tiết nhiệm vụ' })).toHaveCount(0);
  await expect(taskCard).toHaveAttribute('data-complete', 'true');
  await expect(page.getByText('1/6 việc hoàn thành (17%)')).toBeVisible();

  await taskCard.getByRole('button', { name: 'Đã xong' }).click();
  await expect(page.getByText('0/6 việc hoàn thành (0%)')).toBeVisible();
  expect(domainMutationRequests).toEqual([]);
  expect(invalidButtonErrors, 'task cards must not nest interactive buttons').toEqual([]);
});

test('reduced motion uses static task completion feedback', async ({ page }) => {
  // Given
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  const taskCard = page
    .getByRole('heading', { name: 'Nhan thí: Tươi cười chào buổi sáng' })
    .locator('xpath=ancestor::*[@data-task-card][1]');

  // When
  await taskCard.getByRole('button', { name: 'Nhiệm vụ' }).click();

  // Then
  await expect(taskCard.getByRole('status')).toContainText('Hoàn thành');
  await expect(taskCard.getByTestId('point-burst')).toHaveCount(0);
});

test('demo reward request can be delivered by a parent in one visible action', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Đổi quà', exact: true }).click();

  const rewardCard = page
    .getByRole('heading', { name: 'Xem phim hoạt hình 30 phút' })
    .locator('xpath=ancestor::div[contains(@class,"rounded-3xl")][1]');
  await rewardCard.getByRole('button', { name: 'Đổi quà này' }).click();
  await expect(page.getByText('Chờ duyệt').first()).toBeVisible();

  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }

  const pendingReward = page.getByText('Xem phim hoạt hình 30 phút').first();
  await expect(pendingReward).toBeVisible();
  await pendingReward
    .locator('xpath=ancestor::div[contains(@class,"bg-pink-50")][1]')
    .getByRole('button', { name: 'Đã trao quà' })
    .click();
  await expect(pendingReward).toBeHidden();
});

test('payment status failures are shown instead of reported as pending', async ({ page }) => {
  await page.route('**/api/payment/create', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        payment: {
          orderCode: 123456,
          amount: 49000,
          description: 'KIDHABIT 123456',
          accountNumber: '0123456789',
          accountName: 'KIDHABIT HERO',
          bankBin: '970422',
          bankName: 'MBBank · Ngân hàng TMCP Quân đội',
          qrCode: '000201010212',
          vietQrUrl: 'data:image/png;base64,cXJjb2Rl',
          checkoutUrl: 'https://pay.payos.vn/web/123456',
          planId: 'monthly',
        },
      }),
    });
  });
  await page.route('**/api/payment/status', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'Could not read payment status.' }),
    });
  });

  await page.goto('/');
  await (await getVisiblePricingOpener(page)).click();
  const pricingDialog = page.getByRole('dialog', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' });
  await pricingDialog.getByRole('button', { name: 'Chọn gói tháng' }).click();

  const checkoutDialog = page.getByRole('dialog', { name: 'Thanh Toán VietQR Tự Động' });
  await expect(checkoutDialog.getByText('0123456789')).toBeVisible();
  await checkoutDialog.getByRole('button', { name: 'Tôi Đã Chuyển Khoản' }).click();

  await expect(checkoutDialog.getByRole('alert')).toHaveText('Could not read payment status.');
  await expect(checkoutDialog.getByText('Đang kiểm tra...')).toHaveCount(0);
});

test('payment checkout shows the exact provider response and secure fallback', async ({ page }) => {
  // Given
  await page.route('**/api/payment/create', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        payment: {
          orderCode: 654321,
          amount: 399000,
          description: 'KIDHABIT 654321',
          accountNumber: '113366668888',
          accountName: 'CONG TY KIDHABIT',
          bankBin: '970422',
          bankName: 'MBBank · Ngân hàng TMCP Quân đội',
          qrCode: '00020101021238570010A000000727',
          vietQrUrl: 'data:image/png;base64,cXJjb2Rl',
          checkoutUrl: 'https://pay.payos.vn/web/provider-link-654321',
          planId: 'yearly',
        },
      }),
    });
  });

  // When
  await page.goto('/');
  await (await getVisiblePricingOpener(page)).click();
  const pricingDialog = page.getByRole('dialog', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' });
  await pricingDialog.getByRole('button', { name: 'Chọn gói năm' }).click();
  const checkoutDialog = page.getByRole('dialog', { name: 'Thanh Toán VietQR Tự Động' });

  // Then
  await expect(checkoutDialog.getByText('CONG TY KIDHABIT')).toBeVisible();
  await expect(checkoutDialog.getByText('113366668888')).toBeVisible();
  await expect(checkoutDialog.getByText('MBBank · Ngân hàng TMCP Quân đội')).toBeVisible();
  await expect(checkoutDialog.getByText('BIN 970422')).toBeVisible();
  await expect(checkoutDialog.getByText('399.000 VNĐ')).toBeVisible();
  await expect(checkoutDialog.getByText('KIDHABIT 654321')).toBeVisible();
  await expect(checkoutDialog.getByRole('img', { name: 'VietQR PayOS' })).toBeVisible();
  await expect(checkoutDialog.getByRole('link', { name: 'Mở trang thanh toán bảo mật' }))
    .toHaveAttribute('href', 'https://pay.payos.vn/web/provider-link-654321');
  await expect(checkoutDialog.getByText('Ngân hàng nhận thanh toán qua PayOS')).toHaveCount(0);
});

test('a family can complete private local-only setup without demo contamination', async ({ page }) => {
  const remoteMutationRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.url().includes('/api/')) {
      remoteMutationRequests.push(request.url());
    }
  });

  await page.goto('/');
  await openLocalFamilySetup(page);

  const dialog = page.getByRole('dialog', { name: 'Thiết lập gia đình' });
  await dialog.getByLabel('Tên của Ba Mẹ / Người nuôi dưỡng *').fill('Mẹ Kiểm Thử');
  await dialog.getByRole('button', { name: /Tiếp Tục/ }).click();
  await dialog.getByLabel('Họ và Tên bé *').fill('Bé Local');
  await dialog.getByRole('checkbox', { name: /Tôi là cha mẹ/ }).check();
  await dialog.getByRole('button', { name: /Hoàn Tất/ }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Bé Local' })).toBeVisible();
  await expect(page.getByText('Nguyễn Minh An')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('kidhabit_storage_mode'))).toBe('local');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bé Local' })).toBeVisible();
  await expect(page.getByText(/Chế độ khám phá:/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: 'Cài đặt' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất dữ liệu dự phòng (JSON)' }).click();
  const backupDownload = await downloadPromise;
  const backupPath = await backupDownload.path();
  expect(backupPath).not.toBeNull();

  await page.getByRole('tab', { name: 'Hôm nay' }).click();
  await page.getByRole('tab', { name: 'Thống kê' }).click();
  page.once('dialog', (prompt) => prompt.accept('DELETE FAMILY'));
  await page.getByRole('button', { name: 'Xóa vĩnh viễn dữ liệu gia đình' }).click();

  await expect(page.getByRole('button', { name: /Khám phá thử ngay/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('kidhabit_profiles') || '[]'))).toEqual([]);
  await page.getByLabel('Nhập dữ liệu từ JSON').setInputFiles(backupPath!);
  await expect(page.getByRole('heading', { name: 'Bé Local' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bé Local' })).toBeVisible();
  expect(remoteMutationRequests).toEqual([]);
});

test('demo parent can unlock and navigate every management section', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();

  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }

  await expect(page.getByRole('heading', { name: 'Phụ huynh' })).toBeVisible();

  const sections = [
    ['Hôm nay', 'Duyệt việc', /Nhiệm vụ chờ bố mẹ duyệt/],
    ['Thiết kế', 'Quản lý việc', /Nuôi dưỡng tâm thái/],
    ['Thiết kế', 'Lộ trình Tuần \/ Tháng', /Các lộ trình theo tuần và tháng/],
    ['Thiết kế', 'Đổi quà', /Kho quà của bé/],
    ['Gia đình', 'Hồ sơ các con', /Mã kết nối cố định cho từng bé/],
    ['Hôm nay', 'Thống kê', /Báo cáo thói quen/],
    ['Gia đình', 'Cài đặt', /Cài đặt phụ huynh/],
  ] as const;

  for (const [areaName, tabName, visibleText] of sections) {
    await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: areaName }).click();
    await page.getByRole('tab', { name: new RegExp(tabName) }).click();
    if (tabName === 'Quản lý việc') await page.getByRole('button', { name: 'Thư viện', exact: true }).click();
    await expect(page.getByText(visibleText).first()).toBeVisible();
    if (tabName === 'Lộ trình Tuần \/ Tháng') {
      await page.getByRole('button', { name: /^(Áp dụng lộ trình cho bé|Thêm \d+ việc còn lại)$/ }).first().click();
      const journeyDialog = page.getByRole('dialog', { name: 'Áp dụng lộ trình cho bé' });
      await expect(journeyDialog).toBeVisible();
      await journeyDialog.getByRole('button', { name: 'Đóng' }).click();
    }
    if (tabName === 'Đổi quà') {
      await page.getByRole('button', { name: 'Tạo phần thưởng mới' }).click();
      const rewardDialog = page.getByRole('dialog', { name: 'Tạo phần thưởng mới' });
      await expect(rewardDialog).toBeVisible();
      await rewardDialog.getByRole('button', { name: 'Đóng' }).click();
    }
  }
});

test('parent navigation has three areas and opens pairing from Family', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();

  const areas = page.getByRole('tablist', { name: 'Khu vực phụ huynh' });
  await expect(areas.getByRole('tab')).toHaveCount(3);
  await areas.getByRole('tab', { name: 'Gia đình' }).click();
  await expect(page.getByText('Mã kết nối cố định cho từng bé')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('parent-family-375.png') });
  await areas.getByRole('tab', { name: 'Thiết kế' }).click();
  await expect(page.getByRole('tab', { name: 'Quản lý việc' })).toBeVisible();
  await areas.getByRole('tab', { name: 'Hôm nay' }).click();
  await expect(page.getByText('Nhiệm vụ chờ bố mẹ duyệt')).toBeVisible();
  await areas.getByRole('tab', { name: 'Hôm nay' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(areas.getByRole('tab', { name: 'Thiết kế' })).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('an English journey creates localized habits', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByRole('button', { name: /Try Demo Now/ }).first().click();
  await page.getByRole('button', { name: /^Parent/ }).click();

  const pinDialog = page.getByRole('dialog');
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }

  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Week & Month Journeys' }).click();
  await page.getByRole('button', { name: /^(Apply Journey to Child|Add \d+ remaining habits)$/ }).first().click();
  const journeyDialog = page.getByRole('dialog', { name: 'Apply Journey to Child' });
  await journeyDialog.getByRole('button', { name: 'Confirm and apply' }).click();

  await expect(page.getByRole('heading', { name: 'Kind smile: Greet family warmly' })).toBeVisible();
  await expect(page.getByText('Nhan thí: Nở nụ cười chào đón người thân')).toHaveCount(0);

  await page.getByRole('tab', { name: 'Week & Month Journeys' }).click();
  await expect(page.getByRole('button', { name: 'All habits in this stage are already on the schedule.' })).toBeDisabled();
  await page.getByRole('tab', { name: 'Habits' }).click();
  await expect(page.getByRole('heading', { name: 'Kind smile: Greet family warmly' })).toHaveCount(1);
});

test('applying a journey to all children adds only their missing assignments', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).first().click();
  const childIds = await page.evaluate(() => {
    const snapshot = JSON.parse(sessionStorage.getItem('kidhabit_demo_state') || '{}');
    return (snapshot.profiles || []).map((profile: { id: string }) => profile.id) as string[];
  });
  expect(childIds).toHaveLength(3);

  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Lộ trình Tuần / Tháng' }).click();
  await page.getByRole('button', { name: /^(Áp dụng lộ trình cho bé|Thêm \d+ việc còn lại)$/ }).first().click();
  let dialog = page.getByRole('dialog', { name: 'Áp dụng lộ trình cho bé' });
  await dialog.getByRole('button', { name: 'Xác nhận áp dụng' }).click();

  await page.getByRole('tab', { name: 'Lộ trình Tuần / Tháng' }).click();
  await page.getByLabel('Xem hành trình của bé').selectOption(childIds[1]);
  await page.getByRole('button', { name: /^(Áp dụng lộ trình cho bé|Thêm \d+ việc còn lại)$/ }).first().click();
  dialog = page.getByRole('dialog', { name: 'Áp dụng lộ trình cho bé' });
  await dialog.getByLabel('Áp dụng cho bé nào?').selectOption('');
  await dialog.getByRole('button', { name: 'Xác nhận áp dụng' }).click();

  await expect.poll(() => page.evaluate(() => {
    const snapshot = JSON.parse(sessionStorage.getItem('kidhabit_demo_state') || '{}');
    return (snapshot.activities || [])
      .filter((item: { journeyHabitKey?: string }) => item.journeyHabitKey === 'week-1:0')
      .map((item: { childId: string | null }) => item.childId)
      .sort();
  })).toEqual([...childIds].sort());
});

test('parent journey map shows weekly and monthly stages without mobile overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).first().click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Lộ trình Tuần / Tháng' }).click();

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('listitem').filter({ hasText: 'Tuần 1:' })).toBeVisible();
    await expect(page.getByText('Đang thực hành').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`journey-weekly-${width}.png`), fullPage: true });

    await page.getByRole('button', { name: 'Lộ trình Tháng Phát Triển' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Tháng 4:' })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`journey-monthly-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Lộ trình 4 Tuần Nền Tảng' }).click();
  }

  const nextStage = page.getByRole('listitem').filter({ hasText: 'Tuần 2:' }).locator('details');
  await expect(nextStage).not.toHaveAttribute('open');
  await nextStage.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(nextStage).toHaveAttribute('open', '');
  await expect(nextStage.getByRole('button', { name: 'Áp dụng lộ trình cho bé' })).toBeVisible();
});

test('English demo keeps child and parent secondary screens in English', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await page.getByRole('button', { name: /Try Demo Now/ }).first().click();

  await expect(page.getByRole('heading', { name: 'Gift a smile: Say good morning cheerfully' })).toBeVisible();
  await expect(page.getByText('Nhan thí: Tươi cười chào buổi sáng')).toHaveCount(0);
  await page.getByRole('button', { name: 'Rewards', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Watch cartoons for 30 minutes' }).first()).toBeVisible();

  await page.getByRole('button', { name: /^Parent/ }).click();
  const pinDialog = page.getByRole('dialog');
  for (const digit of ['1', '2', '3', '4']) {
    await pinDialog.getByRole('button', { name: digit, exact: true }).click();
  }

  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Rewards' }).click();
  await expect(page.getByText('Create motivating rewards children can earn with their stars.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Watch cartoons for 30 minutes' }).first()).toBeVisible();
  await page.getByRole('tab', { name: 'Today' }).click();
  await page.getByRole('tab', { name: 'Analytics' }).click();
  await expect(page.getByText('Habit report')).toBeVisible();
  await page.getByRole('tab', { name: 'Family' }).click();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(page.getByText("Children's devices")).toBeVisible();
  await expect(page.getByText('Backup & restore')).toBeVisible();

  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Habits' }).click();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await expect(page.getByText('Nurture mindset, character, generosity, and healthy routines.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wash both hands with soap before eating' })).toBeVisible();
  await expect(page.getByText('Rửa sạch hai tay bằng xà phòng trước khi vào bàn ăn')).toHaveCount(0);
  await page.getByRole('button', { name: 'Guide to 16 strengths & 7 ways of giving' }).click();
  const guide = page.getByRole('dialog', { name: 'Character and giving guide' });
  await expect(guide.getByText('16 strengths & giving guide')).toBeVisible();
  await expect(guide.getByText('Joy', { exact: true })).toBeVisible();
  await guide.getByRole('tab', { name: '7 ways to give' }).click();
  await expect(guide.getByText('The gift of a smile')).toBeVisible();
  await guide.getByRole('tab', { name: 'Lead by example' }).click();
  await expect(guide.getByText('Five-minute parent reflection')).toBeVisible();
  await guide.getByRole('checkbox', { name: 'Did I make today’s request simple enough to begin?' }).check();
  await expect(guide.getByText('1/5 complete')).toBeVisible();
  await guide.getByRole('button', { name: 'Close guide' }).last().click();
  await page.getByRole('tab', { name: 'Family' }).click();
  await page.getByRole('tab', { name: 'Children' }).click();
  await expect(page.getByText('A persistent connection code for each child')).toBeVisible();
  await expect(page.getByText('Stays active until a parent refreshes it')).toBeVisible();
  await expect(page.getByText('Please sign in with Google to securely sync your family data to the Cloud.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create new child codes' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Copy code' }).first()).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Show QR code' }).first()).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Create a new code for this child' }).first()).toBeDisabled();

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect.poll(() => page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))).toEqual({ clientWidth: 768, scrollWidth: 768 });
});

test('English local setup keeps both onboarding steps fully localized', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'en'));
  await page.reload();
  await openLocalFamilySetup(page, 'Set up on this device');

  const dialog = page.getByRole('dialog', { name: 'Set up your family' });
  await expect(dialog.getByText('Step 1 of 2: Caregiver details')).toBeVisible();
  await dialog.getByLabel('Parent or caregiver name *').fill('Test Parent');
  await dialog.getByRole('button', { name: 'Continue: Add Your Child' }).click();
  await expect(dialog.getByText('Step 2 of 2: Child and age-based journey')).toBeVisible();
  await expect(dialog.getByLabel("Child's full name *")).toBeVisible();
  await expect(dialog.getByText('Age-ready starter habits (Ages 3–6)')).toBeVisible();
  await expect(dialog.getByText('Smile and greet the family each morning')).toBeVisible();
  await expect(dialog.getByText(/Vui lòng|Độ tuổi|Tự động nạp|Quay lại/)).toHaveCount(0);
});
