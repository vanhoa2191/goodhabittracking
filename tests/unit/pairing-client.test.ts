import { describe, expect, it, vi } from 'vitest';
import {
  connectChildDevice,
  createPairingChallenge,
  disconnectChildDevice,
  loadChildSession,
} from '@/lib/store/pairing-client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const childSession = {
  child: {
    id: 'child-1',
    name: 'Bé An',
    nickname: null,
    avatar: '🦁',
    themeColor: '#f97316',
    points: 50,
    totalEarned: 190,
    level: 2,
    streak: 3,
    birthYear: 2018,
    ageStage: '6-12',
    lastActiveDate: null,
    leagueTier: 'silver',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  activities: [],
  rewards: [],
};

describe('pairing client', () => {
  it('returns only a validated challenge code', async () => {
    const validRequest = vi.fn(async () => jsonResponse({ code: 'ABCD-1234' }));
    const invalidRequest = vi.fn(async () => jsonResponse({ code: 1234 }));

    await expect(createPairingChallenge('child-1', validRequest)).resolves.toBe('ABCD-1234');
    await expect(createPairingChallenge('child-1', invalidRequest)).resolves.toBeNull();
  });

  it('stops after a rejected exchange and preserves the server message', async () => {
    const request = vi.fn(async () => jsonResponse({ error: 'Mã đã hết hạn.' }, 410));

    await expect(connectChildDevice('ABCD-1234', request)).resolves.toEqual({
      success: false,
      message: 'Mã đã hết hạn.',
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('exchanges a code and parses the exact child session shape', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(jsonResponse(childSession));

    const result = await connectChildDevice('ABCD-1234', request);

    expect(result).toEqual({ success: true, session: {
      ...childSession,
      child: {
        ...childSession.child,
        nickname: undefined,
        lastActiveDate: undefined,
      },
    } });
    expect(request).toHaveBeenNthCalledWith(2, '/api/child/session', { cache: 'no-store' });
  });

  it('rejects malformed session data instead of hydrating partial state', async () => {
    const request = vi.fn(async () => jsonResponse({ child: { id: 'child-1' } }));

    await expect(loadChildSession(request)).resolves.toEqual({
      success: false,
      message: 'Không thể tải dữ liệu của bé.',
    });
  });

  it('revokes the server session with DELETE', async () => {
    const request = vi.fn(async () => jsonResponse({ success: true }));

    await disconnectChildDevice(request);

    expect(request).toHaveBeenCalledWith('/api/child/session', { method: 'DELETE' });
  });
});
