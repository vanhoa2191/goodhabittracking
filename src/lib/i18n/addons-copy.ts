import type { Language } from '@/types';
import { formatNumber } from '@/lib/i18n/formatters';
import { LAUNCH_OFFER } from '@/lib/billing/plan-catalog';

export type AddonsCopy = {
  readonly title: string;
  readonly aiName: string;
  readonly aiDescription: string;
  readonly included: string;
  readonly activeUntil: string;
  readonly extend: string;
  readonly buyAi: string;
  readonly requiresPlan: string;
  readonly printablesName: string;
  readonly owned: string;
  readonly buyPrintables: string;
  readonly aiPricingLine: string;
  readonly loading: string;
  readonly loadError: string;
};

const T = (...values: readonly string[]): AddonsCopy => {
  const [title, aiName, aiDescription, included, activeUntil, extend, buyAi, requiresPlan, printablesName, owned, buyPrintables, aiPricingLine, loading, loadError] = values;
  return { title, aiName, aiDescription, included, activeUntil, extend, buyAi, requiresPlan, printablesName, owned, buyPrintables, aiPricingLine, loading, loadError };
};

const COPY: Record<Language, AddonsCopy> = {
  vi: T("Tiện ích bổ sung", "Add-on AI", "Gợi ý AI không giới hạn", "Đã gồm trong gói của bạn", "Đang dùng đến {date}", "Thêm 1 tháng · {price}", "Thêm Add-on AI · {price}/tháng", "Cần gói trả phí đang hoạt động", "Printable & Ebook", "Đã sở hữu", "Mua · {price}", "Gói Cơ bản/Pro: thêm Add-on AI · {price}/tháng để có gợi ý AI không giới hạn.", "Đang tải tiện ích bổ sung…", "Chưa đọc được tiện ích bổ sung. Vui lòng mở lại cài đặt."),
  en: T("Add-ons", "AI add-on", "Unlimited AI suggestions", "Included in your plan", "Active until {date}", "Add 1 month · {price}", "Add AI add-on · {price}/month", "An active paid plan is required", "Printables & Ebook", "Already owned", "Buy · {price}", "Basic/Pro plans: add the AI add-on · {price}/month for unlimited AI suggestions.", "Loading add-ons…", "Could not load add-ons. Please reopen settings."),
  fr: T("Options supplémentaires", "Option IA", "Suggestions IA illimitées", "Inclus dans votre forfait", "Actif jusqu’au {date}", "Ajouter 1 mois · {price}", "Ajouter l’option IA · {price}/mois", "Un forfait payant actif est requis", "Fiches à imprimer et livre numérique", "Déjà acheté", "Acheter · {price}", "Forfaits Basic/Pro : ajoutez l’option IA · {price}/mois pour des suggestions IA illimitées.", "Chargement des options…", "Impossible de charger les options. Rouvrez les paramètres."),
  de: T("Zusatzoptionen", "KI-Zusatzoption", "Unbegrenzte KI-Vorschläge", "In Ihrem Paket enthalten", "Aktiv bis {date}", "1 Monat hinzufügen · {price}", "KI-Zusatzoption hinzufügen · {price}/Monat", "Ein aktives kostenpflichtiges Paket ist erforderlich", "Druckvorlagen & E-Book", "Bereits gekauft", "Kaufen · {price}", "Basic/Pro-Pakete: KI-Zusatzoption · {price}/Monat für unbegrenzte KI-Vorschläge hinzufügen.", "Zusatzoptionen werden geladen…", "Zusatzoptionen konnten nicht geladen werden. Öffnen Sie die Einstellungen erneut."),
  it: T("Opzioni aggiuntive", "Opzione IA", "Suggerimenti IA illimitati", "Incluso nel Suo piano", "Attivo fino al {date}", "Aggiungi 1 mese · {price}", "Aggiungi l’opzione IA · {price}/mese", "È necessario un piano a pagamento attivo", "Schede stampabili e libro digitale", "Già acquistato", "Acquista · {price}", "Piani Basic/Pro: aggiunga l’opzione IA · {price}/mese per suggerimenti IA illimitati.", "Caricamento delle opzioni…", "Impossibile caricare le opzioni. Riapra le impostazioni."),
  es: T("Complementos", "Complemento de IA", "Sugerencias de IA ilimitadas", "Incluido en su plan", "Activo hasta {date}", "Añadir 1 mes · {price}", "Añadir complemento de IA · {price}/mes", "Se requiere un plan de pago activo", "Imprimibles y libro digital", "Ya adquirido", "Comprar · {price}", "Planes Basic/Pro: añada el complemento de IA · {price}/mes para sugerencias de IA ilimitadas.", "Cargando complementos…", "No se pudieron cargar los complementos. Vuelva a abrir los ajustes."),
  zh: T("附加服务", "AI 附加服务", "无限 AI 建议", "已包含在您的套餐中", "有效期至 {date}", "增加1个月 · {price}", "添加 AI 附加服务 · {price}/月", "需要有效的付费套餐", "可打印资料和电子书", "已拥有", "购买 · {price}", "Basic/Pro 套餐：添加 AI 附加服务 · {price}/月，即可享用无限 AI 建议。", "正在加载附加服务…", "无法加载附加服务。请重新打开设置。"),
  ja: T("追加オプション", "AI追加オプション", "無制限のAI提案", "ご利用のプランに含まれています", "有効期限：{date}", "1か月追加 · {price}", "AI追加オプションを追加 · {price}/月", "有効な有料プランが必要です", "印刷用資料と電子書籍", "購入済み", "購入 · {price}", "Basic/Proプラン：AI追加オプション · {price}/月で無制限のAI提案を利用できます。", "追加オプションを読み込み中…", "追加オプションを読み込めませんでした。設定を開き直してください。"),
  ko: T("추가 옵션", "AI 추가 옵션", "무제한 AI 제안", "이용 중인 플랜에 포함되어 있습니다", "{date}까지 이용 가능", "1개월 추가 · {price}", "AI 추가 옵션 구매 · {price}/월", "활성 유료 플랜이 필요합니다", "인쇄 자료 및 전자책", "이미 보유 중", "구매 · {price}", "Basic/Pro 플랜: AI 추가 옵션 · {price}/월로 무제한 AI 제안을 이용하세요.", "추가 옵션을 불러오는 중…", "추가 옵션을 불러올 수 없습니다. 설정을 다시 열어 주세요."),
};

