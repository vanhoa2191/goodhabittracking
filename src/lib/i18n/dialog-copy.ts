import type { Language } from '@/types';

export type DialogCopy = {
  readonly confirmTitle: string;
  readonly cancel: string;
  readonly typeToConfirm: (phrase: string) => string;
};

const COPY: Record<Language, DialogCopy> = {
  vi: { confirmTitle: 'Xác nhận', cancel: 'Hủy', typeToConfirm: (phrase) => `Nhập chính xác: ${phrase}` },
  en: { confirmTitle: 'Please confirm', cancel: 'Cancel', typeToConfirm: (phrase) => `Type exactly: ${phrase}` },
  fr: { confirmTitle: 'Veuillez confirmer', cancel: 'Annuler', typeToConfirm: (phrase) => `Saisissez exactement : ${phrase}` },
  de: { confirmTitle: 'Bitte bestätigen', cancel: 'Abbrechen', typeToConfirm: (phrase) => `Genau eingeben: ${phrase}` },
  it: { confirmTitle: 'Conferma', cancel: 'Annulla', typeToConfirm: (phrase) => `Digita esattamente: ${phrase}` },
  es: { confirmTitle: 'Confirma', cancel: 'Cancelar', typeToConfirm: (phrase) => `Escribe exactamente: ${phrase}` },
  zh: { confirmTitle: '请确认', cancel: '取消', typeToConfirm: (phrase) => `请原样输入：${phrase}` },
  ja: { confirmTitle: '確認してください', cancel: 'キャンセル', typeToConfirm: (phrase) => `次の文字をそのまま入力：${phrase}` },
  ko: { confirmTitle: '확인해 주세요', cancel: '취소', typeToConfirm: (phrase) => `정확히 입력: ${phrase}` },
};

export function getDialogCopy(language: Language): DialogCopy {
  return COPY[language] ?? COPY.en;
}
