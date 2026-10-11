import type { Language } from '@/types';
import type { AddonId } from '@/lib/billing/addon-catalog';
import type { SubscriptionPlan } from '@/types';
import { getPublicPricingCopy } from '@/lib/i18n/public-pricing-copy';

// Localized plan descriptions and titles
export const PLAN_LOCALIZATION: Record<
  string,
  Record<Language, { name: string; desc: string; period: string; badge?: string; cta: string }>
> = {
  solo_monthly: {
    vi: { name: 'Gói Cơ bản · Tháng', desc: 'Đầy đủ trải nghiệm cốt lõi cho một bé', period: '/ tháng', badge: 'Khởi đầu nhẹ nhàng', cta: 'Chọn Gói Cơ bản · Tháng' },
    en: { name: 'Basic plan · Monthly', desc: 'The complete core experience for one child', period: '/ month', badge: 'A gentle start', cta: 'Choose Basic plan · Monthly' },
    fr: { name: 'Forfait Essentiel · Mensuel', desc: 'L’expérience essentielle complète pour un enfant', period: '/ mois', badge: 'Pour bien commencer', cta: 'Choisir le forfait Essentiel · Mensuel' },
    de: { name: 'Basis-Paket · Monatlich', desc: 'Das vollständige Kernerlebnis für ein Kind', period: '/ Monat', badge: 'Sanfter Einstieg', cta: 'Basis-Paket · Monatlich wählen' },
    it: { name: 'Piano Base · Mensile', desc: 'L’esperienza essenziale completa per un bambino', period: '/ mese', badge: 'Un inizio leggero', cta: 'Scegli Piano Base · Mensile' },
    es: { name: 'Plan Básico · Mensual', desc: 'La experiencia esencial completa para un menor', period: '/ mes', badge: 'Un comienzo sencillo', cta: 'Elegir plan Básico · Mensual' },
    zh: { name: '基础套餐 · 月付', desc: '为一个孩子提供完整的核心体验', period: '/ 月', badge: '轻松起步', cta: '选择基础套餐 · 月付' },
    ja: { name: 'ベーシックプラン · 月額', desc: 'お子さま1人向けの基本機能をすべて利用できます', period: '/ 月', badge: 'やさしくスタート', cta: 'ベーシックプラン · 月額を選ぶ' },
    ko: { name: '베이직 플랜 · 월간', desc: '아이 한 명을 위한 모든 핵심 기능', period: '/ 월', badge: '가볍게 시작', cta: '베이직 플랜 · 월간 선택' },
  },
  solo_yearly: {
    vi: { name: 'Gói Cơ bản · Năm', desc: 'Cả năm đồng hành cùng một bé với giá tốt hơn trả từng tháng', period: '/ năm', badge: 'Tiết kiệm cho một bé', cta: 'Chọn Gói Cơ bản · Năm' },
    en: { name: 'Basic plan · Yearly', desc: 'A full year with one child at a better price than paying monthly', period: '/ year', badge: 'Savings for one child', cta: 'Choose Basic plan · Yearly' },
    fr: { name: 'Forfait Essentiel · Annuel', desc: 'Une année complète avec un enfant à un meilleur prix qu’un paiement mensuel', period: '/ an', badge: 'Économies pour un enfant', cta: 'Choisir le forfait Essentiel · Annuel' },
    de: { name: 'Basis-Paket · Jährlich', desc: 'Ein ganzes Jahr mit einem Kind zu einem besseren Preis als bei monatlicher Zahlung', period: '/ Jahr', badge: 'Ersparnis für ein Kind', cta: 'Basis-Paket · Jährlich wählen' },
    it: { name: 'Piano Base · Annuale', desc: 'Un anno intero con un bambino a un prezzo migliore rispetto al pagamento mensile', period: '/ anno', badge: 'Risparmio per un bambino', cta: 'Scegli Piano Base · Annuale' },
    es: { name: 'Plan Básico · Anual', desc: 'Un año completo con un menor a un precio mejor que pagando mes a mes', period: '/ año', badge: 'Ahorro para un menor', cta: 'Elegir plan Básico · Anual' },
    zh: { name: '基础套餐 · 年付', desc: '陪伴一个孩子一整年，比按月支付更划算', period: '/ 年', badge: '一个孩子更省钱', cta: '选择基础套餐 · 年付' },
    ja: { name: 'ベーシックプラン · 年額', desc: '月払いよりお得な料金で、お子さま1人と1年間利用できます', period: '/ 年', badge: 'お子さま1人ならお得', cta: 'ベーシックプラン · 年額を選ぶ' },
    ko: { name: '베이직 플랜 · 연간', desc: '월간 결제보다 저렴한 가격으로 아이 한 명과 1년 동안 함께할 수 있습니다', period: '/ 년', badge: '아이 한 명에게 더 알뜰하게', cta: '베이직 플랜 · 연간 선택' },
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
  pro_plus_monthly: {
    vi: { name: 'Gói Pro Plus · Tháng', desc: 'Mọi tính năng Pro cùng gợi ý AI không giới hạn, linh hoạt theo tháng', period: '/ tháng', badge: 'Có AI', cta: 'Chọn Gói Pro Plus · Tháng' },
    en: { name: 'Pro Plus plan · Monthly', desc: 'Everything in Pro plus unlimited AI suggestions, billed monthly', period: '/ month', badge: 'With AI', cta: 'Choose Pro Plus plan · Monthly' },
    fr: { name: 'Forfait Pro Plus · Mensuel', desc: 'Tout Pro, plus des suggestions IA illimitées, payé au mois', period: '/ mois', badge: 'Avec IA', cta: 'Choisir le forfait Pro Plus · Mensuel' },
    de: { name: 'Pro-Plus-Paket · Monatlich', desc: 'Alles aus Pro plus unbegrenzte KI-Vorschläge, monatlich bezahlt', period: '/ Monat', badge: 'Mit KI', cta: 'Pro-Plus-Paket · Monatlich wählen' },
    it: { name: 'Piano Pro Plus · Mensile', desc: 'Tutto Pro più suggerimenti IA illimitati, con pagamento mensile', period: '/ mese', badge: 'Con IA', cta: 'Scegli Piano Pro Plus · Mensile' },
    es: { name: 'Plan Pro Plus · Mensual', desc: 'Todo Pro más sugerencias de IA ilimitadas, con pago mensual', period: '/ mes', badge: 'Con IA', cta: 'Elegir plan Pro Plus · Mensual' },
    zh: { name: 'Pro Plus 套餐 · 月付', desc: '包含 Pro 全部功能及无限 AI 建议，按月付费', period: '/ 月', badge: '含 AI', cta: '选择 Pro Plus 套餐 · 月付' },
    ja: { name: 'Pro Plusプラン · 月額', desc: 'Proの全機能に無制限のAI提案をプラス。月ごとのお支払い', period: '/ 月', badge: 'AI付き', cta: 'Pro Plusプラン · 月額を選ぶ' },
    ko: { name: 'Pro Plus 플랜 · 월간', desc: 'Pro의 모든 기능에 무제한 AI 제안을 더한 월간 결제', period: '/ 월', badge: 'AI 포함', cta: 'Pro Plus 플랜 · 월간 선택' },
  },
  pro_plus_yearly: {
    vi: { name: 'Gói Pro Plus · Năm', desc: 'Mọi tính năng Pro cùng gợi ý AI không giới hạn, tiết kiệm hơn cho cả năm', period: '/ năm', badge: 'Có AI, tiết kiệm nhất', cta: 'Chọn Gói Pro Plus · Năm' },
    en: { name: 'Pro Plus plan · Yearly', desc: 'Everything in Pro plus unlimited AI suggestions, at a better price for the full year', period: '/ year', badge: 'AI, best savings', cta: 'Choose Pro Plus plan · Yearly' },
    fr: { name: 'Forfait Pro Plus · Annuel', desc: 'Tout Pro, plus des suggestions IA illimitées, à un meilleur prix sur l’année', period: '/ an', badge: 'IA, meilleure économie', cta: 'Choisir le forfait Pro Plus · Annuel' },
    de: { name: 'Pro-Plus-Paket · Jährlich', desc: 'Alles aus Pro plus unbegrenzte KI-Vorschläge, günstiger für das ganze Jahr', period: '/ Jahr', badge: 'KI, beste Ersparnis', cta: 'Pro-Plus-Paket · Jährlich wählen' },
    it: { name: 'Piano Pro Plus · Annuale', desc: 'Tutto Pro più suggerimenti IA illimitati, a un prezzo migliore per tutto l’anno', period: '/ anno', badge: 'IA, miglior risparmio', cta: 'Scegli Piano Pro Plus · Annuale' },
    es: { name: 'Plan Pro Plus · Anual', desc: 'Todo Pro más sugerencias de IA ilimitadas, a mejor precio durante todo el año', period: '/ año', badge: 'IA, mayor ahorro', cta: 'Elegir plan Pro Plus · Anual' },
    zh: { name: 'Pro Plus 套餐 · 年付', desc: '包含 Pro 全部功能及无限 AI 建议，全年更划算', period: '/ 年', badge: '含 AI，最省钱', cta: '选择 Pro Plus 套餐 · 年付' },
    ja: { name: 'Pro Plusプラン · 年額', desc: 'Proの全機能に無制限のAI提案をプラス。1年間をお得な料金で', period: '/ 年', badge: 'AI付きで最もお得', cta: 'Pro Plusプラン · 年額を選ぶ' },
    ko: { name: 'Pro Plus 플랜 · 연간', desc: 'Pro의 모든 기능에 무제한 AI 제안을 더해 1년을 더 알뜰하게', period: '/ 년', badge: 'AI 포함, 최고의 절약', cta: 'Pro Plus 플랜 · 연간 선택' },
  },
  ai_addon_monthly: {
    vi: { name: 'Add-on AI', desc: 'Gợi ý AI không giới hạn', period: '/ tháng', badge: 'Thêm AI', cta: 'Thêm Add-on AI' },
    en: { name: 'AI add-on', desc: 'Unlimited AI suggestions', period: '/ month', badge: 'Add AI', cta: 'Add the AI add-on' },
    fr: { name: 'Option IA', desc: 'Suggestions IA illimitées', period: '/ mois', badge: 'Ajouter l’IA', cta: 'Ajouter l’option IA' },
    de: { name: 'KI-Zusatz', desc: 'Unbegrenzte KI-Vorschläge', period: '/ Monat', badge: 'KI hinzufügen', cta: 'KI-Zusatz hinzufügen' },
    it: { name: 'Componente IA', desc: 'Suggerimenti IA illimitati', period: '/ mese', badge: 'Aggiungi IA', cta: 'Aggiungi il componente IA' },
    es: { name: 'Complemento de IA', desc: 'Sugerencias de IA ilimitadas', period: '/ mes', badge: 'Añadir IA', cta: 'Añadir el complemento de IA' },
    zh: { name: 'AI 附加包', desc: '无限 AI 建议', period: '/ 月', badge: '添加 AI', cta: '添加 AI 附加包' },
    ja: { name: 'AIアドオン', desc: '無制限のAI提案', period: '/ 月', badge: 'AIを追加', cta: 'AIアドオンを追加' },
    ko: { name: 'AI 애드온', desc: '무제한 AI 제안', period: '/ 월', badge: 'AI 추가', cta: 'AI 애드온 추가' },
  },
  printables: {
    vi: { name: 'Printable & Ebook', desc: 'Bộ Printable và Ebook, mua một lần dùng mãi', period: 'một lần', badge: 'Mua một lần', cta: 'Mua Printable & Ebook' },
    en: { name: 'Printable & Ebook', desc: 'The printable and ebook set, bought once and kept', period: 'one-time', badge: 'Buy once', cta: 'Buy Printable & Ebook' },
    fr: { name: 'Printable & Ebook', desc: 'Le pack imprimable et ebook, acheté une fois pour toujours', period: 'une fois', badge: 'Achat unique', cta: 'Acheter Printable & Ebook' },
    de: { name: 'Printable & Ebook', desc: 'Das Printable- und Ebook-Set, einmal kaufen und behalten', period: 'einmalig', badge: 'Einmal kaufen', cta: 'Printable & Ebook kaufen' },
    it: { name: 'Printable & Ebook', desc: 'Il set stampabile ed ebook, acquistato una volta e tuo per sempre', period: 'una tantum', badge: 'Acquisto unico', cta: 'Acquista Printable & Ebook' },
    es: { name: 'Printable & Ebook', desc: 'El paquete imprimible y ebook, comprado una vez y tuyo para siempre', period: 'pago único', badge: 'Compra única', cta: 'Comprar Printable & Ebook' },
    zh: { name: 'Printable & Ebook', desc: '可打印资料与电子书合集，一次购买永久拥有', period: '一次性', badge: '一次购买', cta: '购买 Printable & Ebook' },
    ja: { name: 'Printable & Ebook', desc: '印刷用素材と電子書籍のセット。1回の購入でずっと使えます', period: '1回払い', badge: '1回で購入', cta: 'Printable & Ebookを購入' },
    ko: { name: 'Printable & Ebook', desc: '인쇄용 자료와 전자책 세트를 한 번 구매해 계속 사용', period: '1회', badge: '한 번 구매', cta: 'Printable & Ebook 구매' },
  },
};

// Shared plan wording lives in public-pricing-copy; AI entitlements apply across checkout tiers.
const AI_UNLIMITED: Record<Language, string> = {
  vi: 'Gợi ý AI không giới hạn',
  en: 'Unlimited AI suggestions',
  fr: 'Suggestions IA illimitées',
  de: 'Unbegrenzte KI-Vorschläge',
  it: 'Suggerimenti IA illimitati',
  es: 'Sugerencias de IA ilimitadas',
  zh: '无限 AI 建议',
  ja: '無制限のAI提案',
  ko: '무제한 AI 제안',
};

const AI_STANDARD_MONTHLY: Record<Language, string> = {
  vi: 'Gợi ý AI 20 lượt/tháng',
  en: '20 AI suggestions per month',
  fr: '20 suggestions IA par mois',
  de: '20 KI-Vorschläge pro Monat',
  it: '20 suggerimenti IA al mese',
  es: '20 sugerencias de IA al mes',
  zh: '每月 20 次 AI 建议',
  ja: 'AIの提案を月20回',
  ko: 'AI 제안 월 20회',
};

const PRO_PLUS_YEARLY_SAVINGS: Record<Language, string> = {
  vi: 'Tiết kiệm 158.000đ (17%)',
  en: 'Save 158,000 VND (17%)',
  fr: 'Économisez 158 000 VND (17 %)',
  de: 'Sparen Sie 158.000 VND (17 %)',
  it: 'Risparmi 158.000 VND (17%)',
  es: 'Ahorra 158.000 VND (17 %)',
  zh: '节省 158,000 越南盾（17%）',
  ja: '158,000ドン（17%）お得',
  ko: '158,000동 절약(17%)',
};

const ADDON_EXTENDS_MONTH: Record<Language, string> = {
  vi: 'Mỗi lần thanh toán cộng thêm 1 tháng',
  en: 'Each payment adds one month',
  fr: 'Chaque paiement ajoute un mois',
  de: 'Jede Zahlung verlängert um einen Monat',
  it: 'Ogni pagamento aggiunge un mese',
  es: 'Cada pago añade un mes',
  zh: '每次付款增加 1 个月',
  ja: 'お支払いごとに1か月延長',
  ko: '결제할 때마다 1개월 추가',
};

const PAY_ONCE: Record<Language, string> = {
  vi: 'Thanh toán một lần, dùng vĩnh viễn',
  en: 'Pay once, keep it forever',
  fr: 'Un seul paiement, à vie',
  de: 'Einmal zahlen, dauerhaft nutzen',
  it: 'Un solo pagamento, per sempre',
  es: 'Un solo pago, para siempre',
  zh: '一次付款，永久使用',
  ja: '1回のお支払いでずっと利用可能',
  ko: '한 번 결제로 영구 이용',
};

export function getCheckoutPlanFeatures(planId: SubscriptionPlan | AddonId, language: Language): readonly string[] {
  const common = getPublicPricingCopy(language);
  switch (planId) {
    case 'solo_monthly': return [common.oneChild, common.sync, common.caregiverInvites, common.library, AI_STANDARD_MONTHLY[language]];
    case 'solo_yearly': return [common.oneChild, common.sync, common.caregiverInvites, common.library, AI_STANDARD_MONTHLY[language], common.soloSavings];
    case 'monthly': return [common.upToFive, common.sync, common.caregiverInvites, common.fullLibrary, AI_STANDARD_MONTHLY[language]];
    case 'yearly': return [common.upToFive, common.sync, common.caregiverInvites, common.fullLibrary, AI_STANDARD_MONTHLY[language], common.annualPayment, common.savings];
    case 'pro_plus_monthly': return [common.upToFive, common.sync, common.caregiverInvites, common.fullLibrary, AI_UNLIMITED[language]];
    case 'pro_plus_yearly': return [common.upToFive, common.sync, common.caregiverInvites, common.fullLibrary, AI_UNLIMITED[language], common.annualPayment, PRO_PLUS_YEARLY_SAVINGS[language]];
    case 'ai_addon_monthly': return [AI_UNLIMITED[language], ADDON_EXTENDS_MONTH[language]];
    case 'printables': return [PAY_ONCE[language]];
    default: return [];
  }
}
