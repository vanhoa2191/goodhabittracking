import type { Language } from '@/types';
import { getMarketingOrigin } from '@/lib/site';

export type SafeAchievementShare = Readonly<{
  title: string;
  text: string;
  url: string;
}>;

type AchievementShareCopy = Readonly<Pick<SafeAchievementShare, 'title' | 'text'>>;

const COPY: Record<Language, AchievementShareCopy> = {
  vi: { title: 'Cột mốc gia đình cùng KidHabit Hero', text: 'Gia đình mình vừa duy trì thêm một tuần tích cực cùng KidHabit Hero. Mỗi bước nhỏ đều đáng tự hào!' },
  en: { title: 'A family milestone with KidHabit Hero', text: 'Our family just completed another positive week with KidHabit Hero. Every small step matters!' },
  fr: { title: 'Une étape en famille avec KidHabit Hero', text: 'Notre famille vient de passer une nouvelle semaine positive avec KidHabit Hero. Chaque petit pas compte !' },
  de: { title: 'Ein Familienmeilenstein mit KidHabit Hero', text: 'Unsere Familie hat mit KidHabit Hero eine weitere positive Woche geschafft. Jeder kleine Schritt zählt!' },
  it: { title: 'Un traguardo di famiglia con KidHabit Hero', text: 'La nostra famiglia ha appena trascorso un’altra settimana positiva con KidHabit Hero. Ogni piccolo passo conta!' },
  es: { title: 'Un logro familiar con KidHabit Hero', text: 'Nuestra familia acaba de completar otra semana positiva con KidHabit Hero. ¡Cada pequeño paso cuenta!' },
  zh: { title: '与 KidHabit Hero 一起见证家庭里程碑', text: '我们家又和 KidHabit Hero 一起度过了积极的一周。每一小步都值得骄傲！' },
  ja: { title: 'KidHabit Hero と迎える家族の節目', text: '私たち家族は KidHabit Hero とまた一週間、前向きに過ごせました。小さな一歩にも価値があります！' },
  ko: { title: 'KidHabit Hero와 함께한 가족의 성취', text: '우리 가족은 KidHabit Hero와 함께 또 한 주를 긍정적으로 보냈어요. 작은 한 걸음도 소중해요!' },
};

export function buildSafeAchievementShare(language: Language): SafeAchievementShare {
  const url = getMarketingOrigin().href;
  return { ...(COPY[language] ?? COPY.en), url };
}
