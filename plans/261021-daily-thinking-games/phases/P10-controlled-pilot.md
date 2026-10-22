# P10 — Pilot và hiệu chỉnh theo tuổi

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: GPT + AGY.
Receiver/reviewer: GPT release owner.
Phụ thuộc: P09.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Dùng test/demo nội bộ trước; pilot trẻ thật cần consent/cơ chế phụ huynh theo app hiện có, không tự nhắn mời gia đình.
2. P05A đã yêu cầu tối thiểu 3 người/track 6–8 và 9–12; P10 mở rộng tối thiểu 5 người/track, mỗi người 7 ngày; sau đó cohort riêng 3–5 có hỗ trợ và 13+ nếu được duyệt. Không coi mẫu nhỏ chứng minh hiệu quả học tập.
3. Ghi thời gian active không tính loading/gián đoạn, hiểu luật sau ví dụ, hints/exit/frustration, chất lượng hoàn thành task.
4. Đo mục tiêu 80% ván 60–120 giây và 80% hiểu luật; xem phân bố theo format/tuổi, không lấy trung bình che nhóm yếu.
5. Khi trẻ làm vội/khó chịu/không dừng được hoặc task reject tăng, tắt cohort, chỉnh owner đúng phase rồi quay lại QA.
6. P05A là gate trước P06/P07; P10 không thay thế checkpoint sớm hoặc content semantic approval.

## Phạm vi file / artifact

- `pilot-protocol.md`
- `consent/authorization record theo hệ thống hiện có`
- `aggregated-results.md`
- `age-track-release-decision.md`

## Tham chiếu hiện tại

- `../../../docs/product-analytics.md`
- `../../../docs/security-privacy.md`
- `../../../docs/research/2026-10-17-daily-thinking-games.md`

## Gate có thể kiểm chứng

- [ ] Đủ quan sát thật từng tuổi bật hoặc ghi NOT-RUN; không bịa người dùng/feedback.
- [ ] Không báo tăng IQ; không tăng hạn mức để cải thiện retention; không phạt trẻ vắng/nghỉ.
- [ ] Mọi chỉnh gameplay quay qua test/solver; không trực tiếp sửa dữ liệu đã khóa của attempt đang chơi.
- [ ] Nếu chưa có cohort/authority: phase blocked, không tự đưa production đại trà.

## Kiểm chứng

- Human observation + aggregate metrics review; automation chỉ kiểm instrumentation và quyền dữ liệu.

## Rollback / phục hồi

Tắt feature/cohort là rollback pilot, giữ dữ liệu audit tối thiểu; không gửi email/message mời khi chưa được chỉ thị.

## Handoff bắt buộc

- Artifact: `../handoffs/P10.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **GPT release owner**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
