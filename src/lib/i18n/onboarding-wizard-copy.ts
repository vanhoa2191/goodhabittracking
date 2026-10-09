import type { OnboardingRewardId } from '@/lib/onboarding/wizard';
import type { Language } from '@/types';

export type OnboardingWizardCopy = {
  readonly stepOf: (step: number, total: number) => string;
  readonly next: string;
  readonly back: string;
  readonly child: { readonly title: string; readonly explain: string; readonly mascotLabel: string };
  readonly habits: {
    readonly title: string;
    readonly explain: string;
    readonly counter: (selected: number, recommended: number) => string;
    readonly overLimit: string;
    readonly none: string;
    readonly parentRole: string;
    readonly approval: string;
  };
  readonly rewards: {
    readonly title: string;
    readonly explain: string;
    readonly flow: string;
    readonly estimate: (dailyStars: number, cost: number, days: number) => string;
    readonly costLabel: string;
    readonly later: string;
    readonly invalidCost: string;
  };
  readonly confirm: {
    readonly title: string;
    readonly summary: (name: string, age: number, habits: number, rewards: number) => string;
  };
  readonly handoff: {
    readonly title: string;
    readonly ownDevice: string;
    readonly sharedDevice: string;
    readonly ownDeviceSteps: readonly [string, string, string];
    readonly codeLabel: string;
    readonly codeError: string;
    readonly pinExplain: string;
    readonly pinLabel: string;
    readonly setPinAndOpen: string;
    readonly skipPin: string;
    readonly pinError: string;
    readonly openKid: string;
    readonly rewardsFailed: string;
    readonly finalExplain: string;
    readonly toDashboard: string;
  };
  readonly rewardTitles: Record<OnboardingRewardId, { readonly title: string; readonly description: string }>;
};

