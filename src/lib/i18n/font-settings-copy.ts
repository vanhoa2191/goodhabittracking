import type { Language } from '@/types';

export interface FontSettingsOptionCopy {
  id: 'rounded' | 'modern' | 'playful' | 'serif';
  name: string;
  preview: string;
}

export interface FontSizeOptionCopy {
  id: 'normal' | 'large' | 'xlarge';
  label: string;
  percentage: string;
}

export interface FontSettingsCopy {
  fontOptions: FontSettingsOptionCopy[];
  sizeOptions: FontSizeOptionCopy[];
}

const copy: Record<Language, FontSettingsCopy> = {
  vi: {
    fontOptions: [
      { id: 'rounded', name: 'Phông Rõ Ràng Thân Thiện (Mặc định)', preview: 'Rõ ràng, ấm áp và dễ đọc' },
      { id: 'modern', name: 'Phông Tinh Gọn Hiện Đại', preview: 'Rõ ràng, hiện đại, tối giản' },
      { id: 'playful', name: 'Phông Vui Tươi Trẻ Thơ', preview: 'Năng động, tươi vui, hoạt bát' },
      { id: 'serif', name: 'Phông Cổ Điển Nhã Nhặn', preview: 'Ấm áp, mộc mạc, truyền cảm' },
    ],
    sizeOptions: [
      { id: 'normal', label: 'Vừa vặn', percentage: '100%' },
      { id: 'large', label: 'Lớn hơn một tí', percentage: '108%' },
      { id: 'xlarge', label: 'Chữ to rõ ràng', percentage: '118%' },
    ],
  },
  en: {
    fontOptions: [
      { id: 'rounded', name: 'Friendly & Rounded (Default)', preview: 'Clear, warm, and easy to read' },
      { id: 'modern', name: 'Modern & Clean', preview: 'Clear, modern, minimal' },
      { id: 'playful', name: 'Playful & Cheerful', preview: 'Energetic, lively, and upbeat' },
      { id: 'serif', name: 'Classic Serif', preview: 'Warm, natural, and timeless' },
    ],
    sizeOptions: [
      { id: 'normal', label: 'Comfortable', percentage: '100%' },
      { id: 'large', label: 'A bit larger', percentage: '108%' },
      { id: 'xlarge', label: 'Extra large & clear', percentage: '118%' },
    ],
  },
  fr: {
    fontOptions: [
      { id: 'rounded', name: 'Arrondie & Chaleureuse (Par défaut)', preview: 'Claire, chaleureuse et lisible' },
      { id: 'modern', name: 'Moderne & Épurée', preview: 'Claire, moderne, minimaliste' },
      { id: 'playful', name: 'Ludique & Enjouée', preview: 'Dynamique, vive, pleine d’énergie' },
      { id: 'serif', name: 'Classique à Empattements', preview: 'Chaleureuse, naturelle, intemporelle' },
    ],
    sizeOptions: [
      { id: 'normal', label: 'Confortable', percentage: '100%' },
      { id: 'large', label: 'Un peu plus grand', percentage: '108%' },
      { id: 'xlarge', label: 'Très grand & clair', percentage: '118%' },
    ],
  },
  de: {
    fontOptions: [
      { id: 'rounded', name: 'Freundlich & Rund (Standard)', preview: 'Klar, warm und gut lesbar' },
      { id: 'modern', name: 'Modern & Klar', preview: 'Klar, modern, minimal' },
      { id: 'playful', name: 'Verspielt & Fröhlich', preview: 'Energisch, lebhaft und munter' },
      { id: 'serif', name: 'Klassisch mit Serifen', preview: 'Warm, natürlich und zeitlos' },
    ],
    sizeOptions: [
      { id: 'normal', label: 'Passend', percentage: '100%' },
      { id: 'large', label: 'Etwas größer', percentage: '108%' },
      { id: 'xlarge', label: 'Sehr groß & klar', percentage: '118%' },
    ],
  },
  it: {
    fontOptions: [
      { id: 'rounded', name: 'Arrotondato & Amichevole (Predefinito)', preview: 'Chiaro, caldo e leggibile' },
      { id: 'modern', name: 'Moderno & Pulito', preview: 'Chiaro, moderno, minimale' },
      { id: 'playful', name: 'Giocoso & Vivace', preview: 'Energico, vivace, brioso' },
      { id: 'serif', name: 'Classico con grazie', preview: 'Caldo, naturale, senza tempo' },
    ],
    sizeOptions: [
      { id: 'normal', label: 'Comoda', percentage: '100%' },
      { id: 'large', label: 'Un po’ più grande', percentage: '108%' },
      { id: 'xlarge', label: 'Molto grande & chiaro', percentage: '118%' },
    ],
  },
  es: {
    fontOptions: [
      { id: 'rounded', name: 'Redondeada & Amigable (Predeterminada)', preview: 'Claro, cálido y fácil de leer' },
      { id: 'modern', name: 'Moderna & Limpia', preview: 'Claro, moderno, minimalista' },
      { id: 'playful', name: 'Divertida & Alegre', preview: 'Enérgico, alegre, dinámico' },
      { id: 'serif', name: 'Clásica con serifa', preview: 'Cálido, natural, atemporal' },
    ],
    sizeOptions: [
      { id: 'normal', label: 'Cómodo', percentage: '100%' },
      { id: 'large', label: 'Un poco más grande', percentage: '108%' },
      { id: 'xlarge', label: 'Muy grande & claro', percentage: '118%' },
    ],
  },
  zh: {
    fontOptions: [
      { id: 'rounded', name: '圆润友好（默认）', preview: '清晰、温暖、易读' },
      { id: 'modern', name: '现代简洁', preview: '清晰、现代、精简' },
      { id: 'playful', name: '活泼童趣', preview: '生动、活泼、充满活力' },
      { id: 'serif', name: '经典衬线', preview: '温暖、自然、经久耐看' },
    ],
    sizeOptions: [
      { id: 'normal', label: '适中', percentage: '100%' },
      { id: 'large', label: '稍大', percentage: '108%' },
      { id: 'xlarge', label: '大字清晰', percentage: '118%' },
    ],
  },
  ja: {
    fontOptions: [
      { id: 'rounded', name: '丸みのあるやさしいフォント（デフォルト）', preview: '読みやすく、温かみのある文字' },
      { id: 'modern', name: 'すっきりモダン', preview: 'クリアで現代的、シンプル' },
      { id: 'playful', name: '元気で楽しいフォント', preview: '活気に満ち、明るく元気' },
      { id: 'serif', name: 'クラシックな明朝体', preview: '落ち着きがあり、自然で上品' },
    ],
    sizeOptions: [
      { id: 'normal', label: '標準', percentage: '100%' },
      { id: 'large', label: '少し大きめ', percentage: '108%' },
      { id: 'xlarge', label: '大きく見やすく', percentage: '118%' },
    ],
  },
  ko: {
    fontOptions: [
      { id: 'rounded', name: '둥근 친근체（기본）', preview: '명확하고 따뜻하며 읽기 쉬운 글자' },
      { id: 'modern', name: '모던한 산세리프', preview: '깔끔하고 현대적이며 단순한 글자' },
      { id: 'playful', name: '발랄하고 경쾌한 글꼴', preview: '활기차고 경쾌하며 생동감 있는 글자' },
      { id: 'serif', name: '고전적인 세리프체', preview: '차분하고 자연스러우며 세련된 글자' },
    ],
    sizeOptions: [
      { id: 'normal', label: '보통', percentage: '100%' },
      { id: 'large', label: '조금 크게', percentage: '108%' },
      { id: 'xlarge', label: '크고 선명하게', percentage: '118%' },
    ],
  },
};

export function getFontSettingsCopy(language: Language) {
  return copy[language] ?? copy.vi;
}
