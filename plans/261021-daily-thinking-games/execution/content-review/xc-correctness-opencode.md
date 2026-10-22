# XC — Rà soát tính đúng đắn và mơ hồ của puzzle

- Task: `task_009ef2101a12`
- Dispatch: `ctx_c6a3959ee1b4`
- Reviewer: `opencode`
- Phạm vi: `content/thinking-games/candidates/365-v2/batch-01..05`, lọc đúng 1.460 item `age_6_8` + `age_9_12` (730 item mỗi track; 730 main + 730 bonus; đủ 24 game type; toàn bộ `design_only`).
- Phương thức: **script toàn bộ 1.460 item** qua engine thật (`validatePuzzle`, `checkAnswer`, `solvePuzzle`, cùng checker/renderer hiện hành), sau đó **đọc tay 144 item** (6 item mỗi game type: 3 item mỗi track, phủ cả 4 biến thể; có đối chiếu tutorial, explanation, board và renderer).
- Chỉ đọc; không sửa nội dung puzzle, không đổi trạng thái/duyệt/chữ ký.

## Kết quả engine

| Kiểm tra | Kết quả |
|---|---:|
| `validatePuzzle` lỗi | 0 / 1.460 |
| Solution bị checker từ chối | 0 / 1.460 |
| `solvePuzzle` lỗi | 0 / 1.460 |
| Solver lệch solution | 0 / 1.460 |
| Đáp án sai được chấp nhận | 0 / 1.460 |
| Tập con đúng tổng bị checker từ chối (g05-t3) | 16 item |

Điểm quan trọng: **không có đáp án nào sai mà vẫn được chấm đúng**, và **mọi solution đều tự qua checker**. Các lỗi còn lại nằm ở chỗ giao diện/tutorial/explanation không khớp với checker, hoặc checker áp một luật mà người chơi không được cho biết. Vì vậy, con số 310 flag không mâu thuẫn với 0 `wrongAccepted`.

## Tổng hợp flag

Tổng cộng **310 item** bị flag (21,2% phạm vi), trong đó:

| Mức | Số item | Nhóm lỗi |
|---|---:|---|
| Critical | 30 | g03-t1: UI bắt xếp lại cả chuỗi nhưng checker chỉ nhận 1 token (missing) hoặc 2 token (swapped) → **không thể thắng** |
| High | 74 | g03-t2 missing (28), g05-t1 replace (16), g06-t1 shortest (14), g05-t3 exact-sum bị từ chối (16) |
| Medium | 114 | g01-t2 giải thích lệch 1 đơn vị (60), g05-t2 giải thích sai phép tính (46), g01-t1 giải thích sai quy luật (8) |
| Low | 92 | g02-t3 giải thích chỉ ô gương (16), g03-t3 nhãn `a\|b` thô (16), g08-t3 text placeholder (60) |

### Theo game type

| Game type | Tổng | Flag | Critical | High | Medium | Low |
|---|---:|---:|---:|---:|---:|---:|
| g01-t1 | 62 | 8 | 0 | 0 | 8 | 0 |
| g01-t2 | 60 | 60 | 0 | 0 | 60 | 0 |
| g02-t3 | 60 | 16 | 0 | 0 | 0 | 16 |
| g03-t1 | 62 | 30 | 30 | 0 | 0 | 0 |
| g03-t2 | 60 | 28 | 0 | 28 | 0 | 0 |
| g03-t3 | 60 | 16 | 0 | 0 | 0 | 16 |
| g05-t1 | 62 | 16 | 0 | 16 | 0 | 0 |
| g05-t2 | 62 | 46 | 0 | 0 | 46 | 0 |
| g05-t3 | 60 | 16 | 0 | 16 | 0 | 0 |
| g06-t1 | 62 | 14 | 0 | 14 | 0 | 0 |
| g08-t3 | 60 | 60 | 0 | 0 | 0 | 60 |

Các game type còn lại (g01-t3, g02-t1, g02-t2, g04-t1, g04-t2, g04-t3, g06-t2, g06-t3, g07-t1, g07-t2, g07-t3, g08-t1, g08-t2) không có flag trong mẫu script + đọc tay.

## Critical — 30 item không thể thắng

### g03-t1 `missing` — 16 item

- Tutorial: “Nhìn dãy thật kỹ; khi dãy ẩn đi, bạn xếp lại đúng thứ tự.”
- Checker chỉ nhận **1 token còn thiếu** (`answer.length === 1`).
- Renderer `MemorySequenceGame` luôn tạo `board.sequence.length` ô và chặn submit cho tới khi chọn đủ số ô đó (`handleSubmit` yêu cầu `userSequence.length === board.sequence.length`).
- Ví dụ `D219-main-vi68`: chuỗi 5 token, solution `["cây"]`; UI bắt xếp 5 ô. Mọi lần submit đều sai.

