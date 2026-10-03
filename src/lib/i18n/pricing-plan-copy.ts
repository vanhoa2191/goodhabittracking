import type { Language } from '@/types';
import type { SubscriptionPlan } from '@/types';
import { getPublicPricingCopy } from '@/lib/i18n/public-pricing-copy';

// Localized plan descriptions and titles
export const PLAN_LOCALIZATION: Record<
  string,
  Record<Language, { name: string; desc: string; period: string; badge?: string; cta: string }>
> = {
  solo_monthly: {
    vi: { name: 'Gói Một Bé', desc: 'Đầy đủ trải nghiệm cốt lõi cho một bé', period: '/ tháng', badge: 'Khởi đầu nhẹ nhàng', cta: 'Chọn Gói Một Bé' },
    en: { name: 'One Child Plan', desc: 'The complete core experience for one child', period: '/ month', badge: 'A gentle start', cta: 'Choose One Child' },
    fr: { name: 'Forfait Un Enfant', desc: 'L’expérience essentielle complète pour un enfant', period: '/ mois', badge: 'Pour bien commencer', cta: 'Choisir Un Enfant' },
    de: { name: 'Ein-Kind-Paket', desc: 'Das vollständige Kernerlebnis für ein Kind', period: '/ Monat', badge: 'Sanfter Einstieg', cta: 'Ein-Kind-Paket wählen' },
    it: { name: 'Piano Un Bambino', desc: 'L’esperienza essenziale completa per un bambino', period: '/ mese', badge: 'Un inizio leggero', cta: 'Scegli Un Bambino' },
    es: { name: 'Plan Un Niño', desc: 'La experiencia esencial completa para un niño', period: '/ mes', badge: 'Un comienzo sencillo', cta: 'Elegir Un Niño' },
    zh: { name: '单宝贝套餐', desc: '为一个孩子提供完整的核心体验', period: '/ 月', badge: '轻松起步', cta: '选择单宝贝套餐' },
    ja: { name: 'お子さま1人プラン', desc: 'お子さま1人向けの基本機能をすべて利用できます', period: '/ 月', badge: 'やさしくスタート', cta: '1人プランを選ぶ' },
    ko: { name: '아이 한 명 플랜', desc: '아이 한 명을 위한 모든 핵심 기능', period: '/ 월', badge: '가볍게 시작', cta: '아이 한 명 플랜 선택' },
  },
  monthly: {
    vi: {
      name: 'Gói Gia Đình · Tháng',
      desc: 'Đầy đủ cho cả gia đình, linh hoạt theo tháng',
      period: '/ tháng',
      badge: 'Phổ biến nhất',
      cta: 'Chọn Gói Gia Đình · Tháng',
    },
    en: {
      name: 'Family · Monthly',
      desc: 'The complete family experience with flexible monthly billing',
      period: '/ month',
      badge: 'Most popular',
      cta: 'Choose Family · Monthly',
    },
    fr: {
      name: 'Famille · Mensuel',
      desc: 'L’expérience complète pour toute la famille, payée au mois',
      period: '/ mois',
      badge: 'Le plus populaire',
      cta: 'Choisir Famille · Mensuel',
    },
    de: {
      name: 'Familie · Monatlich',
      desc: 'Das vollständige Familienerlebnis mit flexibler Monatszahlung',
      period: '/ Monat',
      badge: 'Am beliebtesten',
      cta: 'Familie · Monatlich wählen',
    },
    it: {
      name: 'Famiglia · Mensile',
      desc: 'L’esperienza completa per la famiglia con pagamento mensile',
      period: '/ mese',
      badge: 'Più popolare',
      cta: 'Scegli Famiglia · Mensile',
    },
    es: {
      name: 'Familia · Mensual',
      desc: 'La experiencia completa para la familia con pago mensual',
      period: '/ mes',
      badge: 'Más popular',
      cta: 'Elegir Familia · Mensual',
    },
    zh: {
      name: '家庭 · 月付',
      desc: '全家完整体验，按月灵活付费',
      period: '/ 月',
      badge: '最受欢迎',
      cta: '选择家庭月付',
    },
    ja: {
      name: 'ファミリー · 月額',
      desc: '家族全員で使える基本機能を月ごとに利用',
      period: '/ 月',
      badge: '一番人気',
      cta: 'ファミリー月額を選ぶ',
    },
    ko: {
      name: '가족 · 월간',
      desc: '온 가족을 위한 전체 기능과 유연한 월간 결제',
      period: '/ 월',
      badge: '가장 인기',
      cta: '가족 월간 선택',
    },
  },
  yearly: {
    vi: {
      name: 'Gói Gia Đình · Năm',
      desc: 'Tối ưu chi phí cho cả năm đồng hành',
      period: '/ năm',
      badge: 'Tiết kiệm nhất',
      cta: 'Chọn Gói Gia Đình · Năm',
    },
    en: {
      name: 'Family · Yearly',
      desc: 'The best value for a full year with the whole family',
      period: '/ year',
      badge: 'Best savings',
      cta: 'Choose Family · Yearly',
    },
    fr: {
      name: 'Famille · Annuel',
      desc: 'Le meilleur tarif pour toute la famille pendant un an',
      period: '/ an',
      badge: 'Meilleure économie',
      cta: 'Choisir Famille · Annuel',
    },
    de: {
      name: 'Familie · Jährlich',
      desc: 'Der beste Preis für ein ganzes Jahr mit der Familie',
      period: '/ Jahr',
      badge: 'Beste Ersparnis',
      cta: 'Familie · Jährlich wählen',
    },
    it: {
      name: 'Famiglia · Annuale',
      desc: 'Il miglior valore per un anno intero con la famiglia',
      period: '/ anno',
      badge: 'Miglior risparmio',
      cta: 'Scegli Famiglia · Annuale',
    },
    es: {
      name: 'Familia · Anual',
      desc: 'La mejor relación calidad-precio para todo un año en familia',
      period: '/ año',
      badge: 'Mayor ahorro',
      cta: 'Elegir Familia · Anual',
    },
    zh: {
      name: '家庭 · 年付',
      desc: '全家使用一整年的最优价格',
      period: '/ 年',
      badge: '最省钱',
      cta: '选择家庭年付',
    },
    ja: {
      name: 'ファミリー · 年額',
      desc: '家族全員で1年間使える最もお得なプラン',
      period: '/ 年',
      badge: '最もお得',
      cta: 'ファミリー年額を選ぶ',
    },
    ko: {
      name: '가족 · 연간',
      desc: '온 가족이 1년 동안 사용하는 가장 경제적인 플랜',
      period: '/ 년',
      badge: '최고의 절약',
      cta: '가족 연간 선택',
    },
  },
};

