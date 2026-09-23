import type { Language } from '@/types';

type ProfileMutationCopy = {
  readonly deleteConfirm: (name: string) => string;
  readonly deleteError: string;
  readonly privacyError: string;
  readonly saveError: string;
  readonly saving: string;
  readonly mascotChecking: string;
  readonly mascotCheckError: string;
  readonly mascotCooldown: (date: string) => string;
};

const COPY: Record<Language, ProfileMutationCopy> = {
  vi: { deleteConfirm: (name) => `Xóa hồ sơ của ${name} và toàn bộ dữ liệu liên quan?`, deleteError: 'Không thể xóa hồ sơ. Vui lòng thử lại.', privacyError: 'Không thể lưu lựa chọn riêng tư. Vui lòng thử lại.', saveError: 'Không thể lưu hồ sơ của bé. Vui lòng thử lại.', saving: 'Đang lưu…', mascotChecking: 'Đang kiểm tra thời hạn đổi linh vật…', mascotCheckError: 'Chưa kiểm tra được thời hạn. Hãy đóng và thử lại.', mascotCooldown: (date) => `Bé có thể đổi linh vật tiếp từ ${date}. Vẫn có thể đổi màu.` },
  en: { deleteConfirm: (name) => `Delete ${name}'s profile and all related data?`, deleteError: 'The profile could not be deleted. Please try again.', privacyError: 'The privacy choice could not be saved. Please try again.', saveError: 'The child profile could not be saved. Please try again.', saving: 'Saving…', mascotChecking: 'Checking when you can change companions…', mascotCheckError: 'Could not check the date. Close and try again.', mascotCooldown: (date) => `You can change companions again from ${date}. You can still change the color.` },
  fr: { deleteConfirm: (name) => `Supprimer le profil de ${name} et toutes les données associées ?`, deleteError: 'Impossible de supprimer le profil. Réessayez.', privacyError: 'Impossible d’enregistrer ce choix de confidentialité.', saveError: 'Impossible d’enregistrer le profil. Réessayez.', saving: 'Enregistrement…', mascotChecking: 'Vérification du délai de changement…', mascotCheckError: 'Délai indisponible. Fermez et réessayez.', mascotCooldown: (date) => `Vous pourrez changer de compagnon à partir du ${date}. La couleur reste modifiable.` },
  de: { deleteConfirm: (name) => `Profil von ${name} und alle zugehörigen Daten löschen?`, deleteError: 'Das Profil konnte nicht gelöscht werden.', privacyError: 'Die Datenschutzeinstellung konnte nicht gespeichert werden.', saveError: 'Das Kinderprofil konnte nicht gespeichert werden.', saving: 'Wird gespeichert…', mascotChecking: 'Wechseltermin wird geprüft…', mascotCheckError: 'Termin nicht verfügbar. Bitte schließen und erneut versuchen.', mascotCooldown: (date) => `Ein neuer Begleiter ist ab ${date} möglich. Die Farbe kann weiterhin geändert werden.` },
  it: { deleteConfirm: (name) => `Eliminare il profilo di ${name} e tutti i dati correlati?`, deleteError: 'Impossibile eliminare il profilo.', privacyError: 'Impossibile salvare la scelta sulla privacy.', saveError: 'Impossibile salvare il profilo.', saving: 'Salvataggio…', mascotChecking: 'Verifica della data del prossimo cambio…', mascotCheckError: 'Data non disponibile. Chiudi e riprova.', mascotCooldown: (date) => `Puoi cambiare compagno dal ${date}. Puoi comunque cambiare il colore.` },
  es: { deleteConfirm: (name) => `¿Eliminar el perfil de ${name} y todos los datos relacionados?`, deleteError: 'No se pudo eliminar el perfil.', privacyError: 'No se pudo guardar la opción de privacidad.', saveError: 'No se pudo guardar el perfil.', saving: 'Guardando…', mascotChecking: 'Comprobando la próxima fecha de cambio…', mascotCheckError: 'No se pudo comprobar la fecha. Cierra e inténtalo de nuevo.', mascotCooldown: (date) => `Podrás cambiar de compañero a partir del ${date}. Aún puedes cambiar el color.` },
  zh: { deleteConfirm: (name) => `删除${name}的档案及所有相关数据？`, deleteError: '无法删除档案，请重试。', privacyError: '无法保存隐私选项，请重试。', saveError: '无法保存孩子档案，请重试。', saving: '正在保存…', mascotChecking: '正在查看下次更换时间…', mascotCheckError: '暂时无法查看时间，请关闭后重试。', mascotCooldown: (date) => `可从${date}起再次更换伙伴。颜色仍可修改。` },
  ja: { deleteConfirm: (name) => `${name}のプロフィールと関連データをすべて削除しますか？`, deleteError: 'プロフィールを削除できませんでした。', privacyError: 'プライバシー設定を保存できませんでした。', saveError: 'プロフィールを保存できませんでした。', saving: '保存中…', mascotChecking: '次に変更できる日時を確認中…', mascotCheckError: '日時を確認できません。閉じて再試行してください。', mascotCooldown: (date) => `${date}から仲間を再び変更できます。色は変更できます。` },
  ko: { deleteConfirm: (name) => `${name}의 프로필과 관련 데이터를 모두 삭제할까요?`, deleteError: '프로필을 삭제하지 못했습니다.', privacyError: '개인정보 설정을 저장하지 못했습니다.', saveError: '아이 프로필을 저장하지 못했습니다.', saving: '저장 중…', mascotChecking: '다음 변경 가능 시간을 확인하는 중…', mascotCheckError: '시간을 확인할 수 없습니다. 닫고 다시 시도하세요.', mascotCooldown: (date) => `${date}부터 친구를 다시 바꿀 수 있습니다. 색상은 계속 바꿀 수 있습니다.` },
};

export function getProfileMutationCopy(language: Language): ProfileMutationCopy {
  return COPY[language];
}
