import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';
import type { LeaderboardEntry, LeaderboardPeriod, LeagueTier } from '@/types';

const rowSchema = z.object({
  rank_number: z.number().int().positive(),
  nickname: z.string(),
  avatar: z.string(),
  theme_color: z.string(),
  points: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  tier: z.enum(['bronze', 'silver', 'gold', 'diamond']),
  is_mine: z.boolean(),
});

export type PublicLeaderboardResult =
  | { readonly status: 'ready'; readonly entries: LeaderboardEntry[] }
  | { readonly status: 'unavailable' }
  | { readonly status: 'error' };

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }> };

const PUBLIC_LIMIT = 50;

/**
 * The board of every family that chose to share. The server never returns an id or a real name; the viewer's own child
 * is marked by passing its id in, so the answer says "this row is yours" without saying who anyone else is.
 */
export async function fetchPublicLeaderboard(
  period: LeaderboardPeriod,
  mineChildId: string | null,
  today: string,
  client: RpcClient | null = getSupabase() as RpcClient | null,
): Promise<PublicLeaderboardResult> {
  if (!client) return { status: 'unavailable' };
  try {
    const { data, error } = await client.rpc('get_public_leaderboard', {
      period_key: period,
      viewer_today: today,
      mine_child_id: mineChildId,
      result_limit: PUBLIC_LIMIT,
    });
    if (error) return { status: 'error' };
    const rows = z.array(rowSchema).safeParse(data);
    if (!rows.success) return { status: 'error' };
    return {
      status: 'ready',
      entries: rows.data.map((row) => ({
        childId: null,
        nickname: row.nickname,
        avatar: row.avatar,
        themeColor: row.theme_color,
        points: row.points,
        streak: row.streak,
        tier: row.tier as LeagueTier,
        rank: row.rank_number,
        isCurrentChild: row.is_mine,
      })),
    };
  } catch {
    return { status: 'error' };
  }
}

export async function loadLeaderboardSharing(): Promise<boolean | null> {
  try {
    const response = await fetch('/api/privacy/leaderboard-sharing', { cache: 'no-store' });
    if (!response.ok) return null;
    const body = z.object({ enabled: z.boolean() }).parse(await response.json());
    return body.enabled;
  } catch {
    return null;
  }
}

export async function saveLeaderboardSharing(enabled: boolean): Promise<boolean | null> {
  try {
    const response = await fetch('/api/privacy/leaderboard-sharing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) return null;
    const body = z.object({ enabled: z.boolean() }).parse(await response.json());
    return body.enabled === enabled ? body.enabled : null;
  } catch {
    return null;
  }
}
