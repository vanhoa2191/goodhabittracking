import type { Language } from '@/types';

export type CheckoutEntryCopy = {
  readonly loginError: string;
  readonly resultTitle: string;
  readonly openApp: string;
  readonly invalidTitle: string;
  readonly invalidBody: string;
  readonly viewPricing: string;
  readonly home: string;
  readonly selectedPlan: string;
  readonly signIn: string;
  readonly parentOnly: string;
  readonly loading: string;
  readonly continue: string;
  readonly oneTime: string;
};

const COPY: Record<Language, CheckoutEntryCopy> = {
  vi: {
    loginError: 'Không thể mở đăng nhập Google. Vui lòng thử lại.',
    resultTitle: 'Kết quả thanh toán',
    openApp: 'Vào ứng dụng',
    invalidTitle: 'Gói thanh toán không hợp lệ',
    invalidBody: 'Liên kết có thể đã cũ hoặc thiếu thông tin gói. Hãy chọn lại gói phù hợp từ bảng giá KidHabit.',
    viewPricing: 'Xem bảng giá',
    home: 'Về trang chủ',
    selectedPlan: 'Gói bạn đã chọn',
    signIn: 'Đăng nhập để thanh toán',
    parentOnly: 'Chỉ phụ huynh trong gia đình mới có thể thanh toán.',
    loading: 'Đang tải thông tin gia đình để tiếp tục thanh toán…',
    continue: 'Tiếp tục thanh toán',
    oneTime: 'Thanh toán một lần qua PayOS. KidHabit không tự động gia hạn.',
  },
  en: {
    loginError: 'Google sign-in could not be opened. Please try again.',
    resultTitle: 'Payment result',
    openApp: 'Open the app',
    invalidTitle: 'This payment plan is not valid',
    invalidBody: 'The link may be old or missing the plan details. Please choose a plan again from the KidHabit pricing page.',
    viewPricing: 'See pricing',
    home: 'Back to home',
    selectedPlan: 'The plan you chose',
    signIn: 'Sign in to pay',
    parentOnly: 'Only a parent in the family can pay.',
    loading: 'Loading the family details so you can continue to payment…',
    continue: 'Continue to payment',
    oneTime: 'One payment through PayOS. KidHabit does not renew automatically.',
  },
  fr: {
    loginError: 'La connexion Google n’a pas pu s’ouvrir. Veuillez réessayer.',
    resultTitle: 'Résultat du paiement',
    openApp: 'Ouvrir l’application',
    invalidTitle: 'Ce forfait de paiement n’est pas valide',
    invalidBody: 'Le lien est peut-être ancien ou il manque les détails du forfait. Choisissez de nouveau un forfait depuis la page des tarifs KidHabit.',
    viewPricing: 'Voir les tarifs',
    home: 'Retour à l’accueil',
    selectedPlan: 'Le forfait choisi',
    signIn: 'Se connecter pour payer',
    parentOnly: 'Seul un parent de la famille peut payer.',
    loading: 'Chargement des informations de la famille pour continuer le paiement…',
    continue: 'Continuer vers le paiement',
    oneTime: 'Un seul paiement via PayOS. KidHabit ne se renouvelle pas automatiquement.',
  },
  de: {
    loginError: 'Die Google-Anmeldung konnte nicht geöffnet werden. Bitte versuche es erneut.',
    resultTitle: 'Zahlungsergebnis',
    openApp: 'App öffnen',
    invalidTitle: 'Dieses Zahlungspaket ist ungültig',
    invalidBody: 'Der Link ist möglicherweise veraltet oder es fehlen die Angaben zum Paket. Bitte wähle auf der KidHabit-Preisseite erneut ein Paket aus.',
    viewPricing: 'Preise ansehen',
    home: 'Zurück zur Startseite',
    selectedPlan: 'Dein gewähltes Paket',
    signIn: 'Zum Bezahlen anmelden',
    parentOnly: 'Nur ein Elternteil der Familie kann bezahlen.',
    loading: 'Familiendaten werden geladen, damit du zur Zahlung fortfahren kannst …',
    continue: 'Weiter zur Zahlung',
    oneTime: 'Einmalige Zahlung über PayOS. KidHabit verlängert sich nicht automatisch.',
  },
  it: {
    loginError: 'Non è stato possibile aprire l’accesso con Google. Riprova.',
    resultTitle: 'Esito del pagamento',
    openApp: 'Apri l’app',
    invalidTitle: 'Questo piano di pagamento non è valido',
    invalidBody: 'Il link potrebbe essere vecchio o privo dei dettagli del piano. Scegli di nuovo un piano dalla pagina dei prezzi di KidHabit.',
    viewPricing: 'Vedi i prezzi',
    home: 'Torna alla home',
    selectedPlan: 'Il piano che hai scelto',
    signIn: 'Accedi per pagare',
    parentOnly: 'Solo un genitore della famiglia può pagare.',
    loading: 'Caricamento dei dati della famiglia per proseguire con il pagamento…',
    continue: 'Continua con il pagamento',
    oneTime: 'Un solo pagamento tramite PayOS. KidHabit non si rinnova automaticamente.',
  },
  es: {
    loginError: 'No se pudo abrir el inicio de sesión de Google. Inténtalo de nuevo.',
    resultTitle: 'Resultado del pago',
    openApp: 'Abrir la app',
    invalidTitle: 'Este plan de pago no es válido',
    invalidBody: 'Es posible que el enlace sea antiguo o le falten los datos del plan. Elige de nuevo un plan en la página de precios de KidHabit.',
    viewPricing: 'Ver precios',
    home: 'Volver al inicio',
    selectedPlan: 'El plan que elegiste',
    signIn: 'Inicia sesión para pagar',
    parentOnly: 'Solo un padre o madre de la familia puede pagar.',
    loading: 'Cargando los datos de la familia para continuar con el pago…',
    continue: 'Continuar con el pago',
    oneTime: 'Un solo pago a través de PayOS. KidHabit no se renueva automáticamente.',
  },
  zh: {
    loginError: '无法打开 Google 登录。请重试。',
    resultTitle: '支付结果',
    openApp: '进入应用',
    invalidTitle: '此付款套餐无效',
    invalidBody: '链接可能已过期或缺少套餐信息。请从 KidHabit 价格页重新选择套餐。',
    viewPricing: '查看价格',
    home: '返回首页',
    selectedPlan: '你选择的套餐',
    signIn: '登录后支付',
    parentOnly: '只有家庭里的家长才能付款。',
    loading: '正在加载家庭信息，以便继续付款…',
    continue: '继续付款',
    oneTime: '通过 PayOS 一次性付款。KidHabit 不会自动续费。',
  },
  ja: {
    loginError: 'Googleログインを開けませんでした。もう一度お試しください。',
    resultTitle: 'お支払いの結果',
    openApp: 'アプリを開く',
    invalidTitle: 'このお支払いプランは無効です',
    invalidBody: 'リンクが古いか、プランの情報が足りない可能性があります。KidHabit の料金ページからもう一度プランを選んでください。',
    viewPricing: '料金を見る',
    home: 'ホームに戻る',
    selectedPlan: '選んだプラン',
    signIn: 'ログインして支払う',
    parentOnly: 'お支払いができるのは家族の保護者だけです。',
    loading: 'お支払いを続けるため、家族の情報を読み込んでいます…',
    continue: 'お支払いに進む',
    oneTime: 'PayOS での1回払いです。KidHabit は自動更新されません。',
  },
  ko: {
    loginError: 'Google 로그인을 열 수 없어요. 다시 시도해 주세요.',
    resultTitle: '결제 결과',
    openApp: '앱 열기',
    invalidTitle: '이 결제 요금제는 올바르지 않아요',
    invalidBody: '링크가 오래되었거나 요금제 정보가 빠졌을 수 있어요. KidHabit 요금 페이지에서 다시 선택해 주세요.',
    viewPricing: '요금 보기',
    home: '홈으로 돌아가기',
    selectedPlan: '선택한 요금제',
    signIn: '로그인하고 결제하기',
    parentOnly: '가족의 부모님만 결제할 수 있어요.',
    loading: '결제를 이어가기 위해 가족 정보를 불러오는 중…',
    continue: '결제 계속하기',
    oneTime: 'PayOS로 한 번만 결제해요. KidHabit은 자동으로 갱신되지 않아요.',
  },
};

export function getCheckoutEntryCopy(language: Language): CheckoutEntryCopy {
  return COPY[language] ?? COPY.en;
}
