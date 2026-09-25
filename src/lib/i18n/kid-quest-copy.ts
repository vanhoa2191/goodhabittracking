import type { Language } from '@/types';

type QuestCopy = {
  readonly defer: string;
  readonly doNow: string;
  readonly deferredTitle: string;
  readonly swipeHint: string;
  readonly saving: string;
  readonly saveError: string;
};

const COPY: Readonly<Record<Language, QuestCopy>> = {
  vi: { defer: 'Để sau', doNow: 'Làm ngay', deferredTitle: 'Để sau hôm nay', swipeHint: 'Vuốt phải để hoàn thành, trái để làm sau', saving: 'Đang lưu…', saveError: 'Chưa lưu được. Con thử lại nhé.' },
  en: { defer: 'Do later', doNow: 'Do now', deferredTitle: 'Later today', swipeHint: 'Swipe right to finish, left to do later', saving: 'Saving…', saveError: 'Could not save. Please try again.' },
  fr: { defer: 'Plus tard', doNow: 'Faire maintenant', deferredTitle: 'Plus tard aujourd’hui', swipeHint: 'Glisser à droite pour terminer, à gauche pour reporter', saving: 'Enregistrement…', saveError: 'Enregistrement impossible. Réessaie.' },
  de: { defer: 'Später', doNow: 'Jetzt erledigen', deferredTitle: 'Später heute', swipeHint: 'Nach rechts wischen zum Abschließen, nach links für später', saving: 'Wird gespeichert…', saveError: 'Speichern fehlgeschlagen. Bitte versuche es erneut.' },
  it: { defer: 'Più tardi', doNow: 'Fallo ora', deferredTitle: 'Più tardi oggi', swipeHint: 'Scorri a destra per completare, a sinistra per rimandare', saving: 'Salvataggio…', saveError: 'Impossibile salvare. Riprova.' },
  es: { defer: 'Más tarde', doNow: 'Hacer ahora', deferredTitle: 'Más tarde hoy', swipeHint: 'Desliza a la derecha para completar y a la izquierda para después', saving: 'Guardando…', saveError: 'No se pudo guardar. Inténtalo de nuevo.' },
  zh: { defer: '稍后再做', doNow: '现在做', deferredTitle: '今天稍后', swipeHint: '向右滑动完成，向左滑动稍后再做', saving: '正在保存…', saveError: '暂时无法保存，请再试一次。' },
  ja: { defer: 'あとで', doNow: '今やる', deferredTitle: '今日あとで', swipeHint: '右へ：完了　左へ：あとで', saving: '保存中…', saveError: '保存できませんでした。もう一度お試しください。' },
  ko: { defer: '나중에', doNow: '지금 하기', deferredTitle: '오늘 나중에', swipeHint: '오른쪽으로 밀어 완료, 왼쪽으로 밀어 나중에 하기', saving: '저장 중…', saveError: '저장하지 못했어요. 다시 시도해 주세요.' },
};

export function getKidQuestCopy(language: Language): QuestCopy {
  return COPY[language];
}
