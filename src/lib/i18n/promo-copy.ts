import type { Language } from '@/types';

export type PromoCopy = {
  readonly upsell: string;
  readonly b1g1: string;
};

const COPY: Record<Language, PromoCopy> = {
  vi: {
    upsell: 'Thêm 100.000đ để lên Pro Plus: AI không giới hạn. Còn {n}/200 suất.',
    b1g1: 'Mua 1 năm tặng 1 năm: 790.000đ cho 2 năm Pro Plus. Còn {n}/100 suất, đến hết 31/12/2026.',
  },
  en: {
    upsell: 'Add 100,000 VND to upgrade to Pro Plus: unlimited AI. {n}/200 spots left.',
    b1g1: 'Buy 1 year, get 1 free: 790,000 VND for 2 years of Pro Plus. {n}/100 spots left, through 31/12/2026.',
  },
  fr: {
    upsell: 'Ajoutez 100 000 VND pour passer à Pro Plus : IA illimitée. Il reste {n}/200 places.',
    b1g1: '1 an acheté, 1 an offert : 790 000 VND pour 2 ans de Pro Plus. Il reste {n}/100 places, jusqu’au 31/12/2026 inclus.',
  },
  de: {
    upsell: 'Für 100.000 VND mehr auf Pro Plus upgraden: unbegrenzte KI. Noch {n}/200 Plätze.',
    b1g1: '1 Jahr kaufen, 1 Jahr geschenkt: 790.000 VND für 2 Jahre Pro Plus. Noch {n}/100 Plätze, bis einschließlich 31.12.2026.',
  },
  it: {
    upsell: 'Aggiunga 100.000 VND per passare a Pro Plus: IA illimitata. Restano {n}/200 posti.',
    b1g1: 'Acquisti 1 anno, riceva 1 anno in regalo: 790.000 VND per 2 anni di Pro Plus. Restano {n}/100 posti, fino al 31/12/2026 incluso.',
  },
  es: {
    upsell: 'Añada 100.000 VND para pasar a Pro Plus: IA ilimitada. Quedan {n}/200 plazas.',
    b1g1: 'Compre 1 año y reciba 1 gratis: 790.000 VND por 2 años de Pro Plus. Quedan {n}/100 plazas, hasta el 31/12/2026 inclusive.',
  },
  zh: {
    upsell: '加付100,000 VND升级至Pro Plus：无限AI。还剩{n}/200个名额。',
    b1g1: '买1年送1年：790,000 VND享用2年Pro Plus。还剩{n}/100个名额，优惠截至2026年12月31日。',
  },
  ja: {
    upsell: '100,000 VND追加でPro Plusへアップグレード：無制限のAI。残り{n}/200枠。',
    b1g1: '1年購入で1年無料：790,000 VNDでPro Plusを2年間。残り{n}/100枠、2026年12月31日まで。',
  },
  ko: {
    upsell: '100,000 VND를 추가해 Pro Plus로 업그레이드: 무제한 AI. {n}/200자리 남음.',
    b1g1: '1년 구매 시 1년 무료: 790,000 VND로 Pro Plus 2년 이용. {n}/100자리 남음, 2026년 12월 31일까지.',
  },
};

export function getPromoCopy(language: Language): PromoCopy {
  return COPY[language] ?? COPY.en;
}
