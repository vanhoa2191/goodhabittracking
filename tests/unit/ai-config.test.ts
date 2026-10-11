import { afterEach, describe, expect, it, vi } from 'vitest';
import { AI_LIMITS, AI_POLICY_VERSION } from '@/lib/ai/config';

afterEach(() => vi.unstubAllEnvs());

describe('AI_LIMITS', () => {
  it('requires consent for the current monthly policy', () => {
    expect(AI_POLICY_VERSION).toBe('2026-10-11');
  });
  it('holds the monthly and safety limits from the owner spec', () => {
    expect(AI_LIMITS.perMonth).toEqual({ free: 10, standard: 20 });
    expect(AI_LIMITS.perDaySafety).toBe(100);
    expect(AI_LIMITS.minSecondsBetweenCalls).toBe(20);
  });

  it('defaults the system cap to 5000 a day', () => {
    vi.stubEnv('AI_SYSTEM_PER_DAY', '');
    expect(AI_LIMITS.systemPerDay).toBe(5000);
  });

  it.each([['250', 250], ['1', 1], ['100000', 100000]])('takes AI_SYSTEM_PER_DAY=%s', (raw, expected) => {
    vi.stubEnv('AI_SYSTEM_PER_DAY', raw);
    expect(AI_LIMITS.systemPerDay).toBe(expected);
  });

  it.each(['abc', '0', '-5', '1.5', '100001', 'NaN', 'Infinity'])('falls back to 5000 for AI_SYSTEM_PER_DAY=%s', (raw) => {
    vi.stubEnv('AI_SYSTEM_PER_DAY', raw);
    expect(AI_LIMITS.systemPerDay).toBe(5000);
  });
});
