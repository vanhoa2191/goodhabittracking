import type { Language } from '@/types';

type RewardMutationCopy = {
  readonly deleteConfirm: (title: string) => string;
  readonly deleteError: string;
  readonly saveError: string;
  readonly saving: string;
};

const COPY: Record<Language, RewardMutationCopy> = {
  vi: { deleteConfirm: (title) => `Xóa phần thưởng “${title}”?`, deleteError: 'Không thể xóa phần thưởng. Vui lòng thử lại.', saveError: 'Không thể lưu phần thưởng. Dữ liệu chưa thay đổi; vui lòng thử lại.', saving: 'Đang lưu…' },
  en: { deleteConfirm: (title) => `Delete the reward “${title}”?`, deleteError: 'The reward could not be deleted. Please try again.', saveError: 'The reward could not be saved. Nothing changed; please try again.', saving: 'Saving…' },
  fr: { deleteConfirm: (title) => `Supprimer la récompense « ${title} » ?`, deleteError: 'Impossible de supprimer la récompense. Réessayez.', saveError: 'Impossible d’enregistrer la récompense. Rien n’a changé ; réessayez.', saving: 'Enregistrement…' },
  de: { deleteConfirm: (title) => `Belohnung „${title}“ löschen?`, deleteError: 'Die Belohnung konnte nicht gelöscht werden.', saveError: 'Die Belohnung konnte nicht gespeichert werden. Es wurde nichts geändert.', saving: 'Wird gespeichert…' },
  it: { deleteConfirm: (title) => `Eliminare la ricompensa “${title}”?`, deleteError: 'Impossibile eliminare la ricompensa.', saveError: 'Impossibile salvare la ricompensa. Nessuna modifica applicata.', saving: 'Salvataggio…' },
  es: { deleteConfirm: (title) => `¿Eliminar la recompensa «${title}»?`, deleteError: 'No se pudo eliminar la recompensa.', saveError: 'No se pudo guardar la recompensa. No se aplicaron cambios.', saving: 'Guardando…' },
  zh: { deleteConfirm: (title) => `删除奖励“${title}”？`, deleteError: '无法删除奖励，请重试。', saveError: '无法保存奖励。数据未更改，请重试。', saving: '正在保存…' },
  ja: { deleteConfirm: (title) => `報酬「${title}」を削除しますか？`, deleteError: '報酬を削除できませんでした。', saveError: '報酬を保存できませんでした。変更は反映されていません。', saving: '保存中…' },
  ko: { deleteConfirm: (title) => `보상 “${title}”을 삭제할까요?`, deleteError: '보상을 삭제하지 못했습니다.', saveError: '보상을 저장하지 못했습니다. 변경 사항은 적용되지 않았습니다.', saving: '저장 중…' },
};

export function getRewardMutationCopy(language: Language): RewardMutationCopy {
  return COPY[language];
}
