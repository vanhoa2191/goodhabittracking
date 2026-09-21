import type { Language } from '@/types';

const ACTIVITY_MUTATION_ERRORS = {
  vi: 'Không thể lưu thói quen. Dữ liệu chưa thay đổi; vui lòng thử lại.',
  en: 'The habit could not be saved. Nothing changed; please try again.',
  fr: 'Impossible d’enregistrer l’habitude. Rien n’a changé ; réessayez.',
  de: 'Die Gewohnheit konnte nicht gespeichert werden. Bitte erneut versuchen.',
  it: 'Impossibile salvare l’abitudine. Nessuna modifica applicata; riprova.',
  es: 'No se pudo guardar el hábito. No se aplicaron cambios; inténtalo de nuevo.',
  zh: '无法保存习惯。数据未更改，请重试。',
  ja: '習慣を保存できませんでした。変更は反映されていません。もう一度お試しください。',
  ko: '습관을 저장하지 못했습니다. 변경 사항은 적용되지 않았습니다. 다시 시도해 주세요.',
} as const satisfies Record<Language, string>;

export function getActivityMutationError(language: Language): string {
  return ACTIVITY_MUTATION_ERRORS[language];
}
