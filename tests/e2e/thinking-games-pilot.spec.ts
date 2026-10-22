import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

function seriousOrCritical(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious'
  );
}

async function assertNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return doc.scrollWidth > doc.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1;
  });
  expect(hasOverflow).toBe(false);
}

async function gotoPilotPreview(page: Page) {
  await page.goto('/thinking-games-preview', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-testid="harness-panel"][data-hydrated="true"]')).toBeVisible({
    timeout: 30_000,
  });
  // Switch to Pilot Playable Game tab
  await page.getByTestId('tab-playable-pilot').click();
  await expect(page.getByTestId('pilot-fixture-banner')).toBeVisible({ timeout: 15_000 });
}

test.describe('Thinking Games Pilot Renderers (Playable P05 Formats)', () => {
  test.setTimeout(60_000);
  test('preview mounts pilot fixture and displays metadata correctly', async ({ page }) => {
    await gotoPilotPreview(page);
    await expect(page.getByTestId('pilot-fixture-banner')).toContainText('D001-main-68');
    await expect(page.getByTestId('pilot-fixture-banner')).toContainText('g01-t1');
    await expect(page.getByTestId('pilot-fixture-banner')).toContainText('Pilot Fixture (Pending Human Approval)');
    await expect(page.getByRole('button', { name: 'Cùng thử nhé' })).toBeVisible();
  });

  // ==========================================
  // FORMAT 1: Rule Sequence (g01-t1)
  // ==========================================
  test.describe('Format 1: Rule Sequence (g01-t1)', () => {
    test('age 6-8: correct answer selection, celebration dialog and explanation', async ({ page }) => {
      await gotoPilotPreview(page);
      // Start Day 1 Main (Rule sequence: lá, mây, lá, mây -> lá)
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      await expect(page.getByTestId('rule-sequence-game')).toBeVisible();
      await expect(page.getByRole('region', { name: 'Chuỗi hình mẫu' })).toBeVisible();
      await expect(page.getByTestId('target-slot')).toContainText('?');

      // Check that options do NOT leak "(Đúng)" or answer in aria-label
      const optionButtons = page.locator('[data-testid^="option-button-"]');
      const count = await optionButtons.count();
      expect(count).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < count; i += 1) {
        const text = await optionButtons.nth(i).innerText();
        expect(text.toLowerCase()).not.toContain('đúng');
        expect(text.toLowerCase()).not.toContain('sai');
      }

      // Pick correct answer 'lá'
      const correctBtn = page.getByTestId('option-button-lá');
      await expect(correctBtn).toBeVisible();
      await correctBtn.click();
      await expect(correctBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('target-slot')).toContainText('lá');

      // Submit
      const submitBtn = page.getByTestId('submit-answer-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      // Finish celebration dialog
      const finishDialog = page.getByRole('dialog', { name: 'Chúc mừng bạn!' });
      await expect(finishDialog).toBeVisible();

      // Explanation view
      await finishDialog.getByRole('button', { name: 'Xem giải thích' }).click();
      const explanationDialog = page.getByRole('dialog', { name: 'Vì sao lại như vậy?' });
      await expect(explanationDialog).toBeVisible();
      await expect(explanationDialog).toContainText('Phần tiếp theo hợp với nhịp của chuỗi là lá');
      await explanationDialog.getByRole('button', { name: 'Đã hiểu rồi!' }).click();
      await expect(explanationDialog).toBeHidden();
    });

    test('wrong answer gives calm feedback and allows retry on same slot', async ({ page }) => {
      await gotoPilotPreview(page);
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      // Pick wrong answer 'hoa'
      const wrongBtn = page.getByTestId('option-button-hoa');
      await wrongBtn.click();
      await page.getByTestId('submit-answer-btn').click();

      // Gentle wrong feedback alert inside child container (avoid Next route announcer alert)
      const wrongAlert = page.locator('.mx-auto.max-w-lg').getByRole('alert');
      await expect(wrongAlert).toBeVisible();
      await expect(wrongAlert).toContainText('Cách này chưa khớp rồi. Không sao cả, mình cùng thử một cách khác nhé!');

      // Calm retry on same slot
      const retryBtn = wrongAlert.getByRole('button', { name: 'Thử lại cách khác' });
      await retryBtn.click();
      await expect(wrongAlert).toBeHidden();

      // Board is ready again for child to pick another option
      await expect(page.getByTestId('rule-sequence-game')).toBeVisible();
      await page.getByTestId('option-button-lá').click();
      await page.getByTestId('submit-answer-btn').click();
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });

    test('hints progression 0/2 -> 1/2 -> 2/2 without answer leak', async ({ page }) => {
      await gotoPilotPreview(page);
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      const hintButton = page.getByRole('button', { name: /Gợi ý/ });
      await expect(hintButton).toContainText('0/2');

      // Request hint 1
      await hintButton.click();
      await expect(hintButton).toContainText('1/2');
      const hint1 = page.getByRole('region', { name: /Gợi ý 1/ });
      await expect(hint1).toBeVisible();
      await expect(hint1).toContainText('lặp lại theo nhịp nào');

      // Request hint 2
      await page.getByRole('button', { name: 'Xem gợi ý tiếp theo' }).click();
      await expect(hintButton).toContainText('2/2');
      const hint2 = page.getByRole('region', { name: /Gợi ý 2/ });
      await expect(hint2).toBeVisible();
      await expect(hint2).toContainText('Thử đọc to chuỗi theo từng cặp');

      // Verify no leaked answer in hint
      const hint2Text = await hint2.innerText();
      expect(hint2Text).not.toContain('Đáp án là');
    });
  });

  // ==========================================
  // FORMAT 2: Path Planning (g06-t1)
  // ==========================================
  test.describe('Format 2: Path Planning (g06-t1)', () => {
    test.beforeEach(async ({ page }) => {
      await gotoPilotPreview(page);
      // Select Bonus slot for Day 1 (g06-t1: 5x5 grid)
      await page.getByTestId('slot-select').selectOption('bonus');
      await expect(page.getByTestId('pilot-fixture-banner')).toContainText('D001-bonus-68');
      await expect(page.getByTestId('pilot-fixture-banner')).toContainText('g06-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('path-planning-game')).toBeVisible();
    });

    test('route 1: accepts valid down-then-right path via cell clicks', async ({ page }) => {
      // 5x5 board: start at (0,0), wall at (1,1), goal at (4,4)
      // Route 1: (0,0) -> (0,1) -> (0,2) -> (0,3) -> (0,4) -> (1,4) -> (2,4) -> (3,4) -> (4,4)
      await page.getByTestId('path-cell-0-1').click();
      await page.getByTestId('path-cell-0-2').click();
      await page.getByTestId('path-cell-0-3').click();
      await page.getByTestId('path-cell-0-4').click();
      await page.getByTestId('path-cell-1-4').click();
      await page.getByTestId('path-cell-2-4').click();
      await page.getByTestId('path-cell-3-4').click();
      await page.getByTestId('path-cell-4-4').click();

      // Submit valid path
      const submitBtn = page.getByTestId('submit-path-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      // Celebrates completion
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });

    test('route 2: accepts alternative valid right-then-down path via directional buttons', async ({ page }) => {
      // Route 2: (0,0) -> (1,0) -> (2,0) -> (3,0) -> (4,0) -> (4,1) -> (4,2) -> (4,3) -> (4,4)
      const rightBtn = page.getByTestId('dir-right');
      const downBtn = page.getByTestId('dir-down');

      // 4 steps right
      await rightBtn.click();
      await rightBtn.click();
      await rightBtn.click();
      await rightBtn.click();

      // 4 steps down
      await downBtn.click();
      await downBtn.click();
      await downBtn.click();
      await downBtn.click();

      const submitBtn = page.getByTestId('submit-path-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });

    test('undo step and reset path controls work non-punitively', async ({ page }) => {
      // Move 2 steps right
      await page.getByTestId('dir-right').click();
      await page.getByTestId('dir-right').click();
      await expect(page.getByTestId('path-cell-2-0')).toHaveAttribute('aria-label', /Bước 3/);

      // Undo 1 step
      await page.getByTestId('undo-path-btn').click();
      await expect(page.getByTestId('path-cell-2-0')).not.toHaveAttribute('aria-label', /Bước 3/);

      // Reset path back to start
      await page.getByTestId('reset-path-btn').click();
      await expect(page.getByTestId('path-cell-1-0')).not.toHaveAttribute('aria-label', /Bước 2/);
      await expect(page.getByTestId('path-cell-0-0')).toHaveAttribute('aria-label', /Bước 1/);
    });

    test('age 9-12 planning puzzle includes waypoint requirement', async ({ page }) => {
      // Switch age to 9-12
      await page.getByTestId('age-select').selectOption('age_9_12');
      await expect(page.getByTestId('pilot-fixture-banner')).toContainText('D001-bonus-912');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      // 7x7 grid with waypoint
      await expect(page.getByTestId('path-planning-game')).toContainText('Điểm cần thu thập');
      await expect(page.getByTestId('path-cell-3-3')).toHaveAttribute('aria-label', /Điểm cần qua/);
    });
  });

  // ==========================================
  // FORMAT 3: Memory Sequence (g03-t1)
  // ==========================================
  test.describe('Format 3: Memory Sequence (g03-t1)', () => {
    test.beforeEach(async ({ page }) => {
      await gotoPilotPreview(page);
      // Select Day 2 Main (g03-t1: memory sequence ['thuyền', 'cá', 'mưa'])
      await page.getByTestId('day-input').fill('2');
      await expect(page.getByTestId('pilot-fixture-banner')).toContainText('D002-main-68');
      await expect(page.getByTestId('pilot-fixture-banner')).toContainText('g03-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    });

    test('child-controlled view phase with proceed button and no forced timer', async ({ page }) => {
      await expect(page.getByTestId('memory-view-phase')).toBeVisible();
      await expect(page.getByText('Bạn có thể nhìn kỹ bao lâu tùy thích')).toBeVisible();

      // Click to start recall
      const proceedBtn = page.getByTestId('start-recall-btn');
      await expect(proceedBtn).toBeVisible();
      await proceedBtn.click();

      // Transitions to recall phase
      await expect(page.getByTestId('memory-recall-phase')).toBeVisible();
      await expect(page.getByRole('region', { name: 'Các ô thứ tự đã chọn' })).toBeVisible();
    });

    test('correct sequence recall leads to celebration', async ({ page }) => {
      // Day 2 Main sequence: ['thuyền', 'cá', 'mưa']
      await page.getByTestId('start-recall-btn').click();
      await expect(page.getByTestId('memory-recall-phase')).toBeVisible();

      // Click options in correct order
      await page.getByTestId('memory-option-thuyền').click();
      await page.getByTestId('memory-option-cá').click();
      await page.getByTestId('memory-option-mưa').click();

      // Submit
      const submitBtn = page.getByTestId('submit-memory-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      // Celebration
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });

    test('wrong sequence order gives calm feedback and allows retry on same slot', async ({ page }) => {
      await page.getByTestId('start-recall-btn').click();
      await expect(page.getByTestId('memory-recall-phase')).toBeVisible();

      // Click options in reverse / wrong order: mưa, cá, thuyền
      await page.getByTestId('memory-option-mưa').click();
      await page.getByTestId('memory-option-cá').click();
      await page.getByTestId('memory-option-thuyền').click();

      await page.getByTestId('submit-memory-btn').click();

      // Gentle wrong notice inside child container
      const wrongAlert = page.locator('.mx-auto.max-w-lg').getByRole('alert');
      await expect(wrongAlert).toBeVisible();
      await expect(wrongAlert).toContainText('Cách này chưa khớp rồi');

      // Retry on same slot
      await wrongAlert.getByRole('button', { name: 'Thử lại cách khác' }).click();
      await expect(wrongAlert).toBeHidden();

      // Child can peek at sequence again freely!
      await page.getByTestId('peek-memory-btn').click();
      await expect(page.getByTestId('memory-view-phase')).toBeVisible();
    });

    test('undo and slot click removes token', async ({ page }) => {
      await page.getByTestId('start-recall-btn').click();
      await page.getByTestId('memory-option-thuyền').click();
      await page.getByTestId('memory-option-cá').click();

      // Undo last token
      await page.getByTestId('undo-memory-btn').click();
      await expect(page.getByTestId('recall-slot-1')).toHaveAttribute('aria-label', /chưa chọn/);

      // Reset
      await page.getByTestId('reset-memory-btn').click();
      await expect(page.getByTestId('recall-slot-0')).toHaveAttribute('aria-label', /chưa chọn/);
    });
  });

  // ==========================================
  // GENERAL LIFECYCLE & INPUT RESETS
  // ==========================================
  test('switching day, slot, or age track resets player inputs', async ({ page }) => {
    await gotoPilotPreview(page);
    await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    await page.getByTestId('option-button-lá').click();
    await expect(page.getByTestId('target-slot')).toContainText('lá');

    // Switch to slot 'bonus'
    await page.getByTestId('slot-select').selectOption('bonus');
    // Frame returns to invitation of new game
    await expect(page.getByRole('button', { name: 'Cùng thử nhé' })).toBeVisible();
    await expect(page.getByTestId('pilot-fixture-banner')).toContainText('D001-bonus-68');
  });

  test('pause and resume retains game state', async ({ page }) => {
    await gotoPilotPreview(page);
    await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    await page.getByTestId('option-button-lá').click();

    // Pause via header button
    await page.getByRole('button', { name: 'Tạm dừng' }).click();
    const pausedDialog = page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' });
    await expect(pausedDialog).toBeVisible();

    // Resume
    await pausedDialog.getByRole('button', { name: 'Chơi tiếp' }).click();
    await expect(pausedDialog).toBeHidden();
    // Selection is preserved!
    await expect(page.getByTestId('target-slot')).toContainText('lá');
  });

  // ==========================================
  // RESPONSIVENESS & ACCESSIBILITY AUDIT
  // ==========================================
  test('mobile 375px layout has zero horizontal scroll and meets touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoPilotPreview(page);
    await assertNoHorizontalOverflow(page);

    // Invitation start button meets 56px touch target for age 6-8
    const startButton = page.getByRole('button', { name: 'Cùng thử nhé' });
    const box = await startButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.width).toBeGreaterThanOrEqual(48);
    }
  });

  test.describe('Axe Accessibility Audits (@a11y) on Playable Formats', () => {
    test.use({ reducedMotion: 'reduce' });

    test('axe check on Rule Sequence game', async ({ page }) => {
      await gotoPilotPreview(page);
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('rule-sequence-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on Path Planning game', async ({ page }) => {
      await gotoPilotPreview(page);
      await page.getByTestId('slot-select').selectOption('bonus');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('path-planning-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on Memory Sequence game (recall phase)', async ({ page }) => {
      await gotoPilotPreview(page);
      await page.getByTestId('day-input').fill('2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await page.getByTestId('start-recall-btn').click();
      await expect(page.getByTestId('memory-recall-phase')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });
  });
});
