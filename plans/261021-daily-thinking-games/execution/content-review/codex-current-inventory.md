# Báo cáo kiểm kê nội dung tồn đọng (Codex Current Inventory) — Daily Thinking Games V2

> **Tư cách báo cáo**: Review biên tập độc lập, giới hạn phạm vi (bounded), **CHỈ ĐỌC (READ-ONLY)**.
> Báo cáo này **KHÔNG** tự ý sửa mã nguồn/nội dung, **KHÔNG** đưa ra tuyên bố phê duyệt biên tập (no editorial approval claims), và **KHÔNG** thay thế quyết định ký duyệt của chủ sở hữu sản phẩm.

## 1. Thông tin rà soát & Bảng mã băm đầu vào (Input Hashes)

- **Commit kiểm tra**: `b6bf6a94fa79856b195d73fa2370fc31112abc16` (short: `b6bf6a9`)
- **Nhánh**: `feat/thinking-games-content-r2` (Pull Request #199)
- **Phạm vi nội dung phát hành đợt đầu**: 1460 mục (`age_6_8`: 730 mục, `age_9_12`: 730 mục) thuộc 5 file batch v2.
- **Thời điểm hoàn thành kiểm kê**: 2026-10-23T00:05:00.000Z

### Bảng SHA-256 các tệp đầu vào

| Đường dẫn tệp | SHA-256 Checksum |
|---|---|
| `content/thinking-games/candidates/365-v2/batch-01-days-001-028.json` | `e752dcb54987c1bcc9b26d93463206f459025bd03a4dd5d3dae1658b2a670095` |
| `content/thinking-games/candidates/365-v2/batch-02-days-029-091.json` | `1e2fd5ed23ffe110473008216d4cb1951db324421f089d8cbaa34e114a753d31` |
| `content/thinking-games/candidates/365-v2/batch-03-days-092-182.json` | `f5b08f79025039793e200b3163c574ef941ae43fb79408505ee7a18e33a81ccf` |
| `content/thinking-games/candidates/365-v2/batch-04-days-183-273.json` | `82e29d1a7a27fd4ade924e0256d0cdc1af8bd8de2ddbe8f302c5d41668136c8f` |
| `content/thinking-games/candidates/365-v2/batch-05-days-274-365.json` | `02a36bfa46a782f93f6aabc3bb06ba8d2c82db8cff35bcc3397eba1d21143b2d` |
| `content/thinking-games/candidates/365-v2/candidate-manifest-v2.json` | `e7f13e16d454277f0e1fd82180306d3607a0711cbc59b488e7af2c8b6b2ff404` |
| `content/thinking-games/candidates/365-v2/candidate-meta-v2.json` | `35d4a8c60a539ea996c33e9349afa5da328258a6cab28d38e556c11fdaa6fe45` |
| `plans/261021-daily-thinking-games/execution/content-review/round2-sonnet.json` | `bfb2490c5afe97817c82507d87c97ba039a6dd45bdcb740937e9d00f26f65402` |
| `plans/261021-daily-thinking-games/execution/handoff-to-codex-2026-10-22.md` | `3bbd898d9334fe11099246e7e636eec54f792c164b9f18c8ad307ecf2d86d016` |

## 2. Tổng quan kiểm kê định lượng (Exact Quantitative Summary)

Toàn bộ 1.460 mục phát hành đợt đầu đã được kiểm tra chéo giữa nội dung hiện tại và các cờ còn mở từ vòng 2 (theo bàn giao tại `handoff-to-codex-2026-10-22.md`).

Tổng số mục còn tồn tại vấn đề cần sửa ở mức `fix`: **105 mục duy nhất** (chiếm 7.19% tổng số 1.460 mục phát hành đầu). Không còn bất kỳ mục nào ở mức `block`.

### Bảng phân bố 4 nhóm tồn đọng

| STT | Nhóm lỗi | Số mục | Tỷ lệ / 1460 | Mức độ | Tệp nguồn generator chịu trách nhiệm |
|---|---|---|---|---|---|
| 1 | Giọng gây áp lực / so sánh / chấm năng lực | **57** | 3.90% | `fix` | `src/lib/thinking-games/content/copy.ts` (5 dòng) |
| 2 | g04-t2: Luật Nếu - Thì sai thực tế đời sống | **15** | 1.03% | `fix` | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| 3 | g06-t2: Thứ tự chuỗi đời thực gây mơ hồ | **21** | 1.44% | `fix` | `src/lib/thinking-games/mechanics/remaining.ts:1195,1198` |
| 4 | g08-t3: Giải thích lệch cảnh đáp án | **12** | 0.82% | `fix` | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| **Tổng** | **Tổng cộng (không trùng lặp)** | **105** | **7.19%** | `fix` | **Chỉ 2 tệp nguồn generator** |

### Phân tích trùng lặp (Cross-Category Overlaps)

- Kiểm tra giao nhau giữa 4 tập hợp mục ID: **Đúng 0 mục trùng lặp** (0 overlaps).
- Lý do: Nhóm 1 hoàn toàn nằm ở lời mời (invitations) của g02-t1, g05-t3, g01-t3, g03-t1, g08-t1; trong khi nhóm 2, 3, 4 nằm ở `boardData` và `explanation` của riêng g04-t2, g06-t2, và g08-t3.
- Phân bố theo nhóm tuổi: `age_6_8` có **55 mục**, `age_9_12` có **50 mục**.
- Phân bố theo tệp batch: Batch 1: 7 mục; Batch 2: 24 mục; Batch 3: 21 mục; Batch 4: 26 mục; Batch 5: 27 mục.

## 3. Trạng thái các cờ lịch sử vòng 2 (Closed Historic Flags)

Nhiều cờ lịch sử từ vòng duyệt 2 đã được sửa triệt để ở commit `3262a36` và `63d9cbd`. Việc đối chiếu với nội dung hiện tại xác nhận các lỗi này **ĐÃ ĐÓNG HOÀN TOÀN**, không còn tồn tại trong 1.460 mục:

| Cờ lịch sử vòng 2 | Trạng thái vòng 2 | Trạng thái hiện tại | Bằng chứng kiểm chứng trên nội dung hiện tại |
|---|---|---|---|
| **answer_position_bias** | 250 items flagged as block (g02-t1, g02-t2, g03-t3, g05-t1, g07-t2) | **CLOSED** | Verified answer position distribution across all 1460 items; no option index exceeds 35% in current candidate batches; Fisher-Yates shuffle active in generators. |
| **g07-t2_direction_and_double_word** | 60 items flagged as block (solution was always ahead; explanation had duplicate "ở ở") | **CLOSED** | Scanned all 1460 items: 0 occurrences of duplicate words ("ở ở"); solution directions across 60 g07-t2 items are well-balanced (ahead: 16, right: 16, left: 13, behind: 15). |
| **snake_case_leak** | 124 items flagged as fix (tokens kích_cỡ, vị_trí, trọng_lượng exposed in child-facing copy) | **CLOSED** | Scanned all child-facing text across 1460 items: 0 occurrences of underscore tokens. |
| **g01-t1_interleaved_explanation** | 8 items flagged as block (explanation only stated a single step for interleaved sequences) | **CLOSED** | All 8 items (D049, D062, D145, D158, D241, D254, D337, D350) now state both odd and even track steps clearly (e.g. "các số ở vị trí 1, 3, 5... tăng thêm A, các số ở vị trí 2, 4, 6... tăng thêm B"). |
| **g06-t1_waypoints_tutorial_mismatch** | 15 items flagged as fix/clarity (waypoints mentioned when absent or omitted when present) | **CLOSED** | getTutorialMode dynamically generates tutorials according to actual board waypoints and shortest path mode; verified 0 mismatches. |
| **cross_track_identical_hints** | 708 / 730 day/slot pairs had identical hint 1 or hint 2 between 6-8 and 9-12 | **CLOSED** | Verified cross-track hint uniqueness: 0 / 730 pairs share hint 1 or hint 2; 0 strings shared between 6-8 and 9-12 hint pools. |
| **title_monotony** | All titles followed rigid "<Chủ đề> · <Tên trò>" format and repeated identically | **CLOSED** | 730 distinct titles per track (1.000 uniqueness ratio); 0 consecutive-day repeats across tracks; 4 dynamic title frames. |

## 4. Chi tiết kiểm kê 4 nhóm tồn đọng (Itemized Findings & Evidence)

### Nhóm 1: Giọng gây áp lực / Chấm năng lực / So sánh trẻ (57 mục)

Vi phạm trực tiếp nguyên tắc non-punitive (không phạt, không áp lực, không thi đua) và tinh thần đồng hành bè bạn ("mình - bạn") trong PRD.

**Số lượng**: 57 mục (`age_6_8`: 29, `age_9_12`: 28)

#### Phân nhóm `g02-t1_doi_hoi` (13 mục)

- **Vấn đề**: Lời mời dùng cụm từ gây áp lực "đòi hỏi bạn phải", vi phạm nguyên tắc non-punitive và tinh thần thân thiện bạn bè trong PRD.
- **Bằng chứng văn bản hiện tại**: `Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé.`
- **Đề xuất sửa hẹp**: Thay thế bằng lời mời tích cực, khích lệ: "Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha!"
- **Vị trí nguồn generator**: `src/lib/thinking-games/content/copy.ts:52`
- **Danh sách ID (13 mục)**:
  ```text
  D002-main-vi68, D026-main-vi912, D063-bonus-vi68, D063-bonus-vi912, D098-main-vi912, D183-bonus-vi912, D218-main-vi68, D231-bonus-vi912, D255-bonus-vi912, D314-main-vi912, D327-bonus-vi912, D351-bonus-vi912, D362-main-vi68
  ```

#### Phân nhóm `g03-t1_ai_nho_nhanh` (11 mục)

- **Vấn đề**: Lời mời tạo áp lực thi đua và so sánh giữa các trẻ ("xem ai nhớ nhanh và chính xác hơn nào!"), vi phạm trực tiếp nguyên tắc không thi đua, không áp lực trong PRD.
- **Bằng chứng văn bản hiện tại**: `Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào!`
- **Đề xuất sửa hẹp**: Thay thế bằng lời mời nhẹ nhàng, thư giãn: "Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha!"
- **Vị trí nguồn generator**: `src/lib/thinking-games/content/copy.ts:73`
- **Danh sách ID (11 mục)**:
  ```text
  D016-bonus-vi68, D040-bonus-vi68, D051-main-vi912, D075-main-vi68, D075-main-vi912, D088-bonus-vi68, D112-bonus-vi68, D136-bonus-vi68, D208-bonus-vi68, D304-bonus-vi68, D304-bonus-vi912
  ```

#### Phân nhóm `g05-t3_kiem_tra` (12 mục)

- **Vấn đề**: Lời mời mang giọng chấm điểm/kiểm tra năng lực ("sẽ kiểm tra khả năng cộng nhẩm của bạn đấy!"), vi phạm nguyên tắc non-punitive trong PRD.
- **Bằng chứng văn bản hiện tại**: `Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy!`
- **Đề xuất sửa hẹp**: Thay thế bằng lời mời vui vẻ, đồng hành: "Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào!"
- **Vị trí nguồn generator**: `src/lib/thinking-games/content/copy.ts:129`
- **Danh sách ID (12 mục)**:
  ```text
  D021-main-vi68, D021-main-vi912, D034-bonus-vi68, D082-bonus-vi68, D082-bonus-vi912, D106-bonus-vi68, D130-bonus-vi912, D154-bonus-vi912, D189-main-vi68, D213-main-vi68, D346-bonus-vi912, D357-main-vi912
  ```

#### Phân nhóm `g01-t3_kiem_tra` (12 mục)

- **Vấn đề**: Lời mời mang giọng kiểm tra năng lực ("sẽ kiểm tra khả năng suy đoán của bạn đấy!"), vi phạm nguyên tắc non-punitive trong PRD.
- **Bằng chứng văn bản hiện tại**: `Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy!`
- **Đề xuất sửa hẹp**: Thay thế bằng lời mời cùng khám phá: "Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé!"
- **Vị trí nguồn generator**: `src/lib/thinking-games/content/copy.ts:46`
- **Danh sách ID (12 mục)**:
  ```text
  D046-bonus-vi912, D081-main-vi912, D153-main-vi68, D166-bonus-vi68, D177-main-vi68, D177-main-vi912, D190-bonus-vi912, D238-bonus-vi912, D273-main-vi912, D297-main-vi912, D345-main-vi68, D358-bonus-vi68
  ```

#### Phân nhóm `g08-t1_kiem_tra` (9 mục)

- **Vấn đề**: Lời mời mang giọng kiểm tra năng lực ("sẽ kiểm tra sự chú ý chi tiết của bạn đấy!"), vi phạm nguyên tắc non-punitive trong PRD.
- **Bằng chứng văn bản hiện tại**: `Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy!`
- **Đề xuất sửa hẹp**: Thay thế bằng lời mời thám tử vui vẻ: "Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé!"
- **Vị trí nguồn generator**: `src/lib/thinking-games/content/copy.ts:178`
- **Danh sách ID (9 mục)**:
  ```text
  D053-bonus-vi912, D064-main-vi68, D136-main-vi68, D184-main-vi912, D221-bonus-vi68, D232-main-vi912, D269-bonus-vi68, D317-bonus-vi68, D341-bonus-vi68
  ```

### Nhóm 2: g04-t2 Luật Nếu - Thì sai thực tế đời sống (15 mục)

Luật "Nếu có mặt trời thì sẽ có buổi sáng" mâu thuẫn với sự thật đời sống (buổi chiều vẫn có mặt trời), khiến trẻ nắm vững kiến thức thực tế bị bối rối khi suy luận.

**Số lượng**: 15 mục (`age_6_8`: 9, `age_9_12`: 6)

#### Phân nhóm `sun_morning_rule` (15 mục)

- **Vấn đề**: Luật "Nếu có mặt trời thì sẽ có buổi sáng" mâu thuẫn với thực tế đời sống (mặt trời chiếu cả buổi chiều), gây bối rối cho trẻ khi tư duy logic nhân quả.
- **Bằng chứng văn bản hiện tại**: `Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng","then":"thức dậy"},{"if":"thức dậy","then":"đánh răng"}]; Tiền đề: ["mặt...`
- **Đề xuất sửa hẹp**: Đổi mắt xích đầu tiên trong chuỗi sang hiện tượng đặc thù của buổi sáng như "trời hửng sáng" hoặc "bình minh" thay vì "mặt trời".
- **Vị trí nguồn generator**: `src/lib/thinking-games/mechanics/remaining.ts:791`
- **Danh sách ID (15 mục)**:
  ```text
  D028-main-vi912, D052-main-vi912, D076-main-vi68, D089-bonus-vi68, D137-bonus-vi912, D161-bonus-vi912, D196-main-vi912, D209-bonus-vi68, D220-main-vi68, D233-bonus-vi68, D268-main-vi68, D281-bonus-vi68, D305-bonus-vi912, D340-main-vi68, D364-main-vi68
  ```

### Nhóm 3: g06-t2 Thứ tự chuỗi đời thực gây mơ hồ (21 mục)

Chuỗi hành động áp đặt thứ tự duy nhất cho các việc vốn có thể linh hoạt ngoài đời (Xới cơm vs Múc canh) hoặc dùng từ lặp gây hiểu lầm rửa tay hai lần (Rửa tay vs Xoa xà phòng).

**Số lượng**: 21 mục (`age_6_8`: 11, `age_9_12`: 10)

#### Phân nhóm `rice_before_soup` (11 mục)

- **Vấn đề**: Chuỗi hành động bắt buộc "Xới cơm" phải đứng trước "Múc canh", trong khi ngoài đời thực múc canh trước hay xới cơm trước đều hoàn toàn đúng và phổ biến.
- **Bằng chứng văn bản hiện tại**: `Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà.`
- **Đề xuất sửa hẹp**: Thay thế kịch bản bằng chuỗi hành động có quan hệ nhân quả đơn tuyến tuyệt đối (ví dụ: Lấy bát → Xới cơm → Mời cả nhà → Ăn cơm → Dọn bát).
- **Vị trí nguồn generator**: `src/lib/thinking-games/mechanics/remaining.ts:1198`
- **Danh sách ID (11 mục)**:
  ```text
  D006-main-vi68, D030-main-vi912, D054-main-vi68, D054-main-vi912, D078-main-vi68, D126-main-vi912, D163-bonus-vi912, D222-main-vi912, D246-main-vi912, D259-bonus-vi68, D283-bonus-vi912
  ```

#### Phân nhóm `wash_hands_twice` (10 mục)

- **Vấn đề**: Bước "Rửa tay" đứng trước "Xoa xà phòng" rồi lại "Rửa sạch" gây hiểu lầm là phải rửa tay hai lần, thuật ngữ chưa chuẩn xác cho bước làm ướt tay ban đầu.
- **Bằng chứng văn bản hiện tại**: `Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch.`
- **Đề xuất sửa hẹp**: Sửa bước thứ 2 thành "Làm ướt tay" để chuỗi trở thành: Mở vòi → Làm ướt tay → Xoa xà phòng → Rửa sạch → Lau khô.
- **Vị trí nguồn generator**: `src/lib/thinking-games/mechanics/remaining.ts:1195`
- **Danh sách ID (10 mục)**:
  ```text
  D067-bonus-vi68, D102-main-vi912, D163-bonus-vi68, D211-bonus-vi68, D246-main-vi68, D294-main-vi68, D294-main-vi912, D318-main-vi68, D318-main-vi912, D331-bonus-vi68
  ```

### Nhóm 4: g08-t3 Lời giải thích lệch với cảnh đáp án (12 mục)

Cảnh vi phạm luật là chạy ra ngoài vạch kẻ an toàn, nhưng lời giải thích đối chiếu lại ghi "đi sai hướng" lệch với quy tắc chuẩn "đi đúng vạch".

**Số lượng**: 12 mục (`age_6_8`: 6, `age_9_12`: 6)

#### Phân nhóm `wrong_direction_vs_crosswalk` (12 mục)

- **Vấn đề**: Nội dung cảnh lỗi là chạy ra ngoài vạch kẻ an toàn, nhưng lời giải thích lại gán nhãn "đi sai hướng" để đối chiếu với luật "đi đúng vạch", gây sai lệch ngữ nghĩa.
- **Bằng chứng văn bản hiện tại**: `Cảnh lỗi (scene-2): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải thích: "Tình huống 2 chưa hợp lý vì có đặc điểm "đi sai hướng", trong khi ...`
- **Đề xuất sửa hẹp**: Sửa giá trị trait bước khi index === 3 thành "bên ngoài vạch" (thay vì "đi sai hướng") để giải thích khớp với cảnh: "có đặc điểm bên ngoài vạch, trong khi quy tắc chuẩn yêu cầu đi đúng vạch".
- **Vị trí nguồn generator**: `src/lib/thinking-games/mechanics/remaining.ts:1715`
- **Danh sách ID (12 mục)**:
  ```text
  D085-bonus-vi68, D085-bonus-vi912, D096-main-vi68, D096-main-vi912, D181-bonus-vi68, D181-bonus-vi912, D192-main-vi68, D192-main-vi912, D277-bonus-vi68, D277-bonus-vi912, D288-main-vi68, D288-main-vi912
  ```

## 5. Đánh giá độc lập về Tiêu đề & Gợi ý mới (Hints & Titles Assessment)

### Phương pháp & Mức độ bao phủ đọc thực tế (True Read Coverage)

- **Phương pháp tiếp cận**: Thực hiện đọc độc lập 100% không gian mẫu từ điển phát sinh (generative templates):
  - Toàn bộ 192 tiêu đề đơn vị (`TITLE_NAMES` trong `src/lib/thinking-games/content/titles.ts`, 8 tên × 24 gameType) và 4 khung cấu trúc (`STATEMENT_FRAMES` / `QUESTION_FRAMES`).
  - Toàn bộ 263 chuỗi gợi ý đơn vị (147 cặp gợi ý trong `TRACK_HINTS` của `src/lib/thinking-games/content/hints.ts`, gồm 74 cặp nhóm nhỏ và 73 cặp nhóm lớn).
- **Tuyên bố trung thực về phạm vi đọc**: Báo cáo **KHÔNG** tuyên bố đọc thủ công bằng mắt từng dòng 1.460 hàng dữ liệu bảng theo thứ tự tuyến tính. Thay vào đó, toàn bộ 100% mẫu câu cốt lõi đã được đọc kỹ, đồng thời chạy script quét toàn văn 1.460 mục để kiểm tra biến thế, tham số thay thế (`{trait}`, `{target}`, `{max}`), độ lặp và đại từ.

### Kết quả đánh giá Tiêu đề (Titles)

- **Số lượng & Tính đa dạng**: 730/730 tiêu đề khác nhau trên mỗi track (đạt tỷ lệ phân biệt 1.000). Không có bất kỳ tiêu đề nào lặp lại trên hai ngày liền kề.
- **Văn phong & Cấu trúc**: Tiêu đề đan xen nhịp nhàng giữa câu khẳng định sinh động ("Thám tử nhỏ", "Cỗ máy thần kỳ", "Lối đi an toàn") và câu hỏi gợi mở tò mò ("Chiếc bóng nào đây?", "Tiếp theo là gì?", "Bên kia gương có gì?").
- **Kiểm tra đại từ & Tone PRD**:
  - Sử dụng chuẩn mực đại từ: `bạn` xuất hiện 139 lần, `mình` xuất hiện 11 lần (ví dụ: `Soi gương cùng mình · ...`).
  - Hoàn toàn không có đại từ trịnh thượng hoặc xa lạ (`ta`, `tôi`, `chúng ta`, `tớ`, `cậu`).
  - 100% tiêu đề không chứa từ ngữ áp lực hay phán xét.

### Kết quả đánh giá Gợi ý (Hints)

- **Phân tầng độ khó rõ rệt**:
  - **Nhóm 6-8 (Younger)**: Gợi ý ngắn gọn, trực quan, hướng dẫn quan sát cụ thể ("Nhìn các số từ trái sang phải nhé", "Đếm xem hình mẫu có bao nhiêu ô", "Đọc nhỏ cả dãy: cái này, cái kia"). Độ dài đều ≤100 ký tự.
  - **Nhóm 9-12 (Older)**: Gợi ý theo hướng chiến lược và giải thuật ("Thử so từng cặp số đứng cạnh nhau xem hiệu của chúng thế nào", "Loại ngay những hình thừa hoặc thiếu ô", "Bắt đầu từ manh mối loại được nhiều ứng viên nhất").
- **Tính độc lập giữa hai nhóm tuổi**: 0 chuỗi gợi ý nào bị dùng chung giữa nhóm 6-8 và 9-12 (khắc phục hoàn toàn lỗi trùng 97% ở vòng 2).
- **Bảo vệ đáp án ở Gợi ý 1**: 100% Gợi ý 1 chỉ định hướng phương pháp quan sát, tuyệt đối không làm lộ kết quả.
- **Kiểm tra đại từ xưng hô & Ghi nhận cụ thể**:
  - Đại đa số gợi ý dùng câu mệnh lệnh thức sư phạm tự nhiên ("Nhìn...", "Đếm...", "Thử...") hoặc xưng hô `bạn` (38 lần) và tự vấn nhận thức `mình` (3 lần, ví dụ: "Hỏi mình: trong tổng số có bao nhiêu lần cỡ một nhóm?").
  - **Điểm lưu ý nhỏ (Nit)**: Tại `g04-t2` nhóm nhỏ (Young), gợi ý 2 có câu: `Luật nào bắt đầu bằng điều đó thì cho ta một điều mới.` Từ `ta` ở đây mang sắc thái toán học/hình thức, chưa hoàn toàn tự nhiên theo tinh thần "mình - bạn". Khuyến nghị đợt chạm code sau đổi thành: `...thì cho bạn biết thêm một điều mới.`
- **Tuân thủ nguyên tắc non-punitive**: 100% gợi ý không chứa từ ngữ tiêu cực, chấm điểm hay so bì.

## 6. Đề xuất phân công sửa hẹp (Recommended Narrow Fix Ownership)

Cả 105 mục lỗi đều xuất phát từ các khuôn mẫu dùng chung (shared templates) trong generator, chỉ tập trung ở **đúng 2 tệp mã nguồn**:

| Tệp nguồn generator | Dòng | Số mục khắc phục | Nội dung cần chỉnh sửa |
|---|---|---|---|
| `src/lib/thinking-games/content/copy.ts` | 46, 52, 73, 129, 178 | **57 mục** | Thay 5 câu invitation gây áp lực/chấm điểm bằng câu mời chơi thân thiện. |
| `src/lib/thinking-games/mechanics/remaining.ts` | 791 | **15 mục** | Đổi phần tử đầu `mặt trời` thành `trời hửng sáng` hoặc `bình minh` cho chuỗi g04-t2. |
| `src/lib/thinking-games/mechanics/remaining.ts` | 1195, 1198 | **21 mục** | Sửa bước 2 thành `Làm ướt tay` (10 mục); thay kịch bản cơm/canh bằng chuỗi đơn tuyến (11 mục). |
| `src/lib/thinking-games/mechanics/remaining.ts` | 1715 | **12 mục** | Gán `traits.bước = "bên ngoài vạch"` khi `index === 3` để khớp với cảnh chạy ra ngoài vạch. |
| **Tổng** | **2 tệp nguồn** | **105 mục** | **Tái sinh nội dung deterministically bằng script hiện hữu.** |

### Các bước triển khai khuyến nghị cho lane tiếp theo

1. Chỉnh sửa chính xác các dòng nêu trên tại `src/lib/thinking-games/content/copy.ts` và `src/lib/thinking-games/mechanics/remaining.ts`.
2. Chạy tái sinh nội dung: `node scripts/generate-thinking-games-candidates-v2.mjs`.
3. Kiểm tra kiểm thử và audit: `node scripts/check-thinking-games-candidates-v2.mjs --all` và `npm run test:unit`.
4. Xác nhận sha256 mới có thể tái lập (reproducible) qua 2 lần chạy liên tiếp.

## 7. Bảng tra cứu toàn bộ 105 mục kiểm kê (Master Inventory Table)

| ID mục | Ngày | Slot | Nhóm tuổi | Dạng bài | Nhóm lỗi | Bằng chứng văn bản hiện tại | Tệp nguồn generator |
|---|---|---|---|---|---|---|---|
| `D002-main-vi68` | D002 | main | `age_6_8` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D006-main-vi68` | D006 | main | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D016-bonus-vi68` | D016 | bonus | `age_6_8` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D021-main-vi68` | D021 | main | `age_6_8` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D021-main-vi912` | D021 | main | `age_9_12` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D026-main-vi912` | D026 | main | `age_9_12` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D028-main-vi912` | D028 | main | `age_9_12` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D030-main-vi912` | D030 | main | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà → Ăn cơm. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D034-bonus-vi68` | D034 | bonus | `age_6_8` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D040-bonus-vi68` | D040 | bonus | `age_6_8` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D046-bonus-vi912` | D046 | bonus | `age_9_12` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D051-main-vi912` | D051 | main | `age_9_12` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D052-main-vi912` | D052 | main | `age_9_12` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D053-bonus-vi912` | D053 | bonus | `age_9_12` | `g08-t1` | `pressure_comparison_language` | Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy! | `src/lib/thinking-games/content/copy.ts:178` |
| `D054-main-vi68` | D054 | main | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D054-main-vi912` | D054 | main | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà → Ăn cơm. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D063-bonus-vi68` | D063 | bonus | `age_6_8` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D063-bonus-vi912` | D063 | bonus | `age_9_12` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D064-main-vi68` | D064 | main | `age_6_8` | `g08-t1` | `pressure_comparison_language` | Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy! | `src/lib/thinking-games/content/copy.ts:178` |
| `D067-bonus-vi68` | D067 | bonus | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch. | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D075-main-vi68` | D075 | main | `age_6_8` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D075-main-vi912` | D075 | main | `age_9_12` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D076-main-vi68` | D076 | main | `age_6_8` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D078-main-vi68` | D078 | main | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D081-main-vi912` | D081 | main | `age_9_12` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D082-bonus-vi68` | D082 | bonus | `age_6_8` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D082-bonus-vi912` | D082 | bonus | `age_9_12` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D085-bonus-vi68` | D085 | bonus | `age_6_8` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-2): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D085-bonus-vi912` | D085 | bonus | `age_9_12` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-2): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D088-bonus-vi68` | D088 | bonus | `age_6_8` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D089-bonus-vi68` | D089 | bonus | `age_6_8` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D096-main-vi68` | D096 | main | `age_6_8` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-3): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D096-main-vi912` | D096 | main | `age_9_12` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-3): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D098-main-vi912` | D098 | main | `age_9_12` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D102-main-vi912` | D102 | main | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch → Lau... | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D106-bonus-vi68` | D106 | bonus | `age_6_8` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D112-bonus-vi68` | D112 | bonus | `age_6_8` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D126-main-vi912` | D126 | main | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà → Ăn cơm. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D130-bonus-vi912` | D130 | bonus | `age_9_12` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D136-bonus-vi68` | D136 | bonus | `age_6_8` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D136-main-vi68` | D136 | main | `age_6_8` | `g08-t1` | `pressure_comparison_language` | Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy! | `src/lib/thinking-games/content/copy.ts:178` |
| `D137-bonus-vi912` | D137 | bonus | `age_9_12` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D153-main-vi68` | D153 | main | `age_6_8` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D154-bonus-vi912` | D154 | bonus | `age_9_12` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D161-bonus-vi912` | D161 | bonus | `age_9_12` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D163-bonus-vi68` | D163 | bonus | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch. | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D163-bonus-vi912` | D163 | bonus | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà → Ăn cơm. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D166-bonus-vi68` | D166 | bonus | `age_6_8` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D177-main-vi68` | D177 | main | `age_6_8` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D177-main-vi912` | D177 | main | `age_9_12` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D181-bonus-vi68` | D181 | bonus | `age_6_8` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-4): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D181-bonus-vi912` | D181 | bonus | `age_9_12` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-4): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D183-bonus-vi912` | D183 | bonus | `age_9_12` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D184-main-vi912` | D184 | main | `age_9_12` | `g08-t1` | `pressure_comparison_language` | Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy! | `src/lib/thinking-games/content/copy.ts:178` |
| `D189-main-vi68` | D189 | main | `age_6_8` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D190-bonus-vi912` | D190 | bonus | `age_9_12` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D192-main-vi68` | D192 | main | `age_6_8` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-4): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D192-main-vi912` | D192 | main | `age_9_12` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-3): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D196-main-vi912` | D196 | main | `age_9_12` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D208-bonus-vi68` | D208 | bonus | `age_6_8` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D209-bonus-vi68` | D209 | bonus | `age_6_8` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D211-bonus-vi68` | D211 | bonus | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch. | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D213-main-vi68` | D213 | main | `age_6_8` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D218-main-vi68` | D218 | main | `age_6_8` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D220-main-vi68` | D220 | main | `age_6_8` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D221-bonus-vi68` | D221 | bonus | `age_6_8` | `g08-t1` | `pressure_comparison_language` | Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy! | `src/lib/thinking-games/content/copy.ts:178` |
| `D222-main-vi912` | D222 | main | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà → Ăn cơm. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D231-bonus-vi912` | D231 | bonus | `age_9_12` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D232-main-vi912` | D232 | main | `age_9_12` | `g08-t1` | `pressure_comparison_language` | Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy! | `src/lib/thinking-games/content/copy.ts:178` |
| `D233-bonus-vi68` | D233 | bonus | `age_6_8` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D238-bonus-vi912` | D238 | bonus | `age_9_12` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D246-main-vi68` | D246 | main | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch. | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D246-main-vi912` | D246 | main | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà → Ăn cơm. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D255-bonus-vi912` | D255 | bonus | `age_9_12` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D259-bonus-vi68` | D259 | bonus | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D268-main-vi68` | D268 | main | `age_6_8` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D269-bonus-vi68` | D269 | bonus | `age_6_8` | `g08-t1` | `pressure_comparison_language` | Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy! | `src/lib/thinking-games/content/copy.ts:178` |
| `D273-main-vi912` | D273 | main | `age_9_12` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D277-bonus-vi68` | D277 | bonus | `age_6_8` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-2): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D277-bonus-vi912` | D277 | bonus | `age_9_12` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-5): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D281-bonus-vi68` | D281 | bonus | `age_6_8` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D283-bonus-vi912` | D283 | bonus | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà → Ăn cơm. | `src/lib/thinking-games/mechanics/remaining.ts:1198` |
| `D288-main-vi68` | D288 | main | `age_6_8` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-2): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D288-main-vi912` | D288 | main | `age_9_12` | `g08-t3` | `g08_t3_explanation_mismatch` | Cảnh lỗi (scene-3): "Bạn chạy băng qua bên ngoài vạch kẻ an toàn"; Lời giải t... | `src/lib/thinking-games/mechanics/remaining.ts:1715` |
| `D294-main-vi68` | D294 | main | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch. | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D294-main-vi912` | D294 | main | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch → Lau... | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D297-main-vi912` | D297 | main | `age_9_12` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D304-bonus-vi68` | D304 | bonus | `age_6_8` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D304-bonus-vi912` | D304 | bonus | `age_9_12` | `g03-t1` | `pressure_comparison_language` | Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào! | `src/lib/thinking-games/content/copy.ts:73` |
| `D305-bonus-vi912` | D305 | bonus | `age_9_12` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D314-main-vi912` | D314 | main | `age_9_12` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D317-bonus-vi68` | D317 | bonus | `age_6_8` | `g08-t1` | `pressure_comparison_language` | Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy! | `src/lib/thinking-games/content/copy.ts:178` |
| `D318-main-vi68` | D318 | main | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch. | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D318-main-vi912` | D318 | main | `age_9_12` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch → Lau... | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D327-bonus-vi912` | D327 | bonus | `age_9_12` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D331-bonus-vi68` | D331 | bonus | `age_6_8` | `g06-t2` | `g06_t2_ambiguous_sequencing` | Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch. | `src/lib/thinking-games/mechanics/remaining.ts:1195` |
| `D340-main-vi68` | D340 | main | `age_6_8` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
| `D341-bonus-vi68` | D341 | bonus | `age_6_8` | `g08-t1` | `pressure_comparison_language` | Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy! | `src/lib/thinking-games/content/copy.ts:178` |
| `D345-main-vi68` | D345 | main | `age_6_8` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D346-bonus-vi912` | D346 | bonus | `age_9_12` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D351-bonus-vi912` | D351 | bonus | `age_9_12` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D357-main-vi912` | D357 | main | `age_9_12` | `g05-t3` | `pressure_comparison_language` | Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy! | `src/lib/thinking-games/content/copy.ts:129` |
| `D358-bonus-vi68` | D358 | bonus | `age_6_8` | `g01-t3` | `pressure_comparison_language` | Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy! | `src/lib/thinking-games/content/copy.ts:46` |
| `D362-main-vi68` | D362 | main | `age_6_8` | `g02-t1` | `pressure_comparison_language` | Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé. | `src/lib/thinking-games/content/copy.ts:52` |
| `D364-main-vi68` | D364 | main | `age_6_8` | `g04-t2` | `g04_t2_false_if_then` | Luật trong boardData: [{"if":"mặt trời","then":"buổi sáng"},{"if":"buổi sáng"... | `src/lib/thinking-games/mechanics/remaining.ts:791` |
