import type { Language } from '@/types';

export type AppFooterCopy = {
  pricing: string;
  guide: string;
  privacy: string;
  terms: string;
  contact: string;
};

export const COPY: Record<Language, AppFooterCopy> = {
  vi: { pricing: 'Bảng giá', guide: 'Tài liệu sử dụng', privacy: 'Quyền riêng tư', terms: 'Điều khoản', contact: 'Liên hệ' },
  en: { pricing: 'Pricing', guide: 'User guide', privacy: 'Privacy', terms: 'Terms', contact: 'Contact' },
  fr: { pricing: 'Tarifs', guide: 'Guide d’utilisation', privacy: 'Confidentialité', terms: 'Conditions', contact: 'Contact' },
  de: { pricing: 'Preise', guide: 'Anleitung', privacy: 'Datenschutz', terms: 'Nutzungsbedingungen', contact: 'Kontakt' },
  it: { pricing: 'Prezzi', guide: 'Guida all’uso', privacy: 'Privacy', terms: 'Termini', contact: 'Contatti' },
  es: { pricing: 'Precios', guide: 'Guía de uso', privacy: 'Privacidad', terms: 'Condiciones', contact: 'Contacto' },
  zh: { pricing: '价格', guide: '使用指南', privacy: '隐私', terms: '条款', contact: '联系我们' },
  ja: { pricing: '料金', guide: '使い方', privacy: 'プライバシー', terms: '利用規約', contact: 'お問い合わせ' },
  ko: { pricing: '요금', guide: '사용 안내', privacy: '개인정보 보호', terms: '이용약관', contact: '문의' },
};

export function getAppFooterCopy(language: Language): AppFooterCopy {
  return COPY[language];
}
