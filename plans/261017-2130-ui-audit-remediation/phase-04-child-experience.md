# Phase 04 — Màn bé hành động trước

Owner GPT executor; reviewers AGY Gemini và Kilo; handoff →06/07. Depends02,03 accepted. A01/A06, V03.

## Scope và cleanup

`KidDashboard.tsx:325–568,638–813`, `app/page.tsx` demo notice nếu cần, kid copy modules; các optional cards chỉ trong phạm vi reorder/collapse đúng brief. Trước edit đọc craft-floor và Next docs liên quan. Khóa completion/undo/deferral/pending/history/timer/reward/bottomnav bằng coverage hiện hữu, thêm gap test phù hợp; không viết snapshot sao chép implementation.

04 sở hữu V01 heading outline và V03 icon/tofu trong KidDashboard cùng các tests child được giao. Có thể sửa block age-band liên quan trong globals.css sau02 nhả file, không đổi palette/core theme trong lượt này.06 chỉ kiểm chứng lại KidDashboard; nếu phát hiện gap, coordinator cấp correction task rõ ownership, không hai người cùng ghi. Tái dùng kid-hero-compact/task-card specs; không tạo suite hình học trùng chỉ vì viewport375×812 mới.

Timer-save recovery được giao04 ở callback KidDashboard và contract/footer trạng thái lưu của HabitTimerModal nếu cần;02 phải nhả toàn file trước04,04 nhả trước06 sửa vùng chạm/focus. Không đổi countdown mechanics chỉ để chạm save contract. Handoff04 ghi rõ callback async result, failure UI và file đã nhả;06 không tự viết lại flow này.

Một lượt một mùi: bỏ thông tin thành tích lặp trong hero; compact greeting/progress; đưa next task/day list lên đầu; chuyển framework guide và optional panels tới nơi theo ngữ cảnh. Demo disclosure vẫn trung thực, không ẩn bản chất dữ liệu mẫu. Không thêm heading “việc tiếp theo” nếu chỉ nhân đôi thẻ task và hai control có cùng action.

Completion có chữ trạng thái nhìn thấy, label/ARIA cùng nghĩa; giữ pending không cộng verified points. Taxonomy dài ở chi tiết, action đời thường ở title nếu dữ liệu/copy authority cho phép; không đổi saved activity title/domain content hàng loạt. Raw failure code không lọt prose bé, vẫn giữ diagnostics đúng nơi có sẵn. Kiểm chứng tofu trước khi thay icon thiết yếu bằng Lucide/asset hiện có.

Recovery contract sau review AGY:idle → saving (guard handler trước rerender, disable duplicate) → authoritative completed/pending hoặc recoverable error. Tick/điểm verified chỉ theo kết quả store/server; praise anticipatory hiện có phải rút khi save fail, không phát haptic success trước kết quả. Lỗi mạng/server giữ thẻ/điểm cũ và lời nhắc tại chỗ “Chưa lưu được. Thử lại nhé.” được locale hóa; không auto retry side effect và không âm thanh phạt. Khi outcome chưa rõ, reconcile trước retry. Timer hết giờ không đồng nghĩa habit đã lưu; giữ kết quả timer và CTA thử lưu lại nếu save fail, focus không mất. Reward claim fail giữ balance/selection và báo lỗi tại card/dialog đúng scope. Các thay đổi logic vượt presentation phải được cấp correction scope store cụ thể, không dùng timer/claim path fire-and-forget để né contract.

## Exit gate

375×812 với đại diện default font108% trên nhánh trẻ tự thao tác theo brief03: tên và nút chính của task đầu nằm trọn viewport, không nằm sau bottomnav/header; demo/paired fixture test riêng. Nhánh0–3 caregiver-led và unknown-age fallback có actor/action acceptance riêng theo03, không ép trẻ nhỏ tự làm checklist. Khi font118%/zoom200% ưu tiên reflow và truy cập được, không ép above-fold bằng chữ nhỏ. Ngày không có task hiển thị empty state đúng, không bịa task. Các flags optional-on không đẩy tất cả thao tác xuống dưới; recheck state flow/scroll restored và date history. Slow/failure/unknown-result/retry cho completion, timer-save và reward claim có bằng chứng không giả completion/balance và không gửi lặp.

Visual một batch375/768/1280/light/dark đã chọn + một confirm sau fix; task completion và read-aloud/timer/deferral còn hoạt động bằng keyboard/tap; swipe synthesize test nếu có engine phù hợp. Không nói physical-touch tested nếu chỉ emulation.

## Handoff

`handoffs/phase-04.md`: before/after metrics, flags/age cases, behavior results, reviewer verdict, file ownership released. Rollback scoped presentation patch; không đổi schema hoặc storage.

### File ownership correction for04a while01 is active

`tests/e2e/ui-audit-regression.spec.ts` is owned as an ENTIRE FILE by OpenCode01, including its existing child A01 case.04a may READ/RUN it but MUST NOT EDIT any portion until01 has explicitly released it.04a may edit `ui-audit-fixture.ts` (01 explicitly read-only) and new child recovery/child-fixture files, plus existing child-only test files. Add paired geometry in a child-only owned spec; do not fork/replace parent cases. This overrides any earlier task phrase granting the A01 case during concurrent01. Whole-file exclusivity takes precedence over line-range ownership.
