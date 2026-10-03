import type { Language } from '@/types';

export type CustomerProfilePromptCopy = {
  modalLabel: string;
  title: string;
  description: string;
  fullName: string;
  phone: string;
  phonePlaceholder: string;
  invalidPhone: string;
  invalidName: string;
  loading: string;
  loadFailed: string;
  retry: string;
  email: string;
  marketingConsent: string;
  signOut: string;
  saving: string;
  save: string;
  errors: Record<'network_error' | 'invalid_response' | 'service_unavailable' | 'session_expired', string>;
  supportCode: (code: string) => string;
};

export const COPY: Record<Language, CustomerProfilePromptCopy> = {
  vi: {
    invalidName: 'Vui lòng nhập họ tên có ít nhất 2 ký tự.', loading: 'Đang tải thông tin khách hàng…', loadFailed: 'Chưa tải được thông tin khách hàng. Vui lòng thử lại.', retry: 'Thử lại',
    modalLabel: 'Hoàn thiện thông tin khách hàng',
    title: 'Hoàn thiện thông tin của bạn',
    description: 'Nhập họ tên và số điện thoại để được hỗ trợ thanh toán. Thông tin được lưu cho những lần thanh toán sau; bạn chỉ cần nhập một lần.',
    fullName: 'Họ và tên', phone: 'Số điện thoại', phonePlaceholder: 'Ví dụ: 0912 345 678',
    invalidPhone: 'Số điện thoại chưa hợp lệ. Hãy nhập 9 đến 15 chữ số.', email: 'Email',
    marketingConsent: 'Tôi đồng ý nhận hướng dẫn và ưu đãi phù hợp từ KidHabit. Có thể tắt bất kỳ lúc nào.',
    signOut: 'Đăng xuất', saving: 'Đang lưu…', save: 'Lưu và tiếp tục',
    errors: {
      network_error: 'Kết nối bị gián đoạn. Kiểm tra mạng rồi thử lại.',
      invalid_response: 'KidHabit chưa xác nhận được việc lưu. Vui lòng thử lại.',
      service_unavailable: 'KidHabit chưa thể lưu thông tin lúc này. Vui lòng thử lại.',
      session_expired: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.',
    },
    supportCode: (code) => ` Mã hỗ trợ: ${code}.`,
  },
  en: {
    invalidName: 'Enter a full name with at least 2 characters.', loading: 'Loading customer details…', loadFailed: 'Could not load customer details. Please try again.', retry: 'Try again',
    modalLabel: 'Complete customer details', title: 'Complete your details',
    description: 'Enter your full name and phone number for payment support. Your details are saved for future payments; you only enter them once.',
    fullName: 'Full name', phone: 'Phone number', phonePlaceholder: 'Example: 0912 345 678',
    invalidPhone: 'Invalid phone number. Enter 9 to 15 digits.', email: 'Email',
    marketingConsent: 'I agree to receive relevant tips and offers from KidHabit. I can opt out at any time.',
    signOut: 'Sign out', saving: 'Saving…', save: 'Save and continue',
    errors: {
      network_error: 'Connection interrupted. Check your network and try again.',
      invalid_response: 'KidHabit could not confirm the save. Please try again.',
      service_unavailable: 'KidHabit cannot save your details right now. Please try again.',
      session_expired: 'Your session has expired. Sign in again to continue.',
    },
    supportCode: (code) => ` Support code: ${code}.`,
  },
  fr: {
    invalidName: 'Saisissez un nom complet d’au moins 2 caractères.', loading: 'Chargement des informations client…', loadFailed: 'Impossible de charger les informations client. Réessayez.', retry: 'Réessayer',
    modalLabel: 'Compléter les informations client', title: 'Complétez vos informations',
    description: 'Saisissez votre nom complet et votre téléphone pour l’assistance au paiement. Ces informations sont conservées pour les prochains paiements ; une seule saisie suffit.',
    fullName: 'Nom complet', phone: 'Numéro de téléphone', phonePlaceholder: 'Exemple : 0912 345 678',
    invalidPhone: 'Numéro de téléphone invalide. Saisissez entre 9 et 15 chiffres.', email: 'E-mail',
    marketingConsent: 'J’accepte de recevoir des conseils et des offres adaptés de KidHabit. Je peux me désinscrire à tout moment.',
    signOut: 'Se déconnecter', saving: 'Enregistrement…', save: 'Enregistrer et continuer',
    errors: {
      network_error: 'Connexion interrompue. Vérifiez votre réseau et réessayez.',
      invalid_response: 'KidHabit n’a pas pu confirmer l’enregistrement. Veuillez réessayer.',
      service_unavailable: 'KidHabit ne peut pas enregistrer vos informations pour le moment. Veuillez réessayer.',
      session_expired: 'Votre session a expiré. Reconnectez-vous pour continuer.',
    },
    supportCode: (code) => ` Code d’assistance : ${code}.`,
  },
  de: {
    invalidName: 'Gib einen vollständigen Namen mit mindestens 2 Zeichen ein.', loading: 'Kundendaten werden geladen…', loadFailed: 'Kundendaten konnten nicht geladen werden. Bitte erneut versuchen.', retry: 'Erneut versuchen',
    modalLabel: 'Kundendaten vervollständigen', title: 'Vervollständige deine Angaben',
    description: 'Gib deinen vollständigen Namen und deine Telefonnummer für Unterstützung bei der Zahlung ein. Die Angaben werden für weitere Zahlungen gespeichert; du gibst sie nur einmal ein.',
    fullName: 'Vollständiger Name', phone: 'Telefonnummer', phonePlaceholder: 'Beispiel: 0912 345 678',
    invalidPhone: 'Ungültige Telefonnummer. Gib 9 bis 15 Ziffern ein.', email: 'E-Mail',
    marketingConsent: 'Ich möchte passende Tipps und Angebote von KidHabit erhalten. Ich kann mich jederzeit abmelden.',
    signOut: 'Abmelden', saving: 'Wird gespeichert…', save: 'Speichern und weiter',
    errors: {
      network_error: 'Verbindung unterbrochen. Prüfe dein Netzwerk und versuche es erneut.',
      invalid_response: 'KidHabit konnte das Speichern nicht bestätigen. Bitte versuche es erneut.',
      service_unavailable: 'KidHabit kann deine Angaben gerade nicht speichern. Bitte versuche es erneut.',
      session_expired: 'Deine Sitzung ist abgelaufen. Melde dich erneut an, um fortzufahren.',
    },
    supportCode: (code) => ` Support-Code: ${code}.`,
  },
  it: {
    invalidName: 'Inserisci un nome completo di almeno 2 caratteri.', loading: 'Caricamento dei dati cliente…', loadFailed: 'Impossibile caricare i dati cliente. Riprova.', retry: 'Riprova',
    modalLabel: 'Completa i dati cliente', title: 'Completa i tuoi dati',
    description: 'Inserisci nome completo e telefono per ricevere assistenza sul pagamento. I dati vengono salvati per i pagamenti futuri; basta inserirli una volta.',
    fullName: 'Nome completo', phone: 'Numero di telefono', phonePlaceholder: 'Esempio: 0912 345 678',
    invalidPhone: 'Numero di telefono non valido. Inserisci da 9 a 15 cifre.', email: 'Email',
    marketingConsent: 'Acconsento a ricevere consigli e offerte pertinenti da KidHabit. Posso disattivarli in qualsiasi momento.',
    signOut: 'Esci', saving: 'Salvataggio…', save: 'Salva e continua',
    errors: {
      network_error: 'Connessione interrotta. Controlla la rete e riprova.',
      invalid_response: 'KidHabit non ha potuto confermare il salvataggio. Riprova.',
      service_unavailable: 'KidHabit non può salvare i tuoi dati in questo momento. Riprova.',
      session_expired: 'La sessione è scaduta. Accedi di nuovo per continuare.',
    },
    supportCode: (code) => ` Codice di assistenza: ${code}.`,
  },
  es: {
    invalidName: 'Introduce un nombre completo de al menos 2 caracteres.', loading: 'Cargando datos del cliente…', loadFailed: 'No se pudieron cargar los datos del cliente. Inténtalo de nuevo.', retry: 'Intentar de nuevo',
    modalLabel: 'Completar datos del cliente', title: 'Completa tus datos',
    description: 'Introduce tu nombre completo y teléfono para recibir ayuda con el pago. Tus datos se guardan para próximos pagos; solo los introduces una vez.',
    fullName: 'Nombre completo', phone: 'Número de teléfono', phonePlaceholder: 'Ejemplo: 0912 345 678',
    invalidPhone: 'Número de teléfono no válido. Introduce entre 9 y 15 dígitos.', email: 'Correo electrónico',
    marketingConsent: 'Acepto recibir consejos y ofertas relevantes de KidHabit. Puedo darme de baja en cualquier momento.',
    signOut: 'Cerrar sesión', saving: 'Guardando…', save: 'Guardar y continuar',
    errors: {
      network_error: 'Conexión interrumpida. Comprueba tu red e inténtalo de nuevo.',
      invalid_response: 'KidHabit no pudo confirmar que se guardaron los datos. Inténtalo de nuevo.',
      service_unavailable: 'KidHabit no puede guardar tus datos ahora. Inténtalo de nuevo.',
      session_expired: 'Tu sesión ha caducado. Inicia sesión de nuevo para continuar.',
    },
    supportCode: (code) => ` Código de asistencia: ${code}.`,
  },
  zh: {
    invalidName: '请输入至少 2 个字符的姓名。', loading: '正在加载客户信息…', loadFailed: '无法加载客户信息，请重试。', retry: '重试',
    modalLabel: '完善客户信息', title: '完善你的信息',
    description: '请填写姓名和电话号码，以便提供支付支持。信息会保存供下次支付使用，只需填写一次。',
    fullName: '姓名', phone: '电话号码', phonePlaceholder: '例如：0912 345 678',
    invalidPhone: '电话号码无效。请输入 9 至 15 位数字。', email: '电子邮箱',
    marketingConsent: '我同意接收 KidHabit 提供的相关指南和优惠，可随时取消。',
    signOut: '退出登录', saving: '正在保存…', save: '保存并继续',
    errors: {
      network_error: '连接中断。请检查网络后重试。',
      invalid_response: 'KidHabit 无法确认是否保存成功。请重试。',
      service_unavailable: 'KidHabit 暂时无法保存信息。请重试。',
      session_expired: '登录已过期。请重新登录以继续。',
    },
    supportCode: (code) => ` 支持代码：${code}。`,
  },
  ja: {
    invalidName: '氏名を2文字以上で入力してください。', loading: 'お客様情報を読み込み中…', loadFailed: 'お客様情報を読み込めませんでした。再度お試しください。', retry: '再試行',
    modalLabel: 'お客様情報の入力', title: 'あなたの情報を入力してください',
    description: 'お支払いのサポートのため、氏名と電話番号を入力してください。次回以降のお支払い用に保存され、入力は一度だけです。',
    fullName: '氏名', phone: '電話番号', phonePlaceholder: '例：0912 345 678',
    invalidPhone: '電話番号が正しくありません。9〜15 桁の数字を入力してください。', email: 'メールアドレス',
    marketingConsent: 'KidHabit から役立つガイドや特典を受け取ることに同意します。いつでも解除できます。',
    signOut: 'ログアウト', saving: '保存中…', save: '保存して続ける',
    errors: {
      network_error: '接続が切れました。ネットワークを確認して、もう一度お試しください。',
      invalid_response: 'KidHabit が保存を確認できませんでした。もう一度お試しください。',
      service_unavailable: '現在、KidHabit は情報を保存できません。もう一度お試しください。',
      session_expired: 'ログインの有効期限が切れました。再度ログインして続けてください。',
    },
    supportCode: (code) => ` サポートコード：${code}。`,
  },
  ko: {
    invalidName: '이름을 2자 이상 입력해 주세요.', loading: '고객 정보 불러오는 중…', loadFailed: '고객 정보를 불러오지 못했습니다. 다시 시도해 주세요.', retry: '다시 시도',
    modalLabel: '고객 정보 입력', title: '정보를 입력해 주세요',
    description: '결제 지원을 위해 이름과 전화번호를 입력해 주세요. 다음 결제를 위해 저장되므로 한 번만 입력하면 됩니다.',
    fullName: '이름', phone: '전화번호', phonePlaceholder: '예: 0912 345 678',
    invalidPhone: '올바르지 않은 전화번호입니다. 숫자 9~15자리를 입력해 주세요.', email: '이메일',
    marketingConsent: 'KidHabit의 유용한 안내와 혜택을 받는 데 동의합니다. 언제든지 해제할 수 있습니다.',
    signOut: '로그아웃', saving: '저장 중…', save: '저장하고 계속',
    errors: {
      network_error: '연결이 끊겼습니다. 네트워크를 확인하고 다시 시도해 주세요.',
      invalid_response: 'KidHabit이 저장 여부를 확인하지 못했습니다. 다시 시도해 주세요.',
      service_unavailable: '지금은 KidHabit이 정보를 저장할 수 없습니다. 다시 시도해 주세요.',
      session_expired: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
    },
    supportCode: (code) => ` 지원 코드: ${code}.`,
  },
};

export function getCustomerProfilePromptCopy(language: Language): CustomerProfilePromptCopy {
  return COPY[language];
}
