import type { Language } from '@/types';
import type { CityItemId } from '@/lib/dream-city';

type CityCopy = {
  title: string;
  description: string;
  available: (points: number) => string;
  progress: (built: number, total: number) => string;
  build: string;
  building: string;
  built: string;
  notEnough: string;
  success: string;
  error: string;
  items: Record<CityItemId, string>;
};

export const dreamCityCopy: Record<Language, CityCopy> = {
  vi: { title: 'Thành phố ước mơ', description: 'Dùng điểm để xây thành phố của con. Công trình đã xây sẽ ở lại mãi; hành trình đã đạt không bị mất.', available: (points) => `${points} điểm có thể dùng`, progress: (built, total) => `${built}/${total} công trình`, build: 'Xây ngay', building: 'Đang xây…', built: 'Đã xây', notEnough: 'Chưa đủ điểm', success: 'Công trình mới đã hoàn thành!', error: 'Chưa xây được. Con thử lại nhé.', items: { garden: 'Vườn xanh', library: 'Thư viện', bridge: 'Cầu kết nối', observatory: 'Đài quan sát' } },
  en: { title: 'Dream City', description: 'Use points to build your city. Buildings stay forever, and earned progress never disappears.', available: (points) => `${points} points available`, progress: (built, total) => `${built}/${total} buildings`, build: 'Build', building: 'Building…', built: 'Built', notEnough: 'More points needed', success: 'Your new building is ready!', error: 'Could not build. Please try again.', items: { garden: 'Green garden', library: 'Library', bridge: 'Friendship bridge', observatory: 'Observatory' } },
  fr: { title: 'Ville des rêves', description: 'Utilise tes points pour construire ta ville. Les bâtiments restent, et tes progrès ne disparaissent pas.', available: (points) => `${points} points disponibles`, progress: (built, total) => `${built}/${total} bâtiments`, build: 'Construire', building: 'Construction…', built: 'Construit', notEnough: 'Points insuffisants', success: 'Ton nouveau bâtiment est prêt !', error: 'Construction impossible. Réessaie.', items: { garden: 'Jardin vert', library: 'Bibliothèque', bridge: 'Pont de l’amitié', observatory: 'Observatoire' } },
  de: { title: 'Traumstadt', description: 'Baue deine Stadt mit Punkten. Gebäude bleiben dauerhaft und dein Fortschritt geht nicht verloren.', available: (points) => `${points} Punkte verfügbar`, progress: (built, total) => `${built}/${total} Gebäude`, build: 'Bauen', building: 'Wird gebaut…', built: 'Gebaut', notEnough: 'Mehr Punkte nötig', success: 'Dein neues Gebäude ist fertig!', error: 'Bauen nicht möglich. Bitte erneut versuchen.', items: { garden: 'Grüner Garten', library: 'Bibliothek', bridge: 'Freundschaftsbrücke', observatory: 'Sternwarte' } },
  it: { title: 'Città dei sogni', description: 'Usa i punti per costruire la tua città. Gli edifici restano per sempre e i progressi non si perdono.', available: (points) => `${points} punti disponibili`, progress: (built, total) => `${built}/${total} edifici`, build: 'Costruisci', building: 'Costruzione…', built: 'Costruito', notEnough: 'Servono più punti', success: 'Il tuo nuovo edificio è pronto!', error: 'Impossibile costruire. Riprova.', items: { garden: 'Giardino verde', library: 'Biblioteca', bridge: 'Ponte dell’amicizia', observatory: 'Osservatorio' } },
  es: { title: 'Ciudad de los sueños', description: 'Usa puntos para construir tu ciudad. Los edificios permanecen y el progreso conseguido no se pierde.', available: (points) => `${points} puntos disponibles`, progress: (built, total) => `${built}/${total} edificios`, build: 'Construir', building: 'Construyendo…', built: 'Construido', notEnough: 'Faltan puntos', success: '¡Tu nuevo edificio está listo!', error: 'No se pudo construir. Inténtalo de nuevo.', items: { garden: 'Jardín verde', library: 'Biblioteca', bridge: 'Puente de amistad', observatory: 'Observatorio' } },
  zh: { title: '梦想之城', description: '用积分建造自己的城市。已建成的建筑会一直保留，成长进度不会清零。', available: (points) => `可用 ${points} 分`, progress: (built, total) => `${built}/${total} 座建筑`, build: '建造', building: '建造中…', built: '已建成', notEnough: '积分不足', success: '新建筑建好了！', error: '暂时无法建造，请再试一次。', items: { garden: '绿色花园', library: '图书馆', bridge: '友谊桥', observatory: '天文台' } },
  ja: { title: '夢のまち', description: 'ポイントでまちをつくろう。\n建物も成長も残るよ。', available: (points) => `使えるポイント ${points}`, progress: (built, total) => `${built}/${total} 建物`, build: '建てる', building: '建設中…', built: '完成', notEnough: 'ポイント不足', success: '新しい建物が完成しました！', error: '建てられませんでした。もう一度試してください。', items: { garden: '緑の庭', library: '図書館', bridge: '友情の橋', observatory: '天文台' } },
  ko: { title: '꿈의 도시', description: '포인트로 나만의 도시를 만들어요. 건물은 계속 남고 지금까지의 성장 기록도 사라지지 않아요.', available: (points) => `사용 가능한 포인트 ${points}`, progress: (built, total) => `${built}/${total} 건물`, build: '건설하기', building: '건설 중…', built: '완성', notEnough: '포인트 부족', success: '새 건물이 완성됐어요!', error: '건설하지 못했어요. 다시 시도해 주세요.', items: { garden: '초록 정원', library: '도서관', bridge: '우정의 다리', observatory: '천문대' } },
};
