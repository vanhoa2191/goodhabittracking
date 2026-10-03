import type { Language } from '@/types';

export type ChromeCopy = {
  readonly home: string;
  readonly docs: string;
  readonly userGuide: string;
  readonly avatarAlt: string;
  readonly menuQuickSettings: string;
  readonly menuAccount: string;
  readonly menuMore: string;
  readonly habitInstructionsLabel: string;
  readonly habitInstructionsPlaceholder: string;
  readonly viewDetails: string;
  readonly taskSaving: (title: string) => string;
  readonly taskWaitingApproval: (title: string) => string;
  readonly taskUnmark: (title: string) => string;
  readonly taskMark: (title: string) => string;
  readonly taskUpdated: (title: string) => string;
};

const COPY: Record<Language, ChromeCopy> = {
  vi: {
    home: 'Trang chủ',
    docs: 'Tài liệu',
    userGuide: 'Tài liệu sử dụng',
    avatarAlt: 'Ảnh đại diện',
    menuQuickSettings: 'Cài đặt nhanh',
    menuAccount: 'Tài khoản',
    menuMore: 'Thêm',
    habitInstructionsLabel: 'Cách làm / hướng dẫn cho con',
    habitInstructionsPlaceholder: 'Viết từng bước ngắn, dễ hiểu…',
    viewDetails: 'Xem chi tiết',
    taskSaving: (title) => `Đang lưu nhiệm vụ “${title}”`,
    taskWaitingApproval: (title) => `Nhiệm vụ “${title}” đang chờ phụ huynh duyệt`,
    taskUnmark: (title) => `Bỏ đánh dấu nhiệm vụ “${title}” là hoàn thành`,
    taskMark: (title) => `Đánh dấu nhiệm vụ “${title}” là hoàn thành`,
    taskUpdated: (title) => `Đã cập nhật nhiệm vụ “${title}”`,
  },
  en: {
    home: 'Home',
    docs: 'Docs',
    userGuide: 'User guide',
    avatarAlt: 'Avatar',
    menuQuickSettings: 'Quick settings',
    menuAccount: 'Account',
    menuMore: 'More',
    habitInstructionsLabel: 'How to do it',
    habitInstructionsPlaceholder: 'Add short, clear steps…',
    viewDetails: 'View details',
    taskSaving: (title) => `Saving task “${title}”`,
    taskWaitingApproval: (title) => `Task “${title}” is waiting for parent approval`,
    taskUnmark: (title) => `Mark task “${title}” as incomplete`,
    taskMark: (title) => `Mark task “${title}” as complete`,
    taskUpdated: (title) => `Updated task “${title}”`,
  },
  fr: {
    home: 'Accueil',
    docs: 'Docs',
    userGuide: 'Guide d’utilisation',
    avatarAlt: 'Avatar',
    menuQuickSettings: 'Réglages rapides',
    menuAccount: 'Compte',
    menuMore: 'Plus',
    habitInstructionsLabel: 'Comment faire / consignes pour l’enfant',
    habitInstructionsPlaceholder: 'Écrivez de courtes étapes, faciles à comprendre…',
    viewDetails: 'Voir les détails',
    taskSaving: (title) => `Enregistrement de la mission « ${title} »`,
    taskWaitingApproval: (title) => `La mission « ${title} » attend la validation d’un parent`,
    taskUnmark: (title) => `Marquer la mission « ${title} » comme non terminée`,
    taskMark: (title) => `Marquer la mission « ${title} » comme terminée`,
    taskUpdated: (title) => `Mission « ${title} » mise à jour`,
  },
  de: {
    home: 'Startseite',
    docs: 'Doku',
    userGuide: 'Benutzerhandbuch',
    avatarAlt: 'Avatar',
    menuQuickSettings: 'Schnelleinstellungen',
    menuAccount: 'Konto',
    menuMore: 'Mehr',
    habitInstructionsLabel: 'So geht’s / Anleitung für das Kind',
    habitInstructionsPlaceholder: 'Kurze, leicht verständliche Schritte aufschreiben…',
    viewDetails: 'Details ansehen',
    taskSaving: (title) => `Aufgabe „${title}“ wird gespeichert`,
    taskWaitingApproval: (title) => `Aufgabe „${title}“ wartet auf die Freigabe der Eltern`,
    taskUnmark: (title) => `Aufgabe „${title}“ als nicht erledigt markieren`,
    taskMark: (title) => `Aufgabe „${title}“ als erledigt markieren`,
    taskUpdated: (title) => `Aufgabe „${title}“ aktualisiert`,
  },
  it: {
    home: 'Home',
    docs: 'Guida',
    userGuide: 'Guida all’uso',
    avatarAlt: 'Avatar',
    menuQuickSettings: 'Impostazioni rapide',
    menuAccount: 'Account',
    menuMore: 'Altro',
    habitInstructionsLabel: 'Come si fa / istruzioni per il bambino',
    habitInstructionsPlaceholder: 'Scrivi passaggi brevi e facili da capire…',
    viewDetails: 'Vedi dettagli',
    taskSaving: (title) => `Salvataggio della missione «${title}»`,
    taskWaitingApproval: (title) => `La missione «${title}» è in attesa dell’approvazione di un genitore`,
    taskUnmark: (title) => `Segna la missione «${title}» come non completata`,
    taskMark: (title) => `Segna la missione «${title}» come completata`,
    taskUpdated: (title) => `Missione «${title}» aggiornata`,
  },
  es: {
    home: 'Inicio',
    docs: 'Guía',
    userGuide: 'Guía de uso',
    avatarAlt: 'Avatar',
    menuQuickSettings: 'Ajustes rápidos',
    menuAccount: 'Cuenta',
    menuMore: 'Más',
    habitInstructionsLabel: 'Cómo hacerlo / instrucciones para el niño',
    habitInstructionsPlaceholder: 'Escribe pasos breves y fáciles de entender…',
    viewDetails: 'Ver detalles',
    taskSaving: (title) => `Guardando la misión «${title}»`,
    taskWaitingApproval: (title) => `La misión «${title}» espera la aprobación de los padres`,
    taskUnmark: (title) => `Desmarcar la misión «${title}» como completada`,
    taskMark: (title) => `Marcar la misión «${title}» como completada`,
    taskUpdated: (title) => `Misión «${title}» actualizada`,
  },
  zh: {
    home: '首页',
    docs: '文档',
    userGuide: '使用指南',
    avatarAlt: '头像',
    menuQuickSettings: '快捷设置',
    menuAccount: '账户',
    menuMore: '更多',
    habitInstructionsLabel: '做法 / 给孩子的说明',
    habitInstructionsPlaceholder: '写下简短易懂的步骤…',
    viewDetails: '查看详情',
    taskSaving: (title) => `正在保存任务“${title}”`,
    taskWaitingApproval: (title) => `任务“${title}”正在等待家长审核`,
    taskUnmark: (title) => `取消任务“${title}”的完成标记`,
    taskMark: (title) => `将任务“${title}”标记为已完成`,
    taskUpdated: (title) => `已更新任务“${title}”`,
  },
  ja: {
    home: 'ホーム',
    docs: 'ガイド',
    userGuide: '使い方ガイド',
    avatarAlt: 'アバター',
    menuQuickSettings: 'クイック設定',
    menuAccount: 'アカウント',
    menuMore: 'その他',
    habitInstructionsLabel: 'やり方・子どもへのガイド',
    habitInstructionsPlaceholder: '短くて、わかりやすい手順を書いてくださいね…',
    viewDetails: '詳しく見る',
    taskSaving: (title) => `ミッション「${title}」を保存しています`,
    taskWaitingApproval: (title) => `ミッション「${title}」は保護者の確認を待っています`,
    taskUnmark: (title) => `ミッション「${title}」の完了マークをはずす`,
    taskMark: (title) => `ミッション「${title}」を完了にする`,
    taskUpdated: (title) => `ミッション「${title}」を更新しました`,
  },
  ko: {
    home: '홈',
    docs: '문서',
    userGuide: '사용 가이드',
    avatarAlt: '아바타',
    menuQuickSettings: '빠른 설정',
    menuAccount: '계정',
    menuMore: '더 보기',
    habitInstructionsLabel: '하는 방법 / 아이를 위한 안내',
    habitInstructionsPlaceholder: '짧고 이해하기 쉬운 단계를 적어 주세요…',
    viewDetails: '자세히 보기',
    taskSaving: (title) => `미션 “${title}” 저장 중`,
    taskWaitingApproval: (title) => `미션 “${title}”: 부모 승인 대기 중`,
    taskUnmark: (title) => `미션 “${title}” 완료 표시 해제`,
    taskMark: (title) => `미션 “${title}”을(를) 완료로 표시`,
    taskUpdated: (title) => `미션 “${title}”을(를) 업데이트했어요`,
  },
};

export function getChromeCopy(language: Language): ChromeCopy {
  return COPY[language] ?? COPY.en;
}
