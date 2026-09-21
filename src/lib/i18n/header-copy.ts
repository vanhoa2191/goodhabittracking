import type { Language } from '@/types';

interface HeaderCopy {
  childCode: string; childCodeButton: string; childCodeShort: string; childConnect: string; familySetup: string;
  parentProfile: string; portraitGuide: string; portraitGuideShort: string;
}

const C: Record<Language, HeaderCopy> = {
  vi:{childCode:'Bé vào bằng mã gia đình',childCodeButton:'Bé nhập mã',childCodeShort:'Nhập mã',childConnect:'Bé nhập mã kết nối gia đình',familySetup:'Đăng ký Con & Phụ huynh',parentProfile:'Hồ sơ Ba Mẹ làm gương',portraitGuide:'Cẩm nang 16 Phẩm chất & 7 Cách trao tặng',portraitGuideShort:'Cẩm nang 16 Phẩm chất'},
  en:{childCode:'Child enters with a family code',childCodeButton:'Child code',childCodeShort:'Enter code',childConnect:'Enter a family connection code',familySetup:'Set up child & parent',parentProfile:'Parent role-model profile',portraitGuide:'Guide to 16 Character Strengths & 7 Ways of Giving',portraitGuideShort:'16 Strengths Guide'},
  fr:{childCode:'Accès enfant avec un code familial',childCodeButton:'Code enfant',childCodeShort:'Saisir code',childConnect:'Saisir un code de connexion familial',familySetup:'Configurer enfant et parent',parentProfile:'Profil de parent modèle',portraitGuide:'Guide des 16 forces et 7 façons de donner',portraitGuideShort:'Guide des 16 forces'},
  de:{childCode:'Kinderzugang mit Familiencode',childCodeButton:'Kindercode',childCodeShort:'Code eingeben',childConnect:'Familien-Verbindungscode eingeben',familySetup:'Kind & Eltern einrichten',parentProfile:'Eltern-Vorbildprofil',portraitGuide:'Ratgeber zu 16 Stärken & 7 Arten des Gebens',portraitGuideShort:'Ratgeber: 16 Stärken'},
  it:{childCode:'Accesso del bambino con codice famiglia',childCodeButton:'Codice bambino',childCodeShort:'Inserisci codice',childConnect:'Inserisci un codice di collegamento famiglia',familySetup:'Configura bambino e genitore',parentProfile:'Profilo genitore modello',portraitGuide:'Guida a 16 punti di forza e 7 modi di donare',portraitGuideShort:'Guida alle 16 qualità'},
  es:{childCode:'Acceso infantil con código familiar',childCodeButton:'Código infantil',childCodeShort:'Introducir código',childConnect:'Introduce un código de conexión familiar',familySetup:'Configurar niño y padre',parentProfile:'Perfil de padres modelo',portraitGuide:'Guía de 16 fortalezas y 7 formas de dar',portraitGuideShort:'Guía de 16 fortalezas'},
  zh:{childCode:'孩子使用家庭码进入',childCodeButton:'孩子代码',childCodeShort:'输入代码',childConnect:'输入家庭连接码',familySetup:'设置孩子与家长',parentProfile:'父母榜样档案',portraitGuide:'16 项品格优势与 7 种给予方式指南',portraitGuideShort:'16 项品格指南'},
  ja:{childCode:'家族コードで子どもが入る',childCodeButton:'子どもコード',childCodeShort:'コード入力',childConnect:'家族接続コードを入力',familySetup:'子どもと保護者を設定',parentProfile:'保護者のお手本プロフィール',portraitGuide:'16の人格的強みと7つの与え方ガイド',portraitGuideShort:'16の強みガイド'},
  ko:{childCode:'가족 코드로 아이 접속',childCodeButton:'아이 코드',childCodeShort:'코드 입력',childConnect:'가족 연결 코드 입력',familySetup:'아이 및 부모 설정',parentProfile:'부모 본보기 프로필',portraitGuide:'16가지 인성 강점과 7가지 나눔 가이드',portraitGuideShort:'16가지 강점 가이드'},
};

export function getHeaderCopy(language: Language): HeaderCopy { return C[language]; }
