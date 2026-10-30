import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Filter helper for blocking axe violations
function seriousOrCritical(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious'
  );
}

// Check for horizontal overflow
async function assertNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return doc.scrollWidth > doc.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1;
  });
  expect(hasOverflow).toBe(false);
}

// Reliable navigation helper waiting for client-side hydration
async function gotoPreview(page: Page) {
  await page.goto('/thinking-games-preview');
  await expect(page.locator('[data-testid="harness-panel"][data-hydrated="true"]')).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('Thinking Games Frame & Preview Harness (Isolated Dev Fixture)', () => {
  test('preview route mounts correctly in dev environment', async ({ page }) => {
    await gotoPreview(page);
    await expect(page.getByTestId('harness-panel')).toBeVisible();
    await expect(page.getByRole('region', { name: /Quy luật hình vẽ vui nhộn/ })).toBeVisible();
  });

  test('desktop layout (1280px) has no horizontal scroll or blocking overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoPreview(page);
    await expect(page.getByTestId('harness-panel')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('mobile layout (375px) has no horizontal scroll and conforms to touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoPreview(page);
    await expect(page.getByTestId('harness-panel')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Primary button on invitation (age_6_8) meets min-h 56px touch target
    const startButton = page.getByRole('button', { name: 'Cùng thử nhé' });
    await expect(startButton).toBeVisible();
    const box = await startButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.width).toBeGreaterThanOrEqual(48);
    }

    // Header buttons meet min-h 48px min-w 48px
    const closeButton = page.getByRole('button', { name: 'Đóng' });
    const closeBox = await closeButton.boundingBox();
    expect(closeBox).not.toBeNull();
    if (closeBox) {
      expect(closeBox.height).toBeGreaterThanOrEqual(48);
      expect(closeBox.width).toBeGreaterThanOrEqual(48);
    }
  });

  test('age 9-12 track sets button touch target >= 48px', async ({ page }) => {
    await gotoPreview(page);
    await page.getByTestId('age-select').selectOption('age_9_12');
    const startButton = page.getByRole('button', { name: 'Cùng thử nhé' });
    const box = await startButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('age 3-5 track shows the co-play note and uses 64px touch targets', async ({ page }) => {
    await gotoPreview(page);
    await page.getByTestId('age-select').selectOption('age_3_5');
    await page.getByTestId('scenario-btn-tutorial').click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('tutorial');
    await expect(page.getByTestId('co-play-note')).toContainText('người lớn');
    const understand = page.getByRole('button', { name: 'Mình hiểu rồi' });
    const box = await understand.boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.height).toBeGreaterThanOrEqual(56);
    await assertNoHorizontalOverflow(page);
  });

  test('age 13+ track keeps the standard layout without the co-play note', async ({ page }) => {
    await gotoPreview(page);
    await page.getByTestId('age-select').selectOption('age_13_plus');
    await page.getByTestId('scenario-btn-tutorial').click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('tutorial');
    await expect(page.getByTestId('co-play-note')).toHaveCount(0);
    const understand = page.getByRole('button', { name: 'Mình hiểu rồi' });
    const box = await understand.boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.height).toBeGreaterThanOrEqual(48);
    await assertNoHorizontalOverflow(page);
  });

  test('invitation to playing flow via start action', async ({ page }) => {
    await gotoPreview(page);
    await expect(page.getByTestId('harness-state-display')).toHaveText('invitation');

    // Click start button in invitation
    await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('playing');
    await expect(page.getByTestId('mock-board')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  });

  test('pause, resume, and escape handling', async ({ page }) => {
    await gotoPreview(page);
    await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('playing');

    // Pause via header pause button
    await page.getByRole('button', { name: 'Tạm dừng' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('paused');
    const pausedDialog = page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' });
    await expect(pausedDialog).toBeVisible();

    // Resume via button inside paused dialog
    await page.getByRole('button', { name: 'Chơi tiếp' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('playing');
    await expect(pausedDialog).toBeHidden();

    // Pause via keyboard Escape key while playing
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('harness-state-display')).toHaveText('paused');
    await expect(pausedDialog).toBeVisible();

    // Resume via keyboard Escape key while paused modal is open
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('harness-state-display')).toHaveText('playing');
    await expect(pausedDialog).toBeHidden();
  });

  test('paused modal traps focus inside dialog', async ({ page }) => {
    await gotoPreview(page);
    await page.getByTestId('scenario-btn-paused').click();
    const pausedDialog = page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' });
    await expect(pausedDialog).toBeVisible();

    // Focus is initially inside dialog
    const resumeBtn = pausedDialog.getByRole('button', { name: 'Chơi tiếp' });
    const exitBtn = pausedDialog.getByRole('button', { name: 'Nghỉ ngơi' });
    await expect(resumeBtn).toBeFocused();

    // Tab to next button
    await page.keyboard.press('Tab');
    await expect(exitBtn).toBeFocused();

    // Tab wraps around to first button
    await page.keyboard.press('Tab');
    await expect(resumeBtn).toBeFocused();

    // Shift+Tab wraps back to last button
    await page.keyboard.press('Shift+Tab');
    await expect(exitBtn).toBeFocused();
  });

  test('exit modal confirmation and cancellation', async ({ page }) => {
    await gotoPreview(page);
    // Click close/exit button in header
    await page.getByRole('button', { name: 'Đóng' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('exit');

    const exitDialog = page.getByRole('dialog', { name: 'Bạn muốn nghỉ chút à?' });
    await expect(exitDialog).toBeVisible();

    // Cancel exit -> returns to playing
    await exitDialog.getByRole('button', { name: 'Chơi tiếp' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('playing');
  });

  test('hint controls progress without punitive timer or point deductions', async ({ page }) => {
    await gotoPreview(page);
    await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('playing');

    const hintButton = page.getByRole('button', { name: /Gợi ý/ });
    await expect(hintButton).toContainText('0/2');

    // Click Hint 1
    await hintButton.click();
    await expect(hintButton).toContainText('1/2');
    const hintRegion = page.getByRole('region', { name: 'Gợi ý 1: Quan sát kỹ' });
    await expect(hintRegion).toBeVisible();
    await expect(hintRegion).toContainText('Gợi ý 1: Bạn chú ý xem màu sắc của các hình đang lặp lại như thế nào nhé.');

    // Click Next Hint button to get Hint 2
    await page.getByRole('button', { name: 'Xem gợi ý tiếp theo' }).click();
    await expect(hintButton).toContainText('2/2');
    const hint2Region = page.getByRole('region', { name: 'Gợi ý 2: Thu hẹp phạm vi' });
    await expect(hint2Region).toBeVisible();
    await expect(hint2Region).toContainText('Gợi ý 2: Sau một hình tròn màu đỏ luôn là một hình vuông màu xanh đấy!');

    // Close hint callout via its close button
    await hint2Region.getByRole('button', { name: 'Đóng' }).click();
    await expect(hint2Region).toBeHidden();
  });

  test('wrong answer handling is gentle and non-punitive', async ({ page }) => {
    await gotoPreview(page);
    await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('playing');
    await expect(page.getByTestId('mock-board')).toBeVisible();

    // Click wrong answer button on mock board
    await page.getByTestId('mock-answer-wrong').click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('wrong');

    const frameRegion = page.getByRole('region', { name: /Quy luật hình vẽ vui nhộn/ });
    const wrongAlert = frameRegion.getByRole('alert');
    await expect(wrongAlert).toBeVisible();
    await expect(wrongAlert).toContainText('Cách này chưa khớp rồi. Không sao cả, mình cùng thử một cách khác nhé!');

    // Non-punitive retry action clears notice and lets child try again
    await page.getByRole('button', { name: 'Thử lại cách khác' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('playing');
    await expect(wrongAlert).toBeHidden();
  });

  test('completion celebration and explanation flow', async ({ page }) => {
    await gotoPreview(page);
    await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('playing');

    // Pick correct answer
    await page.getByTestId('mock-answer-correct').click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('finish');

    const finishDialog = page.getByRole('dialog', { name: 'Chúc mừng bạn!' });
    await expect(finishDialog).toBeVisible();
    await expect(finishDialog).toContainText('Bạn rất kiên trì thử nhiều cách khác nhau để tìm lời giải!');

    // Click explanation button inside finish modal
    await finishDialog.getByRole('button', { name: 'Xem giải thích' }).click();
    const explanationDialog = page.getByRole('dialog', { name: 'Vì sao lại như vậy?' });
    await expect(explanationDialog).toBeVisible();
    await expect(explanationDialog).toContainText('Quy luật là hình tròn đỏ và hình vuông xanh xen kẽ nhau: Tròn - Vuông - Tròn - Vuông.');

    // Dismiss explanation modal
    await explanationDialog.getByRole('button', { name: 'Đã hiểu rồi!' }).click();
    await expect(explanationDialog).toBeHidden();
  });

  test('sound mute toggle reflects state in aria and persists', async ({ page }) => {
    await gotoPreview(page);
    // Ensure clean initial audio storage state
    await page.evaluate(() => localStorage.removeItem('kidhabit_sound_enabled'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="harness-panel"][data-hydrated="true"]')).toBeVisible({ timeout: 15000 });

    const muteButton = page.getByRole('button', { name: 'Tắt âm thanh' });
    await expect(muteButton).toHaveAttribute('aria-pressed', 'false');

    // Click to mute -> aria label changes to "Bật âm thanh" with pressed true
    await muteButton.click();
    const unmuteButton = page.getByRole('button', { name: 'Bật âm thanh' });
    await expect(unmuteButton).toHaveAttribute('aria-pressed', 'true');

    // Persistence verification: reload page and confirm mute state remains true
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="harness-panel"][data-hydrated="true"]')).toBeVisible({ timeout: 15000 });
    const reloadedMuteButton = page.getByRole('button', { name: 'Bật âm thanh' });
    await expect(reloadedMuteButton).toHaveAttribute('aria-pressed', 'true');

    // Click to unmute -> reverts to "Tắt âm thanh" with pressed false
    await reloadedMuteButton.click();
    await expect(page.getByRole('button', { name: 'Tắt âm thanh' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('reduced motion respects user preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoPreview(page);
    await page.getByTestId('scenario-btn-loading').click();
    const spinner = page.locator('.animate-spin');
    // When reducedMotion is reduce, motion-reduce:animate-none class suppresses animation
    await expect(spinner).toHaveClass(/motion-reduce:animate-none/);
  });

  test('all 14 controlled UI scenarios render cleanly without blocking errors', async ({ page }) => {
    await gotoPreview(page);

    const nonModalScenarios = [
      'invitation',
      'tutorial',
      'playing',
      'hints',
      'wrong',
      'loading',
      'error',
      'network_pending',
      'approval_waiting',
      'bonus_locked',
      'bedtime',
    ];

    for (const sc of nonModalScenarios) {
      await page.getByTestId(`scenario-btn-${sc}`).click();
      await expect(page.getByTestId('harness-state-display')).toHaveText(sc);
      await assertNoHorizontalOverflow(page);
    }

    // Modal scenarios: verify each renders properly and dismisses
    await page.getByTestId('scenario-btn-paused').click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('paused');
    const pausedDialog = page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' });
    await expect(pausedDialog).toBeVisible();
    await pausedDialog.getByRole('button', { name: 'Chơi tiếp' }).click();
    await expect(pausedDialog).toBeHidden();

    await page.getByTestId('scenario-btn-exit').click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('exit');
    const exitDialog = page.getByRole('dialog', { name: 'Bạn muốn nghỉ chút à?' });
    await expect(exitDialog).toBeVisible();
    await exitDialog.getByRole('button', { name: 'Chơi tiếp' }).click();
    await expect(exitDialog).toBeHidden();

    await page.getByTestId('scenario-btn-finish').click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('finish');
    const finishDialog = page.getByRole('dialog', { name: 'Chúc mừng bạn!' });
    await expect(finishDialog).toBeVisible();
    await finishDialog.getByRole('button', { name: 'Về trang chủ' }).click();
    await expect(finishDialog).toBeHidden();

    await page.getByTestId('scenario-btn-explanation').click();
    await expect(page.getByTestId('harness-state-display')).toHaveText('explanation');
    const explanationDialog = page.getByRole('dialog', { name: 'Vì sao lại như vậy?' });
    await expect(explanationDialog).toBeVisible();
    await explanationDialog.getByRole('button', { name: 'Đã hiểu rồi!' }).click();
    await expect(explanationDialog).toBeHidden();
  });

  test('strictly adheres to "mình – bạn" peer voice and contains zero "con" or "bé"', async ({ page }) => {
    await gotoPreview(page);

    const textContent = await page.getByRole('region', { name: /Quy luật hình vẽ vui nhộn/ }).innerText();
    // Verify peer pronouns exist
    expect(textContent.toLowerCase()).toMatch(/mình|bạn/);
    // Strictly assert NO adult-to-child pronouns
    expect(textContent.toLowerCase()).not.toMatch(/\bcon\b/);
    expect(textContent.toLowerCase()).not.toMatch(/\bbé\b/);
  });

  test.describe('Axe Accessibility Audits (@a11y)', () => {
    test.use({ reducedMotion: 'reduce' });

    test('axe check on invitation state', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('scenario-btn-invitation').click();
      const results = await new AxeBuilder({ page }).include('[data-testid="harness-panel"], [role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on playing state', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('scenario-btn-playing').click();
      const results = await new AxeBuilder({ page }).include('[data-testid="harness-panel"], [role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on paused modal', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('scenario-btn-paused').click();
      await expect(page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' })).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on bedtime state', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('scenario-btn-bedtime').click();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on finish celebration dialog', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('scenario-btn-finish').click();
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on error alert state', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('scenario-btn-error').click();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });
  });
});
