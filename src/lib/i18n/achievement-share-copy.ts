import type { Language } from '@/types';

export type AchievementShareCopy = {
  readonly title: string;
  readonly shareTitle: string;
  readonly shareText: string;
  readonly privacy: string;
  readonly share: string;
  readonly previewLabel: string;
  readonly preview: string;
  readonly close: string;
  readonly confirmation: string;
  readonly confirm: string;
  readonly cancel: string;
  readonly copied: string;
  readonly failed: string;
};

export const COPY: Record<Language, AchievementShareCopy> = {
  vi: {
    shareTitle: 'Cột mốc gia đình cùng KidHabit Hero', shareText: 'Gia đình mình vừa duy trì thêm một tuần tích cực cùng KidHabit Hero. Mỗi bước nhỏ đều đáng tự hào!',
    title: 'Lan tỏa một cột mốc tích cực', privacy: 'Nội dung mặc định không có tên, tuổi, ảnh hoặc nhiệm vụ của trẻ. KidHabit không thêm mã theo dõi cá nhân.', share: 'Chia sẻ cột mốc gia đình', previewLabel: 'Xem trước nội dung chia sẻ', preview: 'Xem trước', close: 'Đóng', confirmation: 'Bạn chủ động xác nhận trước khi hệ thống mở bảng chia sẻ của thiết bị.', confirm: 'Xác nhận chia sẻ', cancel: 'Hủy', copied: 'Đã sao chép nội dung để bạn tự chia sẻ.', failed: 'Chưa thể mở bảng chia sẻ. Vui lòng thử lại.',
  },
  en: {
    shareTitle: 'A family milestone with KidHabit Hero', shareText: 'Our family just completed another positive week with KidHabit Hero. Every small step matters!',
    title: 'Share a positive milestone', privacy: 'The default content includes no child names, ages, photos or tasks. KidHabit adds no personal tracking codes.', share: 'Share a family milestone', previewLabel: 'Preview shared content', preview: 'Preview', close: 'Close', confirmation: 'You confirm before your device’s share sheet opens.', confirm: 'Confirm sharing', cancel: 'Cancel', copied: 'Content copied so you can share it yourself.', failed: 'Could not open the share sheet. Please try again.',
  },
  fr: {
    shareTitle: 'Une étape en famille avec KidHabit Hero', shareText: 'Notre famille vient de passer une nouvelle semaine positive avec KidHabit Hero. Chaque petit pas compte !',
    title: 'Partagez une belle étape', privacy: 'Le contenu par défaut ne contient ni nom, âge, photo, ni tâche de l’enfant. KidHabit n’ajoute aucun code de suivi personnel.', share: 'Partager une étape en famille', previewLabel: 'Aperçu du contenu à partager', preview: 'Aperçu', close: 'Fermer', confirmation: 'Vous confirmez avant l’ouverture du menu de partage de votre appareil.', confirm: 'Confirmer le partage', cancel: 'Annuler', copied: 'Contenu copié pour que vous puissiez le partager.', failed: 'Impossible d’ouvrir le menu de partage. Veuillez réessayer.',
  },
  de: {
    shareTitle: 'Ein Familienmeilenstein mit KidHabit Hero', shareText: 'Unsere Familie hat mit KidHabit Hero eine weitere positive Woche geschafft. Jeder kleine Schritt zählt!',
    title: 'Einen schönen Meilenstein teilen', privacy: 'Der Standardinhalt enthält keine Namen, Altersangaben, Fotos oder Aufgaben von Kindern. KidHabit fügt keine persönlichen Tracking-Codes hinzu.', share: 'Familienmeilenstein teilen', previewLabel: 'Vorschau des geteilten Inhalts', preview: 'Vorschau', close: 'Schließen', confirmation: 'Du bestätigst, bevor sich das Teilen-Menü deines Geräts öffnet.', confirm: 'Teilen bestätigen', cancel: 'Abbrechen', copied: 'Inhalt kopiert. Du kannst ihn jetzt selbst teilen.', failed: 'Das Teilen-Menü konnte nicht geöffnet werden. Bitte versuche es erneut.',
  },
  it: {
    shareTitle: 'Un traguardo di famiglia con KidHabit Hero', shareText: 'La nostra famiglia ha appena trascorso un’altra settimana positiva con KidHabit Hero. Ogni piccolo passo conta!',
    title: 'Condividi un bel traguardo', privacy: 'Il contenuto predefinito non include nomi, età, foto o attività dei bambini. KidHabit non aggiunge codici di tracciamento personali.', share: 'Condividi un traguardo di famiglia', previewLabel: 'Anteprima del contenuto da condividere', preview: 'Anteprima', close: 'Chiudi', confirmation: 'Confermi tu prima che si apra il menu di condivisione del dispositivo.', confirm: 'Conferma condivisione', cancel: 'Annulla', copied: 'Contenuto copiato per condividerlo come preferisci.', failed: 'Impossibile aprire il menu di condivisione. Riprova.',
  },
  es: {
    shareTitle: 'Un logro familiar con KidHabit Hero', shareText: 'Nuestra familia acaba de completar otra semana positiva con KidHabit Hero. ¡Cada pequeño paso cuenta!',
    title: 'Comparte un logro positivo', privacy: 'El contenido predeterminado no incluye nombres, edades, fotos ni tareas de los niños. KidHabit no añade códigos de seguimiento personal.', share: 'Compartir un logro familiar', previewLabel: 'Vista previa del contenido para compartir', preview: 'Vista previa', close: 'Cerrar', confirmation: 'Tú confirmas antes de que se abra el menú para compartir del dispositivo.', confirm: 'Confirmar y compartir', cancel: 'Cancelar', copied: 'Contenido copiado para que lo compartas.', failed: 'No se pudo abrir el menú para compartir. Inténtalo de nuevo.',
  },
  zh: {
    shareTitle: '与 KidHabit Hero 一起见证家庭里程碑', shareText: '我们家又和 KidHabit Hero 一起度过了积极的一周。每一小步都值得骄傲！',
    title: '分享美好的里程碑', privacy: '默认内容不包含孩子的姓名、年龄、照片或任务。KidHabit 不会添加个人追踪码。', share: '分享家庭里程碑', previewLabel: '预览分享内容', preview: '预览', close: '关闭', confirmation: '你确认后，系统才会打开设备的分享菜单。', confirm: '确认分享', cancel: '取消', copied: '内容已复制，你可以自行分享。', failed: '暂时无法打开分享菜单，请重试。',
  },
  ja: {
    shareTitle: 'KidHabit Hero と迎える家族の節目', shareText: '私たち家族は KidHabit Hero とまた一週間、前向きに過ごせました。小さな一歩にも価値があります！',
    title: 'うれしい節目を共有', privacy: '初期の内容には子どもの名前、年齢、写真、ミッションは含まれません。KidHabit は個人追跡コードを追加しません。', share: '家族の節目を共有', previewLabel: '共有内容のプレビュー', preview: 'プレビュー', close: '閉じる', confirmation: '確認してから端末の共有メニューが開きます。', confirm: '確認して共有', cancel: 'キャンセル', copied: '内容をコピーしました。お好きな方法で共有できます。', failed: '共有メニューを開けませんでした。もう一度お試しください。',
  },
  ko: {
    shareTitle: 'KidHabit Hero와 함께한 가족의 성취', shareText: '우리 가족은 KidHabit Hero와 함께 또 한 주를 긍정적으로 보냈어요. 작은 한 걸음도 소중해요!',
    title: '뜻깊은 성취 나누기', privacy: '기본 내용에는 아이의 이름, 나이, 사진, 할 일이 포함되지 않아요. KidHabit은 개인 추적 코드를 추가하지 않아요.', share: '가족의 성취 공유하기', previewLabel: '공유 내용 미리 보기', preview: '미리 보기', close: '닫기', confirmation: '직접 확인한 뒤에 기기의 공유 메뉴가 열려요.', confirm: '확인 후 공유', cancel: '취소', copied: '직접 공유할 수 있도록 내용을 복사했어요.', failed: '공유 메뉴를 열 수 없어요. 다시 시도해 주세요.',
  },
};

export function getAchievementShareCopy(language: Language): AchievementShareCopy { return COPY[language]; }
