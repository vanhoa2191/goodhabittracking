import frameworkData from '../../src/data/habit-framework-v1.vi.json' with { type: 'json' };
import { pricingTiers } from './pricing.mjs';

export const navigation = [
  { href: '/framework/', label: 'Khung thói quen', anchor: '#chan-dung' },
  { href: '/science/', label: 'Cơ sở khoa học' },
  { href: '/roadmaps/', label: 'Lộ trình' },
  { href: '/pricing/', label: 'Bảng giá', anchor: '#bang-gia' },
  { href: '/blog/', label: 'Blog' },
  { href: '/docs/', label: 'Hướng dẫn' },
];

const habitCount = frameworkData.habits.length;
const stageCount = frameworkData.stages.length;
const youngest = frameworkData.stages[0].ageRange.split('-')[0];
const oldest = frameworkData.stages.at(-1).ageRange.split('-')[1];

/**
 * Quality labels shown under a habit. Keys are framework concept tags; a habit may only show a label whose tag
 * is in its own conceptTags (checked at build below and in tests/unit/marketing-build.test.ts).
 * @type {Readonly<Record<string, string>>}
 */
export const traitLabels = Object.freeze({
  '#8TốChất:NTAI-02-KienTri': 'Kiên trì',
  '#8TốChất:NTAI-07-TranTrongBietOn': 'Biết ơn',
  '#ChânDung:CD-10-LuatSatBanThan': 'Luật sắt bản thân',
  '#8TốChất:NTAI-03-DungCamNhanLoi': 'Dũng cảm nhận lỗi',
  '#8TốChất:NTAI-08-KhiemTon': 'Khiêm tốn',
  '#8TốChất:NTAI-06-GanhVac': 'Gánh vác',
  '#8TốChất:NTAI-05-CongHien': 'Cống hiến',
  '#ChânDung:CD-02-TamThaiAnVui': 'Tâm thái an vui',
  '#ChânDung:CD-04-PhamChatUuTu': 'Phẩm chất ưu tú',
  '#ChânDung:CD-09-GiaoTiepThongThai': 'Giao tiếp',
  '#8TốChất:NTAI-01-SucHocTap': 'Sức học tập',
  '#8TốChất:NTAI-04-DungCamThayDoi': 'Dũng cảm thay đổi',
  '#ChânDung:CD-07-SucKhoeNguoiSat': 'Sức khỏe',
});

const tag = Object.fromEntries(Object.entries(traitLabels).map(([key, label]) => [label, key]));

// Three habits per stage, reviewed against the framework. `name` is a shorter display name where the
// framework's is long; the child's meaning is always quoted verbatim from the framework.
/** @type {Record<string, Array<[id: string, shortName: string | null, labels: string[]]>>} */
const stageSelection = {
  GD1: [
    ['GD1-NT-01', 'Vòng lặp phát – đáp', ['Tâm thái an vui', 'Biết ơn']],
    ['GD1-MQH-01', 'Ba nghi thức: Mắt – Miệng – Tay', ['Phẩm chất ưu tú', 'Giao tiếp']],
    ['GD1-TC-01', 'Trật tự & chờ đợi ngắn', ['Luật sắt bản thân', 'Kiên trì']],
  ],
  GD2: [
    ['GD2-NT-02', null, ['Dũng cảm nhận lỗi', 'Khiêm tốn']],
    ['GD2-HT-02', 'Việc nhà thuộc về con', ['Gánh vác', 'Cống hiến']],
    ['GD2-TC-01', 'Ba lọ tiền đầu tiên', ['Cống hiến', 'Kiên trì']],
  ],
  GD3: [
    ['GD3-NT-01', null, ['Biết ơn', 'Tâm thái an vui']],
    ['GD3-TC-01', null, ['Kiên trì', 'Cống hiến']],
    ['GD3-SK-01', 'Ngủ đủ & nghi thức không màn hình', ['Luật sắt bản thân', 'Sức khỏe']],
  ],
  GD4: [
    ['GD4-NT-02', 'Luật sắt bản thân — tự đặt luật, tự giữ', ['Luật sắt bản thân', 'Kiên trì']],
    ['GD4-MQH-02', 'Xin lỗi – Cảm ơn – Phản hồi 3 lớp', ['Giao tiếp', 'Khiêm tốn']],
    ['GD4-HT-01', 'Học tập tự chủ', ['Sức học tập', 'Dũng cảm thay đổi']],
  ],
  GD5: [
    ['GD5-NT-01', 'Tuyên ngôn & nhịp tuần', ['Luật sắt bản thân', 'Dũng cảm thay đổi']],
    ['GD5-NT-03', 'Cho đi có chủ đích', ['Cống hiến', 'Biết ơn']],
    ['GD5-HT-03', 'Lộ trình nghề ước mơ', ['Gánh vác', 'Dũng cảm thay đổi']],
  ],
};

