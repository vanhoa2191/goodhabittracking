import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  localeForLanguage,
} from '@/lib/i18n/formatters';

describe('i18n formatters', () => {
  it('maps every supported language to a stable locale', () => {
    expect(localeForLanguage('vi')).toBe('vi-VN');
    expect(localeForLanguage('ja')).toBe('ja-JP');
    expect(localeForLanguage('ko')).toBe('ko-KR');
  });

  it('formats prices for the Vietnamese market without manual separators', () => {
    expect(formatCurrency(29000, 'vi')).toContain('29.000');
    expect(formatCurrency(29000, 'en', 'UNAVAILABLE')).toContain('VND');
  });

  it('formats counts and dates using the selected locale', () => {
    expect(formatNumber(1234567, 'vi')).toContain('1.234.567');
    expect(formatDate('2026-09-28T00:00:00.000Z', 'vi')).toContain('2026');
    expect(formatDateTime('2026-09-28T00:00:00.000Z', 'en')).toContain('2026');
  });
});
