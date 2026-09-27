import type { Language } from '@/types';

type PlanCopy = {
  readonly name: string;
  readonly badge: string;
  readonly limit: string;
};

export type LandingSalesCopy = {
  readonly previewLabel: string;
  readonly previewTitle: string;
  readonly previewTasks: readonly [string, string];
  readonly previewReward: string;
  readonly assurances: readonly [string, string, string];
  readonly safetyTitle: string;
  readonly safetyBody: string;
  readonly faqTitle: string;
  readonly faq: readonly [
    { readonly question: string; readonly answer: string },
    { readonly question: string; readonly answer: string },
    { readonly question: string; readonly answer: string },
  ];
  readonly finalTitle: string;
  readonly finalBody: string;
  readonly docs: string;
  readonly plans: {
    readonly solo_monthly: PlanCopy;
    readonly monthly: PlanCopy;
    readonly yearly: PlanCopy;
  };
};

const COPY: Record<Language, LandingSalesCopy> = {
  vi: {
    previewLabel: 'Dữ liệu minh họa từ giao diện thật',
    previewTitle: 'Một ngày rõ ràng cho cả con và ba mẹ',
    previewTasks: ['Tự đánh răng buổi sáng', 'Đọc sách tập trung 20 phút'],
    previewReward: 'Đổi 120 sao: Chọn món tráng miệng cuối tuần',
    assurances: ['Dùng thử 7 ngày, không cần thẻ', 'Ba mẹ duyệt nhiệm vụ và phần thưởng', 'Đồng bộ cloud trên nhiều thiết bị'],
    safetyTitle: 'Ba mẹ luôn là người kiểm soát',
    safetyBody: 'Hồ sơ của bé mặc định riêng tư. Ba mẹ quyết định nhiệm vụ, số sao, phần thưởng và việc có tham gia bảng xếp hạng hay không.',
    faqTitle: 'Câu hỏi thường gặp',
    faq: [
      { question: 'Có tự động trừ tiền sau 7 ngày không?', answer: 'Không. Dùng thử không yêu cầu thẻ và KidHabit không tự động gia hạn hay trừ tiền.' },
      { question: 'Con dùng KidHabit như thế nào?', answer: 'Con quét QR hoặc nhập mã gia đình để vào giao diện riêng, xem nhiệm vụ, tích sao và đổi quà.' },
      { question: 'Dữ liệu có theo sang thiết bị khác không?', answer: 'Có. Khi ba mẹ đăng nhập, dữ liệu gia đình được đồng bộ cloud để tiếp tục trên thiết bị khác.' },
    ],
    finalTitle: 'Bắt đầu với một việc nhỏ hôm nay',
    finalBody: 'Tạo hồ sơ cho bé, nhận bộ gợi ý theo tuổi và cùng con theo dõi tiến độ trong một nơi.',
    docs: 'Xem tài liệu hướng dẫn',
    plans: {
      solo_monthly: { name: 'Gói Một Bé', badge: 'Khởi đầu nhẹ nhàng', limit: 'Dành cho 1 bé' },
      monthly: { name: 'Gói Gia Đình · Tháng', badge: 'Phổ biến nhất', limit: 'Không giới hạn số bé' },
      yearly: { name: 'Gói Gia Đình · Năm', badge: 'Tiết kiệm nhất', limit: 'Không giới hạn số bé' },
    },
  },
  en: {
    previewLabel: 'Sample data in the real interface',
    previewTitle: 'A clear day for children and parents',
    previewTasks: ['Brush teeth independently', 'Read with focus for 20 minutes'],
    previewReward: 'Redeem 120 stars: Choose a weekend dessert',
    assurances: ['7-day trial, no card required', 'Parents approve tasks and rewards', 'Cloud sync across devices'],
    safetyTitle: 'Parents stay in control',
    safetyBody: 'Child profiles are private by default. Parents control tasks, stars, rewards, and whether leaderboards are enabled.',
    faqTitle: 'Frequently asked questions',
    faq: [
      { question: 'Will I be charged after 7 days?', answer: 'No. The trial needs no card and KidHabit does not renew or charge automatically.' },
      { question: 'How does my child enter the app?', answer: 'Your child scans a QR code or enters the family code to open the child-only interface.' },
      { question: 'Does data follow me to another device?', answer: 'Yes. Signed-in family data is synced to the cloud and continues on another device.' },
    ],
    finalTitle: 'Start with one small action today',
    finalBody: 'Create a child profile, get age-ready suggestions, and follow progress together in one place.',
    docs: 'Read the user guide',
    plans: {
      solo_monthly: { name: 'One Child', badge: 'Easy start', limit: 'For 1 child' },
      monthly: { name: 'Family · Monthly', badge: 'Most popular', limit: 'Unlimited children' },
      yearly: { name: 'Family · Yearly', badge: 'Best savings', limit: 'Unlimited children' },
    },
  },
  fr: {
    previewLabel: 'Données d’exemple dans l’interface réelle', previewTitle: 'Une journée claire pour l’enfant et les parents', previewTasks: ['Se brosser les dents seul', 'Lire avec attention pendant 20 minutes'], previewReward: '120 étoiles : choisir le dessert du week-end',
    assurances: ['Essai de 7 jours, sans carte', 'Les parents valident tâches et récompenses', 'Synchronisation cloud sur plusieurs appareils'],
    safetyTitle: 'Les parents gardent le contrôle', safetyBody: 'Les profils enfants sont privés par défaut. Les parents gèrent tâches, étoiles, récompenses et classement.',
    faqTitle: 'Questions fréquentes', faq: [{ question: 'Un paiement est-il prélevé après 7 jours ?', answer: 'Non. Aucune carte ni reconduction automatique.' }, { question: 'Comment l’enfant accède-t-il à l’application ?', answer: 'Il scanne le QR code ou saisit le code familial pour ouvrir son interface.' }, { question: 'Les données suivent-elles sur un autre appareil ?', answer: 'Oui. Les données de la famille connectée sont synchronisées dans le cloud.' }],
    finalTitle: 'Commencez par une petite action', finalBody: 'Créez le profil, recevez des suggestions adaptées à l’âge et suivez les progrès ensemble.', docs: 'Lire le guide',
    plans: { solo_monthly: { name: 'Un enfant', badge: 'Départ en douceur', limit: 'Pour 1 enfant' }, monthly: { name: 'Famille · Mensuel', badge: 'Le plus populaire', limit: 'Enfants illimités' }, yearly: { name: 'Famille · Annuel', badge: 'Meilleure économie', limit: 'Enfants illimités' } },
  },
  de: {
    previewLabel: 'Beispieldaten in der echten Oberfläche', previewTitle: 'Ein klarer Tag für Kinder und Eltern', previewTasks: ['Selbstständig Zähne putzen', '20 Minuten konzentriert lesen'], previewReward: '120 Sterne: Wochenenddessert wählen',
    assurances: ['7 Tage testen, ohne Karte', 'Eltern bestätigen Aufgaben und Belohnungen', 'Cloud-Synchronisierung auf mehreren Geräten'],
    safetyTitle: 'Eltern behalten die Kontrolle', safetyBody: 'Kinderprofile sind standardmäßig privat. Eltern steuern Aufgaben, Sterne, Belohnungen und Ranglisten.',
    faqTitle: 'Häufige Fragen', faq: [{ question: 'Wird nach 7 Tagen automatisch abgebucht?', answer: 'Nein. Der Test benötigt keine Karte und verlängert sich nicht automatisch.' }, { question: 'Wie öffnet mein Kind die App?', answer: 'Es scannt den QR-Code oder gibt den Familiencode für die Kinderansicht ein.' }, { question: 'Sind die Daten auf einem anderen Gerät verfügbar?', answer: 'Ja. Angemeldete Familiendaten werden über die Cloud synchronisiert.' }],
    finalTitle: 'Heute mit einer kleinen Aufgabe starten', finalBody: 'Profil anlegen, altersgerechte Vorschläge erhalten und Fortschritte gemeinsam verfolgen.', docs: 'Anleitung lesen',
    plans: { solo_monthly: { name: 'Ein Kind', badge: 'Leichter Einstieg', limit: 'Für 1 Kind' }, monthly: { name: 'Familie · Monatlich', badge: 'Am beliebtesten', limit: 'Unbegrenzte Kinder' }, yearly: { name: 'Familie · Jährlich', badge: 'Beste Ersparnis', limit: 'Unbegrenzte Kinder' } },
  },
  it: {
    previewLabel: 'Dati di esempio nell’interfaccia reale', previewTitle: 'Una giornata chiara per figli e genitori', previewTasks: ['Lavarsi i denti in autonomia', 'Leggere con attenzione per 20 minuti'], previewReward: '120 stelle: scegliere il dolce del weekend',
    assurances: ['Prova di 7 giorni, senza carta', 'I genitori approvano attività e premi', 'Sincronizzazione cloud tra dispositivi'],
    safetyTitle: 'Il controllo resta ai genitori', safetyBody: 'I profili dei bambini sono privati per impostazione predefinita. I genitori gestiscono attività, stelle, premi e classifiche.',
    faqTitle: 'Domande frequenti', faq: [{ question: 'Dopo 7 giorni parte un addebito?', answer: 'No. La prova non richiede carta e non si rinnova automaticamente.' }, { question: 'Come entra il bambino?', answer: 'Scansiona il QR o inserisce il codice famiglia per aprire la sua interfaccia.' }, { question: 'I dati passano a un altro dispositivo?', answer: 'Sì. I dati della famiglia connessa vengono sincronizzati nel cloud.' }],
    finalTitle: 'Inizia oggi da una piccola azione', finalBody: 'Crea il profilo, ricevi suggerimenti per età e seguite insieme i progressi.', docs: 'Leggi la guida',
    plans: { solo_monthly: { name: 'Un bambino', badge: 'Partenza leggera', limit: 'Per 1 bambino' }, monthly: { name: 'Famiglia · Mensile', badge: 'Più popolare', limit: 'Bambini illimitati' }, yearly: { name: 'Famiglia · Annuale', badge: 'Miglior risparmio', limit: 'Bambini illimitati' } },
  },
  es: {
    previewLabel: 'Datos de ejemplo en la interfaz real', previewTitle: 'Un día claro para niños y padres', previewTasks: ['Cepillarse los dientes solo', 'Leer concentrado durante 20 minutos'], previewReward: '120 estrellas: elegir el postre del fin de semana',
    assurances: ['Prueba de 7 días, sin tarjeta', 'Los padres aprueban tareas y premios', 'Sincronización cloud entre dispositivos'],
    safetyTitle: 'Los padres mantienen el control', safetyBody: 'Los perfiles infantiles son privados por defecto. Los padres controlan tareas, estrellas, premios y clasificaciones.',
    faqTitle: 'Preguntas frecuentes', faq: [{ question: '¿Se cobra automáticamente después de 7 días?', answer: 'No. La prueba no requiere tarjeta ni se renueva automáticamente.' }, { question: '¿Cómo entra el niño en la aplicación?', answer: 'Escanea el QR o introduce el código familiar para abrir su interfaz.' }, { question: '¿Los datos aparecen en otro dispositivo?', answer: 'Sí. Los datos de la familia conectada se sincronizan en la nube.' }],
    finalTitle: 'Empieza hoy con una pequeña acción', finalBody: 'Crea el perfil, recibe sugerencias por edad y seguid juntos el progreso.', docs: 'Leer la guía',
    plans: { solo_monthly: { name: 'Un niño', badge: 'Inicio sencillo', limit: 'Para 1 niño' }, monthly: { name: 'Familia · Mensual', badge: 'Más popular', limit: 'Niños ilimitados' }, yearly: { name: 'Familia · Anual', badge: 'Mayor ahorro', limit: 'Niños ilimitados' } },
  },
  zh: {
    previewLabel: '真实界面中的示例数据', previewTitle: '孩子和家长都清楚的一天', previewTasks: ['独立完成早晨刷牙', '专注阅读 20 分钟'], previewReward: '使用 120 颗星：选择周末甜点',
    assurances: ['免费体验 7 天，无需银行卡', '任务和奖励由家长确认', '多设备云端同步'],
    safetyTitle: '控制权始终在家长手中', safetyBody: '孩子档案默认私密。家长决定任务、星星、奖励以及是否启用排行榜。',
    faqTitle: '常见问题', faq: [{ question: '7 天后会自动扣费吗？', answer: '不会。体验无需银行卡，也不会自动续费或扣款。' }, { question: '孩子如何进入应用？', answer: '扫描二维码或输入家庭码，即可进入儿童专属界面。' }, { question: '换设备后还能看到数据吗？', answer: '可以。登录后的家庭数据会通过云端同步。' }],
    finalTitle: '今天从一件小事开始', finalBody: '创建孩子档案，获得适龄建议，并在一个地方一起查看进度。', docs: '查看使用指南',
    plans: { solo_monthly: { name: '单个孩子', badge: '轻松开始', limit: '适用于 1 个孩子' }, monthly: { name: '家庭 · 月付', badge: '最受欢迎', limit: '孩子人数不限' }, yearly: { name: '家庭 · 年付', badge: '最省钱', limit: '孩子人数不限' } },
  },
  ja: {
    previewLabel: '実際の画面を使ったサンプルデータ', previewTitle: '子どもと保護者に分かりやすい一日', previewTasks: ['朝の歯みがきを自分でする', '20分集中して読書する'], previewReward: '120スター：週末のデザートを選ぶ',
    assurances: ['7日間体験、カード不要', '課題とご褒美は保護者が承認', '複数端末でクラウド同期'],
    safetyTitle: '管理するのは常に保護者です', safetyBody: '子どものプロフィールは初期設定で非公開です。課題、スター、ご褒美、ランキング利用を保護者が決めます。',
    faqTitle: 'よくある質問', faq: [{ question: '7日後に自動課金されますか？', answer: 'いいえ。カードは不要で、自動更新や自動課金もありません。' }, { question: '子どもはどうやって入りますか？', answer: 'QRコードを読み取るか家族コードを入力して、子ども専用画面を開きます。' }, { question: '別の端末でもデータを使えますか？', answer: 'はい。ログイン中の家族データはクラウドで同期されます。' }],
    finalTitle: '今日、小さな一歩から始めましょう', finalBody: 'プロフィールを作り、年齢別の提案を受け取り、一緒に進捗を確認できます。', docs: '使い方を見る',
    plans: { solo_monthly: { name: 'ひとりプラン', badge: '気軽にスタート', limit: '子ども1人向け' }, monthly: { name: 'ファミリー · 月額', badge: '一番人気', limit: '子どもの人数無制限' }, yearly: { name: 'ファミリー · 年額', badge: '最もお得', limit: '子どもの人数無制限' } },
  },
  ko: {
    previewLabel: '실제 화면의 예시 데이터', previewTitle: '아이와 부모 모두에게 명확한 하루', previewTasks: ['아침 양치 스스로 하기', '20분 집중해서 책 읽기'], previewReward: '별 120개 사용: 주말 디저트 선택',
    assurances: ['7일 체험, 카드 불필요', '부모가 활동과 보상을 승인', '여러 기기에서 클라우드 동기화'],
    safetyTitle: '통제권은 항상 부모에게 있습니다', safetyBody: '아이 프로필은 기본적으로 비공개입니다. 활동, 별, 보상, 순위표 사용 여부를 부모가 결정합니다.',
    faqTitle: '자주 묻는 질문', faq: [{ question: '7일 후 자동 결제되나요?', answer: '아니요. 카드가 필요 없고 자동 갱신이나 자동 결제가 없습니다.' }, { question: '아이는 어떻게 접속하나요?', answer: 'QR을 스캔하거나 가족 코드를 입력하면 아이 전용 화면이 열립니다.' }, { question: '다른 기기에서도 데이터를 볼 수 있나요?', answer: '네. 로그인한 가족 데이터는 클라우드로 동기화됩니다.' }],
    finalTitle: '오늘 작은 활동 하나로 시작하세요', finalBody: '아이 프로필을 만들고 연령별 추천을 받아 한곳에서 함께 진행 상황을 확인하세요.', docs: '사용 안내 보기',
    plans: { solo_monthly: { name: '한 아이', badge: '가볍게 시작', limit: '아이 1명용' }, monthly: { name: '가족 · 월간', badge: '가장 인기', limit: '아이 수 무제한' }, yearly: { name: '가족 · 연간', badge: '최고의 절약', limit: '아이 수 무제한' } },
  },
};

export function getLandingSalesCopy(language: Language): LandingSalesCopy {
  return COPY[language];
}
