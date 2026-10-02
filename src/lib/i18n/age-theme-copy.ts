import type { Language } from '@/types';

export type AgeThemeCopy = {
  readonly pointsLabel: string;
  readonly noticeTitle: string;
  readonly noticeBody: string;
  readonly noticeBodyTeen: string;
  readonly keepOld: string;
  readonly useNew: string;
  readonly styleQuestion: string;
  readonly styleCompact: string;
  readonly styleCompanion: string;
  readonly switchStyle: string;
};

const COPY: Record<Language, AgeThemeCopy> = {
  vi: {
    pointsLabel: 'Điểm',
    noticeTitle: 'Giao diện đã hợp với tuổi hơn',
    noticeBody: 'Nút bấm, chữ và lời khen vừa được chỉnh cho hợp độ tuổi. Nếu chưa quen, con vẫn có thể giữ giao diện cũ.',
    noticeBodyTeen: 'Giao diện vừa được làm gọn cho hợp độ tuổi của bạn. Bạn chọn phong cách mình thích nhé; đổi lại lúc nào cũng được.',
    keepOld: 'Giữ giao diện cũ',
    useNew: 'Dùng giao diện mới',
    styleQuestion: 'Chọn phong cách',
    styleCompact: 'Gọn',
    styleCompanion: 'Có bạn đồng hành',
    switchStyle: 'Đổi phong cách',
  },
  en: {
    pointsLabel: 'Points',
    noticeTitle: 'The screen now fits your age better',
    noticeBody: 'Buttons, text and praise were adjusted for your age. If it feels odd, you can keep the old look.',
    noticeBodyTeen: 'The screen was made leaner for your age. Pick the style you like; you can change it any time.',
    keepOld: 'Keep the old look',
    useNew: 'Use the new look',
    styleQuestion: 'Choose a style',
    styleCompact: 'Lean',
    styleCompanion: 'With a companion',
    switchStyle: 'Change style',
  },
  fr: {
    pointsLabel: 'Points',
    noticeTitle: 'L’écran est mieux adapté à ton âge',
    noticeBody: 'Les boutons, le texte et les félicitations ont été ajustés à ton âge. Si ça te gêne, tu peux garder l’ancien aspect.',
    noticeBodyTeen: 'L’écran a été allégé pour ton âge. Choisis le style que tu préfères ; tu peux en changer à tout moment.',
    keepOld: 'Garder l’ancien aspect',
    useNew: 'Utiliser le nouvel aspect',
    styleQuestion: 'Choisis un style',
    styleCompact: 'Épuré',
    styleCompanion: 'Avec un compagnon',
    switchStyle: 'Changer de style',
  },
  de: {
    pointsLabel: 'Punkte',
    noticeTitle: 'Der Bildschirm passt jetzt besser zu deinem Alter',
    noticeBody: 'Tasten, Text und Lob wurden an dein Alter angepasst. Wenn es sich komisch anfühlt, kannst du das alte Aussehen behalten.',
    noticeBodyTeen: 'Der Bildschirm wurde für dein Alter aufgeräumt. Wähle den Stil, der dir gefällt; du kannst ihn jederzeit ändern.',
    keepOld: 'Altes Aussehen behalten',
    useNew: 'Neues Aussehen nutzen',
    styleQuestion: 'Wähle einen Stil',
    styleCompact: 'Schlicht',
    styleCompanion: 'Mit Begleiter',
    switchStyle: 'Stil ändern',
  },
  it: {
    pointsLabel: 'Punti',
    noticeTitle: 'Lo schermo ora si adatta meglio alla tua età',
    noticeBody: 'Pulsanti, testo e complimenti sono stati regolati per la tua età. Se non ti convince, puoi tenere l’aspetto di prima.',
    noticeBodyTeen: 'Lo schermo è stato alleggerito per la tua età. Scegli lo stile che preferisci; puoi cambiarlo quando vuoi.',
    keepOld: 'Tieni l’aspetto di prima',
    useNew: 'Usa il nuovo aspetto',
    styleQuestion: 'Scegli uno stile',
    styleCompact: 'Essenziale',
    styleCompanion: 'Con un compagno',
    switchStyle: 'Cambia stile',
  },
  es: {
    pointsLabel: 'Puntos',
    noticeTitle: 'La pantalla ahora se ajusta mejor a tu edad',
    noticeBody: 'Los botones, el texto y los elogios se ajustaron a tu edad. Si no te convence, puedes mantener el aspecto anterior.',
    noticeBodyTeen: 'La pantalla se simplificó para tu edad. Elige el estilo que prefieras; puedes cambiarlo cuando quieras.',
    keepOld: 'Mantener el aspecto anterior',
    useNew: 'Usar el aspecto nuevo',
    styleQuestion: 'Elige un estilo',
    styleCompact: 'Sencillo',
    styleCompanion: 'Con compañero',
    switchStyle: 'Cambiar de estilo',
  },
  zh: {
    pointsLabel: '积分',
    noticeTitle: '界面已更适合你的年龄',
    noticeBody: '按钮、文字和表扬已按你的年龄调整。如果不习惯，可以保留旧界面。',
    noticeBodyTeen: '界面已按你的年龄简化。选一个你喜欢的风格吧，随时可以更改。',
    keepOld: '保留旧界面',
    useNew: '使用新界面',
    styleQuestion: '选择风格',
    styleCompact: '简洁',
    styleCompanion: '有伙伴陪伴',
    switchStyle: '更换风格',
  },
  ja: {
    pointsLabel: 'ポイント',
    noticeTitle: '年齢に合わせた画面になりました',
    noticeBody: 'ボタン・文字・ほめ言葉を年齢に合わせて調整しました。なじまないときは、前の画面のままにできます。',
    noticeBodyTeen: '年齢に合わせて画面をすっきりさせました。好きなスタイルを選んでください。いつでも変更できます。',
    keepOld: '前の画面のままにする',
    useNew: '新しい画面を使う',
    styleQuestion: 'スタイルを選ぶ',
    styleCompact: 'シンプル',
    styleCompanion: '仲間といっしょ',
    switchStyle: 'スタイルを変更',
  },
  ko: {
    pointsLabel: '포인트',
    noticeTitle: '화면이 나이에 더 잘 맞게 바뀌었어요',
    noticeBody: '버튼, 글자, 칭찬이 나이에 맞게 조정되었어요. 어색하면 예전 화면을 그대로 쓸 수 있어요.',
    noticeBodyTeen: '나이에 맞게 화면을 간결하게 바꿨어요. 마음에 드는 스타일을 골라 보세요. 언제든 바꿀 수 있어요.',
    keepOld: '예전 화면 유지',
    useNew: '새 화면 사용',
    styleQuestion: '스타일 선택',
    styleCompact: '간결하게',
    styleCompanion: '친구와 함께',
    switchStyle: '스타일 바꾸기',
  },
};

export function getAgeThemeCopy(language: Language): AgeThemeCopy {
  return COPY[language] ?? COPY.en;
}
