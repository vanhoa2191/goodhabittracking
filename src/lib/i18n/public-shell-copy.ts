import type { Language } from '@/types';

export type PublicShellCopy = {
  readonly home: string;
  readonly parentInfo: string;
  readonly draft: string;
  readonly legalNav: string;
  readonly privacy: string;
  readonly terms: string;
  readonly contact: string;
  readonly docs: string;
  readonly pricing: string;
  readonly framework: string;
  readonly science: string;
  readonly roadmaps: string;
  readonly publicNav: string;
  readonly footerNav: string;
  readonly footer: string;
  readonly updated: string;
  readonly guide: string;
};

export const COPY: Record<Language, PublicShellCopy> = {
  "vi": {
    "home": "Trang chủ",
    "parentInfo": "Thông tin dành cho phụ huynh",
    "draft": "Bản thông tin đang ở trạng thái chờ chủ sản phẩm duyệt trước khi công bố.",
    "legalNav": "Thông tin pháp lý và hỗ trợ",
    "privacy": "Quyền riêng tư",
    "terms": "Điều khoản",
    "contact": "Liên hệ",
    "docs": "Hướng dẫn sử dụng",
    "pricing": "Bảng giá",
    "framework": "Khung thói quen",
    "science": "Cơ sở khoa học",
    "roadmaps": "Lộ trình",
    "publicNav": "Nội dung công khai",
    "footerNav": "Liên kết cuối trang",
    "footer": "KidHabit Hero · Đồng hành cùng gia đình xây thói quen mỗi ngày.",
    "updated": "Cập nhật lần cuối:",
    "guide": "Hướng dẫn"
  },
  "en": {
    "home": "Home",
    "parentInfo": "Information for parents",
    "draft": "This information is awaiting approval from the product owner before publication.",
    "legalNav": "Legal information and support",
    "privacy": "Privacy",
    "terms": "Terms",
    "contact": "Contact",
    "docs": "User guide",
    "pricing": "Pricing",
    "framework": "Habit framework",
    "science": "Scientific basis",
    "roadmaps": "Roadmaps",
    "publicNav": "Public content",
    "footerNav": "Footer links",
    "footer": "KidHabit Hero · Helping families build habits every day.",
    "updated": "Last updated:",
    "guide": "User guide"
  },
  "fr": {
    "home": "Accueil",
    "parentInfo": "Informations pour les parents",
    "draft": "Ces informations attendent l’approbation du responsable du produit avant publication.",
    "legalNav": "Informations juridiques et assistance",
    "privacy": "Confidentialité",
    "terms": "Conditions",
    "contact": "Contact",
    "docs": "Guide d’utilisation",
    "pricing": "Tarifs",
    "framework": "Cadre des habitudes",
    "science": "Fondements scientifiques",
    "roadmaps": "Parcours",
    "publicNav": "Contenu public",
    "footerNav": "Liens de bas de page",
    "footer": "KidHabit Hero · Accompagner les familles dans leurs habitudes au quotidien.",
    "updated": "Dernière mise à jour :",
    "guide": "Guide d’utilisation"
  },
  "de": {
    "home": "Startseite",
    "parentInfo": "Informationen für Eltern",
    "draft": "Diese Informationen warten vor der Veröffentlichung auf die Freigabe durch den Produktverantwortlichen.",
    "legalNav": "Rechtliche Informationen und Support",
    "privacy": "Datenschutz",
    "terms": "Nutzungsbedingungen",
    "contact": "Kontakt",
    "docs": "Benutzerhandbuch",
    "pricing": "Preise",
    "framework": "Gewohnheitsrahmen",
    "science": "Wissenschaftliche Grundlagen",
    "roadmaps": "Entwicklungspläne",
    "publicNav": "Öffentliche Inhalte",
    "footerNav": "Links im Fußbereich",
    "footer": "KidHabit Hero · Familien beim täglichen Aufbau von Gewohnheiten begleiten.",
    "updated": "Zuletzt aktualisiert:",
    "guide": "Benutzerhandbuch"
  },
  "it": {
    "home": "Home",
    "parentInfo": "Informazioni per i genitori",
    "draft": "Queste informazioni sono in attesa dell’approvazione del responsabile del prodotto prima della pubblicazione.",
    "legalNav": "Informazioni legali e assistenza",
    "privacy": "Privacy",
    "terms": "Condizioni",
    "contact": "Contatti",
    "docs": "Guida all’uso",
    "pricing": "Prezzi",
    "framework": "Quadro delle abitudini",
    "science": "Basi scientifiche",
    "roadmaps": "Percorsi",
    "publicNav": "Contenuti pubblici",
    "footerNav": "Link a piè di pagina",
    "footer": "KidHabit Hero · Accompagnare le famiglie nelle abitudini di ogni giorno.",
    "updated": "Ultimo aggiornamento:",
    "guide": "Guida all’uso"
  },
  "es": {
    "home": "Inicio",
    "parentInfo": "Información para padres",
    "draft": "Esta información está pendiente de aprobación por el responsable del producto antes de publicarse.",
    "legalNav": "Información legal y asistencia",
    "privacy": "Privacidad",
    "terms": "Condiciones",
    "contact": "Contacto",
    "docs": "Guía de uso",
    "pricing": "Precios",
    "framework": "Marco de hábitos",
    "science": "Base científica",
    "roadmaps": "Recorridos",
    "publicNav": "Contenido público",
    "footerNav": "Enlaces del pie de página",
    "footer": "KidHabit Hero · Acompañar a las familias a crear hábitos cada día.",
    "updated": "Última actualización:",
    "guide": "Guía de uso"
  },
  "zh": {
    "home": "首页",
    "parentInfo": "家长信息",
    "draft": "此信息尚待产品负责人批准后才能发布。",
    "legalNav": "法律信息与支持",
    "privacy": "隐私",
    "terms": "条款",
    "contact": "联系",
    "docs": "使用指南",
    "pricing": "价格",
    "framework": "习惯框架",
    "science": "科学依据",
    "roadmaps": "成长路线",
    "publicNav": "公开内容",
    "footerNav": "页脚链接",
    "footer": "KidHabit Hero · 陪伴家庭每天培养习惯。",
    "updated": "最后更新：",
    "guide": "使用指南"
  },
  "ja": {
    "home": "ホーム",
    "parentInfo": "保護者向け情報",
    "draft": "この情報は、公開前に製品責任者の承認を待っています。",
    "legalNav": "法的情報とサポート",
    "privacy": "プライバシー",
    "terms": "利用規約",
    "contact": "お問い合わせ",
    "docs": "利用ガイド",
    "pricing": "料金",
    "framework": "習慣の枠組み",
    "science": "科学的根拠",
    "roadmaps": "成長プラン",
    "publicNav": "公開コンテンツ",
    "footerNav": "フッターリンク",
    "footer": "KidHabit Hero · 家族とともに毎日の習慣づくりを。",
    "updated": "最終更新：",
    "guide": "利用ガイド"
  },
  "ko": {
    "home": "홈",
    "parentInfo": "부모를 위한 정보",
    "draft": "이 정보는 공개 전 제품 책임자의 승인을 기다리고 있습니다.",
    "legalNav": "법률 정보 및 지원",
    "privacy": "개인정보 보호",
    "terms": "이용약관",
    "contact": "문의",
    "docs": "사용 안내",
    "pricing": "요금",
    "framework": "습관 체계",
    "science": "과학적 근거",
    "roadmaps": "성장 과정",
    "publicNav": "공개 콘텐츠",
    "footerNav": "하단 링크",
    "footer": "KidHabit Hero · 가족의 매일 습관 만들기를 함께합니다.",
    "updated": "마지막 업데이트:",
    "guide": "사용 안내"
  }
};

export function getPublicShellCopy(language: Language): PublicShellCopy {
  return COPY[language];
}
