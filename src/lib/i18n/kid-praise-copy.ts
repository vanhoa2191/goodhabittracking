import type { Language } from '@/types';
import type { AgeBand } from '@/lib/age-band';

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

/** Calmer lines for the older bands: say what was done, drop the exclamation-heavy cheering, never sound like a toddler app. */
const OLDER_COPY: Record<Language, Record<'tween' | 'teen', PraiseCopy>> = {
  vi: {
    tween: { done: ['Làm tốt lắm!', 'Xong việc rồi!', 'Giữ vững nhé!'], points: (points) => `+${points} sao`, waiting: 'Đã xong. Chờ ba mẹ xem nhé.' },
    teen: { done: ['Xong.', 'Đã hoàn thành.', 'Giữ nhịp tốt.'], points: (points) => `+${points} điểm`, waiting: 'Đã gửi, chờ ba mẹ xem.' },
  },
  en: {
    tween: { done: ['Nice work!', 'Task done!', 'Keep it up!'], points: (points) => `+${points} stars`, waiting: 'Done. A parent will check it.' },
    teen: { done: ['Done.', 'Completed.', 'Good pace.'], points: (points) => `+${points} points`, waiting: 'Sent, waiting for a parent to check.' },
  },
  fr: {
    tween: { done: ['Beau travail !', 'C\'est fait !', 'Continue comme ça !'], points: (points) => `+${points} étoiles`, waiting: 'C\'est fait. Un parent va vérifier.' },
    teen: { done: ['Fait.', 'Terminé.', 'Bon rythme.'], points: (points) => `+${points} points`, waiting: 'Envoyé, en attente d\'un parent.' },
  },
  de: {
    tween: { done: ['Gut gemacht!', 'Erledigt!', 'Weiter so!'], points: (points) => `+${points} Sterne`, waiting: 'Erledigt. Ein Elternteil schaut es an.' },
    teen: { done: ['Erledigt.', 'Abgeschlossen.', 'Guter Rhythmus.'], points: (points) => `+${points} Punkte`, waiting: 'Gesendet, wartet auf ein Elternteil.' },
  },
  it: {
    tween: { done: ['Bel lavoro!', 'Fatto!', 'Continua così!'], points: (points) => `+${points} stelle`, waiting: 'Fatto. Lo controlla un genitore.' },
    teen: { done: ['Fatto.', 'Completato.', 'Buon ritmo.'], points: (points) => `+${points} punti`, waiting: 'Inviato, in attesa di un genitore.' },
  },
  es: {
    tween: { done: ['¡Buen trabajo!', '¡Hecho!', '¡Sigue así!'], points: (points) => `+${points} estrellas`, waiting: 'Hecho. Lo revisa un adulto.' },
    teen: { done: ['Hecho.', 'Completado.', 'Buen ritmo.'], points: (points) => `+${points} puntos`, waiting: 'Enviado, pendiente de un adulto.' },
  },
  zh: {
    tween: { done: ['做得好！', '完成啦！', '继续保持！'], points: (points) => `+${points} 颗星`, waiting: '已完成，等爸爸妈妈确认。' },
    teen: { done: ['完成。', '已完成。', '节奏不错。'], points: (points) => `+${points} 分`, waiting: '已提交，等家长确认。' },
  },
  ja: {
    tween: { done: ['よくできたね！', 'おわったよ！', 'このちょうし！'], points: (points) => `+${points} スター`, waiting: 'おわったよ。おうちの人がみるよ。' },
    teen: { done: ['完了。', '達成しました。', 'いいペース。'], points: (points) => `+${points} ポイント`, waiting: '送信しました。保護者の確認待ちです。' },
  },
  ko: {
    tween: { done: ['잘했어!', '끝냈어!', '계속 이렇게!'], points: (points) => `+${points} 별`, waiting: '끝냈어. 부모님이 확인해 주실 거야.' },
    teen: { done: ['완료.', '끝났어요.', '좋은 페이스.'], points: (points) => `+${points} 포인트`, waiting: '제출했어요. 부모님 확인을 기다려요.' },
  },
};

/** The line a child reads on the card right after ticking a task; the tone follows the age band, the youngest tone when none is known. */
export function kidPraise(
  language: Language,
  input: { readonly points: number; readonly waitsForParent: boolean; readonly seed: string; readonly band?: AgeBand | null },
): string {
  const copy = input.band && input.band !== 'young' ? (OLDER_COPY[language] ?? OLDER_COPY.en)[input.band] : (COPY[language] ?? COPY.en);
  if (input.waitsForParent) return copy.waiting;
  const index = [...input.seed].reduce((sum, character) => sum + character.charCodeAt(0), 0) % copy.done.length;
  const line = copy.done[index] ?? copy.done[0] ?? '';
  return input.points > 0 ? `${line} ${copy.points(input.points)}` : line;
}
