# Product logic audit — 2026-10-27

- Lane: `product-logic`; task `task_f80ed9e9f693`.
- Target: `/home/opc/orca/workspaces/goodhabittracking/emperor`, branch `vanhoa2191/audit-all-project-areas`.
- Đã đọc `plans/audit-2026-10-27/BRIEF.md`; chỉ tạo báo cáo này, không sửa code, chạy migration/deploy, hoặc truy cập production.
- Phát hiện xác minh: **P0: 0 / P1: 0 / P2: 2 / P3: 0**.

## PROD-LOGIC-01 — P2 — Thói quen vai trò cha mẹ ở 0–3 vẫn cộng sao cho hồ sơ bé

**Vị trí:** `src/lib/habit-framework/catalog.ts:147-172`; `src/lib/store/local-habit-actions.ts:129-168`; `src/components/HabitProgramStartModal.tsx:70`; quy tắc sản phẩm tại `docs/habit-science-and-adaptive-logic.md:76-82`.

**Bằng chứng tự kiểm tra:**

- `createActivityFromFrameworkHabit(habit, childId, ...)` gán `points: 10`, `requiresApproval: false` cho mọi mục; riêng GD1, `isParentRole` được đặt `true` (catalog.ts:162-170). Modal bắt đầu chương trình tạo các activity này với `child.id` (HabitProgramStartModal.tsx:70); thư viện khung cũng tạo activity dùng chung để phụ huynh có thể gán cho bé (HabitFrameworkLibrary.tsx:132).
- Khi một activity không cần duyệt được đánh dấu hoàn thành, local action ghi trạng thái `completed`, cấp toàn bộ `activity.points`, rồi tăng `points` và `totalEarned` của child profile (local-habit-actions.ts:129-168). Trong luồng này không có nhánh loại `isParentRole` khỏi điểm.
- Tài liệu logic ghi trẻ 0–3 học bằng cách quan sát, hành vi đo là cha mẹ tự xác nhận và “không thưởng cho bé” (habit-science-and-adaptive-logic.md:76-82). Vì vậy các activity GD1 do cha mẹ thực hiện vẫn có thể tạo sao cho bé.

**Kịch bản:** phụ huynh bắt đầu chương trình hoặc thêm một thói quen GD1 cho hồ sơ bé, rồi đánh dấu hành vi làm gương của chính mình là xong. Không cần phê duyệt; hồ sơ bé nhận 10 sao cho hành vi cha mẹ thực hiện, có thể dùng số sao đó trong luồng đổi thưởng.

**Đề xuất:** với activity `isParentRole`, không ghi tiến độ/điểm lên hồ sơ trẻ; nếu cần theo dõi, lưu xác nhận của phụ huynh ở luồng riêng không sinh thưởng. Thêm kiểm thử từ tạo activity GD1 qua hoàn thành và số sao sau đó.

## PROD-LOGIC-02 — P2 — Giai đoạn duy trì có thể lùi trước đủ một cửa sổ cơ hội

**Vị trí:** `src/lib/habit-programs/phase.ts:53-61`, `:85-97`; hợp đồng tại `docs/habit-science-and-adaptive-logic.md:120-129`.

**Bằng chứng tự kiểm tra:**

- Spec ghi số cơ hội tối thiểu ở một pha trước khi xét chuyển là N (10 cơ hội cho cadence theo ngày, 6 cho tuần; mục 5.3). Code có kiểm tra `inPhase >= windowSize` cho build→fade và fade→maintain (phase.ts:94-95), nhưng maintain→fade kiểm tra duy nhất tỷ lệ hoàn thành cửa sổ trượt hiện tại (phase.ts:96), không kiểm tra cơ hội trong pha duy trì.
- Evaluator phát lại lịch sử và sau khi chuyển pha đặt `inPhase = 0` (phase.ts:53-61). Do đó, nếu kết quả thấp hơn ngưỡng 60% trước khi pha maintain tích lũy N cơ hội, nó vẫn lùi ngay; cửa sổ trượt còn có thể bao gồm nhiều cơ hội của pha fade trước đó.

**Kịch bản:** một thói quen vừa vào maintain, nhưng trong vài cơ hội kế tiếp có nhiều lần bỏ lỡ; khi cửa sổ gần nhất xuống dưới ngưỡng, ứng dụng phân loại lại thành fade trước 10/6 cơ hội maintain. Đây làm pha phụ thuộc vào dữ liệu trước khi vào maintain và khác ngưỡng thời gian pha nêu trong spec.

**Đề xuất:** áp dụng điều kiện tối thiểu N cơ hội trong maintain trước khi đánh giá lùi pha, hoặc sửa spec để nói rõ regression được miễn điều kiện N; giữ test cho lịch sử chuyển pha cụ thể và các trường hợp lỡ nhiều lần.

## Các bề mặt đã đối chiếu

- **Framework / science / claims:** phần ngưỡng thích ứng trong code đối chiếu với mục 5 của tài liệu khoa học; code giữ các tỷ lệ 7/10, 8/10, 60%, trần gợi ý, hệ số dưới 6 tuổi và giới hạn habit mới tương ứng. Nội dung `/science` trong `src/data/science-content.json` nêu giới hạn bằng chứng và các điều chưa biết; phù hợp với claims ledger về mô tả có giới hạn, không cam kết kết quả.
- **Cha mẹ / caregiver:** onboarding dùng tuổi và ngưỡng habit mới để chọn gợi ý ban đầu; caregiver projection chỉ dựng số việc đến hạn và log hoàn thành/đã duyệt, với hoạt động dùng chung tính cho từng hồ sơ bé. Không thấy lỗi vai trò/quy tắc đếm nào được xác minh trong phần đã đọc.
- **Coach / graduation:** code chỉ đưa ra gợi ý tốt nghiệp, chờ đủ 3 tuần và cửa sổ gần nhất đạt 80% một mình; parent vẫn quyết định. Weekly coach giới hạn một thay đổi và dừng khi có thử nghiệm chưa được trả lời. Không có phát hiện chắc chắn khác từ source đã kiểm tra.
- **Thinking games / daily living habits:** không tìm thấy implementation trong checkout này (`rg --files` không liệt kê module `src/lib/thinking-games` hoặc `src/lib/daily-living-habits*`, cũng không có API child/domain liên quan). Vì vậy hai mảng này chưa được đánh giá về logic ở nhánh hiện tại; báo cáo không suy diễn trạng thái của nhánh/worktree khác.
- **Giới hạn:** checkout không có `node_modules`; không chạy test/lint/typecheck và không đọc được guide Next tương ứng của target. Hai phát hiện trên được đối chiếu trực tiếp từ source và các hợp đồng tài liệu, không dựa trên giả định API Next hoặc kết quả production.
