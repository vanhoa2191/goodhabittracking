import type { Language } from '@/types';

// Kept apart from the referral programme copy so the checkout does not carry all of it in the first download.
export function referralDiscountLine(language: Language, percent: number, listPrice: string): string {
  return language === 'vi'
    ? `Đã giảm ${percent}% nhờ mã giới thiệu (giá gốc ${listPrice}).`
    : `${percent}% off with your referral code (list price ${listPrice}).`;
}
