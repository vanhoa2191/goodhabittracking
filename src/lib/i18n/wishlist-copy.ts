import type { Language } from '@/types';

const saveError: Record<Language, string> = {
  vi: 'Chưa xác nhận được mục tiêu đã lưu. Hãy tải lại trang để kiểm tra rồi thử lại.',
  en: 'Could not confirm the goal was saved. Reload to check, then try again.',
  fr: 'Enregistrement de l’objectif non confirmé. Rechargez la page pour vérifier, puis réessayez.',
  de: 'Das Speichern des Ziels konnte nicht bestätigt werden. Bitte lade die Seite neu und versuche es erneut.',
  it: 'Impossibile confermare il salvataggio dell’obiettivo. Ricarica la pagina per verificare e riprova.',
  es: 'No se pudo confirmar si se guardó el objetivo. Recarga la página para comprobarlo y vuelve a intentarlo.',
  zh: '无法确认目标是否已保存。请刷新页面检查后重试。',
  ja: '目標が保存されたか確認できませんでした。ページを再読み込みして確認し、もう一度お試しください。',
  ko: '목표 저장을 확인할 수 없습니다. 새로고침하여 확인한 뒤 다시 시도해 주세요.',
};

export function getWishlistSaveError(language: Language): string {
  return saveError[language];
}
