# Rà soát chéo độc lập — An toàn trẻ em, Nhạy cảm, Lặp lại

**Reviewer:** kilo (reviewer chéo độc lập, thứ hai ý kiến) · **Ngày:** 2026-10-22 · **Loại việc:** đọc-only, ý kiến biên tập

> Đây là **ý kiến thứ hai**, **không phải phê duyệt**. File này không ghi trường phê duyệt, chữ ký, digest hay trạng thái nào. 
> Việc duyệt nội dung theo tuổi vẫn **PENDING** (quyết định D26) và thuộc về chủ sở hữu người dùng.

## 1. Phạm vi

| Mục | Giá trị |
| --- | --- |
| File | `content/thinking-games/candidates/365-v2/batch-0{1..5}-*.json` (5 file) |
| Track trong phạm vi | `age_6_8` + `age_9_12` |
| Số lượt chơi | **1460** (2 track × 365 ngày × 2 slot) |
| Loại cơn đối / biến thể / kiểu bàn cờ | 24 / 96 / 24 |
| Ngoài phạm vi | `age_3_5`, `age_13_plus`, pilot manifest, fixture, bản 365-v1 |

## 2. Phương pháp và mức độ đọc thực tế

**Đọc tay (người/reviewer đọc thực sự):**

- **1460/1460 lượt chơi** được đọc hết mọi trường văn bản hiển thị cho trẻ. Nội dung được sinh từ mẫu cố định nên toàn bộ bề mặt chữ chỉ gồm **2114 chuỗi duy nhất**, tôi đã đọc hết:

| Nhóm chuỗi | Số chuỗi duy nhất đã đọc |
| --- | --- |
| `title` (730 tiêu đề = 53 chủ đề × 24 cơ chế) | 730 |
| `invitation` | 24 |
| `tutorial` | 24 |
| `explanation` | 445 |
| `hints[0]`, `hints[1]` | 11 + 12 |
| chuỗi trong `boardData` (mọi cấp, mọi lượt) | 772 |
| luật nếu-thì / lệnh xếp bước / facts / clues | 16 + 29 + 4 + 18 |

- Ngoài ra tôi đọc **JSON đầy đủ từng dòng** cho: 24 lượt mẫu đại diện (đủ 24 `gameTypeId`) và 30 lượt `g06-t3`/`age_6_8`.

**Kiểm tra bằng script:**

- **1460/1460 lượt chơi**, 6 lượt quét, **21 973 chuỗi trong `boardData`** + mọi trường text cấp cao nhất.
- Quét thô (6 nhóm) → quét có biên từ (7 nhóm) → xác minh lại từng hit kèm 40 ký tự quanh → đối chiếu với bảng 772 chuỗi board.
- Đo lặp lại ở 3 mức: board **byte-exact**, board **bỏ thứ tự hiển thị option**, và **bộ từ vựng** — trong cửa sổ ≤ 7 ngày và trong cả năm.

**Giới hạn:** (1) chỉ 5 file candidate 365-v2, 2 track, locale `vi`; (2) văn báo khen/sai/thử lại (`praiseKeys`) **chưa có bản dịch tiếng Việt trong repo** nên không có mặt chữ để quét — chỉ ghi nhận là khóa i18n chưa resolve, không phải cờ; (3) không đánh giá độ khó theo tuổi, lỗi solver hay tính hợp lệ đáp án; (4) không đánh giá UI/thị giác.

## 3. Kết quả quét an toàn — 0 phát hiện trên 1460 lượt

| # | Nhóm kiểm tra | Số lượt quét | Số hit | Kết luận |
| --- | --- | ---: | ---: | --- |
| 1 | Sợ hãi / bạo lực / không an toàn để bắt chước (lửa, dao, thuốc, leo trèo, người lạ, nước sâu…) | 1460 | **0** | Không có phát hiện |
| 2 | Khuôn mẫu giới tính / cấu trúc gia đình | 1460 | **0** | Không có phát hiện |
| 3 | Nhận xét về thân hình / cân nặng / ngoại hình | 1460 | **0** | Không có phát hiện |
| 4 | Tôn giáo / chính trị | 1460 | **0** | Không có phát hiện |
| 5 | Tên thương hiệu / người thật | 1460 | **0** | Không có phát hiện |
| 6 | Từ shaming / gây áp lực (`thua`, `sai rồi`, `kém`, `phạt`…) | 1460 | **0** | Không có phát hiện |
| 7 | Áp lực tốc độ / thưởng / so sánh | 1460 | **0** | Không có phát hiện |