/** @param {[id: string, shortName: string | null, labels: string[]]} selection */
function storyHabit([id, shortName, labels]) {
  const habit = frameworkData.habits.find((candidate) => candidate.id === id);
  if (!habit) throw new Error(`Habit ${id} is not in the framework`);
  const traits = labels.map((label) => {
    const conceptTag = tag[label];
    if (!conceptTag || !habit.conceptTags.includes(conceptTag)) throw new Error(`Habit ${id} is not tagged with “${label}”`);
    return { tag: conceptTag, label };
  });
  return { id, name: shortName ?? habit.name, fullName: habit.name, childMeaning: habit.childMeaning, traits };
}

export const storyStages = frameworkData.stages.map((stage) => ({
  id: stage.id,
  age: stage.ageRange.replace('-', '–'),
  title: stage.title,
  adultRole: stage.adultRole,
  habits: (stageSelection[stage.id] ?? []).map(storyHabit),
}));

/** Total seats only. The seats left come from the database at request time, never from the build. */
export const launchOffer = {
  slots: 10,
  planId: 'yearly',
  tag: 'Ưu đãi ra mắt',
  text: '10 gia đình đầu tiên mua Gói Pro theo năm trước khi Pro Plus ra mắt sẽ được nâng cấp miễn phí lên Pro Plus, có Huấn luyện viên thói quen.',
  seatsLabel: 'suất còn lại',
  soldOut: 'Đã hết suất',
  upcomingNote: 'Đang phát triển. Mua Gói Pro năm hôm nay để giữ suất nâng cấp miễn phí.',
};

