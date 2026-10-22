# P05 — Ba trò chạy xuyên suốt và một tuần nội dung

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: OpenCode + AGY.
Receiver/reviewer: Kilo / GPT.
Phụ thuộc: P02, P03, P04.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Renderer reusable cho quy luật, không gian/đường đi và trí nhớ; state phải bám contracts đã khóa.
2. Biên soạn bảy ngày main/bonus có payload, đáp án, hints và giải thích trong **pilot manifest riêng** (`isPilotFixture:true`, `minFormatSpacingDays:1`, exception có approver); không dùng manifest production.
3. Nối server admission → selected content → save/resume → finish → return; bonus chờ đủ task/approval.
4. Dùng sandbox/demo hoặc trang fixture riêng; chưa đưa broad flag vào dashboard đang có lane UI.
5. Kiểm khả dụng mobile/tap/keyboard, lỗi mạng, reload và đổi child trong lúc request pending.
6. Bắt buộc P05A sau phase này trước khi làm P06/P07; không tuyên bố 24 format/365 ngày từ 3 format/7 ngày.

## Phạm vi file / artifact

- `src/components/thinking-games/** (đề xuất)`
- `content/thinking-games/pilot/** (đề xuất, chốt vị trí P01)`
- `tests/e2e/thinking-games-pilot.spec.ts (đề xuất)`

## Tham chiếu hiện tại

- `src/components/MorningMascotLetter.tsx`
- `tests/e2e/morning-mascot-letter.spec.ts`
- `tests/e2e/cloud-family-fixture.ts`

## Gate có thể kiểm chứng

- [ ] Có flow browser + server thật bằng test child/family được phép, không chỉ story/mock.
- [ ] Bảy ngày demo không bị gọi là 365 ngày hoàn thiện; game chưa có không được render fake success.
- [ ] Hint/skip/wrong không trừ sao hoặc khóa lượt; finish retry không cấp thêm.
- [ ] Không có serious/critical a11y trong ba trò đầu.

## Kiểm chứng

- Unit rule engine + browser real shared state + local API/SQL; ghi rõ môi trường và giới hạn.

## Rollback / phục hồi

Tắt flag pilot để rollback UI; giữ ledger và attempt, không xóa tiến độ trẻ.

## Handoff bắt buộc

- Artifact: `../handoffs/P05.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **Kilo / GPT**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
