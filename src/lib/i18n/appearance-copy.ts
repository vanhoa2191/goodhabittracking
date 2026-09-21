import type { Language } from '@/types';

const copy = {
  vi: { appearance: 'Giao diện', light: 'Sáng', dark: 'Tối', system: 'Theo thiết bị' },
  en: { appearance: 'Appearance', light: 'Light', dark: 'Dark', system: 'System' },
  zh: { appearance: '外观', light: '浅色', dark: '深色', system: '跟随设备' },
  ja: { appearance: '外観', light: 'ライト', dark: 'ダーク', system: '端末に合わせる' },
  ko: { appearance: '화면 모드', light: '밝게', dark: '어둡게', system: '기기 설정' },
  es: { appearance: 'Apariencia', light: 'Claro', dark: 'Oscuro', system: 'Sistema' },
  fr: { appearance: 'Apparence', light: 'Clair', dark: 'Sombre', system: 'Système' },
  de: { appearance: 'Darstellung', light: 'Hell', dark: 'Dunkel', system: 'System' },
  it: { appearance: 'Aspetto', light: 'Chiaro', dark: 'Scuro', system: 'Sistema' },
} satisfies Record<Language, { appearance: string; light: string; dark: string; system: string }>;

export function getAppearanceCopy(language: Language) {
  return copy[language] ?? copy.vi;
}