### 3.1. Các chuỗi bị bắt nghi phạm và đã kiểm tra từng chữ

Mọi hit của lượt quét thô đều là **trùng chuỗi con**, đã đối chiếu với nguyên văn và loại:

| Chuỗi nguyên văn | Khớp | Vì sao không phải vấn đề |
| --- | --- | --- |
| `Bưu điện · Chi tiết bất hợp lý` | `điện` | "Bưu điện" = bưu điện (post office) |
| `Quỹ đạo · Cách giải khác` | `đạo` | "Quỹ đạo" = quỹ đạo (orbit) |
| `Dấu chân · Máy biến đổi` | `chân` | "Dấu chân" = dấu chân (footprint) |
| `mặt trời` | `mặt` | "mặt trời" = mặt trời |
| `đánh răng` / `Rửa tay` | `răng` / `tay` | vệ sinh thường ngày |
| `áo mưa` | `áo` | "áo mưa" = áo mưa (raincoat) |
| `Bạn thử tính chậm từng bước…` | `chậm` | "tính chậm" = làm chậm lại — **chống** hấp tấp |
| `…thay vì đoán ngay.` | `ngay` | "thay vì đoán ngay" = chống đoán mò |
| `Hạt giống · Tìm phần sai` | `sai` | "Tìm phần sai" = phần sai **vị trí trong chuỗi**, không nói trẻ sai |
| `Phòng sửa lỗi · Điền phần tiếp theo` | `lỗi` | "Phòng sửa lỗi" = tên chủ đề |
| `Ghé điểm bắt buộc trước khi tới đích.` | `buộc` | "điểm bắt buộc" = waypoint của bài tìm đường |
| `Mình soi ô cần điền hoặc ô đang làm mất đối xứng.` | `mất` | "mất đối xứng" = mất tính đối xứng hình học |
| `Thử tính khoảng cách giữa hai số liền nhau.` | `hoảng` | chuỗi "khoảng" chứa "hoảng" |
| `Bạn tính để hai bên có cùng tổng khối lượng.` | `khối` | "khối lượng" = trọng lượng vật thể |

### 3.2. Nhận xét cần lưu ý (không tính là cờ)

- **Không có nhân vật nào được gọi tên** trong 1460 lượt. Người chơi luôn là `Bạn`, người hướng dẫn luôn là `Mình` — đúng giọng "mình – bạn" của PRD §5.6.
- **Toàn bộ hành vi trong board đều là việc nhà/vườn thông thường** (`Rửa tay`, `đánh răng`, `Múc canh`, `Xới cơm`, `Gieo hạt`, `Mở sách`, `Vẽ tranh`, `Đào đất`, `Lấp đất`, `Mở vòi`, `Xoa xà phòng`…) — không có hành vi nào cần trẻ bắt chước ở nơi nguy hiểm.
- **Không có tham chiếu văn hóa Việt Nam nào** (0 lượt chứa `tết`, `trung thu`, `áo dài`, `nón lá`, `bún`, `phở`…). Nội dung hoàn toàn trung tính, không vi phạm nhưng cũng **không mang bối cảnh địa phương** — đây là lựa chọn biên tập, không phải lỗi.
- Thuộc tính `kích_cỡ: to | nhỏ` chỉ mô tả **vật thể** (lá/hoa/sao), không bao giờ mô tả người.
- `Mời cả nhà` (11 lượt) nói tới gia đình nói chung, không gán việc nào theo giới.

## 4. Số liệu lặp lại

### 4.1. Tiêu chí cửa sổ 7 ngày — **ĐẠT**

Định nghĩa: hai lượt chơi cùng track có `|dayIndexA − dayIndexB| ≤ 7` (tức 8 ngày hành trình liên tiếp).

| Track | Cặp board giống hệt | Cặp board giống (bỏ thứ tự option) | Cặp cùng bộ từ | Cặp cùng tiêu đề | Cặp cùng `gameTypeId` |
| --- | ---: | ---: | ---: | ---: | ---: |
| `age_6_8` | **0** | **0** | **0** | **0** | **0** |
| `age_9_12` | **0** | **0** | **0** | **0** | **0** |

