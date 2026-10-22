# P02 — UX, xưng hô và điều khiển phụ huynh

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: AGY Gemini 3.8 Flash.
Receiver/reviewer: OpenCode / Kilo / GPT.
Phụ thuộc: P01.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Vẽ flow invitation → example → play → hint → explanation → return; main/bonus không tự chạy nối.
2. Liệt kê loading/error/session revoked/offline/pending approval/expired/no age/no timezone/feature off.
3. Thiết kế parent cutoff, giờ nghỉ, pause, preview lịch nhiệm vụ; cảnh báo cấu hình không thể nhận thưởng trước giờ ngủ.
4. Soạn copy mình–bạn theo mọi state; locale khác dùng vai ngang hàng, độ tuổi lớn dùng lời ngắn không trẻ con.
5. Mỗi iteration hình ảnh chạy visual-verdict trước edit tiếp và lưu JSON đúng scope; chưa có screenshot thì ghi chưa visual-validated.

## Phạm vi file / artifact

- `ux-flow.md`
- `copy-inventory.md`
- `parent-settings-spec.md`
- `visual-verdicts/`

## Tham chiếu hiện tại

- `src/components/KidDashboard.tsx`
- `src/components/MorningMascotLetter.tsx`
- `src/lib/i18n/kid-praise-copy.ts`
- `src/lib/age-band.ts`

## Gate có thể kiểm chứng

- [ ] Không có dead end; có exit/pause/mute/reduced motion/tap thay drag và keyboard.
- [ ] Mọi câu thoại trò chơi tiếng Việt dùng mình–bạn; không dùng khen thông minh, FOMO hoặc phạt nghỉ.
- [ ] Mọi parent setting có quyền chỉnh, effective_at và thông báo theo contracts.
- [ ] Flow 375px và desktop được review với trạng thái lỗi, không chỉ màn thắng.

## Kiểm chứng

- Copy inventory review; walkthrough từng state; visual verdict và a11y checklist thực tế.

## Rollback / phục hồi

Không sửa shared dashboard trong phase UX; sản phẩm mock và contract được bàn giao cho P08.

## Handoff bắt buộc

- Artifact: `../handoffs/P02.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **OpenCode / Kilo / GPT**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
