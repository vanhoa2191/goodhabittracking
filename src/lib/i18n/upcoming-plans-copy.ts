import type { Language } from '@/types';
import type { UpcomingPlanId } from '@/lib/upcoming-plans';

export type UpcomingPlansCopy = {
  readonly heading: string;
  readonly note: string;
  readonly badge: string;
  readonly priceSoon: string;
  readonly button: string;
  readonly includes: string;
  readonly names: Readonly<Record<UpcomingPlanId, string>>;
  readonly periods: Readonly<Record<UpcomingPlanId, string>>;
  readonly features: readonly string[];
};

const T = (
  heading: string, note: string, badge: string, priceSoon: string, button: string, includes: string,
  monthly: string, yearly: string, perMonth: string, perYear: string, features: readonly string[],
): UpcomingPlansCopy => ({
  heading, note, badge, priceSoon, button, includes,
  names: { family_plus_monthly: monthly, family_plus_yearly: yearly },
  periods: { family_plus_monthly: perMonth, family_plus_yearly: perYear },
  features,
});

const COPY: Record<Language, UpcomingPlansCopy> = {
  vi: T('Gói nâng cao với AI', 'Đang phát triển. Giá và ngày ra mắt sẽ được công bố sau; các gói hiện tại không thay đổi.', 'Sắp ra mắt', 'Giá sẽ công bố khi ra mắt', 'Sắp ra mắt', 'Gồm tất cả của Gói Gia Đình, thêm:', 'Gia Đình Plus · Tháng', 'Gia Đình Plus · Năm', 'theo tháng', 'theo năm', ['Gợi ý bước nhỏ bằng AI cho thói quen tự tạo', 'Tóm tắt tuần bằng AI cho phụ huynh', 'Nhiều lượt gợi ý mỗi ngày hơn', 'Luôn do bạn quyết định, không gửi tên hay nhật ký của bé']),
  en: T('Advanced plans with AI', 'In development. Prices and launch dates will be announced later; the current plans do not change.', 'Coming soon', 'Price announced at launch', 'Coming soon', 'Everything in the Family plan, plus:', 'Family Plus · Monthly', 'Family Plus · Yearly', 'per month', 'per year', ['AI small-step suggestions for habits you create', 'AI weekly summary for parents', 'More suggestions per day', 'You always decide; your child’s name and journal are never sent']),
  fr: T('Forfaits avancés avec IA', 'En développement. Les prix et les dates de lancement seront annoncés plus tard ; les forfaits actuels ne changent pas.', 'Bientôt disponible', 'Prix annoncé au lancement', 'Bientôt disponible', 'Tout le forfait Famille, plus :', 'Famille Plus · Mensuel', 'Famille Plus · Annuel', 'par mois', 'par an', ['Suggestions de petites étapes par IA pour vos habitudes', 'Résumé hebdomadaire par IA pour les parents', 'Plus de suggestions par jour', 'Vous décidez toujours ; le nom et le journal de votre enfant ne sont jamais envoyés']),
  de: T('Erweiterte Pakete mit KI', 'In Entwicklung. Preise und Starttermine werden später bekannt gegeben; die aktuellen Pakete bleiben unverändert.', 'Demnächst verfügbar', 'Preis wird zum Start bekannt gegeben', 'Demnächst verfügbar', 'Alles aus dem Familienpaket, dazu:', 'Familie Plus · Monatlich', 'Familie Plus · Jährlich', 'pro Monat', 'pro Jahr', ['KI-Vorschläge für kleine Schritte bei selbst erstellten Gewohnheiten', 'KI-Wochenzusammenfassung für Eltern', 'Mehr Vorschläge pro Tag', 'Sie entscheiden immer; Name und Tagebuch Ihres Kindes werden nie gesendet']),
  it: T('Piani avanzati con IA', 'In sviluppo. Prezzi e date di lancio saranno annunciati più avanti; i piani attuali non cambiano.', 'In arrivo', 'Prezzo annunciato al lancio', 'In arrivo', 'Tutto il piano Famiglia, più:', 'Famiglia Plus · Mensile', 'Famiglia Plus · Annuale', 'al mese', 'all’anno', ['Suggerimenti di piccoli passi con IA per le abitudini che crea', 'Riepilogo settimanale con IA per i genitori', 'Più suggerimenti al giorno', 'Decide sempre Lei; nome e diario del bambino non vengono mai inviati']),
  es: T('Planes avanzados con IA', 'En desarrollo. Los precios y las fechas de lanzamiento se anunciarán más adelante; los planes actuales no cambian.', 'Próximamente', 'Precio anunciado en el lanzamiento', 'Próximamente', 'Todo el plan Familia, y además:', 'Familia Plus · Mensual', 'Familia Plus · Anual', 'al mes', 'al año', ['Sugerencias de pasos pequeños con IA para los hábitos que cree', 'Resumen semanal con IA para los padres', 'Más sugerencias al día', 'Usted siempre decide; el nombre y el diario de su hijo o hija nunca se envían']),
  zh: T('含 AI 的进阶套餐', '开发中。价格和上线日期将稍后公布；现有套餐不变。', '即将推出', '价格将在上线时公布', '即将推出', '包含家庭套餐的全部内容，另加：', '家庭 Plus · 按月', '家庭 Plus · 按年', '每月', '每年', ['为您自建的习惯提供 AI 小步骤建议', '面向家长的 AI 每周总结', '每天更多建议次数', '始终由您决定，绝不发送孩子的姓名或日记']),
  ja: T('AI 付きの上位プラン', '開発中です。料金と公開日は後日お知らせします。現在のプランは変わりません。', '近日公開', '料金は公開時にお知らせします', '近日公開', 'ファミリープランのすべてに加えて：', 'ファミリー Plus · 月払い', 'ファミリー Plus · 年払い', '月ごと', '年ごと', ['ご自身で作った習慣への AI による小さなステップの提案', '保護者向けの AI による週のまとめ', '1日の提案回数が増加', '決めるのは常にあなたで、お子さまの名前や日記は送信されません']),
  ko: T('AI가 포함된 고급 플랜', '개발 중입니다. 가격과 출시일은 나중에 안내해 드립니다. 현재 플랜은 변경되지 않습니다.', '곧 출시', '가격은 출시 때 안내합니다', '곧 출시', '가족 플랜의 모든 기능에 더해:', '가족 Plus · 월간', '가족 Plus · 연간', '월', '연', ['직접 만든 습관에 대한 AI 작은 단계 제안', '부모님을 위한 AI 주간 요약', '하루 제안 횟수 증가', '결정은 항상 부모님이 하며, 자녀의 이름과 일기는 절대 보내지 않습니다']),
};

export function getUpcomingPlansCopy(language: Language): UpcomingPlansCopy {
  return COPY[language] ?? COPY.en;
}
