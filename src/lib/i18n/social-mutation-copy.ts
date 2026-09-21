import type { Language } from '@/types';

type SocialMutationCopy = {
  readonly createError: string;
  readonly creating: string;
  readonly currentChildBadge: string;
  readonly customRewardLabel: string;
  readonly customRewardPlaceholder: string;
  readonly groupNamePlaceholder: string;
  readonly inviteCodeLabel: string;
  readonly inviteCodePlaceholder: string;
  readonly joinError: string;
  readonly joining: string;
  readonly kudoError: string;
  readonly kudoSent: string;
  readonly rewardLabel: string;
  readonly starsUnit: string;
  readonly weeklyTargetLabel: string;
};

const COPY: Record<Language, SocialMutationCopy> = {
  vi: { createError: 'Không thể tạo nhóm. Dữ liệu chưa thay đổi; vui lòng thử lại.', creating: 'Đang tạo…', currentChildBadge: 'Bé', customRewardLabel: 'Chi tiết phần thưởng tùy chọn', customRewardPlaceholder: 'Ví dụ: Chuyến đi sở thú hoặc buổi picnic', groupNamePlaceholder: 'Ví dụ: Biệt Đội Răng Xinh', inviteCodeLabel: 'Mã mời của nhóm', inviteCodePlaceholder: 'Ví dụ: HERO2026', joinError: 'Không thể tham gia nhóm bằng mã này.', joining: 'Đang tham gia…', kudoError: 'Không thể gửi lời động viên. Vui lòng thử lại.', kudoSent: 'Đã gửi!', rewardLabel: 'Phần thưởng:', starsUnit: 'sao', weeklyTargetLabel: 'Mục tiêu tuần:' },
  en: { createError: 'The group could not be created. Nothing changed; please try again.', creating: 'Creating…', currentChildBadge: 'You', customRewardLabel: 'Custom reward details', customRewardPlaceholder: 'For example: a zoo trip or picnic', groupNamePlaceholder: 'For example: Bright Smiles Team', inviteCodeLabel: 'Group invite code', inviteCodePlaceholder: 'For example: HERO2026', joinError: 'This invite code could not be used.', joining: 'Joining…', kudoError: 'The encouragement could not be sent. Please try again.', kudoSent: 'Sent!', rewardLabel: 'Reward:', starsUnit: 'stars', weeklyTargetLabel: 'Weekly target:' },
  fr: { createError: 'Impossible de créer le groupe. Réessayez.', creating: 'Création…', currentChildBadge: 'Vous', customRewardLabel: 'Détails de la récompense', customRewardPlaceholder: 'Par exemple : sortie au zoo ou pique-nique', groupNamePlaceholder: 'Par exemple : Équipe Sourires', inviteCodeLabel: 'Code d’invitation du groupe', inviteCodePlaceholder: 'Par exemple : HERO2026', joinError: 'Impossible de rejoindre ce groupe avec ce code.', joining: 'Connexion…', kudoError: 'Impossible d’envoyer l’encouragement.', kudoSent: 'Envoyé !', rewardLabel: 'Récompense :', starsUnit: 'étoiles', weeklyTargetLabel: 'Objectif hebdomadaire :' },
  de: { createError: 'Die Gruppe konnte nicht erstellt werden.', creating: 'Wird erstellt…', currentChildBadge: 'Du', customRewardLabel: 'Details zur eigenen Belohnung', customRewardPlaceholder: 'Zum Beispiel: Zoobesuch oder Picknick', groupNamePlaceholder: 'Zum Beispiel: Team Sonnenschein', inviteCodeLabel: 'Einladungscode der Gruppe', inviteCodePlaceholder: 'Zum Beispiel: HERO2026', joinError: 'Mit diesem Code konnte der Gruppe nicht beigetreten werden.', joining: 'Beitritt…', kudoError: 'Die Ermutigung konnte nicht gesendet werden.', kudoSent: 'Gesendet!', rewardLabel: 'Belohnung:', starsUnit: 'Sterne', weeklyTargetLabel: 'Wochenziel:' },
  it: { createError: 'Impossibile creare il gruppo. Riprova.', creating: 'Creazione…', currentChildBadge: 'Tu', customRewardLabel: 'Dettagli del premio personalizzato', customRewardPlaceholder: 'Ad esempio: gita allo zoo o picnic', groupNamePlaceholder: 'Ad esempio: Squadra Sorrisi', inviteCodeLabel: 'Codice di invito del gruppo', inviteCodePlaceholder: 'Ad esempio: HERO2026', joinError: 'Impossibile entrare nel gruppo con questo codice.', joining: 'Accesso…', kudoError: 'Impossibile inviare l’incoraggiamento.', kudoSent: 'Inviato!', rewardLabel: 'Premio:', starsUnit: 'stelle', weeklyTargetLabel: 'Obiettivo settimanale:' },
  es: { createError: 'No se pudo crear el grupo. Inténtalo de nuevo.', creating: 'Creando…', currentChildBadge: 'Tú', customRewardLabel: 'Detalles de la recompensa personalizada', customRewardPlaceholder: 'Por ejemplo: visita al zoo o picnic', groupNamePlaceholder: 'Por ejemplo: Equipo Sonrisas', inviteCodeLabel: 'Código de invitación del grupo', inviteCodePlaceholder: 'Por ejemplo: HERO2026', joinError: 'No se pudo entrar al grupo con este código.', joining: 'Uniéndose…', kudoError: 'No se pudo enviar el mensaje de ánimo.', kudoSent: '¡Enviado!', rewardLabel: 'Recompensa:', starsUnit: 'estrellas', weeklyTargetLabel: 'Objetivo semanal:' },
  zh: { createError: '无法创建小组，数据未更改，请重试。', creating: '正在创建…', currentChildBadge: '你', customRewardLabel: '自定义奖励详情', customRewardPlaceholder: '例如：动物园之旅或野餐', groupNamePlaceholder: '例如：阳光小队', inviteCodeLabel: '小组邀请码', inviteCodePlaceholder: '例如：HERO2026', joinError: '无法使用此邀请码加入小组。', joining: '正在加入…', kudoError: '无法发送鼓励，请重试。', kudoSent: '已发送！', rewardLabel: '奖励：', starsUnit: '颗星', weeklyTargetLabel: '每周目标：' },
  ja: { createError: 'グループを作成できませんでした。もう一度お試しください。', creating: '作成中…', currentChildBadge: 'あなた', customRewardLabel: 'オリジナル報酬の詳細', customRewardPlaceholder: '例：動物園やピクニック', groupNamePlaceholder: '例：スマイルチーム', inviteCodeLabel: 'グループ招待コード', inviteCodePlaceholder: '例：HERO2026', joinError: 'この招待コードでは参加できませんでした。', joining: '参加中…', kudoError: '応援を送信できませんでした。', kudoSent: '送信済み！', rewardLabel: 'ごほうび：', starsUnit: 'スター', weeklyTargetLabel: '週間目標：' },
  ko: { createError: '그룹을 만들지 못했습니다. 다시 시도해 주세요.', creating: '만드는 중…', currentChildBadge: '나', customRewardLabel: '맞춤 보상 세부 정보', customRewardPlaceholder: '예: 동물원 나들이 또는 소풍', groupNamePlaceholder: '예: 미소 팀', inviteCodeLabel: '그룹 초대 코드', inviteCodePlaceholder: '예: HERO2026', joinError: '이 초대 코드로 그룹에 참여하지 못했습니다.', joining: '참여 중…', kudoError: '응원 메시지를 보내지 못했습니다.', kudoSent: '보냈어요!', rewardLabel: '보상:', starsUnit: '별', weeklyTargetLabel: '주간 목표:' },
};

export function getSocialMutationCopy(language: Language): SocialMutationCopy {
  return COPY[language];
}
