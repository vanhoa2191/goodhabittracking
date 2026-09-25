import type { Language } from '@/types';

type AnalyticsConsentCopy = {
  readonly title: string;
  readonly description: string;
  readonly enable: string;
  readonly enabled: string;
  readonly disabled: string;
  readonly loading: string;
  readonly saving: string;
  readonly error: string;
};

export const analyticsConsentCopy: Record<Language, AnalyticsConsentCopy> = {
  vi: { title: 'Giúp KidHabit tốt hơn', description: 'Cho phép gửi số liệu sử dụng ẩn danh, không gồm tên bé, nội dung nhiệm vụ, mã ghép nối hay thông tin thanh toán. Bạn có thể tắt bất kỳ lúc nào.', enable: 'Cho phép đo lường ẩn danh', enabled: 'Đã lưu quyền cho phép đo lường ẩn danh.', disabled: 'Đang tắt. Không có số liệu sử dụng nào được gửi đi.', loading: 'Đang tải lựa chọn…', saving: 'Đang lưu…', error: 'Chưa lưu được lựa chọn. Vui lòng thử lại.' },
  en: { title: 'Help improve KidHabit', description: 'Allow anonymous usage metrics without child names, task text, pairing codes, or payment details. You can turn this off at any time.', enable: 'Allow anonymous measurement', enabled: 'Permission for anonymous measurement is saved.', disabled: 'Off. No usage metrics are sent.', loading: 'Loading your choice…', saving: 'Saving…', error: 'Could not save your choice. Please try again.' },
  fr: { title: 'Aider à améliorer KidHabit', description: 'Autoriser des mesures d’usage anonymes, sans nom d’enfant, contenu de tâche, code d’association ni donnée de paiement. Désactivation possible à tout moment.', enable: 'Autoriser la mesure anonyme', enabled: 'La mesure anonyme est activée.', disabled: 'Désactivée. Aucune donnée d’usage n’est envoyée.', loading: 'Chargement de votre choix…', saving: 'Enregistrement…', error: 'Impossible d’enregistrer votre choix. Réessayez.' },
  de: { title: 'KidHabit verbessern', description: 'Anonyme Nutzungsdaten ohne Kindernamen, Aufgabentexte, Kopplungscodes oder Zahlungsdaten erlauben. Jederzeit deaktivierbar.', enable: 'Anonyme Messung erlauben', enabled: 'Anonyme Messung ist aktiviert.', disabled: 'Aus. Es werden keine Nutzungsdaten gesendet.', loading: 'Auswahl wird geladen…', saving: 'Wird gespeichert…', error: 'Auswahl konnte nicht gespeichert werden. Bitte erneut versuchen.' },
  it: { title: 'Aiuta a migliorare KidHabit', description: 'Consenti metriche anonime senza nomi dei bambini, testo delle attività, codici di collegamento o dati di pagamento. Puoi disattivare in qualsiasi momento.', enable: 'Consenti misurazione anonima', enabled: 'La misurazione anonima è attiva.', disabled: 'Disattivata. Non viene inviato alcun dato di utilizzo.', loading: 'Caricamento della scelta…', saving: 'Salvataggio…', error: 'Impossibile salvare la scelta. Riprova.' },
  es: { title: 'Ayuda a mejorar KidHabit', description: 'Permite métricas de uso anónimas sin nombres, texto de tareas, códigos de vinculación ni datos de pago. Puedes desactivarlo cuando quieras.', enable: 'Permitir medición anónima', enabled: 'La medición anónima está activada.', disabled: 'Desactivada. No se envían métricas de uso.', loading: 'Cargando tu elección…', saving: 'Guardando…', error: 'No se pudo guardar tu elección. Inténtalo de nuevo.' },
  zh: { title: '帮助改进 KidHabit', description: '允许发送匿名使用数据，不包含孩子姓\u2060名、任务内容、配对码或付款信息。你可\u2060以随时关闭。', enable: '允许匿名统计', enabled: '匿名统计已开启。', disabled: '已关闭，不会发送使用数据。', loading: '正在加载你的选择…', saving: '正在保存…', error: '无法保存你的选择，请重试。' },
  ja: { title: 'KidHabit の改善に協力', description: 'お子さまの名前、タスク内容、ペ\u2060ア\u2060リ\u2060ン\u2060グ\u2060コ\u2060ー\u2060ド、決済情報を含まない匿名の利用状況を許\u2060可\u2060し\u2060ま\u2060す。い\u2060つ\u2060で\u2060も\u2060オ\u2060フ\u2060に\u2060で\u2060き\u2060ま\u2060す。', enable: '匿名の計測を許可する', enabled: '匿名の計測はオンです。', disabled: 'オフです。利用状況は送信されません。', loading: '選択を読み込んでいます…', saving: '保存中…', error: '選択を保存できませんでした。もう一度お試しください。' },
  ko: { title: 'KidHabit 개선에 도움 주기', description: '아이 이름, 할 일 내용, 연결 코드, 결제 정보를 제\u2060외\u2060한 익명 사용 통계를 허용합니다. 언\u2060제\u2060든\u00a0끌\u00a0수\u00a0있\u2060습\u2060니\u2060다.', enable: '익명 측정 허용', enabled: '익명 측정이 켜져 있습니다.', disabled: '꺼져 있습니다. 사용 통계가 전송되지 않습니다.', loading: '선택을 불러오는 중…', saving: '저장 중…', error: '선택을 저장하지 못했습니다. 다시 시도해 주세요.' },
};