Khoảng cách nhỏ nhất giữa hai lượt cùng `gameTypeId` là **11 ngày** ở cả hai track (≥ 7 theo D18). Vì vậy **không có lượt chơi nào lặp lại trong cửa sổ 7 ngày**.

### 4.2. Lặp lại ở tầng cả năm — đây mới là vấn đề

| Track | Số lượt | Board khác nhau (bỏ thứ tự option) | Bộ từ khác nhau | Lượt dùng lại board đã gặp | Lượt dùng lại bộ từ đã gặp |
| --- | ---: | ---: | ---: | ---: | ---: |
| `age_6_8` | 730 | 647 | 248 | 83 (11.4%) | 482 (66.0%) |
| `age_9_12` | 730 | 672 | 209 | 58 (7.9%) | 521 (71.4%) |

**Đa dạng theo từng cơn đối (cùng `gameTypeId`, trong 1 track):**

| `gameTypeId` | Cơ chế | Lượt | Board khác nhau (`age_6_8` / `age_9_12`) | Bộ từ khác nhau (`age_6_8` / `age_9_12`) | Board giống lặp tối đa | Cách gần nhất |
| --- | --- | ---: | --- | --- | ---: | ---: |
| `g06-t3` | Sửa bước sai | 30 | 3 / 4 | 1 / 1 | 11 | 11 ngày |
| `g05-t2` | Chia nhóm | 31 | 8 / 14 | 4 / 4 | 6 | 13 ngày |
| `g08-t3` | Chi tiết bất hợp lý | 30 | 11 / 15 | 4 / 4 | 4 | 11 ngày |
| `g07-t2` | Đổi góc nhìn | 30 | 16 / 30 | 4 / 4 | 3 | 13 ngày |
| `g02-t1` | Ghép bóng | 31 | 31 / 31 | 1 / 1 | 1 | không có board lặp |
| `g04-t3` | Thông tin còn thiếu | 30 | 30 / 30 | 1 / 1 | 1 | không có board lặp |
| `g07-t3` | Cách giải khác | 30 | 30 / 30 | 1 / 1 | 1 | không có board lặp |

> **Nguyên nhân gốc:** kho câu đố quá hẹp. Toàn bộ 1460 lượt chơi chỉ dùng **16 danh từ** (`bóng, cá, cây, cỏ, hoa, lá, mây, mèo, mưa, nấm, nắng, quả, sao, thuyền, trăng, táo`) và **21 cặp đặc tính** (`màu`, `hình`, `kích_cỡ`, `nhóm`, `vị_trí`, `bước`).

## 5. Danh sách cờ

Tổng **14 cờ** (chi tiết và trích dẫn nguyên văn từng lượt nằm trong `xc-safety-kilo.json`).

