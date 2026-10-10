import type { Language } from '@/types';

type ReferralDiscountLine = (discount: string, name: string) => string;

const COPY: Record<Language, { line: ReferralDiscountLine; fallback: string }> = {
  vi: { line: (discount, name) => `Ba/mẹ được giảm ${discount} thông qua giới thiệu của ${name}.`, fallback: 'một phụ huynh khác' },
  en: { line: (discount, name) => `You save ${discount} thanks to a referral from ${name}.`, fallback: 'another parent' },
  fr: { line: (discount, name) => `Vous économisez ${discount} grâce au parrainage de ${name}.`, fallback: 'un autre parent' },
  de: { line: (discount, name) => `Du sparst ${discount} dank der Empfehlung von ${name}.`, fallback: 'einem anderen Elternteil' },
  it: { line: (discount, name) => `Risparmi ${discount} grazie all'invito di ${name}.`, fallback: 'un altro genitore' },
  es: { line: (discount, name) => `Ahorras ${discount} gracias a la recomendación de ${name}.`, fallback: 'otro padre o madre' },
  zh: { line: (discount, name) => `通过${name}的推荐，您可节省 ${discount}。`, fallback: '另一位家长' },
  ja: { line: (discount, name) => `${name}さんの紹介で ${discount} お得になります。`, fallback: '別の保護者' },
  ko: { line: (discount, name) => `${name}님의 추천으로 ${discount} 할인받으셨어요.`, fallback: '다른 보호자' },
};

export function referralDiscountLine(language: Language, discount: string, referrerName: string | null): string {
  const copy = COPY[language] ?? COPY.en;
  return copy.line(discount, referrerName?.trim() || copy.fallback);
}
