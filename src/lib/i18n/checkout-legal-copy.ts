import type { Language } from '@/types';

export type CheckoutLegalCopy = {
  readonly signInRequired: string;
  readonly confirmTitle: string;
  readonly confirmBody: string;
  readonly agreeTemplate: string;
  readonly termsLink: string;
  readonly privacyLink: string;
  readonly continueButton: string;
};

const COPY: Record<Language, CheckoutLegalCopy> = {
  vi: {
    signInRequired: 'Vui lòng đăng nhập bằng tài khoản phụ huynh và chờ dữ liệu gia đình tải xong trước khi thanh toán.',
    confirmTitle: 'Xác nhận trước khi tạo đơn',
    confirmBody: 'Bạn sẽ thanh toán một lần cho kỳ đã chọn. KidHabit không tự động gia hạn hoặc tự động trừ tiền kỳ tiếp theo.',
    agreeTemplate: 'Tôi đã đọc và đồng ý với [terms] và [privacy].',
    termsLink: 'Điều khoản sử dụng',
    privacyLink: 'Quyền riêng tư',
    continueButton: 'Tiếp tục tạo đơn thanh toán',
  },
  en: {
    signInRequired: 'Please sign in with a parent account and wait for the family data to finish loading before you pay.',
    confirmTitle: 'Confirm before we create the order',
    confirmBody: 'You will pay once for the period you chose. KidHabit does not renew automatically or charge you again for the next period.',
    agreeTemplate: 'I have read and agree to the [terms] and the [privacy].',
    termsLink: 'Terms of Use',
    privacyLink: 'Privacy Policy',
    continueButton: 'Continue to create the payment order',
  },
  fr: {
    signInRequired: 'Veuillez vous connecter avec un compte parent et attendre le chargement complet des données de la famille avant de payer.',
    confirmTitle: 'Confirmez avant de créer la commande',
    confirmBody: 'Vous paierez une seule fois pour la période choisie. KidHabit ne renouvelle pas automatiquement votre abonnement et ne vous facture pas la période suivante.',
    agreeTemplate: 'J\'ai lu et j\'accepte les [terms] et la [privacy].',
    termsLink: 'Conditions d\'utilisation',
    privacyLink: 'Politique de confidentialité',
    continueButton: 'Continuer pour créer la commande de paiement',
  },
  de: {
    signInRequired: 'Bitte melde dich mit einem Elternkonto an und warte, bis die Familiendaten vollständig geladen sind, bevor du bezahlst.',
    confirmTitle: 'Bestätige, bevor wir die Bestellung erstellen',
    confirmBody: 'Du zahlst einmal für den ausgewählten Zeitraum. KidHabit verlängert nicht automatisch und berechnet dir den nächsten Zeitraum nicht erneut.',
    agreeTemplate: 'Ich habe die [terms] und die [privacy] gelesen und stimme ihnen zu.',
    termsLink: 'Nutzungsbedingungen',
    privacyLink: 'Datenschutzerklärung',
    continueButton: 'Mit der Erstellung der Zahlungsbestellung fortfahren',
  },
  it: {
    signInRequired: 'Accedi con un account genitore e attendi che i dati della famiglia siano completamente caricati prima di pagare.',
    confirmTitle: 'Conferma prima di creare l\'ordine',
    confirmBody: 'Pagherai una sola volta per il periodo scelto. KidHabit non rinnova automaticamente e non addebita il periodo successivo.',
    agreeTemplate: 'Ho letto e accetto i [terms] e la [privacy].',
    termsLink: 'Termini di utilizzo',
    privacyLink: 'Informativa sulla privacy',
    continueButton: 'Continua per creare l\'ordine di pagamento',
  },
  es: {
    signInRequired: 'Inicia sesión con una cuenta de padre o madre y espera a que los datos de la familia terminen de cargarse antes de pagar.',
    confirmTitle: 'Confirma antes de crear el pedido',
    confirmBody: 'Pagarás una sola vez por el periodo que elegiste. KidHabit no renueva automáticamente ni te cobra de nuevo el siguiente periodo.',
    agreeTemplate: 'He leído y acepto los [terms] y la [privacy].',
    termsLink: 'Condiciones de uso',
    privacyLink: 'Política de privacidad',
    continueButton: 'Continuar para crear el pedido de pago',
  },
  zh: {
    signInRequired: '请使用家长账号登录，并等待家庭数据加载完成后再付款。',
    confirmTitle: '创建订单前请确认',
    confirmBody: '你只需为所选周期支付一次。KidHabit 不会自动续期，也不会再次收取下一周期的费用。',
    agreeTemplate: '我已阅读并同意[terms]和[privacy]。',
    termsLink: '使用条款',
    privacyLink: '隐私政策',
    continueButton: '继续创建支付订单',
  },
  ja: {
    signInRequired: '保護者アカウントでログインし、家族データの読み込みが完了してからお支払いください。',
    confirmTitle: '注文を作成する前に確認',
    confirmBody: '選択した期間分を一度だけお支払いいただきます。KidHabitが自動更新したり、次の期間分を再度請求したりすることはありません。',
    agreeTemplate: '[terms]と[privacy]を読み、同意します。',
    termsLink: '利用規約',
    privacyLink: 'プライバシーポリシー',
    continueButton: '支払い注文を作成して続行',
  },
  ko: {
    signInRequired: '부모 계정으로 로그인하고 가족 데이터가 모두 로드될 때까지 기다린 후 결제해 주세요。',
    confirmTitle: '주문을 만들기 전에 확인해 주세요',
    confirmBody: '선택한 기간에 대해 한 번만 결제합니다. KidHabit은 자동으로 갱신하거나 다음 기간의 요금을 다시 청구하지 않습니다。',
    agreeTemplate: '[terms] 및 [privacy]을(를) 읽고 동의합니다.',
    termsLink: '이용약관',
    privacyLink: '개인정보 처리방침',
    continueButton: '계속해서 결제 주문 만들기',
  },
};

export function getCheckoutLegalCopy(language: Language): CheckoutLegalCopy {
  return COPY[language] ?? COPY.en;
}
