# Bộ thói quen thích ứng: thiết kế

**Trạng thái:** bản nháp chờ chủ dự án duyệt · **Ngày:** 30/09/2026
**Cơ sở khoa học và logic chi tiết:** [`docs/habit-science-and-adaptive-logic.md`](../../habit-science-and-adaptive-logic.md). Spec này không lặp lại các ngưỡng; nó tham chiếu tài liệu đó.

## 1. Mục tiêu, phi mục tiêu, tiêu chí

**Mục tiêu.** Thay lộ trình cố định (Tuần 1–4, Tháng 1–4) bằng các bộ thói quen không có ngày, đo việc thực hiện thói quen của từng bé, và gợi ý phụ huynh điều chỉnh dựa trên bằng chứng về cách thói quen hình thành. Giữ nguyên năm khung tuổi (0–3, 3–6, 6–12, 12–15, 15–18) và 47 thói quen của khung v1.

**Phi mục tiêu.**
- Không sửa nội dung, ID hoặc số lượng 47 thói quen (không nâng `contentVersion`).
- Không hứa kết quả cho trẻ, không gắn nhãn hay điểm thành thạo cho bé.
- Không tự động đổi thói quen của bé; mọi điều chỉnh do phụ huynh chấp nhận.
- Chưa thay đổi hệ thống sao, thưởng và huy hiệu.
- Chưa có mô hình thống kê hay học máy cá nhân hóa.
- Chưa đẩy nhắc nhở ngoài app (email, thông báo đẩy).
- Ebook hướng dẫn và quà tặng từ tài liệu khoa học là **một task riêng, làm sau**; spec này chỉ bảo đảm tài liệu nguồn dùng lại được.

**Tiêu chí thành công (đo nội bộ khi phụ huynh đồng ý phân tích, không dùng để hứa kết quả):** tỷ lệ thói quen có kế hoạch tín hiệu; tỷ lệ lần hoàn thành có ghi mức hỗ trợ; số gợi ý được áp dụng. Mức mục tiêu do chủ dự án đặt sau khi có dữ liệu ban đầu.

## 2. Kiến trúc tổng thể

- **Tính, không lưu.** `evaluateHabitPhase` và `suggestAdjustments` là hàm thuần (chi tiết trong tài liệu khoa học, mục 5). Chạy ở client trên dữ liệu đã đồng bộ, giống cách huy hiệu (`src/lib/badges`), nên chạy giống nhau ở chế độ demo, cục bộ, cloud và thiết bị của bé.
- **Ba khối dữ liệu mới.**
  - `habit_support_observations`: một dòng cho mỗi log; `log_id` duy nhất, khóa ngoại xóa lan theo `activity_logs`; các cột `family_id`, `child_id`, `activity_id`, `support_level` (`alone`, `prompted`, `together`), `recorded_by` (`parent`, `child`), `recorded_at`. RLS theo mẫu `child_task_deferrals`: thành viên gia đình đọc; ghi chỉ qua lệnh miền.
  - `habit_cue_plans`: khóa `(child_id, activity_id)`; `cue_kind` (`event`, `time`), `cue_text`, `time_of_day` tùy chọn, `place_text` tùy chọn, `weekend_variant_text` tùy chọn, `updated_at`. Có kế hoạch nghĩa là đã qua pha 1.
  - Lớp phức tạp và nhịp thực hiện: dữ liệu trong code (`src/lib/habit-programs/habit-complexity.ts`), khóa theo `frameworkHabitId`; thói quen tự tạo mặc định "vừa", nhịp mặc định theo lịch lặp của thói quen.