/** Copy for the story-led home page, chapter by chapter. Source: the founder's letter, approved by the owner. */
export const story = {
  chapters: [
    { id: 'mo-dau', label: 'Mở đầu' },
    { id: 'buoi-sang', label: 'Buổi sáng', next: 'Những cách đã thử' },
    { id: 'da-thu', label: 'Đã thử', next: 'Thứ thật sự còn thiếu' },
    { id: 'ban-do', label: 'Bản đồ', next: 'Thử làm con một phút' },
    { id: 'thu-lam-con', label: 'Thử làm con', next: 'Vì sao KidHabit ra đời' },
    { id: 'la-thu', label: 'Lá thư', next: 'Chọn gói cho nhà mình' },
    { id: 'gia', label: 'Chọn gói' },
    { id: 'hoi-dap', label: 'Hỏi đáp' },
  ],
  nextLabel: 'Chương tiếp',
  hero: {
    eyebrow: 'Nhật ký của một gia đình hay nhắc',
    title: 'Thôi làm chiếc đồng hồ báo thức biết nói của con.',
    highlight: 'đồng hồ báo thức',
    lead: 'Bảng sao, hứa thưởng, ứng dụng nhắc giờ… nếu cách nào cũng chỉ được vài tuần, có thể thứ còn thiếu là một lộ trình. KidHabit cho cả nhà một lộ trình theo tuổi: biết cần làm gì, mỗi việc nhỏ gắn với một phẩm chất, con tự đánh dấu, ba mẹ chỉ cần khen.',
    primaryCta: 'Dùng thử 7 ngày',
    secondaryCta: 'Xem con sẽ thấy gì',
    assurances: ['Không cần thẻ', 'Không tự trừ tiền', 'Hoàn tiền 30 ngày'],
    imageAlt: 'Màn hình của bé trong KidHabit: nhân vật Leo, số sao và tiến độ việc hôm nay',
    caption: 'Màn hình của con',
    chip: 'Con tự đánh dấu xong',
  },
  quiz: {
    eyebrow: 'Trước khi đọc tiếp',
    question: 'Sáng nay, ba mẹ đã nhắc con bao nhiêu lần?',
    options: [
      { value: 'low', label: '1–2 lần', answer: 'Nhà bạn đang có nhịp tốt. Câu chuyện dưới đây gợi ý một cách giữ nhịp ấy, cả trong những tuần bận rộn.', finalTitle: 'Giữ nhịp tốt như sáng nay, mỗi ngày.' },
      { value: 'mid', label: '3–5 lần', answer: 'Ba đến năm lần mỗi sáng là 90 đến 150 lần mỗi tháng. Câu chuyện dưới đây có thể quen với bạn.', finalTitle: 'Sáng mai, thử bớt một lần nhắc.' },
      { value: 'high', label: 'Không đếm nổi', answer: 'Bạn không đơn độc. Người làm ra KidHabit cũng từng đếm không nổi. Đây là câu chuyện của họ.', finalTitle: 'Sáng mai, bắt đầu từ một việc con tự làm.' },
    ],
    readMore: 'Đọc câu chuyện',
  },
  morning: {
    eyebrow: 'Chương 1',
    title: 'Một buổi sáng quen thuộc.',
    lead: 'Mỗi sáng nhà tôi bắt đầu bằng cùng một câu. Có hôm tôi thử đếm, và chính tôi cũng thấy mệt khi nghe giọng mình.',
    counterLabel: 'lần nhắc trước khi con ra khỏi nhà',
    timeline: [
      { time: '6:45', text: 'Dậy đi con.' },
      { time: '6:50', text: 'Dậy chưa? Gọi lần hai rồi đấy.' },
      { time: '6:55', text: 'Đánh răng chưa con?' },
      { time: '7:00', text: 'Ăn nhanh lên con.' },
      { time: '7:05', text: 'Cặp đâu? Áo khoác đâu?' },
      { time: '7:10', text: 'Nhanh lên, muộn rồi!' },
      { time: '7:15', text: 'Mẹ nói bao nhiêu lần rồi?' },
    ],
  },
  tried: {
    eyebrow: 'Chương 2',
    title: 'Tôi đã thử gần như mọi cách.',
    lead: 'Còn ba mẹ thì sao? Chạm vào những cách nhà mình đã thử.',
    cards: [
      { icon: '⭐', title: 'Bảng dán sao', text: 'Dán trên tủ lạnh, vui được hai tuần.', end: 'Bảng bạc màu, không ai nhớ nữa.' },
      { icon: '🎁', title: 'Hứa thưởng', text: 'Con làm vì món quà.', end: 'Hết quà, hết làm.' },
      { icon: '📵', title: 'Phạt, cấm điện thoại', text: 'Con làm trong nước mắt.', end: 'Ba mẹ áy náy cả buổi tối.' },
      { icon: '⏰', title: 'App nhắc giờ', text: 'Điện thoại kêu đúng giờ.', end: 'Con tắt, mọi thứ lại như cũ.' },
    ],
    resultEmpty: 'Một tuần bận việc, một chuyến về quê, một đợt con ốm… là mọi thứ đứt gánh. Và điều khó nói nhất: người thiếu kiên trì không chỉ là con, mà là cả ba mẹ.',
    /** `{n}` is replaced by the number of cards the reader picked. */
    resultCount: 'Ba mẹ đã thử {n} cách. Không phải vì ba mẹ thiếu cố gắng. Điều KidHabit thêm vào là một lộ trình cho biết cần làm gì ở từng tuổi, và vì sao.',
  },
  missing: {
    eyebrow: 'Chương 3',
    title: 'Thứ còn thiếu không phải là thêm một lời nhắc, mà là một tấm bản đồ.',
    items: [
      { title: 'Biết cần làm gì', text: 'Ở tuổi này con nên tập việc gì trước, việc gì sau, việc gì để sau hẳn.' },
      { title: 'Một lộ trình', text: `Khung ${habitCount} thói quen chia ${stageCount} giai đoạn từ ${youngest} đến ${oldest} tuổi. Ba mẹ biết lúc nào làm mẫu, lúc nào lùi lại.` },
      { title: 'Một lý do', text: 'Mỗi việc nhỏ gắn với một phẩm chất, để con hiểu mình đang trở thành ai, không chỉ làm cho xong.' },
    ],
    explorer: {
      question: 'Con nhà mình bao nhiêu tuổi?',
      hint: 'Chọn để xem vài thói quen trong lộ trình và phẩm chất mỗi việc nuôi dưỡng.',
      ageUnit: 'tuổi',
      roleLabel: 'Vai trò của ba mẹ',
      defaultStage: 'GD3',
      note: `3 trong ${habitCount} thói quen của khung. KidHabit phù hợp nhất với bé 4–12 tuổi tự xem việc; khung đi đến ${oldest} tuổi để ba mẹ thấy cả chặng đường.`,
    },
  },
  demo: {
    eyebrow: 'Chương 4',
    title: 'Cùng buổi sáng ấy, với KidHabit.',
    lead: 'Thử làm con một phút: chạm vào từng việc để hoàn thành. Con mở danh sách, tự đánh dấu, ba mẹ chỉ cần duyệt và khen đúng việc.',
    child: 'Sáng nay của Minh An',
    cheer: 'Leo đang cổ vũ con',
    // Sample tasks; each label is a quality the framework uses (keys of traitLabels).
    tasks: [
      { title: 'Tự dậy khi chuông reo', trait: '#ChânDung:CD-10-LuatSatBanThan', points: 5 },
      { title: 'Đánh răng 2 phút', trait: '#ChânDung:CD-07-SucKhoeNguoiSat', points: 5 },
      { title: 'Tự soạn cặp', trait: '#8TốChất:NTAI-06-GanhVac', points: 10 },
    ],
    stamp: 'Ba mẹ đã duyệt',
    swaps: [
      { before: '“Dậy đi con.”', after: 'Con tự dậy' },
      { before: '“Đánh răng chưa?”', after: 'Con tự đánh dấu' },
      { before: '“Mẹ nói bao nhiêu lần rồi?”', after: '“Hôm nay con xong mấy việc?”' },
    ],
    praiseLabel: 'Lời khen của ba mẹ',
    praise: 'Sáng nay con tự làm hết rồi. Ba mẹ tự hào về con!',
    sampleNote: 'Dữ liệu mẫu.',
  },
  letter: {
    eyebrow: 'Chương 5',
    title: 'Lá thư của người làm ra KidHabit',
    opening: 'Tôi không giận con. Tôi chán chính cái vai của mình. Tôi muốn làm ba mẹ, chứ không muốn làm người giám sát.',
    beforeList: [
      'Tôi đọc sách nuôi dạy con, lưu cả chục bài viết, ghi chép đủ thứ. Nhưng lần nào cũng chỉ được vài tuần. Một tối, nhìn tờ bảng sao đã bong một góc, tôi tự hỏi: tôi đang muốn con thành người như thế nào?',
      'Tôi muốn con tự giác, biết ơn, dám nhận lỗi, biết giữ lời. Nhưng tôi chưa bao giờ nối được những điều lớn ấy với việc nhỏ hằng ngày. Tôi nhắc con dọn giường, mà chưa từng nói cho con biết: dọn giường là cách con giữ lời hứa với chính mình.',
      'Tôi nhận ra mình thiếu ba thứ:',
    ],
    /** Part of the second paragraph the page highlights. */
    highlight: 'dọn giường là cách con giữ lời hứa với chính mình.',
    missing: [
      // `rest` follows the bold words as written, punctuation included.
      { strong: 'Biết cần làm gì', rest: ' ở từng độ tuổi.' },
      { strong: 'Một lộ trình', rest: ' từ lúc con còn nhỏ đến khi con tự làm chủ được mình.' },
      { strong: 'Một lý do', rest: ': mỗi việc nhỏ gắn với một phẩm chất.' },
    ],
    afterList: [
      'Tôi làm KidHabit cho chính gia đình mình trước. Thứ giữ nhịp cho cả nhà không còn là trí nhớ hay sức chịu đựng của ba mẹ, mà là một lộ trình mà cả ba mẹ và con cùng nhìn thấy.',
      'Bây giờ vẫn có hôm con lề mề, vẫn có hôm tôi lỡ lời. Nhưng thay vì “Mẹ nói bao nhiêu lần rồi?”, giờ tôi hỏi “Hôm nay con xong mấy việc rồi?”.',
      'Tôi không hứa con bạn sẽ thay đổi sau một tuần. Mỗi đứa trẻ có nhịp riêng. Điều tôi tin là khi cả nhà biết cần làm gì, đi theo lộ trình nào và vì sao mình làm, việc giữ nhịp sẽ bớt nặng hơn nhiều.',
    ],
    signature: { name: 'Nguyễn Văn Hoà', role: 'Ba của Sam', maker: 'Người làm ra KidHabit' },
    postscriptLabel: 'T.B.',
    postscript: 'Ngày đầu tiên, đừng chọn nhiều. Chỉ một việc thôi, và khen con đúng lúc con làm xong.',
  },
  pricing: {
    eyebrow: 'Chương 6',
    title: 'Bắt đầu với 7 ngày miễn phí. Sau đó, chọn gói hợp với nhà mình.',
    lead: 'Cùng quyền lợi dù trả theo tháng hay theo năm. Trả theo năm để tiết kiệm hơn.',
    kidsLabel: 'Nhà mình có',
    kidsOptions: [
      { value: '1', label: '1 bé', tier: 'solo' },
      { value: '2', label: '2–5 bé', tier: 'pro' },
    ],
    cycleLabel: 'Trả theo',
    cycleOptions: [
      { value: 'month', label: 'Tháng' },
      { value: 'year', label: 'Năm' },
    ],
    defaultCycle: 'year',
    recommendedBadge: 'Hợp với nhà bạn',
    soonButton: 'Sắp ra mắt',
    pledge: [
      { strong: '7 ngày', text: 'dùng thử đầy đủ' },
      { strong: '0đ', text: 'không cần thẻ' },
      { strong: 'Không', text: 'tự động gia hạn' },
      { strong: '30 ngày', text: 'hoàn tiền nếu chưa hợp' },
    ],
  },
  faq: {
    eyebrow: 'Chương 7',
    title: 'Những điều ba mẹ hay băn khoăn.',
  },
  final: {
    title: 'Bắt đầu từ một việc nhỏ, ngay sáng mai.',
    text: 'Ngày đầu tiên, đừng chọn nhiều. Chỉ một việc thôi, và khen con đúng lúc con làm xong. Phần còn lại, cứ để lộ trình dẫn đường.',
    cta: 'Dùng thử 7 ngày, không cần thẻ',
  },
  /** Sticky bar copy per chapter: [title, note, button]. */
  dock: {
    'mo-dau': ['Dùng thử 7 ngày', 'Không cần thẻ · không tự trừ tiền', 'Bắt đầu'],
    'buoi-sang': ['Mệt vì phải nhắc?', 'Xem cách con tự làm', 'Thử ngay'],
    'da-thu': ['Lần này khác ở lộ trình', 'Biết cần làm gì ở từng tuổi', 'Xem lộ trình'],
    'ban-do': ['Lộ trình theo tuổi của con', 'Dùng thử 7 ngày, không cần thẻ', 'Bắt đầu'],
    'thu-lam-con': ['Thử cùng con nhà mình', 'Dùng thử 7 ngày, không cần thẻ', 'Bắt đầu'],
    'la-thu': ['Bắt đầu từ một việc nhỏ', 'Hoàn tiền 30 ngày nếu chưa hợp', 'Chọn gói'],
    'hoi-dap': ['Vẫn còn băn khoăn?', 'Thử 7 ngày rồi quyết định', 'Bắt đầu'],
  },
};

