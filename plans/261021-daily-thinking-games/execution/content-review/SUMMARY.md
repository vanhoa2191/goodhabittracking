# Tổng hợp review nội dung — Daily Thinking Games (365 ngày, V2 candidates)

- **Run**: `run_d2b1a0cf783f` (điều phối) · inbox reader `run_6149b435d3ef`
- **Ngày tổng hợp**: 2026-10-22 (UTC)
- **Nguồn dữ liệu**: `content/thinking-games/candidates/365-v2/batch-01..05.json`
- **Phạm vi**: 1.460 mục thuộc `age_6_8` và `age_9_12` (730 main + 730 bonus, 365 ngày, 24 gameType). Hai track `age_3_5` và `age_13_plus` không nằm trong phạm vi review.
- **8 lane review**: 5 lane theo batch (`cline-review-b1..b5`) + 3 lane xuyên suốt (`opencode-xc-correctness`, `agy-xc-copy`, `kilo-xc-safety`).

## 1. Kết luận nhanh

**Nội dung chưa đủ điều kiện phát hành cho trẻ.** Trong 1.460 mục thuộc phạm vi, **1.401 mục (96,0%) bị gắn ít nhất một cờ**, trong đó **452 mục bị xếp mức `block`**. Các lỗi nặng nhất mang tính hệ thống, sinh ra từ template/generator chứ không phải lỗi lẻ: lộ ID kỹ thuật và JSON thô trong câu chữ cho trẻ, từ tiếng Anh trong đáp án, câu placeholder lọt ra UI, và 5 nhóm lệch giữa luật chơi hiển thị với điều checker thực sự chấp nhận (khiến trẻ trả lời đúng vẫn bị chấm sai).

Điểm tích cực: **không có cờ nào bịa bằng chứng**. Toàn bộ 6.019 cờ đều trỏ tới ID tồn tại trong corpus (0 ID lạ), và mọi đoạn trích dẫn văn bản đều xuất hiện trong đúng mục bị gắn cờ sau khi chuẩn hoá dấu câu/dấu tiếng Việt.

## 2. Phương pháp kiểm chứng

Mỗi file review JSON được kiểm bằng script (`/tmp/goodhabit-reader/verify_reviews.py`):

1. JSON phải parse được.
2. Mọi `id` phải tồn tại trong 5 file `batch-01..05.json` của `365-v2`.
3. Đoạn trích trong `evidence` phải xuất hiện trong **chính mục đó** (so khớp sau khi chuẩn hoá Unicode NFC, dấu nháy, gạch ngang, mũi tên `→`, dấu ba chấm, và bỏ qua khác biệt dấu câu). Với bằng chứng dạng `key=value` (`gameTypeId=...`, `solution=...`) thì đối chiếu trực tiếp với trường tương ứng của mục.

Kết quả: **0 cờ có trích dẫn mâu thuẫn với văn bản mục** (không có trích dẫn bịa), **0 ID không tồn tại**. Các trường hợp không kiểm chứng được bằng văn bản được liệt kê riêng ở §6.

## 3. Số lượng tổng hợp

| Chỉ số | Giá trị |
|---|---|
| Mục trong phạm vi | 1.460 |
| Mục bị gắn cờ | **1.401 (96,0%)** |
| Tổng cờ (đã tách theo từng mục) | 6.019 |
| Cờ `block` | **493** |
| Cờ `fix` | 4.241 |
| Cờ `nit` | 1.285 |
| Mục có mức cao nhất = `block` | **452** |
| Mục có mức cao nhất = `fix` | 908 |
| Mục có mức cao nhất = `nit` | 41 |

> Ghi chú: 1.799 "cờ" đến từ 14 cờ tổng hợp của `kilo-xc-safety` (mỗi cờ gắn cho danh sách `itemIds`), nên tổng 6.019 là số **cờ-theo-mục**, không phải số phát hiện độc lập.

### 3.1 Theo reviewer