export function getAddonsCopy(language: Language): AddonsCopy {
  return COPY[language] ?? COPY.en;
}

export type LaunchOfferCopy = {
  readonly offerTitle: string;
  readonly offerBody: string;
  readonly offerRemaining: (remaining: number) => string;
  readonly offerSoldOut: string;
};

const LAUNCH_COPY: Record<Language, LaunchOfferCopy> = {
  vi: { offerTitle: 'Ưu đãi ra mắt', offerBody: '10 gia đình đầu tiên mua Gói Pro theo năm sẽ được nâng cấp miễn phí lên Pro Plus cho phần còn lại của năm đã trả.', offerRemaining: (n) => `Còn ${n}/${LAUNCH_OFFER.slots} suất`, offerSoldOut: 'Đã hết suất ưu đãi' },
  en: { offerTitle: 'Launch offer', offerBody: 'The first 10 families to buy the yearly Pro plan get a free upgrade to Pro Plus for the rest of the year they paid for.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} spots left`, offerSoldOut: 'Launch offer spots are all taken' },
  fr: { offerTitle: 'Offre de lancement', offerBody: 'Les 10 premières familles qui achètent le forfait Pro annuel bénéficient d’une mise à niveau gratuite vers Pro Plus pour le reste de l’année payée.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} places restantes`, offerSoldOut: 'Toutes les places de l’offre de lancement sont prises' },
  de: { offerTitle: 'Einführungsangebot', offerBody: 'Die ersten 10 Familien, die das jährliche Pro-Paket kaufen, erhalten für den restlichen bezahlten Jahreszeitraum kostenlos ein Upgrade auf Pro Plus.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} Plätze übrig`, offerSoldOut: 'Alle Plätze des Einführungsangebots sind vergeben' },
  it: { offerTitle: 'Offerta di lancio', offerBody: 'Le prime 10 famiglie che acquistano il Piano Pro annuale ricevono gratuitamente un upgrade a Pro Plus per il resto dell’anno pagato.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} posti rimasti`, offerSoldOut: 'I posti dell’offerta di lancio sono esauriti' },
  es: { offerTitle: 'Oferta de lanzamiento', offerBody: 'Las 10 primeras familias que compren el plan Pro anual recibirán una mejora gratuita a Pro Plus durante el resto del año pagado.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots} plazas restantes`, offerSoldOut: 'Se han ocupado todas las plazas de la oferta de lanzamiento' },
  zh: { offerTitle: '上线优惠', offerBody: '购买 Pro 年付套餐的前10个家庭，可在已付款年度的剩余时间内免费升级到 Pro Plus。', offerRemaining: (n) => `还剩 ${n}/${LAUNCH_OFFER.slots} 个名额`, offerSoldOut: '上线优惠名额已全部占用' },
  ja: { offerTitle: '公開記念オファー', offerBody: 'Pro年額プランを購入した先着10家族は、支払い済みの年の残り期間、無料でPro Plusにアップグレードできます。', offerRemaining: (n) => `残り${n}/${LAUNCH_OFFER.slots}枠`, offerSoldOut: '公開記念オファーの枠はすべて埋まりました' },
  ko: { offerTitle: '출시 기념 혜택', offerBody: 'Pro 연간 플랜을 구매한 선착순 10가족은 결제한 연도의 남은 기간 동안 Pro Plus로 무료 업그레이드됩니다.', offerRemaining: (n) => `${n}/${LAUNCH_OFFER.slots}자리 남음`, offerSoldOut: '출시 기념 혜택 자리가 모두 찼습니다' },
};

export function getLaunchOfferCopy(language: Language): LaunchOfferCopy {
  return LAUNCH_COPY[language] ?? LAUNCH_COPY.en;
}

const PRICE_SUFFIX: Record<Language, (formatted: string) => string> = {
  vi: (n) => `${n}đ`, en: (n) => `${n} VND`, fr: (n) => `${n} VND`, de: (n) => `${n} VND`, it: (n) => `${n} VND`,
  es: (n) => `${n} VND`, zh: (n) => `${n} VND`, ja: (n) => `${n} VND`, ko: (n) => `${n} VND`,
};

/** "29.000đ" in Vietnamese, "29,000 VND" elsewhere: the style the pricing cards use. */
export function formatAddonPrice(amount: number, language: Language): string {
  return (PRICE_SUFFIX[language] ?? PRICE_SUFFIX.en)(formatNumber(amount, language));
}