export const mascots = [
  { id: 'leo', name: 'Leo', species: 'sư tử', trait: 'Tập dũng cảm từ việc nhỏ' },
  { id: 'bunny', name: 'Bunny', species: 'thỏ', trait: 'Biết quan tâm mọi người' },
  { id: 'panda', name: 'Panda', species: 'gấu trúc', trait: 'Bình tĩnh để nhìn rõ hơn' },
  { id: 'fox', name: 'Fox', species: 'cáo', trait: 'Tò mò trước điều mới' },
  { id: 'turtle', name: 'Turtle', species: 'rùa', trait: 'Kiên nhẫn đi cùng bé' },
  { id: 'bee', name: 'Bee', species: 'ong', trait: 'Vui khi cả nhà giúp nhau' },
];

export const trustPoints = ['7 ngày dùng thử', 'Không cần thẻ', 'Hoàn tiền 30 ngày'];

export const steps = [
  {
    image: 'parent-roadmap',
    alt: 'Màn hình phụ huynh chọn lộ trình theo độ tuổi: các giai đoạn 0–3, 3–6, 6–12, 12–15, 15–18 và vai trò của ba mẹ ở từng giai đoạn',
    caption: 'Chọn giai đoạn tuổi để thấy thói quen phù hợp và vai trò của ba mẹ.',
    bullets: ['Khung 47 thói quen, chia 5 giai đoạn từ 0 đến 18 tuổi', 'Mỗi thói quen có lời giải thích “vì sao” cho con và hướng dẫn cho ba mẹ', 'Ba mẹ chọn, sửa hoặc tự tạo nhiệm vụ'],
  },
  {
    image: 'kid-tasks',
    alt: 'Danh sách nhiệm vụ buổi sáng của bé trong KidHabit, có việc đã hoàn thành và số sao thưởng',
    caption: 'Mỗi việc có hướng dẫn rõ ràng và số sao thưởng. Ảnh là màn hình của bé.',
    bullets: ['Giao diện riêng cho bé, tự đổi theo ba dải tuổi: 3–8, 9–12 và từ 13 tuổi', 'Bé vào bằng mã QR hoặc mã nhập tay, không cần tài khoản riêng', 'Vuốt hoặc chạm để hoàn thành, có đồng hồ đếm giờ khi việc cần thời gian'],
  },
  {
    image: 'parent-approvals',
    alt: 'Màn hình phụ huynh có nhiệm vụ chờ bố mẹ duyệt với nút Duyệt và Từ chối',
    caption: 'Việc quan trọng chờ ba mẹ duyệt trước khi bé nhận sao.',
    bullets: ['Duyệt hoặc từ chối chỉ với một chạm', 'Xem chuỗi ngày, sao và huy hiệu của từng bé; đổi quà theo danh sách ba mẹ đã thống nhất', 'Gói Pro: tối đa 5 hồ sơ bé và mời người thân cùng theo dõi'],
  },
];