| Lane | Mục khai báo | Cờ | Mục bị gắn | block | fix | nit | Ghi chú |
|---|---|---|---|---|---|---|---|
| cline-review-b1 | 112 | 0 | 0 | 0 | 0 | 0 | 112 mục khai báo, **0 cờ** — không đáng tin (xem §6) |
| cline-review-b2 | 252 | 765 | 234 | 0 | 0 | 765 | 765 cờ nhưng **toàn bộ để `nit`**, kể cả 184 cờ correctness |
| cline-review-b3 | 364 | 94 | 81 | 62 | 16 | 16 | 94 cờ, 62 block; bằng chứng khớp 94/94 |
| cline-review-b4 | 364 | 1687 | 354 | 63 | 1608 | 16 | 1.687 cờ; 1.442 cờ "English word" là **dương tính giả** |
| cline-review-b5 | 368 | 465 | 234 | 0 | 455 | 10 | 465 cờ, **0 block**; 464/465 bằng chứng khớp |
| opencode-xc-correctness | — | 310 | 310 | 104 | 114 | 92 | 310 cờ (30 critical/74 high); 1.460 mục script + 144 mục đọc tay |
| agy-xc-copy | — | 899 | 838 | 144 | 741 | 14 | 899 cờ/838 mục; tuyên bố quét 1.460 mục |
| kilo-xc-safety | 1460 | 1799 | 1136 | 120 | 1307 | 372 | 14 cờ tổng hợp (không phải cờ từng mục); 0 phát hiện an toàn |

### 3.2 Theo batch

| Batch | Cờ | Mục bị gắn | Mục trong phạm vi |
|---|---|---|---|
| 1 | 155 | 86 | 112 |
| 2 | 1279 | 251 | 252 |
| 3 | 875 | 346 | 364 |
| 4 | 2455 | 360 | 364 |
| 5 | 1255 | 358 | 368 |

### 3.3 Theo mức độ (đã chuẩn hoá)

Ánh xạ: `critical|high → block`, `medium|major → fix`, `low|info|minor → nit`.

| Mức | Số cờ |
|---|---|
| `block` | 493 |
| `fix` | 4241 |
| `nit` | 1285 |

### 3.4 Theo nhóm vấn đề

| Nhóm | Số cờ |
|---|---|
| `copy` | 3439 |
| `repetition_word_set` | 1185 |
| `theme_content_mismatch` | 280 |
| `correctness` | 246 |
| `repetition_near_duplicate_board` | 212 |
| `age_fit` | 123 |
| `hint` | 86 |
| `instruction_attributed_lapse_to_child` | 62 |
| `placeholder_child_facing_text` | 60 |
| `placeholder-text` | 60 |
| `unsubmittable-correct-answer` | 30 |
| `prompt-answer-mismatch` | 28 |
| `renderer-rule-mismatch` | 16 |
| `valid-answer-rejected` | 16 |
| `unstated-rule` | 14 |
| `explanation-off-by-one` | 60 |
| `explanation-wrong-operation` | 46 |
| `explanation-answer-mismatch` | 16 |
| `raw-option-label` | 16 |
| `progression` | 14 |
| `explanation-false-rule` | 8 |
| `safety` | 1 |
| `age` | 1 |

### 3.5 GameType bị gắn cờ nhiều nhất

| gameType | Số cờ |
|---|---|
| `g08-t3` | 469 |
| `g03-t3` | 380 |
| `g04-t1` | 377 |
| `g06-t2` | 358 |
| `g07-t1` | 349 |
| `g02-t2` | 344 |
| `g04-t3` | 337 |
| `g02-t1` | 304 |
| `g08-t2` | 278 |
| `g06-t3` | 277 |

## 4. Mức độ đồng thuận giữa các reviewer

