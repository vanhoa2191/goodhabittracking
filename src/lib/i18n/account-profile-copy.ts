import type { Language } from '@/types';

export type AccountProfileCopy = {
  readonly title: string;
  readonly fullName: string;
  readonly phone: string;
  readonly email: string;
  readonly consent: string;
  readonly save: string;
  readonly coupon: string;
  readonly redeem: string;
  readonly saving: string;
  readonly saved: string;
  readonly invalidPhone: string;
  readonly saveFailed: string;
  readonly redeemed: string;
  readonly redeemFailed: string;
  readonly loading: string;
  readonly loadFailed: string;
  readonly retry: string;
};

export const COPY: Record<Language, AccountProfileCopy> = {
  vi: { title: 'Thông tin khách hàng', fullName: 'Họ và tên', phone: 'Số điện thoại', email: 'Email', consent: 'Tôi đồng ý nhận thông tin hướng dẫn, ưu đãi và chương trình phù hợp từ KidHabit. Có thể tắt bất kỳ lúc nào.', save: 'Lưu thông tin', coupon: 'Mã coupon', redeem: 'Áp dụng mã', saving: 'Đang lưu…', saved: 'Đã lưu thông tin.', invalidPhone: 'Số điện thoại chưa hợp lệ. Hãy nhập 9 đến 15 chữ số.', saveFailed: 'Chưa lưu được, vui lòng thử lại.', redeemed: 'Đã áp dụng mã tặng. Gói sẽ được cập nhật ngay.', redeemFailed: 'Không áp dụng được mã.' , loading: 'Đang tải thông tin…', loadFailed: 'Chưa tải được thông tin. Kiểm tra mạng rồi thử lại.', retry: 'Thử lại' },
  en: { title: 'Customer information', fullName: 'Full name', phone: 'Phone number', email: 'Email', consent: 'I agree to receive guidance, offers and relevant programs from KidHabit. I can turn this off at any time.', save: 'Save information', coupon: 'Coupon code', redeem: 'Apply code', saving: 'Saving…', saved: 'Information saved.', invalidPhone: 'Invalid phone number. Enter 9 to 15 digits.', saveFailed: 'Could not save. Please try again.', redeemed: 'Gift code applied. Your plan will update now.', redeemFailed: 'Could not apply the code.' , loading: 'Loading your details…', loadFailed: 'Your details could not be loaded. Check your connection and try again.', retry: 'Try again' },
  fr: { title: 'Informations client', fullName: 'Nom complet', phone: 'Numéro de téléphone', email: 'E-mail', consent: 'J’accepte de recevoir des conseils, des offres et des programmes adaptés de KidHabit. Je peux désactiver cette option à tout moment.', save: 'Enregistrer', coupon: 'Code promo', redeem: 'Appliquer le code', saving: 'Enregistrement…', saved: 'Informations enregistrées.', invalidPhone: 'Numéro de téléphone invalide. Saisissez de 9 à 15 chiffres.', saveFailed: 'Enregistrement impossible. Veuillez réessayer.', redeemed: 'Code cadeau appliqué. Votre forfait sera mis à jour immédiatement.', redeemFailed: 'Impossible d’appliquer le code.' , loading: 'Chargement de vos informations…', loadFailed: 'Impossible de charger vos informations. Vérifiez votre connexion et réessayez.', retry: 'Réessayer' },
  de: { title: 'Kundeninformationen', fullName: 'Vollständiger Name', phone: 'Telefonnummer', email: 'E-Mail', consent: 'Ich möchte Tipps, Angebote und passende Programme von KidHabit erhalten. Ich kann dies jederzeit deaktivieren.', save: 'Informationen speichern', coupon: 'Gutscheincode', redeem: 'Code einlösen', saving: 'Wird gespeichert…', saved: 'Informationen gespeichert.', invalidPhone: 'Ungültige Telefonnummer. Gib 9 bis 15 Ziffern ein.', saveFailed: 'Speichern fehlgeschlagen. Bitte versuche es erneut.', redeemed: 'Geschenkcode eingelöst. Dein Tarif wird sofort aktualisiert.', redeemFailed: 'Der Code konnte nicht eingelöst werden.' , loading: 'Ihre Angaben werden geladen …', loadFailed: 'Ihre Angaben konnten nicht geladen werden. Prüfen Sie die Verbindung und versuchen Sie es erneut.', retry: 'Erneut versuchen' },
  it: { title: 'Informazioni cliente', fullName: 'Nome e cognome', phone: 'Numero di telefono', email: 'Email', consent: 'Acconsento a ricevere consigli, offerte e programmi pertinenti da KidHabit. Posso disattivare questa opzione in qualsiasi momento.', save: 'Salva informazioni', coupon: 'Codice promozionale', redeem: 'Applica codice', saving: 'Salvataggio…', saved: 'Informazioni salvate.', invalidPhone: 'Numero di telefono non valido. Inserisci da 9 a 15 cifre.', saveFailed: 'Impossibile salvare. Riprova.', redeemed: 'Codice regalo applicato. Il piano verrà aggiornato subito.', redeemFailed: 'Impossibile applicare il codice.' , loading: 'Caricamento dei tuoi dati…', loadFailed: 'Impossibile caricare i tuoi dati. Controlla la connessione e riprova.', retry: 'Riprova' },
  es: { title: 'Información del cliente', fullName: 'Nombre completo', phone: 'Número de teléfono', email: 'Correo electrónico', consent: 'Acepto recibir consejos, ofertas y programas relevantes de KidHabit. Puedo desactivar esta opción cuando quiera.', save: 'Guardar información', coupon: 'Código de cupón', redeem: 'Aplicar código', saving: 'Guardando…', saved: 'Información guardada.', invalidPhone: 'Número de teléfono no válido. Introduce entre 9 y 15 dígitos.', saveFailed: 'No se pudo guardar. Inténtalo de nuevo.', redeemed: 'Código de regalo aplicado. Tu plan se actualizará de inmediato.', redeemFailed: 'No se pudo aplicar el código.' , loading: 'Cargando tus datos…', loadFailed: 'No se pudieron cargar tus datos. Revisa tu conexión e inténtalo de nuevo.', retry: 'Reintentar' },
  zh: { title: '客户信息', fullName: '姓名', phone: '电话号码', email: '电子邮箱', consent: '我同意接收 KidHabit 的使用指导、优惠和适合的活动信息，可随时关闭。', save: '保存信息', coupon: '优惠码', redeem: '使用优惠码', saving: '正在保存…', saved: '信息已保存。', invalidPhone: '电话号码无效，请输入 9 至 15 位数字。', saveFailed: '保存失败，请重试。', redeemed: '礼品码已使用，套餐将立即更新。', redeemFailed: '无法使用此优惠码。' , loading: '正在加载你的信息…', loadFailed: '无法加载信息。请检查网络后重试。', retry: '重试' },
  ja: { title: 'お客様情報', fullName: '氏名', phone: '電話番号', email: 'メールアドレス', consent: 'KidHabit から使い方の案内、特典、関連プログラムの情報を受け取ることに同意します。いつでも解除できます。', save: '情報を保存', coupon: 'クーポンコード', redeem: 'コードを適用', saving: '保存中…', saved: '情報を保存しました。', invalidPhone: '電話番号が正しくありません。9〜15桁の数字を入力してください。', saveFailed: '保存できませんでした。もう一度お試しください。', redeemed: 'ギフトコードを適用しました。プランはすぐに更新されます。', redeemFailed: 'コードを適用できませんでした。' , loading: '情報を読み込み中…', loadFailed: '情報を読み込めませんでした。接続を確認してもう一度お試しください。', retry: '再試行' },
  ko: { title: '고객 정보', fullName: '성명', phone: '전화번호', email: '이메일', consent: 'KidHabit의 이용 안내, 혜택, 관련 프로그램 정보를 받는 데 동의합니다. 언제든 해제할 수 있어요.', save: '정보 저장', coupon: '쿠폰 코드', redeem: '코드 적용', saving: '저장 중…', saved: '정보를 저장했어요.', invalidPhone: '전화번호가 올바르지 않아요. 숫자 9~15자리를 입력하세요.', saveFailed: '저장하지 못했어요. 다시 시도해 주세요.', redeemed: '선물 코드를 적용했어요. 요금제가 바로 업데이트돼요.', redeemFailed: '코드를 적용하지 못했어요.' , loading: '정보를 불러오는 중…', loadFailed: '정보를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.', retry: '다시 시도' },
};

export function getAccountProfileCopy(language: Language): AccountProfileCopy { return COPY[language]; }
