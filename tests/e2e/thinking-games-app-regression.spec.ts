import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import { expect, test, type Page } from '@playwright/test';

// Mount the shipping card/player in a browser with API transport fixtures.
// No preview selector, database, or running Next server is used by these tests.
const manifest = JSON.parse(readFileSync(join(process.cwd(), 'content/thinking-games/pilot/pilot-manifest-v1.json'), 'utf8'));
const puzzle = { ...manifest.items.find(
  (item: { gameTypeId: string; ageTrack: string }) => item.gameTypeId === 'g01-t1' && item.ageTrack === 'age_6_8',
) };
delete puzzle.solution;
delete puzzle.validSolutionPredicate;
let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
        import {ThinkingGameCard} from './src/components/ThinkingGameCard';
        import {ThinkingGamePlayer} from './src/components/thinking-games/ThinkingGamePlayer';
        const query = new URLSearchParams(location.search);
        const child = query.get('surface') === 'player'
          ? React.createElement(ThinkingGamePlayer, {puzzle: ${JSON.stringify(puzzle)}, initialState: 'playing'})
          : React.createElement(ThinkingGameCard, {childId: '11111111-1111-4111-8111-111111111111', localDay: '2026-10-28', mode: query.get('mode') || 'parent'});
        createRoot(document.getElementById('root')).render(child);`,
      resolveDir: process.cwd(), loader: 'tsx',
    },
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
    define: { 'process.env': '{}', 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_THINKING_GAMES': '"true"' },
    plugins: [{ name: 'standalone-next-dynamic', setup(builder) {
      builder.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: 'next-dynamic', namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `import React, {lazy, Suspense} from 'react';
        export default function dynamic(loader) { const Component = lazy(() => loader().then(Component => ({default: Component})));
          return props => React.createElement(Suspense, {fallback: null}, React.createElement(Component, props)); }`,
        resolveDir: process.cwd(), loader: 'js' }));
    } }],
  });
  bundle = result.outputFiles[0].text;
});

async function mount(page: Page, query = '', bonusAvailable = false, finishCode?: string) {
  const starts: Array<{ slot: string }> = [];
  await page.route('http://localhost/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/bundle.js') return route.fulfill({ contentType: 'application/javascript', body: bundle });
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname.endsWith('/finish') && finishCode) return route.fulfill({ status: 409,
        json: { ok: false, schemaVersion: 'v1', code: finishCode, messageKey: `thinkingGames.${finishCode}` } });
      if (url.pathname.endsWith('/start')) starts.push(route.request().postDataJSON());
      return route.fulfill({ json: { ok: true, schemaVersion: 'v1', status: url.pathname.endsWith('/start') ? 'started' : 'available',
        data: url.pathname.endsWith('/state') ? { bonusAvailable } : { attemptId: '22222222-2222-4222-8222-222222222222', puzzle } } });
    }
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="vi"><head><meta charset="utf-8"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>' });
  });
  await page.goto(`http://localhost/${query}`);
  return starts;
}

test('shipping parent card reopens the same attempt after close and reload', async ({ page }) => {
  const starts = await mount(page);
  await page.getByRole('button', { name: 'Chơi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cùng thử nhé' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('button', { name: 'Chơi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cùng thử nhé' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Chơi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cùng thử nhé' })).toBeVisible();
  expect(starts.map((start) => start.slot)).toEqual(['main', 'main', 'main']);
});

for (const mode of ['parent', 'paired']) {
  test(`shipping ${mode} card starts a granted bonus from server state`, async ({ page }) => {
    const starts = await mount(page, `?mode=${mode}`, true);
    await page.getByRole('button', { name: 'Chơi thêm', exact: true }).click();
    expect(starts).toHaveLength(1);
    expect(starts[0].slot).toBe('bonus');
  });
}

test('card hides bonus without a server grant', async ({ page }) => {
  await mount(page, '', false);
  await expect(page.getByRole('button', { name: 'Chơi', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chơi thêm', exact: true })).toHaveCount(0);
});

test('expired parent attempt leaves the board and explains day rollover', async ({ page }) => {
  await mount(page, '', false, 'attempt_expired');
  await page.getByRole('button', { name: 'Chơi', exact: true }).click();
  await page.getByRole('button', { name: 'Cùng thử nhé' }).click();
  await page.getByRole('group', { name: 'Các lựa chọn đáp án' }).getByRole('button').first().click();
  await page.getByRole('button', { name: 'Kiểm tra đáp án' }).click();
  await expect(page.getByRole('status')).toHaveText('Lượt chơi đã hết ngày. Hãy tải lại trang để chơi ngày mới.');
  await expect(page.getByRole('button', { name: 'Chơi', exact: true })).toBeVisible();
});

test('real player retains pause button and Escape after opening and closing hints', async ({ page }) => {
  await mount(page, '?surface=player');
  await page.getByRole('button', { name: /^Gợi ý \(/ }).click();
  await expect(page.getByRole('button', { name: 'Tạm dừng', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng', exact: true }).last().click();
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' })).toBeVisible();
  await page.getByRole('button', { name: 'Chơi tiếp', exact: true }).click();
  await page.getByRole('button', { name: /^Gợi ý \(/ }).click();
  await page.getByRole('button', { name: 'Đóng', exact: true }).last().click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Nghỉ ngơi một chút' })).toBeVisible();
});
