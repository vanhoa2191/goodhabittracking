# P11 — Phát hành, vận hành và bàn giao cuối

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: GPT.
Receiver/reviewer: Maintainer / vận hành.
Phụ thuộc: P10.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Đóng release manifest đủ app/schema/content/locale/age versions và owner; cập nhật help/guide, giới hạn feature chính xác.
2. Chuẩn bị migration backup/preflight, thứ tự DB additive → app flag off → smoke → cohort enable theo authority riêng.
3. Dashboard monitoring lỗi/denied/unexpected grants/latency, không ghi raw answers hoặc session secrets; alert có owner.
4. Drill kill switch, rollback app/catalog không xóa ledger; runbook timezone/cutoff/content error và incident response.
5. Bàn giao Lore commits, evidence từng phase, known gaps, pending tasks và lịch bảo trì nội dung; chỉ tuyên bố 365 ngày khi đủ scope.

## Phạm vi file / artifact

- `release-checklist.md`
- `rollout-and-rollback.md`
- `operations-handoff.md`
- `user guide updates đề xuất`
- `final handoff P11`

## Tham chiếu hiện tại

- `../../../docs/deployment.md`
- `../../../docs/runbooks/incident-response.md`
- `../../../docs/product-analytics.md`
- `package.json`
- `AGENTS.md`

## Gate có thể kiểm chứng

- [ ] P00–P10 receiver acceptance đủ, zero P1/P2, production steps chỉ làm khi đã được yêu cầu thực hiện.
- [ ] Smoke cả parent/child/paired device sau migration và sau enable, có evidence môi trường.
- [ ] Kill switch drill và retained data check pass; rollback không tạo cấp trùng khi bật lại.
- [ ] Scope quảng bá khớp track/locale/catalog đã duyệt, không gọi planning CSV là game đã phát hành.

## Kiểm chứng

- Release candidate verification và live smoke được phép; không chạy deploy trong lượt lập plan hiện tại.

## Rollback / phục hồi

Nếu migration/live smoke thất bại: disable flag, giữ dữ liệu, theo runbook; không destructive rollback để làm sạch lỗi.

## Handoff bắt buộc

- Artifact: `../handoffs/P11.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **Maintainer / vận hành**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