- **Lệnh miền mới.** `recordSupport { logId, level }` (phụ huynh và, từ 15 tuổi, thiết bị của bé) và `saveCuePlan { childId, activityId, ... }`. Cả hai idempotent, chỉ gia đình sở hữu mới ghi được, theo mẫu `domainCommandSchema` hiện có.
- **Cơ hội (opportunity).** Rút logic "đến hạn" đang nằm trong `KidDashboard` thành `src/lib/habit-programs/opportunities.ts`, dùng chung với `habit-fire` (tạm dừng gia đình, việc để sau).
- **Lưu cục bộ và sao lưu.** Thêm trường mới vào `local-family-persistence` và `family-backup` theo kiểu tương thích ngược (thiếu trường thì mặc định rỗng).
- **Đồng bộ cloud.** `cloud-family-sync` đọc thêm hai bảng.
- **Cờ tính năng.** `habitPrograms` trong `experience-flags`; tắt thì giữ nguyên hành vi hiện tại.

### Xử lý lỗi và trường hợp biên
- Thiếu quan sát: coi là `unknown`, không tính là `alone`.
- Nhiều thiết bị ghi cùng lúc: bản ghi có `recorded_at` mới nhất thắng.
- Undo hoặc xóa log: xóa lan quan sát tương ứng.
- Đổi lịch lặp giữa chừng: cơ hội tính lại theo lịch mới; lượt cũ giữ nguyên.
- Đổi tuổi/khung tuổi của bé: giới hạn thói quen mới đồng thời và cách xác nhận cập nhật theo tuổi hiện tại.

### Riêng tư
Dữ liệu quan sát thuộc phạm vi gia đình, xóa khi xóa bé hoặc tài khoản, thêm vào luồng xuất và xóa dữ liệu (`docs/security-privacy.md`). Sự kiện sản phẩm chỉ gửi khi phụ huynh đồng ý phân tích, tổng hợp và không định danh (ví dụ `habit_phase_changed` với pha, lớp phức tạp, khung tuổi).

## 3. Giao diện

**Phụ huynh**
- Tab Lộ trình đổi thành danh sách bộ; "Bắt đầu cho [bé]" mở luồng 3 bước: chọn thói quen khởi đầu (mặc định 1–2 cái theo tuổi), đặt tín hiệu (mẫu có sẵn, sửa được), xác nhận.
- Chip "Con làm thế nào?" trên việc vừa hoàn thành; một chạm; **tùy chọn, có thể bỏ qua**.
- Nhắc nhẹ khi thiếu dữ liệu (luật N1 trong tài liệu khoa học): chỉ trong app, tối đa 2 lần mỗi tuần, tắt thì im 14 ngày.
- Tóm tắt tuần: pha bằng chữ đời thường ("Đang xây nếp", "Đang giảm hỗ trợ", "Đã thành nếp"), lý do và tối đa 3 gợi ý, mỗi gợi ý có "Áp dụng" và "Để sau".

**Bé**
- Thẻ việc hiện tín hiệu ("Sau khi đánh răng, con…").
- Ở pha 4 có câu ghi nhận bằng lời; sao và thưởng giữ nguyên.
- Không hiện tên pha và không so sánh giữa các bé.
- Từ 15 tuổi bé chọn mức hỗ trợ khi bấm hoàn thành.

**Tương thích**
- Việc gán từ lộ trình cũ (`journeyHabitKey`) vẫn chạy; lộ trình cũ chuyển thành mục "Lộ trình cũ" cho gia đình đã dùng.
- Thói quen đã gán vào luồng pha mới khi phụ huynh thêm kế hoạch tín hiệu; lịch sử log giữ nguyên.
- `/roadmaps` và marketing cập nhật sau khi qua `claims-ledger`.

## 4. Trình tự giao hàng (mỗi bước một PR, không merge khi chưa có sự đồng ý của chủ dự án)

1. Hàm thuần (pha, gợi ý, cơ hội) và test bảng.
2. Dữ liệu: migration hai bảng, hai lệnh miền, đồng bộ cloud, lưu cục bộ, sao lưu, xóa dữ liệu, test RLS và API.
3. Giao diện phụ huynh: kế hoạch tín hiệu, chip, tóm tắt tuần, nhắc nhẹ.
4. Nội dung: `habit-complexity.ts` và `habit-programs-v1.vi.json` (phụ lục A và B).
5. Giao diện bé và bản dịch 9 ngôn ngữ.
6. Tài liệu, trang "Cơ sở khoa học" công khai, phân tích sản phẩm có đồng ý, cập nhật marketing.

