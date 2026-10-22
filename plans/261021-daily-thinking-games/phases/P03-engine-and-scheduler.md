# P03 — Engine và bộ kiểm định lịch

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: OpenCode.
Receiver/reviewer: GPT / Kilo.
Phụ thuộc: P01.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Xây module TypeScript thuần tách game rules khỏi React; registry cho 24 dạng có capability/age/hints/checker.
2. Định nghĩa puzzle payload/seed/content version, solver hoặc valid-solution predicate, canonical fingerprint theo `content-schema-v1`.
3. Làm scheduler đọc manifest đã duyệt: stable assignment, main/bonus khác skill, không refresh reroll, đúng track/locale.
4. Viết validator cho số lượng/ngày/ID/format/age/locale/duplicate; báo riêng 24 `type_id` và 96 `variant_pair`; không coi title/seed khác là đề khác.
5. Hỗ trợ pilot manifest có `isPilotFixture`/`minFormatSpacingDays` và exception rõ; production validator phải từ chối pilot.
6. Prototype ba rule engines trước; giữ adapter mở để P06 bổ sung 21 cơ chế, không tuyên bố renderer đủ ở phase này.

## Phạm vi file / artifact

- `src/lib/thinking-games/** (đề xuất)`
- `tests/unit/thinking-games/** (đề xuất)`
- `scripts/check-thinking-games-content.mjs (đề xuất)`

## Tham chiếu hiện tại

- `../../../docs/research/2026-10-17-daily-thinking-games-365.csv`
- `src/lib/domain/local-date.ts`
- `package.json`

## Gate có thể kiểm chứng

- [ ] Cùng input/version cho cùng output; không đọc Date.now/random không seed trong assignment.
- [ ] Solver xác nhận đề single-answer duy nhất; multi-solution checker nhận mọi lời giải hợp lệ.
- [ ] Registry có metadata đủ 24 format, ba implementation đầu pass; chưa implement phải fail unavailable rõ.
- [ ] Calendar checker chứng minh 365/730, đủ skill và khoảng cách tối thiểu đã khóa.

## Kiểm chứng

- Unit/property-like loop dùng Vitest hiện có; kiểm seed fixtures và canonicalization không gộp nhầm đề khác.

## Rollback / phục hồi

Không thêm dependency; upstream code/data chỉ nhập sau source/license ledger và pin SHA.

## Handoff bắt buộc

- Artifact: `../handoffs/P03.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **GPT / Kilo**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
