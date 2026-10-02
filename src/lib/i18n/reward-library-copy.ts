import type { Language } from '@/types';

export type RewardLibraryCopy = {
  readonly all: string;
  readonly experience: string;
  readonly material: string;
  readonly title: string;
  readonly intro: string;
  readonly kindLabel: string;
  readonly experienceTag: string;
  readonly materialTag: string;
  readonly suggest: (n: number) => string;
  readonly added: string;
  readonly adding: string;
  readonly add: string;
};

const COPY: Record<Language, RewardLibraryCopy> = {
  vi: {
    all: 'Tất cả gợi ý',
    experience: 'Quà phi vật chất',
    material: 'Quà vật chất',
    title: 'Gợi ý quà tặng ý nghĩa',
    intro: 'Ưu tiên thời gian bên nhau, trải nghiệm và quyền được lựa chọn. Quà vật chất nên hỗ trợ sở thích, vận động, học tập hoặc tinh thần cho đi.',
    kindLabel: 'Loại quà tặng',
    experienceTag: 'Phi vật chất',
    materialTag: 'Vật chất có mục đích',
    suggest: (n) => `Gợi ý ${n} sao`,
    added: 'Đã có trong kho quà',
    adding: 'Đang thêm…',
    add: 'Thêm vào kho quà',
  },
  en: {
    all: 'All ideas',
    experience: 'Experiences',
    material: 'Things',
    title: 'Ideas for meaningful rewards',
    intro: 'Put time together, experiences and the right to choose first. Things should support a hobby, movement, learning or the spirit of giving.',
    kindLabel: 'Kind of reward',
    experienceTag: 'Experience',
    materialTag: 'A thing with a purpose',
    suggest: (n) => `Suggested: ${n} stars`,
    added: 'Already in your rewards',
    adding: 'Adding…',
    add: 'Add to rewards',
  },
  fr: {
    all: 'Toutes les idées',
    experience: 'Expériences',
    material: 'Objets',
    title: 'Idées de récompenses qui ont du sens',
    intro: 'Privilégiez le temps passé ensemble, les expériences et le droit de choisir. Les objets doivent soutenir un loisir, le mouvement, l’apprentissage ou l’esprit de partage.',
    kindLabel: 'Type de récompense',
    experienceTag: 'Expérience',
    materialTag: 'Objet utile',
    suggest: (n) => `Suggestion : ${n} étoiles`,
    added: 'Déjà dans vos récompenses',
    adding: 'Ajout…',
    add: 'Ajouter aux récompenses',
  },
  de: {
    all: 'Alle Ideen',
    experience: 'Erlebnisse',
    material: 'Dinge',
    title: 'Ideen für sinnvolle Belohnungen',
    intro: 'Zeit miteinander, Erlebnisse und das Recht, selbst zu wählen, kommen zuerst. Dinge sollten ein Hobby, Bewegung, Lernen oder das Schenken unterstützen.',
    kindLabel: 'Art der Belohnung',
    experienceTag: 'Erlebnis',
    materialTag: 'Ein Ding mit Sinn',
    suggest: (n) => `Vorschlag: ${n} Sterne`,
    added: 'Schon in euren Belohnungen',
    adding: 'Wird hinzugefügt …',
    add: 'Zu den Belohnungen hinzufügen',
  },
  it: {
    all: 'Tutte le idee',
    experience: 'Esperienze',
    material: 'Oggetti',
    title: 'Idee per premi che hanno un significato',
    intro: 'Date la priorità al tempo insieme, alle esperienze e al diritto di scegliere. Gli oggetti dovrebbero sostenere un hobby, il movimento, lo studio o lo spirito del donare.',
    kindLabel: 'Tipo di premio',
    experienceTag: 'Esperienza',
    materialTag: 'Un oggetto con uno scopo',
    suggest: (n) => `Suggerito: ${n} stelle`,
    added: 'Già tra i vostri premi',
    adding: 'Aggiunta…',
    add: 'Aggiungi ai premi',
  },
  es: {
    all: 'Todas las ideas',
    experience: 'Experiencias',
    material: 'Objetos',
    title: 'Ideas de recompensas con sentido',
    intro: 'Prioriza el tiempo juntos, las experiencias y el derecho a elegir. Los objetos deben apoyar una afición, el movimiento, el aprendizaje o el espíritu de dar.',
    kindLabel: 'Tipo de recompensa',
    experienceTag: 'Experiencia',
    materialTag: 'Un objeto con propósito',
    suggest: (n) => `Sugerido: ${n} estrellas`,
    added: 'Ya está en vuestras recompensas',
    adding: 'Añadiendo…',
    add: 'Añadir a las recompensas',
  },
  zh: {
    all: '全部创意',
    experience: '体验类',
    material: '物品类',
    title: '有意义的奖励创意',
    intro: '优先选择共度时光、体验和选择的权利。物品则应有助于兴趣爱好、运动、学习或乐于分享的精神。',
    kindLabel: '奖励类型',
    experienceTag: '体验',
    materialTag: '有意义的物品',
    suggest: (n) => `建议：${n} 颗星`,
    added: '已在奖励库中',
    adding: '正在添加…',
    add: '添加到奖励库',
  },
  ja: {
    all: 'すべてのアイデア',
    experience: '体験',
    material: 'もの',
    title: '意味のあるごほうびのアイデア',
    intro: 'いっしょに過ごす時間、体験、選ぶ権利を優先しましょう。ものは、趣味、運動、学び、分かち合う心を支えるものがおすすめです。',
    kindLabel: 'ごほうびの種類',
    experienceTag: '体験',
    materialTag: '目的のあるもの',
    suggest: (n) => `目安：${n} スター`,
    added: 'ごほうびに追加済み',
    adding: '追加しています…',
    add: 'ごほうびに追加',
  },
  ko: {
    all: '모든 아이디어',
    experience: '경험',
    material: '물건',
    title: '의미 있는 보상 아이디어',
    intro: '함께하는 시간, 경험, 선택할 권리를 먼저 생각해 주세요. 물건은 취미, 운동, 배움, 나누는 마음을 돕는 것이 좋아요.',
    kindLabel: '보상 종류',
    experienceTag: '경험',
    materialTag: '의미 있는 물건',
    suggest: (n) => `추천: 별 ${n}개`,
    added: '이미 보상에 있어요',
    adding: '추가하는 중…',
    add: '보상에 추가',
  },
};

export function getRewardLibraryCopy(language: Language): RewardLibraryCopy {
  return COPY[language] ?? COPY.en;
}
