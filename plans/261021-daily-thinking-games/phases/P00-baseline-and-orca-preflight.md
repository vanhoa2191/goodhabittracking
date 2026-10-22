# P00 — Baseline và preflight Orca

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu. Bản 2026-10-17 trong `.omx/plans/` là historical, không phải receipt hiện tại.
Owner: GPT.
Receiver/reviewer: GPT / OpenCode / Kilo / AGY.
Phụ thuộc: không.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Đọc AGENTS.md, research/CSV, lưu SHA, dirty file inventory và mọi thay đổi thuộc lane khác.
2. Xác minh đúng coordinator terminal/Run; không dùng Run UI audit; ghi model thực tế và phạm vi quyền từng CLI.
3. Tạo planning task/dispatch có spec và output độc lập; xử lý readiness/auth/quota, không thay model.
4. Chạy baseline đọc/kiểm tra cấu trúc CSV, ghi rõ suite nào chưa chạy; tạo ownership/lock manifest.

## Phạm vi file / artifact

- `baseline.md`
- `coordination.md`
- `file-locks.md`

## Tham chiếu hiện tại

- `AGENTS.md`
- `../../../docs/research/2026-10-17-daily-thinking-games.md`
- `../../../docs/research/2026-10-17-daily-thinking-games-365.csv`

## Gate có thể kiểm chứng

- [ ] Có SHA, dirty snapshot, 365 dòng/730 ID/24 format/52 bối cảnh, nguồn tài liệu còn tồn tại.
- [ ] Mỗi agent có ready receipt hoặc blocker cụ thể; không gọi failed attempt là ready.
- [ ] Không sửa source và không can thiệp terminal hoặc file ngoài scope.

## Kiểm chứng

- Kiểm tra git status/diff đọc-only, CSV structure, Orca task-list và dispatch-show.

## Rollback / phục hồi

Không reset runtime hoặc xóa worker khi chưa chứng minh ownership; nếu timeout ghi outcome_unknown.

## Handoff bắt buộc

- Artifact: `../handoffs/P00.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **GPT / OpenCode / Kilo / AGY**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
