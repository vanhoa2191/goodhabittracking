# P04 — Database, quyền chơi và đồng bộ

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: GPT hoặc OpenCode nhận backend slice.
Receiver/reviewer: Kilo / GPT.
Phụ thuộc: P01.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Migration additive: settings, day/task snapshot, journey cursor, entitlements/admission, attempts; unique theo child/day/slot và transactions.
2. RPC/API theo child session/family ownership, parent settings authorization, cross-site checks, strict schema; riêng cloud và demo adapter.
3. Lưu received_at server và review state; tính bonus theo cutoff snapshot; race undo/reject/approve/start có transaction semantics.
4. Sửa các RPC habit hiện có để gọi `sync_thinking_game_bonus_for_child` trong cùng transaction, batch một lần sau loop, theo common lock order ở [contracts §8](../contracts.md#8-atomic-habit-integration-and-common-lock-order). Không bật bonus nếu một RPC chưa tuân thủ.
5. Định nghĩa offline persistence/retry idempotent; không nâng cache/localStorage thành quyền server; stale response không ghi đè state mới.
6. Chuẩn bị apply/preflight/rollback cục bộ và fail-closed khi migration chưa có; không áp production.

## Phạm vi file / artifact

- `supabase/migrations/*_thinking_games.sql (đề xuất)`
- `supabase/preflight/*_thinking_games.verify.sql (đề xuất)`
- `supabase/rollbacks/*_thinking_games.rollback.sql (đề xuất)`
- `src/app/api/thinking-games/** (đề xuất)`
- `src/lib/store/thinking-games-client.ts (đề xuất)`

## Tham chiếu hiện tại

- `src/app/api/child/commands/route.ts`
- `src/lib/domain/commands.ts`
- `src/lib/domain/local-date.ts`
- `src/lib/store.tsx`
- `supabase/migrations/202609230001_experience_foundation.sql`

## Gate có thể kiểm chứng

- [ ] PostgreSQL thật: 20 request start đồng thời chỉ một slot/attempt, retry giữ cùng content version.
- [ ] Family/child khác bị từ chối, revoked session fail closed, parent quyền thấp không sửa setting.
- [ ] Client clock/timezone tampering không đổi ngày hay bonus; DST và rollover theo P01 pass.
- [ ] Apply→preflight→rollback local pass; data retention/backward compatibility ghi rõ; demo/cloud cùng semantics quan trọng.

## Kiểm chứng

- Unit + API auth tests; local real SQL transactions/RLS tests; không dùng mock để kết luận RLS.

## Rollback / phục hồi

Không tái dùng secret_quests một hàng/ngày; không làm migration phá dữ liệu hoặc sửa lịch sử thói quen.

## Handoff bắt buộc

- Artifact: `../handoffs/P04.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **Kilo / GPT**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
