import type { Language } from '@/types';

interface ParentSecondaryCopy {
  analyticsReport: string;
  deleteFamily: string;
  deleteFamilyBusy: string;
  deleteFamilyDescription: string;
  deleteFamilyError: string;
  deleteFamilyPrompt: string;
  rewardCostUnit: string;
  rewardDescriptionLabel: string;
  rewardDescriptionPlaceholder: string;
  rewardNameLabel: string;
  rewardNamePlaceholder: string;
  rewardsIntro: string;
}

const COPY: Record<Language, ParentSecondaryCopy> = {
  vi: {
    analyticsReport: 'Báo cáo thói quen', deleteFamily: 'Xóa vĩnh viễn dữ liệu gia đình', deleteFamilyBusy: 'Đang xóa…',
    deleteFamilyDescription: 'Thao tác này xóa hồ sơ bé, thói quen, tiến độ, phần thưởng và thiết bị đã ghép nối. Hãy xuất bản sao lưu trước nếu cần giữ dữ liệu.',
    deleteFamilyError: 'Xóa dữ liệu thất bại.', deleteFamilyPrompt: 'Để xóa vĩnh viễn dữ liệu gia đình, hãy nhập chính xác: DELETE FAMILY',
    rewardCostUnit: 'sao ⭐', rewardDescriptionLabel: 'Mô tả chi tiết', rewardDescriptionPlaceholder: 'Điều kiện hoặc chi tiết quà…',
    rewardNameLabel: 'Tên quà *', rewardNamePlaceholder: 'Ví dụ: Xem phim 30 phút, mua đồ chơi…', rewardsIntro: 'Tạo phần thưởng để khuyến khích con tích sao và vui mừng khi đạt mục tiêu.',
  },
  en: {
    analyticsReport: 'Habit report', deleteFamily: 'Permanently delete family data', deleteFamilyBusy: 'Deleting…',
    deleteFamilyDescription: 'This removes child profiles, habits, progress, rewards, and paired devices. Export a backup first if you need to keep the data.',
    deleteFamilyError: 'Could not delete family data.', deleteFamilyPrompt: 'To permanently delete your family data, enter exactly: DELETE FAMILY',
    rewardCostUnit: 'stars ⭐', rewardDescriptionLabel: 'Details', rewardDescriptionPlaceholder: 'Conditions or reward details…',
    rewardNameLabel: 'Reward name *', rewardNamePlaceholder: 'For example: 30 minutes of screen time, a new toy…', rewardsIntro: 'Create motivating rewards children can earn with their stars.',
  },
  fr: {
    analyticsReport: 'Rapport des habitudes', deleteFamily: 'Supprimer définitivement les données familiales', deleteFamilyBusy: 'Suppression…',
    deleteFamilyDescription: 'Cette action supprime les profils des enfants, les habitudes, les progrès, les récompenses et les appareils associés. Exportez d’abord une sauvegarde si nécessaire.',
    deleteFamilyError: 'Impossible de supprimer les données familiales.', deleteFamilyPrompt: 'Pour supprimer définitivement les données familiales, saisissez exactement : DELETE FAMILY',
    rewardCostUnit: 'étoiles ⭐', rewardDescriptionLabel: 'Détails', rewardDescriptionPlaceholder: 'Conditions ou détails de la récompense…',
    rewardNameLabel: 'Nom de la récompense *', rewardNamePlaceholder: 'Ex. : 30 minutes de film, un nouveau jouet…', rewardsIntro: 'Créez des récompenses motivantes que les enfants gagnent avec leurs étoiles.',
  },
  de: {
    analyticsReport: 'Gewohnheitsbericht', deleteFamily: 'Familiendaten endgültig löschen', deleteFamilyBusy: 'Wird gelöscht…',
    deleteFamilyDescription: 'Dadurch werden Kinderprofile, Gewohnheiten, Fortschritte, Belohnungen und gekoppelte Geräte gelöscht. Exportiere vorher bei Bedarf eine Sicherung.',
    deleteFamilyError: 'Familiendaten konnten nicht gelöscht werden.', deleteFamilyPrompt: 'Gib zum endgültigen Löschen der Familiendaten genau Folgendes ein: DELETE FAMILY',
    rewardCostUnit: 'Sterne ⭐', rewardDescriptionLabel: 'Details', rewardDescriptionPlaceholder: 'Bedingungen oder Details der Belohnung…',
    rewardNameLabel: 'Name der Belohnung *', rewardNamePlaceholder: 'Zum Beispiel: 30 Minuten Film, ein neues Spielzeug…', rewardsIntro: 'Erstelle motivierende Belohnungen, die Kinder mit ihren Sternen verdienen können.',
  },
  it: {
    analyticsReport: 'Rapporto sulle abitudini', deleteFamily: 'Elimina definitivamente i dati della famiglia', deleteFamilyBusy: 'Eliminazione…',
    deleteFamilyDescription: 'Questa azione elimina profili dei bambini, abitudini, progressi, premi e dispositivi associati. Esporta prima un backup se vuoi conservare i dati.',
    deleteFamilyError: 'Impossibile eliminare i dati della famiglia.', deleteFamilyPrompt: 'Per eliminare definitivamente i dati della famiglia, inserisci esattamente: DELETE FAMILY',
    rewardCostUnit: 'stelle ⭐', rewardDescriptionLabel: 'Dettagli', rewardDescriptionPlaceholder: 'Condizioni o dettagli del premio…',
    rewardNameLabel: 'Nome del premio *', rewardNamePlaceholder: 'Ad esempio: 30 minuti di film, un nuovo giocattolo…', rewardsIntro: 'Crea premi motivanti che i bambini possono guadagnare con le loro stelle.',
  },
  es: {
    analyticsReport: 'Informe de hábitos', deleteFamily: 'Eliminar permanentemente los datos familiares', deleteFamilyBusy: 'Eliminando…',
    deleteFamilyDescription: 'Esta acción elimina perfiles infantiles, hábitos, progreso, recompensas y dispositivos vinculados. Exporta antes una copia de seguridad si quieres conservar los datos.',
    deleteFamilyError: 'No se pudieron eliminar los datos familiares.', deleteFamilyPrompt: 'Para eliminar permanentemente los datos familiares, escribe exactamente: DELETE FAMILY',
    rewardCostUnit: 'estrellas ⭐', rewardDescriptionLabel: 'Detalles', rewardDescriptionPlaceholder: 'Condiciones o detalles de la recompensa…',
    rewardNameLabel: 'Nombre de la recompensa *', rewardNamePlaceholder: 'Por ejemplo: 30 minutos de película, un juguete nuevo…', rewardsIntro: 'Crea recompensas motivadoras que los niños puedan ganar con sus estrellas.',
  },
  zh: {
    analyticsReport: '习惯报告', deleteFamily: '永久删除家庭数据', deleteFamilyBusy: '正在删除…',
    deleteFamilyDescription: '此操作会删除孩子档案、习惯、进度、奖励和已配对设备。如需保留数据，请先导出备份。',
    deleteFamilyError: '无法删除家庭数据。', deleteFamilyPrompt: '要永久删除家庭数据，请准确输入：DELETE FAMILY',
    rewardCostUnit: '颗星 ⭐', rewardDescriptionLabel: '详细说明', rewardDescriptionPlaceholder: '奖励条件或详细信息…',
    rewardNameLabel: '奖励名称 *', rewardNamePlaceholder: '例如：看 30 分钟电影、买一个新玩具…', rewardsIntro: '创建有吸引力的奖励，让孩子用星星兑换。',
  },
  ja: {
    analyticsReport: '習慣レポート', deleteFamily: '家族データを完全に削除', deleteFamilyBusy: '削除中…',
    deleteFamilyDescription: '子どものプロフィール、習慣、進捗、報酬、連携済み端末が削除されます。データを残す場合は先にバックアップを出力してください。',
    deleteFamilyError: '家族データを削除できませんでした。', deleteFamilyPrompt: '家族データを完全に削除するには、次のとおり正確に入力してください：DELETE FAMILY',
    rewardCostUnit: 'スター ⭐', rewardDescriptionLabel: '詳細', rewardDescriptionPlaceholder: '条件や報酬の詳細…',
    rewardNameLabel: '報酬名 *', rewardNamePlaceholder: '例：映画を30分見る、新しいおもちゃ…', rewardsIntro: 'スターで獲得できる、子どものやる気を引き出す報酬を作りましょう。',
  },
  ko: {
    analyticsReport: '습관 보고서', deleteFamily: '가족 데이터 영구 삭제', deleteFamilyBusy: '삭제 중…',
    deleteFamilyDescription: '아이 프로필, 습관, 진행 상황, 보상 및 연결된 기기가 삭제됩니다. 데이터를 보관하려면 먼저 백업을 내보내세요.',
    deleteFamilyError: '가족 데이터를 삭제하지 못했습니다.', deleteFamilyPrompt: '가족 데이터를 영구 삭제하려면 다음을 정확히 입력하세요: DELETE FAMILY',
    rewardCostUnit: '별 ⭐', rewardDescriptionLabel: '상세 설명', rewardDescriptionPlaceholder: '조건 또는 보상 세부 정보…',
    rewardNameLabel: '보상 이름 *', rewardNamePlaceholder: '예: 영화 30분 보기, 새 장난감…', rewardsIntro: '아이가 별을 모아 받을 수 있는 즐거운 보상을 만들어 보세요.',
  },
};

export function getParentSecondaryCopy(language: Language): ParentSecondaryCopy {
  return COPY[language];
}