export const safetyPoints = [
  { icon: 'lock', title: 'Khu vực phụ huynh có mã PIN', text: 'Thanh toán và cài đặt gia đình nằm ngoài tầm với của bé.' },
  { icon: 'shield', title: 'Mỗi gia đình một không gian riêng', text: 'Dữ liệu được tách biệt, gia đình này không xem được gia đình khác.' },
  { icon: 'eye-off', title: 'Chia sẻ công khai mặc định tắt', text: 'Bảng xếp hạng công khai chỉ hiện bé khi ba mẹ bật và bé tham gia, bằng biệt danh. Tên thật và tuổi không bao giờ hiện.' },
  { icon: 'trash', title: 'Ba mẹ quyết định giữ hay xóa', text: 'Chủ gia đình có thể xóa toàn bộ dữ liệu gia đình trong ứng dụng.' },
];

// Only real, consented quotes belong here. An entry is shown when it has a
// quote, a name, recorded consent, a source and a review date still in the future.
export const testimonials = [];

// Shown on the home page and /pricing/. Describes what the product does; no promised results.
export const faqs = [
  {
    question: 'Con có chán sau một tuần không?',
    answer: 'Có thể có những ngày con lười, điều đó bình thường. KidHabit bắt đầu từ một việc nhỏ vừa sức, có người bạn đồng hành và lời khen đúng việc, để những ngày khó vẫn có lý do làm tiếp.',
  },
  {
    question: 'Có thêm giờ màn hình cho con không?',
    answer: 'Con chỉ mở ứng dụng để xem việc và đánh dấu xong. Phần lớn thời gian con làm việc thật, ngoài đời thật.',
  },
  {
    question: 'Bé chưa biết đọc thì sao?',
    answer: 'Với bé nhỏ, ba mẹ đọc cùng con. Giao diện cho bé 3–8 tuổi có nút to, hình nhân vật và lời khen ngắn.',
  },
  {
    question: 'Nhà có hai bé khác tuổi?',
    answer: 'Gói Pro dùng cho tối đa 5 bé. Mỗi bé có lộ trình và giao diện riêng theo tuổi.',
  },
  {
    question: 'Ưu đãi nâng cấp lên Pro Plus hoạt động thế nào?',
    answer: '10 gia đình đầu tiên thanh toán Gói Pro theo năm trước ngày Pro Plus ra mắt sẽ được chuyển lên Pro Plus miễn phí cho phần còn lại của năm đã trả. Suất được tính theo thứ tự thanh toán thành công, mỗi gia đình tối đa một suất; khi đủ 10 suất, trang sẽ ghi rõ.',
  },
  {
    question: 'Hết 7 ngày dùng thử thì sao?',
    answer: 'Ba mẹ chọn một gói để tiếp tục ghi nhận việc của con. KidHabit không tự trừ tiền và không tự gia hạn.',
  },
  {
    question: 'Con bao nhiêu tuổi thì phù hợp?',
    answer: 'KidHabit phù hợp nhất với bé 4–12 tuổi tự xem việc và tự đánh dấu xong. Khung thói quen đi từ 0 đến 18 tuổi: với bé nhỏ, ba mẹ làm cùng; với bé lớn hơn, con chủ động hơn.',
  },
  {
    question: 'KidHabit có thay thế việc ba mẹ dạy con không?',
    answer: 'Không. KidHabit là công cụ đồng hành: ba mẹ chọn thói quen, duyệt và khen. Ứng dụng không thay việc dạy con và không cam kết một kết quả phát triển cụ thể.',
  },
  {
    question: 'Giao diện của bé có đổi theo tuổi không?',
    answer: 'Có. Kích thước nút, cách khen và nhãn phần thưởng đổi theo ba dải tuổi: 3–8, 9–12 và từ 13 tuổi. Từ 13 tuổi, bạn tự chọn kiểu gọn hoặc có bạn đồng hành. Ba mẹ có thể ghim một dải cho từng bé hoặc giữ giao diện cũ. Bé dưới 3 tuổi, hoặc chưa có năm sinh, vẫn dùng giao diện mặc định.',
  },
  {
    question: 'Tôi có cần nhập thẻ để dùng thử không?',
    answer: 'Không. Mỗi gia đình dùng thử 7 ngày một lần, không cần thẻ và không bị tự động trừ tiền khi hết hạn.',
  },
  {
    question: 'Tôi có được hoàn tiền không?',
    answer: 'Có. Nếu chưa hài lòng, bạn có thể yêu cầu hoàn tiền trong 30 ngày kể từ ngày thanh toán bằng cách gửi mã đơn và thời điểm thanh toán tới email hỗ trợ.',
  },
  {
    question: 'Con có cần tài khoản riêng không?',
    answer: 'Không. Con vào bằng mã QR hoặc mã nhập tay do ba mẹ cấp và chỉ thấy hồ sơ của chính mình.',
  },
  {
    question: 'Có cần cài ứng dụng không?',
    answer: 'KidHabit chạy ngay trên trình duyệt điện thoại hoặc máy tính. Bạn có thể thêm vào màn hình chính để mở nhanh như một ứng dụng.',
  },
];

