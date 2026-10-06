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
    fr: { name: 'One-child plan · Monthly', desc: 'L’expérience essentielle complète pour un enfant', period: '/ mois', badge: 'Pour bien commencer', cta: 'Choose One-child plan · Monthly' },
    de: { name: 'One-child plan · Monthly', desc: 'Das vollständige Kernerlebnis für ein Kind', period: '/ Monat', badge: 'Sanfter Einstieg', cta: 'Choose One-child plan · Monthly' },
    it: { name: 'One-child plan · Monthly', desc: 'L’esperienza essenziale completa per un bambino', period: '/ mese', badge: 'Un inizio leggero', cta: 'Choose One-child plan · Monthly' },
    es: { name: 'One-child plan · Monthly', desc: 'La experiencia esencial completa para un niño', period: '/ mes', badge: 'Un comienzo sencillo', cta: 'Choose One-child plan · Monthly' },
    zh: { name: 'One-child plan · Monthly', desc: '为一个孩子提供完整的核心体验', period: '/ 月', badge: '轻松起步', cta: 'Choose One-child plan · Monthly' },
    ja: { name: 'One-child plan · Monthly', desc: 'お子さま1人向けの基本機能をすべて利用できます', period: '/ 月', badge: 'やさしくスタート', cta: 'Choose One-child plan · Monthly' },
    ko: { name: 'One-child plan · Monthly', desc: '아이 한 명을 위한 모든 핵심 기능', period: '/ 월', badge: '가볍게 시작', cta: 'Choose One-child plan · Monthly' },
  },
  solo_yearly: {
    vi: { name: 'Gói 1 bé · Năm', desc: 'Cả năm đồng hành cùng một bé với giá tốt hơn trả từng tháng', period: '/ năm', badge: 'Tiết kiệm cho một bé', cta: 'Chọn Gói 1 bé · Năm' },
    en: { name: 'One-child plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ year', badge: 'Savings for one child', cta: 'Choose One-child plan · Yearly' },
    fr: { name: 'One-child plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ an', badge: 'Savings for one child', cta: 'Choose One-child plan · Yearly' },
    de: { name: 'One-child plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ Jahr', badge: 'Savings for one child', cta: 'Choose One-child plan · Yearly' },
    it: { name: 'One-child plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ anno', badge: 'Savings for one child', cta: 'Choose One-child plan · Yearly' },
    es: { name: 'One-child plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ año', badge: 'Savings for one child', cta: 'Choose One-child plan · Yearly' },
    zh: { name: 'One-child plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ 年', badge: 'Savings for one child', cta: 'Choose One-child plan · Yearly' },
    ja: { name: 'One-child plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ 年', badge: 'Savings for one child', cta: 'Choose One-child plan · Yearly' },
    ko: { name: 'One-child plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ 년', badge: 'Savings for one child', cta: 'Choose One-child plan · Yearly' },
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
      name: 'Pro plan · Monthly',
      desc: 'L’expérience complète pour toute la famille, payée au mois',
      period: '/ mois',
      badge: 'Le plus populaire',
      cta: 'Choose Pro plan · Monthly',
    },
    de: {
      name: 'Pro plan · Monthly',
      desc: 'Das vollständige Familienerlebnis mit flexibler Monatszahlung',
      period: '/ Monat',
      badge: 'Am beliebtesten',
      cta: 'Choose Pro plan · Monthly',
    },
    it: {
      name: 'Pro plan · Monthly',
      desc: 'L’esperienza completa per la famiglia con pagamento mensile',
      period: '/ mese',
      badge: 'Più popolare',
      cta: 'Choose Pro plan · Monthly',
    },
    es: {
      name: 'Pro plan · Monthly',
      desc: 'La experiencia completa para la familia con pago mensual',
      period: '/ mes',
      badge: 'Más popular',
      cta: 'Choose Pro plan · Monthly',
    },
    zh: {
      name: 'Pro plan · Monthly',
      desc: '全家完整体验，按月灵活付费',
      period: '/ 月',
      badge: '最受欢迎',
      cta: 'Choose Pro plan · Monthly',
    },
    ja: {
      name: 'Pro plan · Monthly',
      desc: '家族全員で使える基本機能を月ごとに利用',
      period: '/ 月',
      badge: '一番人気',
      cta: 'Choose Pro plan · Monthly',
    },
    ko: {
      name: 'Pro plan · Monthly',
      desc: '온 가족을 위한 전체 기능과 유연한 월간 결제',
      period: '/ 월',
      badge: '가장 인기',
      cta: 'Choose Pro plan · Monthly',
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
      name: 'Pro plan · Yearly',
      desc: 'Le meilleur tarif pour toute la famille pendant un an',
      period: '/ an',
      badge: 'Meilleure économie',
      cta: 'Choose Pro plan · Yearly',
    },
    de: {
      name: 'Pro plan · Yearly',
      desc: 'Der beste Preis für ein ganzes Jahr mit der Familie',
      period: '/ Jahr',
      badge: 'Beste Ersparnis',
      cta: 'Choose Pro plan · Yearly',
    },
    it: {
      name: 'Pro plan · Yearly',
      desc: 'Il miglior valore per un anno intero con la famiglia',
      period: '/ anno',
      badge: 'Miglior risparmio',
      cta: 'Choose Pro plan · Yearly',
    },
    es: {
      name: 'Pro plan · Yearly',
      desc: 'La mejor relación calidad-precio para todo un año en familia',
      period: '/ año',
      badge: 'Mayor ahorro',
      cta: 'Choose Pro plan · Yearly',
    },
    zh: {
      name: 'Pro plan · Yearly',
      desc: '全家使用一整年的最优价格',
      period: '/ 年',
      badge: '最省钱',
      cta: 'Choose Pro plan · Yearly',
    },
    ja: {
      name: 'Pro plan · Yearly',
      desc: '家族全員で1年間使える最もお得なプラン',
      period: '/ 年',
      badge: '最もお得',
      cta: 'Choose Pro plan · Yearly',
    },
    ko: {
      name: 'Pro plan · Yearly',
      desc: '온 가족이 1년 동안 사용하는 가장 경제적인 플랜',
      period: '/ 년',
      badge: '최고의 절약',
      cta: 'Choose Pro plan · Yearly',
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
