import type { Language } from '@/types';

export type OnboardingExtraCopy = {
  readonly trialFailed: string;
  readonly legalTemplate: string;
  readonly privacy: string;
  readonly terms: string;
  readonly guide: string;
  readonly startTrial: string;
};

const COPY: Record<Language, OnboardingExtraCopy> = {
  vi: {
    trialFailed: 'Không thể bắt đầu 7 ngày dùng thử. Nếu bạn đã dùng thử trước đó, vui lòng chọn một gói để tiếp tục.',
    legalTemplate: 'Xem [privacy] và [terms] trước khi tiếp tục.',
    privacy: 'Quyền riêng tư',
    terms: 'Điều khoản sử dụng',
    guide: 'Xem hướng dẫn sử dụng',
    startTrial: 'Bắt đầu 7 ngày dùng thử & tạo hồ sơ',
  },
  en: {
    trialFailed: 'The 7-day trial could not start. If you have tried before, please choose a plan to continue.',
    legalTemplate: 'Please read the [privacy] and the [terms] before you continue.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    guide: 'View user guide',
    startTrial: 'Start the 7-day trial & create profile',
  },
  fr: {
    trialFailed: 'The 7-day trial could not start. If you have tried before, please choose a plan to continue.',
    legalTemplate: 'Please read the [privacy] and the [terms] before you continue.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    guide: 'View user guide',
    startTrial: 'Start the 7-day trial & create profile',
  },
  de: {
    trialFailed: 'The 7-day trial could not start. If you have tried before, please choose a plan to continue.',
    legalTemplate: 'Please read the [privacy] and the [terms] before you continue.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    guide: 'View user guide',
    startTrial: 'Start the 7-day trial & create profile',
  },
  it: {
    trialFailed: 'The 7-day trial could not start. If you have tried before, please choose a plan to continue.',
    legalTemplate: 'Please read the [privacy] and the [terms] before you continue.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    guide: 'View user guide',
    startTrial: 'Start the 7-day trial & create profile',
  },
  es: {
    trialFailed: 'The 7-day trial could not start. If you have tried before, please choose a plan to continue.',
    legalTemplate: 'Please read the [privacy] and the [terms] before you continue.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    guide: 'View user guide',
    startTrial: 'Start the 7-day trial & create profile',
  },
  zh: {
    trialFailed: 'The 7-day trial could not start. If you have tried before, please choose a plan to continue.',
    legalTemplate: 'Please read the [privacy] and the [terms] before you continue.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    guide: 'View user guide',
    startTrial: 'Start the 7-day trial & create profile',
  },
  ja: {
    trialFailed: 'The 7-day trial could not start. If you have tried before, please choose a plan to continue.',
    legalTemplate: 'Please read the [privacy] and the [terms] before you continue.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    guide: 'View user guide',
    startTrial: 'Start the 7-day trial & create profile',
  },
  ko: {
    trialFailed: 'The 7-day trial could not start. If you have tried before, please choose a plan to continue.',
    legalTemplate: 'Please read the [privacy] and the [terms] before you continue.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    guide: 'View user guide',
    startTrial: 'Start the 7-day trial & create profile',
  },
};

export function getOnboardingExtraCopy(language: Language): OnboardingExtraCopy {
  return COPY[language] ?? COPY.en;
}