export const publicPages = {
  framework: {
    eyebrow: 'Khung nội dung',
    mascot: 'panda',
    icons: ['list-checks', 'book', 'users'],
    title: 'Khung thói quen theo từng giai đoạn',
    description: 'Khung thói quen KidHabit gợi ý những việc nhỏ theo từng giai đoạn tuổi, để ba mẹ bắt đầu từ điều vừa sức thay vì một danh sách dài.',
    sections: [
      ['Không bắt đầu từ một danh sách dài', 'KidHabit giúp ba mẹ chọn một mục tiêu vừa sức, diễn giải rõ việc cần làm và tăng dần độ khó khi con đã sẵn sàng.'],
      ['Thói quen gắn với đời sống', 'Các gợi ý xoay quanh tự chăm sóc, học tập, vận động, kết nối gia đình và trách nhiệm phù hợp với từng giai đoạn.'],
      ['Ba mẹ vẫn là người quyết định', 'Khung gợi ý giúp tiết kiệm thời gian. Ba mẹ chọn, điều chỉnh hoặc tự tạo nhiệm vụ dựa trên nhu cầu thật của con.'],
    ],
  },
  science: {
    eyebrow: 'Cơ sở khoa học',
    title: 'Xây thói quen cho trẻ: điều đã biết và điều chưa biết',
    lede: 'KidHabit dựa trên nghiên cứu về hình thành thói quen để gợi ý cách đồng hành cùng con. Trang này nói rõ bằng chứng đến đâu và giới hạn ở đâu.',
    description: 'Những điều nghiên cứu về thói quen cho biết, những điều chưa biết, và cách KidHabit dùng chúng một cách thận trọng.',
    disclaimer: 'KidHabit là công cụ đồng hành cho gia đình. Chúng tôi không hứa kết quả cho từng em bé và không thay thế tư vấn của bác sĩ, nhà tâm lý hay chuyên gia giáo dục.',
  },
  roadmaps: {
    eyebrow: 'Lộ trình',
    mascot: 'fox',
    icons: ['check', 'clock', 'trend-up'],
    title: 'Lộ trình đủ nhỏ để bắt đầu',
    description: 'Lộ trình ba bước để xây thói quen cho con: bắt đầu với một việc, giữ nhịp đều rồi mở rộng khi con đã vững, cùng cách ghi nhận phù hợp.',
    sections: [
      ['Bắt đầu với một việc', 'Chọn một thói quen có thể hoàn thành trong vài phút và thống nhất cách ghi nhận với con.'],
      ['Duy trì nhịp đều', 'Theo dõi theo ngày, nhìn lại theo tuần và điều chỉnh khi nhiệm vụ quá dễ hoặc quá khó.'],
      ['Mở rộng khi đã vững', 'Khi con đã chủ động hơn, gia đình có thể thêm nhiệm vụ mới hoặc chuyển sang mục tiêu dài hơn.'],
    ],
  },
  docs: {
    eyebrow: 'Hướng dẫn',
    mascot: 'bee',
    layout: 'steps',
    title: 'Hướng dẫn sử dụng KidHabit',
    description: 'Hướng dẫn từng bước dùng KidHabit: tạo không gian gia đình, thiết lập thói quen, ghép thiết bị của bé và theo dõi tiến độ mỗi ngày.',
    sections: [
      ['Tạo không gian gia đình', 'Đăng nhập bằng tài khoản phụ huynh, hoàn thiện thông tin và tạo hồ sơ cho từng bé.'],
      ['Thiết lập cho con', 'Chọn thói quen, tạo nhiệm vụ, đặt điểm và thống nhất phần thưởng trước khi bắt đầu.'],
      ['Ghép thiết bị của trẻ', 'Dùng mã QR cố định hoặc nhập mã thủ công trên thiết bị của con. Ba mẹ có thể làm mới mã trong trang quản lý.'],
      ['Theo dõi và khích lệ', 'Xem tiến độ, xác nhận khi cần và dùng lời khen cụ thể để giúp con hiểu điều mình đã làm tốt.'],
    ],
  },
  contact: {
    eyebrow: 'Hỗ trợ',
    mascot: 'bunny',
    icons: ['alert', 'gift', 'shield'],
    title: 'Liên hệ hỗ trợ',
    description: 'Cách liên hệ hỗ trợ KidHabit nhanh và an toàn: cần gửi thông tin gì khi gặp lỗi hoặc cần hỗ trợ thanh toán, và điều gì không nên gửi.',
    sections: [
      ['Khi gặp lỗi', 'Gửi mã hỗ trợ, thời điểm và thao tác vừa thực hiện. Không gửi mật khẩu, mã PIN phụ huynh hoặc mã ghép thiết bị còn hiệu lực.'],
      ['Khi cần hỗ trợ thanh toán', 'Chỉ gửi mã đơn, gói đã chọn, số tiền và thời điểm. Hãy che số tài khoản không cần thiết trên ảnh xác nhận.'],
      ['Các chủ đề được hỗ trợ', 'KidHabit hỗ trợ đăng nhập, hồ sơ, thiết bị trẻ, kích hoạt gói, yêu cầu dữ liệu và báo cáo truy cập sai gia đình.'],
    ],
  },
};

