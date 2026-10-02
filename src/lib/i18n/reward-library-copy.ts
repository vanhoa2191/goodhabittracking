import type { Language } from '@/types';

export type RewardLibraryCopy = {
  readonly all: string;
  readonly experience: string;
  readonly material: string;
  readonly title: string;
  readonly intro: string;
  readonly kindLabel: string;
  readonly experienceTag: string;
  readonly materialTag: string;
  readonly suggest: (n: number) => string;
  readonly added: string;
  readonly adding: string;
  readonly add: string;
};

const COPY: Record<Language, RewardLibraryCopy> = {
  vi: {
    all: 'Tất cả gợi ý',
    experience: 'Quà phi vật chất',
    material: 'Quà vật chất',
    title: 'Gợi ý quà tặng ý nghĩa',
    intro: 'Ưu tiên thời gian bên nhau, trải nghiệm và quyền được lựa chọn. Quà vật chất nên hỗ trợ sở thích, vận động, học tập hoặc tinh thần cho đi.',
    kindLabel: 'Loại quà tặng',
    experienceTag: 'Phi vật chất',
    materialTag: 'Vật chất có mục đích',
    suggest: (n) => `Gợi ý ${n} sao`,
    added: 'Đã có trong kho quà',
    adding: 'Đang thêm…',
    add: 'Thêm vào kho quà',
  },
  en: {
    all: 'All ideas',
    experience: 'Experiences',
    material: 'Things',
    title: 'Ideas for meaningful rewards',
    intro: 'Put time together, experiences and the right to choose first. Things should support a hobby, movement, learning or the spirit of giving.',
    kindLabel: 'Kind of reward',
    experienceTag: 'Experience',
    materialTag: 'A thing with a purpose',
    suggest: (n) => `Suggested: ${n} stars`,
    added: 'Already in your rewards',
    adding: 'Adding…',
    add: 'Add to rewards',
  },
  fr: {
    all: 'All ideas',
    experience: 'Experiences',
    material: 'Things',
    title: 'Ideas for meaningful rewards',
    intro: 'Put time together, experiences and the right to choose first. Things should support a hobby, movement, learning or the spirit of giving.',
    kindLabel: 'Kind of reward',
    experienceTag: 'Experience',
    materialTag: 'A thing with a purpose',
    suggest: (n) => `Suggested: ${n} stars`,
    added: 'Already in your rewards',
    adding: 'Adding…',
    add: 'Add to rewards',
  },
  de: {
    all: 'All ideas',
    experience: 'Experiences',
    material: 'Things',
    title: 'Ideas for meaningful rewards',
    intro: 'Put time together, experiences and the right to choose first. Things should support a hobby, movement, learning or the spirit of giving.',
    kindLabel: 'Kind of reward',
    experienceTag: 'Experience',
    materialTag: 'A thing with a purpose',
    suggest: (n) => `Suggested: ${n} stars`,
    added: 'Already in your rewards',
    adding: 'Adding…',
    add: 'Add to rewards',
  },
  it: {
    all: 'All ideas',
    experience: 'Experiences',
    material: 'Things',
    title: 'Ideas for meaningful rewards',
    intro: 'Put time together, experiences and the right to choose first. Things should support a hobby, movement, learning or the spirit of giving.',
    kindLabel: 'Kind of reward',
    experienceTag: 'Experience',
    materialTag: 'A thing with a purpose',
    suggest: (n) => `Suggested: ${n} stars`,
    added: 'Already in your rewards',
    adding: 'Adding…',
    add: 'Add to rewards',
  },
  es: {
    all: 'All ideas',
    experience: 'Experiences',
    material: 'Things',
    title: 'Ideas for meaningful rewards',
    intro: 'Put time together, experiences and the right to choose first. Things should support a hobby, movement, learning or the spirit of giving.',
    kindLabel: 'Kind of reward',
    experienceTag: 'Experience',
    materialTag: 'A thing with a purpose',
    suggest: (n) => `Suggested: ${n} stars`,
    added: 'Already in your rewards',
    adding: 'Adding…',
    add: 'Add to rewards',
  },
  zh: {
    all: 'All ideas',
    experience: 'Experiences',
    material: 'Things',
    title: 'Ideas for meaningful rewards',
    intro: 'Put time together, experiences and the right to choose first. Things should support a hobby, movement, learning or the spirit of giving.',
    kindLabel: 'Kind of reward',
    experienceTag: 'Experience',
    materialTag: 'A thing with a purpose',
    suggest: (n) => `Suggested: ${n} stars`,
    added: 'Already in your rewards',
    adding: 'Adding…',
    add: 'Add to rewards',
  },
  ja: {
    all: 'All ideas',
    experience: 'Experiences',
    material: 'Things',
    title: 'Ideas for meaningful rewards',
    intro: 'Put time together, experiences and the right to choose first. Things should support a hobby, movement, learning or the spirit of giving.',
    kindLabel: 'Kind of reward',
    experienceTag: 'Experience',
    materialTag: 'A thing with a purpose',
    suggest: (n) => `Suggested: ${n} stars`,
    added: 'Already in your rewards',
    adding: 'Adding…',
    add: 'Add to rewards',
  },
  ko: {
    all: 'All ideas',
    experience: 'Experiences',
    material: 'Things',
    title: 'Ideas for meaningful rewards',
    intro: 'Put time together, experiences and the right to choose first. Things should support a hobby, movement, learning or the spirit of giving.',
    kindLabel: 'Kind of reward',
    experienceTag: 'Experience',
    materialTag: 'A thing with a purpose',
    suggest: (n) => `Suggested: ${n} stars`,
    added: 'Already in your rewards',
    adding: 'Adding…',
    add: 'Add to rewards',
  },
};

export function getRewardLibraryCopy(language: Language): RewardLibraryCopy {
  return COPY[language] ?? COPY.en;
}