- **1.140 mục** được ≥2 reviewer độc lập gắn cờ (556 mục có đúng 2, 522 mục có 3, 62 mục có 4).
- **516 cặp (mục, nhóm vấn đề)** được ≥2 reviewer xác nhận độc lập: 512 cặp thuộc `copy`, 4 cặp thuộc `hint`.
- Nhóm `correctness` **không** có cặp nào được 2 reviewer xác nhận cùng lúc: `b2` (184 cờ correctness, không trích dẫn) và `opencode-xc-correctness` (310 cờ, dựa trên đọc code + engine) chỉ trùng nhau 49 mục. Đây là lý do các cờ correctness của `b2` bị xếp vào diện "cần kiểm lại" (§6) trong khi cờ của `opencode` được giữ nguyên.

## 5. Danh sách mục `block` theo nguyên nhân (kèm hướng sửa)

Tổng: **452 mục**. Một mục có thể nằm trong nhiều nhóm (ví dụ vừa lộ ID vừa lặp board), nên tổng theo nhóm là 477 lượt.

### D. Đáp án/board không thoả checker của engine — **62 mục** (người báo: b4)

- Hướng sửa: Kiểm lại `boardData` và `solution` theo đúng checker của từng gameType; hoặc sửa checker nếu checker sai. Cần người quyết định bên nào đúng.
- ID: D183-bonus-vi68, D183-bonus-vi912, D185-main-vi68, D185-main-vi912, D186-main-vi68, D186-main-vi912, D191-bonus-vi68, D191-bonus-vi912, D194-main-vi68, D194-main-vi912, D198-bonus-vi68, D198-bonus-vi912, D199-bonus-vi68, D199-bonus-vi912, D202-main-vi68, D202-main-vi912, D207-bonus-vi68, D207-bonus-vi912, D209-main-vi68, D209-main-vi912, D210-main-vi68, D210-main-vi912, D215-bonus-vi68, D215-bonus-vi912, D218-main-vi68, D218-main-vi912, D222-bonus-vi68, D222-bonus-vi912, D223-bonus-vi68, D223-bonus-vi912, D226-main-vi68, D226-main-vi912, D231-bonus-vi68, D231-bonus-vi912, D233-main-vi68, D233-main-vi912, D234-main-vi68, D234-main-vi912, D239-bonus-vi68, D239-bonus-vi912, D242-main-vi68, D242-main-vi912, D246-bonus-vi68, D246-bonus-vi912, D247-bonus-vi68, D247-bonus-vi912, D250-main-vi68, D250-main-vi912, D255-bonus-vi68, D255-bonus-vi912, D257-main-vi68, D257-main-vi912, D258-main-vi68, D258-main-vi912, D263-bonus-vi68, D263-bonus-vi912, D266-main-vi68, D266-main-vi912, D270-bonus-vi68, D270-bonus-vi912, D271-bonus-vi68, D271-bonus-vi912

### A. Từ tiếng Anh trong câu chữ cho trẻ (`ahead`, `left`, `right`, `behind`) — **60 mục** (người báo: agy-xc-copy + b3)

- Hướng sửa: Thay bằng từ tiếng Việt: phía trước / bên trái / bên phải / phía sau. Sửa ở `explanation` (và `solution` nếu đáp án là chuỗi tiếng Anh), rồi regenerate batch.
- ID: D007-main-vi68, D007-main-vi912, D020-bonus-vi68, D020-bonus-vi912, D031-main-vi68, D031-main-vi912, D044-bonus-vi68, D044-bonus-vi912, D055-main-vi68, D055-main-vi912, D068-bonus-vi68, D068-bonus-vi912, D079-main-vi68, D079-main-vi912, D092-bonus-vi68, D092-bonus-vi912, D103-main-vi68, D103-main-vi912, D116-bonus-vi68, D116-bonus-vi912, D127-main-vi68, D127-main-vi912, D140-bonus-vi68, D140-bonus-vi912, D151-main-vi68, D151-main-vi912, D164-bonus-vi68, D164-bonus-vi912, D175-main-vi68, D175-main-vi912, D188-bonus-vi68, D188-bonus-vi912, D199-main-vi68, D199-main-vi912, D212-bonus-vi68, D212-bonus-vi912, D223-main-vi68, D223-main-vi912, D236-bonus-vi68, D236-bonus-vi912, D247-main-vi68, D247-main-vi912, D260-bonus-vi68, D260-bonus-vi912, D271-main-vi68, D271-main-vi912, D284-bonus-vi68, D284-bonus-vi912, D295-main-vi68, D295-main-vi912, D308-bonus-vi68, D308-bonus-vi912, D319-main-vi68, D319-main-vi912, D332-bonus-vi68, D332-bonus-vi912, D343-main-vi68, D343-main-vi912, D356-bonus-vi68, D356-bonus-vi912

