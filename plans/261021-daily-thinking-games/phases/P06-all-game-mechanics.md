# P06 — Hoàn thiện đủ 24 dạng trò

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: OpenCode.
Receiver/reviewer: AGY content / Kilo.
Phụ thuộc: P05A (early usability checkpoint ACCEPTED).

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Bổ sung 21 dạng còn lại theo tám nhóm ở research; chia batch theo skill, mỗi batch reviewer kiểm trước batch sau.
2. Mỗi dạng có rules, generator/authoring adapter, checker/solver, hints/explanation, renderer và accessibility.
3. Tuổi nhỏ dùng visual và ít bước; tuổi lớn tăng quan hệ/ràng buộc, không chỉ tăng chữ hoặc số.
4. Không chỉ thêm item registry mà thiếu tương tác; nhiều đáp án/unknown evidence không ép một answer sai.
5. Chuẩn hóa events phục vụ lời khen hành vi mà không thu thập dữ liệu nhạy cảm không cần thiết.

## Phạm vi file / artifact

- `registry coverage 24/24`
- `renderer/engine tests theo format`
- `format capability manifest`
- `handoff receipt từng batch`

## Tham chiếu hiện tại

- `../../../docs/research/2026-10-17-daily-thinking-games.md`
- `src/lib/age-band.ts`
- `src/lib/thinking-games/** (đề xuất P03)`

## Gate có thể kiểm chứng

- [ ] 24/24 format có bài mẫu cho mọi track dự định hỗ trợ và checker đúng.
- [ ] Các dạng memory có phase xem/ẩn/thử lại rõ; không gian không dùng màu làm dấu duy nhất.
- [ ] Mỗi format có success/wrong/hint/pause/exit và fallback thao tác; không dead end.
- [ ] Mọi upstream import có pin/source/license và không thêm dependency trái yêu cầu.

## Kiểm chứng

- Unit fixtures positive/negative/multi-solution; format coverage checker; reviewer chơi mẫu từng format.

## Rollback / phục hồi

Không đánh dấu P06 pass khi còn renderer placeholder hoặc solver stub trả true.

## Handoff bắt buộc

- Artifact: `../handoffs/P06.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **AGY content / Kilo**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
