import type { Language } from '@/types';

export type SmallModalsCopy = {
  readonly fontSettingsLabel: string;
  readonly fontPreviewLabel: string;
  readonly fontPreviewText: string;
  readonly avatarPickerLabel: string;
  readonly colorOcean: string;
  readonly colorPink: string;
  readonly colorGreen: string;
  readonly colorGold: string;
  readonly colorPurple: string;
  readonly colorTeal: string;
  readonly colorRed: string;
  readonly colorIndigo: string;
  readonly timerLabel: string;
  readonly minutesOfPractice: (n: number) => string;
};

const COPY: Record<Language, SmallModalsCopy> = {
  vi: {
    fontSettingsLabel: 'Cài đặt chữ',
    fontPreviewLabel: 'Xem trước mẫu chữ:',
    fontPreviewText: 'Chào bé yêu! Hôm nay chúng mình cùng hoàn thành việc tốt và tích sao đổi quà nhé!',
    avatarPickerLabel: 'Chọn hình đại diện',
    colorOcean: 'Xanh Đại Dương',
    colorPink: 'Hồng Ngọt Ngào',
    colorGreen: 'Xanh Lá Tươi Vui',
    colorGold: 'Vàng Rực Rỡ',
    colorPurple: 'Tím Phép Thuật',
    colorTeal: 'Xanh Lam Ngọc',
    colorRed: 'Đỏ Năng Lượng',
    colorIndigo: 'Chàm Thông Thái',
    timerLabel: 'Đồng hồ thói quen',
    minutesOfPractice: (n) => `${n} phút rèn luyện`,
  },
  en: {
    fontSettingsLabel: 'Text settings',
    fontPreviewLabel: 'Text preview:',
    fontPreviewText: 'Hello, little one! Today let\'s finish good tasks together and collect stars for rewards!',
    avatarPickerLabel: 'Choose an avatar',
    colorOcean: 'Ocean Blue',
    colorPink: 'Sweet Pink',
    colorGreen: 'Cheerful Green',
    colorGold: 'Bright Gold',
    colorPurple: 'Magic Purple',
    colorTeal: 'Jade Teal',
    colorRed: 'Energy Red',
    colorIndigo: 'Wise Indigo',
    timerLabel: 'Habit timer',
    minutesOfPractice: (n) => `${n} minutes of practice`,
  },
  fr: {
    fontSettingsLabel: 'Réglages du texte',
    fontPreviewLabel: 'Aperçu du texte :',
    fontPreviewText: 'Bonjour, petit cœur ! Aujourd’hui, faisons ensemble de bonnes actions et gagnons des étoiles à échanger contre des récompenses !',
    avatarPickerLabel: 'Choisir un avatar',
    colorOcean: 'Bleu océan',
    colorPink: 'Rose sucré',
    colorGreen: 'Vert joyeux',
    colorGold: 'Or éclatant',
    colorPurple: 'Violet magique',
    colorTeal: 'Bleu sarcelle jade',
    colorRed: 'Rouge énergie',
    colorIndigo: 'Indigo sage',
    timerLabel: 'Minuteur des habitudes',
    minutesOfPractice: (n) => `${n} minutes de pratique`,
  },
  de: {
    fontSettingsLabel: 'Texteinstellungen',
    fontPreviewLabel: 'Textvorschau:',
    fontPreviewText: 'Hallo, kleiner Schatz! Lass uns heute gemeinsam gute Aufgaben erledigen und Sterne für Belohnungen sammeln!',
    avatarPickerLabel: 'Avatar auswählen',
    colorOcean: 'Ozeanblau',
    colorPink: 'Süßes Rosa',
    colorGreen: 'Fröhliches Grün',
    colorGold: 'Leuchtendes Gold',
    colorPurple: 'Magisches Lila',
    colorTeal: 'Jade-Türkis',
    colorRed: 'Energie-Rot',
    colorIndigo: 'Weises Indigo',
    timerLabel: 'Gewohnheits-Timer',
    minutesOfPractice: (n) => `${n} Minuten Übung`,
  },
  it: {
    fontSettingsLabel: 'Impostazioni del testo',
    fontPreviewLabel: 'Anteprima del testo:',
    fontPreviewText: 'Ciao, piccolo tesoro! Oggi completiamo insieme le buone azioni e raccogliamo stelle da scambiare con premi!',
    avatarPickerLabel: 'Scegli un avatar',
    colorOcean: 'Blu oceano',
    colorPink: 'Rosa dolce',
    colorGreen: 'Verde vivace',
    colorGold: 'Oro brillante',
    colorPurple: 'Viola magico',
    colorTeal: 'Verde acqua giada',
    colorRed: 'Rosso energia',
    colorIndigo: 'Indaco saggio',
    timerLabel: 'Timer delle abitudini',
    minutesOfPractice: (n) => `${n} minuti di pratica`,
  },
  es: {
    fontSettingsLabel: 'Ajustes de texto',
    fontPreviewLabel: 'Vista previa del texto:',
    fontPreviewText: '¡Hola, peque! Hoy vamos a completar buenas tareas juntos y a conseguir estrellas para canjearlas por premios.',
    avatarPickerLabel: 'Elegir un avatar',
    colorOcean: 'Azul océano',
    colorPink: 'Rosa dulce',
    colorGreen: 'Verde alegre',
    colorGold: 'Dorado brillante',
    colorPurple: 'Morado mágico',
    colorTeal: 'Verde azulado jade',
    colorRed: 'Rojo energía',
    colorIndigo: 'Índigo sabio',
    timerLabel: 'Temporizador de hábitos',
    minutesOfPractice: (n) => `${n} minutos de práctica`,
  },
  zh: {
    fontSettingsLabel: '文字设置',
    fontPreviewLabel: '文字预览：',
    fontPreviewText: '你好，孩子！今天我们一起完成好任务，收集星星兑换奖励吧！',
    avatarPickerLabel: '选择头像',
    colorOcean: '海洋蓝',
    colorPink: '甜粉色',
    colorGreen: '活力绿',
    colorGold: '亮金色',
    colorPurple: '魔法紫',
    colorTeal: '翡翠青',
    colorRed: '活力红',
    colorIndigo: '智慧靛蓝',
    timerLabel: '习惯计时器',
    minutesOfPractice: (n) => `练习 ${n} 分钟`,
  },
  ja: {
    fontSettingsLabel: '文字設定',
    fontPreviewLabel: 'テキストプレビュー：',
    fontPreviewText: 'こんにちは、子ども！今日は一緒に良いことを終わらせて、星を集めてごほうびと交換しよう！',
    avatarPickerLabel: 'アバターを選択',
    colorOcean: 'オーシャンブルー',
    colorPink: 'スイートピンク',
    colorGreen: 'チアフルグリーン',
    colorGold: 'ブライトゴールド',
    colorPurple: 'マジックパープル',
    colorTeal: 'ジェイドティール',
    colorRed: 'エナジーレッド',
    colorIndigo: 'ワイズインディゴ',
    timerLabel: '習慣タイマー',
    minutesOfPractice: (n) => `${n}分の練習`,
  },
  ko: {
    fontSettingsLabel: '텍스트 설정',
    fontPreviewLabel: '텍스트 미리보기:',
    fontPreviewText: '안녕, 아이야! 오늘은 함께 좋은 일을 끝내고 별을 모아 보상으로 바꿔 보자!',
    avatarPickerLabel: '아바타 선택',
    colorOcean: '오션 블루',
    colorPink: '스위트 핑크',
    colorGreen: '경쾌한 그린',
    colorGold: '브라이트 골드',
    colorPurple: '매직 퍼플',
    colorTeal: '제이드 틸',
    colorRed: '에너지 레드',
    colorIndigo: '와이즈 인디고',
    timerLabel: '습관 타이머',
    minutesOfPractice: (n) => `${n}분 연습`,
  },
};

export function getSmallModalsCopy(language: Language): SmallModalsCopy {
  return COPY[language] ?? COPY.en;
}