### C. Rò rỉ JSON thô `{"x":N,"y":N}` vào lời giải thích (g02-t3) — **60 mục** (người báo: agy-xc-copy)

- Hướng sửa: Render toạ độ thành câu: "ô ở cột X, hàng Y". Sửa hàm render explanation của g02-t3.
- ID: D010-main-vi68, D010-main-vi912, D023-bonus-vi68, D023-bonus-vi912, D034-main-vi68, D034-main-vi912, D047-bonus-vi68, D047-bonus-vi912, D058-main-vi68, D058-main-vi912, D071-bonus-vi68, D071-bonus-vi912, D082-main-vi68, D082-main-vi912, D095-bonus-vi68, D095-bonus-vi912, D106-main-vi68, D106-main-vi912, D119-bonus-vi68, D119-bonus-vi912, D130-main-vi68, D130-main-vi912, D143-bonus-vi68, D143-bonus-vi912, D154-main-vi68, D154-main-vi912, D167-bonus-vi68, D167-bonus-vi912, D178-main-vi68, D178-main-vi912, D191-bonus-vi68, D191-bonus-vi912, D202-main-vi68, D202-main-vi912, D215-bonus-vi68, D215-bonus-vi912, D226-main-vi68, D226-main-vi912, D239-bonus-vi68, D239-bonus-vi912, D250-main-vi68, D250-main-vi912, D263-bonus-vi68, D263-bonus-vi912, D274-main-vi68, D274-main-vi912, D287-bonus-vi68, D287-bonus-vi912, D298-main-vi68, D298-main-vi912, D311-bonus-vi68, D311-bonus-vi912, D322-main-vi68, D322-main-vi912, D335-bonus-vi68, D335-bonus-vi912, D346-main-vi68, D346-main-vi912, D359-bonus-vi68, D359-bonus-vi912

### L. Board lặp lại gần như nguyên vẹn (g06-t3 và một số gameType) — **60 mục** (người báo: kilo-xc-safety)

- Hướng sửa: Regenerate board cho từng lượt (tối thiểu 1 board khác/lượt trong cùng track) hoặc giảm số lượt.
- ID: D011-bonus-vi68, D011-bonus-vi912, D022-main-vi68, D022-main-vi912, D035-bonus-vi68, D035-bonus-vi912, D046-main-vi68, D046-main-vi912, D059-bonus-vi68, D059-bonus-vi912, D070-main-vi68, D070-main-vi912, D083-bonus-vi68, D083-bonus-vi912, D094-main-vi68, D094-main-vi912, D107-bonus-vi68, D107-bonus-vi912, D118-main-vi68, D118-main-vi912, D131-bonus-vi68, D131-bonus-vi912, D142-main-vi68, D142-main-vi912, D155-bonus-vi68, D155-bonus-vi912, D166-main-vi68, D166-main-vi912, D179-bonus-vi68, D179-bonus-vi912, D190-main-vi68, D190-main-vi912, D203-bonus-vi68, D203-bonus-vi912, D214-main-vi68, D214-main-vi912, D227-bonus-vi68, D227-bonus-vi912, D238-main-vi68, D238-main-vi912, D251-bonus-vi68, D251-bonus-vi912, D262-main-vi68, D262-main-vi912, D275-bonus-vi68, D275-bonus-vi912, D286-main-vi68, D286-main-vi912, D299-bonus-vi68, D299-bonus-vi912, D310-main-vi68, D310-main-vi912, D323-bonus-vi68, D323-bonus-vi912, D334-main-vi68, D334-main-vi912, D347-bonus-vi68, D347-bonus-vi912, D358-main-vi68, D358-main-vi912

