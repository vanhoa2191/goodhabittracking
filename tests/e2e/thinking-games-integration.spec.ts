import { spawn, type ChildProcess } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { cloudFamilyIds, installCloudFamilyFixture } from './cloud-family-fixture';

type PilotItem = {
  id: string;
  dayIndex: number;
  slotType: string;
  ageTrack: string;
  locale: string;
  contentVersion: string;
  solution: unknown;
  hints: string[];
  [key: string]: unknown;
};

const pilot = JSON.parse(readFileSync(join(process.cwd(), 'content/thinking-games/pilot/pilot-manifest-v1.json'), 'utf8')) as {
  items: PilotItem[];
};
const dayIndex = ((new Date().getDate() - 1) % 7) + 1;
const localItem = pilot.items.find((item) =>
  item.dayIndex === dayIndex && item.slotType === 'main' && item.ageTrack === 'age_6_8'
  && item.locale === 'vi' && item.contentVersion === 'pilot-2026-10-21');
if (!localItem) throw new Error('local practice fixture missing');

const port = 3217;
const baseURL = `http://127.0.0.1:${port}`;
let server: ChildProcess | undefined;
let disabledServer: ChildProcess | undefined;
const serverDirs: string[] = [];

function linkProject() {
  const projectRoot = process.cwd();
  const dir = mkdtempSync(join(tmpdir(), 'thinking-games-e2e-'));
  serverDirs.push(dir);
  const copied = new Set(['apps', 'config', 'content', 'public', 'src']);
  for (const entry of readdirSync(projectRoot)) {
    if (['.next', '.git', 'node_modules', 'playwright-report', 'test-results'].includes(entry)) continue;
    if (copied.has(entry)) {
      cpSync(join(projectRoot, entry), join(dir, entry), { recursive: true });
    } else {
      symlinkSync(join(projectRoot, entry), join(dir, entry));
    }
  }
  symlinkSync(join(projectRoot, 'node_modules'), join(dir, 'node_modules'));
  return dir;
}

function startServer(targetPort: number, flag: 'true' | 'false') {
  const dir = linkProject();
  return spawn(join(dir, 'node_modules', '.bin', 'next'), [
    'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(targetPort),
  ], {
    cwd: dir,
    env: {
      ...process.env,
      NEXT_PUBLIC_THINKING_GAMES: flag,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://e2e-test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'e2e-anon-key',
      NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${targetPort}`,
      NEXT_PUBLIC_DEPLOY_TARGET: 'app',
    },
    detached: true,
    stdio: 'ignore',
  });
}

async function waitForServer(targetURL: string) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${targetURL}/`);
      if (response.ok || response.status === 307 || response.status === 308) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Thinking-games integration server did not start.');
}

test.describe('Thinking Games Card/Player integration', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(({ browserName, viewport }) => browserName !== 'chromium' || (viewport?.width ?? 0) < 1000,
    'The integration harness runs once on desktop Chromium.');

  let ready: Promise<void> | undefined;

  async function ensureServer() {
    ready ??= waitForServer(baseURL);
    await ready;
  }

  test.beforeAll(() => {
    server = startServer(port, 'true');
  });

  test.afterAll(() => {
    for (const child of [server, disabledServer]) {
      if (!child?.pid) continue;
      try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    }
    server = undefined;
    disabledServer = undefined;
    for (const dir of serverDirs) rmSync(dir, { recursive: true, force: true });
  });

  test('local demo starts the real Player from the Card and finishes locally', async ({ page }) => {
    test.setTimeout(120_000);
    await ensureServer();
    await page.goto(`${baseURL}/?demo=1`);
    await expect(page.getByRole('heading', { name: 'Một trò chơi nhỏ hôm nay' })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Chơi', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Cùng thử nhé' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    await expect(page.getByTestId('rule-sequence-game')).toBeVisible();
    await page.getByTestId(`option-button-${String(localItem.solution)}`).click();
    await page.getByTestId('submit-answer-btn').click();
    await expect(page.getByRole('dialog', { name: 'Chúc mừng bạn!' })).toBeVisible();
  });

  test('a real cloud start response opens the Player instead of being discarded', async ({ page }) => {
    test.setTimeout(120_000);
    await ensureServer();
    const item = pilot.items.find((entry) => entry.dayIndex === 1 && entry.slotType === 'main' && entry.ageTrack === 'age_6_8');
    if (!item) throw new Error('cloud start fixture missing');
    const publicPuzzle = {
      schemaVersion: item.schemaVersion,
      contentVersion: item.contentVersion,
      id: item.id,
      dayIndex: item.dayIndex,
      slotType: item.slotType,
      skillGroup: item.skillGroup,
      gameTypeId: item.gameTypeId,
      ruleVariantId: item.ruleVariantId,
      ageTrack: item.ageTrack,
      locale: item.locale,
      title: item.title,
      invitation: item.invitation,
      tutorial: item.tutorial,
      boardData: item.boardData,
      hints: item.hints.slice(0, 2) as [string, string],
      praiseKeys: item.praiseKeys as Record<string, string>,
      targetSeconds: item.targetSeconds,
      fingerprint: item.fingerprint,
    };
    const attemptId = '22222222-2222-4222-8222-222222222222';
    let pauseFails = true;
    await installCloudFamilyFixture(page, baseURL);
    await page.route('**/api/domain/thinking-games/pause', (route) => route.fulfill({
      status: pauseFails ? 500 : 200,
      contentType: 'application/json',
      body: JSON.stringify(pauseFails
        ? { ok: false, schemaVersion: 'v1', code: 'server_error', messageKey: 'error.unavailable' }
        : { ok: true, schemaVersion: 'v1', status: 'paused', data: { attemptId } }),
    }));
    await page.route('**/api/domain/thinking-games/start', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        schemaVersion: 'v1',
        status: 'started',
        data: { attemptId, puzzle: publicPuzzle },
      }),
    }));

    await page.goto(baseURL);
    await page.getByRole('button', { name: 'Bé vui học' }).click();
    await expect(page.getByRole('heading', { name: 'Một trò chơi nhỏ hôm nay' })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Chơi', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Cùng thử nhé' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
    await expect(page.getByRole('button', { name: 'Chơi', exact: true })).toBeHidden();

    await page.getByRole('button', { name: 'Tạm dừng' }).click();
    await expect(page.getByText('Không thể lưu trạng thái tạm dừng.')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();

    pauseFails = false;
    await page.getByRole('button', { name: 'Tạm dừng' }).click();
    await expect(page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' })).toBeVisible();
    await page.getByRole('button', { name: 'Chơi tiếp' }).click();
    await expect(page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
    expect(cloudFamilyIds.child).toBeTruthy();
  });

  test('the default-off flag mounts no Card and issues no thinking-game requests', async ({ page }) => {
    test.setTimeout(120_000);
    const disabledURL = 'http://127.0.0.1:3218';
    disabledServer = startServer(3218, 'false');
    await waitForServer(disabledURL);
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('thinking-games')) requests.push(request.url());
    });

    await page.goto(`${disabledURL}/?demo=1`);
    await expect(page.getByRole('heading', { name: 'Một trò chơi nhỏ hôm nay' })).toHaveCount(0);
    await page.waitForTimeout(1_000);
    expect(requests).toEqual([]);
  });
});
