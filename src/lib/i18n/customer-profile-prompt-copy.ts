import type { Language } from '@/types';

export type CustomerProfilePromptCopy = {
  modalLabel: string;
  title: string;
  description: string;
  fullName: string;
  phone: string;
  phonePlaceholder: string;
  invalidPhone: string;
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
    modalLabel: 'Hoàn thiện thông tin khách hàng',
    title: 'Hoàn thiện thông tin của bạn',
    description: 'KidHabit cần họ tên và số điện thoại để hỗ trợ tài khoản và chăm sóc khách hàng khi bạn cần. Bạn chỉ phải nhập một lần.',
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
    modalLabel: 'Complete customer details', title: 'Complete your details',
    description: 'KidHabit needs your full name and phone number to help with your account and provide support when needed. You only need to enter them once.',
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
    modalLabel: 'Compléter les informations client', title: 'Complétez vos informations',
    description: 'KidHabit a besoin de votre nom complet et de votre numéro de téléphone pour vous aider avec votre compte et vous accompagner si nécessaire. Vous ne les saisissez qu’une seule fois.',
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
    modalLabel: 'Kundendaten vervollständigen', title: 'Vervollständige deine Angaben',
    description: 'KidHabit benötigt deinen vollständigen Namen und deine Telefonnummer, um dir bei deinem Konto zu helfen und dich bei Bedarf zu unterstützen. Du musst sie nur einmal eingeben.',
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
    modalLabel: 'Completa i dati cliente', title: 'Completa i tuoi dati',
    description: 'KidHabit ha bisogno del tuo nome completo e numero di telefono per aiutarti con il tuo account e offrirti assistenza quando serve. Devi inserirli una sola volta.',
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
    modalLabel: 'Completar datos del cliente', title: 'Completa tus datos',
    description: 'KidHabit necesita tu nombre completo y número de teléfono para ayudarte con tu cuenta y ofrecerte asistencia cuando la necesites. Solo tienes que introducirlos una vez.',
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
    modalLabel: '完善客户信息', title: '完善你的信息',
    description: 'KidHabit 需要你的姓名和电话号码，以便在你需要时提供账户帮助和客户服务。只需填写一次。',
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
    modalLabel: 'お客様情報の入力', title: 'あなたの情報を入力してください',
    description: 'KidHabit は、アカウントに関するサポートや必要なときのお手伝いのため、氏名と電話番号を使用します。入力は一度だけです。',
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
    modalLabel: '고객 정보 입력', title: '정보를 입력해 주세요',
    description: 'KidHabit은 계정 문제와 고객 지원을 돕기 위해 이름과 전화번호가 필요합니다. 한 번만 입력하면 됩니다.',
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
