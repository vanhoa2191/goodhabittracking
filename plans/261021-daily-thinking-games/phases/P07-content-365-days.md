# P07 — Biên soạn và kiểm duyệt đủ 365 ngày

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: AGY biên soạn, OpenCode tooling.
Receiver/reviewer: Kilo / GPT.
Phụ thuộc: P06.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Chuyển CSV editorial thành catalog payload/version; 365 main và 365 bonus cho mỗi track phát hành.
2. Chia batch 1–28,29–91,92–182,183–273,274–365; mỗi batch có solver audit, semantic review và receiver acceptance.
3. Bản đầu chỉ `vi`/`age_6_8`/`age_9_12`; 3–5, 13+ và locale khác là milestone sau, không được quảng bá sớm. Reuse generator không miễn kiểm payload.
4. Thay đổi quy tắc/dữ kiện/chiến lược; canonical fingerprint phát hiện đổi skin hoặc xoay đề cũ.
5. Ghi source/license, lời giải, hai mức gợi ý, copy theo hành vi; không sinh live khi trẻ mở app.
6. Manifest production phải báo riêng 24 `type_id` và 96 `variant_pair`; pilot manifest không được tính vào coverage.

## Phạm vi file / artifact

- `catalog version khóa`
- `730 payload/track; tối đa 2.920 nếu bốn track đầy đủ`
- `editorial approval manifest`
- `audit reports năm batch`

## Tham chiếu hiện tại

- `../../../docs/research/2026-10-17-daily-thinking-games-365.csv`
- `src/lib/i18n`
- `src/lib/thinking-games/** (đề xuất)`

## Gate có thể kiểm chứng

- [ ] Không thiếu ID/day/slot; tất cả payload schema-valid và approved; zero design_only/unreviewed trong release manifest.
- [ ] Single-answer đúng/duy nhất; multi-answer acceptance đúng; không có puzzle bất khả giải.
- [ ] Main/bonus khác skill, skill coverage và khoảng cách format đúng; lời thoại mình–bạn cả lỗi/hints/explanations.
- [ ] Đủ mọi locale/age bật; track thiếu phải không được quảng bá/hứa đã hỗ trợ đủ năm.
- [ ] 24 type_id + 96 variant_pair được báo cáo riêng; main/bonus equal=0, different=365; spacing ≥7.
- [ ] Human semantic/age approval có chữ ký; nếu chưa có thì payload không được `approved`.

## Kiểm chứng

- Exhaustive released payload validation + human semantic approval; bộ giải không thay người soát tuổi/ngôn ngữ.

## Rollback / phục hồi

Rollback manifest về version trước; attempts cũ giữ content version để không đổi đáp án giữa ván.

## Handoff bắt buộc

- Artifact: `../handoffs/P07.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **Kilo / GPT**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