## 5. Kiểm thử

- Hàm thuần: bảng chuyển pha (một lần bỏ lỡ không đổi gì; ngày tạm dừng bị loại; đúng ngưỡng 7/10, 8/10, 60% và 5/6, 5/6, 4/6 với thói quen hằng tuần; lùi pha; `unknown` không tính `alone`).
- Migration: RLS cho hai bảng, xóa lan.
- API: `recordSupport` và `saveCuePlan` (xác thực, idempotent, gia đình khác bị từ chối).
- E2E: chip hỏi mức hỗ trợ; bỏ qua thì không đổi pha; bé 15 tuổi tự xác nhận; bắt đầu một bộ; gợi ý áp dụng và để sau.
- Schema nội dung: mỗi `frameworkHabitId` trong bộ tồn tại, mỗi thói quen có lớp phức tạp.

## 6. Việc cần chủ dự án duyệt

1. Lớp phức tạp và nhịp của 47 thói quen (phụ lục A).
2. Nội dung 20 bộ (phụ lục B), đặc biệt tên và mô tả (phải qua `claims-ledger`).
3. Từ ngữ hiển thị các pha và gợi ý cho phụ huynh.
4. Mức mục tiêu cho các chỉ số ở mục 1.

## 7. Rủi ro

- Ngưỡng và giới hạn dựa trên suy luận từ bằng chứng ở người lớn (mức tin cậy thấp): mitigation là tham số cấu hình và đo bằng dữ liệu có đồng ý.
- Ít phụ huynh bấm chip: mitigation là nhắc nhẹ; nếu vẫn ít, gợi ý pha 4 sẽ chậm.
- Chuỗi hiển thị "pha" bị hiểu như điểm số: mitigation là dùng chữ đời thường, không số, không so sánh.

---

## Phụ lục A. Bản nháp lớp phức tạp và nhịp (chờ duyệt)

**Tiêu chí gán lớp.**
- **Đơn giản:** một hành động rõ, khoảng 5 phút trở xuống, một tín hiệu, làm một mình hoặc cùng một người lớn, ít cần kiềm chế.
- **Vừa:** chuỗi 2–4 bước hoặc 10–30 phút, hoặc cần người khác, hoặc cần kiềm chế vừa phải.
- **Phức tạp:** cần lập kế hoạch nhiều bước, hoặc suy ngẫm, hoặc hơn 30 phút, hoặc phụ thuộc nguồn lực bên ngoài, hoặc theo dõi trong nhiều tuần.

**Nhịp:** `D` hằng ngày, `S` vài lần mỗi tuần, `W` hằng tuần.

