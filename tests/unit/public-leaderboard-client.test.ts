import { describe, expect, it, vi } from 'vitest';
import { fetchPublicLeaderboard } from '@/lib/store/public-leaderboard-client';

const row = (overrides: Record<string, unknown> = {}) => ({
  rank_number: 1, nickname: 'Sư Tử Nhỏ', avatar: 'mascot:leo', theme_color: '#f97316', points: 40, streak: 3, tier: 'silver', is_mine: false, ...overrides,
});
const client = (result: { data: unknown; error: unknown }) => ({ rpc: vi.fn(async () => result) });

describe('the public leaderboard on the child\'s screen', () => {
  it('asks for the viewer\'s own calendar day and passes the child so the row can be marked, never an id back', async () => {
    const supabase = client({ data: [row(), row({ rank_number: 2, nickname: 'Bé Siêu Nhân', points: 10, is_mine: true })], error: null });
    const result = await fetchPublicLeaderboard('weekly', 'child-1', '2026-09-30', supabase);
    expect(supabase.rpc).toHaveBeenCalledWith('get_public_leaderboard', { period_key: 'weekly', viewer_today: '2026-09-30', mine_child_id: 'child-1', result_limit: 50 });
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.entries.map((entry) => ({ rank: entry.rank, childId: entry.childId, isCurrentChild: entry.isCurrentChild, tier: entry.tier }))).toEqual([
      { rank: 1, childId: null, isCurrentChild: false, tier: 'silver' },
      { rank: 2, childId: null, isCurrentChild: true, tier: 'silver' },
    ]);
  });

  it('is unavailable without a server connection and reports an error for anything unexpected', async () => {
    await expect(fetchPublicLeaderboard('daily', null, '2026-09-30', null)).resolves.toEqual({ status: 'unavailable' });
    await expect(fetchPublicLeaderboard('daily', null, '2026-09-30', client({ data: null, error: { message: 'x' } }))).resolves.toEqual({ status: 'error' });
    await expect(fetchPublicLeaderboard('daily', null, '2026-09-30', client({ data: [{ nickname: 'thiếu cột' }], error: null }))).resolves.toEqual({ status: 'error' });
    await expect(fetchPublicLeaderboard('daily', null, '2026-09-30', { rpc: vi.fn(async () => { throw new Error('offline'); }) })).resolves.toEqual({ status: 'error' });
  });

  it('shows an empty board as empty', async () => {
    await expect(fetchPublicLeaderboard('monthly', null, '2026-09-30', client({ data: [], error: null }))).resolves.toEqual({ status: 'ready', entries: [] });
  });
});
