import { describe, expect, it } from 'vitest';
import { hasPairLink, shouldOpenChildBlock } from '@/lib/app-entry-disclosure';
import { appEntryCopy } from '@/lib/i18n/app-entry-copy';
import type { Language } from '@/types';

const LANGUAGES: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

describe('entry gate child block', () => {
  it('detects a pairing link in the address', () => {
    expect(hasPairLink('?pair=abc')).toBe(true);
    expect(hasPairLink('?ref=x&pair=')).toBe(true);
    expect(hasPairLink('?ref=x')).toBe(false);
    expect(hasPairLink('')).toBe(false);
  });

  it('starts closed for a new visitor and open for someone already pairing a device', () => {
    expect(shouldOpenChildBlock({ pairingOpen: false, search: '' })).toBe(false);
    expect(shouldOpenChildBlock({ pairingOpen: true, search: '' })).toBe(true);
    expect(shouldOpenChildBlock({ pairingOpen: false, search: `?pair=${'a'.repeat(48)}` })).toBe(true);
  });
});

describe('entry gate copy', () => {
  it('has every string in all nine languages', () => {
    const keys = Object.keys(appEntryCopy.vi).sort();
    for (const language of LANGUAGES) {
      const copy = appEntryCopy[language];
      expect(Object.keys(copy).sort(), language).toEqual(keys);
      for (const value of Object.values(copy)) expect(value.trim().length, language).toBeGreaterThan(0);
    }
  });
});