| ID | Tên rút gọn | Lớp | Nhịp |
|---|---|---|---|
| GD1-NT-01 | Vòng lặp phát–đáp | Vừa | D |
| GD1-NT-02 | Nếp ngày êm và tự trấn an | Vừa | D |
| GD1-SK-01 | Ngủ lành, ngủ đủ | Vừa | D |
| GD1-SK-02 | Vận động thô và vui chơi | Đơn giản | D |
| GD1-MQH-01 | Ba nghi thức lễ nền | Đơn giản | D |
| GD1-MQH-02 | Sẻ chia và luân phiên | Vừa | S |
| GD1-HT-01 | Ngôn ngữ sống và sách mỗi ngày | Đơn giản | D |
| GD1-TC-01 | Trật tự và chờ đợi ngắn | Vừa | D |
| GD2-NT-01 | Gọi tên cảm xúc và 3 nhịp thở | Vừa | D |
| GD2-NT-02 | Nói thật và dũng cảm nhận lỗi | Phức tạp | S |
| GD2-SK-01 | Ngủ đủ và nghi thức tắt màn hình | Vừa | D |
| GD2-SK-02 | Vận động 180 phút và kỹ năng thể chất | Vừa | D |
| GD2-MQH-01 | Bảy bố thí phiên bản mầm | Đơn giản | D |
| GD2-MQH-02 | Xin phép, chọn bạn, hòa giải | Vừa | S |
| GD2-HT-01 | Đọc, kể lại, hỏi "vì sao" | Vừa | D |
| GD2-TC-01 | Ba lọ tiền đầu tiên | Vừa | W |
| GD2-HT-02 | Việc nhà thuộc về con | Đơn giản | D |
| GD3-NT-01 | Nhật ký biết ơn và lời khen tối | Vừa | D |
| GD3-NT-02 | Tự đặt mục tiêu và giữ một thói quen | Phức tạp | D |
| GD3-SK-01 | Ngủ 9–12 giờ, không màn hình | Vừa | D |
| GD3-SK-02 | 60 phút vận động và một môn có chỉ số | Vừa | D |
| GD3-MQH-01 | Giao tiếp thông thái | Phức tạp | S |
| GD3-MQH-02 | Nhận diện 9 dạng người, giữ nhân duyên | Phức tạp | W |
| GD3-HT-01 | Phương pháp học chủ động | Phức tạp | S |
| GD3-HT-02 | Học sâu 25 phút và ngân hàng thời gian | Vừa | D |
| GD3-TC-01 | Ngân sách 4 phong bì | Vừa | W |
| GD3-TC-02 | Việc lớn hơn và kiếm tiền bằng giá trị | Phức tạp | W |
| GD4-NT-01 | Nhật ký nhận thức | Phức tạp | S |
| GD4-NT-02 | Luật sắt bản thân (cấp 1) | Phức tạp | D |
| GD4-NT-03 | Tự điều hòa cảm xúc dưới áp lực | Phức tạp | S |
| GD4-SK-01 | Ngủ 8–10 giờ, giờ ngủ trước 23h | Vừa | D |
| GD4-SK-02 | Tập sức mạnh và dinh dưỡng cơ bản | Phức tạp | S |
| GD4-MQH-01 | Dẫn dắt một nhóm nhỏ | Phức tạp | W |
| GD4-MQH-02 | Xin lỗi, cảm ơn, phản hồi 3 lớp | Phức tạp | S |
| GD4-HT-01 | Học tự chủ: kế hoạch, tự đánh giá | Phức tạp | S |
| GD4-HT-02 | Đọc sâu, tranh luận hai phía | Phức tạp | S |
| GD4-TC-01 | Tài chính teen: ghi chép, thu nhập đầu | Phức tạp | W |
| GD5-NT-01 | Luật sắt bản thân (cấp 2) | Phức tạp | W |
| GD5-NT-02 | Nhận thức sứ mệnh, ước mơ đủ lớn | Phức tạp | W |
| GD5-NT-03 | Thấu hiểu nhân sinh, bố thí có chủ đích | Phức tạp | W |
| GD5-SK-01 | Sức khỏe cấp vận động viên | Phức tạp | S |
| GD5-SK-02 | Quản trị thân và hình thể | Phức tạp | S |
| GD5-MQH-01 | Trở thành duyên lành | Phức tạp | W |
| GD5-MQH-02 | Truyền thông cá nhân | Phức tạp | W |
| GD5-HT-01 | Tự học chuyên sâu và sản phẩm tri thức | Phức tạp | S |
| GD5-TC-01 | Quản trị tài chính cá nhân | Phức tạp | W |
| GD5-HT-03 | Lộ trình nghề ước mơ | Phức tạp | W |

Ghi chú: các thói quen 12–18 tuổi phần lớn "phức tạp" theo tiêu chí; app gợi ý một **phiên bản tối thiểu** khi đặt kế hoạch tín hiệu để không bắt đầu ở mức khó nhất. Nhịp `W` dùng cửa sổ N = 6 (tài liệu khoa học, mục 5.3).

## Phụ lục B. Bản nháp 20 bộ (chờ duyệt)

