# P01 — PRD và hợp đồng dữ liệu

Trạng thái: **CONTRACTS READY FOR INDEPENDENT REVIEW** (2026-10-21). Chưa accepted, chưa triển khai.
Owner: GPT, OpenCode phản biện.
Receiver/reviewer: AGY / OpenCode / Kilo / root.
Phụ thuộc: P00 (historical baseline only).

## Đầu vào

- [contracts.md](../contracts.md), [decisions.md](../decisions.md), [prd.md](../prd.md), [test-spec.md](../test-spec.md).
- Đọc `../plan.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Khóa quyết định ngày/thời gian/snapshot/duyệt/undo/offline/age/flags trong [contracts.md](../contracts.md) và [decisions.md](../decisions.md).
2. Đối chiếu schema nhiệm vụ thực: định nghĩa bắt buộc/tùy chọn không được suy từ completedCount.
3. Khóa atomic bonus integration với complete parent/child, undo parent/child, review single/batch và common lock order (contracts §8).
4. Thiết kế admission/session/content/profile/settings contract, error codes, status transitions, idempotency và versioning.
5. Đặt ngân sách dữ liệu/bundle; catalog theo track, chính sách thiếu nội dung và cách hết ngày 365.
6. Viết Given/When/Then cho từng quyết định; thông báo trẻ nhìn thấy khi waiting/denied/expired.
7. Ghi rõ pilot 3 format/7 ngày dùng manifest riêng, exception spacing và không tính coverage 24/730.

## Phạm vi file / artifact

- `prd.md`
- `contracts.md`
- `decisions.md`
- `catalog-manifest.schema.json (schema tài liệu đề xuất)`

## Tham chiếu hiện tại

- `src/types/index.ts`
- `src/lib/domain/commands.ts`
- `src/lib/domain/local-date.ts`
- `src/lib/age-band.ts`
- `src/lib/supabase/mappers.ts`

## Gate có thể kiểm chứng

- [ ] Mọi case có expected result; không tồn tại hai chính sách rollover trái nhau.
- [ ] API/schema có version, owner, command id, server date, content version; không nhận client timestamp làm bằng chứng sớm.
- [ ] Thống nhất mặc định 365 ngày trải nghiệm; nghỉ không mất; bonus không mở khóa kiến thức bắt buộc.
- [ ] Tuổi/locale phát hành và số lượng payload phải duyệt được định lượng.

## Kiểm chứng

- Contract review độc lập, bảng state transitions và test-spec cross-reference.

## Rollback / phục hồi

Thay contract phải tăng version và cập nhật mọi receiver; không sửa lặng lẽ sau khi các lane bắt đầu.

## Handoff bắt buộc

- Artifact: `../handoffs/P01.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **AGY / OpenCode / Kilo**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
