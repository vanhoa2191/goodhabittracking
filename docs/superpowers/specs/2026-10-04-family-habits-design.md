# Thiết kế "Cả nhà" (R4): thói quen cả nhà, ba mẹ cùng làm, thử thách, lời cảm ơn

Trạng thái: **bản thiết kế để duyệt**, chưa viết mã. Điều kiện bắt đầu làm (quyết định đã chốt): ba giai đoạn R1–R3 chạy thật ít nhất 4 tuần trên vài gia đình và có phản hồi. Cờ build: `NEXT_PUBLIC_FAMILY_HABITS` (mặc định tắt).

## Mục tiêu và không mục tiêu

- Mục tiêu: để cả nhà cùng làm vài việc chung, ba mẹ làm mẫu một cách nhìn thấy được, cùng hướng tới một mục tiêu chung, và nói lời cảm ơn nhau; mọi thứ nhẹ, không thêm việc cho phụ huynh.
- Không làm: bảng xếp hạng hay so sánh giữa các bé ở bất kỳ màn nào của R4; tạo hồ sơ người lớn; nhắn tin tự do giữa các thành viên; tính điểm cho phụ huynh.
- Gia đình không bật R4 không thấy thay đổi nào.

## Hiện trạng liên quan

- Mỗi việc (`habit_activities`) thuộc về một bé hoặc áp cho mọi bé (`child_id` null) nhưng **mỗi bé làm riêng**, mỗi bé một log.
- `isParentRole` (Thân giáo của ba mẹ) chỉ có nghĩa với bé 0–3: bé không tự tick, ba mẹ làm mẫu.
- Bảng xếp hạng gia đình/nhóm đã có (`group_teams`), nhưng R4 không dùng nó.
- Nhật ký một câu của bé (`child_journal_entries`) đã đặt chuẩn riêng tư cho nội dung bé viết: chỉ trong gia đình, có đồng ý, không vào đo lường.

## Quyết định đề xuất

1. **Việc cả nhà** = một việc mới với `scope = 'family'`: một lần hoàn thành mỗi ngày cho cả nhà. Ai cũng xác nhận được (phụ huynh hoặc bé trên thiết bị đã ghép); log ghi **tên người xác nhận** (`done_by`: `parent` hoặc id bé). Không cộng sao riêng; có thể tặng sao đều cho các bé khi cả nhà làm xong (tùy chọn của phụ huynh, mặc định tắt).
2. **Ba mẹ cũng làm**: không tạo hồ sơ người lớn. Việc cả nhà có nhãn "ba mẹ làm trước, bé thấy": phụ huynh tick, bé thấy dấu và dòng chữ. Dùng lại nghĩa của `isParentRole`, mở rộng thành thuộc tính của việc cả nhà, không thêm mô hình.
3. **Thử thách gia đình**: bảng `family_challenges` (`id, family_id, title, target_days, reward_text, starts_on, ends_on, status`). Tiến độ chung = số ngày cả nhà đã làm các việc cả nhà đã chọn; phần thưởng chung do phụ huynh viết. Không xếp hạng, không so sánh bé.
4. **Thẻ "Nhà mình hôm nay"**: một thẻ tóm tắt (việc cả nhà đã xong chưa, tiến độ thử thách), **không phải bảng xếp hạng**; ẩn khi gia đình tạm nghỉ.
5. **Lời cảm ơn**: câu ngắn (≤ 140 ký tự) từ một thành viên gửi cho thành viên khác, chỉ người trong nhà thấy; cùng chuẩn riêng tư và đồng ý như nhật ký một câu; công tắc tắt toàn bộ ở cài đặt gia đình; phụ huynh xem được và xóa được. Bé dưới 6 tuổi chỉ nhận, không gửi.
6. **Riêng tư và đo lường**: nội dung do bé viết không vào đo lường; không có sự kiện đo lường mới mang nội dung.

## Dữ liệu

| Đối tượng | Thay đổi |
|---|---|
| `habit_activities` | thêm `scope text not null default 'child' check in ('child','family')`; việc `family` có `child_id` null và bị loại khỏi mọi tính toán pha, chuỗi, gợi ý theo bé |
| `family_habit_logs` | `id, family_id, activity_id, local_date, done_by, created_at`, duy nhất `(activity_id, local_date)` |
| `family_challenges` | như mục 3 |
| `family_thanks` | `id, family_id, from_kind ('parent'/'child'), from_id, to_id, text (≤140), created_at, read_at` |

Ghi qua hàm `security definer` kiểm quyền (`can_manage_family` hoặc phiên thiết bị bé), không có đường ghi trực tiếp từ client; đọc qua `family_snapshot` và `get_child_session` như các bảng khác. Mỗi hàm có preflight verify và rollback tự chứa (xem `docs/deployment.md`).

## Giao diện

- Phụ huynh: tab Quản lý việc thêm góc nhìn "Cả nhà" (tải lười); thẻ "Nhà mình hôm nay" trong Hôm nay; mục Lời cảm ơn trong Gia đình.
- Bé: một dải "Cả nhà cùng làm" trên màn hình bé; nút gửi lời cảm ơn (từ 6 tuổi) chọn từ danh sách câu có sẵn hoặc câu ngắn của bé.

## Kế hoạch phát hành (mỗi PR một migration, áp lên production trước khi merge)

1. Việc cả nhà (dữ liệu + hàm + giao diện phụ huynh + bé).
2. Thử thách và thẻ "Nhà mình hôm nay".
3. Lời cảm ơn (kèm rà soát riêng tư).

## Tiêu chí chấp nhận

- Không màn nào có xếp hạng hoặc so sánh giữa các bé.
- Gia đình không bật cờ không thấy khác biệt nào; test chụp ảnh trước/sau.
- Hai gia đình độc lập không đọc/ghi được dữ liệu của nhau (test hợp đồng migration và test API).
- Việc cả nhà không làm thay đổi pha, chuỗi, huy hiệu hay gợi ý của bất kỳ bé nào.

## Câu hỏi còn mở cho chủ dự án

- Có tặng sao đều cho các bé khi cả nhà làm xong không (đề xuất: tắt mặc định)?
- Giới hạn số việc cả nhà đồng thời (đề xuất: 3, cùng nguyên tắc giới hạn thói quen mới)?
- Lời cảm ơn có cho bé dưới 9 tuổi gửi không (đề xuất: không, chỉ nhận)?