| Mã | Nhóm | Mức | `gameTypeId` | Track | Số lượt | Nội dung |
| --- | --- | --- | --- | --- | ---: | --- |
| `XC-REP-01` | `repetition_near_duplicate_board` | 🔴 cao | `g06-t3` | age_6_8 | 30 | `g06-t3` "Sửa bước sai" — 30 lượt/track nhưng chỉ 3 board; một board lặp 11 lần, cách gần nhất 11 ngày |
| `XC-REP-02` | `repetition_near_duplicate_board` | 🔴 cao | `g06-t3` | age_9_12 | 30 | `g06-t3` "Sửa bước sai" — 30 lượt/track nhưng chỉ 4 board; một board lặp 10 lần, cách gần nhất 11 ngày |
| `XC-REP-03` | `repetition_near_duplicate_board` | 🟠 trung bình | `g05-t2` | age_6_8 | 31 | `g05-t2` "Chia nhóm" — 31 lượt/track nhưng chỉ 8 board; một board lặp 6 lần, cách gần nhất 13 ngày |
| `XC-REP-04` | `repetition_near_duplicate_board` | 🟠 trung bình | `g05-t2` | age_9_12 | 31 | `g05-t2` "Chia nhóm" — 31 lượt/track nhưng chỉ 14 board; một board lặp 4 lần, cách gần nhất 13 ngày |
| `XC-REP-05` | `repetition_near_duplicate_board` | 🟠 trung bình | `g08-t3` | age_6_8 | 30 | `g08-t3` "Chi tiết bất hợp lý" — 30 lượt/track nhưng chỉ 11 board; một board lặp 4 lần, cách gần nhất 11 ngày |
| `XC-REP-06` | `repetition_near_duplicate_board` | 🟠 trung bình | `g08-t3` | age_9_12 | 30 | `g08-t3` "Chi tiết bất hợp lý" — 30 lượt/track nhưng chỉ 15 board; một board lặp 4 lần, cách gần nhất 11 ngày |
| `XC-REP-07` | `repetition_near_duplicate_board` | 🟡 thấp | `g07-t2` | age_6_8 | 30 | `g07-t2` "Đổi góc nhìn" (age_6_8) — 16 board cho 30 lượt; một board lặp 3 lần, cách gần nhất 13 ngày |
| `XC-REP-08` | `repetition_word_set` | 🟠 trung bình | `g02-t1` | age_6_8, age_9_12 | 62 | `g02-t1` "Ghép bóng" — đúng 1 bộ từ vựng cho cả 31 lượt mỗi track |
| `XC-REP-09` | `repetition_word_set` | 🟠 trung bình | `g04-t3` | age_6_8, age_9_12 | 60 | `g04-t3` "Thông tin còn thiếu" — đúng 1 bộ từ vựng cho cả 30 lượt mỗi track |
| `XC-REP-10` | `repetition_word_set` | 🟠 trung bình | `g07-t3` | age_6_8, age_9_12 | 60 | `g07-t3` "Cách giải khác" — đúng 1 bộ từ vựng cho cả 30 lượt mỗi track |
| `XC-REP-11` | `repetition_word_set` | 🟠 trung bình | `*` | age_6_8, age_9_12 | 1003 | 66,0% lượt (age_6_8) và 71,4% lượt (age_9_12) dùng lại bộ từ đã gặp; cả năm chỉ 248 + 209 bộ từ |
| `XC-SAF-01` | `placeholder_child_facing_text` | 🔴 cao | `g08-t3` | age_6_8, age_9_12 | 60 | 60 lượt `g08-t3` đưa văn bản giữ chỗ "Bạn N đang chơi việc N theo cách M." vào `scene[].text` — chữ trẻ đọc |
| `XC-SAF-02` | `theme_content_mismatch` | 🟡 thấp | `*` | age_6_8, age_9_12 | 280 | Tiêu đề chủ đề là nhãn trang trí, board không đổi theo chủ đề; 10 chủ đề gợi cảnh giác nước/tối/cao |
| `XC-SAF-03` | `instruction_attributed_lapse_to_child` | ⚪ thông tin | `g07-t1` | age_6_8, age_9_12 | 62 | 62 lượt `g07-t1` dùng "Bạn quên cách chia cũ…" — câu duy nhất gán lỗi trí nhớ cho trẻ |

### 5.1. Cờ chặn (khuyến nghị giữ lại cho tới khi viết lại)

| Mã | Vì sao |
| --- | --- |
| `XC-SAF-01` | **60 lượt `g08-t3`** đưa văn bản giữ chỗ `"Bạn 1 đang chơi việc 1 theo cách 1."` (và biến thể `"Bạn 1 đang thực hiện việc 1 theo cách 1."`) vào trường `scene[].text` — đây là chữ trẻ đọc. Thông tin phân biệt đáp án chỉ nằm trong `traits`, nên nếu UI hiển thị `text` thì trẻ không có căn cứ để trả lời. (Lưu ý: `rule`/`solution` vẫn khớp nhau ở cả 60 lượt.) |
| `XC-REP-01` / `XC-REP-02` | **`g06-t3` "Sửa bước sai"**: 30 lượt/track nhưng chỉ **3 board** (`age_6_8`) / **4 board** (`age_9_12`); một board lặp tới **11 lần**, các lần lặp gần nhất cách nhau **11 ngày**. |
| `XC-REP-03` / `XC-REP-04` | **`g05-t2` "Chia nhóm"**: 31 lượt/track nhưng chỉ **8 board** (`age_6_8`) / **14 board** (`age_9_12`); một board lặp **6 lần**, cách gần nhất **13 ngày**. |
| `XC-REP-05` / `XC-REP-06` | **`g08-t3` "Chi tiết bất hợp lý"**: 30 lượt/track nhưng chỉ **11 board** (`age_6_8`) / **15 board** (`age_9_12`); một board lặp **4 lần**, cách gần nhất **11 ngày**. |

### 5.2. Cờ không chặn nhưng nên xử lý

