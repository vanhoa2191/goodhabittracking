import type { Language } from '@/types';
import type { UpcomingPlanId } from '@/lib/upcoming-plans';
import { LAUNCH_OFFER } from '@/lib/billing/plan-catalog';

export type UpcomingPlansCopy = {
  readonly heading: string;
  readonly note: string;
  readonly badge: string;
  readonly priceSoon: string;
  readonly button: string;
  readonly includes: string;
  readonly coachFeature: string;
  readonly offerTitle: string;
  readonly offerBody: string;
  readonly offerRemaining: (remaining: number) => string;
  readonly offerSoldOut: string;
  readonly names: Readonly<Record<UpcomingPlanId, string>>;
  readonly periods: Readonly<Record<UpcomingPlanId, string>>;
  readonly features: readonly string[];
};

/** The habit coach comes first on the card; "features" lists what else Pro Plus adds. */
const T = (
  heading: string, note: string, badge: string, priceSoon: string, button: string, includes: string,
  monthly: string, yearly: string, perMonth: string, perYear: string, features: readonly string[],
  offer: { coachFeature: string; offerTitle: string; offerBody: string; offerRemaining: (remaining: number) => string; offerSoldOut: string },
): UpcomingPlansCopy => ({
  heading, note, badge, priceSoon, button, includes, ...offer,
  names: { family_plus_monthly: monthly, family_plus_yearly: yearly },
  periods: { family_plus_monthly: perMonth, family_plus_yearly: perYear },
  features,
});

