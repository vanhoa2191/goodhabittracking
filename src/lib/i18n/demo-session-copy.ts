import type { Language } from '@/types';

export const demoSessionCopy: Record<Language, { label: string; notice: string; setup: string }> = {
  vi: { label: 'Chế độ khám phá:', notice: 'dữ liệu mẫu chỉ lưu trên thiết bị này và không đồng bộ lên tài khoản thật.', setup: 'Thiết lập gia đình' },
  en: { label: 'Demo mode:', notice: 'sample data stays on this device and is never synced to your real account.', setup: 'Set up your family' },
  fr: { label: 'Mode démo :', notice: 'les données d’exemple restent sur cet appareil et ne sont jamais synchronisées avec votre compte réel.', setup: 'Configurer votre famille' },
  de: { label: 'Demo-Modus:', notice: 'Beispieldaten bleiben auf diesem Gerät und werden nie mit Ihrem echten Konto synchronisiert.', setup: 'Familie einrichten' },
  it: { label: 'Modalità demo:', notice: 'i dati di esempio restano su questo dispositivo e non vengono sincronizzati con il tuo account reale.', setup: 'Configura la famiglia' },
  es: { label: 'Modo demo:', notice: 'los datos de ejemplo permanecen en este dispositivo y nunca se sincronizan con tu cuenta real.', setup: 'Configurar tu familia' },
  zh: { label: '体验模式：', notice: '示例数据仅保存在此设备上，不会同步到您的真实账户。', setup: '设置家庭' },
  ja: { label: 'デモモード：', notice: 'サンプルデータはこの端末にのみ保存され、実際のアカウントには同期されません。', setup: '家族を設定' },
  ko: { label: '데모 모드:', notice: '샘플 데이터는 이 기기에만 저장되며 실제 계정과 동기화되지 않습니다.', setup: '가족 설정하기' },
};
