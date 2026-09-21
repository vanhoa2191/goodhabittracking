import { describe, expect, it } from 'vitest';
import { resolveThemeChoice } from '@/lib/appearance-context';

describe('appearance preference', () => {
  it('defaults a new visitor to light even when the OS is dark', () => {
    expect(resolveThemeChoice(null, true)).toEqual({ choice: 'light', resolved: 'light' });
  });

  it('resolves the explicit system choice from the media query', () => {
    expect(resolveThemeChoice('system', true).resolved).toBe('dark');
    expect(resolveThemeChoice('system', false).resolved).toBe('light');
  });

  it('falls back to light for an invalid saved choice', () => {
    expect(resolveThemeChoice('midnight', true)).toEqual({ choice: 'light', resolved: 'light' });
  });
});
