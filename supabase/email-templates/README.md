# Mẫu email Supabase Auth

Các tệp `.html` ở đây được **sinh ra** từ `src/lib/email/auth-templates.ts` và khung chung `src/lib/email/layout.ts`. Đừng sửa tay: sửa nguồn rồi chạy

```bash
node scripts/build-email-templates.mjs
```

Một test đơn vị (`tests/unit/auth-email-templates.test.ts`) báo đỏ nếu tệp đã commit lệch nguồn.

## Dán vào Supabase

Authentication → Emails → Templates. Với mỗi mẫu, dán **Subject** và nội dung tệp HTML vào ô **Message body (source)**.

| Mẫu trong Supabase | Tệp | Subject | Nội dung |
|---|---|---|---|
| Magic link | `magic-link.html` | Mã đăng nhập KidHabit Hero của bạn | Chỉ mã `{{ .Token }}`, không có liên kết (đăng nhập bằng mã một lần) |
| Confirm sign up | `confirm-signup.html` | Chào mừng đến với KidHabit Hero: xác nhận email | Chỉ mã `{{ .Token }}` |
| Invite user | `invite.html` | Bạn được mời vào KidHabit Hero | Nút `{{ .ConfirmationURL }}` |
| Reset password | `recovery.html` | Khôi phục quyền truy cập KidHabit Hero | Nút `{{ .ConfirmationURL }}` |
| Change email address | `email-change.html` | Xác nhận email mới cho KidHabit Hero | Nút `{{ .ConfirmationURL }}`, hiện `{{ .NewEmail }}` |
| Reauthentication | `reauthentication.html` | Mã xác nhận thao tác trên KidHabit Hero | Chỉ mã `{{ .Token }}` |

Hiện ứng dụng chỉ gửi **Magic link** (đăng nhập bằng mã) và, khi đăng ký bằng email lần đầu, **Confirm sign up**. Bốn mẫu còn lại được soạn sẵn để mọi thư của Supabase đều cùng giao diện nếu sau này bật các luồng đó.

Đặt Authentication → Emails → "OTP length" là 6 và "OTP expiry" là 600 giây để khớp câu "6 chữ số, hết hạn sau 10 phút" trong thư.

## Quy tắc khi sửa

- Chỉ dùng kiểu `style` nội tuyến và bảng; không `<script>`, không ảnh từ xa (nhiều ứng dụng thư chặn ảnh), không liên kết theo dõi.
- Chỉ dùng placeholder Supabase định nghĩa: `{{ .Token }}`, `{{ .ConfirmationURL }}`, `{{ .NewEmail }}`. Test chặn các placeholder khác.
- Không đưa tên bé, nội dung thói quen hay mã ghép nối vào thư (xem `docs/adr/0002-transactional-email-outbox.md`).

Thư vòng đời (chào mừng, sắp hết dùng thử, biên nhận, hỗ trợ, hoàn tiền, hủy gói) do ứng dụng gửi qua Resend, dùng cùng khung `layout.ts` trong `src/lib/lifecycle/email.ts`.