### K. Câu văn giữ chỗ (placeholder) lọt ra giao diện (g08-t3) — **60 mục** (người báo: kilo-xc-safety)

- Hướng sửa: `scene[].text` chứa "Bạn N đang chơi việc N theo cách M.". Thay bằng câu tiếng Việt thật khớp `traits`, hoặc bỏ hẳn trường text.
- ID: D013-bonus-vi68, D013-bonus-vi912, D024-main-vi68, D024-main-vi912, D037-bonus-vi68, D037-bonus-vi912, D048-main-vi68, D048-main-vi912, D061-bonus-vi68, D061-bonus-vi912, D072-main-vi68, D072-main-vi912, D085-bonus-vi68, D085-bonus-vi912, D096-main-vi68, D096-main-vi912, D109-bonus-vi68, D109-bonus-vi912, D120-main-vi68, D120-main-vi912, D133-bonus-vi68, D133-bonus-vi912, D144-main-vi68, D144-main-vi912, D157-bonus-vi68, D157-bonus-vi912, D168-main-vi68, D168-main-vi912, D181-bonus-vi68, D181-bonus-vi912, D192-main-vi68, D192-main-vi912, D205-bonus-vi68, D205-bonus-vi912, D216-main-vi68, D216-main-vi912, D229-bonus-vi68, D229-bonus-vi912, D240-main-vi68, D240-main-vi912, D253-bonus-vi68, D253-bonus-vi912, D264-main-vi68, D264-main-vi912, D277-bonus-vi68, D277-bonus-vi912, D288-main-vi68, D288-main-vi912, D301-bonus-vi68, D301-bonus-vi912, D312-main-vi68, D312-main-vi912, D325-bonus-vi68, D325-bonus-vi912, D336-main-vi68, D336-main-vi912, D349-bonus-vi68, D349-bonus-vi912, D360-main-vi68, D360-main-vi912

### B. Lộ mã định danh kỹ thuật trong câu chữ cho trẻ (`fact-a`, `item-1`, `fix-a`, `candidate-1`, `shape-a`, `turn-a`, `scene-X`) — **46 mục** (người báo: b3)

- Hướng sửa: Thay ID bằng mô tả tự nhiên ("hình tròn", "bạn thứ hai"...). Đây là lỗi sinh nội dung hàng loạt — sửa template sinh `explanation` rồi regenerate.
- ID: D092-main-vi68, D092-main-vi912, D093-bonus-vi68, D093-bonus-vi912, D093-main-vi68, D093-main-vi912, D094-main-vi68, D094-main-vi912, D096-main-vi68, D096-main-vi912, D097-bonus-vi68, D097-bonus-vi912, D098-main-vi68, D098-main-vi912, D100-bonus-vi68, D100-bonus-vi912, D103-bonus-vi68, D103-bonus-vi912, D104-main-vi68, D104-main-vi912, D105-bonus-vi68, D105-bonus-vi912, D106-bonus-vi68, D106-bonus-vi912, D107-bonus-vi68, D107-bonus-vi912, D108-main-vi68, D108-main-vi912, D109-bonus-vi68, D109-bonus-vi912, D111-bonus-vi68, D111-bonus-vi912, D111-main-vi68, D111-main-vi912, D114-main-vi68, D114-main-vi912, D116-main-vi68, D116-main-vi912, D117-bonus-vi68, D117-bonus-vi912, D117-main-vi68, D117-main-vi912, D118-main-vi68, D118-main-vi912, D124-bonus-vi68, D124-bonus-vi912

