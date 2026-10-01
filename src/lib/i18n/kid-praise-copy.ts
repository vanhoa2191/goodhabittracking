import type { Language } from '@/types';

type PraiseCopy = {
  /** Short lines for a finished task; the child sees one, picked by task so it does not repeat on every tap. */
  readonly done: readonly string[];
  readonly points: (points: number) => string;
  /** For a task a parent has to approve first. */
  readonly waiting: string;
};

const COPY: Record<Language, PraiseCopy> = {
  vi: {
    done: ['Giỏi quá con!', 'Con làm được rồi!', 'Tuyệt vời, cố lên nhé!'],
    points: (points) => `+${points} sao`,
    waiting: 'Con đã làm xong! Chờ ba mẹ duyệt nhé.',
  },
  en: {
    done: ['Great job!', 'You did it!', 'Awesome, keep going!'],
    points: (points) => `+${points} stars`,
    waiting: 'You did it! Now a parent will check.',
  },
  fr: {
    done: ['Bravo !', 'Tu as réussi !', 'Génial, continue !'],
    points: (points) => `+${points} étoiles`,
    waiting: 'Bravo ! Un parent va vérifier.',
  },
  de: {
    done: ['Super gemacht!', 'Du hast es geschafft!', 'Toll, weiter so!'],
    points: (points) => `+${points} Sterne`,
    waiting: 'Geschafft! Gleich schaut ein Elternteil nach.',
  },
  it: {
    done: ['Bravissimo!', 'Ce l\'hai fatta!', 'Fantastico, continua così!'],
    points: (points) => `+${points} stelle`,
    waiting: 'Fatto! Ora controlla un genitore.',
  },
  es: {
    done: ['¡Muy bien!', '¡Lo lograste!', '¡Genial, sigue así!'],
    points: (points) => `+${points} estrellas`,
    waiting: '¡Lo lograste! Ahora lo revisa un adulto.',
  },
  zh: {
    done: ['太棒了！', '你做到了！', '真厉害，继续加油！'],
    points: (points) => `+${points} 颗星`,
    waiting: '你做完啦！等爸爸妈妈确认哦。',
  },
  ja: {
    done: ['すごいね！', 'できたね！', 'いいぞ、そのちょうし！'],
    points: (points) => `+${points} スター`,
    waiting: 'できたね！おうちの人がみてくれるよ。',
  },
  ko: {
    done: ['정말 잘했어!', '해냈구나!', '멋져, 계속 해 보자!'],
    points: (points) => `+${points} 별`,
    waiting: '해냈어! 이제 부모님이 확인해 주실 거야.',
  },
};

/** The line a child reads on the card right after ticking a task. */
export function kidPraise(
  language: Language,
  input: { readonly points: number; readonly waitsForParent: boolean; readonly seed: string },
): string {
  const copy = COPY[language] ?? COPY.en;
  if (input.waitsForParent) return copy.waiting;
  const index = [...input.seed].reduce((sum, character) => sum + character.charCodeAt(0), 0) % copy.done.length;
  const line = copy.done[index] ?? copy.done[0] ?? '';
  return input.points > 0 ? `${line} ${copy.points(input.points)}` : line;
}
