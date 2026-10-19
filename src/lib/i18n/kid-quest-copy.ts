import type { Language } from '@/types';

type QuestCopy = {
  readonly defer: string;
  readonly doNow: string;
  readonly deferredTitle: string;
  readonly swipeHint: string;
  readonly saving: string;
  readonly saveError: string;
  readonly retry: string;
};

const COPY: Readonly<Record<Language, QuestCopy>> = {
  vi: { retry: 'Thử lại', defer: 'Để sau', doNow: 'Làm ngay', deferredTitle: 'Để sau hôm nay', swipeHint: 'Vuốt phải để hoàn thành, trái để làm sau', saving: 'Đang lưu…', saveError: 'Chưa xác nhận được kết quả. Con thử lại để kiểm tra nhé.' },
  en: { retry: 'Try again', defer: 'Do later', doNow: 'Do now', deferredTitle: 'Later today', swipeHint: 'Swipe right to finish, left to do later', saving: 'Saving…', saveError: 'The result is not confirmed yet. Try again to check.' },
  fr: { retry: 'Réessayer', defer: 'Plus tard', doNow: 'Faire maintenant', deferredTitle: 'Plus tard aujourd’hui', swipeHint: 'Glisser à droite pour terminer, à gauche pour reporter', saving: 'Enregistrement…', saveError: 'Le résultat n’est pas encore confirmé. Réessaie pour vérifier.' },
  de: { retry: 'Erneut versuchen', defer: 'Später', doNow: 'Jetzt erledigen', deferredTitle: 'Später heute', swipeHint: 'Nach rechts wischen zum Abschließen, nach links für später', saving: 'Wird gespeichert…', saveError: 'Das Ergebnis ist noch nicht bestätigt. Versuche es erneut, um es zu prüfen.' },
  it: { retry: 'Riprova', defer: 'Più tardi', doNow: 'Fallo ora', deferredTitle: 'Più tardi oggi', swipeHint: 'Scorri a destra per completare, a sinistra per rimandare', saving: 'Salvataggio…', saveError: 'Il risultato non è ancora confermato. Riprova per controllare.' },
  es: { retry: 'Inténtalo de nuevo', defer: 'Más tarde', doNow: 'Hacer ahora', deferredTitle: 'Más tarde hoy', swipeHint: 'Desliza a la derecha para completar y a la izquierda para después', saving: 'Guardando…', saveError: 'El resultado aún no está confirmado. Inténtalo de nuevo para comprobarlo.' },
  zh: { retry: '重试', defer: '稍后再做', doNow: '现在做', deferredTitle: '今天稍后', swipeHint: '向右滑动完成，向左滑动稍后再做', saving: '正在保存…', saveError: '结果尚未确认，请重试以核实。' },
  ja: { retry: '再試行', defer: 'あとで', doNow: '今やる', deferredTitle: '今日あとで', swipeHint: '右へ：完了　左へ：あとで', saving: '保存中…', saveError: '結果はまだ確認できていません。もう一度試して確認してください。' },
  ko: { retry: '다시 시도', defer: '나중에', doNow: '지금 하기', deferredTitle: '오늘 나중에', swipeHint: '오른쪽으로 밀어 완료, 왼쪽으로 밀어 나중에 하기', saving: '저장 중…', saveError: '아직 결과를 확인하지 못했어요. 다시 시도해서 확인해 주세요.' },
};

export function getKidQuestCopy(language: Language): QuestCopy {
  return COPY[language];
}
