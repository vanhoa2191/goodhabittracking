# P08 — Gắn vào app, parent controls và trạng thái chia sẻ

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: GPT.
Receiver/reviewer: Kilo / AGY.
Phụ thuộc: P05A (pilot usability checkpoint) cho tích hợp pilot; P07 cho nội dung production.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Nhận lock integration từ lane UI; thêm compact card vào hôm nay, không render quyền chơi của ngày lịch sử.
2. Parent settings nhận quyền/checks thật; preview cutoff và lịch nhiệm vụ; feature flag riêng mặc định off.
3. Nối store/snapshot/cache và multi-tab events, tránh stale responses khi đổi child/date hoặc bị revoke.
4. Nối collection/journey không mất chuỗi, calm finishing screen; không tác động điểm đổi quà hiện có.
5. Kiểm inventory mọi copy child-facing bị chạm tới và thay xưng hô theo phạm vi, locale parity; lazy-load game/content.

## Phạm vi file / artifact

- `src/components/KidDashboard.tsx (shared lock)`
- `src/lib/store.tsx (shared lock)`
- `src/lib/experience-flags.ts (shared lock)`
- `parent settings surfaces chốt sau inventory`
- `i18n thinking-games copy/registry`

## Tham chiếu hiện tại

- `src/components/KidDashboard.tsx`
- `src/lib/store.tsx`
- `src/lib/experience-flags.ts`
- `tests/e2e/kid-history.spec.ts`
- `tests/e2e/quest-deferral.spec.ts`
- `tests/e2e/reward-mutation.spec.ts`

## Gate có thể kiểm chứng

- [ ] Flag off không có request/bundle trò chơi không cần thiết và không làm hỏng nhiệm vụ cũ.
- [ ] History view không cấp/chơi lại main/bonus; child switch không lộ nội dung/trạng thái trẻ trước.
- [ ] Real multi-tab/shared-state và paired device flow pass; failed save rollback UI chính xác.
- [ ] Baseline task praise/history/approval/reward/deferral vẫn đúng, không sửa tính điểm sao.

## Kiểm chứng

- Regression có trước integration; e2e real storage events/server state; browser small/desktop và lazy bundle check.

## Rollback / phục hồi

Nếu lane UI chưa nhả file lock thì làm adapter/test fixture; không ghi đè dashboard để chạy kịp.

## Handoff bắt buộc

- Artifact: `../handoffs/P08.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **Kilo / AGY**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