### E. Đáp án đúng nhưng không thể nộp — UI chặn submit (g03-t1) — **30 mục** (người báo: opencode-xc-correctness)

- Hướng sửa: `MemorySequenceGame` luôn render `sequence.length` ô và chặn submit cho tới khi chọn đủ; checker chỉ nhận 1 token còn thiếu. Sửa component hoặc đổi cách chơi.
- ID: D027-main-vi68, D027-main-vi912, D040-bonus-vi68, D040-bonus-vi912, D075-main-vi68, D075-main-vi912, D088-bonus-vi68, D088-bonus-vi912, D123-main-vi68, D123-main-vi912, D136-bonus-vi68, D136-bonus-vi912, D171-main-vi68, D171-main-vi912, D184-bonus-vi68, D184-bonus-vi912, D219-main-vi68, D219-main-vi912, D232-bonus-vi68, D232-bonus-vi912, D267-main-vi68, D267-main-vi912, D280-bonus-vi68, D280-bonus-vi912, D315-main-vi68, D315-main-vi912, D328-bonus-vi68, D328-bonus-vi912, D363-main-vi68, D363-main-vi912

### F. Đề bài/đếm không khớp điều checker chấp nhận (g03-t2) — **28 mục** (người báo: opencode-xc-correctness)

- Hướng sửa: Đề bài đòi kể mọi vị trí đã thấy, checker chỉ nhận ô chưa lộ. Thống nhất lại luật và câu chữ.
- ID: D056-bonus-vi68, D056-bonus-vi912, D067-main-vi68, D067-main-vi912, D080-bonus-vi68, D080-bonus-vi912, D091-main-vi68, D091-main-vi912, D152-bonus-vi68, D152-bonus-vi912, D163-main-vi68, D163-main-vi912, D176-bonus-vi68, D176-bonus-vi912, D187-main-vi68, D187-main-vi912, D248-bonus-vi68, D248-bonus-vi912, D259-main-vi68, D259-main-vi912, D272-bonus-vi68, D272-bonus-vi912, D283-main-vi68, D283-main-vi912, D344-bonus-vi68, D344-bonus-vi912, D355-main-vi68, D355-main-vi912

### I. Gợi ý làm lộ đáp án/quy luật — **24 mục** (người báo: agy-xc-copy (+ b3 ở batch 03))

- Hướng sửa: Viết lại hints theo hướng gợi mở (hỏi ngược, giảm phạm vi) thay vì nêu thẳng quy luật/thứ tự bắt buộc.
- ID: D049-main-vi912, D051-bonus-vi68, D051-bonus-vi912, D062-bonus-vi912, D062-main-vi68, D062-main-vi912, D145-main-vi912, D147-bonus-vi68, D147-bonus-vi912, D158-bonus-vi912, D158-main-vi68, D158-main-vi912, D241-main-vi912, D243-bonus-vi68, D243-bonus-vi912, D254-bonus-vi912, D254-main-vi68, D254-main-vi912, D337-main-vi912, D339-bonus-vi68, D339-bonus-vi912, D350-bonus-vi912, D350-main-vi68, D350-main-vi912

### G. Đáp án hợp lệ bị checker từ chối (g05-t3) — **16 mục** (người báo: opencode-xc-correctness)

- Hướng sửa: Checker thêm ràng buộc ngầm (ít nhất / đúng hai / maxItems) mà đề bài không nói. Nới checker hoặc nói rõ trong tutorial.
- ID: D010-bonus-vi912, D021-main-vi912, D034-bonus-vi912, D045-main-vi912, D117-main-vi68, D130-bonus-vi912, D141-main-vi68, D141-main-vi912, D213-main-vi912, D237-main-vi68, D237-main-vi912, D274-bonus-vi912, D298-bonus-vi912, D309-main-vi68, D322-bonus-vi68, D333-main-vi68

