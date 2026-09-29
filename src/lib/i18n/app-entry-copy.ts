import type { Language } from '@/types';

interface AppEntryCopy {
  readonly badge: string;
  readonly childEntry: string;
  readonly demo: string;
  readonly description: string;
  readonly loading: string;
  readonly marketingHome: string;
  readonly parentLogin: string;
  readonly safety: string;
  readonly title: string;
}

export const appEntryCopy: Record<Language, AppEntryCopy> = {
  vi: {
    badge: 'Ứng dụng gia đình',
    childEntry: 'Trẻ quét QR hoặc nhập mã',
    demo: 'Khám phá bản demo',
    description: 'Phụ huynh đăng nhập để quản lý gia đình. Trẻ dùng mã hoặc camera để vào đúng hồ sơ đã được ba mẹ ghép.',
    loading: 'Đang kiểm tra phiên…',
    marketingHome: 'Xem trang giới thiệu',
    parentLogin: 'Phụ huynh đăng nhập Google',
    safety: 'Khu vực phụ huynh và trẻ được tách riêng. Trẻ không nhìn thấy thanh toán hoặc cài đặt gia đình.',
    title: 'Bạn muốn vào KidHabit theo cách nào?',
  },
  en: {
    badge: 'Family app',
    childEntry: 'Child scans QR or enters code',
    demo: 'Explore the demo',
    description: 'Parents sign in to manage the family. Children use a code or camera to open the profile paired by their parent.',
    loading: 'Checking your session…',
    marketingHome: 'View the homepage',
    parentLogin: 'Parent sign in with Google',
    safety: 'Parent and child areas are separate. Children never see payments or family settings.',
    title: 'How would you like to enter KidHabit?',
  },
  fr: {
    badge: 'Application familiale',
    childEntry: 'L’enfant scanne le QR ou saisit le code',
    demo: 'Découvrir la démo',
    description: 'Les parents se connectent pour gérer la famille. Les enfants utilisent un code ou la caméra pour ouvrir le profil associé par leur parent.',
    loading: 'Vérification de votre session…',
    marketingHome: 'Voir la page d’accueil',
    parentLogin: 'Parent : se connecter avec Google',
    safety: 'Les espaces parent et enfant sont séparés. Les enfants ne voient jamais les paiements ni les réglages familiaux.',
    title: 'Comment souhaitez-vous accéder à KidHabit ?',
  },
  de: {
    badge: 'Familien-App',
    childEntry: 'Kind scannt QR-Code oder gibt Code ein',
    demo: 'Demo entdecken',
    description: 'Eltern melden sich an, um die Familie zu verwalten. Kinder öffnen mit Code oder Kamera das von den Eltern verknüpfte Profil.',
    loading: 'Sitzung wird geprüft…',
    marketingHome: 'Startseite ansehen',
    parentLogin: 'Eltern: Mit Google anmelden',
    safety: 'Eltern- und Kinderbereich sind getrennt. Kinder sehen weder Zahlungen noch Familieneinstellungen.',
    title: 'Wie möchten Sie KidHabit öffnen?',
  },
  it: {
    badge: 'App per la famiglia',
    childEntry: 'Il bambino scansiona il QR o inserisce il codice',
    demo: 'Esplora la demo',
    description: 'I genitori accedono per gestire la famiglia. I bambini usano un codice o la fotocamera per aprire il profilo associato dal genitore.',
    loading: 'Verifica della sessione…',
    marketingHome: 'Vai alla pagina iniziale',
    parentLogin: 'Genitore: accedi con Google',
    safety: 'Le aree genitore e bambino sono separate. I bambini non vedono pagamenti o impostazioni familiari.',
    title: 'Come vuoi accedere a KidHabit?',
  },
  es: {
    badge: 'Aplicación familiar',
    childEntry: 'El niño escanea el QR o introduce el código',
    demo: 'Explorar la demo',
    description: 'Los padres inician sesión para gestionar la familia. Los niños usan un código o la cámara para abrir el perfil vinculado por sus padres.',
    loading: 'Comprobando la sesión…',
    marketingHome: 'Ver la página de inicio',
    parentLogin: 'Padres: iniciar sesión con Google',
    safety: 'Las áreas de padres y niños están separadas. Los niños no ven pagos ni ajustes familiares.',
    title: '¿Cómo quieres entrar en KidHabit?',
  },
  zh: {
    badge: '家庭应用',
    childEntry: '孩子扫描二维码或输入连接码',
    demo: '体验演示版',
    description: '家长登录后管理家庭。孩子通过连接码或相机进入由家长配对的个人档案。',
    loading: '正在检查登录状态…',
    marketingHome: '查看产品主页',
    parentLogin: '家长使用 Google 登录',
    safety: '家长区和儿童区彼此分开。孩子不会看到付款或家庭设置。',
    title: '你想如何进入 KidHabit？',
  },
  ja: {
    badge: 'ファミリーアプリ',
    childEntry: '子どもがQRを読み取るかコードを入力',
    demo: 'デモを体験',
    description: '保護者はログインして家族を管理します。子どもはコードまたはカメラで、保護者が連携したプロフィールを開きます。',
    loading: 'セッションを確認しています…',
    marketingHome: '紹介ページを見る',
    parentLogin: '保護者がGoogleでログイン',
    safety: '保護者用と子ども用の画面は分かれています。子どもに支払いや家族設定は表示されません。',
    title: 'KidHabitにどの方法で入りますか？',
  },
  ko: {
    badge: '가족용 앱',
    childEntry: '아이가 QR을 스캔하거나 코드를 입력',
    demo: '데모 둘러보기',
    description: '보호자는 로그인해 가족을 관리합니다. 아이는 코드나 카메라로 보호자가 연결한 프로필에 들어갑니다.',
    loading: '로그인 상태 확인 중…',
    marketingHome: '소개 페이지 보기',
    parentLogin: '보호자 Google 로그인',
    safety: '보호자와 아이 영역은 분리되어 있습니다. 아이에게 결제나 가족 설정은 보이지 않습니다.',
    title: 'KidHabit에 어떻게 들어갈까요?',
  },
};
