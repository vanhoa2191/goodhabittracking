# Báo cáo Bàn giao Sửa đổi Bản sao Vòng 3 (Gemini Round 3 Copy Remediation Handoff)

**Không gian làm việc đã xác minh**: `/home/opc/orca/goodhabittracking` <br>
**Nhánh**: `feat/thinking-games-content-r2` (Pull Request #199) <br>
**HEAD kiểm tra**: `b6bf6a94fa79856b195d73fa2370fc31112abc16` (short: `b6bf6a9`) <br>
**Vai trò**: Scoped Content Executor (Gemini). <br>
**Tài liệu tham chiếu cốt lõi**: `AGENTS.md`, `plans/261021-daily-thinking-games/execution/content-review/codex-current-inventory.{md,json}`. <br>

---

## 1. Tóm tắt kết quả phạm vi giới hạn (Bounded Scope Execution Summary)

Làn thực thi nội dung Gemini đã hoàn thành khắc phục triệt để và hẹp (narrow fix) nhóm lỗi **Giọng gây áp lực / So sánh / Chấm năng lực** (Pressure / Comparison / Ability-Testing Language) ảnh hưởng tới **57 mục phát hành đợt đầu** (thuộc 5 dạng bài `g01-t3`, `g02-t1`, `g03-t1`, `g05-t3`, `g08-t1`), đồng thời thiết lập bộ kiểm thử hồi quy hành vi tập trung nhằm bảo vệ toàn bộ 24 kho lời mời (invitation pools) tuân thủ tuyệt đối nguyên tắc non-punitive và tinh thần đồng hành bạn bè "mình – bạn".

### Danh sách tệp thuộc phạm vi ghi (Write Scope Compliance)
Chỉ có duy nhất 3 tệp sau được ghi/chỉnh sửa bởi làn Gemini:
1. `src/lib/thinking-games/content/copy.ts` (Sửa đúng 5 dòng mẫu lời mời trong `GAME_INVITATIONS`)
2. `tests/unit/thinking-games/round3-copy.test.ts` (Tệp kiểm thử hồi quy hành vi tập trung mới, 15/15 test passed)
3. `plans/261021-daily-thinking-games/execution/gemini-r3-copy-handoff.md` (Báo cáo bàn giao này)

### Cam kết an toàn & Biên giới thẩm quyền
- **Bảo toàn tệp bẩn/chưa theo dõi khác**: Toàn bộ các thay đổi đồng thời của làn cơ chế Codex (`remaining.ts`, `round3-mechanics.test.ts`) và các tệp handoff khác được giữ nguyên vẹn 100%.
- **Không tái sinh ứng viên**: Làn Gemini **KHÔNG** chạy tái sinh 1.460 / 2.920 ứng viên trong `content/thinking-games/candidates/365-v2/`. Toàn bộ 2.920 hàng ứng viên tiếp tục duy trì trạng thái `design_only`. Việc tái sinh ứng viên thuộc thẩm quyền của làn tích hợp Codex (Codex integration lane).
- **Không vi phạm git/quyền**: Không thực hiện `git commit`, `push`, `merge`, không cài đặt thêm `dependencies`, không chạm `feature flags`, không tự ý cấp quyền biên tập (`editorial approval`) hay chữ ký duyệt (`signature`).

---

## 2. Chi tiết sửa đổi Bản sao (Copy Remediation Details)

Toàn bộ 120 mẫu câu mời thuộc 24 dạng trò chơi (`GAME_INVITATIONS`) trong `src/lib/thinking-games/content/copy.ts` đã được rà soát độc lập. Kết quả xác nhận đúng 5 dòng mẫu câu chứa ngôn từ gây áp lực, so sánh thi đua, hoặc kiểm tra năng lực đã được sửa hẹp tại chỗ (in-place replacement) để giữ nguyên cấu trúc mảng 5 phần tử per gameType, bảo toàn tính tất định của thuật toán chọn theo seed (`selectBySeed`).

| Dạng bài | Dòng | Phân nhóm lỗi (Codex Inventory) | Số mục ảnh hưởng | Câu cũ (Defective / Retired) | Câu mới (Non-punitive / Explore) |
|---|---|---|---|---|---|
| `g01-t3` | 46 | `g01-t3_kiem_tra` | 12 | `Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy!` | `Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé!` |
| `g02-t1` | 52 | `g02-t1_doi_hoi` | 13 | `Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé.` | `Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha!` |
| `g03-t1` | 73 | `g03-t1_ai_nho_nhanh` | 11 | `Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào!` | `Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha!` |
| `g05-t3` | 129 | `g05-t3_kiem_tra` | 12 | `Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy!` | `Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào!` |
| `g08-t1` | 178 | `g08-t1_kiem_tra` | 9 | `Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy!` | `Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé!` |
| **Tổng** | **5 dòng** | **5 phân nhóm** | **57 mục** | **100% loại bỏ áp lực / so sánh / kiểm tra** | **100% tự nhiên "mình - bạn", gợi mở khám phá** |

### Nguyên tắc biên tập đã áp dụng:
1. **Tinh thần bè bạn ("mình – bạn")**: Chuyển đổi từ thể mệnh lệnh áp đặt của người lớn ("đòi hỏi bạn phải", "sẽ kiểm tra... của bạn") sang lời rủ cùng chơi ("Hôm nay mình cùng... nhé!").
2. **Loại bỏ hoàn toàn thi đua và vội vã (No rush / No competition)**: Cụm từ "xem ai nhớ nhanh và chính xác hơn nào!" được thay bằng "bạn cứ từ từ quan sát nha!", khẳng định rõ giá trị trẻ được chơi với nhịp điệu của riêng mình mà không bị thúc giục hay so bì.
3. **Không phán xét năng lực (Non-punitive / No ability-testing)**: Thay cụm "kiểm tra khả năng..." bằng hoạt động cụ thể, vui vẻ như "đoán xem cỗ máy biến đổi số thế nào", "cộng nhẩm thử xem nào", "tìm điểm khác nhau giữa hai bức tranh".

---

## 3. Bằng chứng Đối chiếu Trước / Sau từ 5 Phân nhóm Thực tế (Before / After Evidence)

Dưới đây là đối chiếu kết quả sinh lời mời thực tế trên dữ liệu ứng viên hiện hữu từ `codex-current-inventory.json` khi áp dụng `getNaturalInvitation`:

### 1. Phân nhóm `g02-t1_doi_hoi` (Mẫu: `D002-main-vi68`, Day 2, track 6-8, variant `khớp đường viền`)
- **Trước**: `Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé.`
- **Sau**: `Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha!`
- **Đánh giá**: Xóa bỏ từ ngữ cưỡng chế ("đòi hỏi bạn phải"), thay bằng lời mời tích cực, khích lệ quan sát tỉ mỉ.

### 2. Phân nhóm `g03-t1_ai_nho_nhanh` (Mẫu: `D016-bonus-vi68`, Day 16, track 6-8, variant `nhắc lại cùng chiều`)
- **Trước**: `Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào!`
- **Sau**: `Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha!`
- **Đánh giá**: Triệt tiêu tâm lý ganh đua ("xem ai hơn") và áp lực tốc độ ("nhanh"), tạo không gian thư giãn, an tâm quan sát ("từ từ quan sát nha").

### 3. Phân nhóm `g05-t3_kiem_tra` (Mẫu: `D021-main-vi68`, Day 21, track 6-8, variant `chọn hai phần vừa đủ`)
- **Trước**: `Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy!`
- **Sau**: `Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào!`
- **Đánh giá**: Thay đổi góc nhìn từ bài kiểm tra sát hạch thành trò chơi đồng hành cùng gom đồ vật vào giỏ.

### 4. Phân nhóm `g01-t3_kiem_tra` (Mẫu: `D046-bonus-vi912`, Day 46, track 9-12, variant `thêm hoặc bớt phần tử`)
- **Trước**: `Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy!`
- **Sau**: `Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé!`
- **Đánh giá**: Chuyển giọng điệu từ khảo sát năng lực suy luận sang tò mò giải mã cơ chế hoạt động kỳ diệu của chiếc máy.

### 5. Phân nhóm `g08-t1_kiem_tra` (Mẫu: `D053-bonus-vi912`, Day 53, track 9-12, variant `chi tiết số lượng`)
- **Trước**: `Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy!`
- **Sau**: `Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé!`
- **Đánh giá**: Tự nhiên, ngắn gọn, biến thử thách thành chuyến phiêu lưu làm thám tử tìm điểm khác lạ giữa hai bức tranh.

---

## 4. Kiểm thử Hồi quy Hành vi Tập trung (`round3-copy.test.ts`)

Làn Gemini đã tạo mới tệp kiểm thử chuyên biệt: `tests/unit/thinking-games/round3-copy.test.ts`.

### Cấu trúc và Phạm vi kiểm thử (15 Test Cases):
1. **Direct 5-line remediation in GAME_INVITATIONS (6 tests)**:
   - Kiểm tra độc lập từng gameType (`g01-t3`, `g02-t1`, `g03-t1`, `g05-t3`, `g08-t1`): xác nhận chuỗi cũ đã bị loại bỏ hoàn toàn và chuỗi mới đã có mặt.
   - Quét toàn bộ kho câu trong `GAME_INVITATIONS`: xác nhận không còn bất kỳ chuỗi nào trong 5 câu cũ xuất hiện ở bất cứ đâu.
2. **Non-punitive & Peer Pronoun Rules across ALL 24 game types (4 tests)**:
   - Đảm bảo 24/24 gameType đều có tối thiểu 3 biến thể lời mời trở lên.
   - Quét toàn bộ lời mời chống lại các mẫu regex gây áp lực: `/\bkiểm tra\s+(khả năng|sự chú ý|năng lực|trình độ)\b/i`, `/\bchấm điểm\b/i`, `/\bđo lường\b/i`, `/\bđòi hỏi bạn phải\b/i`, `/\bxem ai\b/i`, `/\bai hơn\b/i`, `/\bnhanh nhất\b/i`, `/\bchậm nhất\b/i`, `/\bthua kém\b/i`, `/\bkém cỏi\b/i`, `/\bđần\b/i`, `/\bngốc\b/i`, `/\bganh đua\b/i`, `/\báp lực\b/i`, `/\bđua top\b/i`, `/\bso bì\b/i`, `/\bIQ\b/i`.
   - Ngăn chặn đại từ người lớn - trẻ em có tính tôn ti phân cấp (`con`, `bé`, `thầy`, `cô`). Phân biệt chính xác giữa đại từ xưng hô và danh từ/từ loại ghép như `con số`, `con đường`.
   - Đảm bảo tính nhất quán của đại từ đồng hành (`mình`, `chúng mình`, `bạn`) trong tất cả các pool.
3. **Behavioral simulation with `getNaturalInvitation` across 365 days (5 tests)**:
   - Mô phỏng phát sinh lời mời qua 365 ngày cho 24 dạng trò chơi, xác nhận 100% lời mời sinh ra không bao giờ chứa từ ngữ áp lực.
   - Xác nhận tính tất định (determinism) tuyệt đối: cùng day và seed sinh ra chính xác cùng một lời mời.
   - Thử nghiệm trên các mẫu hạt giống thực tế của D002, D016, D021, D046, D053.
   - Kiểm chứng tính phân tán ngẫu nhiên của `selectBySeed`.
   - **Xác minh tự động toàn bộ 57 mục tồn đọng từ `codex-current-inventory.json`**: Script đọc trực tiếp file inventory, nạp 5 file batch ứng viên, tính toán seed chính xác cho toàn bộ 57 mục và khẳng định 100% (57/57 mục) không còn sinh ra câu bằng chứng cũ (`actualEvidence`), mà chuyển sang đúng câu mời mới thân thiện.

---

## 5. Kết quả Xác minh và Thực thi Lệnh (Verification Runs)

Toàn bộ các lệnh kiểm tra được thực hiện trong môi trường chuẩn:
`PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH` tại thư mục gốc `/home/opc/orca/goodhabittracking`.

```bash
# 1. Chạy suite kiểm thử hồi quy mới
npx vitest run tests/unit/thinking-games/round3-copy.test.ts
# Kết quả: Exit 0, 1 test file passed, 15/15 tests passed, Duration 543ms.

# 2. Chạy hồi quy các tệp copy và mechanics liên quan
npx vitest run tests/unit/thinking-games-copy.test.ts tests/unit/thinking-games/round2-content-fixes.test.ts
# Kết quả: Exit 0, 2 test files passed, 18/18 tests passed.

# 3. Kiểm tra kiểu tĩnh TypeScript
npm run typecheck
# Kết quả: Exit 0 (tsc --noEmit không có lỗi).

# 4. Kiểm tra phong cách mã nguồn ESLint
npx eslint src/lib/thinking-games/content/copy.ts tests/unit/thinking-games/round3-copy.test.ts
# Kết quả: Exit 0 (không có cảnh báo hoặc lỗi).

# 5. Kiểm tra định dạng khoảng trắng git
git diff --check src/lib/thinking-games/content/copy.ts
# Kết quả: Exit 0.
```

---

## 6. Phụ thuộc Bàn giao & Bước tiếp theo (Next Steps / Integration Handoff)

1. **Phối hợp Làn Tích hợp Codex (Codex Integration Lane)**:
   - Làn Gemini đã giải quyết triệt để nguyên nhân gốc của 57 mục lỗi lời mời tại mã nguồn generator `copy.ts`.
   - Làn cơ chế Codex đã giải quyết nguyên nhân gốc của 48 mục lỗi cơ chế tại `remaining.ts` (g04-t2, g06-t2, g08-t3).
   - Làn tích hợp của Điều phối viên (Coordinator) / Codex sẽ phụ trách chạy lệnh tái sinh chính thức:
     ```bash
     node scripts/generate-thinking-games-candidates-v2.mjs
     ```
   - Chạy kiểm tra toàn diện:
     ```bash
     node scripts/check-thinking-games-candidates-v2.mjs --all
     ```
2. **Review độc lập sau khi tái sinh**:
   - Sau khi làn tích hợp hoàn tất tái sinh và sinh bảng hash SHA-256 mới, vai trò tiếp theo của Gemini là phối hợp kiểm tra biên tập độc lập trên nội dung hoàn chỉnh trước khi PR199 sẵn sàng xem xét ký duyệt.
