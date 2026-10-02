import type { Language } from '@/types';

export type StartTrialEntryCopy = {
  home: string;
  title: string;
  description: string;
  benefits: readonly string[];
  googleSignIn: string;
  loginError: string;
  parentOnly: string;
  loadingFamily: string;
  setupFamily: string;
  activating: string;
  startTrial: string;
  openingApp: string;
  trialUsed: string;
  trialError: string;
  pricing: string;
  consentPrefix: string;
  terms: string;
  consentJoin: string;
  privacy: string;
  consentSuffix: string;
};

export const COPY: Record<Language, StartTrialEntryCopy> = {
  vi: {
    home: 'Về trang chủ', title: 'Bắt đầu 7 ngày dùng thử',
    description: 'Không cần thẻ tín dụng. KidHabit không tự động trừ tiền khi hết thời gian dùng thử.',
    benefits: ['Đăng nhập bằng Google, chỉ mất vài giây', 'Tạo hồ sơ cho bé và nhận gợi ý thói quen theo độ tuổi', 'Ghép thiết bị của bé bằng mã QR, bé không cần tài khoản', 'Dùng đầy đủ tính năng trong 7 ngày'],
    googleSignIn: 'Đăng nhập bằng Google để bắt đầu', loginError: 'Không thể mở đăng nhập Google. Vui lòng thử lại.',
    parentOnly: 'Chỉ phụ huynh trong gia đình mới có thể bắt đầu dùng thử.', loadingFamily: 'Đang tải thông tin gia đình…',
    setupFamily: 'Thiết lập gia đình để bắt đầu', activating: 'Đang kích hoạt…', startTrial: 'Bắt đầu dùng thử 7 ngày', openingApp: 'Đang mở ứng dụng…',
    trialUsed: 'Gia đình này đã dùng thử trước đó. Hãy chọn một gói để tiếp tục.', trialError: 'Chưa thể bắt đầu dùng thử. Vui lòng thử lại sau ít phút.',
    pricing: 'Xem bảng giá', consentPrefix: 'Tiếp tục nghĩa là bạn đồng ý với ', terms: 'Điều khoản', consentJoin: ' và ', privacy: 'Quyền riêng tư', consentSuffix: '.',
  },
  en: {
    home: 'Back to home', title: 'Start your 7-day trial',
    description: 'No credit card needed. KidHabit will not charge you automatically when your trial ends.',
    benefits: ['Sign in with Google in seconds', 'Create a profile for your child and get age-based habit suggestions', 'Pair your child’s device with a QR code; your child needs no account', 'Enjoy all features for 7 days'],
    googleSignIn: 'Sign in with Google to start', loginError: 'Could not open Google sign-in. Please try again.',
    parentOnly: 'Only parents in the family can start a trial.', loadingFamily: 'Loading family details…',
    setupFamily: 'Set up your family to start', activating: 'Activating…', startTrial: 'Start 7-day trial', openingApp: 'Opening the app…',
    trialUsed: 'This family has already used a trial. Choose a plan to continue.', trialError: 'Could not start the trial. Please try again in a few minutes.',
    pricing: 'View pricing', consentPrefix: 'By continuing, you agree to our ', terms: 'Terms', consentJoin: ' and ', privacy: 'Privacy Policy', consentSuffix: '.',
  },
  fr: {
    home: 'Retour à l’accueil', title: 'Commencez votre essai de 7 jours',
    description: 'Aucune carte bancaire requise. KidHabit ne vous facturera pas automatiquement à la fin de l’essai.',
    benefits: ['Connectez-vous avec Google en quelques secondes', 'Créez un profil pour votre enfant et recevez des idées d’habitudes adaptées à son âge', 'Associez l’appareil de votre enfant par code QR, sans compte pour votre enfant', 'Profitez de toutes les fonctionnalités pendant 7 jours'],
    googleSignIn: 'Se connecter avec Google pour commencer', loginError: 'Impossible d’ouvrir la connexion Google. Veuillez réessayer.',
    parentOnly: 'Seuls les parents de la famille peuvent lancer un essai.', loadingFamily: 'Chargement des informations familiales…',
    setupFamily: 'Configurez votre famille pour commencer', activating: 'Activation…', startTrial: 'Commencer l’essai de 7 jours', openingApp: 'Ouverture de l’application…',
    trialUsed: 'Cette famille a déjà bénéficié d’un essai. Choisissez une offre pour continuer.', trialError: 'Impossible de lancer l’essai. Réessayez dans quelques minutes.',
    pricing: 'Voir les tarifs', consentPrefix: 'En continuant, vous acceptez nos ', terms: 'Conditions', consentJoin: ' et notre ', privacy: 'Politique de confidentialité', consentSuffix: '.',
  },
  de: {
    home: 'Zur Startseite', title: 'Starte deine 7-tägige Testphase',
    description: 'Keine Kreditkarte erforderlich. KidHabit bucht nach Ablauf der Testphase nicht automatisch Geld ab.',
    benefits: ['Melde dich in wenigen Sekunden mit Google an', 'Erstelle ein Profil für dein Kind und erhalte altersgerechte Vorschläge für Gewohnheiten', 'Verbinde das Gerät deines Kindes per QR-Code, ohne eigenes Konto für dein Kind', 'Nutze alle Funktionen 7 Tage lang'],
    googleSignIn: 'Mit Google anmelden und starten', loginError: 'Die Google-Anmeldung konnte nicht geöffnet werden. Bitte versuche es erneut.',
    parentOnly: 'Nur Eltern in der Familie können eine Testphase starten.', loadingFamily: 'Familiendaten werden geladen…',
    setupFamily: 'Familie einrichten und starten', activating: 'Wird aktiviert…', startTrial: '7-tägige Testphase starten', openingApp: 'App wird geöffnet…',
    trialUsed: 'Diese Familie hat die Testphase bereits genutzt. Wähle einen Tarif, um fortzufahren.', trialError: 'Die Testphase konnte nicht gestartet werden. Versuche es in ein paar Minuten erneut.',
    pricing: 'Preise ansehen', consentPrefix: 'Wenn du fortfährst, stimmst du unseren ', terms: 'Nutzungsbedingungen', consentJoin: ' und unserer ', privacy: 'Datenschutzerklärung', consentSuffix: ' zu.',
  },
  it: {
    home: 'Torna alla home', title: 'Inizia la prova di 7 giorni',
    description: 'Nessuna carta di credito richiesta. KidHabit non effettua addebiti automatici al termine della prova.',
    benefits: ['Accedi con Google in pochi secondi', 'Crea un profilo per tuo figlio e ricevi suggerimenti sulle abitudini adatti alla sua età', 'Collega il dispositivo di tuo figlio con un codice QR, senza un account per tuo figlio', 'Usa tutte le funzionalità per 7 giorni'],
    googleSignIn: 'Accedi con Google per iniziare', loginError: 'Impossibile aprire l’accesso con Google. Riprova.',
    parentOnly: 'Solo i genitori della famiglia possono iniziare una prova.', loadingFamily: 'Caricamento dei dati della famiglia…',
    setupFamily: 'Configura la famiglia per iniziare', activating: 'Attivazione…', startTrial: 'Inizia la prova di 7 giorni', openingApp: 'Apertura dell’app…',
    trialUsed: 'Questa famiglia ha già usato la prova. Scegli un piano per continuare.', trialError: 'Impossibile iniziare la prova. Riprova tra qualche minuto.',
    pricing: 'Vedi i prezzi', consentPrefix: 'Continuando, accetti i ', terms: 'Termini', consentJoin: ' e l’', privacy: 'Informativa sulla privacy', consentSuffix: '.',
  },
  es: {
    home: 'Volver al inicio', title: 'Empieza tu prueba de 7 días',
    description: 'No necesitas tarjeta de crédito. KidHabit no te cobrará automáticamente al finalizar la prueba.',
    benefits: ['Inicia sesión con Google en segundos', 'Crea un perfil para tu hijo y recibe sugerencias de hábitos según su edad', 'Vincula el dispositivo de tu hijo con un código QR, sin que necesite una cuenta', 'Disfruta de todas las funciones durante 7 días'],
    googleSignIn: 'Inicia sesión con Google para empezar', loginError: 'No se pudo abrir el inicio de sesión con Google. Inténtalo de nuevo.',
    parentOnly: 'Solo los padres de la familia pueden iniciar una prueba.', loadingFamily: 'Cargando datos de la familia…',
    setupFamily: 'Configura tu familia para empezar', activating: 'Activando…', startTrial: 'Empezar prueba de 7 días', openingApp: 'Abriendo la aplicación…',
    trialUsed: 'Esta familia ya ha usado la prueba. Elige un plan para continuar.', trialError: 'No se pudo iniciar la prueba. Inténtalo de nuevo en unos minutos.',
    pricing: 'Ver precios', consentPrefix: 'Al continuar, aceptas los ', terms: 'Términos', consentJoin: ' y la ', privacy: 'Política de privacidad', consentSuffix: '.',
  },
  zh: {
    home: '返回首页', title: '开始 7 天试用',
    description: '无需信用卡。试用结束后，KidHabit 不会自动扣费。',
    benefits: ['使用 Google 登录，只需几秒', '为孩子创建档案，获取适合其年龄的习惯建议', '通过二维码配对孩子的设备，孩子无需账户', '7 天内畅享全部功能'],
    googleSignIn: '使用 Google 登录并开始', loginError: '无法打开 Google 登录。请重试。',
    parentOnly: '只有家庭中的家长可以开始试用。', loadingFamily: '正在加载家庭信息…',
    setupFamily: '设置家庭以开始使用', activating: '正在激活…', startTrial: '开始 7 天试用', openingApp: '正在打开应用…',
    trialUsed: '此家庭已使用过试用。请选择套餐以继续。', trialError: '暂时无法开始试用。请稍后重试。',
    pricing: '查看价格', consentPrefix: '继续即表示你同意', terms: '使用条款', consentJoin: '和', privacy: '隐私政策', consentSuffix: '。',
  },
  ja: {
    home: 'ホームに戻る', title: '7 日間の無料体験を始める',
    description: 'クレジットカードは不要です。無料体験終了後に KidHabit が自動で課金することはありません。',
    benefits: ['Google で数秒でログイン', '子どものプロフィールを作成し、年齢に合った習慣の提案を受け取る', 'QR コードで子どもの端末を連携。子どものアカウントは不要', 'すべての機能を 7 日間利用'],
    googleSignIn: 'Google でログインして始める', loginError: 'Google ログインを開けませんでした。もう一度お試しください。',
    parentOnly: '無料体験を開始できるのは家族の保護者のみです。', loadingFamily: '家族の情報を読み込み中…',
    setupFamily: '家族を設定して始める', activating: '有効化中…', startTrial: '7 日間の無料体験を始める', openingApp: 'アプリを開いています…',
    trialUsed: 'この家族はすでに無料体験を利用しています。続けるにはプランを選んでください。', trialError: '無料体験を開始できませんでした。数分後にもう一度お試しください。',
    pricing: '料金を見る', consentPrefix: '続行すると、', terms: '利用規約', consentJoin: 'と', privacy: 'プライバシーポリシー', consentSuffix: 'に同意したことになります。',
  },
  ko: {
    home: '홈으로 돌아가기', title: '7일 무료 체험 시작',
    description: '신용카드가 필요하지 않습니다. KidHabit은 체험 종료 후 자동으로 결제하지 않습니다.',
    benefits: ['Google로 몇 초 만에 로그인', '아이의 프로필을 만들고 연령에 맞는 습관 추천 받기', 'QR 코드로 아이의 기기 연결, 아이 계정은 필요 없음', '7일 동안 모든 기능 이용'],
    googleSignIn: 'Google로 로그인하고 시작', loginError: 'Google 로그인을 열 수 없습니다. 다시 시도해 주세요.',
    parentOnly: '가족의 보호자만 체험을 시작할 수 있습니다.', loadingFamily: '가족 정보 불러오는 중…',
    setupFamily: '가족을 설정하고 시작', activating: '활성화 중…', startTrial: '7일 무료 체험 시작', openingApp: '앱을 여는 중…',
    trialUsed: '이 가족은 이미 체험을 이용했습니다. 계속하려면 요금제를 선택해 주세요.', trialError: '체험을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    pricing: '요금 보기', consentPrefix: '계속하면 ', terms: '이용약관', consentJoin: ' 및 ', privacy: '개인정보 처리방침', consentSuffix: '에 동의하게 됩니다.',
  },
};

export function getStartTrialEntryCopy(language: Language): StartTrialEntryCopy {
  return COPY[language];
}
