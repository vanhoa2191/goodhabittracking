import { describe, expect, it, vi } from 'vitest';
import {
  connectChildDevice,
  createPairingChallenge,
  disconnectChildDevice,
  loadChildSession,
  readPairingCredential,
  rotatePairingCredential,
} from '@/lib/store/pairing-client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const childSession = {
  familyPausedAt: null,
  familyPausePeriods: [],
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
  logs: [],
  rewards: [],
  redemptions: [],
};

describe('pairing client', () => {
  it('returns only a validated challenge code', async () => {
    const validRequest = vi.fn(async () => jsonResponse({
      childId: 'child-1',
      code: 'ABCD-2345',
      qrPayload: 'https://kid.example/?pair=token-value',
      rotatedAt: '2026-09-21T12:00:00.000Z',
    }));
    const invalidRequest = vi.fn(async () => jsonResponse({ code: 1234 }));

    await expect(createPairingChallenge('child-1', validRequest)).resolves.toBe('ABCD-2345');
    await expect(createPairingChallenge('child-1', invalidRequest)).resolves.toBeNull();
  });

  it('parses the stable credential contract for parent management', async () => {
    // Given
    const credential = {
      childId: 'child-1',
      code: 'ABCD-2345',
      qrPayload: 'https://kid.example/?pair=token-value',
      rotatedAt: '2026-09-21T12:00:00.000Z',
    };
    const request = vi.fn(async () => jsonResponse(credential));

    // When
    const result = await readPairingCredential('child-1', request);

    // Then
    expect(result).toEqual(credential);
    expect(request).toHaveBeenCalledWith('/api/pairing/credentials', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('uses the dedicated rotation boundary', async () => {
    // Given
    const credential = {
      childId: 'child-1',
      code: 'WXYZ-6789',
      qrPayload: 'https://kid.example/?pair=rotated-token',
      rotatedAt: '2026-09-21T12:05:00.000Z',
    };
    const request = vi.fn(async () => jsonResponse(credential));

    // When
    const result = await rotatePairingCredential('child-1', request);

    // Then
    expect(result).toEqual(credential);
    expect(request).toHaveBeenCalledWith('/api/pairing/credentials/rotate', expect.objectContaining({
      method: 'POST',
    }));
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

  it('exchanges a scanned token without treating it as a manual code', async () => {
    // Given
    const request = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(jsonResponse(childSession));

    // When
    await connectChildDevice({ token: 'qr-token-with-at-least-thirty-two-characters' }, request);

    // Then
    expect(request).toHaveBeenNthCalledWith(1, '/api/pairing/exchange', expect.objectContaining({
      body: JSON.stringify({ token: 'qr-token-with-at-least-thirty-two-characters' }),
    }));
  });

  it('preserves a WIT identity from a paired child session', async () => {
    const activity = {
      id: 'activity-1', childId: 'child-1', title: 'Drink water', description: null,
      instructions: null, icon: '💧', category: 'nutrition', points: 5,
      recurrenceType: 'daily', recurrenceDays: [], timeOfDay: 'anytime',
      durationMinutes: null, requiresApproval: false, isActive: true,
      targetAgeStage: 'all', isParentRole: false, portrait16Key: null,
      boThi7Key: null, frameworkHabitId: null, frameworkContentVersion: null,
      legacyTemplateId: 'WIT-NUT-01', createdAt: '2026-09-01T00:00:00.000Z',
    };
    const request = vi.fn(async () => jsonResponse({ ...childSession, activities: [activity] }));

    const result = await loadChildSession(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.activities[0].legacyTemplateId).toBe('WIT-NUT-01');
    }
  });

  it('reads an active family pause from a paired child session', async () => {
    const pausedAt = '2026-09-24T10:00:00.000Z';
    const familyPausePeriods = [{ startedAt: pausedAt, endedAt: null }];
    const request = vi.fn(async () => jsonResponse({ ...childSession, familyPausedAt: pausedAt, familyPausePeriods }));

    const result = await loadChildSession(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.familyPausedAt).toBe(pausedAt);
      expect(result.session.familyPausePeriods).toEqual(familyPausePeriods);
    }
  });

  it('rejects malformed session data instead of hydrating partial state', async () => {
    const request = vi.fn(async () => jsonResponse({ child: { id: 'child-1' } }));

    await expect(loadChildSession(request)).resolves.toEqual({
      success: false,
      message: 'Không thể tải dữ liệu của bé.',
    });
  });

  it('identifies a revoked child session so the open device can clear its data', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ error: 'Session expired.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(loadChildSession(request)).resolves.toMatchObject({
      success: false,
      sessionInvalid: true,
    });
  });

  it('revokes the server session with DELETE', async () => {
    const request = vi.fn(async () => jsonResponse({ success: true }));

    await disconnectChildDevice(request);

    expect(request).toHaveBeenCalledWith('/api/child/session', { method: 'DELETE' });
  });
});
