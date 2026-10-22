import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

function seriousOrCritical(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious'
  );
}

/** Current local date in the test family's timezone (Asia/Ho_Chi_Minh). */
function getTestFamilyLocalDay(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function assertNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return doc.scrollWidth > doc.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1;
  });
  expect(hasOverflow).toBe(false);
}

const CHILD_ALPHA_68 = 'cccccccc-0000-4000-8000-00000000000a';
const CHILD_ALPHA_912 = 'cccccccc-0000-4000-8000-00000000000c';
const CHILD_BETA = 'cccccccc-0000-4000-8000-00000000000b';

async function resetChildState(page: Page, childId: string, nextDayIndex = 1) {
  await page.request.post('/thinking-games-api-preview/evidence', {
    data: { resetChildId: childId, nextDayIndex },
  });
}

async function gotoPreview(page: Page) {
  await page.goto('/thinking-games-api-preview', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-testid="control-panel"][data-hydrated="true"]')).toBeVisible({
    timeout: 30_000,
  });
}

async function dismissFinishDialog(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Chúc mừng bạn!' });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole('button', { name: 'Về trang chủ' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('Real Fullstack Integration: Browser UI -> Next APIs -> Supabase SDK -> PostgREST -> PostgreSQL 18.4', () => {
  // This suite drives a real Supabase/GoTrue/PostgREST stack, which CI does not provision. Local full-stack runs are
  // unaffected; a CI job that does provide the stack can opt in with PLAYWRIGHT_REAL_STACK=1.
  test.skip(
    Boolean(process.env.CI) && process.env.PLAYWRIGHT_REAL_STACK !== '1',
    'Requires the local Supabase/GoTrue/PostgREST stack, which CI does not provision.'
  );
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    // Ensure clean state for child test profiles
    await resetChildState(page, CHILD_ALPHA_68, 1);
    await resetChildState(page, CHILD_ALPHA_912, 1);
  });

  // =========================================================================
  // SUITE 1: Harness Mount, Responsiveness & Accessibility
  // =========================================================================
  test.describe('Harness Mount & Accessibility', () => {
    test('desktop 1280px mounts cleanly with zero critical/serious a11y violations', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoPreview(page);
      await assertNoHorizontalOverflow(page);

      const results = await new AxeBuilder({ page })
        .include('[data-testid="control-panel"]')
        .include('[data-testid="evidence-panel"]')
        .analyze();
      expect(seriousOrCritical(results.violations)).toEqual([]);
    });

    test('mobile 375px renders control panel with compliant touch targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await gotoPreview(page);
      await assertNoHorizontalOverflow(page);

      const startBtn = page.getByTestId('btn-start-game');
      await expect(startBtn).toBeVisible();
      const box = await startBtn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    });
  });

  // =========================================================================
  // SUITE 2: Security Boundaries, Token Revocation & Payload Redaction
  // =========================================================================
  test.describe('Security, Auth & Payload Privacy', () => {
    test('public payload served to browser has private solutions completely redacted', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('btn-start-game').click();
      await expect(page.getByTestId('player-container')).toBeVisible({ timeout: 15_000 });

      // Inspect the last API response received by browser
      const apiResponseText = await page.getByTestId('last-api-response').innerText();
      expect(apiResponseText.toLowerCase()).not.toContain('"solution"');
      expect(apiResponseText.toLowerCase()).not.toContain('"grading_payload"');
      expect(apiResponseText.toLowerCase()).not.toContain('"validsolutionpredicate"');
    });

    test('revoked pairing token is denied with 401 session_invalid', async ({ page }) => {
      await gotoPreview(page);
      // Toggle revoked token checkbox
      await page.getByTestId('toggle-revoked-token').check();
      await page.getByTestId('btn-start-game').click();

      // Notice should report session_invalid
      await expect(page.getByTestId('api-notice')).toContainText('session_invalid');
      await expect(page.getByTestId('player-container')).toBeHidden();
    });

    test('parent mode enforces real Supabase GoTrue Auth and denies foreign families', async ({ page }) => {
      await gotoPreview(page);
      // Switch to Parent Mode
      await page.getByTestId('mode-parent').click();
      await expect(page.getByTestId('parent-auth-panel')).toBeVisible();

      // Sign in with real parent Alpha credentials via Supabase GoTrue
      await page.getByTestId('btn-login-parent').click();
      await expect(page.getByTestId('auth-status')).toContainText('authenticated: parent-alpha@example.invalid');

      // Test Parent PIN verification: Incorrect PIN
      await page.getByTestId('pin-input').fill('9999');
      await page.getByTestId('btn-verify-pin').click();
      await expect(page.getByTestId('pin-status')).toContainText('invalid', { timeout: 15_000 });

      // Test Parent PIN verification: Correct PIN 1234
      await page.getByTestId('pin-input').fill('1234');
      await page.getByTestId('btn-verify-pin').click();
      await expect(page.getByTestId('pin-status')).toContainText('verified', { timeout: 15_000 });

      // Foreign family denial: Select Child Beta (from family Beta)
      await page.getByTestId('child-select').selectOption(CHILD_BETA);
      await page.getByTestId('btn-start-game').click();
      await expect(page.getByTestId('api-notice')).toContainText('not_found');
      await expect(page.getByTestId('player-container')).toBeHidden();
    });
  });

  // =========================================================================
  // SUITE 3: Format 1 (g01-t1 Rule Sequence) - Both Ages
  // =========================================================================
  test.describe('Format 1: Rule Sequence (g01-t1)', () => {
    test('age 6-8: start -> wrong answer calm feedback -> retry correct -> DB verified won', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('child-select').selectOption(CHILD_ALPHA_68);
      await page.getByTestId('slot-select').selectOption('main');
      const today = getTestFamilyLocalDay();
      await page.getByTestId('day-input').fill(today);
      await page.getByTestId('btn-start-game').click();

      await expect(page.getByTestId('player-container')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('current-puzzle-type')).toContainText('g01-t1');
      await expect(page.getByTestId('current-puzzle-age')).toContainText('age_6_8');

      // Start gameplay from invitation
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('rule-sequence-game')).toBeVisible();

      // 1. Submit wrong answer ('hoa')
      await page.getByTestId('option-button-hoa').click();
      await page.getByTestId('submit-answer-btn').click();

      // Calm wrong feedback shown, attempt remains active in DB
      const wrongAlert = page.locator('.mx-auto.max-w-lg').getByRole('alert');
      await expect(wrongAlert).toBeVisible();
      await expect(wrongAlert).toContainText('Cách này chưa khớp rồi');

      // Verify DB attempt state is still active, not won (won: false)
      await page.getByTestId('btn-refresh-db-evidence').click();
      await expect(page.getByTestId('db-attempt-state')).toContainText('started');
      await expect(page.getByTestId('db-attempt-won')).toContainText('false');

      // 2. Retry on same attempt
      await wrongAlert.getByRole('button', { name: 'Thử lại cách khác' }).click();
      await expect(wrongAlert).toBeHidden();

      // 3. Select correct answer ('lá')
      await page.getByTestId('option-button-lá').click();
      await page.getByTestId('submit-answer-btn').click();

      // Finish celebration dialog
      await dismissFinishDialog(page);

      // Verify PostgreSQL 18.4 database row through live evidence
      await page.getByTestId('btn-refresh-db-evidence').click();
      await expect(page.getByTestId('db-attempt-state')).toContainText('finished');
      await expect(page.getByTestId('db-attempt-won')).toContainText('true');
      await expect(page.getByTestId('db-entitlement-state')).toContainText('finished');
      await expect(page.getByTestId('db-won-count')).toContainText('1');
      await expect(page.getByTestId('db-journey-index')).toContainText('2');
    });

    test('age 9-12: start -> wrong answer -> retry correct (20) -> DB verified won', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('child-select').selectOption(CHILD_ALPHA_912);
      await page.getByTestId('slot-select').selectOption('main');
      const today = getTestFamilyLocalDay();
      await page.getByTestId('day-input').fill(today);
      await page.getByTestId('btn-start-game').click();

      await expect(page.getByTestId('player-container')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('current-puzzle-type')).toContainText('g01-t1');
      await expect(page.getByTestId('current-puzzle-age')).toContainText('age_9_12');

      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('rule-sequence-game')).toBeVisible();

      // Pick wrong answer ('23')
      await page.getByTestId('option-button-23').click();
      await page.getByTestId('submit-answer-btn').click();

      const wrongAlert = page.locator('.mx-auto.max-w-lg').getByRole('alert');
      await expect(wrongAlert).toBeVisible();
      await wrongAlert.getByRole('button', { name: 'Thử lại cách khác' }).click();

      // Pick correct answer ('20')
      await page.getByTestId('option-button-20').click();
      await page.getByTestId('submit-answer-btn').click();

      await dismissFinishDialog(page);

      // DB verification
      await page.getByTestId('btn-refresh-db-evidence').click();
      await expect(page.getByTestId('db-attempt-state')).toContainText('finished');
      await expect(page.getByTestId('db-attempt-won')).toContainText('true');
      await expect(page.getByTestId('db-won-count')).toContainText('1');
    });
  });

  // =========================================================================
  // SUITE 4: Format 2 (g06-t1 Path Planning) - Day 3 Content
  // =========================================================================
  test.describe('Format 2: Path Planning (g06-t1)', () => {
    test('age 6-8: path navigation -> submit path -> DB verified won', async ({ page }) => {
      await resetChildState(page, CHILD_ALPHA_68, 3);
      await gotoPreview(page);
      await page.getByTestId('child-select').selectOption(CHILD_ALPHA_68);
      await page.getByTestId('slot-select').selectOption('main');
      const today = getTestFamilyLocalDay();
      await page.getByTestId('day-input').fill(today);
      await page.getByTestId('btn-start-game').click();

      await expect(page.getByTestId('player-container')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('current-puzzle-type')).toContainText('g06-t1');
      await expect(page.getByTestId('current-puzzle-age')).toContainText('age_6_8');

      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('path-planning-game')).toBeVisible();

      // 5x5 grid: 4 steps right, 4 steps down to reach (4,4)
      const rightBtn = page.getByTestId('dir-right');
      const downBtn = page.getByTestId('dir-down');
      for (let i = 0; i < 4; i += 1) await rightBtn.click();
      for (let i = 0; i < 4; i += 1) await downBtn.click();

      const submitBtn = page.getByTestId('submit-path-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      await dismissFinishDialog(page);

      // DB verification
      await page.getByTestId('btn-refresh-db-evidence').click();
      await expect(page.getByTestId('db-attempt-state')).toContainText('finished');
      await expect(page.getByTestId('db-attempt-won')).toContainText('true');
    });

    test('age 9-12: 7x7 grid with waypoint -> submit path -> DB verified won', async ({ page }) => {
      await resetChildState(page, CHILD_ALPHA_912, 3);
      await gotoPreview(page);
      await page.getByTestId('child-select').selectOption(CHILD_ALPHA_912);
      await page.getByTestId('slot-select').selectOption('main');
      const today = getTestFamilyLocalDay();
      await page.getByTestId('day-input').fill(today);
      await page.getByTestId('btn-start-game').click();

      await expect(page.getByTestId('player-container')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('current-puzzle-type')).toContainText('g06-t1');
      await expect(page.getByTestId('current-puzzle-age')).toContainText('age_9_12');

      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('path-planning-game')).toBeVisible();

      // 7x7 grid with waypoint at (3,3): 3 right, 3 down (to waypoint), 3 right, 3 down (to goal 6,6)
      const rightBtn = page.getByTestId('dir-right');
      const downBtn = page.getByTestId('dir-down');
      for (let i = 0; i < 3; i += 1) await rightBtn.click();
      for (let i = 0; i < 3; i += 1) await downBtn.click();
      for (let i = 0; i < 3; i += 1) await rightBtn.click();
      for (let i = 0; i < 3; i += 1) await downBtn.click();

      const submitBtn = page.getByTestId('submit-path-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      await dismissFinishDialog(page);

      // DB verification
      await page.getByTestId('btn-refresh-db-evidence').click();
      await expect(page.getByTestId('db-attempt-state')).toContainText('finished');
      await expect(page.getByTestId('db-attempt-won')).toContainText('true');
    });
  });

  // =========================================================================
  // SUITE 5: Format 3 (g03-t1 Memory Sequence) - Day 2 Content
  // =========================================================================
  test.describe('Format 3: Memory Sequence (g03-t1)', () => {
    test('age 6-8: Day 2 main slot view phase -> recall sequence -> DB verified won', async ({ page }) => {
      await resetChildState(page, CHILD_ALPHA_68, 2);
      await gotoPreview(page);
      await page.getByTestId('child-select').selectOption(CHILD_ALPHA_68);
      await page.getByTestId('slot-select').selectOption('main');
      const today = getTestFamilyLocalDay();
      await page.getByTestId('day-input').fill(today);
      await page.getByTestId('btn-start-game').click();

      await expect(page.getByTestId('player-container')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('current-puzzle-type')).toContainText('g03-t1');
      await expect(page.getByTestId('current-puzzle-age')).toContainText('age_6_8');

      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await expect(page.getByTestId('memory-sequence-game')).toBeVisible();

      // View phase: user controlled proceed button
      await expect(page.getByTestId('memory-view-phase')).toBeVisible();
      await page.getByTestId('start-recall-btn').click();

      // Recall phase: select sequence ['thuyền', 'cá', 'mưa']
      await expect(page.getByTestId('memory-recall-phase')).toBeVisible();
      await page.getByTestId('memory-option-thuyền').click();
      await page.getByTestId('memory-option-cá').click();
      await page.getByTestId('memory-option-mưa').click();

      const submitBtn = page.getByTestId('submit-memory-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      await dismissFinishDialog(page);

      // DB verification
      await page.getByTestId('btn-refresh-db-evidence').click();
      await expect(page.getByTestId('db-attempt-state')).toContainText('finished');
      await expect(page.getByTestId('db-attempt-won')).toContainText('true');
      await expect(page.getByTestId('db-journey-index')).toContainText('3');
    });

    test('age 9-12: Day 2 main slot 5-item recall sequence -> DB verified won', async ({ page }) => {
      await resetChildState(page, CHILD_ALPHA_912, 2);
      await gotoPreview(page);
      await page.getByTestId('child-select').selectOption(CHILD_ALPHA_912);
      await page.getByTestId('slot-select').selectOption('main');
      const today = getTestFamilyLocalDay();
      await page.getByTestId('day-input').fill(today);
      await page.getByTestId('btn-start-game').click();

      await expect(page.getByTestId('player-container')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('current-puzzle-type')).toContainText('g03-t1');
      await expect(page.getByTestId('current-puzzle-age')).toContainText('age_9_12');

      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
      await page.getByTestId('start-recall-btn').click();

      // 5 items: ['trăng', 'cá', 'táo', 'bóng', 'thuyền']
      await expect(page.getByTestId('memory-recall-phase')).toBeVisible();
      await page.getByTestId('memory-option-trăng').click();
      await page.getByTestId('memory-option-cá').click();
      await page.getByTestId('memory-option-táo').click();
      await page.getByTestId('memory-option-bóng').click();
      await page.getByTestId('memory-option-thuyền').click();

      const submitBtn = page.getByTestId('submit-memory-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      await dismissFinishDialog(page);

      // DB verification
      await page.getByTestId('btn-refresh-db-evidence').click();
      await expect(page.getByTestId('db-attempt-state')).toContainText('finished');
      await expect(page.getByTestId('db-attempt-won')).toContainText('true');
    });
  });

  // =========================================================================
  // SUITE 6: Lifecycle Controls (Pause, Resume, Hints, Exit without Penalty)
  // =========================================================================
  test.describe('Lifecycle Controls & Non-punitive UX', () => {
    test('pause calls real RPC and persists state; resume continues cleanly', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('btn-start-game').click();
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      // Click Pause ('Tạm dừng')
      await page.getByRole('button', { name: 'Tạm dừng' }).click();

      // Paused modal appears
      const pausedDialog = page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' });
      await expect(pausedDialog).toBeVisible();

      // Real DB evidence check: state is 'paused' in PostgreSQL 18.4
      await page.getByTestId('btn-refresh-db-evidence').click({ force: true });
      await expect(page.getByTestId('db-attempt-state')).toContainText('paused');

      // Click Resume ('Chơi tiếp')
      await pausedDialog.getByRole('button', { name: 'Chơi tiếp' }).click();
      await expect(pausedDialog).toBeHidden();
      await expect(page.getByTestId('rule-sequence-game')).toBeVisible();
    });

    test('hints progression 0/2 -> 1/2 -> 2/2 operates without leaking answers', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('btn-start-game').click();
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      const hintBtn = page.getByRole('button', { name: /Gợi ý/ });
      await expect(hintBtn).toContainText('0/2');

      // Request hint 1
      await hintBtn.click();
      await expect(hintBtn).toContainText('1/2');
      const hintRegion1 = page.getByRole('region', { name: /Gợi ý 1/ });
      await expect(hintRegion1).toBeVisible();
      expect((await hintRegion1.innerText()).toLowerCase()).not.toContain('đáp án là');

      // Request hint 2
      await page.getByRole('button', { name: 'Xem gợi ý tiếp theo' }).click();
      await expect(hintBtn).toContainText('2/2');
      const hintRegion2 = page.getByRole('region', { name: /Gợi ý 2/ });
      await expect(hintRegion2).toBeVisible();
      expect((await hintRegion2.innerText()).toLowerCase()).not.toContain('đáp án là');

      // Close hint
      await hintRegion2.getByRole('button', { name: 'Đóng' }).click();
      await expect(hintRegion2).toBeHidden();
    });

    test('exit preserves child progress without penalty', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('btn-start-game').click();
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      // Select option 'lá'
      await page.getByTestId('option-button-lá').click();

      // Click exit button (X with aria-label="Đóng" in header)
      await page.locator('header').getByRole('button', { name: 'Đóng' }).click();

      // Player container closes cleanly without penalty
      await expect(page.getByTestId('player-container')).toBeHidden();

      // Real DB verification: attempt remains in started state, not won or penalized
      await page.getByTestId('btn-refresh-db-evidence').click();
      await expect(page.getByTestId('db-attempt-state')).toContainText('started');
      await expect(page.getByTestId('db-won-count')).toContainText('0');
    });
  });

  // =========================================================================
  // SUITE 7: Rollover Stability, No Reroll & 2-Slot Cap
  // =========================================================================
  test.describe('Rollover Stability & Slot Constraints', () => {
    test('stable rollover: re-starting on same day returns existing attempt without rerolling', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('btn-start-game').click();
      await page.getByRole('button', { name: 'Cùng thử nhé' }).click();

      // Finish the main game
      await page.getByTestId('option-button-lá').click();
      await page.getByTestId('submit-answer-btn').click();
      await dismissFinishDialog(page);

      // Now click "Bắt đầu chơi" again on the same slot and day
      await page.getByTestId('btn-start-game').click();
      await expect(page.getByTestId('api-notice')).toContainText('attempt_already_finished');

      // It should return the existing finished attempt without creating a new attempt or altering won count
      await page.getByTestId('btn-refresh-db-evidence').click();
      await expect(page.getByTestId('db-attempt-state')).toContainText('finished');
      await expect(page.getByTestId('db-won-count')).toContainText('1');
    });

    test('server-enforced bonus eligibility: unearned bonus slot returns bonus_locked', async ({ page }) => {
      await gotoPreview(page);
      await page.getByTestId('child-select').selectOption(CHILD_ALPHA_68);
      await page.getByTestId('slot-select').selectOption('bonus');
      const today = getTestFamilyLocalDay();
      await page.getByTestId('day-input').fill(today);
      await page.getByTestId('btn-start-game').click();

      // Server enforces mandatory habit completion and returns bonus_locked
      await expect(page.getByTestId('api-notice')).toContainText('bonus_locked');
      await expect(page.getByTestId('player-container')).toBeHidden();
    });
  });
});
