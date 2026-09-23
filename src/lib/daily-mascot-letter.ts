import type { Language } from '@/types';
import { getMascot } from '@/lib/mascots';
import type { MascotId } from '@/lib/mascots';

const DAY_MS = 86_400_000;

const COPY = {
  vi: {
    introductions: {
      'mascot:leo': 'mình là Leo và sẽ cùng bạn tập dũng cảm từ những việc nhỏ.',
      'mascot:bunny': 'mình là Bunny và rất thích cách bạn quan tâm mọi người.',
      'mascot:panda': 'mình là Panda và tin rằng bình tĩnh giúp ta nhìn rõ hơn.',
      'mascot:fox': 'mình là Fox và luôn tò mò trước điều mới.',
      'mascot:turtle': 'mình là Turtle và sẽ kiên nhẫn đi cùng bạn.',
      'mascot:bee': 'mình là Bee và vui nhất khi mọi người cùng giúp nhau.',
    },
    prompts: [
      'Hôm nay, hãy chọn một việc nhỏ và làm hết sức mình.',
      'Nếu gặp việc khó, bạn có thể thử từng bước và nhờ giúp đỡ.',
      'Một lời cảm ơn hoặc một hành động tử tế sẽ làm ngày mới ấm hơn.',
    ],
    closing: 'Mình sẽ ở đây để cùng bạn ghi nhận từng bước tiến.',
    greeting: (name: string) => `Chào ${name},`,
  },
  en: {
    introductions: {
      'mascot:leo': 'I am Leo, and I will practice courage with you in small ways.',
      'mascot:bunny': 'I am Bunny, and I love how you care for others.',
      'mascot:panda': 'I am Panda, and I believe a calm moment helps us see clearly.',
      'mascot:fox': 'I am Fox, and I am always curious about something new.',
      'mascot:turtle': 'I am Turtle, and I will take patient steps with you.',
      'mascot:bee': 'I am Bee, and I feel happiest when we help each other.',
    },
    prompts: [
      'Today, choose one small task and give it your best effort.',
      'If something feels hard, try one step at a time and ask for help.',
      'A thank-you or a kind action can make this day brighter.',
    ],
    closing: 'I am here to celebrate every step you take.',
    greeting: (name: string) => `Hi ${name},`,
  },
} as const;

export type DailyLetter = {
  readonly date: string;
  readonly templateKey: string;
  readonly text: string;
};

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function templateVariant(date: Date): 0 | 1 | 2 {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  const remainder = dayNumber % 3;
  if (remainder === 0 || remainder === 1) return remainder;
  return 2;
}

export function dailyLetterFor(avatar: string, language: Language, childName: string, date = new Date()): DailyLetter | null {
  if (date.getHours() < 7) return null;

  const mascotId: MascotId = getMascot(avatar)?.id ?? 'mascot:leo';
  const variant = templateVariant(date);
  return letterFromTemplateKey(`${mascotId.slice(7)}_${variant}`, language, childName, date);
}

export function letterFromTemplateKey(templateKey: string, language: Language, childName: string, date: Date): DailyLetter | null {
  const match = /^(leo|bunny|panda|fox|turtle|bee)_([0-2])$/.exec(templateKey);
  if (!match) return null;
  const mascotId: MascotId = getMascot(`mascot:${match[1]}`)?.id ?? 'mascot:leo';
  const variant = match[2] === '0' ? 0 : match[2] === '1' ? 1 : 2;
  const copy = language === 'vi' ? COPY.vi : COPY.en;
  const introduction = copy.introductions[mascotId];
  const prompt = copy.prompts[variant];
  return {
    date: localDateKey(date),
    templateKey,
    text: `${copy.greeting(childName)} ${introduction} ${prompt} ${copy.closing}`,
  };
}
