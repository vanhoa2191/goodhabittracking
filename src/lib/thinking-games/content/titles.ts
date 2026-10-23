import { hashSeed } from '../seeded';
import type { GameAgeTrack, GameTypeId } from '../types';

type TitleName = Readonly<{ text: string; question?: boolean }>;

const q = (text: string): TitleName => ({ text, question: true });
const s = (text: string): TitleName => ({ text });

// Several natural names per game type; the editorial chapter (e.g. "Vườn hoa") is added by a frame.
export const TITLE_NAMES: Readonly<Record<GameTypeId, readonly TitleName[]>> = {
  'g01-t1': [s('Điền phần tiếp theo'), q('Tiếp theo là gì?'), s('Nối tiếp dãy'), s('Bí mật của dãy'), s('Đoán phần kế tiếp'), q('Dãy này đi đâu?'), s('Nhịp điệu của dãy'), q('Ai đứng tiếp theo?')],
  'g01-t2': [s('Tìm phần sai'), q('Ai đứng nhầm chỗ?'), q('Chỗ nào lạc nhịp?'), s('Bắt lỗi trong dãy'), s('Thám tử tìm lỗi'), s('Một chỗ không khớp'), s('Phát hiện chỗ lệch'), q('Cái nào đi sai nhịp?')],
  'g01-t3': [s('Máy biến đổi'), s('Chiếc máy kỳ diệu'), q('Máy làm gì với số?'), s('Số vào, số ra'), s('Giải mã cỗ máy'), s('Cỗ máy thần kỳ'), s('Bí mật của chiếc máy'), q('Điều gì xảy ra trong máy?')],
  'g02-t1': [s('Ghép bóng'), q('Chiếc bóng nào đây?'), q('Bóng của hình nào?'), s('Tìm đúng chiếc bóng'), s('Khớp hình với bóng'), s('Chiếc bóng bí ẩn'), s('Ghép hình và bóng'), q('Bóng nào khớp?')],
  'g02-t2': [s('Hình đổi dáng'), q('Hình sẽ đổi thế nào?'), s('Biến đổi hình bí ẩn'), q('Hình mới trông ra sao?'), s('Theo dấu hình mẫu'), s('Tưởng tượng hình mới'), s('Khám phá cách đổi hình'), s('Hình qua phép biến đổi')],
  'g02-t3': [s('Khám phá đối xứng'), q('Bên kia gương có gì?'), s('Đối xứng hai bên'), s('Chiếc gương thần'), q('Hai bên tranh thế nào?'), s('Tìm cặp đối xứng'), s('Soi gương cùng mình'), s('Khám phá hai bên tranh')],
  'g03-t1': [s('Nhớ thứ tự'), q('Ai đứng trước, ai đứng sau?'), s('Dãy ghi nhớ'), s('Nhớ và xếp lại'), s('Trí nhớ xếp hàng'), s('Đố bạn nhớ dãy'), s('Nhớ đúng thứ tự nào'), s('Hàng ghi nhớ')],
  'g03-t2': [s('Nhớ vị trí'), q('Ô nào đã sáng?'), s('Trốn tìm trong bảng'), s('Bảng ghi nhớ'), s('Nhớ chỗ các ô sáng'), q('Ô sáng ở đâu?'), s('Đèn nhỏ trên bảng'), s('Nhớ từng ô')],
  'g03-t3': [s('Nhận ra thay đổi'), q('Có gì khác rồi?'), q('Cảnh nào đã đổi?'), s('Trước và sau'), q('Điều gì vừa đổi?'), s('Mắt tinh phát hiện'), s('Hai cảnh, một thay đổi'), q('Ai vừa thay đổi?')],
  'g04-t1': [s('Loại trừ theo manh mối'), q('Bạn nhỏ bí ẩn là ai?'), s('Thám tử nhỏ'), s('Theo dấu manh mối'), s('Tìm bạn nhỏ bí ẩn'), s('Manh mối chỉ đường'), s('Loại từng bạn một'), s('Chỉ còn một bạn')],
  'g04-t2': [s('Nếu thì'), q('Nếu vậy thì sao?'), s('Chuỗi suy luận'), s('Từ điều biết đến điều mới'), s('Nối các luật'), s('Suy luận từng bước'), q('Điều gì xảy ra tiếp?'), s('Luật nếu thì')],
  'g04-t3': [s('Thông tin còn thiếu'), q('Cần thêm manh mối nào?'), s('Mảnh ghép còn thiếu'), s('Manh mối quyết định'), s('Thiếu một gợi ý'), q('Hỏi thêm điều gì?'), s('Tìm gợi ý cuối cùng'), s('Để biết chắc')],
  'g05-t1': [s('Cân bằng hai bên'), s('Chiếc cân thăng bằng'), q('Cân thế nào cho bằng?'), s('Hai đĩa cân'), s('Giữ cân thăng bằng'), s('Quả cân còn thiếu'), s('Cân cho đều'), s('Hai đĩa ngang nhau')],
  'g05-t2': [s('Chia nhóm'), s('Chia đều nhé'), s('Cùng chia thành nhóm'), s('Chia quà cho đều'), s('Gom thành từng nhóm'), q('Nhóm nào đủ?'), s('Chia và đếm'), s('Mỗi nhóm một ít')],
  'g05-t3': [s('Đủ mục tiêu'), s('Gom cho vừa đủ'), s('Chọn món vào giỏ'), s('Chiếc giỏ mục tiêu'), q('Làm sao cho đủ?'), s('Cộng cho vừa'), s('Vừa đúng mục tiêu'), s('Giỏ đồ khéo léo')],
  'g06-t1': [s('Tìm đường'), q('Đường nào về đích?'), s('Dẫn bạn nhỏ về đích'), s('Mê cung nhỏ'), s('Vẽ đường đi'), s('Lối đi an toàn'), s('Hành trình về đích'), q('Đi sao cho khéo?')],
  'g06-t2': [s('Xếp lệnh'), q('Việc nào làm trước?'), s('Xếp việc đúng thứ tự'), q('Trước tiên làm gì?'), s('Sắp xếp các bước'), s('Từng bước một'), s('Thứ tự công việc'), q('Bước nào trước, bước nào sau?')],
  'g06-t3': [s('Sửa bước sai'), s('Robot đi lạc rồi'), q('Lệnh nào bị nhầm?'), s('Sửa lệnh cho robot'), s('Bắt lỗi cho robot'), s('Đưa robot về đích'), s('Một bước chưa đúng'), s('Chỉnh lại một lệnh')],
  'g07-t1': [s('Đổi luật phân loại'), s('Luật mới, cách chọn mới'), s('Chọn theo luật mới'), s('Phân loại lại nào'), s('Luật đã đổi rồi'), q('Ai hợp luật mới?'), s('Nhóm theo luật mới'), s('Gom lại theo luật')],
  'g07-t2': [s('Đổi góc nhìn'), s('Nhìn từ chỗ bạn nhỏ'), q('Đồ vật ở phía nào?'), s('Đứng ở chỗ bạn ấy'), s('Trước, sau, trái, phải'), q('Bạn nhỏ nhìn thấy gì?'), s('Xoay người theo bạn nhỏ'), s('Hướng nhìn của bạn nhỏ')],
  'g07-t3': [s('Cách giải khác'), q('Còn đường nào khác?'), s('Đi lối khác thử xem'), s('Một con đường mới'), s('Đổi đường đi'), s('Tìm lối rẽ khác'), s('Một chỗ rẽ mới'), q('Có cách khác không?')],
  'g08-t1': [s('Điểm khác biệt'), q('Hai hình khác nhau ở đâu?'), s('Tìm chỗ khác nhau'), s('Mắt tinh tìm điểm lạ'), s('So hai bức tranh'), q('Chỗ nào không giống?'), s('Săn điểm khác biệt'), s('Hai tranh, vài điểm khác')],
  'g08-t2': [s('Hai đặc điểm'), q('Hình nào có cả hai?'), s('Chọn theo hai điều kiện'), s('Vừa thế này, vừa thế kia'), s('Lọc theo hai gợi ý'), s('Đủ cả hai đặc điểm'), s('Hai manh mối cùng lúc'), q('Ai hợp cả hai?')],
  'g08-t3': [s('Chi tiết bất hợp lý'), q('Điều gì lạ ở đây?'), q('Có gì không ổn?'), s('Tìm chi tiết lạ'), q('Việc nào không hợp?'), s('Điều không hợp lý'), s('Bắt lỗi trong tình huống'), q('Chuyện gì sai sai?')],
};

