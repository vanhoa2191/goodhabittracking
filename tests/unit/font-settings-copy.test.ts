import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getFontSettingsCopy } from '@/lib/i18n/font-settings-copy';

describe('font-settings-copy', () => {
  const locales: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

  it('exposes 4 font options and 3 size options for every locale', () => {
    for (const locale of locales) {
      const copy = getFontSettingsCopy(locale);
      expect(copy.fontOptions).toHaveLength(4);
      expect(copy.sizeOptions).toHaveLength(3);
      expect(copy.fontOptions.map((o) => o.id)).toEqual(['rounded', 'modern', 'playful', 'serif']);
      expect(copy.sizeOptions.map((o) => o.id)).toEqual(['normal', 'large', 'xlarge']);
    }
  });

  it('keeps full Vietnamese option copy intact', () => {
    const vi = getFontSettingsCopy('vi');
    expect(vi.fontOptions[0].name).toContain('Phông Rõ Ràng Thân Thiện');
    expect(vi.fontOptions[0].preview).toContain('Rõ ràng, ấm áp và dễ đọc');
    expect(vi.fontOptions[3].name).toContain('Phông Cổ Điển Nhã Nhặn');
    expect(vi.fontOptions[3].preview).toContain('Ấm áp, mộc mạc, truyền cảm');
    expect(vi.sizeOptions[0].label).toBe('Vừa vặn');
    expect(vi.sizeOptions[1].label).toBe('Lớn hơn một tí');
    expect(vi.sizeOptions[2].label).toBe('Chữ to rõ ràng');
  });

  it('does not leak Vietnamese font names into non-VI locales', () => {
    const viNames = getFontSettingsCopy('vi').fontOptions.map((o) => o.name);
    for (const locale of locales.filter((l) => l !== 'vi')) {
      const copy = getFontSettingsCopy(locale);
      for (const option of copy.fontOptions) {
        for (const viName of viNames) expect(option.name).not.toBe(viName);
      }
    }
  });

  it('falls back to Vietnamese for an unknown locale', () => {
    const copy = getFontSettingsCopy('xx' as unknown as Language);
    expect(copy).toEqual(getFontSettingsCopy('vi'));
  });
});
