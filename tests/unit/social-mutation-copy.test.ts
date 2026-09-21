import { describe, expect, it } from 'vitest';
import { getSocialMutationCopy } from '@/lib/i18n/social-mutation-copy';
import type { Language } from '@/types';

const languages: readonly Language[] = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'it', 'es'];

describe('social mutation copy', () => {
  it('provides a localized current-child badge in every supported language', () => {
    const labels = languages.map((language) => getSocialMutationCopy(language).currentChildBadge);

    expect(labels.every((label) => label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBeGreaterThan(1);
  });
});
