import { GAME_AGE_TRACKS } from './types';
import type { BoardData, BoardKind, CheckerId, GameAgeTrack, GameTypeId, SkillGroup } from './types';

export type GameMechanic = Readonly<{
  gameTypeId: GameTypeId;
  familyId: 'g01' | 'g02' | 'g03' | 'g04' | 'g05' | 'g06' | 'g07' | 'g08';
  skillGroup: SkillGroup;
  nameVi: string;
  implemented: boolean;
  available: boolean;
  checkerId: CheckerId | null;
  boardKind: BoardKind | null;
  ageTracks: readonly GameAgeTrack[];
  variants: readonly string[];
}>;

export const IMPLEMENTED_GAME_TYPE_IDS = ['g01-t1', 'g06-t1', 'g03-t1'] as const;

export const AVAILABLE_GAME_TYPE_IDS = [
  'g01-t1', 'g01-t2', 'g01-t3',
  'g02-t1', 'g02-t2', 'g02-t3',
  'g03-t1', 'g03-t2', 'g03-t3',
  'g04-t1', 'g04-t2', 'g04-t3',
  'g05-t1', 'g05-t2', 'g05-t3',
  'g06-t1', 'g06-t2', 'g06-t3',
  'g07-t1', 'g07-t2', 'g07-t3',
  'g08-t1', 'g08-t2', 'g08-t3',
] as const;

const ALL_TRACKS: readonly GameAgeTrack[] = GAME_AGE_TRACKS;

