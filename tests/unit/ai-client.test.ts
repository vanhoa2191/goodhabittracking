import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestBreakdown } from '@/lib/store/ai-client';

const input = { title: 'Đọc sách', ageYears: 8, language: 'vi' as const };
const reply = (status: number, body: unknown) => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })));

describe('AI client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns three steps from a good answer', async () => {
    const steps = { steps: [{ text: 'a b c', minutes: 1 }, { text: 'd e f', minutes: 2 }, { text: 'g h i', minutes: 3 }] };
    reply(200, { success: true, result: steps, remainingThisMonth: 3 });
    expect(await requestBreakdown(input)).toEqual({ ok: true, result: steps, remainingThisMonth: 3 });
  });

  it('turns each refusal into a code the screen can word', async () => {
    reply(429, { success: false, code: 'ai_quota' });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_quota' });
    reply(403, { success: false, code: 'ai_consent_required' });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_consent_required' });
    reply(403, { error: 'PIN', code: 'parent_pin_required' });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'pin' });
    reply(503, { success: false, code: 'something_new' });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_error' });
  });

  it.each(['free', 'standard', 'plus'])('keeps the %s family-day quota details for the screen', async (tier) => {
    reply(429, { success: false, code: 'ai_quota', reason: 'family_day', tier });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_quota', reason: 'family_day', tier });
  });

  it.each(['system_day', 'too_fast'])('keeps %s separate from the family limit', async (reason) => {
    reply(429, { success: false, code: 'ai_quota', reason });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_quota', reason });
  });

  it.each(['free', 'standard', 'plus'])('keeps the %s monthly refusal details', async (tier) => {
    reply(429, { success: false, code: 'ai_quota', reason: 'family_month', tier });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_quota', reason: 'family_month', tier });
  });

  it('drops the retired basic tier', async () => {
    reply(429, { success: false, code: 'ai_quota', reason: 'family_day', tier: 'basic' });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_quota', reason: 'family_day' });
  });

  it('ignores unknown quota details without losing the refusal', async () => {
    reply(429, { success: false, code: 'ai_quota', reason: 'unknown', tier: 'premium' });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_quota' });
    reply(429, { success: false, code: 'ai_quota', reason: 'family_day', tier: { value: 'plus' } });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_quota', reason: 'family_day' });
  });

  it('refuses a success that does not hold exactly three steps, and a failed connection', async () => {
    reply(200, { success: true, result: { steps: [{ text: 'a b c', minutes: 1 }] } });
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'ai_invalid_output' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await requestBreakdown(input)).toEqual({ ok: false, code: 'network' });
  });
});