const STATEMENT_FRAMES: readonly ((theme: string, name: string) => string)[] = [
  (theme, name) => `${theme} · ${name}`,
  (theme, name) => `${name} · ${theme}`,
  (theme, name) => `${theme}: ${name}`,
  (theme, name) => `${name} — ${theme}`,
];
// A question reads best after the chapter name.
const QUESTION_FRAMES = [STATEMENT_FRAMES[0]!, STATEMENT_FRAMES[2]!];

export function themeOfTitle(title: string): string {
  const separator = title.indexOf(' · ');
  return (separator > 0 ? title.slice(0, separator) : title).trim();
}

/**
 * Varied child-facing title for one slot. The name and the frame are picked from the slot seed
 * so every age track of the same slot can read differently; `avoid` lists titles that may not be
 * reused (the previous day's titles) and makes the pick step to the next free combination.
 */
export function getVariedTitle(input: {
  gameTypeId: GameTypeId;
  theme: string;
  ageTrack: GameAgeTrack;
  slotId: string;
  avoid?: ReadonlySet<string>;
}): string {
  const names = TITLE_NAMES[input.gameTypeId];
  const base = hashSeed(`${input.slotId}|${input.ageTrack}|${input.gameTypeId}|title`);
  const frameBase = hashSeed(`${input.slotId}|${input.ageTrack}|${input.gameTypeId}|frame`);
  let first: string | null = null;
  for (let step = 0; step < names.length * STATEMENT_FRAMES.length; step += 1) {
    const name = names[(base + step) % names.length]!;
    const frames = name.question ? QUESTION_FRAMES : STATEMENT_FRAMES;
    const title = frames[(frameBase + Math.floor(step / names.length)) % frames.length]!(input.theme, name.text);
    first ??= title;
    if (!input.avoid?.has(title)) return title;
  }
  return first as string;
}
