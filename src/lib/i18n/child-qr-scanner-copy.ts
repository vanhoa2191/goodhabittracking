import type { Language } from '@/types';

export type ChildQrScannerCopy = {
  openingCamera: string;
  alignQr: string;
};

export const COPY: Record<Language, ChildQrScannerCopy> = {
  vi: { openingCamera: 'Đang mở camera…', alignQr: 'Đưa mã QR vào giữa khung.' },
  en: { openingCamera: 'Opening camera…', alignQr: 'Place the QR code in the center of the frame.' },
  fr: { openingCamera: 'Ouverture de la caméra…', alignQr: 'Placez le code QR au centre du cadre.' },
  de: { openingCamera: 'Kamera wird geöffnet…', alignQr: 'Halte den QR-Code in die Mitte des Rahmens.' },
  it: { openingCamera: 'Apertura della fotocamera…', alignQr: 'Posiziona il codice QR al centro del riquadro.' },
  es: { openingCamera: 'Abriendo la cámara…', alignQr: 'Coloca el código QR en el centro del marco.' },
  zh: { openingCamera: '正在打开相机…', alignQr: '请将二维码放在取景框中央。' },
  ja: { openingCamera: 'カメラを起動中…', alignQr: 'QRコードを枠の中央に合わせてください。' },
  ko: { openingCamera: '카메라를 여는 중…', alignQr: 'QR 코드를 화면 중앙에 맞춰 주세요.' },
};

export function getChildQrScannerCopy(language: Language): ChildQrScannerCopy {
  return COPY[language];
}