### H. Renderer không hiển thị đúng luật chơi (g05-t1) — **16 mục** (người báo: opencode-xc-correctness)

- Hướng sửa: Đề bài/UI hỏi quả cân để cân bằng, checker lại đòi quả thay `replaceId`; renderer không có ô thay thế. Sửa renderer cho khớp checker.
- ID: D026-bonus-vi68, D026-bonus-vi912, D037-main-vi68, D037-main-vi912, D122-bonus-vi68, D122-bonus-vi912, D133-main-vi68, D133-main-vi912, D218-bonus-vi68, D218-bonus-vi912, D229-main-vi68, D229-main-vi912, D314-bonus-vi68, D314-bonus-vi912, D325-main-vi68, D325-main-vi912

### J. Luật ngầm: checker chỉ nhận đường ngắn nhất nhưng đề bài không nói (g06-t1) — **14 mục** (người báo: opencode-xc-correctness)

- Hướng sửa: Thêm "ít bước nhất" vào tutorial hoặc chấp nhận mọi đường hợp lệ.
- ID: D075-bonus-vi68, D075-bonus-vi912, D086-main-vi68, D086-main-vi912, D171-bonus-vi68, D171-bonus-vi912, D182-main-vi68, D182-main-vi912, D267-bonus-vi68, D267-bonus-vi912, D278-main-vi68, D278-main-vi912, D363-bonus-vi68, D363-bonus-vi912

### M. Nội dung nhạy cảm (bạo lực: "đánh") — **1 mục** (người báo: b4)

- Hướng sửa: Thay bằng động từ an toàn ("chạm", "đẩy").
- ID: D196-main-vi912


## 6. Cờ bị nghi ngờ / loại bỏ (và lý do)

| Nguồn | Số lượng | Kết luận |
|---|---|---|
| **cline-review-b1** (toàn bộ lane) | 0 cờ trên 112 mục | **Loại bỏ.** File cuối là `flags: []`, verdict "ĐỀ XUẤT DUYỆT". Trong lúc chạy, cùng file từng có 239 → 153 → 30 cờ rồi bị ghi đè về 0. Bằng chứng phản bác không thể tranh cãi: **42/112 mục trong đúng phạm vi của b1** chứa ID kỹ thuật trong câu chữ cho trẻ (ví dụ `D001-bonus-vi68`: "Đáp án là candidate-1."). Đã escalate cho coordinator. |
| **cline-review-b4** — bộ dò "English word" | 1.608 cờ, trong đó **~1.442 là dương tính giả** | **Đánh dấu suspect.** Bộ dò gắn cờ từ tiếng Việt (`theo` 152, `hai` 134, `so` 78, `thay` 72, `chia` 64, `xem` 62, `cho` 62, `sai` 60, `sau` 60, `ra` 56, `xoay` 48, `khi` 30, `rau` 28...). Chỉ ~166 cờ có token Latin thật (`item` 94, `step` 72). Phần còn lại của b4 (62 cờ correctness) vẫn giữ. |
| **cline-review-b2** — 184 cờ `correctness` | 184 | **Cần kiểm lại.** Tất cả bị xếp `nit`, văn bản vấn đề là "Solution is incorrect:" (không có mô tả), bằng chứng chỉ là `boardData`/`solution` thô. Không thể xác nhận bằng đối chiếu văn bản; 49 mục trùng với phát hiện độc lập của `opencode`. |
| **kilo-xc-safety** — bằng chứng tổng hợp | 340 cờ-theo-mục | **Không phải cờ sai**, nhưng bằng chứng là văn xuôi tổng hợp (không trích từng mục) nên không thể xác minh độc lập ở cấp mục. Giữ nguyên nội dung, chỉ hạ độ tin cậy. |
| **cline-review-b5** — cờ D350-bonus-vi912 | 1 | Bằng chứng là số đo (`board size 152 vs 134`), không phải trích dẫn văn bản. Giữ như thông tin tham khảo. |