export const GAME_MECHANICS: readonly GameMechanic[] = [
  {
    gameTypeId: 'g01-t1',
    familyId: 'g01',
    skillGroup: 'rule',
    nameVi: 'Điền phần tiếp theo',
    implemented: true,
    available: true,
    checkerId: 'rule-sequence-v1',
    boardKind: 'rule-sequence',
    ageTracks: ALL_TRACKS,
    variants: ['lặp một thuộc tính', 'tăng số phần tử', 'xen kẽ hai chuỗi', 'suy ngược phần đầu'],
  },
  {
    gameTypeId: 'g01-t2',
    familyId: 'g01',
    skillGroup: 'rule',
    nameVi: 'Tìm phần sai',
    implemented: false,
    available: true,
    checkerId: 'rule-error-v1',
    boardKind: 'rule-error',
    ageTracks: ALL_TRACKS,
    variants: ['một hình sai vị trí', 'một bước sai độ lớn', 'một nhánh phá nhịp', 'phát hiện lỗi giữa hai chuỗi'],
  },
  {
    gameTypeId: 'g01-t3',
    familyId: 'g01',
    skillGroup: 'rule',
    nameVi: 'Máy biến đổi',
    implemented: false,
    available: true,
    checkerId: 'rule-transform-v1',
    boardKind: 'rule-transform',
    ageTracks: ALL_TRACKS,
    variants: ['đổi một thuộc tính', 'thêm hoặc bớt phần tử', 'hai đầu vào một kết quả', 'suy ra đầu vào từ đầu ra'],
  },
  {
    gameTypeId: 'g02-t1',
    familyId: 'g02',
    skillGroup: 'spatial',
    nameVi: 'Ghép bóng',
    implemented: false,
    available: true,
    checkerId: 'spatial-silhouette-v1',
    boardKind: 'spatial-silhouette',
    ageTracks: ALL_TRACKS,
    variants: ['khớp đường viền', 'khớp khi bỏ chi tiết', 'phân biệt bóng gần giống', 'ghép từ hai mảnh'],
  },
  {
    gameTypeId: 'g02-t2',
    familyId: 'g02',
    skillGroup: 'spatial',
    nameVi: 'Xoay hình',
    implemented: false,
    available: true,
    checkerId: 'spatial-rotation-v1',
    boardKind: 'spatial-rotation',
    ageTracks: ALL_TRACKS,
    variants: ['xoay một phần tư vòng', 'xoay nửa vòng', 'phân biệt xoay và lật', 'suy ra hướng trước khi xoay'],
  },
  {
    gameTypeId: 'g02-t3',
    familyId: 'g02',
    skillGroup: 'spatial',
    nameVi: 'Hoàn thành đối xứng',
    implemented: false,
    available: true,
    checkerId: 'spatial-symmetry-v1',
    boardKind: 'spatial-symmetry',
    ageTracks: ALL_TRACKS,
    variants: ['gương dọc', 'gương ngang', 'bổ sung ô thiếu', 'tìm ô làm mất đối xứng'],
  },
  {
    gameTypeId: 'g03-t1',
    familyId: 'g03',
    skillGroup: 'memory',
    nameVi: 'Nhớ thứ tự',
    implemented: true,
    available: true,
    checkerId: 'memory-sequence-v1',
    boardKind: 'memory-sequence',
    ageTracks: ALL_TRACKS,
    variants: ['nhắc lại cùng chiều', 'chọn phần tử còn thiếu', 'nhắc lại theo nhóm', 'tìm cặp bị đổi thứ tự'],
  },
  {
    gameTypeId: 'g03-t2',
    familyId: 'g03',
    skillGroup: 'memory',
    nameVi: 'Nhớ vị trí',
    implemented: false,
    available: true,
    checkerId: 'memory-position-v1',
    boardKind: 'memory-position',
    ageTracks: ALL_TRACKS,
    variants: ['chọn vị trí vừa thấy', 'đặt lại hai đồ vật', 'tìm vị trí còn thiếu', 'nhớ vị trí theo một dấu mốc'],
  },
  {
    gameTypeId: 'g03-t3',
    familyId: 'g03',
    skillGroup: 'memory',
    nameVi: 'Nhận ra thay đổi',
    implemented: false,
    available: true,
    checkerId: 'memory-change-v1',
    boardKind: 'memory-change',
    ageTracks: ALL_TRACKS,
    variants: ['một vật biến mất', 'một vật được thêm', 'hai vật đổi chỗ', 'một thuộc tính thay đổi'],
  },
  {
    gameTypeId: 'g04-t1',
    familyId: 'g04',
    skillGroup: 'reasoning',
    nameVi: 'Loại trừ theo manh mối',
    implemented: false,
    available: true,
    checkerId: 'reasoning-elimination-v1',
    boardKind: 'reasoning-elimination',
    ageTracks: ALL_TRACKS,
    variants: ['một manh mối trực tiếp', 'hai điều kiện đồng thời', 'manh mối phủ định', 'ghép manh mối theo thứ tự'],
  },
  {
    gameTypeId: 'g04-t2',
    familyId: 'g04',
    skillGroup: 'reasoning',
    nameVi: 'Nếu thì',
    implemented: false,
    available: true,
    checkerId: 'reasoning-if-then-v1',
    boardKind: 'reasoning-if-then',
    ageTracks: ALL_TRACKS,
    variants: ['áp dụng một quy tắc', 'chọn ngoại lệ được nêu', 'phối hợp hai điều kiện', 'suy ra kết quả qua hai bước'],
  },
  {
    gameTypeId: 'g04-t3',
    familyId: 'g04',
    skillGroup: 'reasoning',
    nameVi: 'Thông tin còn thiếu',
    implemented: false,
    available: true,
    checkerId: 'reasoning-missing-info-v1',
    boardKind: 'reasoning-missing-info',
    ageTracks: ALL_TRACKS,
    variants: ['chọn câu hỏi phân biệt', 'chọn dữ kiện đủ dùng', 'loại dữ kiện không liên quan', 'nhận ra chưa đủ bằng chứng'],
  },
  {
    gameTypeId: 'g05-t1',
    familyId: 'g05',
    skillGroup: 'quantity',
    nameVi: 'Cân bằng hai bên',
    implemented: false,
    available: true,
    checkerId: 'quantity-balance-v1',
    boardKind: 'quantity-balance',
    ageTracks: ALL_TRACKS,
    variants: ['bổ sung số lượng thiếu', 'thay một vật cho cân', 'so sánh tổng hai nhóm', 'suy ra giá trị vật chưa biết'],
  },
  {
    gameTypeId: 'g05-t2',
    familyId: 'g05',
    skillGroup: 'quantity',
    nameVi: 'Chia nhóm',
    implemented: false,
    available: true,
    checkerId: 'quantity-grouping-v1',
    boardKind: 'quantity-grouping',
    ageTracks: ALL_TRACKS,
    variants: ['chia đều không dư', 'chia theo hai kích cỡ', 'chia có phần dư được nêu', 'chọn cách chia thỏa ràng buộc'],
  },
  {
    gameTypeId: 'g05-t3',
    familyId: 'g05',
    skillGroup: 'quantity',
    nameVi: 'Đủ mục tiêu',
    implemented: false,
    available: true,
    checkerId: 'quantity-target-v1',
    boardKind: 'quantity-target',
    ageTracks: ALL_TRACKS,
    variants: ['chọn hai phần vừa đủ', 'chọn số phần ít nhất', 'loại phần làm vượt mục tiêu', 'tìm hai tổ hợp cùng tổng'],
  },
  {
    gameTypeId: 'g06-t1',
    familyId: 'g06',
    skillGroup: 'planning',
    nameVi: 'Tìm đường',
    implemented: true,
    available: true,
    checkerId: 'path-planning-v1',
    boardKind: 'path-planning',
    ageTracks: ALL_TRACKS,
    variants: ['đến đích tránh chướng ngại', 'đi qua một điểm bắt buộc', 'lấy chìa trước khi tới cửa', 'chọn đường ít bước trong bàn nhỏ'],
  },
  {
    gameTypeId: 'g06-t2',
    familyId: 'g06',
    skillGroup: 'planning',
    nameVi: 'Xếp lệnh',
    implemented: false,
    available: true,
    checkerId: 'planning-command-order-v1',
    boardKind: 'planning-command-order',
    ageTracks: ALL_TRACKS,
    variants: ['xếp ba bước đúng thứ tự', 'chèn một lệnh thiếu', 'đổi thứ tự để tới đích', 'rút ngắn một đoạn lệnh lặp'],
  },
  {
    gameTypeId: 'g06-t3',
    familyId: 'g06',
    skillGroup: 'planning',
    nameVi: 'Sửa bước sai',
    implemented: false,
    available: true,
    checkerId: 'planning-fix-step-v1',
    boardKind: 'planning-fix-step',
    ageTracks: ALL_TRACKS,
    variants: ['sửa hướng rẽ đầu tiên', 'thay một lệnh sai', 'tìm bước thừa', 'chọn chỗ đặt bước còn thiếu'],
  },
  {
    gameTypeId: 'g07-t1',
    familyId: 'g07',
    skillGroup: 'flexibility',
    nameVi: 'Đổi luật phân loại',
    implemented: false,
    available: true,
    checkerId: 'flexibility-classify-v1',
    boardKind: 'flexibility-classify',
    ageTracks: ALL_TRACKS,
    variants: ['đổi từ hình sang màu có nhãn', 'đổi từ kích cỡ sang số lượng', 'đổi từ chất liệu sang công dụng', 'đổi theo ký hiệu hướng dẫn'],
  },
  {
    gameTypeId: 'g07-t2',
    familyId: 'g07',
    skillGroup: 'flexibility',
    nameVi: 'Đổi góc nhìn',
    implemented: false,
    available: true,
    checkerId: 'flexibility-perspective-v1',
    boardKind: 'flexibility-perspective',
    ageTracks: ALL_TRACKS,
    variants: ['xem cùng vật từ phía khác', 'chọn lời tả từ vị trí mới', 'đọc sơ đồ từ điểm bắt đầu khác', 'đổi tiêu chí để so sánh'],
  },
  {
    gameTypeId: 'g07-t3',
    familyId: 'g07',
    skillGroup: 'flexibility',
    nameVi: 'Cách giải khác',
    implemented: false,
    available: true,
    checkerId: 'flexibility-alternative-v1',
    boardKind: 'flexibility-alternative',
    ageTracks: ALL_TRACKS,
    variants: ['tìm đường thứ hai', 'tìm cách ghép khác', 'chia cùng tổng theo cách khác', 'chọn phương án thay thế hợp lệ'],
  },
  {
    gameTypeId: 'g08-t1',
    familyId: 'g08',
    skillGroup: 'observation',
    nameVi: 'Điểm khác biệt',
    implemented: false,
    available: true,
    checkerId: 'observation-difference-v1',
    boardKind: 'observation-difference',
    ageTracks: ALL_TRACKS,
    variants: ['một chi tiết hình dạng', 'chi tiết vị trí', 'chi tiết số lượng', 'hai thay đổi trong hình nhỏ'],
  },
  {
    gameTypeId: 'g08-t2',
    familyId: 'g08',
    skillGroup: 'observation',
    nameVi: 'Hai đặc điểm',
    implemented: false,
    available: true,
    checkerId: 'observation-two-traits-v1',
    boardKind: 'observation-two-traits',
    ageTracks: ALL_TRACKS,
    variants: ['hình dạng và kích cỡ', 'vị trí và số lượng', 'hướng và đường viền', 'chọn mọi vật thỏa hai dấu hiệu'],
  },
  {
    gameTypeId: 'g08-t3',
    familyId: 'g08',
    skillGroup: 'observation',
    nameVi: 'Chi tiết bất hợp lý',
    implemented: false,
    available: true,
    checkerId: 'observation-implausible-v1',
    boardKind: 'observation-implausible',
    ageTracks: ALL_TRACKS,
    variants: ['vật sai nhóm đã định nghĩa', 'bước không phù hợp mục tiêu', 'quan hệ vật lý đơn giản bị sai', 'chi tiết trái với quy tắc đã nêu'],
  },
];

