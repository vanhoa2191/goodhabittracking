import { localDayKey } from '@/lib/local-day';
import type { Language } from '@/types';
import { getMascot } from '@/lib/mascots';
import type { MascotId } from '@/lib/mascots';

const DAY_MS = 86_400_000;

type DailyLetterCopy = {
  readonly introductions: Record<MascotId, string>;
  readonly prompts: readonly [string, string, string];
  readonly closing: string;
  readonly greeting: (name: string) => string;
};

const COPY: Record<Language, DailyLetterCopy> = {
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
  fr: {
    introductions: {
      'mascot:leo': 'Je suis Leo, et nous allons apprendre le courage par petites touches.',
      'mascot:bunny': 'Je suis Bunny, et j’aime ta façon de prendre soin des autres.',
      'mascot:panda': 'Je suis Panda, et je crois qu’un moment calme nous aide à mieux voir.',
      'mascot:fox': 'Je suis Fox, et je suis toujours curieux de découvrir quelque chose de nouveau.',
      'mascot:turtle': 'Je suis Turtle, et j’avancerai patiemment avec toi.',
      'mascot:bee': 'Je suis Bee, et je suis le plus heureux quand nous nous aidons.',
    },
    prompts: [
      'Aujourd’hui, choisis une petite tâche et fais de ton mieux.',
      'Si quelque chose semble difficile, avance étape par étape et demande de l’aide.',
      'Un merci ou un geste gentil peut rendre cette journée plus lumineuse.',
    ],
    closing: 'Je suis là pour célébrer chacun de tes progrès.',
    greeting: (name: string) => `Bonjour ${name},`,
  },
  de: {
    introductions: {
      'mascot:leo': 'Ich bin Leo, und wir üben gemeinsam Mut in kleinen Schritten.',
      'mascot:bunny': 'Ich bin Bunny, und ich mag, wie du dich um andere kümmerst.',
      'mascot:panda': 'Ich bin Panda, und ich glaube, dass Ruhe uns klarer sehen lässt.',
      'mascot:fox': 'Ich bin Fox, und ich bin immer neugierig auf etwas Neues.',
      'mascot:turtle': 'Ich bin Turtle, und ich gehe geduldig mit dir weiter.',
      'mascot:bee': 'Ich bin Bee, und am glücklichsten bin ich, wenn wir einander helfen.',
    },
    prompts: [
      'Wähle heute eine kleine Aufgabe und gib dein Bestes.',
      'Wenn etwas schwer ist, versuche es Schritt für Schritt und bitte um Hilfe.',
      'Ein Dankeschön oder eine freundliche Tat kann diesen Tag heller machen.',
    ],
    closing: 'Ich bin hier und freue mich über jeden Schritt, den du machst.',
    greeting: (name: string) => `Hallo ${name},`,
  },
  it: {
    introductions: {
      'mascot:leo': 'Sono Leo, e insieme ci alleneremo al coraggio con piccoli passi.',
      'mascot:bunny': 'Sono Bunny, e adoro il modo in cui ti prendi cura degli altri.',
      'mascot:panda': 'Sono Panda, e credo che un momento calmo ci aiuti a vedere meglio.',
      'mascot:fox': 'Sono Fox, e sono sempre curioso di scoprire qualcosa di nuovo.',
      'mascot:turtle': 'Sono Turtle, e farò passi pazienti insieme a te.',
      'mascot:bee': 'Sono Bee, e sono felice soprattutto quando ci aiutiamo a vicenda.',
    },
    prompts: [
      'Oggi scegli un piccolo compito e impegnati al massimo.',
      'Se qualcosa sembra difficile, prova un passo alla volta e chiedi aiuto.',
      'Un grazie o un gesto gentile può rendere più luminosa questa giornata.',
    ],
    closing: 'Sono qui per festeggiare ogni passo che fai.',
    greeting: (name: string) => `Ciao ${name},`,
  },
  es: {
    introductions: {
      'mascot:leo': 'Soy Leo, y practicaremos juntos la valentía con pequeños pasos.',
      'mascot:bunny': 'Soy Bunny, y me encanta cómo cuidas de los demás.',
      'mascot:panda': 'Soy Panda, y creo que un momento de calma nos ayuda a ver con claridad.',
      'mascot:fox': 'Soy Fox, y siempre siento curiosidad por algo nuevo.',
      'mascot:turtle': 'Soy Turtle, y avanzaré contigo con paciencia.',
      'mascot:bee': 'Soy Bee, y soy más feliz cuando nos ayudamos.',
    },
    prompts: [
      'Hoy elige una tarea pequeña y haz todo lo posible.',
      'Si algo parece difícil, inténtalo paso a paso y pide ayuda.',
      'Un agradecimiento o un gesto amable puede alegrar este día.',
    ],
    closing: 'Estoy aquí para celebrar cada paso que das.',
    greeting: (name: string) => `Hola ${name},`,
  },
  zh: {
    introductions: {
      'mascot:leo': '我是Leo，我们一起从小事开始练习勇敢。',
      'mascot:bunny': '我是Bunny，我喜欢你关心他人的样子。',
      'mascot:panda': '我是Panda，我相信片刻的平静能让我们看得更清楚。',
      'mascot:fox': '我是Fox，我总是对新事物充满好奇。',
      'mascot:turtle': '我是Turtle，我会耐心地陪你一步步前进。',
      'mascot:bee': '我是Bee，大家互相帮助时我最开心。',
    },
    prompts: [
      '今天选一件小任务，认真完成它吧。',
      '如果事情有点难，就一步一步来，也可以寻求帮助。',
      '一句谢谢或一个善意的举动，能让今天更明亮。',
    ],
    closing: '我会陪你庆祝每一步进步。',
    greeting: (name: string) => `你好，${name}！`,
  },
  ja: {
    introductions: {
      'mascot:leo': 'ぼくはLeo。小さなことから、一緒に勇気を出してみよう。',
      'mascot:bunny': 'ぼくはBunny。みんなを思いやるあなたが大好きだよ。',
      'mascot:panda': 'ぼくはPanda。少し落ち着くと、ものごとがもっとはっきり見えると思うよ。',
      'mascot:fox': 'ぼくはFox。新しいことにはいつもわくわくするんだ。',
      'mascot:turtle': 'ぼくはTurtle。ゆっくりでも、一緒に進んでいこうね。',
      'mascot:bee': 'ぼくはBee。おたがいに助け合えると、とってもうれしいよ。',
    },
    prompts: [
      '今日は小さなことを一つ選んで、力を出してみよう。',
      'むずかしいときは、一歩ずつ進んで、助けを求めてもいいよ。',
      '「ありがとう」や親切な行動が、今日をもっと明るくしてくれるよ。',
    ],
    closing: 'あなたの一歩一歩を、ここで一緒に喜ぶよ。',
    greeting: (name: string) => `${name}さん、こんにちは。`,
  },
  ko: {
    introductions: {
      'mascot:leo': '나는 Leo야. 우리 함께 작은 일부터 용기를 연습해 보자.',
      'mascot:bunny': '나는 Bunny야. 다른 사람을 챙기는 네 모습이 정말 좋아.',
      'mascot:panda': '나는 Panda야. 잠시 마음을 가라앉히면 더 잘 볼 수 있다고 믿어.',
      'mascot:fox': '나는 Fox야. 나는 늘 새로운 것이 궁금해.',
      'mascot:turtle': '나는 Turtle이야. 우리 천천히, 꾸준히 함께 걸어가자.',
      'mascot:bee': '나는 Bee야. 서로 도울 때 가장 행복해.',
    },
    prompts: [
      '오늘은 작은 일 하나를 골라 최선을 다해 보자.',
      '어려운 일이 있다면 한 걸음씩 해 보고 도움을 요청해도 좋아.',
      '고맙다는 말이나 친절한 행동 하나가 오늘을 더 환하게 만들어.',
    ],
    closing: '네가 내딛는 모든 걸음을 함께 기뻐할게.',
    greeting: (name: string) => `안녕 ${name},`,
  },
};

export type DailyLetter = {
  readonly date: string;
  readonly templateKey: string;
  readonly text: string;
};

export function localDateKey(date: Date): string {
  return localDayKey(date);
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
  const copy = COPY[language] ?? COPY.en;
  const introduction = copy.introductions[mascotId];
  const prompt = copy.prompts[variant];
  return {
    date: localDateKey(date),
    templateKey,
    text: `${copy.greeting(childName)} ${introduction} ${prompt} ${copy.closing}`,
  };
}