- `XC-REP-07` — `g07-t2` "Đổi góc nhìn" ở `age_6_8`: 16 board cho 30 lượt, một board lặp 3 lần (cách gần nhất 13 ngày). Ở `age_9_12` cơn đối này có 30 board khác nhau nên không dính.
- `XC-REP-08` / `XC-REP-09` / `XC-REP-10` — `g02-t1`, `g04-t3`, `g07-t3` dùng **đúng một bộ từ vựng** cho cả 30-31 lượt trong track.
- `XC-REP-11` — 66,0% lượt (`age_6_8`) và 71,4% lượt (`age_9_12`) dùng lại một bộ từ đã gặp trước đó trong cùng track.
- `XC-SAF-02` — 53 chủ đề trong tiêu đề chỉ là **nhãn trang trí**, board không đổi theo chủ đề; 10 chủ đề gợi cảnh giác về nước/tối/cao (`Nhà trên cây`, `Cây cầu gỗ`, `Bến thuyền`, `Bãi cát`, `Dòng suối`, `Rạn san hô`, `Tàu ngầm`, `Đường hầm`, `Dấu tích cổ`, `Bóng và ánh sáng`) đứng trên những câu đố không liên quan gì tới bối cảnh đó. Ví dụ `"Nhà trên cây · Sửa bước sai"` mang lưới 5×5 lệnh `up/down/left/right`, không có nội dung leo trèo nào.
- `XC-SAF-03` — 62 lượt `g07-t1` dùng hướng dẫn `"Bạn quên cách chia cũ và làm theo tiêu chí mới."`. Là chỉ dẫn đổi quy tắc nên **không phải shaming**, nhưng là câu duy nhất quy cho rằng trẻ "quên"; `"Bạn bỏ cách chia cũ và làm theo tiêu chí mới"` giữ nguyên nghĩa mà không gán lỗi trí nhớ.

## 6. Kết luận (verdict)

| Trục | Kết luận |
| --- | --- |
| **An toàn trẻ em** | ✅ **Không có phát hiện.** 1460 lượt, 0 hit ở cả 7 nhóm (nguy hiểm/khiếu khích, khuôn mẫu giới–gia đình, thân hình–ngoại hình, tôn giáo–chính trị, thương hiệu–người thật, shaming, áp lực tốc độ/thưởng). Giọng mình–bạn và giọng không phán xét được giữ xuyên suốt. |
| **Lặp lại** | ⚠️ **Đạt tiêu chí cửa sổ 7 ngày (0 va chạm, cả 2 track, cả 3 mức đo)** nhưng **lệch ở tầng năm**: 4 cơn đối lặp nặng và 66-71% lượt dùng lại bộ từ đã gặp. |
| **Chất lượng nội dung** | ❌ Còn 1 lỗi trẻ thấy trực tiếp (văn bản giữ chỗ ở 60 lượt `g08-t3`) và lệch tiêu đề chủ đề với nội dung. |

**Verdict tổng thể: AN TOÀN về mặt trẻ em, CHƯA SẴN SÀNG DUYỆT NỘI DUNG.**

Không có cờ nào thuộc nhóm an toàn cần chặn. Các cờ chặn đều là **lỗi lặp lại/lỗi văn bản giữ chỗ**, có thể sửa bằng cách sinh lại board và viết lại `scene[].text`, không cần thay đổi thiết kế cơn đối.

**Việc còn lại để chủ sở hữu quyết:**

1. Giữ lại 60 lượt `g08-t3` (văn bản giữ chỗ) và các lượt lặp nặng của `g06-t3` / `g05-t2` / `g08-t3` / `g07-t2` cho tới khi viết lại.
2. Mở rộng kho từ vựng (hiện 16 danh từ + 21 cặp đặc tính) để giảm lặp bộ từ.
3. Hoà giải tiêu đề chủ đề với nội dung board, hoặc bỏ tiền tố chủ đề.
4. Giữ nguyên quyết định D26: phê duyệt nội dung theo tuổi vẫn **PENDING**, cần người đọc thật trong bối cảnh Việt Nam — ý kiến này không thay thế được bước đó.

---

*Tệp kèm theo: `xc-safety-kilo.json` — 14 cờ có trường `category`, mỗi cờ trích dẫn nguyên văn chuỗi của từng lượt bị nêu. Không có trường phê duyệt, chữ ký, digest hay trạng thái nào được ghi. Không sửa file repo nào ngoài hai file này; không commit, không push.*