const CHECKOUT_FEATURES: Record<Language, { weekly: string; ebook: string; tournament: string }> = {
  vi: { weekly: 'Báo cáo phân tích chuyên sâu hàng tuần', ebook: 'Tặng Ebook: Cẩm nang nuôi dạy con & 7 Bố thí', tournament: 'Quyền ưu tiên tham gia giải đấu mùa hè' },
  en: { weekly: 'Detailed weekly analytics reports', ebook: 'Gift ebook: Parenting guide & 7 acts of giving', tournament: 'Priority entry to summer tournaments' },
  fr: { weekly: 'Rapports d’analyse détaillés chaque semaine', ebook: 'Ebook offert : guide parental et 7 actes de générosité', tournament: 'Accès prioritaire aux tournois d’été' },
  de: { weekly: 'Ausführliche wöchentliche Analyseberichte', ebook: 'E-Book als Geschenk: Erziehungsratgeber und 7 Arten des Gebens', tournament: 'Bevorzugte Teilnahme an Sommerturnieren' },
  it: { weekly: 'Rapporti di analisi dettagliati ogni settimana', ebook: 'Ebook in regalo: guida per genitori e 7 atti di generosità', tournament: 'Accesso prioritario ai tornei estivi' },
  es: { weekly: 'Informes de análisis detallados cada semana', ebook: 'Ebook de regalo: guía para padres y 7 actos de generosidad', tournament: 'Acceso prioritario a torneos de verano' },
  zh: { weekly: '每周详细分析报告', ebook: '赠送电子书：育儿指南与七种布施', tournament: '优先参加夏季竞赛' },
  ja: { weekly: '毎週の詳しい分析レポート', ebook: '電子書籍プレゼント：子育てガイドと7つの施し', tournament: '夏の大会への優先参加' },
  ko: { weekly: '매주 상세 분석 보고서', ebook: '전자책 증정: 육아 안내서와 7가지 나눔', tournament: '여름 대회 우선 참가' },
};

export function getCheckoutPlanFeatures(planId: SubscriptionPlan, language: Language): readonly string[] {
  const common = getPublicPricingCopy(language);
  const extra = CHECKOUT_FEATURES[language];
  switch (planId) {
    case 'solo_monthly': return [common.oneChild, common.sync, common.library];
    case 'monthly': return [common.unlimited, common.sync, common.fullLibrary, extra.weekly];
    case 'yearly': return [common.familyBenefits, common.unlimited, extra.ebook, extra.tournament];
    default: return [];
  }
}