### g03-t1 `swapped` — 14 item

- Cùng renderer, nhưng checker chỉ nhận **2 token của cặp bị đổi**.
- Ví dụ `D184-bonus-vi912`: chuỗi 5 token, solution `["mưa","mèo"]`; UI bắt xếp 5 ô.
- Đây là lỗi chặn hoàn toàn, không phải “khó”: trẻ không có cách nào gửi đáp án đúng.

## High — 74 item có luật ngầm hoặc UI không khớp

### g03-t2 `missing` — 28 item

- Tutorial: “Bạn xem các vị trí, sau đó chọn lại đúng những vị trí đã thấy.”
- Bộ đếm UI: `Đã chọn: x / board.targets.length vị trí`.
- Checker chỉ nhận `targets` **trừ** các vị trí đã `revealed`; các ô revealed bị disable.
- Ví dụ `D248-bonus-vi68`: 3 targets, 2 revealed, solution chỉ 1 vị trí `(2,1)`. Trẻ đọc “chọn lại đúng những vị trí đã thấy” sẽ cố chọn 3, nhưng 2 ô đã bị khóa.

### g05-t1 `replace` — 16 item

- Tutorial/UI: “Tìm quả cân phù hợp để hai đĩa cân thăng bằng”; không có ô “thay thế” hay vật bị thay được đánh dấu.
- Checker trả về **trọng lượng thay cho `replaceId`**, không phải phần thiếu để cân bằng.
- Ví dụ `D218-bonus-vi68`: trái `2+3`, phải `7`, `replaceId=left-1`, đáp án `4`. Nếu hiểu là “thêm phần còn thiếu” thì phải là `2`; explanation lại viết “tìm phần còn thiếu … Đáp án là 4”.

### g06-t1 `shortestPathOnly` — 14 item

- Tutorial: “Đi từ ô bắt đầu đến ô đích, tránh tường và ghé điểm cần qua.”
- Checker chỉ nhận đường **ngắn nhất**; đường hợp lệ dài hơn bị từ chối.
- UI chỉ hiện “Tìm đường từ điểm xuất phát 🏠 đến đích 🎯” và số waypoint, không hề nói “ít bước nhất”.
- Ví dụ `D182-main-vi912`: solution dài 13 điểm / 12 bước; mọi đường vòng hợp lệ khác đều bị chấm sai.

### g05-t3 — 16 item có tập con đúng tổng bị từ chối

- Tutorial chỉ nói: “Bạn chọn các món để đạt đúng mục tiêu mà không vượt quá.”
- Checker áp thêm `fewest`, `exact-two` hoặc `maxItems` nhưng tutorial/UI không nêu.
- 16 item có tập con **đúng bằng target** nhưng bị từ chối:
  - `fewest` (6): `D010-bonus-vi912`, `D021-main-vi912`, `D117-main-vi68`, `D213-main-vi912`, `D298-bonus-vi912`, `D309-main-vi68`.
  - `exact-two` (9): `D034-bonus-vi912`, `D045-main-vi912`, `D130-bonus-vi912`, `D141-main-vi68`, `D141-main-vi912`, `D237-main-vi68`, `D237-main-vi912`, `D322-bonus-vi68`, `D333-main-vi68`.
  - `any` (1): `D274-bonus-vi912` (tập 4 món đúng tổng nhưng vượt `maxItems=3`).
- Ví dụ `D010-bonus-vi912`: target 9, solution `["item-3"]` (9); `["item-1","item-2"]` = 6+3 = 9 cũng đúng target nhưng bị từ chối vì không phải “ít nhất”.
- Ví dụ `D130-bonus-vi912`: target 8, solution `["item-1","item-2"]` (7+1); `["item-4"]` = 8 đúng target nhưng bị từ chối vì không đúng 2 món.

## Medium — 114 lỗi giải thích

### g01-t2 — 60 item

