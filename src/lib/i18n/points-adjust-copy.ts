import type { Language } from '@/types';

const COPY: Readonly<Record<Language, { readonly saveError: string }>> = {
  vi: { saveError: 'Chưa lưu được điểm. Ba mẹ thử lại nhé.' },
  en: { saveError: 'Could not save the points. Please try again.' },
  fr: { saveError: 'Impossible d’enregistrer les points. Réessayez.' },
  de: { saveError: 'Die Punkte konnten nicht gespeichert werden. Bitte erneut versuchen.' },
  it: { saveError: 'Impossibile salvare i punti. Riprova.' },
  es: { saveError: 'No se pudieron guardar los puntos. Inténtalo de nuevo.' },
  zh: { saveError: '积分未能保存，请再试一次。' },
  ja: { saveError: 'ポイントを保存できませんでした。もう一度お試しください。' },
  ko: { saveError: '포인트를 저장하지 못했어요. 다시 시도해 주세요.' },
};

export function getPointsAdjustCopy(language: Language) {
  return COPY[language];
}
