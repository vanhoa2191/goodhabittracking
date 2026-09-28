import type { Language } from '@/types';

export const PRICING_SECTION_COPY: Record<Language, {
  title: string;
  description: string;
  trial: string;
  action: string;
}> = {
  vi: { title: 'Chọn gói phù hợp với gia đình', description: 'Dùng thử 7 ngày trước khi quyết định. Không cần thẻ tín dụng và không tự động trừ tiền.', trial: '7 ngày trải nghiệm đầy đủ', action: 'Xem quyền lợi và thanh toán' },
  en: { title: 'Choose the right plan for your family', description: 'Try everything for 7 days before deciding. No credit card and no automatic charge.', trial: '7-day full trial', action: 'See benefits and checkout' },
  fr: { title: 'Choisissez le forfait adapté à votre famille', description: 'Essayez toutes les fonctions pendant 7 jours, sans carte ni prélèvement automatique.', trial: 'Essai complet de 7 jours', action: 'Voir les avantages et payer' },
  de: { title: 'Wählen Sie das passende Familienpaket', description: 'Testen Sie 7 Tage lang alle Funktionen, ohne Kreditkarte und ohne automatische Abbuchung.', trial: '7 Tage vollständig testen', action: 'Leistungen und Zahlung ansehen' },
  it: { title: 'Scegli il piano giusto per la famiglia', description: 'Prova tutto per 7 giorni, senza carta e senza addebito automatico.', trial: 'Prova completa di 7 giorni', action: 'Vedi vantaggi e pagamento' },
  es: { title: 'Elige el plan adecuado para tu familia', description: 'Prueba todo durante 7 días, sin tarjeta ni cobro automático.', trial: 'Prueba completa de 7 días', action: 'Ver ventajas y pagar' },
  zh: { title: '选择适合家庭的方案', description: '先免费体验全部功能 7 天，无需信用卡，也不会自动扣款。', trial: '7 天完整体验', action: '查看权益并付款' },
  ja: { title: 'ご家族に合うプランを選ぶ', description: 'まず7日間すべての機能を体験。カード不要で、自動課金もありません。', trial: '7日間フル体験', action: '特典と支払いを見る' },
  ko: { title: '가족에게 맞는 플랜을 선택하세요', description: '먼저 7일 동안 모든 기능을 체험하세요. 카드가 필요 없고 자동 결제되지 않습니다.', trial: '7일 전체 체험', action: '혜택 및 결제 보기' },
};

export const BILLING_PERIOD_COPY: Record<Language, { month: string; year: string }> = {
  vi: { month: '/tháng', year: '/năm' },
  en: { month: '/month', year: '/year' },
  fr: { month: '/mois', year: '/an' },
  de: { month: '/Monat', year: '/Jahr' },
  it: { month: '/mese', year: '/anno' },
  es: { month: '/mes', year: '/año' },
  zh: { month: '/月', year: '/年' },
  ja: { month: '/月', year: '/年' },
  ko: { month: '/월', year: '/년' },
};