const COPY: Record<Language, OnboardingWizardCopy> = {
  vi: {
    stepOf: (s, t) => `Bước ${s}/${t}`,
    next: 'Tiếp tục',
    back: 'Quay lại',
    child: {
      title: 'Bé của bạn',
      explain: 'Tuổi quyết định giao diện con thấy và các thói quen được gợi ý.',
      mascotLabel: 'Linh vật đồng hành của bé',
    },
    habits: {
      title: 'Thói quen đầu tiên',
      explain: 'Con chạm Xong → được sao. Việc có Ba mẹ duyệt thì sao chỉ cộng sau khi ba mẹ xác nhận. Ít thói quen một lúc giúp con dễ thành nếp hơn.',
      counter: (n, r) => `Đã chọn ${n} · khuyến nghị ${r}`,
      overLimit: 'Bạn đang chọn nhiều hơn mức khuyến nghị. Vẫn được, nhưng con có thể khó giữ nhịp.',
      none: 'Ba mẹ có thể thêm thói quen sau ở Thiết kế.',
      parentRole: 'Ở tuổi này con học bằng cách nhìn ba mẹ. Đây là những việc ba mẹ làm gương mỗi ngày.',
      approval: 'Ba mẹ duyệt',
    },
    rewards: {
      title: 'Quà để đổi sao',
      explain: 'Sao con kiếm được dùng để đổi quà ba mẹ đặt ra.',
      flow: 'Con xin đổi quà → ba mẹ duyệt → trao quà. Nếu ba mẹ từ chối, con được hoàn sao.',
      estimate: (s, c, d) => `Con kiếm khoảng ${s} sao/ngày → quà ${c} sao ≈ ${d} ngày cố gắng.`,
      costLabel: 'Giá (sao)',
      later: 'Để sau',
      invalidCost: 'Giá sao phải là số nguyên lớn hơn 0.',
    },
    confirm: {
      title: 'Xác nhận & bắt đầu',
      summary: (name, age, h, r) => `${name}, ${age} tuổi · ${h} thói quen · ${r} quà`,
    },
    handoff: {
      title: 'Đưa app cho bé',
      ownDevice: 'Máy riêng của bé',
      sharedDevice: 'Dùng chung máy này',
      ownDeviceSteps: ['Mở app trên máy của bé.', 'Chọn “Đây là thiết bị của bé?”.', 'Quét mã QR hoặc nhập mã bên dưới.'],
      codeLabel: 'Mã kết nối của bé',
      codeError: 'Chưa lấy được mã. Ba mẹ lấy mã ở Gia đình → Hồ sơ các con.',
      pinExplain: 'PIN 4 số giữ khu phụ huynh khỏi tay bé.',
      pinLabel: 'PIN phụ huynh (4 số)',
      setPinAndOpen: 'Đặt PIN & mở màn hình của bé',
      skipPin: 'Bỏ qua, mở màn hình của bé',
      pinError: 'PIN cần đúng 4 chữ số.',
      openKid: 'Mở màn hình của bé',
      rewardsFailed: 'Chưa thêm được quà, ba mẹ thêm lại ở Thiết kế → Đổi quà.',
      finalExplain: 'Ba mẹ xem tiến độ và duyệt ở Hôm nay → Duyệt việc. Nhấn ? cạnh mỗi mục để đọc hướng dẫn.',
      toDashboard: 'Vào bảng phụ huynh',
    },
    rewardTitles: {
      'experience-bedtime-story': {
        title: 'Chọn truyện và người kể tối nay',
        description: 'Con chọn cuốn sách và người thân sẽ đọc cùng trước giờ ngủ.',
      },
      'experience-meal-choice': {
        title: 'Chọn món cho bữa cơm gia đình',
        description: 'Con chọn một món phù hợp và cùng người lớn chuẩn bị.',
      },
      'experience-parent-time': {
        title: '30 phút riêng cùng ba hoặc mẹ',
        description: 'Con chọn một hoạt động và có trọn thời gian riêng, không điện thoại.',
      },
    },
  },
  en: {
    stepOf: (s, t) => `Step ${s} of ${t}`,
    next: 'Next',
    back: 'Back',
    child: {
      title: 'Your child',
      explain: 'Age decides what your child sees and which habits we suggest.',
      mascotLabel: 'Your child’s companion mascot',
    },
    habits: {
      title: 'First habits',
      explain: 'Your child taps Done → earns stars. For habits marked Parent approves, stars are added only after you confirm. A few habits at a time make it easier to build a routine.',
      counter: (n, r) => `${n} selected · ${r} recommended`,
      overLimit: 'You have picked more than recommended. That’s fine, but your child may find it hard to keep up.',
      none: 'You can add habits later in Design.',
      parentRole: 'At this age children learn by watching you. These are things you model every day.',
      approval: 'Parent approves',
    },
    rewards: {
      title: 'Rewards to trade stars for',
      explain: 'The stars your child earns can be traded for rewards you set.',
      flow: 'Child asks for a reward → parent approves → reward is given. If you decline, the stars are refunded.',
      estimate: (s, c, d) => `Your child earns about ${s} stars/day → a ${c}-star reward ≈ ${d} days of effort.`,
      costLabel: 'Cost (stars)',
      later: 'Later',
      invalidCost: 'The star cost must be a whole number greater than 0.',
    },
    confirm: {
      title: 'Confirm & start',
      summary: (name, age, h, r) => `${name}, age ${age} · ${h} habits · ${r} rewards`,
    },
    handoff: {
      title: 'Hand the app to your child',
      ownDevice: 'Child’s own device',
      sharedDevice: 'Share this device',
      ownDeviceSteps: ['Open the app on your child’s device.', 'Choose “Is this the child’s device?”.', 'Scan the QR code or enter the code below.'],
      codeLabel: 'Your child’s connection code',
      codeError: 'Couldn’t get the code. Find it under Family → Child profiles.',
      pinExplain: 'A 4-digit PIN keeps the parent area out of your child’s hands.',
      pinLabel: 'Parent PIN (4 digits)',
      setPinAndOpen: 'Set PIN & open child screen',
      skipPin: 'Skip, open child screen',
      pinError: 'The PIN must be exactly 4 digits.',
      openKid: 'Open child screen',
      rewardsFailed: 'Rewards couldn’t be added. Add them again in Design → Rewards.',
      finalExplain: 'Check progress and approve in Today → Approvals. Tap ? next to any item to read its guide.',
      toDashboard: 'Go to parent dashboard',
    },
    rewardTitles: {
      'experience-bedtime-story': {
        title: 'Pick tonight’s story and storyteller',
        description: 'Your child picks the book and the family member who reads it together before bed.',
      },
      'experience-meal-choice': {
        title: 'Choose a dish for the family meal',
        description: 'Your child picks a suitable dish and prepares it with an adult.',
      },
      'experience-parent-time': {
        title: '30 minutes alone with Mom or Dad',
        description: 'Your child picks an activity and gets undivided time together, with no phones.',
      },
    },
  },
  zh: {
    stepOf: (s, t) => `第 ${s} 步，共 ${t} 步`,
    next: '继续',
    back: '返回',
    child: {
      title: '你的孩子',
      explain: '年龄决定孩子看到的界面和推荐的习惯。',
      mascotLabel: '孩子的陪伴吉祥物',
    },
    habits: {
      title: '最初的习惯',
      explain: '孩子点“完成”→ 获得星星。标有“家长审核”的习惯，需要你确认后才会加星。一次少选几个习惯，孩子更容易养成规律。',
      counter: (n, r) => `已选 ${n} 个 · 建议 ${r} 个`,
      overLimit: '你选的比建议的多。也可以，但孩子可能不容易坚持。',
      none: '之后可以在“规划”中添加习惯。',
      parentRole: '这个年龄的孩子通过观察父母来学习。这些是你每天可以做的榜样。',
      approval: '家长审核',
    },
    rewards: {
      title: '用星星兑换的奖励',
      explain: '孩子赚到的星星可以兑换你设定的奖励。',
      flow: '孩子申请兑换 → 家长审核 → 发放奖励。如果你拒绝，星星会退还给孩子。',
      estimate: (s, c, d) => `孩子每天约赚 ${s} 颗星 → ${c} 星的奖励 ≈ 努力 ${d} 天。`,
      costLabel: '价格（星）',
      later: '以后再说',
      invalidCost: '星星价格必须是大于 0 的整数。',
    },
    confirm: {
      title: '确认并开始',
      summary: (name, age, h, r) => `${name}，${age} 岁 · ${h} 个习惯 · ${r} 个奖励`,
    },
    handoff: {
      title: '把应用交给孩子',
      ownDevice: '孩子自己的设备',
      sharedDevice: '共用这台设备',
      ownDeviceSteps: ['在孩子的设备上打开应用。', '选择“这是孩子的设备吗？”。', '扫描二维码，或输入下方的代码。'],
      codeLabel: '孩子的连接码',
      codeError: '暂时无法获取代码。请在“家庭 → 孩子档案”中查看。',
      pinExplain: '4 位 PIN 可以防止孩子进入家长区。',
      pinLabel: '家长 PIN（4 位）',
      setPinAndOpen: '设置 PIN 并打开孩子界面',
      skipPin: '跳过，打开孩子界面',
      pinError: 'PIN 必须是 4 位数字。',
      openKid: '打开孩子界面',
      rewardsFailed: '奖励添加失败，请在“规划 → 奖励兑换”中重新添加。',
      finalExplain: '在“今天 → 家长审批”中查看进度并审核。点按每一项旁边的 ? 可阅读说明。',
      toDashboard: '进入家长面板',
    },
    rewardTitles: {
      'experience-bedtime-story': {
        title: '选今晚的故事和讲故事的人',
        description: '孩子选一本书，并选一位家人睡前一起读。',
      },
      'experience-meal-choice': {
        title: '为家庭饭菜选一道菜',
        description: '孩子选一道合适的菜，并和大人一起准备。',
      },
      'experience-parent-time': {
        title: '和爸爸或妈妈单独相处 30 分钟',
        description: '孩子选一项活动，拥有完整的专属时间，不用手机。',
      },
    },
  },
  ja: {
    stepOf: (s, t) => `ステップ ${s}/${t}`,
    next: '次へ',
    back: '戻る',
    child: {
      title: 'お子さま',
      explain: '年齢によって、お子さまに表示される画面とおすすめの習慣が決まります。',
      mascotLabel: 'お子さまのお供マスコット',
    },
    habits: {
      title: '最初の習慣',
      explain: 'お子さまが「できた」をタップ → スターがもらえます。「保護者が承認」の習慣は、保護者が確認してからスターが加算されます。一度に少ない習慣のほうが、定着しやすくなります。',
      counter: (n, r) => `${n} 件選択中 · おすすめ ${r} 件`,
      overLimit: 'おすすめより多く選んでいます。このままでも大丈夫ですが、お子さまが続けにくくなるかもしれません。',
      none: '習慣は後から「設計」で追加できます。',
      parentRole: 'この年齢の子は、保護者の姿を見て学びます。毎日お手本として行うことです。',
      approval: '保護者が承認',
    },
    rewards: {
      title: 'スターと交換するごほうび',
      explain: 'お子さまが貯めたスターは、保護者が決めたごほうびと交換できます。',
      flow: 'お子さまが交換を申請 → 保護者が承認 → ごほうびを渡す。承認しなかった場合は、スターが戻ります。',
      estimate: (s, c, d) => `お子さまは 1 日に約 ${s} スター獲得 → ${c} スターのごほうびまで ≈ ${d} 日の頑張り。`,
      costLabel: '必要スター数',
      later: '後で',
      invalidCost: 'スター数は 0 より大きい整数にしてください。',
    },
    confirm: {
      title: '確認してスタート',
      summary: (name, age, h, r) => `${name}、${age} 歳 · 習慣 ${h} 件 · ごほうび ${r} 件`,
    },
    handoff: {
      title: 'お子さまにアプリを渡す',
      ownDevice: 'お子さま専用の端末',
      sharedDevice: 'この端末を共有',
      ownDeviceSteps: ['お子さまの端末でアプリを開きます。', '「お子さまの端末ですか？」を選びます。', 'QR コードをスキャンするか、下のコードを入力します。'],
      codeLabel: 'お子さまの接続コード',
      codeError: 'コードを取得できませんでした。「家族 → お子さまのプロフィール」で確認できます。',
      pinExplain: '4 桁の PIN で、保護者エリアをお子さまから守ります。',
      pinLabel: '保護者 PIN（4 桁）',
      setPinAndOpen: 'PIN を設定してお子さま画面を開く',
      skipPin: 'スキップしてお子さま画面を開く',
      pinError: 'PIN は 4 桁の数字にしてください。',
      openKid: 'お子さま画面を開く',
      rewardsFailed: 'ごほうびを追加できませんでした。「設計 → ごほうび」から追加し直してください。',
      finalExplain: '進み具合の確認と承認は「今日 → チェック待ち」で行えます。各項目の横の ? をタップすると説明が読めます。',
      toDashboard: '保護者ダッシュボードへ',
    },
    rewardTitles: {
      'experience-bedtime-story': {
        title: '今夜のお話と読み手を選ぶ',
        description: 'お子さまが本を選び、寝る前に一緒に読んでくれる家族を選びます。',
      },
      'experience-meal-choice': {
        title: '家族の食事のメニューを選ぶ',
        description: 'お子さまがふさわしい一品を選び、大人と一緒に準備します。',
      },
      'experience-parent-time': {
        title: 'パパかママと 30 分、二人きり',
        description: 'お子さまが活動を選び、スマホなしでたっぷり二人の時間を過ごします。',
      },
    },
  },
  ko: {
    stepOf: (s, t) => `${t}단계 중 ${s}단계`,
    next: '다음',
    back: '이전',
    child: {
      title: '우리 아이',
      explain: '나이에 따라 아이에게 보이는 화면과 추천 습관이 달라져요.',
      mascotLabel: '아이와 함께하는 마스코트',
    },
    habits: {
      title: '첫 번째 습관',
      explain: '아이가 완료를 누르면 → 별을 받아요. “부모 승인” 습관은 부모님이 확인한 뒤에 별이 더해져요. 한 번에 적은 수의 습관으로 시작하면 몸에 배기 쉬워요.',
      counter: (n, r) => `${n}개 선택 · 권장 ${r}개`,
      overLimit: '권장보다 많이 선택했어요. 괜찮지만 아이가 꾸준히 하기 어려울 수 있어요.',
      none: '습관은 나중에 설계에서 추가할 수 있어요.',
      parentRole: '이 나이의 아이는 부모님을 보며 배워요. 부모님이 매일 보여 줄 수 있는 모범이에요.',
      approval: '부모 승인',
    },
    rewards: {
      title: '별로 바꿀 선물',
      explain: '아이가 모은 별로 부모님이 정한 선물과 바꿀 수 있어요.',
      flow: '아이가 교환 요청 → 부모 승인 → 선물 전달. 부모님이 거절하면 별을 돌려받아요.',
      estimate: (s, c, d) => `아이는 하루 약 ${s}개의 별을 모아요 → ${c}별 선물까지 ≈ ${d}일 노력.`,
      costLabel: '필요한 별',
      later: '나중에',
      invalidCost: '별 개수는 0보다 큰 정수여야 해요.',
    },
    confirm: {
      title: '확인하고 시작',
      summary: (name, age, h, r) => `${name}, ${age}세 · 습관 ${h}개 · 선물 ${r}개`,
    },
    handoff: {
      title: '아이에게 앱 건네기',
      ownDevice: '아이 전용 기기',
      sharedDevice: '이 기기를 함께 사용',
      ownDeviceSteps: ['아이의 기기에서 앱을 열어요.', '“아이의 기기인가요?”를 선택해요.', 'QR 코드를 스캔하거나 아래 코드를 입력해요.'],
      codeLabel: '아이 연결 코드',
      codeError: '코드를 가져오지 못했어요. 가족 → 아이 프로필에서 확인하세요.',
      pinExplain: '4자리 PIN으로 부모 영역을 아이에게서 지켜요.',
      pinLabel: '부모 PIN (4자리)',
      setPinAndOpen: 'PIN 설정하고 아이 화면 열기',
      skipPin: '건너뛰고 아이 화면 열기',
      pinError: 'PIN은 정확히 4자리 숫자여야 해요.',
      openKid: '아이 화면 열기',
      rewardsFailed: '선물을 추가하지 못했어요. 설계 → 선물 상점에서 다시 추가하세요.',
      finalExplain: '오늘 → 미션 승인에서 진행 상황을 보고 승인하세요. 각 항목 옆의 ?를 누르면 안내를 읽을 수 있어요.',
      toDashboard: '부모 대시보드로 이동',
    },
    rewardTitles: {
      'experience-bedtime-story': {
        title: '오늘 밤 이야기와 읽어 줄 사람 고르기',
        description: '아이가 책을 고르고, 잠들기 전에 함께 읽어 줄 가족을 정해요.',
      },
      'experience-meal-choice': {
        title: '가족 식사 메뉴 고르기',
        description: '아이가 알맞은 메뉴를 고르고 어른과 함께 준비해요.',
      },
      'experience-parent-time': {
        title: '엄마 또는 아빠와 단둘이 30분',
        description: '아이가 활동을 고르고, 휴대폰 없이 온전히 둘만의 시간을 보내요.',
      },
    },
  },
  fr: {
    stepOf: (s, t) => `Étape ${s} sur ${t}`,
    next: 'Suivant',
    back: 'Retour',
    child: {
      title: 'Votre enfant',
      explain: 'L’âge détermine ce que voit votre enfant et les habitudes suggérées.',
      mascotLabel: 'Mascotte qui accompagne votre enfant',
    },
    habits: {
      title: 'Premières habitudes',
      explain: 'Votre enfant touche Fait → il gagne des étoiles. Pour les habitudes « Validé par un parent », les étoiles ne sont ajoutées qu’après votre confirmation. Peu d’habitudes à la fois, c’est plus facile à installer.',
      counter: (n, r) => `${n} sélectionnée(s) · ${r} recommandée(s)`,
      overLimit: 'Vous en avez choisi plus que recommandé. C’est possible, mais votre enfant risque d’avoir du mal à suivre.',
      none: 'Vous pourrez ajouter des habitudes plus tard dans Organiser.',
      parentRole: 'À cet âge, l’enfant apprend en vous observant. Voici ce que vous pouvez montrer chaque jour.',
      approval: 'Validé par un parent',
    },
    rewards: {
      title: 'Récompenses à échanger contre des étoiles',
      explain: 'Les étoiles gagnées par votre enfant s’échangent contre les récompenses que vous définissez.',
      flow: 'L’enfant demande une récompense → le parent valide → la récompense est remise. Si vous refusez, les étoiles sont rendues.',
      estimate: (s, c, d) => `Votre enfant gagne environ ${s} étoiles/jour → une récompense de ${c} étoiles ≈ ${d} jours d’efforts.`,
      costLabel: 'Coût (étoiles)',
      later: 'Plus tard',
      invalidCost: 'Le coût en étoiles doit être un nombre entier supérieur à 0.',
    },
    confirm: {
      title: 'Confirmer et commencer',
      summary: (name, age, h, r) => `${name}, ${age} ans · ${h} habitudes · ${r} récompenses`,
    },
    handoff: {
      title: 'Confier l’appli à votre enfant',
      ownDevice: 'Appareil de l’enfant',
      sharedDevice: 'Partager cet appareil',
      ownDeviceSteps: ['Ouvrez l’appli sur l’appareil de votre enfant.', 'Choisissez « C’est l’appareil de l’enfant ? ».', 'Scannez le QR code ou saisissez le code ci-dessous.'],
      codeLabel: 'Code de connexion de l’enfant',
      codeError: 'Impossible d’obtenir le code. Retrouvez-le dans Famille → Profils des enfants.',
      pinExplain: 'Un code PIN à 4 chiffres garde l’espace parent hors de portée de votre enfant.',
      pinLabel: 'PIN parent (4 chiffres)',
      setPinAndOpen: 'Définir le PIN et ouvrir l’écran de l’enfant',
      skipPin: 'Passer, ouvrir l’écran de l’enfant',
      pinError: 'Le PIN doit comporter exactement 4 chiffres.',
      openKid: 'Ouvrir l’écran de l’enfant',
      rewardsFailed: 'Les récompenses n’ont pas pu être ajoutées. Ajoutez-les à nouveau dans Organiser → Cadeaux.',
      finalExplain: 'Suivez les progrès et validez dans Aujourd’hui → Validations. Touchez ? à côté d’un élément pour lire son guide.',
      toDashboard: 'Aller au tableau de bord parent',
    },
    rewardTitles: {
      'experience-bedtime-story': {
        title: 'Choisir l’histoire et le conteur de ce soir',
        description: 'L’enfant choisit le livre et la personne qui le lira avec lui avant de dormir.',
      },
      'experience-meal-choice': {
        title: 'Choisir un plat pour le repas en famille',
        description: 'L’enfant choisit un plat adapté et le prépare avec un adulte.',
      },
      'experience-parent-time': {
        title: '30 minutes en tête-à-tête avec papa ou maman',
        description: 'L’enfant choisit une activité et profite d’un moment rien qu’à eux, sans téléphone.',
      },
    },
  },
  de: {
    stepOf: (s, t) => `Schritt ${s} von ${t}`,
    next: 'Weiter',
    back: 'Zurück',
    child: {
      title: 'Dein Kind',
      explain: 'Das Alter bestimmt, was dein Kind sieht und welche Gewohnheiten vorgeschlagen werden.',
      mascotLabel: 'Begleit-Maskottchen deines Kindes',
    },
    habits: {
      title: 'Erste Gewohnheiten',
      explain: 'Dein Kind tippt auf Erledigt → bekommt Sterne. Bei Gewohnheiten mit „Eltern bestätigen“ werden die Sterne erst nach deiner Bestätigung gutgeschrieben. Wenige Gewohnheiten auf einmal lassen sich leichter zur Routine machen.',
      counter: (n, r) => `${n} ausgewählt · ${r} empfohlen`,
      overLimit: 'Du hast mehr als empfohlen gewählt. Das ist okay, aber dein Kind kann es schwerer durchhalten.',
      none: 'Du kannst später unter Gestalten Gewohnheiten hinzufügen.',
      parentRole: 'In diesem Alter lernen Kinder durch Zuschauen. Das sind Dinge, die du jeden Tag vorlebst.',
      approval: 'Eltern bestätigen',
    },
    rewards: {
      title: 'Belohnungen zum Eintauschen',
      explain: 'Die Sterne deines Kindes können gegen Belohnungen eingetauscht werden, die du festlegst.',
      flow: 'Kind fragt nach einer Belohnung → Eltern bestätigen → Belohnung wird übergeben. Lehnst du ab, bekommt dein Kind die Sterne zurück.',
      estimate: (s, c, d) => `Dein Kind sammelt etwa ${s} Sterne/Tag → eine Belohnung für ${c} Sterne ≈ ${d} Tage Einsatz.`,
      costLabel: 'Preis (Sterne)',
      later: 'Später',
      invalidCost: 'Der Sternepreis muss eine ganze Zahl größer als 0 sein.',
    },
    confirm: {
      title: 'Bestätigen & starten',
      summary: (name, age, h, r) => `${name}, ${age} Jahre · ${h} Gewohnheiten · ${r} Belohnungen`,
    },
    handoff: {
      title: 'App an dein Kind übergeben',
      ownDevice: 'Eigenes Gerät des Kindes',
      sharedDevice: 'Dieses Gerät gemeinsam nutzen',
      ownDeviceSteps: ['Öffne die App auf dem Gerät deines Kindes.', 'Wähle „Ist das das Gerät des Kindes?“.', 'Scanne den QR-Code oder gib den Code unten ein.'],
      codeLabel: 'Verbindungscode deines Kindes',
      codeError: 'Der Code konnte nicht abgerufen werden. Du findest ihn unter Familie → Kinderprofile.',
      pinExplain: 'Eine 4-stellige PIN hält den Elternbereich von deinem Kind fern.',
      pinLabel: 'Eltern-PIN (4 Ziffern)',
      setPinAndOpen: 'PIN festlegen & Kinderansicht öffnen',
      skipPin: 'Überspringen, Kinderansicht öffnen',
      pinError: 'Die PIN muss genau 4 Ziffern haben.',
      openKid: 'Kinderansicht öffnen',
      rewardsFailed: 'Die Belohnungen konnten nicht hinzugefügt werden. Füge sie unter Gestalten → Belohnungen erneut hinzu.',
      finalExplain: 'Fortschritt ansehen und bestätigen unter Heute → Freigaben. Tippe auf ? neben einem Eintrag, um die Anleitung zu lesen.',
      toDashboard: 'Zum Eltern-Dashboard',
    },
    rewardTitles: {
      'experience-bedtime-story': {
        title: 'Heutige Geschichte und Vorleser wählen',
        description: 'Dein Kind wählt das Buch und die Person, die es vor dem Schlafen gemeinsam mit ihm liest.',
      },
      'experience-meal-choice': {
        title: 'Ein Gericht für das Familienessen wählen',
        description: 'Dein Kind wählt ein passendes Gericht und bereitet es mit einem Erwachsenen zu.',
      },
      'experience-parent-time': {
        title: '30 Minuten allein mit Mama oder Papa',
        description: 'Dein Kind wählt eine Aktivität und bekommt ungeteilte gemeinsame Zeit, ohne Handy.',
      },
    },
  },
  it: {
    stepOf: (s, t) => `Passo ${s} di ${t}`,
    next: 'Avanti',
    back: 'Indietro',
    child: {
      title: 'Il tuo bambino',
      explain: 'L’età decide ciò che vede tuo figlio e le abitudini suggerite.',
      mascotLabel: 'La mascotte che accompagna tuo figlio',
    },
    habits: {
      title: 'Prime abitudini',
      explain: 'Tuo figlio tocca Fatto → guadagna stelle. Per le abitudini con “Approva il genitore”, le stelle si aggiungono solo dopo la tua conferma. Poche abitudini alla volta aiutano a creare una routine.',
      counter: (n, r) => `${n} selezionate · ${r} consigliate`,
      overLimit: 'Hai scelto più abitudini del consigliato. Va bene, ma tuo figlio potrebbe fare fatica a starci dietro.',
      none: 'Potrai aggiungere abitudini più tardi in Progetta.',
      parentRole: 'A questa età i bambini imparano guardando te. Queste sono cose che puoi mostrare ogni giorno con l’esempio.',
      approval: 'Approva il genitore',
    },
    rewards: {
      title: 'Premi da scambiare con le stelle',
      explain: 'Le stelle guadagnate da tuo figlio si scambiano con i premi che decidi tu.',
      flow: 'Il bambino chiede un premio → il genitore approva → il premio viene consegnato. Se rifiuti, le stelle vengono restituite.',
      estimate: (s, c, d) => `Tuo figlio guadagna circa ${s} stelle al giorno → un premio da ${c} stelle ≈ ${d} giorni di impegno.`,
      costLabel: 'Costo (stelle)',
      later: 'Più tardi',
      invalidCost: 'Il costo in stelle deve essere un numero intero maggiore di 0.',
    },
    confirm: {
      title: 'Conferma e inizia',
      summary: (name, age, h, r) => `${name}, ${age} anni · ${h} abitudini · ${r} premi`,
    },
    handoff: {
      title: 'Passa l’app a tuo figlio',
      ownDevice: 'Dispositivo del bambino',
      sharedDevice: 'Condividi questo dispositivo',
      ownDeviceSteps: ['Apri l’app sul dispositivo di tuo figlio.', 'Scegli “È il dispositivo del bambino?”.', 'Scansiona il codice QR o inserisci il codice qui sotto.'],
      codeLabel: 'Codice di collegamento del bambino',
      codeError: 'Non è stato possibile ottenere il codice. Lo trovi in Famiglia → Profili dei bambini.',
      pinExplain: 'Un PIN di 4 cifre tiene l’area genitori lontana dalle mani di tuo figlio.',
      pinLabel: 'PIN genitore (4 cifre)',
      setPinAndOpen: 'Imposta il PIN e apri la schermata del bambino',
      skipPin: 'Salta, apri la schermata del bambino',
      pinError: 'Il PIN deve avere esattamente 4 cifre.',
      openKid: 'Apri la schermata del bambino',
      rewardsFailed: 'Non è stato possibile aggiungere i premi. Aggiungili di nuovo in Progetta → Premi.',
      finalExplain: 'Controlla i progressi e approva in Oggi → Approvazioni. Tocca ? accanto a ogni voce per leggere la guida.',
      toDashboard: 'Vai alla dashboard genitori',
    },
    rewardTitles: {
      'experience-bedtime-story': {
        title: 'Scegliere la storia e chi la racconta stasera',
        description: 'Il bambino sceglie il libro e la persona che lo leggerà con lui prima di dormire.',
      },
      'experience-meal-choice': {
        title: 'Scegliere un piatto per il pasto di famiglia',
        description: 'Il bambino sceglie un piatto adatto e lo prepara insieme a un adulto.',
      },
      'experience-parent-time': {
        title: '30 minuti solo con mamma o papà',
        description: 'Il bambino sceglie un’attività e ha tutto il tempo per sé con il genitore, senza telefono.',
      },
    },
  },
  es: {
    stepOf: (s, t) => `Paso ${s} de ${t}`,
    next: 'Siguiente',
    back: 'Atrás',
    child: {
      title: 'Tu hijo o hija',
      explain: 'La edad decide lo que ve tu hijo y los hábitos que se sugieren.',
      mascotLabel: 'La mascota que acompaña a tu hijo',
    },
    habits: {
      title: 'Primeros hábitos',
      explain: 'Tu hijo toca Hecho → gana estrellas. En los hábitos con “Aprueba un adulto”, las estrellas se suman solo cuando tú lo confirmas. Pocos hábitos a la vez ayudan a crear una rutina.',
      counter: (n, r) => `${n} seleccionados · ${r} recomendados`,
      overLimit: 'Has elegido más de lo recomendado. Se puede, pero a tu hijo le puede costar mantener el ritmo.',
      none: 'Puedes añadir hábitos más tarde en Diseñar.',
      parentRole: 'A esta edad los niños aprenden observándote. Estas son cosas que puedes mostrar con el ejemplo cada día.',
      approval: 'Aprueba un adulto',
    },
    rewards: {
      title: 'Premios para canjear por estrellas',
      explain: 'Las estrellas que gana tu hijo se canjean por los premios que tú pongas.',
      flow: 'El niño pide un premio → el adulto aprueba → se entrega el premio. Si lo rechazas, se le devuelven las estrellas.',
      estimate: (s, c, d) => `Tu hijo gana unas ${s} estrellas al día → un premio de ${c} estrellas ≈ ${d} días de esfuerzo.`,
      costLabel: 'Precio (estrellas)',
      later: 'Más tarde',
      invalidCost: 'El precio en estrellas debe ser un número entero mayor que 0.',
    },
    confirm: {
      title: 'Confirmar y empezar',
      summary: (name, age, h, r) => `${name}, ${age} años · ${h} hábitos · ${r} premios`,
    },
    handoff: {
      title: 'Entrega la app a tu hijo',
      ownDevice: 'Dispositivo propio del niño',
      sharedDevice: 'Compartir este dispositivo',
      ownDeviceSteps: ['Abre la app en el dispositivo de tu hijo.', 'Elige “¿Es el dispositivo del niño?”.', 'Escanea el código QR o introduce el código de abajo.'],
      codeLabel: 'Código de conexión del niño',
      codeError: 'No se pudo obtener el código. Búscalo en Familia → Perfiles de los niños.',
      pinExplain: 'Un PIN de 4 dígitos mantiene el área de adultos fuera del alcance de tu hijo.',
      pinLabel: 'PIN de adulto (4 dígitos)',
      setPinAndOpen: 'Crear PIN y abrir la pantalla del niño',
      skipPin: 'Omitir y abrir la pantalla del niño',
      pinError: 'El PIN debe tener exactamente 4 dígitos.',
      openKid: 'Abrir la pantalla del niño',
      rewardsFailed: 'No se pudieron añadir los premios. Vuelve a añadirlos en Diseñar → Recompensas.',
      finalExplain: 'Mira el progreso y aprueba en Hoy → Aprobaciones. Toca ? junto a cada elemento para leer su guía.',
      toDashboard: 'Ir al panel de adultos',
    },
    rewardTitles: {
      'experience-bedtime-story': {
        title: 'Elegir el cuento y quién lo cuenta esta noche',
        description: 'El niño elige el libro y la persona que lo leerá con él antes de dormir.',
      },
      'experience-meal-choice': {
        title: 'Elegir un plato para la comida familiar',
        description: 'El niño elige un plato adecuado y lo prepara junto a un adulto.',
      },
      'experience-parent-time': {
        title: '30 minutos a solas con mamá o papá',
        description: 'El niño elige una actividad y tiene tiempo exclusivo para los dos, sin teléfono.',
      },
    },
  },
};

export function getOnboardingWizardCopy(language: Language): OnboardingWizardCopy {
  return COPY[language] ?? COPY.en;
}
