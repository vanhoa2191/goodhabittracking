import { describe, expect, it } from 'vitest';
import {
  ThinkingGameRequestError,
  excuseThinkingGameTask,
  getThinkingGameChildSettings,
  getThinkingGameParentSettings,
  previewThinkingGameDay,
  updateThinkingGameParentSettings,
} from '@/lib/store/thinking-games-client';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
});
const requester = (body: unknown, status = 200) => async () => response(body, status);

describe('thinking-games settings client boundary', () => {
  it('strictly parses child-redacted settings', async () => {
    const result = await getThinkingGameChildSettings(requester({
      ok: true, schemaVersion: 'v1', status: 'available',
      data: { enabled: true, bonusEnabled: false, timezoneConfigured: true, ageTrackOverride: 'age_6_8' },
    }));
    expect(result.ok).toBe(true);
  });

  it('keeps parent settings and preview on the game envelope', async () => {
    const settings = await getThinkingGameParentSettings(requester({
      ok: true, schemaVersion: 'v1', status: 'available', data: { enabled: false },
    }));
    const preview = await previewThinkingGameDay(
      { childId: '11111111-1111-4111-8111-111111111111', localDay: '2026-10-21' },
      requester({ ok: true, schemaVersion: 'v1', status: 'available', data: { status: 'not_snapshotted' } }),
    );
    expect(settings.ok && preview.ok).toBe(true);
  });

  it('serializes settings update and excuse requests without local entitlement claims', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const capture = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), init });
      return response({ ok: true, schemaVersion: 'v1', status: 'available', data: {} });
    };
    await updateThinkingGameParentSettings({
      enabled: true, bonusEnabled: false, timezone: 'Asia/Ho_Chi_Minh',
      cutoffLocal: '19:00', bedtimeStartLocal: '21:00', bedtimeEndLocal: '07:00',
      ageTrackOverride: null, commandId: '22222222-2222-4222-8222-222222222222',
    }, capture);
    await excuseThinkingGameTask({
      childId: '11111111-1111-4111-8111-111111111111', localDay: '2026-10-21',
      activityId: '33333333-3333-4333-8333-333333333333', reason: 'Family exception',
      commandId: '44444444-4444-4444-8444-444444444444',
    }, capture);
    expect(calls[0].url).toContain('/api/domain/thinking-games/settings');
    expect(calls[0].init?.method).toBe('PUT');
    expect(calls[1].init?.method).toBe('POST');
    expect(calls[1].url).toContain('/api/domain/thinking-games/excuse');
    expect(JSON.parse(String(calls[0].init?.body)).enabled).toBe(true);
  });

  it.each([true, false])('preserves bonusEnabled=%s and the parent PIN-gated write body', async (bonusEnabled) => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const capture = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), init });
      return response({ ok: true, schemaVersion: 'v1', status: 'available', data: { status: 'scheduled' } });
    };
    await updateThinkingGameParentSettings({
      enabled: true, bonusEnabled, timezone: 'Asia/Ho_Chi_Minh',
      cutoffLocal: '19:00', bedtimeStartLocal: '20:30', bedtimeEndLocal: '06:30',
      ageTrackOverride: 'age_9_12', commandId: '22222222-2222-4222-8222-222222222222',
    }, capture);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('/api/domain/thinking-games/settings');
    expect(JSON.parse(String(calls[0].init?.body))).toMatchObject({
      enabled: true,
      bonusEnabled,
      bedtimeStartLocal: '20:30',
      bedtimeEndLocal: '06:30',
      ageTrackOverride: 'age_9_12',
    });
  });

  it('distinguishes malformed response and PIN refusal', async () => {
    await expect(getThinkingGameParentSettings(requester({ success: true }, 200)))
      .rejects.toMatchObject({ code: 'invalid_response', outcome: 'unknown' });
    await expect(getThinkingGameParentSettings(requester({
      ok: false, schemaVersion: 'v1', code: 'parent_pin_required', messageKey: 'parent.pin',
    }, 403))).rejects.toBeInstanceOf(ThinkingGameRequestError);
  });
});
