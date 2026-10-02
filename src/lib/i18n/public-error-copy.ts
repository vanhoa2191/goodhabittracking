import type { Language } from '@/types';

export type PublicErrorCopy = {
  readonly title: string;
  readonly description: string;
  readonly retry: string;
};

export const COPY: Record<Language, PublicErrorCopy> = {
  "vi": {
    "title": "Ứng dụng vừa gặp sự cố",
    "description": "Dữ liệu của bạn vẫn được giữ nguyên. Hãy thử tải lại khu vực này; nếu lỗi lặp lại, gửi mã hỗ trợ bên dưới cho đội vận hành.",
    "retry": "Thử lại"
  },
  "en": {
    "title": "The app encountered a problem",
    "description": "Your data is still intact. Try reloading this area; if the error happens again, send the support code below to the operations team.",
    "retry": "Try again"
  },
  "fr": {
    "title": "L’application a rencontré un problème",
    "description": "Vos données sont toujours intactes. Essayez de recharger cette zone ; si l’erreur se reproduit, envoyez le code d’assistance ci-dessous à l’équipe d’exploitation.",
    "retry": "Réessayer"
  },
  "de": {
    "title": "In der App ist ein Problem aufgetreten",
    "description": "Ihre Daten bleiben erhalten. Laden Sie diesen Bereich erneut. Tritt der Fehler wieder auf, senden Sie den untenstehenden Supportcode an das Betriebsteam.",
    "retry": "Erneut versuchen"
  },
  "it": {
    "title": "L’app ha riscontrato un problema",
    "description": "I tuoi dati sono ancora intatti. Prova a ricaricare questa sezione; se l’errore si ripete, invia il codice di assistenza qui sotto al team operativo.",
    "retry": "Riprova"
  },
  "es": {
    "title": "La aplicación ha encontrado un problema",
    "description": "Tus datos siguen intactos. Prueba a recargar esta sección; si el error se repite, envía el código de asistencia de abajo al equipo de operaciones.",
    "retry": "Reintentar"
  },
  "zh": {
    "title": "应用遇到了问题",
    "description": "你的数据仍然保留。请尝试重新加载此区域；如果错误再次出现，请将下方支持代码发送给运营团队。",
    "retry": "重试"
  },
  "ja": {
    "title": "アプリで問題が発生しました",
    "description": "データは保持されています。この領域の再読み込みをお試しください。エラーが繰り返される場合は、下のサポートコードを運営チームに送ってください。",
    "retry": "再試行"
  },
  "ko": {
    "title": "앱에 문제가 발생했습니다",
    "description": "데이터는 그대로 유지됩니다. 이 영역을 다시 불러와 보세요. 오류가 반복되면 아래 지원 코드를 운영팀에 보내 주세요.",
    "retry": "다시 시도"
  }
};

export function getPublicErrorCopy(language: Language): PublicErrorCopy {
  return COPY[language];
}