**Quy tắc.** Mỗi bộ có 3 thói quen của khung (2–3 với khung 0–3), sắp theo lớp phức tạp tăng dần, tối đa hai lĩnh vực chính, không hứa kết quả; mô tả chỉ nêu điều bộ giúp tổ chức. Một thói quen có thể xuất hiện ở nhiều bộ. Nhãn dưới đây là tên nháp, chưa qua `claims-ledger`.

**0–3 tuổi (bộ của cha mẹ, bé quan sát)**
| Mã | Tên nháp | Thói quen (theo thứ tự) |
|---|---|---|
| P1-A | Nếp ngày êm và ngủ lành | GD1-SK-02, GD1-NT-02, GD1-SK-01 |
| P1-B | Được đáp lại mỗi ngày | GD1-MQH-01, GD1-NT-01, GD1-MQH-02 |

**3–6 tuổi**
| Mã | Tên nháp | Thói quen |
|---|---|---|
| P2-A | Cảm xúc bình yên và giấc ngủ | GD2-NT-01, GD2-SK-01, GD2-SK-02 |
| P2-B | Lễ phép và hòa giải | GD2-MQH-01, GD2-MQH-02, GD2-NT-02 |
| P2-C | Bổn phận nhỏ và ba lọ tiền | GD2-HT-02, GD2-HT-01, GD2-TC-01 |

**6–12 tuổi**
| Mã | Tên nháp | Thói quen |
|---|---|---|
| P3-A | Tối biết ơn và ngủ đủ | GD3-NT-01, GD3-SK-01, GD3-NT-02 |
| P3-B | Học có phương pháp | GD3-HT-02, GD3-NT-02, GD3-HT-01 |
| P3-C | Giao tiếp và nhân duyên | GD3-NT-01, GD3-MQH-01, GD3-MQH-02 |
| P3-D | Tiền và giá trị | GD3-HT-02, GD3-TC-01, GD3-TC-02 |
| P3-E | Vận động có chỉ số | GD3-SK-01, GD3-SK-02, GD3-NT-02 |

**12–15 tuổi**
| Mã | Tên nháp | Thói quen |
|---|---|---|
| P4-A | Ngủ và sức mạnh | GD4-SK-01, GD4-SK-02, GD4-NT-02 |
| P4-B | Nhận thức và cảm xúc | GD4-NT-01, GD4-NT-03, GD4-NT-02 |
| P4-C | Học tự chủ | GD4-HT-01, GD4-HT-02, GD4-NT-02 |
| P4-D | Giao tiếp và dẫn dắt | GD4-MQH-02, GD4-MQH-01, GD4-NT-03 |
| P4-E | Tài chính tuổi teen | GD4-TC-01, GD4-HT-01, GD4-NT-02 |

**15–18 tuổi**
| Mã | Tên nháp | Thói quen |
|---|---|---|
| P5-A | Luật sắt và sứ mệnh | GD5-NT-01, GD5-NT-02, GD5-NT-03 |
| P5-B | Thân khỏe và hình thể | GD5-SK-01, GD5-SK-02, GD5-NT-01 |
| P5-C | Duyên lành và truyền thông | GD5-MQH-01, GD5-MQH-02, GD5-NT-03 |
| P5-D | Trí tuệ và nghề | GD5-HT-01, GD5-HT-03, GD5-NT-02 |
| P5-E | Tài chính cá nhân | GD5-TC-01, GD5-HT-03, GD5-NT-01 |

Ghi chú về từ ngữ: chân dung CD-06 hiển thị là "Thể Hình Cân Đối" và thói quen GD5-NT-03 dùng cách nói đời thường (nội dung khung v1.1.0, chủ dự án đã chỉ đạo đổi từ ngữ). Tên thói quen GD5-SK-02 vẫn còn chữ "ngoại hình"; cân nhắc đổi theo hướng sức khỏe và tự chăm sóc khi soạn mô tả bộ P5-B, chờ chủ dự án quyết định.
