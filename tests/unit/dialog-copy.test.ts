import { describe, expect, it } from 'vitest';
import { getDialogCopy } from '@/lib/i18n/dialog-copy';
import type { Language } from '@/types';

describe('dialog copy', () => {
  it.each(['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as Language[])('is complete in %s', (language) => {
    const copy = getDialogCopy(language);
    expect(copy.confirmTitle).not.toBe('');
    expect(copy.cancel).not.toBe('');
    expect(copy.typeToConfirm('DELETE FAMILY')).toContain('DELETE FAMILY');
  });
});
