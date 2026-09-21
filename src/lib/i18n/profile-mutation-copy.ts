import type { Language } from '@/types';

type ProfileMutationCopy = {
  readonly deleteConfirm: (name: string) => string;
  readonly deleteError: string;
  readonly privacyError: string;
  readonly saveError: string;
  readonly saving: string;
};

const COPY: Record<Language, ProfileMutationCopy> = {
  vi: { deleteConfirm: (name) => `Xóa hồ sơ của ${name} và toàn bộ dữ liệu liên quan?`, deleteError: 'Không thể xóa hồ sơ. Vui lòng thử lại.', privacyError: 'Không thể lưu lựa chọn riêng tư. Vui lòng thử lại.', saveError: 'Không thể lưu hồ sơ của bé. Vui lòng thử lại.', saving: 'Đang lưu…' },
  en: { deleteConfirm: (name) => `Delete ${name}'s profile and all related data?`, deleteError: 'The profile could not be deleted. Please try again.', privacyError: 'The privacy choice could not be saved. Please try again.', saveError: 'The child profile could not be saved. Please try again.', saving: 'Saving…' },
  fr: { deleteConfirm: (name) => `Supprimer le profil de ${name} et toutes les données associées ?`, deleteError: 'Impossible de supprimer le profil. Réessayez.', privacyError: 'Impossible d’enregistrer ce choix de confidentialité.', saveError: 'Impossible d’enregistrer le profil. Réessayez.', saving: 'Enregistrement…' },
  de: { deleteConfirm: (name) => `Profil von ${name} und alle zugehörigen Daten löschen?`, deleteError: 'Das Profil konnte nicht gelöscht werden.', privacyError: 'Die Datenschutzeinstellung konnte nicht gespeichert werden.', saveError: 'Das Kinderprofil konnte nicht gespeichert werden.', saving: 'Wird gespeichert…' },
  it: { deleteConfirm: (name) => `Eliminare il profilo di ${name} e tutti i dati correlati?`, deleteError: 'Impossibile eliminare il profilo.', privacyError: 'Impossibile salvare la scelta sulla privacy.', saveError: 'Impossibile salvare il profilo.', saving: 'Salvataggio…' },
  es: { deleteConfirm: (name) => `¿Eliminar el perfil de ${name} y todos los datos relacionados?`, deleteError: 'No se pudo eliminar el perfil.', privacyError: 'No se pudo guardar la opción de privacidad.', saveError: 'No se pudo guardar el perfil.', saving: 'Guardando…' },
  zh: { deleteConfirm: (name) => `删除${name}的档案及所有相关数据？`, deleteError: '无法删除档案，请重试。', privacyError: '无法保存隐私选项，请重试。', saveError: '无法保存孩子档案，请重试。', saving: '正在保存…' },
  ja: { deleteConfirm: (name) => `${name}のプロフィールと関連データをすべて削除しますか？`, deleteError: 'プロフィールを削除できませんでした。', privacyError: 'プライバシー設定を保存できませんでした。', saveError: 'プロフィールを保存できませんでした。', saving: '保存中…' },
  ko: { deleteConfirm: (name) => `${name}의 프로필과 관련 데이터를 모두 삭제할까요?`, deleteError: '프로필을 삭제하지 못했습니다.', privacyError: '개인정보 설정을 저장하지 못했습니다.', saveError: '아이 프로필을 저장하지 못했습니다.', saving: '저장 중…' },
};

export function getProfileMutationCopy(language: Language): ProfileMutationCopy {
  return COPY[language];
}
