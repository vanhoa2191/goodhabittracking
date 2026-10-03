import type { Language } from '@/types';

type ReferralDiscountLine = (percent: number, listPrice: string) => string;

const COPY: Record<Language, ReferralDiscountLine> = {
  vi: (percent, listPrice) => `Đã giảm ${percent}% nhờ mã giới thiệu (giá gốc ${listPrice}).`,
  en: (percent, listPrice) => `${percent}% off with your referral code (list price ${listPrice}).`,
  fr: (percent, listPrice) => `${percent} % de réduction avec votre code de parrainage (prix catalogue : ${listPrice}).`,
  de: (percent, listPrice) => `${percent} % Rabatt mit deinem Empfehlungscode (Listenpreis ${listPrice}).`,
  it: (percent, listPrice) => `${percent}% di sconto con il tuo codice invito (prezzo di listino ${listPrice}).`,
  es: (percent, listPrice) => `${percent}% de descuento con tu código de referido (precio de lista ${listPrice}).`,
  zh: (percent, listPrice) => `使用推荐码可享 ${percent}% 折扣（原价 ${listPrice}）。`,
  ja: (percent, listPrice) => `紹介コードで${percent}%割引（通常価格 ${listPrice}）。`,
  ko: (percent, listPrice) => `추천 코드로 ${percent}% 할인(정가 ${listPrice}).`,
};

export function referralDiscountLine(language: Language, percent: number, listPrice: string): string {
  return (COPY[language] ?? COPY.en)(percent, listPrice);
}
