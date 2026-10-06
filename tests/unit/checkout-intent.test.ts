import { afterEach, describe, expect, it, vi } from 'vitest';
import * as auth from '@/lib/supabase';

const oauth = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserSupabase: () => ({ auth: { signInWithOAuth: oauth } }),
  isSupabaseConfigured: () => true,
}));

afterEach(() => vi.unstubAllGlobals());

describe('checkout intent', () => {
  it.each(['solo_monthly', 'solo_yearly', 'monthly', 'yearly'])('accepts paid plan %s', (value) => {
    expect(auth).toHaveProperty('parseCheckoutPlan');
    expect(auth.parseCheckoutPlan(value)).toBe(value);
  });

  it.each([null, '', 'trial', 'free', 'lifetime', 'unknown', 'Monthly', ' monthly', 'monthly,yearly', 'monthly&plan=yearly', 'family_plus_yearly'])('rejects %s', (value) => {
    expect(auth).toHaveProperty('parseCheckoutPlan');
    expect(auth.parseCheckoutPlan(value)).toBeNull();
  });
});

describe('Google OAuth return path', () => {
  it.each([
    ['/checkout?plan=solo_monthly', '/checkout?plan=solo_monthly'],
    ['/checkout?plan=monthly', '/checkout?plan=monthly'],
    ['/checkout?plan=yearly', '/checkout?plan=yearly'],
    [undefined, '/'],
    ['', '/'],
    ['https://evil.example/checkout', '/'],
    ['https://app.example/checkout', '/'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
    ['/\n/evil.example', '/'],
    ['javascript:alert(1)', '/'],
    ['checkout?plan=monthly', '/'],
    ['/%2f%2fevil.example', '/'],
    ['/%5cevil.example', '/'],
  ])('sanitizes %s to %s', async (input, expected) => {
    vi.stubGlobal('window', { location: { origin: 'https://app.example' } });
    await auth.signInWithGoogle(input);
    expect(oauth).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'google',
      options: expect.objectContaining({ redirectTo: `https://app.example${expected}` }),
    }));
  });
});
