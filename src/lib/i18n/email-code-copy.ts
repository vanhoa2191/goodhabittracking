import type { Language } from '@/types';

export type EmailCodeCopy = {
  readonly heading: string;
  readonly emailLabel: string;
  readonly emailPlaceholder: string;
  readonly send: string;
  readonly sending: string;
  readonly sentTo: (email: string) => string;
  readonly codeLabel: string;
  readonly codeHint: string;
  readonly verify: string;
  readonly verifying: string;
  readonly resend: string;
  readonly resendIn: (seconds: number) => string;
  readonly changeEmail: string;
  readonly errors: Readonly<Record<'invalid_email' | 'rate_limited' | 'unavailable' | 'wrong_code' | 'failed', string>>;
};

const COPY: Readonly<Record<Language, EmailCodeCopy>> = {
  vi: {
    heading: 'Hoặc nhận mã đăng nhập qua email',
    emailLabel: 'Email của ba mẹ', emailPlaceholder: 'ten@email.com',
    send: 'Gửi mã đăng nhập', sending: 'Đang gửi…',
    sentTo: (email) => `Đã gửi mã tới ${email}. Mã có hiệu lực trong thời gian ngắn.`,
    codeLabel: 'Mã trong email', codeHint: 'Nhập mã gồm các chữ số',
    verify: 'Xác nhận và đăng nhập', verifying: 'Đang kiểm tra…',
    resend: 'Gửi lại mã', resendIn: (seconds) => `Gửi lại sau ${seconds} giây`,
    changeEmail: 'Dùng email khác',
    errors: {
      invalid_email: 'Email chưa đúng. Ba mẹ kiểm tra lại nhé.',
      rate_limited: 'Đã gửi quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.',
      unavailable: 'Đăng nhập bằng mã email hiện chưa dùng được. Ba mẹ dùng Google nhé.',
      wrong_code: 'Mã chưa đúng hoặc đã hết hạn. Kiểm tra lại hoặc gửi mã mới.',
      failed: 'Chưa thực hiện được. Vui lòng thử lại.',
    },
  },
  en: {
    heading: 'Or get a sign-in code by email',
    emailLabel: 'Parent email', emailPlaceholder: 'name@email.com',
    send: 'Email me a code', sending: 'Sending…',
    sentTo: (email) => `We sent a code to ${email}. It is valid for a short time.`,
    codeLabel: 'Code from the email', codeHint: 'Enter the digits',
    verify: 'Confirm and sign in', verifying: 'Checking…',
    resend: 'Send a new code', resendIn: (seconds) => `Send again in ${seconds}s`,
    changeEmail: 'Use a different email',
    errors: {
      invalid_email: 'That email does not look right. Please check it.',
      rate_limited: 'Too many requests. Please wait a few minutes and try again.',
      unavailable: 'Email code sign-in is not available right now. Please use Google.',
      wrong_code: 'That code is wrong or has expired. Check it or request a new one.',
      failed: 'Something went wrong. Please try again.',
    },
  },
  fr: {
    heading: 'Ou recevez un code de connexion par e-mail',
    emailLabel: 'E-mail du parent', emailPlaceholder: 'nom@email.com',
    send: 'Envoyer le code', sending: 'Envoi…',
    sentTo: (email) => `Un code a été envoyé à ${email}. Il est valable peu de temps.`,
    codeLabel: 'Code reçu par e-mail', codeHint: 'Saisissez les chiffres',
    verify: 'Confirmer et se connecter', verifying: 'Vérification…',
    resend: 'Envoyer un nouveau code', resendIn: (seconds) => `Renvoyer dans ${seconds} s`,
    changeEmail: 'Utiliser une autre adresse',
    errors: {
      invalid_email: 'Cette adresse semble incorrecte. Vérifiez-la.',
      rate_limited: 'Trop de demandes. Patientez quelques minutes puis réessayez.',
      unavailable: 'La connexion par code n’est pas disponible pour le moment. Utilisez Google.',
      wrong_code: 'Code incorrect ou expiré. Vérifiez-le ou demandez-en un nouveau.',
      failed: 'Une erreur est survenue. Veuillez réessayer.',
    },
  },
  de: {
    heading: 'Oder Anmeldecode per E-Mail erhalten',
    emailLabel: 'E-Mail der Eltern', emailPlaceholder: 'name@email.com',
    send: 'Code senden', sending: 'Wird gesendet…',
    sentTo: (email) => `Ein Code wurde an ${email} gesendet. Er ist nur kurz gültig.`,
    codeLabel: 'Code aus der E-Mail', codeHint: 'Ziffern eingeben',
    verify: 'Bestätigen und anmelden', verifying: 'Wird geprüft…',
    resend: 'Neuen Code senden', resendIn: (seconds) => `Erneut senden in ${seconds} s`,
    changeEmail: 'Andere E-Mail verwenden',
    errors: {
      invalid_email: 'Diese E-Mail-Adresse scheint nicht zu stimmen. Bitte prüfen.',
      rate_limited: 'Zu viele Anfragen. Bitte einige Minuten warten und erneut versuchen.',
      unavailable: 'Die Anmeldung per Code ist gerade nicht verfügbar. Bitte Google verwenden.',
      wrong_code: 'Der Code ist falsch oder abgelaufen. Bitte prüfen oder einen neuen anfordern.',
      failed: 'Etwas ist schiefgegangen. Bitte erneut versuchen.',
    },
  },
  it: {
    heading: 'Oppure ricevi un codice di accesso via e-mail',
    emailLabel: 'E-mail del genitore', emailPlaceholder: 'nome@email.com',
    send: 'Invia il codice', sending: 'Invio…',
    sentTo: (email) => `Abbiamo inviato un codice a ${email}. Vale per poco tempo.`,
    codeLabel: 'Codice ricevuto via e-mail', codeHint: 'Inserisci le cifre',
    verify: 'Conferma e accedi', verifying: 'Verifica…',
    resend: 'Invia un nuovo codice', resendIn: (seconds) => `Reinvia tra ${seconds} s`,
    changeEmail: 'Usa un’altra e-mail',
    errors: {
      invalid_email: 'L’indirizzo non sembra corretto. Controllalo.',
      rate_limited: 'Troppe richieste. Attendi qualche minuto e riprova.',
      unavailable: 'L’accesso con codice non è disponibile al momento. Usa Google.',
      wrong_code: 'Codice errato o scaduto. Controllalo o richiedine uno nuovo.',
      failed: 'Qualcosa è andato storto. Riprova.',
    },
  },
  es: {
    heading: 'O recibe un código de acceso por correo',
    emailLabel: 'Correo del padre o madre', emailPlaceholder: 'nombre@email.com',
    send: 'Enviar código', sending: 'Enviando…',
    sentTo: (email) => `Enviamos un código a ${email}. Es válido por poco tiempo.`,
    codeLabel: 'Código del correo', codeHint: 'Escribe los dígitos',
    verify: 'Confirmar e iniciar sesión', verifying: 'Comprobando…',
    resend: 'Enviar un código nuevo', resendIn: (seconds) => `Reenviar en ${seconds} s`,
    changeEmail: 'Usar otro correo',
    errors: {
      invalid_email: 'El correo no parece correcto. Revísalo.',
      rate_limited: 'Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.',
      unavailable: 'El acceso con código no está disponible ahora. Usa Google.',
      wrong_code: 'El código es incorrecto o ha caducado. Revísalo o pide uno nuevo.',
      failed: 'Algo salió mal. Inténtalo de nuevo.',
    },
  },
  zh: {
    heading: '或通过邮件获取登录验证码',
    emailLabel: '家长邮箱', emailPlaceholder: 'name@email.com',
    send: '发送验证码', sending: '正在发送…',
    sentTo: (email) => `验证码已发送到 ${email}，有效期较短。`,
    codeLabel: '邮件中的验证码', codeHint: '请输入数字',
    verify: '确认并登录', verifying: '正在验证…',
    resend: '重新发送验证码', resendIn: (seconds) => `${seconds} 秒后可重新发送`,
    changeEmail: '换一个邮箱',
    errors: {
      invalid_email: '邮箱格式似乎不对，请检查。',
      rate_limited: '请求过于频繁，请稍等几分钟再试。',
      unavailable: '暂时无法使用邮箱验证码登录，请使用 Google 登录。',
      wrong_code: '验证码不正确或已过期，请检查或重新获取。',
      failed: '出了点问题，请再试一次。',
    },
  },
  ja: {
    heading: 'またはメールでログインコードを受け取る',
    emailLabel: '保護者のメール', emailPlaceholder: 'name@email.com',
    send: 'コードを送る', sending: '送信中…',
    sentTo: (email) => `${email} にコードを送りました。有効期間は短めです。`,
    codeLabel: 'メールに届いたコード', codeHint: '数字を入力してください',
    verify: '確認してログイン', verifying: '確認中…',
    resend: '新しいコードを送る', resendIn: (seconds) => `${seconds}秒後に再送できます`,
    changeEmail: '別のメールを使う',
    errors: {
      invalid_email: 'メールアドレスが正しくないようです。ご確認ください。',
      rate_limited: 'リクエストが多すぎます。数分待ってからもう一度お試しください。',
      unavailable: '現在メールコードでのログインは使えません。Google をご利用ください。',
      wrong_code: 'コードが違うか、期限が切れています。確認するか新しいコードを送ってください。',
      failed: 'うまくいきませんでした。もう一度お試しください。',
    },
  },
  ko: {
    heading: '또는 이메일로 로그인 코드 받기',
    emailLabel: '부모님 이메일', emailPlaceholder: 'name@email.com',
    send: '코드 보내기', sending: '보내는 중…',
    sentTo: (email) => `${email}(으)로 코드를 보냈어요. 유효 시간이 짧아요.`,
    codeLabel: '이메일로 받은 코드', codeHint: '숫자를 입력해 주세요',
    verify: '확인하고 로그인', verifying: '확인 중…',
    resend: '새 코드 보내기', resendIn: (seconds) => `${seconds}초 후 다시 보낼 수 있어요`,
    changeEmail: '다른 이메일 사용',
    errors: {
      invalid_email: '이메일이 올바르지 않은 것 같아요. 다시 확인해 주세요.',
      rate_limited: '요청이 너무 많아요. 몇 분 뒤에 다시 시도해 주세요.',
      unavailable: '지금은 이메일 코드 로그인을 사용할 수 없어요. Google을 이용해 주세요.',
      wrong_code: '코드가 틀렸거나 만료됐어요. 확인하거나 새 코드를 요청해 주세요.',
      failed: '문제가 생겼어요. 다시 시도해 주세요.',
    },
  },
};

export function getEmailCodeCopy(language: Language): EmailCodeCopy {
  return COPY[language];
}