Ngoài các trường hợp trên, **không có cờ nào bị loại vì trích dẫn sai**.

## 7. Độ phủ và tính trung thực của từng reviewer

| Lane | Tự khai | Thực tế kiểm được | Đánh giá |
|---|---|---|---|
| cline-review-b1 | 112/112 mục | 0 cờ, không có bằng chứng nào | **Không trung thực/không đạt** — bỏ qua toàn bộ phát hiện |
| cline-review-b2 | 252/252 mục | 765 cờ/234 mục; 721 khớp + 44 khớp một phần | Phủ tốt, **phân loại mức sai** (toàn `nit`) |
| cline-review-b3 | 364/364 mục | 94 cờ/81 mục; 94/94 khớp | Tốt, mức độ hợp lý |
| cline-review-b4 | 364/364 mục | 1.687 cờ/354 mục; 1.687 khớp (kể cả structured) | Phủ tốt nhưng **độ chính xác thấp** do bộ dò tiếng Anh |
| cline-review-b5 | 368/368 mục | 465 cờ/234 mục; 464 khớp | Phủ tốt, **không gắn block nào** dù có lỗi hệ thống |
| opencode-xc-correctness | 1.460 mục script + **144 mục đọc tay** | 310 cờ/310 mục; 262 khớp + 48 khớp một phần | Trung thực, nêu rõ chỉ đọc tay 144 mục; engine check: 0 lỗi validate/solve, nhưng 16 mục `exactSumSubsetsRejectedByChecker` |
| agy-xc-copy | 1.460 mục | 899 cờ/838 mục; 885 khớp + 14 phi-trích dẫn | Phủ rộng, bằng chứng tốt |
| kilo-xc-safety | 1.460 mục quét an toàn (7 nhóm) | 14 cờ tổng hợp/1.136 mục; 0 phát hiện an toàn | An toàn: sạch; lặp lại: có vấn đề thật; bằng chứng cấp tổng hợp |

Lưu ý về phạm vi: `b1..b5` chỉ review 2 track `age_6_8` + `age_9_12` (đúng như khai báo); `age_3_5` và `age_13_plus` **chưa được review nội dung**, dù có trong corpus.

## 8. Đề xuất thứ tự xử lý

1. **Sửa cơ chế sinh chữ (A, B, C, K — 226 lượt mục block, cộng phần lớn `fix`)**: ID kỹ thuật, JSON toạ độ, từ tiếng Anh, câu placeholder — tất cả nằm ở template `explanation`/`scene[].text`/`solution`. Sửa template rồi regenerate batch sẽ dọn hàng loạt.
2. **Thống nhất luật chơi với checker (E, F, G, H, J, D — 166 mục block)**: đây là lỗi sản phẩm, cần quyết định sửa UI/checker hay sửa nội dung; không thể chỉ regenerate.
3. **Regenerate board lặp (L — 60 mục)** và **viết lại hints lộ đáp án (I — 24 mục)**.
4. **Kiểm lại 184 cờ correctness của b2** bằng engine thật trước khi đưa vào backlog.
5. **Chạy lại review cho `age_3_5` và `age_13_plus`** nếu hai track này cũng sẽ phát hành.

## 9. Phụ lục — nguồn và tệp

- `execution/content-review/batch-01..05-review.{json,md}` — 5 lane cline
- `execution/content-review/xc-correctness-opencode.{json,md}` — opencode
- `execution/content-review/xc-copy-agy.{json,md}` — agy
- `execution/content-review/xc-safety-kilo.{json,md}` — kilo
- Dữ liệu kiểm chứng máy đọc: `/tmp/goodhabit-reader/verify-*.json`, `/tmp/goodhabit-reader/merge.json`, `/tmp/goodhabit-reader/block-groups.json`
