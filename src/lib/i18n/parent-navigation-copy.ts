import type { Language } from '@/types';

type ParentNavigationCopy = Readonly<{
  areasLabel: string;
  sectionsLabel: string;
  today: string;
  design: string;
  family: string;
  library: string;
  inUse: string;
  allChildren: string;
  filterByChild: string;
  active: string;
  paused: string;
  lastSevenDays: (count: number) => string;
  emptyAssignments: string;
  openLibrary: string;
  activityId: string;
  added: string;
  adding: string;
}>;

const copy: Record<Language, ParentNavigationCopy> = {
  vi: { areasLabel: 'Khu vực phụ huynh', sectionsLabel: 'Mục quản lý', today: 'Hôm nay', design: 'Thiết kế', family: 'Gia đình', library: 'Thư viện', inUse: 'Đang dùng', allChildren: 'Tất cả bé', filterByChild: 'Lọc theo bé', active: 'Đang hoạt động', paused: 'Tạm dừng', lastSevenDays: (count) => `${count} lần hoàn thành trong 7 ngày`, emptyAssignments: 'Chưa có việc nào được giao. Chọn từ thư viện hoặc tạo việc riêng cho gia đình.', openLibrary: 'Mở thư viện', activityId: 'Mã việc', added: 'Đã thêm', adding: 'Đang thêm…' },
  en: { areasLabel: 'Parent areas', sectionsLabel: 'Management sections', today: 'Today', design: 'Design', family: 'Family', library: 'Library', inUse: 'In use', allChildren: 'All children', filterByChild: 'Filter by child', active: 'Active', paused: 'Paused', lastSevenDays: (count) => `${count} completions in 7 days`, emptyAssignments: 'No tasks assigned yet. Choose from the library or create one for your family.', openLibrary: 'Open library', activityId: 'Task ID', added: 'Added', adding: 'Adding…' },
  fr: { areasLabel: 'Espaces parents', sectionsLabel: 'Rubriques de gestion', today: 'Aujourd’hui', design: 'Organiser', family: 'Famille', library: 'Bibliothèque', inUse: 'En cours', allChildren: 'Tous les enfants', filterByChild: 'Filtrer par enfant', active: 'Active', paused: 'En pause', lastSevenDays: (count) => `${count} réalisations en 7 jours`, emptyAssignments: 'Aucune tâche attribuée. Choisissez dans la bibliothèque ou créez-en une.', openLibrary: 'Ouvrir la bibliothèque', activityId: 'ID de tâche', added: 'Ajoutée', adding: 'Ajout…' },
  de: { areasLabel: 'Elternbereiche', sectionsLabel: 'Verwaltungsbereiche', today: 'Heute', design: 'Gestalten', family: 'Familie', library: 'Bibliothek', inUse: 'In Verwendung', allChildren: 'Alle Kinder', filterByChild: 'Nach Kind filtern', active: 'Aktiv', paused: 'Pausiert', lastSevenDays: (count) => `${count} Abschlüsse in 7 Tagen`, emptyAssignments: 'Noch keine Aufgaben zugewiesen. Wähle eine Vorlage oder erstelle eine eigene.', openLibrary: 'Bibliothek öffnen', activityId: 'Aufgaben-ID', added: 'Hinzugefügt', adding: 'Wird hinzugefügt…' },
  it: { areasLabel: 'Aree genitori', sectionsLabel: 'Sezioni di gestione', today: 'Oggi', design: 'Progetta', family: 'Famiglia', library: 'Libreria', inUse: 'In uso', allChildren: 'Tutti i bambini', filterByChild: 'Filtra per bambino', active: 'Attiva', paused: 'In pausa', lastSevenDays: (count) => `${count} completamenti in 7 giorni`, emptyAssignments: 'Nessuna attività assegnata. Scegli dalla libreria o creane una.', openLibrary: 'Apri la libreria', activityId: 'ID attività', added: 'Aggiunta', adding: 'Aggiunta in corso…' },
  es: { areasLabel: 'Áreas para padres', sectionsLabel: 'Secciones de gestión', today: 'Hoy', design: 'Diseñar', family: 'Familia', library: 'Biblioteca', inUse: 'En uso', allChildren: 'Todos los niños', filterByChild: 'Filtrar por niño', active: 'Activa', paused: 'Pausada', lastSevenDays: (count) => `${count} tareas completadas en 7 días`, emptyAssignments: 'Todavía no hay tareas asignadas. Elige una de la biblioteca o crea una.', openLibrary: 'Abrir biblioteca', activityId: 'ID de tarea', added: 'Añadida', adding: 'Añadiendo…' },
  zh: { areasLabel: '家长区域', sectionsLabel: '管理栏目', today: '今天', design: '规划', family: '家庭', library: '习惯库', inUse: '使用中', allChildren: '所有孩子', filterByChild: '按孩子筛选', active: '进行中', paused: '已暂停', lastSevenDays: (count) => `近7天完成${count}次`, emptyAssignments: '还没有分配任务。可从习惯库选择或自行创建。', openLibrary: '打开习惯库', activityId: '任务编号', added: '已添加', adding: '添加中…' },
  ja: { areasLabel: '保護者エリア', sectionsLabel: '管理メニュー', today: '今日', design: '設計', family: '家族', library: 'ライブラリ', inUse: '使用中', allChildren: 'すべての子ども', filterByChild: '子どもで絞り込む', active: '実施中', paused: '一時停止', lastSevenDays: (count) => `過去7日で${count}回完了`, emptyAssignments: 'まだ課題がありません。ライブラリから選ぶか新しく作成してください。', openLibrary: 'ライブラリを開く', activityId: '課題ID', added: '追加済み', adding: '追加中…' },
  ko: { areasLabel: '부모 영역', sectionsLabel: '관리 메뉴', today: '오늘', design: '설계', family: '가족', library: '라이브러리', inUse: '사용 중', allChildren: '모든 아이', filterByChild: '아이별 보기', active: '진행 중', paused: '일시 중지', lastSevenDays: (count) => `최근 7일 완료 ${count}회`, emptyAssignments: '아직 배정된 과제가 없습니다. 라이브러리에서 고르거나 직접 만드세요.', openLibrary: '라이브러리 열기', activityId: '과제 ID', added: '추가됨', adding: '추가 중…' },
};

export function getParentNavigationCopy(language: Language): ParentNavigationCopy {
  return copy[language];
}