const MECHANIC_BY_ID = new Map<string, GameMechanic>(
  GAME_MECHANICS.map((mechanic) => [mechanic.gameTypeId, mechanic]),
);

export const RULE_VARIANTS: readonly { gameTypeId: GameTypeId; ruleVariantId: string; nameVi: string }[] =
  GAME_MECHANICS.flatMap((mechanic) =>
    mechanic.variants.map((variant) => ({
      gameTypeId: mechanic.gameTypeId,
      ruleVariantId: `${mechanic.gameTypeId}:${variant}`,
      nameVi: variant,
    })),
  );

const RULE_VARIANT_SET = new Set(RULE_VARIANTS.map((variant) => variant.ruleVariantId));

export function getGameMechanic(gameTypeId: string): GameMechanic | null {
  return MECHANIC_BY_ID.get(gameTypeId) ?? null;
}

export function listGameMechanics(): readonly GameMechanic[] {
  return GAME_MECHANICS;
}

export function isRuleVariantForGame(gameTypeId: string, ruleVariantId: string): boolean {
  return RULE_VARIANT_SET.has(ruleVariantId) && ruleVariantId.startsWith(`${gameTypeId}:`);
}

export function boardMatchesRuleVariant(
  gameTypeId: string,
  ruleVariantId: string,
  board: BoardData,
): boolean {
  if (!isRuleVariantForGame(gameTypeId, ruleVariantId)) return false;
  const variant = ruleVariantId.slice(gameTypeId.length + 1);
  if (gameTypeId === 'g01-t1' && board.kind === 'rule-sequence') {
    if (variant.includes('lặp')) return board.ruleKind === 'alternating' || board.ruleKind === 'repeat';
    if (variant.includes('tăng')) return board.ruleKind === 'increment';
    if (variant.includes('xen')) return board.ruleKind === 'alternating';
    if (variant.includes('suy ngược')) return board.ruleKind === 'repeat';
    return true;
  }
  if (gameTypeId === 'g03-t1' && board.kind === 'memory-sequence') {
    if (variant.includes('cùng chiều')) return board.mode === undefined || board.mode === 'recall';
    if (variant.includes('còn thiếu')) return board.mode === 'missing';
    if (variant.includes('theo nhóm')) return board.mode === undefined || board.mode === 'grouped';
    if (variant.includes('cặp bị đổi')) return board.mode === 'swapped';
    return true;
  }
  if (gameTypeId === 'g06-t1' && board.kind === 'path-planning') {
    if (variant.includes('đến đích')) {
      return board.waypoints.length === 0 && board.waypointOrder !== 'ordered' && board.shortestPathOnly !== true;
    }
    if (variant.includes('đi qua')) {
      return board.waypoints.length >= 1 && board.waypointOrder !== 'ordered' && board.shortestPathOnly !== true;
    }
    if (variant.includes('lấy chìa')) {
      return board.waypoints.length >= 2 && board.waypointOrder === 'ordered';
    }
    if (variant.includes('ít bước')) {
      return board.shortestPathOnly === true && board.waypointOrder !== 'ordered';
    }
    return true;
  }
  return true;
}

export function requireImplemented(
  gameTypeId: string,
): { ok: true; mechanic: GameMechanic } | { ok: false; code: 'format_unavailable' } {
  const mechanic = getGameMechanic(gameTypeId);
  if (!mechanic || !mechanic.implemented) return { ok: false, code: 'format_unavailable' };
  return { ok: true, mechanic };
}


export function requireAvailable(
  gameTypeId: string,
): { ok: true; mechanic: GameMechanic } | { ok: false; code: 'format_unavailable' } {
  const mechanic = getGameMechanic(gameTypeId);
  if (!mechanic || !mechanic.available) return { ok: false, code: 'format_unavailable' };
  return { ok: true, mechanic };
}