// ---------------------------------------------------------------------------------------------------------------
// The current home page renderer still uses the blocks below; they go with it when the story page replaces it.
// `plans` also feeds the price list in the terms (legal-content.mjs), so its amounts come from pricing.mjs.

export const outcomes = [
  {
    icon: 'compass',
    title: 'Biết nên rèn gì cho con',
    description: 'Chọn thói quen phù hợp với độ tuổi và mục tiêu của gia đình, không phải tự nghĩ mọi thứ từ đầu.',
  },
  {
    icon: 'list-checks',
    title: 'Giao việc rõ, con dễ làm',
    description: 'Mỗi nhiệm vụ có cách làm cụ thể, để con dễ hiểu việc cần làm và ba mẹ đỡ phải giải thích lại.',
  },
  {
    icon: 'trend-up',
    title: 'Xem lại những việc con đã làm',
    description: 'Cả nhà xem được chuỗi ngày, điểm thưởng và những việc nhỏ con đã hoàn thành.',
  },
];

export const comparison = {
  beforeTitle: 'Khi chỉ dựa vào nhắc nhở',
  before: [
    '7 giờ sáng: giục dậy, nhắc đánh răng, nhắc soạn cặp, rồi nhắc lại lần nữa.',
    '9 giờ tối: nhắc dọn đồ, nhắc học bài. Con né tránh, ba mẹ mệt và căng thẳng.',
    'Con làm vì bị nhắc, chưa hiểu vì sao nên làm.',
  ],
  afterTitle: 'Với KidHabit',
  after: [
    '7 giờ sáng: con mở danh sách việc hôm nay, đọc cách làm và tự đánh dấu từng việc.',
    '9 giờ tối: ba mẹ duyệt những việc con đã làm và khen đúng việc.',
    'Cuối ngày, cả nhà nhìn lại những điều con đã làm tốt.',
  ],
};

