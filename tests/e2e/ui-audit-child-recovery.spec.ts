import { expect, test, type Locator } from '@playwright/test';
import { activityId, day, pairedChild, rewardId } from './ui-audit-child-fixture';
import { taskTitleAndToggleBoxes, usableBand } from './ui-audit-fixture';
import { getKidQuestCopy } from '../../src/lib/i18n/kid-quest-copy';
import { getKidHistoryCopy } from '../../src/lib/i18n/kid-history-copy';

// Deliberately red before approved Phase04: assertions describe the accepted contract,
// not current optimistic store expectations. No test.fail/skip or conditional passes.
test.describe('paired child truthful save/recovery — Phase04 preparation', () => {
  test.setTimeout(60_000);

  async function doubleEvent(control: Locator) {
    // Same JS turn exercises the handler guard before React can render disabled.
    await control.evaluate((element) => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  }

  test('delayed completion guards duplicate events and pending approval never verifies points', async ({ page }) => {
    const f = await pairedChild(page, { approval: true });
    const toggle = f.card.locator('[data-task-toggle]');
    await doubleEvent(toggle);
    const first = await f.received(1);
    expect(first.command).toEqual({ type: 'completeHabit', activityId, date: day, commandId: expect.any(String) });
    await expect(toggle).toBeDisabled();
    await expect.soft(f.card).toHaveAttribute('data-complete', 'false');
    await expect.soft(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect.soft(f.balance(40)).toBeVisible();
    await expect.soft(f.card.getByTestId('task-praise')).toHaveCount(0);
    await expect.soft(f.card.getByTestId('point-burst')).toHaveCount(0);
    await expect.soft(f.card.getByText('Đang lưu…', { exact: true })).toBeVisible();
    // Advancing browser time never releases the held network acknowledgement.
    await page.clock.runFor(2_000);
    expect.soft(f.commands.length).toBe(1);
    await f.complete(first, true);
    for (const duplicate of f.commands.slice(1)) {
      await duplicate.route.fulfill({ json: { success: true, result: { status: 'duplicate' } } });
    }
    await expect(toggle).toHaveAccessibleName(/chờ.*duyệt/i);
    await expect(toggle).toBeDisabled();
    await expect(f.card).toHaveAttribute('data-complete', 'false');
    await expect(f.balance(40)).toBeVisible();
    await expect.soft(f.card.locator('[data-task-state]')).toHaveText('Chờ ba mẹ duyệt');
    expect(f.commands.length).toBe(1);
    expect(f.foreignCommands).toEqual([]);
  });

  test('actual pending ACK overrides nonapproval metadata without verified praise or points', async ({ page }) => {
    const f = await pairedChild(page); // stale metadata says approval is unnecessary
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await f.card.locator('[data-task-toggle]').click();
    const first = await f.received(1);
    await expect(f.card.getByTestId('task-praise')).toHaveCount(0);
    await f.complete(first, true);
    await expect(f.card.locator('[data-task-state]')).toHaveText('Chờ ba mẹ duyệt');
    await expect(f.card).toHaveAttribute('data-complete', 'false');
    await expect(f.balance(40)).toBeVisible();
    await expect(f.card.getByTestId('point-burst')).toHaveCount(0);
    await expect(f.card.getByTestId('task-praise')).not.toContainText('+10');
    expect(f.commands).toHaveLength(1);
  });

  test('lost committed completion reconciles on explicit retry before a later intentional undo', async ({ page }) => {
    const f = await pairedChild(page);
    await f.card.locator('[data-task-toggle]').click();
    const first = await f.received(1);
    if (first.command.type !== 'completeHabit') throw new Error('expected completion');
    f.session.logs = [{ id: first.command.commandId, activityId, childId: f.session.child.id, date: day,
      status: 'completed', pointsAwarded: 7, completedAt: new Date().toISOString() }];
    f.session.child.points = 47;
    f.session.child.totalEarned = 47;
    f.setRefreshAvailable(false);
    await first.route.abort('failed');
    await expect(f.card.locator('p[role="alert"]')).toContainText('Chưa xác nhận được');
    await expect(f.balance(40)).toBeVisible();
    await expect(f.card.getByTestId('task-praise')).toHaveCount(0);
    await f.card.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(f.card.locator('p[role="alert"]')).toBeVisible();
    expect(f.commands).toHaveLength(1);
    f.setRefreshAvailable(true);
    await f.card.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(f.card).toHaveAttribute('data-complete', 'true');
    await expect(f.card.locator('p[role="alert"]')).toHaveCount(0);
    await expect(f.balance(47)).toBeVisible();
    expect(f.commands).toHaveLength(1); // original completion finished, never undo
    if (await page.getByTestId('badge-celebration').count()) {
      await page.getByTestId('badge-celebration').getByRole('button').first().click();
    }
    await f.card.locator('[data-task-toggle]').click();
    const undo = await f.received(2);
    expect(undo.command).toEqual({ type: 'undoHabit', logId: first.command.commandId });
    f.session.logs = [];
    f.session.child.points = 40;
    f.session.child.totalEarned = 40;
    await undo.route.fulfill({ json: { success: true, result: { status: 'undone' } } });
    await expect(f.card).toHaveAttribute('data-complete', 'false');
    await expect(f.balance(40)).toBeVisible();
  });

  test('lost committed reward cannot debit twice; recovery finishes it and a later intentional claim is fresh', async ({ page }) => {
    const f = await pairedChild(page);
    await page.getByRole('button', { name: 'Đổi quà', exact: true }).first().click();
    await page.getByRole('button', { name: 'Đổi quà này', exact: true }).click();
    const first = await f.received(1);
    if (first.command.type !== 'redeemReward') throw new Error('expected claim');
    f.session.redemptions = [{ id: first.command.commandId, rewardId, childId: f.session.child.id,
      status: 'pending', pointsSpent: 15, requestedAt: new Date().toISOString() }];
    f.session.child.points = 25;
    f.setRefreshAvailable(false);
    await first.route.abort('failed');
    await expect(page.locator('p[role="alert"]')).toContainText('Chưa xác nhận được');
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(page.locator('p[role="alert"]')).toBeVisible();
    expect(f.commands).toHaveLength(1);
    f.setRefreshAvailable(true);
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(page.locator('p[role="alert"]')).toHaveCount(0);
    await expect(f.balance(25)).toBeVisible();
    expect(f.commands).toHaveLength(1);
    await page.getByRole('button', { name: 'Đổi quà này', exact: true }).click();
    const later = await f.received(2);
    expect(later.command.type).toBe('redeemReward');
    if (later.command.type !== 'redeemReward') throw new Error('expected second claim');
    expect(later.command.commandId).not.toBe(first.command.commandId);
    f.session.redemptions.push({ ...f.session.redemptions[0], id: later.command.commandId });
    f.session.child.points = 10;
    await later.route.fulfill({ json: { success: true, result: { status: 'pending', redemptionId: later.command.commandId } } });
    await expect(f.balance(10)).toBeVisible();
    expect(f.commands).toHaveLength(2);
  });

  test('failed completion preserves card and points, offers localized explicit safe retry', async ({ page }) => {
    const f = await pairedChild(page);
    const toggle = f.card.locator('[data-task-toggle]');
    await toggle.click();
    const first = await f.received(1);
    expect(first.command).toEqual({ type: 'completeHabit', activityId, date: day, commandId: expect.any(String) });
    // Non-approval branch must not guess verified credit either (the first case
    // separately protects the no-credit pending-approval branch).
    await expect.soft(f.card).toHaveAttribute('data-complete', 'false');
    await expect.soft(f.balance(40)).toBeVisible();
    await expect.soft(page.getByTestId('badge-celebration'), 'a held command must not earn a badge celebration').toHaveCount(0);
    await f.refuse(first);
    const error = f.card.locator('p[role="alert"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/Chưa xác nhận được.*thử lại/i);
    await expect.soft(error).not.toContainText(/request-409|synthetic-child-recovery|The child action|failureCode/);
    await expect(f.card).toHaveAttribute('data-complete', 'false');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(f.balance(40)).toBeVisible();
    await expect(f.card.getByTestId('task-praise')).toHaveCount(0);
    await page.clock.runFor(5_000);
    expect(f.commands.length).toBe(1); // no automatic replay
    // Accepted draft says retry explicitly. Reusing the completion control is safe
    // only when it is visibly relabelled; do not silently fall back in this test.
    await f.card.getByRole('button', { name: /thử.*lại/i }).click();
    const retry = await f.received(2);
    expect(retry.command).toEqual({ type: 'completeHabit', activityId, date: day, commandId: expect.any(String) });
    await f.complete(retry);
    await expect(f.card).toHaveAttribute('data-complete', 'true');
    await expect(f.balance(50)).toBeVisible();
    await expect(f.card.locator('p[role="alert"]')).toHaveCount(0);
    expect(f.commands.length).toBe(2);
    expect(f.foreignCommands).toEqual([]);
  });

  test('timer ended plus save failure retains elapsed result and focused retry', async ({ page }) => {
    const f = await pairedChild(page, { timer: true });
    await f.card.getByRole('button', { name: /1m Bắt đầu/ }).click();
    const timer = page.getByRole('dialog', { name: 'Đồng hồ thói quen', exact: true });
    await timer.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
    // runFor (not fastForward) fires every nested React countdown timeout.
    for (let second = 0; second < 60; second += 1) await page.clock.runFor(1_000);
    await expect(timer.getByText('Hoàn thành thời gian', { exact: true })).toBeVisible();
    expect(f.commands.length).toBe(0);
    await doubleEvent(timer.getByRole('button', { name: /Đã xong/ }));
    const first = await f.received(1);
    expect(first.command).toEqual({ type: 'completeHabit', activityId, date: day, commandId: expect.any(String) });
    await expect(timer.getByRole('button', { name: 'Đang lưu…', exact: true })).toBeDisabled();
    await page.clock.runFor(1_000);
    expect(f.commands).toHaveLength(1);
    await f.refuse(first);
    await expect(timer, 'timer result must survive failed habit save').toBeVisible();
    await expect(timer.getByText('Hoàn thành thời gian', { exact: true })).toBeVisible();
    await expect(timer.locator('p[role="alert"]')).toContainText(/Chưa xác nhận được.*thử lại/i);
    await expect(f.balance(40)).toBeVisible();
    const retryButton = timer.getByRole('button', { name: /thử.*lại/i });
    await expect(retryButton).toBeFocused();
    await retryButton.press('Enter');
    const retry = await f.received(2);
    expect(retry.command).toEqual({ type: 'completeHabit', activityId, date: day, commandId: expect.any(String) });
    await f.complete(retry);
    await expect(timer).toHaveCount(0);
    await expect(f.card).toHaveAttribute('data-complete', 'true');
    expect(f.commands.length).toBe(2);
    expect(f.foreignCommands).toEqual([]);
  });

  test('reward failure preserves balance and selected goal without duplicate claim workflow', async ({ page }) => {
    const f = await pairedChild(page);
    await page.getByRole('button', { name: 'Đổi quà', exact: true }).first().click();
    const claim = page.getByRole('button', { name: 'Đổi quà này', exact: true });
    const rewardCard = page.getByRole('heading', { name: 'Chọn truyện cùng nhà', exact: true })
      .last().locator('xpath=ancestor::div[.//button][1]');
    await expect(page.getByText('40 / 15 ⭐', { exact: true })).toBeVisible();
    await doubleEvent(claim);
    const first = await f.received(1);
    expect(first.command).toEqual({ type: 'redeemReward', rewardId, commandId: expect.any(String) });
    // Saving replaces the idle name: assert native disabled + visible saving on
    // the same reward card, without requiring a stale idle accessible name.
    await expect.soft(rewardCard.getByRole('button', { name: 'Đang lưu…', exact: true })).toBeDisabled();
    await f.refuse(first);
    // Drain any duplicate too so the observed defect is not an orphaned request.
    for (const duplicate of f.commands.slice(1)) await f.refuse(duplicate);
    await expect.soft(f.balance(40)).toBeVisible();
    await expect.soft(page.getByText('40 / 15 ⭐', { exact: true })).toBeVisible();
    await expect.soft(page.getByRole('heading', { name: 'Chọn truyện cùng nhà', exact: true })).toHaveCount(2);
    await page.clock.runFor(5_000);
    expect.soft(f.commands.length, 'one logical claim despite same-turn double event').toBe(1);
    const error = rewardCard.getByRole('alert').filter({ hasText: /Chưa xác nhận được.*thử lại/i });
    await expect(error).toBeVisible();
    await expect(error).not.toContainText(/request-409|synthetic-child-recovery|The child action/);
    await rewardCard.getByRole('button', { name: /thử.*lại/i }).click();
    const retry = await f.received(2);
    expect(retry.command).toEqual({ type: 'redeemReward', rewardId, commandId: expect.any(String) });
    await f.refuse(retry);
    expect(f.commands.length).toBe(2);
    expect(f.foreignCommands).toEqual([]);
  });

  test('a delayed failure stays on its editable day and never adds a retry to history', async ({ page }) => {
    const f = await pairedChild(page, { approval: true });
    await f.card.locator('[data-task-toggle]').click();
    const first = await f.received(1);
    await page.getByRole('button', { name: 'Ngày trước', exact: true }).click();
    await expect(f.card.locator('[data-task-toggle]')).toHaveCount(0);
    await f.refuse(first);
    await expect(f.card.locator('p[role="alert"]')).toHaveCount(0);
    await expect(f.card.getByRole('button', { name: 'Thử lại', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Ngày tiếp theo', exact: true }).click();
    await expect(f.card.locator('p[role="alert"]')).toContainText('Chưa xác nhận được');
    await expect(f.card.getByRole('button', { name: 'Thử lại', exact: true })).toBeEnabled();
    expect(f.commands).toHaveLength(1);
  });
});

test.describe('04a paired child task hierarchy', () => {
  for (const actor of [
    { name: 'guided child', profile: { birthYear: 2020, ageStage: '3-6' as const } },
    { name: 'older child', profile: { birthYear: 2015, ageStage: '6-12' as const } },
    { name: 'teen', profile: { birthYear: 2011, ageStage: '12-18' as const } },
    { name: 'unknown age', profile: { birthYear: undefined, ageStage: undefined } },
    { name: 'caregiver', profile: { birthYear: 2025, ageStage: '0-3' as const } },
  ]) {
    test(`${actor.name}: paired first title and recording action fit 375×812`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      const f = await pairedChild(page, { profile: actor.profile });
      const { top, bottom } = await usableBand(page);
      const boxes = await taskTitleAndToggleBoxes(page);
      expect(boxes.title).not.toBeNull();
      expect(boxes.toggle).not.toBeNull();
      for (const box of [boxes.title!, boxes.toggle!]) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(375);
        expect(box.y).toBeGreaterThanOrEqual(top);
        expect(box.y + box.height).toBeLessThanOrEqual(bottom);
      }
      if (actor.name === 'caregiver') {
        const context = page.getByTestId('kid-hero').getByText(/Nhật ký làm gương của ba mẹ/);
        await expect(context).toBeInViewport();
        await expect(page.getByRole('button', { name: 'Xem cẩm nang', exact: true })).toBeVisible();
      }
      await expect(f.card.getByRole('heading', { level: 3, name: 'Cất sách sau khi đọc', exact: true })).toBeVisible();
      await expect(f.card.locator('[data-task-state]')).toHaveText('Chưa làm');
      expect(f.commands).toHaveLength(0);
      console.info(`[04a geometry ${actor.name}] ${JSON.stringify({ top, bottom, boxes })}`);
    });
  }

  test('an empty paired day explains the absence and retains day navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const f = await pairedChild(page, { empty: true });
    await expect(page.locator('[data-task-card]')).toHaveCount(0);
    await expect(page.getByText('Hôm nay không có nhiệm vụ', { exact: true }).last()).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Ngày trước', exact: true })).toBeEnabled();
    expect(f.commands).toHaveLength(0);
  });

  test('task supporting text has measured contrast and the confirmed tofu uses an icon', async ({ page }) => {
    const description = 'Giữ nguyên lời hướng dẫn thực hành của gia đình.';
    const f = await pairedChild(page, { description, icon: '🪥' });
    await expect(f.card.locator('svg.lucide-brush')).toHaveCount(1);
    for (const theme of ['light', 'dark'] as const) {
      // Paired-child Header intentionally has no theme picker. Exercise its
      // existing persisted-choice subscription, never force a .dark CSS class.
      await page.evaluate((value) => {
        localStorage.setItem('kidhabit_theme', value);
        dispatchEvent(new Event('kidhabit-appearance-change'));
      }, theme);
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(theme);
      // Settle transitions before canvas composites CSS/oklch colors to sRGB.
      const measure = () => f.card.getByText(description, { exact: true }).evaluate((element) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
        if (!ctx) throw new Error('sRGB canvas unavailable');
        const ancestors: Element[] = [];
        for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1, 1);
        for (const node of ancestors) {
          const style = getComputedStyle(node);
          if (style.backgroundImage !== 'none' || Number(style.opacity) !== 1) throw new Error('Contrast requires flat, opaque ancestors');
          ctx.fillStyle = style.backgroundColor; ctx.fillRect(0, 0, 1, 1);
        }
        const background = Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
        ctx.fillStyle = getComputedStyle(element).color; ctx.fillRect(0, 0, 1, 1);
        const foreground = Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
        const luminance = (rgb: number[]) => rgb.reduce((sum, c, i) => {
          const s = c / 255;
          return sum + (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
        }, 0);
        const a = luminance(background), b = luminance(foreground);
        return { foreground, background, contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
      let previous = '', stable = 0;
      await expect.poll(async () => {
        const current = JSON.stringify(await measure());
        stable = current === previous ? stable + 1 : 0; previous = current;
        return stable;
      }, { intervals: [100] }).toBeGreaterThanOrEqual(3);
      const measured = await measure();
      expect(measured.contrast, `${theme}: ${JSON.stringify(measured)}`).toBeGreaterThanOrEqual(4.5);
      console.info(`[04a description contrast ${theme}] ${JSON.stringify(measured)}`);
    }
  });

  test('long profile, nine locales and enlarged text reflow without hiding the task action', async ({ page }) => {
    test.setTimeout(60_000);
    const f = await pairedChild(page, { profile: { name: 'Bé có tên dài Nguyễn Hoàng Minh Anh Gia Đình' } });
    for (const locale of ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const) {
      await page.locator('header').getByRole('combobox').selectOption(locale);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(f.card.locator('[data-task-state]')).toHaveText(getKidHistoryCopy(locale).statusNotDone);
      expect(getKidQuestCopy(locale).retry.trim().length).toBeGreaterThan(1);
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 812 });
        await f.card.locator('[data-task-toggle]').scrollIntoViewIfNeeded();
        await expect(f.card.locator('[data-task-toggle]')).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} at ${width}`).toBe(true);
      }
    }
    // These are existing saved choices, delivered through the appearance store;
    // no CSS/font shrink or optional feature flag is injected.
    for (const size of ['normal', 'large', 'xlarge']) {
      await page.evaluate((value) => {
        localStorage.setItem('kidhabit_font_size', value);
        dispatchEvent(new Event('kidhabit-appearance-change'));
      }, size);
      await page.setViewportSize({ width: 375, height: 812 });
      await f.card.locator('[data-task-toggle]').scrollIntoViewIfNeeded();
      await expect(f.card.locator('[data-task-toggle]')).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), size).toBe(true);
    }
    expect(f.commands).toHaveLength(0);
  });
});
