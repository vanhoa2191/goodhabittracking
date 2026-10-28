import { vi } from './locales/vi';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { it } from './locales/it';
import { es } from './locales/es';
import { zh } from './locales/zh';
import { ja } from './locales/ja';
import { ko } from './locales/ko';

const checkoutCopy = {
  vi: {
    secureCheckoutAction: 'Mở trang thanh toán bảo mật',
    paymentReturnActivated: 'Thanh toán đã được xác nhận và gói của gia đình đã được kích hoạt.',
    paymentReturnPending: 'Thanh toán đang chờ xác nhận. Gói sẽ tự kích hoạt sau khi ngân hàng hoàn tất xử lý.',
    paymentReturnCancelled: 'Bạn đã hủy thanh toán. Không có gói nào được kích hoạt.',
    paymentReturnError: 'Chưa thể xác minh thanh toán. Vui lòng thử kiểm tra lại sau.',
  },
  en: {
    secureCheckoutAction: 'Open secure payment page',
    paymentReturnActivated: 'Payment verified. Your family plan is now active.',
    paymentReturnPending: 'Payment is awaiting verification. Your plan will activate after bank processing completes.',
    paymentReturnCancelled: 'Payment was cancelled. No plan was activated.',
    paymentReturnError: 'Payment could not be verified. Please check again later.',
  },
  fr: {
    secureCheckoutAction: 'Ouvrir la page de paiement sécurisée',
    paymentReturnActivated: 'Paiement confirmé. Le forfait de votre famille est maintenant actif.',
    paymentReturnPending: 'Le paiement est en attente de confirmation. Votre forfait sera activé après le traitement bancaire.',
    paymentReturnCancelled: 'Paiement annulé. Aucun forfait n’a été activé.',
    paymentReturnError: 'Le paiement n’a pas pu être vérifié. Veuillez réessayer plus tard.',
  },
  de: {
    secureCheckoutAction: 'Sichere Zahlungsseite öffnen',
    paymentReturnActivated: 'Zahlung bestätigt. Ihr Familientarif ist jetzt aktiv.',
    paymentReturnPending: 'Die Zahlung wartet auf Bestätigung. Ihr Tarif wird nach der Bearbeitung durch die Bank aktiviert.',
    paymentReturnCancelled: 'Zahlung abgebrochen. Es wurde kein Tarif aktiviert.',
    paymentReturnError: 'Die Zahlung konnte nicht überprüft werden. Bitte versuchen Sie es später erneut.',
  },
  it: {
    secureCheckoutAction: 'Apri la pagina di pagamento sicura',
    paymentReturnActivated: 'Pagamento confermato. Il piano della tua famiglia è ora attivo.',
    paymentReturnPending: 'Il pagamento è in attesa di conferma. Il piano si attiverà dopo l’elaborazione della banca.',
    paymentReturnCancelled: 'Pagamento annullato. Nessun piano è stato attivato.',
    paymentReturnError: 'Impossibile verificare il pagamento. Riprova più tardi.',
  },
  es: {
    secureCheckoutAction: 'Abrir la página de pago seguro',
    paymentReturnActivated: 'Pago confirmado. El plan de tu familia ya está activo.',
    paymentReturnPending: 'El pago está pendiente de confirmación. Tu plan se activará cuando el banco termine de procesarlo.',
    paymentReturnCancelled: 'Pago cancelado. No se ha activado ningún plan.',
    paymentReturnError: 'No se pudo verificar el pago. Vuelve a comprobarlo más tarde.',
  },
  zh: {
    secureCheckoutAction: '打开安全支付页面',
    paymentReturnActivated: '付款已确认，家庭套餐现已生效。',
    paymentReturnPending: '付款正在等待确认。银行处理完成后，套餐将自动生效。',
    paymentReturnCancelled: '付款已取消，未开通任何套餐。',
    paymentReturnError: '暂时无法核实付款，请稍后再查看。',
  },
  ja: {
    secureCheckoutAction: '安全な決済ページを開く',
    paymentReturnActivated: 'お支払いを確認しました。ご家族のプランは有効です。',
    paymentReturnPending: 'お支払いの確認待ちです。銀行の処理が完了するとプランが有効になります。',
    paymentReturnCancelled: 'お支払いはキャンセルされました。プランは有効になっていません。',
    paymentReturnError: 'お支払いを確認できませんでした。後でもう一度ご確認ください。',
  },
  ko: {
    secureCheckoutAction: '안전한 결제 페이지 열기',
    paymentReturnActivated: '결제가 확인되어 가족 요금제가 활성화되었습니다.',
    paymentReturnPending: '결제 확인을 기다리고 있습니다. 은행 처리가 끝나면 요금제가 활성화됩니다.',
    paymentReturnCancelled: '결제가 취소되었습니다. 활성화된 요금제가 없습니다.',
    paymentReturnError: '결제를 확인할 수 없습니다. 나중에 다시 확인해 주세요.',
  },
};

export const translations = {
  vi: { ...vi, ...checkoutCopy.vi },
  en: { ...en, ...checkoutCopy.en },
  fr: { ...fr, ...checkoutCopy.fr },
  de: { ...de, ...checkoutCopy.de },
  it: { ...it, ...checkoutCopy.it },
  es: { ...es, ...checkoutCopy.es },
  zh: { ...zh, ...checkoutCopy.zh },
  ja: { ...ja, ...checkoutCopy.ja },
  ko: { ...ko, ...checkoutCopy.ko },
};
