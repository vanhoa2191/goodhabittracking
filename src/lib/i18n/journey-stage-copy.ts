import type { Language } from '@/types';
import type { JourneyStageId } from '@/lib/journeys/age-journeys';

export type JourneyStageCopy = { readonly title: string; readonly adultRole: string };

const COPY: Record<Language, Record<JourneyStageId, JourneyStageCopy>> = {
  vi: {
    GD1: { title: 'An toàn và giác quan', adultRole: 'Ba mẹ làm mẫu và mô tả' },
    GD2: { title: 'Khám phá và ý chí', adultRole: 'Ba mẹ làm cùng và nhắc nhẹ' },
    GD3: { title: 'Cần cù và kỹ năng', adultRole: 'Ba mẹ theo dõi và cùng làm' },
    GD4: { title: 'Bản sắc và cảm xúc', adultRole: 'Ba mẹ đồng hành, cùng tuân luật chung' },
    GD5: { title: 'Định hướng và trách nhiệm', adultRole: 'Ba mẹ làm cố vấn và hậu thuẫn' },
  },
  en: {
    GD1: { title: 'Safety and senses', adultRole: 'You model and describe' },
    GD2: { title: 'Exploring and willpower', adultRole: 'You do it together and remind gently' },
    GD3: { title: 'Effort and skills', adultRole: 'You supervise and join in' },
    GD4: { title: 'Identity and emotions', adultRole: 'You walk alongside and follow the shared rules too' },
    GD5: { title: 'Direction and responsibility', adultRole: 'You advise and back them up' },
  },
  fr: {
    GD1: { title: 'Sécurité et éveil des sens', adultRole: 'Vous montrez l’exemple et décrivez' },
    GD2: { title: 'Exploration et volonté', adultRole: 'Vous faites l’activité ensemble et vous lui rappelez les choses avec douceur' },
    GD3: { title: 'Effort et compétences', adultRole: 'Vous supervisez et participez' },
    GD4: { title: 'Identité et émotions', adultRole: 'Vous accompagnez votre enfant et suivez aussi les règles communes' },
    GD5: { title: 'Orientation et responsabilité', adultRole: 'Vous conseillez et soutenez votre enfant' },
  },
  de: {
    GD1: { title: 'Sicherheit und Sinne', adultRole: 'Sie machen es vor und beschreiben' },
    GD2: { title: 'Erkunden und Willenskraft', adultRole: 'Sie machen es gemeinsam und erinnern sanft' },
    GD3: { title: 'Einsatz und Fähigkeiten', adultRole: 'Sie behalten den Überblick und machen mit' },
    GD4: { title: 'Identität und Gefühle', adultRole: 'Sie begleiten Ihr Kind und halten sich auch an die gemeinsamen Regeln' },
    GD5: { title: 'Orientierung und Verantwortung', adultRole: 'Sie beraten und stärken Ihrem Kind den Rücken' },
  },
  it: {
    GD1: { title: 'Sicurezza e sensi', adultRole: 'Dai il buon esempio e descrivi' },
    GD2: { title: 'Esplorazione e volontà', adultRole: 'Lo fai insieme a tuo figlio e ricordi con gentilezza' },
    GD3: { title: 'Impegno e competenze', adultRole: 'Supervisioni e partecipi' },
    GD4: { title: 'Identità ed emozioni', adultRole: 'Affianchi tuo figlio e segui anche tu le regole comuni' },
    GD5: { title: 'Direzione e responsabilità', adultRole: 'Consigli e sostieni tuo figlio' },
  },
  es: {
    GD1: { title: 'Seguridad y sentidos', adultRole: 'Das el ejemplo y describes' },
    GD2: { title: 'Exploración y voluntad', adultRole: 'Lo haces junto a tu hijo y le recuerdas la tarea con suavidad' },
    GD3: { title: 'Esfuerzo y habilidades', adultRole: 'Supervisas y participas' },
    GD4: { title: 'Identidad y emociones', adultRole: 'Acompañas a tu hijo y también sigues las reglas comunes' },
    GD5: { title: 'Dirección y responsabilidad', adultRole: 'Aconsejas y respaldas a tu hijo' },
  },
  zh: {
    GD1: { title: '安全与感官', adultRole: '您示范并描述' },
    GD2: { title: '探索与意志力', adultRole: '您和孩子一起做，并温和提醒' },
    GD3: { title: '努力与技能', adultRole: '您监督并一起参与' },
    GD4: { title: '自我认同与情绪', adultRole: '您陪伴孩子，也一起遵守共同规则' },
    GD5: { title: '方向与责任', adultRole: '您提供建议并支持孩子' },
  },
  ja: {
    GD1: { title: '安全と感覚', adultRole: 'お手本を示し、言葉で説明します' },
    GD2: { title: '探究心と意志', adultRole: '一緒に取り組み、やさしく声をかけます' },
    GD3: { title: '努力とスキル', adultRole: '見守りながら、一緒に取り組みます' },
    GD4: { title: '自分らしさと感情', adultRole: '寄り添い、共通のルールを一緒に守ります' },
    GD5: { title: '方向性と責任', adultRole: '助言し、支えます' },
  },
  ko: {
    GD1: { title: '안전과 감각', adultRole: '부모님이 본보기가 되어 설명해 주세요' },
    GD2: { title: '탐색과 의지력', adultRole: '함께 하며 부드럽게 알려 주세요' },
    GD3: { title: '노력과 기술', adultRole: '지켜보며 함께 참여해 주세요' },
    GD4: { title: '정체성과 감정', adultRole: '곁에서 함께하고 공동 규칙도 지켜 주세요' },
    GD5: { title: '방향과 책임', adultRole: '조언하고 든든히 뒷받침해 주세요' },
  },
};

export function getJourneyStageCopy(language: Language, stage: JourneyStageId): JourneyStageCopy {
  return (COPY[language] ?? COPY.en)[stage];
}
