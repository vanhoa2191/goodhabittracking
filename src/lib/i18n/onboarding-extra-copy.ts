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
    trialFailed: 'L’essai de 7 jours n’a pas pu démarrer. Si vous l’avez déjà utilisé, choisissez un forfait pour continuer.',
    legalTemplate: 'Veuillez lire la [privacy] et les [terms] avant de continuer.',
    privacy: 'Politique de confidentialité',
    terms: 'Conditions d’utilisation',
    guide: 'Voir le guide d’utilisation',
    startTrial: 'Démarrer l’essai de 7 jours et créer le profil',
  },
  de: {
    trialFailed: 'Die 7-tägige Testphase konnte nicht starten. Falls du sie schon genutzt hast, wähle bitte ein Paket, um fortzufahren.',
    legalTemplate: 'Bitte lies die [privacy] und die [terms], bevor du fortfährst.',
    privacy: 'Datenschutzerklärung',
    terms: 'Nutzungsbedingungen',
    guide: 'Benutzerhandbuch ansehen',
    startTrial: '7-Tage-Test starten & Profil anlegen',
  },
  it: {
    trialFailed: 'Non è stato possibile avviare la prova di 7 giorni. Se l’hai già usata, scegli un piano per continuare.',
    legalTemplate: 'Leggi l’[privacy] e i [terms] prima di continuare.',
    privacy: 'Informativa sulla privacy',
    terms: 'Termini di utilizzo',
    guide: 'Vedi la guida all’uso',
    startTrial: 'Avvia la prova di 7 giorni e crea il profilo',
  },
  es: {
    trialFailed: 'No se pudo iniciar la prueba de 7 días. Si ya la usaste, elige un plan para continuar.',
    legalTemplate: 'Lee la [privacy] y los [terms] antes de continuar.',
    privacy: 'Política de privacidad',
    terms: 'Términos de uso',
    guide: 'Ver la guía de uso',
    startTrial: 'Empezar la prueba de 7 días y crear el perfil',
  },
  zh: {
    trialFailed: '无法开始 7 天试用。如果你已用过试用，请选择一个套餐继续。',
    legalTemplate: '继续之前，请阅读[privacy]和[terms]。',
    privacy: '隐私政策',
    terms: '使用条款',
    guide: '查看使用指南',
    startTrial: '开始 7 天试用并创建档案',
  },
  ja: {
    trialFailed: '7日間の無料体験を始められませんでした。すでに体験済みの場合は、プランを選んで続けてください。',
    legalTemplate: '続ける前に[privacy]と[terms]をお読みください。',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
    guide: '使い方ガイドを見る',
    startTrial: '7日間の無料体験を始めてプロフィールを作成',
  },
  ko: {
    trialFailed: '7일 체험을 시작하지 못했어요. 이미 체험했다면 요금제를 선택해 계속해 주세요.',
    legalTemplate: '계속하기 전에 [privacy]과 [terms]을 읽어 주세요.',
    privacy: '개인정보 처리방침',
    terms: '이용약관',
    guide: '사용 안내 보기',
    startTrial: '7일 체험 시작하고 프로필 만들기',
  },
};

export function getOnboardingExtraCopy(language: Language): OnboardingExtraCopy {
  return COPY[language] ?? COPY.en;
}
