import type { Language } from '@/types';
import type { PaymentErrorCode } from '@/lib/billing/payment-client';

export type PaymentErrorCopy = {
  readonly title: string;
  readonly retry: string;
  readonly clipboardFailure: string;
  readonly beforeQr: string;
  readonly create: Record<PaymentErrorCode, string>;
  readonly status: Record<PaymentErrorCode, string>;
};

type Messages = readonly [string, string, string, string, string, string, string, string];
function errors(messages: Messages): Record<PaymentErrorCode, string> {
  const [invalid_plan, create_failed, network, auth_required, invalid_request, service_unavailable, status_failed, order_not_found] = messages;
  return { invalid_plan, create_failed, network, auth_required, invalid_request, service_unavailable, status_failed, order_not_found };
}

function copy(title: string, retry: string, clipboardFailure: string, beforeQr: string, messages: Messages, createNetwork: string): PaymentErrorCopy {
  const status = errors(messages);
  return { title, retry, clipboardFailure, beforeQr, status, create: { ...status, network: createNetwork } };
}

const COPY: Record<Language, PaymentErrorCopy> = {
  vi: copy('Có lỗi xảy ra', 'Thử lại', 'Không sao chép được, hãy giữ và chọn nội dung.', 'Nếu có mã giới thiệu, hãy nhập và áp dụng trước khi tạo mã QR. Số tiền được tính khi tạo đơn.', [
    'Gói đã chọn chưa hợp lệ. Bạn vui lòng chọn lại gói.', 'Chưa tạo được đơn thanh toán. Bạn vui lòng thử lại.',
    'Chưa kết nối được hệ thống thanh toán để kiểm tra. Bạn vui lòng thử lại; hệ thống vẫn tiếp tục kiểm tra.',
    'Bạn vui lòng đăng nhập lại bằng tài khoản phụ huynh.', 'Chưa xử lý được yêu cầu. Bạn vui lòng kiểm tra thông tin và thử lại.',
    'Hệ thống thanh toán tạm thời chưa sẵn sàng. Bạn vui lòng thử lại sau ít phút.',
    'Chưa kiểm tra được trạng thái thanh toán. Bạn vui lòng chờ; hệ thống vẫn tiếp tục kiểm tra.',
    'Chưa tìm thấy đơn thanh toán. Nếu đã chuyển khoản, bạn vui lòng liên hệ hỗ trợ kèm mã đơn.',
  ], 'Chưa kết nối được hệ thống thanh toán. Chưa có khoản nào bị trừ qua thao tác này. Bạn vui lòng thử lại.'),
  en: copy('Something went wrong', 'Try again', 'Could not copy. Press and hold to select the text.', 'If you have a referral code, apply it before creating the QR. The amount is calculated when the order is created.', [
    'This plan is not valid. Please choose a plan again.', 'We could not create the payment order. Please try again.',
    'We could not connect to check your payment. Please try again; automatic checks will continue.',
    'Please sign in again with a parent account.', 'We could not process the request. Please check the details and try again.',
    'The payment service is temporarily unavailable. Please try again in a few minutes.',
    'We could not check the payment status. Please wait; automatic checks will continue.',
    'We could not find the payment order. If you have transferred, contact support with the order code.',
  ], 'We could not connect to the payment service. This action has not charged you. Please try again.'),
  fr: copy('Une erreur est survenue', 'Réessayer', 'Copie impossible. Appuyez longuement pour sélectionner le texte.', 'Si vous avez un code de parrainage, appliquez-le avant de créer le QR. Le montant est calculé à la création de la commande.', [
    'Ce forfait est invalide. Veuillez choisir à nouveau.', 'La commande de paiement n’a pas pu être créée. Veuillez réessayer.',
    'Connexion impossible pour vérifier le paiement. Réessayez ; les vérifications automatiques continuent.',
    'Veuillez vous reconnecter avec un compte parent.', 'La demande n’a pas pu être traitée. Vérifiez les informations et réessayez.',
    'Le service de paiement est temporairement indisponible. Réessayez dans quelques minutes.',
    'Le statut du paiement n’a pas pu être vérifié. Patientez ; les vérifications automatiques continuent.',
    'Commande de paiement introuvable. Si vous avez effectué le virement, contactez l’assistance avec le numéro de commande.',
  ], 'Connexion au service de paiement impossible. Cette action n’a entraîné aucun débit. Veuillez réessayer.'),
  de: copy('Ein Fehler ist aufgetreten', 'Erneut versuchen', 'Kopieren nicht möglich. Halte den Text gedrückt und wähle ihn aus.', 'Wende deinen Empfehlungscode vor dem Erstellen des QR-Codes an. Der Betrag wird beim Erstellen der Bestellung berechnet.', [
    'Dieses Paket ist ungültig. Bitte wähle erneut.', 'Die Zahlungsbestellung konnte nicht erstellt werden. Bitte versuche es erneut.',
    'Keine Verbindung zur Zahlungsprüfung. Bitte versuche es erneut; automatische Prüfungen laufen weiter.',
    'Bitte melde dich erneut mit einem Elternkonto an.', 'Die Anfrage konnte nicht verarbeitet werden. Prüfe die Angaben und versuche es erneut.',
    'Der Zahlungsdienst ist vorübergehend nicht verfügbar. Bitte versuche es in einigen Minuten erneut.',
    'Der Zahlungsstatus konnte nicht geprüft werden. Bitte warte; automatische Prüfungen laufen weiter.',
    'Die Zahlungsbestellung wurde nicht gefunden. Wenn du überwiesen hast, kontaktiere den Support mit der Bestellnummer.',
  ], 'Keine Verbindung zum Zahlungsdienst. Durch diese Aktion wurde nichts abgebucht. Bitte versuche es erneut.'),
  it: copy('Si è verificato un errore', 'Riprova', 'Copia non riuscita. Tieni premuto per selezionare il testo.', 'Se hai un codice invito, applicalo prima di creare il QR. L’importo viene calcolato alla creazione dell’ordine.', [
    'Questo piano non è valido. Scegli di nuovo.', 'Non è stato possibile creare l’ordine di pagamento. Riprova.',
    'Connessione non riuscita per verificare il pagamento. Riprova; i controlli automatici continuano.',
    'Accedi di nuovo con un account genitore.', 'Non è stato possibile elaborare la richiesta. Controlla i dati e riprova.',
    'Il servizio di pagamento non è disponibile al momento. Riprova tra qualche minuto.',
    'Non è stato possibile verificare il pagamento. Attendi; i controlli automatici continuano.',
    'Ordine di pagamento non trovato. Se hai effettuato il bonifico, contatta l’assistenza con il codice ordine.',
  ], 'Connessione al servizio di pagamento non riuscita. Questa azione non ha addebitato nulla. Riprova.'),
  es: copy('Ha ocurrido un error', 'Reintentar', 'No se pudo copiar. Mantén pulsado para seleccionar el texto.', 'Si tienes un código de referido, aplícalo antes de crear el QR. El importe se calcula al crear el pedido.', [
    'Este plan no es válido. Elige de nuevo.', 'No pudimos crear el pedido de pago. Inténtalo de nuevo.',
    'No pudimos conectar para comprobar el pago. Reintenta; las comprobaciones automáticas continúan.',
    'Vuelve a iniciar sesión con una cuenta de padre o madre.', 'No pudimos procesar la solicitud. Revisa los datos y reintenta.',
    'El servicio de pago no está disponible temporalmente. Reintenta en unos minutos.',
    'No pudimos comprobar el estado del pago. Espera; las comprobaciones automáticas continúan.',
    'No encontramos el pedido de pago. Si ya transferiste, contacta con soporte indicando el código del pedido.',
  ], 'No pudimos conectar con el servicio de pago. Esta acción no ha realizado ningún cobro. Inténtalo de nuevo.'),
  zh: copy('出现了问题', '重试', '无法复制，请长按并选择内容。', '如有推荐码，请在生成二维码前输入并应用。金额在创建订单时计算。', [
    '所选方案无效，请重新选择。', '暂时无法创建支付订单，请重试。', '暂时无法连接以检查付款，请重试；系统会继续自动检查。',
    '请使用家长账户重新登录。', '暂时无法处理请求，请检查信息后重试。', '支付服务暂时不可用，请稍后重试。',
    '暂时无法检查付款状态，请稍等；系统会继续自动检查。', '未找到支付订单。如果已转账，请提供订单号联系支持。',
  ], '暂时无法连接支付系统。此操作没有扣款，请重试。'),
  ja: copy('エラーが発生しました', '再試行', 'コピーできません。長押しして内容を選択してください。', '紹介コードがある場合は、QRコードを作成する前に適用してください。金額は注文作成時に計算されます。', [
    '選択したプランは無効です。選び直してください。', '支払い注文を作成できませんでした。再試行してください。',
    '支払い確認のため接続できませんでした。再試行してください。自動確認は続きます。',
    '保護者アカウントで再度ログインしてください。', 'リクエストを処理できませんでした。内容を確認して再試行してください。',
    '決済サービスは一時的に利用できません。数分後に再試行してください。',
    '支払い状況を確認できませんでした。お待ちください。自動確認は続きます。',
    '支払い注文が見つかりません。振込済みの場合は注文番号を添えてサポートに連絡してください。',
  ], '決済システムに接続できませんでした。この操作による引き落としはありません。再試行してください。'),
  ko: copy('오류가 발생했어요', '다시 시도', '복사할 수 없어요. 길게 눌러 내용을 선택해 주세요.', '추천 코드가 있다면 QR을 만들기 전에 적용해 주세요. 금액은 주문을 만들 때 계산돼요.', [
    '선택한 플랜이 유효하지 않아요. 다시 선택해 주세요.', '결제 주문을 만들지 못했어요. 다시 시도해 주세요.',
    '결제를 확인하기 위해 연결하지 못했어요. 다시 시도해 주세요. 자동 확인은 계속돼요.',
    '부모 계정으로 다시 로그인해 주세요.', '요청을 처리하지 못했어요. 내용을 확인하고 다시 시도해 주세요.',
    '결제 서비스를 일시적으로 이용할 수 없어요. 잠시 후 다시 시도해 주세요.',
    '결제 상태를 확인하지 못했어요. 기다려 주세요. 자동 확인은 계속돼요.',
    '결제 주문을 찾지 못했어요. 이미 이체했다면 주문 번호와 함께 지원팀에 문의해 주세요.',
  ], '결제 시스템에 연결하지 못했어요. 이 작업으로 출금된 금액은 없어요. 다시 시도해 주세요.'),
};

export function getPaymentErrorCopy(language: Language): PaymentErrorCopy {
  return COPY[language];
}