const planCopy = [
  { tier: 'solo', cycle: 'month', label: 'Khởi đầu gọn nhẹ', summary: 'Dành cho gia đình bắt đầu cùng một bé.', features: ['1 hồ sơ bé', 'Khung thói quen theo độ tuổi', 'Nhiệm vụ, điểm và phần thưởng', 'Đồng bộ đám mây'], cta: 'Chọn gói 1 bé theo tháng' },
  { tier: 'solo', cycle: 'year', label: 'Tiết kiệm hơn cho 1 bé', summary: 'Cùng quyền lợi Gói 1 bé, thanh toán một lần cho 12 tháng.', features: ['1 hồ sơ bé', 'Đầy đủ quyền lợi Gói 1 bé', 'Thanh toán một lần cho 12 tháng', 'Không tự động gia hạn'], cta: 'Chọn gói 1 bé theo năm' },
  { tier: 'pro', cycle: 'month', label: 'Linh hoạt theo tháng', summary: 'Phù hợp gia đình có nhiều bé, tối đa 5 bé.', features: ['Tối đa 5 hồ sơ bé', 'Toàn bộ khung thói quen', 'Lộ trình theo độ tuổi', 'Theo dõi tiến bộ gia đình'], cta: 'Chọn Gói Pro theo tháng' },
  { tier: 'pro', cycle: 'year', label: 'Tiết kiệm nhất', summary: 'Duy trì hành trình đủ lâu để những việc nhỏ trở thành nếp sống.', features: ['Đầy đủ quyền lợi Gói Pro', 'Tối đa 5 hồ sơ bé', 'Thanh toán một lần cho 12 tháng', 'Không tự động gia hạn'], cta: 'Chọn Gói Pro theo năm', featured: true },
];

/** The four plans on sale, one entry per plan id. */
export const plans = planCopy.map(({ tier, cycle, ...copy }) => {
  const { id, amount } = pricingTiers[tier][cycle];
  return {
    id,
    amount,
    period: cycle === 'year' ? 'Năm' : 'Tháng',
    ...(cycle === 'year' ? { monthlyId: pricingTiers[tier].month.id } : {}),
    name: pricingTiers[tier].name,
    price: String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
    cadence: cycle === 'year' ? '/ năm' : '/ tháng',
    ...copy,
  };
});

export const upcomingPlanNote = 'Gói Pro Plus (gồm Gói Pro và Huấn luyện viên thói quen) đang phát triển, chưa mở bán.';

export const launchOfferNote = '10 gia đình đầu tiên thanh toán Gói Pro theo năm trước khi Pro Plus ra mắt sẽ được nâng cấp miễn phí lên Pro Plus cho phần còn lại của năm đã trả. Mỗi gia đình tối đa một suất, tính theo thứ tự thanh toán thành công.';
