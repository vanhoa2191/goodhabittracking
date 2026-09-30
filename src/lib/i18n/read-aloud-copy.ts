import type { Language } from '@/types';

type ReadAloudCopy = { readonly read: string; readonly stop: string };

const COPY: Readonly<Record<Language, ReadAloudCopy>> = {
  vi: { read: 'Nghe đọc việc này', stop: 'Dừng đọc' },
  en: { read: 'Read this task aloud', stop: 'Stop reading' },
  fr: { read: 'Écouter cette tâche', stop: 'Arrêter la lecture' },
  de: { read: 'Diese Aufgabe vorlesen', stop: 'Vorlesen beenden' },
  it: { read: 'Ascolta questo compito', stop: 'Ferma la lettura' },
  es: { read: 'Escuchar esta tarea', stop: 'Detener la lectura' },
  zh: { read: '朗读这个任务', stop: '停止朗读' },
  ja: { read: 'このタスクを読み上げる', stop: '読み上げを止める' },
  ko: { read: '이 할 일 소리 내어 읽기', stop: '읽기 멈추기' },
};

export function getReadAloudCopy(language: Language): ReadAloudCopy {
  return COPY[language];
}
