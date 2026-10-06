import type { Language } from '@/types';
import type { SubscriptionPlan } from '@/types';
import { getPublicPricingCopy } from '@/lib/i18n/public-pricing-copy';

// Localized plan descriptions and titles
export const PLAN_LOCALIZATION: Record<
  string,
  Record<Language, { name: string; desc: string; period: string; badge?: string; cta: string }>
> = {
  solo_monthly: {
    vi: { name: 'Gói 1 bé · Tháng', desc: 'Đầy đủ trải nghiệm cốt lõi cho một bé', period: '/ tháng', badge: 'Khởi đầu nhẹ nhàng', cta: 'Chọn Gói 1 bé · Tháng' },
    en: { name: 'One-child plan · Monthly', desc: 'The complete core experience for one child', period: '/ month', badge: 'A gentle start', cta: 'Choose One-child plan · Monthly' },
    fr: { name: 'Forfait un enfant · Mensuel', desc: 'L’expérience essentielle complète pour un enfant', period: '/ mois', badge: 'Pour bien commencer', cta: 'Choisir le forfait un enfant · Mensuel' },
    de: { name: 'Ein-Kind-Paket · Monatlich', desc: 'Das vollständige Kernerlebnis für ein Kind', period: '/ Monat', badge: 'Sanfter Einstieg', cta: 'Ein-Kind-Paket · Monatlich wählen' },
    it: { name: 'Piano un bambino · Mensile', desc: 'L’esperienza essenziale completa per un bambino', period: '/ mese', badge: 'Un inizio leggero', cta: 'Scegli Piano un bambino · Mensile' },
    es: { name: 'Plan para un menor · Mensual', desc: 'La experiencia esencial completa para un menor', period: '/ mes', badge: 'Un comienzo sencillo', cta: 'Elegir plan para un menor · Mensual' },
    zh: { name: '单宝贝套餐 · 月付', desc: '为一个孩子提供完整的核心体验', period: '/ 月', badge: '轻松起步', cta: '选择单宝贝套餐 · 月付' },
    ja: { name: 'お子さま1人プラン · 月額', desc: 'お子さま1人向けの基本機能をすべて利用できます', period: '/ 月', badge: 'やさしくスタート', cta: 'お子さま1人プラン · 月額を選ぶ' },
    ko: { name: '아이 한 명 플랜 · 월간', desc: '아이 한 명을 위한 모든 핵심 기능', period: '/ 월', badge: '가볍게 시작', cta: '아이 한 명 플랜 · 월간 선택' },
  },
  solo_yearly: {
    vi: { name: 'Gói 1 bé · Năm', desc: 'Cả năm đồng hành cùng một bé với giá tốt hơn trả từng tháng', period: '/ năm', badge: 'Tiết kiệm cho một bé', cta: 'Chọn Gói 1 bé · Năm' },
    en: { name: 'One-child plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ year', badge: 'Savings for one child', cta: 'Choose One-child plan · Yearly' },
    fr: { name: 'Forfait un enfant · Annuel', desc: 'Une année complète avec un enfant à un meilleur prix qu’un paiement mensuel', period: '/ an', badge: 'Économies pour un enfant', cta: 'Choisir le forfait un enfant · Annuel' },
    de: { name: 'Ein-Kind-Paket · Jährlich', desc: 'Ein ganzes Jahr mit einem Kind zu einem besseren Preis als bei monatlicher Zahlung', period: '/ Jahr', badge: 'Ersparnis für ein Kind', cta: 'Ein-Kind-Paket · Jährlich wählen' },
    it: { name: 'Piano un bambino · Annuale', desc: 'Un anno intero con un bambino a un prezzo migliore rispetto al pagamento mensile', period: '/ anno', badge: 'Risparmio per un bambino', cta: 'Scegli Piano un bambino · Annuale' },
    es: { name: 'Plan para un menor · Anual', desc: 'Un año completo con un menor a un precio mejor que pagando mes a mes', period: '/ año', badge: 'Ahorro para un menor', cta: 'Elegir plan para un menor · Anual' },
    zh: { name: '单宝贝套餐 · 年付', desc: '陪伴一个孩子一整年，比按月支付更划算', period: '/ 年', badge: '一个孩子更省钱', cta: '选择单宝贝套餐 · 年付' },
    ja: { name: 'お子さま1人プラン · 年額', desc: '月払いよりお得な料金で、お子さま1人と1年間利用できます', period: '/ 年', badge: 'お子さま1人ならお得', cta: 'お子さま1人プラン · 年額を選ぶ' },
    ko: { name: '아이 한 명 플랜 · 연간', desc: '월간 결제보다 저렴한 가격으로 아이 한 명과 1년 동안 함께할 수 있습니다', period: '/ 년', badge: '아이 한 명에게 더 알뜰하게', cta: '아이 한 명 플랜 · 연간 선택' },
  },
  monthly: {
    vi: {
      name: 'Gói Pro · Tháng',
      desc: 'Đầy đủ cho cả gia đình, linh hoạt theo tháng',
      period: '/ tháng',
      badge: 'Phổ biến nhất',
      cta: 'Chọn Gói Pro · Tháng',
    },
    en: {
      name: 'Pro plan · Monthly',
      desc: 'The complete family experience with flexible monthly billing',
      period: '/ month',
      badge: 'Most popular',
      cta: 'Choose Pro plan · Monthly',
    },
    fr: {
      name: 'Forfait Pro · Mensuel',
      desc: 'L’expérience complète pour toute la famille, payée au mois',
      period: '/ mois',
      badge: 'Le plus populaire',
      cta: 'Choisir le forfait Pro · Mensuel',
    },
    de: {
      name: 'Pro-Paket · Monatlich',
      desc: 'Das vollständige Familienerlebnis mit flexibler Monatszahlung',
      period: '/ Monat',
      badge: 'Am beliebtesten',
      cta: 'Pro-Paket · Monatlich wählen',
    },
    it: {
      name: 'Piano Pro · Mensile',
      desc: 'L’esperienza completa per la famiglia con pagamento mensile',
      period: '/ mese',
      badge: 'Più popolare',
      cta: 'Scegli Piano Pro · Mensile',
    },
    es: {
      name: 'Plan Pro · Mensual',
      desc: 'La experiencia completa para la familia con pago mensual',
      period: '/ mes',
      badge: 'Más popular',
      cta: 'Elegir plan Pro · Mensual',
    },
    zh: {
      name: 'Pro 套餐 · 月付',
      desc: '全家完整体验，按月灵活付费',
      period: '/ 月',
      badge: '最受欢迎',
      cta: '选择 Pro 套餐 · 月付',
    },
    ja: {
      name: 'Proプラン · 月額',
      desc: '家族全員で使える基本機能を月ごとに利用',
      period: '/ 月',
      badge: '一番人気',
      cta: 'Proプラン · 月額を選ぶ',
    },
    ko: {
      name: 'Pro 플랜 · 월간',
      desc: '온 가족을 위한 전체 기능과 유연한 월간 결제',
      period: '/ 월',
      badge: '가장 인기',
      cta: 'Pro 플랜 · 월간 선택',
    },
  },
  yearly: {
    vi: {
      name: 'Gói Pro · Năm',
      desc: 'Tối ưu chi phí cho cả năm đồng hành',
      period: '/ năm',
      badge: 'Tiết kiệm nhất',
      cta: 'Chọn Gói Pro · Năm',
    },
    en: {
      name: 'Pro plan · Yearly',
      desc: 'The best value for a full year with the whole family',
      period: '/ year',
      badge: 'Best savings',
      cta: 'Choose Pro plan · Yearly',
    },
    fr: {
      name: 'Forfait Pro · Annuel',
      desc: 'Le meilleur tarif pour toute la famille pendant un an',
      period: '/ an',
      badge: 'Meilleure économie',
      cta: 'Choisir le forfait Pro · Annuel',
    },
    de: {
      name: 'Pro-Paket · Jährlich',
      desc: 'Der beste Preis für ein ganzes Jahr mit der Familie',
      period: '/ Jahr',
      badge: 'Beste Ersparnis',
      cta: 'Pro-Paket · Jährlich wählen',
    },
    it: {
      name: 'Piano Pro · Annuale',
      desc: 'Il miglior valore per un anno intero con la famiglia',
      period: '/ anno',
      badge: 'Miglior risparmio',
      cta: 'Scegli Piano Pro · Annuale',
    },
    es: {
      name: 'Plan Pro · Anual',
      desc: 'La mejor relación calidad-precio para todo un año en familia',
      period: '/ año',
      badge: 'Mayor ahorro',
      cta: 'Elegir plan Pro · Anual',
    },
    zh: {
      name: 'Pro 套餐 · 年付',
      desc: '全家使用一整年的最优价格',
      period: '/ 年',
      badge: '最省钱',
      cta: '选择 Pro 套餐 · 年付',
    },
    ja: {
      name: 'Proプラン · 年額',
      desc: '家族全員で1年間使える最もお得なプラン',
      period: '/ 年',
      badge: '最もお得',
      cta: 'Proプラン · 年額を選ぶ',
    },
    ko: {
      name: 'Pro 플랜 · 연간',
      desc: '온 가족이 1년 동안 사용하는 가장 경제적인 플랜',
      period: '/ 년',
      badge: '최고의 절약',
      cta: 'Pro 플랜 · 연간 선택',
    },
  },
};

export function getCheckoutPlanFeatures(planId: SubscriptionPlan, language: Language): readonly string[] {
  const common = getPublicPricingCopy(language);
  switch (planId) {
    case 'solo_monthly': return [common.oneChild, common.sync, common.library];
    case 'solo_yearly': return [common.oneChild, common.sync, common.library, common.soloSavings];
    case 'monthly': return [common.upToFive, common.sync, common.fullLibrary];
    case 'yearly': return [common.upToFive, common.sync, common.fullLibrary, common.annualPayment, common.savings];
    default: return [];
  }
}
