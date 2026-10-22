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

async function gotoP06Preview(page: Page, gameTypeId: string) {
  await page.goto('/thinking-games-preview', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-testid="harness-panel"][data-hydrated="true"]')).toBeVisible({
    timeout: 30_000,
  });
  // Switch to P06 Formats tab
  await page.getByTestId('tab-playable-p06').click();
  await expect(page.getByTestId('p06-fixture-banner')).toBeVisible({ timeout: 15_000 });

  // Select game type
  await page.getByTestId('game-type-select').selectOption(gameTypeId);
  await expect(page.getByTestId('p06-fixture-banner')).toContainText(gameTypeId);
}

test.describe('Thinking Games Remaining 21 Renderers (Batch 1: Formats 1–7)', () => {
  test.setTimeout(60_000);

  // ==========================================
  // FORMAT 1: Rule Error (g01-t2)
  // ==========================================
  test.describe('Format g01-t2: Rule Error', () => {
    test('correct answer, calm wrong retry, hint and finish lifecycle', async ({ page }) => {
      await gotoP06Preview(page, 'g01-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      await expect(page.getByTestId('rule-error-game')).toBeVisible();

      // Wrong answer first (index 0)
      await page.getByTestId('sequence-index-0').click();
      await page.getByTestId('submit-answer-btn').click();

      // Calm wrong feedback
      const wrongAlert = page.locator('.mx-auto.max-w-lg').getByRole('alert');
      await expect(wrongAlert).toBeVisible();
      await expect(wrongAlert).toContainText('Cách này chưa khớp rồi');

      // Retry on same slot
      await wrongAlert.getByRole('button', { name: 'Thử lại cách khác' }).click();
      await expect(wrongAlert).toBeHidden();

      // Hint flow
      const hintButton = page.getByRole('button', { name: /Gợi ý/ });
      await hintButton.click();
      await expect(page.getByRole('region', { name: /Gợi ý 1/ })).toBeVisible();

      // Close hint and pick correct answer (index 2: "lá")
      await page.getByRole('region', { name: /Gợi ý/ }).getByRole('button', { name: 'Đóng' }).click();
      await page.getByTestId('sequence-index-2').click();
      await page.getByTestId('submit-answer-btn').click();

      // Celebration dialog
      const finishDialog = page.getByRole('dialog', { name: 'Chúc mừng bạn!' });
      await expect(finishDialog).toBeVisible();
      await finishDialog.getByRole('button', { name: 'Xem giải thích' }).click();
      const explanationDialog = page.getByRole('dialog', { name: 'Vì sao lại như vậy?' });
      await expect(explanationDialog).toBeVisible();
      await explanationDialog.getByRole('button', { name: 'Đã hiểu rồi!' }).click();
      await expect(explanationDialog).toBeHidden();
    });

    test('pause & resume preserves selected tile', async ({ page }) => {
      await gotoP06Preview(page, 'g01-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await page.getByTestId('sequence-index-1').click();

      await page.getByRole('button', { name: 'Tạm dừng' }).click();
      const pausedDialog = page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' });
      await expect(pausedDialog).toBeVisible();
      await pausedDialog.getByRole('button', { name: 'Chơi tiếp' }).click();
      await expect(pausedDialog).toBeHidden();

      await expect(page.getByTestId('sequence-index-1')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // ==========================================
  // FORMAT 2: Rule Transform (g01-t3)
  // ==========================================
  test.describe('Format g01-t3: Rule Transform', () => {
    test('worked examples shown, selects transformed value', async ({ page }) => {
      await gotoP06Preview(page, 'g01-t3');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      await expect(page.getByTestId('rule-transform-game')).toBeVisible();
      await expect(page.getByRole('region', { name: 'Máy biến đổi và các ví dụ' })).toBeVisible();

      // Correct answer is "264"
      const correctBtn = page.getByTestId('option-button-264');
      await expect(correctBtn).toBeVisible();
      await correctBtn.click();
      await expect(page.getByTestId('target-slot')).toContainText('264');

      await page.getByTestId('submit-answer-btn').click();
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });
  });

  // ==========================================
  // FORMAT 3: Spatial Silhouette (g02-t1)
  // ==========================================
  test.describe('Format g02-t1: Spatial Silhouette', () => {
    test('matches silhouette from candidate grids', async ({ page }) => {
      await gotoP06Preview(page, 'g02-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      await expect(page.getByTestId('spatial-silhouette-game')).toBeVisible();
      await expect(page.getByRole('region', { name: 'Hình bóng mẫu cần ghép' })).toBeVisible();

      // Correct answer is "shape-a"
      const correctBtn = page.getByTestId('option-button-shape-a');
      await correctBtn.click();
      await expect(correctBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });
  });

  // ==========================================
  // FORMAT 4: Spatial Rotation (g02-t2)
  // ==========================================
  test.describe('Format g02-t2: Spatial Rotation', () => {
    test('identifies rotated copy from options', async ({ page }) => {
      await gotoP06Preview(page, 'g02-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      await expect(page.getByTestId('spatial-rotation-game')).toBeVisible();
      await expect(page.getByRole('region', { name: 'Hình gốc và thao tác xoay' })).toBeVisible();

      // Correct answer is "turn-a"
      const correctBtn = page.getByTestId('option-button-turn-a');
      await correctBtn.click();
      await expect(correctBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });
  });

  // ==========================================
  // FORMAT 5: Spatial Symmetry (g02-t3)
  // ==========================================
  test.describe('Format g02-t3: Spatial Symmetry', () => {
    test('selects missing symmetry point on grid with mirror axis', async ({ page }) => {
      await gotoP06Preview(page, 'g02-t3');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      await expect(page.getByTestId('spatial-symmetry-game')).toBeVisible();
      await expect(page.getByRole('region', { name: 'Lưới hình đối xứng' })).toBeVisible();

      // Correct answer is (0, 2)
      const targetCell = page.getByTestId('symmetry-cell-0-2');
      await targetCell.click();

      await page.getByTestId('submit-answer-btn').click();
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });
  });

  // ==========================================
  // FORMAT 6: Memory Position (g03-t2)
  // ==========================================
  test.describe('Format g03-t2: Memory Position', () => {
    test('view phase, start recall, peek pattern and submit target cells', async ({ page }) => {
      await gotoP06Preview(page, 'g03-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      // View phase
      await expect(page.getByTestId('memory-view-phase')).toBeVisible();
      await expect(page.getByTestId('view-cell-0-0')).toBeVisible();

      // Transition to recall phase
      await page.getByTestId('start-recall-btn').click();
      await expect(page.getByTestId('memory-recall-phase')).toBeVisible();

      // Peek pattern
      await page.getByTestId('peek-memory-btn').click();
      await expect(page.getByTestId('memory-view-phase')).toBeVisible();
      await page.getByTestId('start-recall-btn').click();
      await expect(page.getByTestId('memory-recall-phase')).toBeVisible();

      // Select targets: (0,0), (0,1), (1,3)
      await page.getByTestId('recall-cell-0-0').click();
      await page.getByTestId('recall-cell-0-1').click();
      await page.getByTestId('recall-cell-1-3').click();

      await page.getByTestId('submit-answer-btn').click();
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });
  });

  // ==========================================
  // FORMAT 7: Memory Change (g03-t3)
  // ==========================================
  test.describe('Format g03-t3: Memory Change', () => {
    test('compares before and after scenes and identifies changed item', async ({ page }) => {
      await gotoP06Preview(page, 'g03-t3');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      await expect(page.getByTestId('memory-change-game')).toBeVisible();
      await expect(page.getByRole('region', { name: 'So sánh cảnh ban đầu và cảnh sau đó' })).toBeVisible();

      // Correct answer is "sao"
      const correctBtn = page.getByTestId('option-button-sao');
      await correctBtn.click();
      await expect(correctBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
      await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
    });
  });

  // ==========================================
  // RESPONSIVENESS & ACCESSIBILITY AUDIT
  // ==========================================
  test('mobile 375px responsive layout and touch targets for Batch 1', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoP06Preview(page, 'g01-t2');
    await assertNoHorizontalOverflow(page);
  });

  test.describe('Axe Accessibility Audits (@a11y) on Batch 1 Formats', () => {
    test.use({ reducedMotion: 'reduce' });

    test('axe check on Rule Error game', async ({ page }) => {
      await gotoP06Preview(page, 'g01-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('rule-error-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on Spatial Silhouette game', async ({ page }) => {
      await gotoP06Preview(page, 'g02-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('spatial-silhouette-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on Memory Position recall phase', async ({ page }) => {
      await gotoP06Preview(page, 'g03-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await page.getByTestId('start-recall-btn').click();
      await expect(page.getByTestId('memory-recall-phase')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });
  });

  // ==========================================
  // BATCH 2: FORMATS 8–14
  // ==========================================
  test.describe('Format g04-t1: Reasoning Elimination', () => {
    test('renders detective clues, eliminates suspect, selects candidate and submits', async ({ page }) => {
      await gotoP06Preview(page, 'g04-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('reasoning-elimination-game')).toBeVisible();

      // Check clues region is present
      await expect(page.getByLabel('Các manh mối điều tra')).toBeVisible();

      // Candidate 1 selection
      const cand1Btn = page.getByTestId('option-button-candidate-1');
      await expect(cand1Btn).toBeVisible();
      await cand1Btn.click();
      await expect(cand1Btn).toHaveAttribute('aria-pressed', 'true');

      // Clear selection button resets selection
      await page.getByTestId('clear-selection-btn').click();
      await expect(cand1Btn).toHaveAttribute('aria-pressed', 'false');

      // Re-select and submit
      await cand1Btn.click();
      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g04-t2: Reasoning If-Then', () => {
    test('displays facts and rules, selects deduction conclusion and submits', async ({ page }) => {
      await gotoP06Preview(page, 'g04-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('reasoning-if-then-game')).toBeVisible();

      await expect(page.getByLabel('Các dữ kiện và luật nếu thì')).toBeVisible();

      // Click first option button
      const optionBtn = page.locator('[data-testid^="option-button-"]').first();
      await expect(optionBtn).toBeVisible();
      await optionBtn.click();
      await expect(optionBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g04-t3: Reasoning Missing Info', () => {
    test('shows scenario and question, selects necessary missing clue', async ({ page }) => {
      await gotoP06Preview(page, 'g04-t3');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('reasoning-missing-info-game')).toBeVisible();

      const optionBtn = page.locator('[data-testid^="option-button-"]').first();
      await expect(optionBtn).toBeVisible();
      await optionBtn.click();
      await expect(optionBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g05-t1: Quantity Balance', () => {
    test('renders pan balance with unknown weight slot and selects balance number', async ({ page }) => {
      await gotoP06Preview(page, 'g05-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('quantity-balance-game')).toBeVisible();

      // Ensure balance pans exist
      await expect(page.getByText('Đĩa Cân Trái')).toBeVisible();
      await expect(page.getByText('Đĩa Cân Phải')).toBeVisible();

      const optionBtn = page.locator('[data-testid^="option-button-"]').first();
      await expect(optionBtn).toBeVisible();
      await optionBtn.click();
      await expect(optionBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g05-t2: Quantity Grouping', () => {
    test('displays baskets with items and selects grouping quotient', async ({ page }) => {
      await gotoP06Preview(page, 'g05-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('quantity-grouping-game')).toBeVisible();

      const optionBtn = page.locator('[data-testid^="option-button-"]').first();
      await expect(optionBtn).toBeVisible();
      await optionBtn.click();
      await expect(optionBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g05-t3: Quantity Target', () => {
    test('tracks running sum counter as items are toggled and submits target combination', async ({ page }) => {
      await gotoP06Preview(page, 'g05-t3');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('quantity-target-game')).toBeVisible();

      const sumDisplay = page.getByTestId('current-sum-display');
      await expect(sumDisplay).toBeVisible();

      // Toggle item
      const firstItem = page.locator('[data-testid^="option-button-"]').first();
      await firstItem.click();
      await expect(firstItem).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g06-t2: Planning Command Order', () => {
    test('assembles step order from command tray and submits sequence', async ({ page }) => {
      await gotoP06Preview(page, 'g06-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('planning-command-order-game')).toBeVisible();

      // Add all commands from tray
      const trayButtons = page.locator('[data-testid^="command-tray-btn-"]');
      const count = await trayButtons.count();
      for (let i = 0; i < count; i++) {
        await page.locator('[data-testid^="command-tray-btn-"]').first().click();
      }

      // Submit sequence
      const submitBtn = page.getByTestId('submit-answer-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();
    });
  });

  test('mobile 375px responsive layout for Batch 2 formats', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoP06Preview(page, 'g04-t1');
    await assertNoHorizontalOverflow(page);
    await gotoP06Preview(page, 'g05-t1');
    await assertNoHorizontalOverflow(page);
    await gotoP06Preview(page, 'g06-t2');
    await assertNoHorizontalOverflow(page);
  });

  test.describe('Axe Accessibility Audits (@a11y) on Batch 2 Formats', () => {
    test.use({ reducedMotion: 'reduce' });

    test('axe check on Reasoning Elimination game', async ({ page }) => {
      await gotoP06Preview(page, 'g04-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('reasoning-elimination-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on Quantity Balance scale', async ({ page }) => {
      await gotoP06Preview(page, 'g05-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('quantity-balance-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on Planning Command Order game', async ({ page }) => {
      await gotoP06Preview(page, 'g06-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('planning-command-order-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });
  });

  // ==========================================
  // BATCH 3: FORMATS 15–21
  // ==========================================
  test.describe('Format g06-t3: Planning Fix Step', () => {
    test('displays robot maze and commands, selects fix option and submits', async ({ page }) => {
      await gotoP06Preview(page, 'g06-t3');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('planning-fix-step-game')).toBeVisible();

      // Check maze grid and commands are rendered
      await expect(page.getByText('Bản đồ di chuyển')).toBeVisible();
      await expect(page.getByText('Các lệnh hiện tại')).toBeVisible();

      // Click first fix option
      const fixBtn = page.locator('[data-testid^="option-button-"]').first();
      await expect(fixBtn).toBeVisible();
      await fixBtn.click();
      await expect(fixBtn).toHaveAttribute('aria-pressed', 'true');

      // Submit
      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g07-t1: Flexibility Classify', () => {
    test('displays new classification rule, toggles candidates and submits selection', async ({ page }) => {
      await gotoP06Preview(page, 'g07-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('flexibility-classify-game')).toBeVisible();

      await expect(page.getByText('Quy tắc phân loại mới')).toBeVisible();

      const firstItem = page.locator('[data-testid^="option-button-"]').first();
      await expect(firstItem).toBeVisible();
      await firstItem.click();
      await expect(firstItem).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('clear-selection-btn').click();
      await expect(firstItem).toHaveAttribute('aria-pressed', 'false');

      await firstItem.click();
      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g07-t2: Flexibility Perspective', () => {
    test('renders viewer avatar facing direction, selects viewpoint direction and submits', async ({ page }) => {
      await gotoP06Preview(page, 'g07-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('flexibility-perspective-game')).toBeVisible();

      const optionBtn = page.locator('[data-testid^="option-button-"]').first();
      await expect(optionBtn).toBeVisible();
      await optionBtn.click();
      await expect(optionBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g07-t3: Flexibility Alternative', () => {
    test('shows known path and applies valid alternative route to goal', async ({ page }) => {
      await gotoP06Preview(page, 'g07-t3');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('flexibility-alternative-game')).toBeVisible();

      // Click preset alternative route
      const presetBtn = page.getByTestId('preset-path-btn-0');
      await expect(presetBtn).toBeVisible();
      await presetBtn.click();

      // Submit route
      const submitBtn = page.getByTestId('submit-answer-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();
    });
  });

  test.describe('Format g08-t1: Observation Difference', () => {
    test('renders dual picture grids, toggles differences and submits', async ({ page }) => {
      await gotoP06Preview(page, 'g08-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('observation-difference-game')).toBeVisible();

      await expect(page.getByText('Hình A (Gốc)')).toBeVisible();
      await expect(page.getByText('Hình B (Chạm ô khác biệt)')).toBeVisible();

      // Select first cell on right grid
      const cellBtn = page.locator('[data-testid^="diff-cell-"]').first();
      await expect(cellBtn).toBeVisible();
      await cellBtn.click();
      await expect(cellBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g08-t2: Observation Two Traits', () => {
    test('shows dual criteria rule and filters items meeting both traits', async ({ page }) => {
      await gotoP06Preview(page, 'g08-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('observation-two-traits-game')).toBeVisible();

      await expect(page.getByText('Tìm mọi hình thỏa mãn CẢ HAI đặc điểm')).toBeVisible();

      const itemBtn = page.locator('[data-testid^="option-button-"]').first();
      await expect(itemBtn).toBeVisible();
      await itemBtn.click();
      await expect(itemBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test.describe('Format g08-t3: Observation Implausible', () => {
    test('displays scene scenarios and selects rule anomaly element', async ({ page }) => {
      await gotoP06Preview(page, 'g08-t3');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('observation-implausible-game')).toBeVisible();

      await expect(page.getByText('Tìm điểm vô lý / chi tiết sai quy tắc')).toBeVisible();

      const sceneBtn = page.locator('[data-testid^="option-button-"]').first();
      await expect(sceneBtn).toBeVisible();
      await sceneBtn.click();
      await expect(sceneBtn).toHaveAttribute('aria-pressed', 'true');

      await page.getByTestId('submit-answer-btn').click();
    });
  });

  test('mobile 375px responsive layout for Batch 3 formats', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoP06Preview(page, 'g06-t3');
    await assertNoHorizontalOverflow(page);
    await gotoP06Preview(page, 'g07-t2');
    await assertNoHorizontalOverflow(page);
    await gotoP06Preview(page, 'g08-t1');
    await assertNoHorizontalOverflow(page);
  });

  test.describe('Axe Accessibility Audits (@a11y) on Batch 3 Formats', () => {
    test.use({ reducedMotion: 'reduce' });

    test('axe check on Planning Fix Step game', async ({ page }) => {
      await gotoP06Preview(page, 'g06-t3');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('planning-fix-step-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on Flexibility Perspective game', async ({ page }) => {
      await gotoP06Preview(page, 'g07-t2');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('flexibility-perspective-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('axe check on Observation Difference game', async ({ page }) => {
      await gotoP06Preview(page, 'g08-t1');
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('observation-difference-game')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('[role="region"]').analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });
  });
});
