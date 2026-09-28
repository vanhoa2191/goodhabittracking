import type { Language } from '@/types';

export type SafeAchievementShare = Readonly<{
  title: string;
  text: string;
  url: '/';
}>;

export function buildSafeAchievementShare(language: Language): SafeAchievementShare {
  if (language === 'vi') {
    return {
      title: 'Cột mốc gia đình cùng KidHabit Hero',
      text: 'Gia đình mình vừa duy trì thêm một tuần tích cực cùng KidHabit Hero. Mỗi bước nhỏ đều đáng tự hào!',
      url: '/',
    };
  }
  return {
    title: 'A family milestone with KidHabit Hero',
    text: 'Our family just completed another positive week with KidHabit Hero. Every small step matters!',
    url: '/',
  };
}
