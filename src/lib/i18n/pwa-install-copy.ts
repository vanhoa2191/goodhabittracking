import type { Language } from '@/types';

export type PwaInstallCopy = {
  readonly title: string;
  readonly description: string;
  readonly install: string;
  readonly guide: string;
  readonly refresh: string;
  readonly iosGuide: string;
  readonly androidGuide: string;
  readonly accepted: string;
  readonly dismissed: string;
};

export const COPY: Record<Language, PwaInstallCopy> = {
  vi: { title: 'Cài KidHabit Hero', description: 'Mở nhanh như một ứng dụng mà vẫn nhận phiên bản mới an toàn từ web.', install: 'Cài ngay', guide: 'Xem cách cài', refresh: 'Làm mới dữ liệu ứng dụng', iosGuide: ' mở bằng Safari, chọn Chia sẻ rồi chọn Thêm vào Màn hình chính.', androidGuide: ' mở menu trình duyệt và chọn Cài đặt ứng dụng hoặc Thêm vào màn hình chính.', accepted: 'KidHabit Hero đang được cài.', dismissed: 'Bạn có thể cài lại bất cứ lúc nào.' },
  en: { title: 'Install KidHabit Hero', description: 'Open it quickly like an app and keep getting safe updates from the web.', install: 'Install now', guide: 'How to install', refresh: 'Refresh app data', iosGuide: ' open in Safari, tap Share, then Add to Home Screen.', androidGuide: ' open the browser menu and choose Install app or Add to Home screen.', accepted: 'KidHabit Hero is being installed.', dismissed: 'You can install it again at any time.' },
  fr: { title: 'Installer KidHabit Hero', description: 'Ouvrez-le rapidement comme une application et recevez les mises à jour sécurisées du web.', install: 'Installer', guide: 'Comment installer', refresh: 'Actualiser les données de l’application', iosGuide: ' ouvrez dans Safari, touchez Partager, puis Sur l’écran d’accueil.', androidGuide: ' ouvrez le menu du navigateur et choisissez Installer l’application ou Ajouter à l’écran d’accueil.', accepted: 'Installation de KidHabit Hero en cours.', dismissed: 'Vous pouvez relancer l’installation à tout moment.' },
  de: { title: 'KidHabit Hero installieren', description: 'Schnell wie eine App öffnen und weiterhin sichere Updates aus dem Web erhalten.', install: 'Jetzt installieren', guide: 'Installationsanleitung', refresh: 'App-Daten aktualisieren', iosGuide: ' in Safari öffnen, auf Teilen tippen und Zum Home-Bildschirm wählen.', androidGuide: ' das Browsermenü öffnen und App installieren oder Zum Startbildschirm hinzufügen wählen.', accepted: 'KidHabit Hero wird installiert.', dismissed: 'Du kannst die Installation jederzeit erneut starten.' },
  it: { title: 'Installa KidHabit Hero', description: 'Aprilo rapidamente come un’app e continua a ricevere aggiornamenti sicuri dal web.', install: 'Installa ora', guide: 'Come installare', refresh: 'Aggiorna i dati dell’app', iosGuide: ' apri in Safari, tocca Condividi, poi Aggiungi alla schermata Home.', androidGuide: ' apri il menu del browser e scegli Installa app o Aggiungi a schermata Home.', accepted: 'Installazione di KidHabit Hero in corso.', dismissed: 'Puoi riprovare a installarlo in qualsiasi momento.' },
  es: { title: 'Instalar KidHabit Hero', description: 'Ábrelo rápidamente como una app y sigue recibiendo actualizaciones seguras de la web.', install: 'Instalar ahora', guide: 'Cómo instalar', refresh: 'Actualizar datos de la app', iosGuide: ' abre en Safari, toca Compartir y luego Añadir a pantalla de inicio.', androidGuide: ' abre el menú del navegador y elige Instalar aplicación o Añadir a pantalla de inicio.', accepted: 'KidHabit Hero se está instalando.', dismissed: 'Puedes volver a instalarlo cuando quieras.' },
  zh: { title: '安装 KidHabit Hero', description: '像应用一样快速打开，同时安全接收网页更新。', install: '立即安装', guide: '查看安装方法', refresh: '刷新应用数据', iosGuide: '在 Safari 中打开，选择“分享”，再选择“添加到主屏幕”。', androidGuide: '打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。', accepted: '正在安装 KidHabit Hero。', dismissed: '你可以随时重新安装。' },
  ja: { title: 'KidHabit Hero をインストール', description: 'アプリのようにすぐ開けて、ウェブから安全に更新を受け取れます。', install: '今すぐインストール', guide: 'インストール方法', refresh: 'アプリのデータを更新', iosGuide: 'Safari で開き、「共有」から「ホーム画面に追加」を選びます。', androidGuide: 'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選びます。', accepted: 'KidHabit Hero をインストールしています。', dismissed: 'いつでも再びインストールできます。' },
  ko: { title: 'KidHabit Hero 설치', description: '앱처럼 빠르게 열고 웹에서 안전하게 업데이트를 받아요.', install: '지금 설치', guide: '설치 방법 보기', refresh: '앱 데이터 새로고침', iosGuide: ' Safari에서 열고 공유를 누른 다음 홈 화면에 추가를 선택하세요.', androidGuide: ' 브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택하세요.', accepted: 'KidHabit Hero를 설치하고 있어요.', dismissed: '언제든 다시 설치할 수 있어요.' },
};

export function getPwaInstallCopy(language: Language): PwaInstallCopy { return COPY[language]; }
