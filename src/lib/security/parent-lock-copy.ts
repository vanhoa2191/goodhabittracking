import type { Language } from '@/types';

const COPY: Readonly<Record<Language, string>> = {
  vi: 'Chưa khóa được chế độ phụ huynh. Hãy giữ thiết bị bên mình và thử lại.',
  en: 'Parent mode could not be locked. Keep the device with you and try again.',
  fr: 'Le mode parent n’a pas pu être verrouillé. Gardez l’appareil avec vous et réessayez.',
  de: 'Der Elternmodus konnte nicht gesperrt werden. Behalten Sie das Gerät bei sich und versuchen Sie es erneut.',
  it: 'Impossibile bloccare la modalità genitore. Tenga il dispositivo con sé e riprovi.',
  es: 'No se pudo bloquear el modo para padres. Mantenga el dispositivo consigo e inténtelo de nuevo.',
  zh: '无法锁定家长模式。请先保管好设备，然后重试。',
  ja: '保護者モードをロックできませんでした。端末を手元に置いて、もう一度お試しください。',
  ko: '보호자 모드를 잠그지 못했어요. 기기를 직접 보관하고 다시 시도해 주세요.',
};

const PENDING: Readonly<Record<Language, string>> = {
  vi: 'Đang khóa chế độ phụ huynh…',
  en: 'Locking parent mode…',
  fr: 'Verrouillage du mode parent…',
  de: 'Elternmodus wird gesperrt…',
  it: 'Blocco della modalità genitore…',
  es: 'Bloqueando el modo para padres…',
  zh: '正在锁定家长模式…',
  ja: '保護者モードをロックしています…',
  ko: '보호자 모드를 잠그는 중…',
};

export function getParentLockErrorCopy(language: Language): string {
  return COPY[language] ?? COPY.en;
}

export function getParentLockPendingCopy(language: Language): string {
  return PENDING[language] ?? PENDING.en;
}