- Explanation in chỉ số **0-based** của checker, trong khi renderer ghi vị trí `#1..#n`.
- Ví dụ `D198-bonus-vi68`: chuỗi `lá, mây, lá, mây, hoa`; solution `4` (ô `hoa`, vị trí #5). Explanation: “Đáp án là 4.” → trẻ đọc là vị trí #4 (`mây`, đúng nhịp), tức chỉ nhầm sang ô bên cạnh.
- Đây là lỗi feedback, không phải lỗi answer key; nhưng làm hỏng mục tiêu dạy “tìm phần sai”.

### g05-t2 — 46 item (`exact` 16, `floor` 16, `needed` 14)

- Explanation luôn viết: “Mình chia thành từng nhóm đủ và đếm phần còn lại.”
- Nhưng:
  - `exact` hỏi số nhóm;
  - `floor` hỏi số nhóm tối đa;
  - `needed` hỏi cần thêm bao nhiêu.
- Ví dụ `D005-main-vi68`: 8 đồ vật, nhóm 2, đáp án 4 nhóm; explanation nói “đếm phần còn lại” (remainder = 0).
- `D077-main-vi68`: 11 đồ vật, nhóm 2, đáp án 1 (cần thêm 1); explanation vẫn nói “đếm phần còn lại” (remainder = 1 — trùng số nhưng sai phép tính).

### g01-t1 `xen kẽ` — 8 item

- Explanation: “Hai chuỗi số xen kẽ, mỗi chuỗi tăng thêm N.”
- Thực tế hai chuỗi có bước khác nhau.
- Ví dụ `D241-main-vi912`: `3, 3, 6, 4, 9, 5`; chuỗi chẵn +3, chuỗi lẻ +1; explanation nói cả hai +3. Đáp án 12 vẫn đúng, nhưng quy luật được giải thích sai.

## Low — 92 lỗi nhãn/placeholder

### g02-t3 `find-break` — 16 item

- Explanation in ô **đối xứng gương** của solution, không phải solution lưu trong item.
- Ví dụ `D226-main-vi68`: solution `{"x":0,"y":2}`, explanation “Đáp án là `{"x":3,"y":2}`”.
- Cả hai ô đều được checker chấp nhận (cùng cặp phá đối xứng), nên không ảnh hưởng thắng/thua; nhưng feedback lệch answer key.

### g03-t3 `swapped` — 16 item

- Đáp án và option hiển thị chuỗi thô `hoa|quả`, `mèo|quả`… thay vì nhãn cặp dễ đọc.
- Ví dụ `D059-main-vi68`: option `["hoa|quả","hoa|mèo","mèo|quả","cá|hoa"]`.

### g08-t3 — 60 item

- Text cảnh là placeholder sinh tự động: “Bạn 1 đang chơi việc 1 theo cách 1.”, “Bạn 2 đang chơi việc 2 theo cách 2.”…
- Dữ liệu để giải chỉ nằm ở các chip `nhóm: …`, `bước: …`.
- Puzzle vẫn giải được vì chip hiện rõ, nhưng với track 6–8 đây là text vô nghĩa, làm giảm khả năng hiểu và chất lượng cảm nhận.

## Đánh giá theo track

- **age_6_8:** các lỗi nặng nhất là g03-t1 (15 item không thể thắng) và g03-t2 (14 item prompt đòi chọn tất cả trong khi chỉ cần chọn phần thiếu). g05-t3 (6 item) và g05-t1 replace (8 item) đòi luật mà trẻ không được cho biết. g08-t3 placeholder (30 item) ảnh hưởng trực tiếp đến khả năng đọc hiểu.
- **age_9_12:** g06-t1 shortest (7 item) là lỗi luật ngầm rõ nhất; g05-t3 có 10 item tập con đúng tổng bị từ chối; g01-t2 off-by-one (30 item) và g01-t1 giải thích sai bước (8 item, chỉ có ở track này) làm sai phần giải thích dù đáp án đúng; g05-t2 explanation sai phép tính (23 item) ảnh hưởng việc học khái niệm chia nhóm.

## Kết luận

**Không đạt để phát hành nguyên trạng.** Answer key và solver nhìn chung đúng (0 đáp án sai được chấp nhận, 0 solution bị từ chối), nhưng có **30 item không thể thắng** do renderer g03-t1, và **74 item high** do checker áp luật không được nêu hoặc UI không khớp. Cần sửa tối thiểu:

1. g03-t1: cho renderer tôn trọng `mode` (`missing` → 1 ô; `swapped` → 2 ô), hoặc đổi checker theo đúng UI.
2. g03-t2 missing: đổi prompt/bộ đếm thành “chọn vị trí còn thiếu”, hoặc cho phép chọn cả vị trí đã reveal.
3. g05-t1 replace: hiện vật bị thay và ô thay thế, hoặc đổi tutorial/explanation sang “thay vật”.
4. g06-t1 shortest: nêu rõ “ít bước nhất” trong tutorial/UI.
5. g05-t3: nêu rõ “ít nhất / đúng hai món / tối đa N món” trong tutorial, hoặc nới checker cho mọi tập đúng tổng.
6. Sửa explanation g01-t2 (1-based), g05-t2 (theo mode), g01-t1 (hai bước khác nhau); làm sạch nhãn g03-t3 và text g08-t3.

Sau khi sửa critical + high, nên chạy lại đúng bộ script này để xác nhận 0 item bị từ chối oan và 0 item không thể submit đáp án đúng.