const COPY: Record<Language, UpcomingPlansCopy> = {
  vi: T('Gói nâng cao với AI', 'Đang phát triển. Giá và ngày ra mắt sẽ được công bố sau; các gói hiện tại không thay đổi.', 'Sắp ra mắt', 'Giá sẽ công bố khi ra mắt', 'Sắp ra mắt', 'Gồm tất cả của Gói Pro, thêm:', 'Gói Pro Plus · Tháng', 'Gói Pro Plus · Năm', 'theo tháng', 'theo năm', ['Nhiều lượt gợi ý mỗi ngày hơn', 'Luôn do bạn quyết định, không gửi tên hay nhật ký của bé'], { coachFeature: 'Huấn luyện viên thói quen: gợi ý chia nhỏ thói quen và tóm tắt tuần bằng AI', offerTitle: 'Ưu đãi ra mắt', offerBody: '10 gia đình đầu tiên mua Gói Pro theo năm trước khi Pro Plus ra mắt sẽ được nâng cấp miễn phí lên Pro Plus cho phần còn lại của năm đã trả.', offerRemaining: (n) => `Còn ${n}/${LAUNCH_OFFER.slots} suất`, offerSoldOut: 'Đã hết suất ưu đãi' }),
  en: T('Advanced plans with AI', 'In development. Prices and launch dates will be announced later; the current plans do not change.', 'Coming soon', 'Price announced at launch', 'Coming soon', 'Everything in the Pro plan, plus:', 'Pro Plus plan · Monthly', 'Pro Plus plan · Yearly', 'per month', 'per year', ['More suggestions per day', 'You always decide; your child’s name and journal are never sent'], { coachFeature: 'Habit coach: AI suggestions that break a habit into small steps, and a weekly summary', offerTitle: 'Launch offer', offerBody: 'The first 10 families to buy the yearly Pro plan before Pro Plus launches get a free upgrade to Pro Plus for the rest of the year they paid for.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} spots left`, offerSoldOut: 'Launch offer spots are all taken' }),
  fr: T('Forfaits avancés avec IA', 'En développement. Les prix et les dates de lancement seront annoncés plus tard ; les forfaits actuels ne changent pas.', 'Bientôt disponible', 'Prix annoncé au lancement', 'Bientôt disponible', 'Tout ce qui est inclus dans le forfait Pro, et plus encore :', 'Forfait Pro Plus · Mensuel', 'Forfait Pro Plus · Annuel', 'par mois', 'par an', ['Plus de suggestions par jour', 'Vous décidez toujours ; le nom et le journal de votre enfant ne sont jamais envoyés'], { coachFeature: 'Coach d’habitudes : suggestions IA pour décomposer une habitude en petites étapes et résumer la semaine', offerTitle: 'Offre de lancement', offerBody: 'Les 10 premières familles qui achètent le forfait Pro annuel avant le lancement de Pro Plus bénéficient d’une mise à niveau gratuite vers Pro Plus pour le reste de l’année payée.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} places restantes`, offerSoldOut: 'Toutes les places de l’offre de lancement sont prises' }),
  de: T('Erweiterte Pakete mit KI', 'In Entwicklung. Preise und Starttermine werden später bekannt gegeben; die aktuellen Pakete bleiben unverändert.', 'Demnächst verfügbar', 'Preis wird zum Start bekannt gegeben', 'Demnächst verfügbar', 'Alles aus dem Pro-Paket und mehr:', 'Pro-Plus-Paket · Monatlich', 'Pro-Plus-Paket · Jährlich', 'pro Monat', 'pro Jahr', ['Mehr Vorschläge pro Tag', 'Sie entscheiden immer; Name und Tagebuch Ihres Kindes werden nie gesendet'], { coachFeature: 'Gewohnheits-Coach: KI-Vorschläge, die eine Gewohnheit in kleine Schritte aufteilen, und eine Wochenzusammenfassung', offerTitle: 'Einführungsangebot', offerBody: 'Die ersten 10 Familien, die vor dem Start von Pro Plus das jährliche Pro-Paket kaufen, erhalten für den restlichen bezahlten Jahreszeitraum kostenlos ein Upgrade auf Pro Plus.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} Plätze übrig`, offerSoldOut: 'Alle Plätze des Einführungsangebots sind vergeben' }),
  it: T('Piani avanzati con IA', 'In sviluppo. Prezzi e date di lancio saranno annunciati più avanti; i piani attuali non cambiano.', 'In arrivo', 'Prezzo annunciato al lancio', 'In arrivo', 'Tutto ciò che include il Piano Pro, in più:', 'Piano Pro Plus · Mensile', 'Piano Pro Plus · Annuale', 'al mese', 'all’anno', ['Più suggerimenti al giorno', 'Decide sempre Lei; nome e diario del bambino non vengono mai inviati'], { coachFeature: 'Coach delle abitudini: suggerimenti IA per suddividere un’abitudine in piccoli passi e un riepilogo settimanale', offerTitle: 'Offerta di lancio', offerBody: 'Le prime 10 famiglie che acquistano il Piano Pro annuale prima del lancio di Pro Plus ricevono gratuitamente un upgrade a Pro Plus per il resto dell’anno pagato.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} posti rimasti`, offerSoldOut: 'I posti dell’offerta di lancio sono esauriti' }),
  es: T('Planes avanzados con IA', 'En desarrollo. Los precios y las fechas de lanzamiento se anunciarán más adelante; los planes actuales no cambian.', 'Próximamente', 'Precio anunciado en el lanzamiento', 'Próximamente', 'Todo lo del plan Pro y mucho más:', 'Plan Pro Plus · Mensual', 'Plan Pro Plus · Anual', 'al mes', 'al año', ['Más sugerencias al día', 'Usted siempre decide; el nombre y el diario de su hijo o hija nunca se envían'], { coachFeature: 'Coach de hábitos: sugerencias de IA para dividir un hábito en pasos pequeños y resumir la semana', offerTitle: 'Oferta de lanzamiento', offerBody: 'Las 10 primeras familias que compren el plan Pro anual antes del lanzamiento de Pro Plus recibirán una mejora gratuita a Pro Plus durante el resto del año pagado.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} plazas restantes`, offerSoldOut: 'Se han ocupado todas las plazas de la oferta de lanzamiento' }),
  zh: T('含 AI 的进阶套餐', '开发中。价格和上线日期将稍后公布；现有套餐不变。', '即将推出', '价格将在上线时公布', '即将推出', '包含 Pro 套餐的全部内容，另外还有：', 'Pro Plus 套餐 · 月付', 'Pro Plus 套餐 · 年付', '每月', '每年', ['每天更多建议次数', '始终由您决定，绝不发送孩子的姓名或日记'], { coachFeature: '习惯教练：用 AI 建议将习惯拆分成小步骤，并总结每周情况', offerTitle: '上线优惠', offerBody: '在 Pro Plus 上线前购买 Pro 年付套餐的前10个家庭，可在已付款年度的剩余时间内免费升级到 Pro Plus。', offerRemaining: (n) => `还剩 ${n}/${LAUNCH_OFFER.slots} 个名额`, offerSoldOut: '上线优惠名额已全部占用' }),
  ja: T('AI 付きの上位プラン', '開発中です。料金と公開日は後日お知らせします。現在のプランは変わりません。', '近日公開', '料金は公開時にお知らせします', '近日公開', 'Proプランのすべてに加えて：', 'Pro Plusプラン · 月額', 'Pro Plusプラン · 年額', '月ごと', '年ごと', ['1日の提案回数が増加', '決めるのは常にあなたで、お子さまの名前や日記は送信されません'], { coachFeature: '習慣コーチ：習慣を小さなステップに分けるAI提案と、1週間のまとめ', offerTitle: '公開記念オファー', offerBody: 'Pro Plusの公開前にPro年額プランを購入した先着10家族は、支払い済みの年の残り期間、無料でPro Plusにアップグレードできます。', offerRemaining: (n) => `残り${n}/${LAUNCH_OFFER.slots}枠`, offerSoldOut: '公開記念オファーの枠はすべて埋まりました' }),
  ko: T('AI가 포함된 고급 플랜', '개발 중입니다. 가격과 출시일은 나중에 안내해 드립니다. 현재 플랜은 변경되지 않습니다.', '곧 출시', '가격은 출시 때 안내합니다', '곧 출시', 'Pro 플랜의 모든 기능에 더해:', 'Pro Plus 플랜 · 월간', 'Pro Plus 플랜 · 연간', '월', '연', ['하루 제안 횟수 증가', '결정은 항상 부모님이 하며, 자녀의 이름과 일기는 절대 보내지 않습니다'], { coachFeature: '습관 코치: 습관을 작은 단계로 나누는 AI 제안과 주간 요약', offerTitle: '출시 기념 혜택', offerBody: 'Pro Plus 출시 전에 Pro 연간 플랜을 구매한 선착순 10가족은 결제한 연도의 남은 기간 동안 Pro Plus로 무료 업그레이드됩니다.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots}자리 남음`, offerSoldOut: '출시 기념 혜택 자리가 모두 찼습니다' }),
};

export function getUpcomingPlansCopy(language: Language): UpcomingPlansCopy {
  return COPY[language] ?? COPY.en;
}
