# Tách Homepage Marketing và Ứng dụng KidHabit

**Trạng thái:** Chờ chủ sản phẩm duyệt  
**Ngày:** 2026-09-28  
**Phạm vi:** Một repository, hai bề mặt triển khai độc lập  

## 1. Mục tiêu

Tách KidHabit thành hai bề mặt rõ trách nhiệm để homepage dễ phát triển như một trang bán hàng tĩnh, trong khi ứng dụng giữ toàn bộ đăng nhập, dữ liệu gia đình, thanh toán, QR, quản trị và PWA.

Kết quả mong muốn:

- Khách mới vào homepage thấy ngay selling point, cách hoạt động, bảng giá và nút chọn từng gói.
- Khách bấm chọn gói chỉ đăng nhập một lần, sau đó tiếp tục đúng gói đã chọn và thanh toán PayOS.
- Phụ huynh đã đăng nhập đi thẳng vào giao diện phụ huynh trên app.
- Thiết bị trẻ đã ghép đi thẳng vào giao diện trẻ trên app.
- Homepage không chứa secret, API quản trị, auth client, service worker hoặc dữ liệu gia đình.
- App có thể phát triển thành PWA và sau này được bọc thành ứng dụng iOS/Android mà không phải viết lại homepage.

## 2. Kiến trúc được chọn

### Domain tạm

| Bề mặt | Domain tạm | Vai trò |
|---|---|---|
| Homepage | `https://kidhabit-home.vanhoa2191.workers.dev` | HTML/CSS/JS tĩnh, SEO, selling point, bảng giá, tài liệu công khai |
| App | `https://goodhabittracking.vanhoa2191.workers.dev` | Đăng nhập, app phụ huynh/trẻ, checkout, API, PayOS, QR, admin, PWA |

Tên Pages là tên mong muốn và phải được kiểm tra khả dụng khi tạo project. Domain thật sau này chỉ thay origin cấu hình, không thay luồng nghiệp vụ.

### Mô hình triển khai

```text
Khách mới
  -> Homepage tĩnh
     -> xem giá và chọn gói
        -> App /checkout?plan=<plan-id>
           -> đăng nhập Google nếu cần
           -> quay lại đúng gói
           -> tạo đơn PayOS
           -> webhook xác thực
           -> kích hoạt gói cho gia đình

Phụ huynh quay lại
  -> App
     -> giao diện phụ huynh

Trẻ đã ghép thiết bị
  -> App
     -> giao diện trẻ
```

Không tạo `api.` domain riêng ở giai đoạn này. Toàn bộ API tiếp tục cùng origin với app để tránh CORS, chia sẻ cookie và CSRF phức tạp không cần thiết.

## 3. Homepage và selling point

Homepage là trang bán hàng, không mô tả cách chính trang web được tổ chức. Xóa thông điệp “Xem đúng phần bạn cần, không phải đọc một trang thật dài”.

Khối selling point thay thế tập trung vào kết quả cho ba mẹ:

1. **Biết nên rèn gì cho con**  
   Gợi ý thói quen phù hợp theo độ tuổi và mục tiêu gia đình.
2. **Giao việc rõ, con dễ làm**  
   Mỗi nhiệm vụ có hướng dẫn, thời điểm và phần thưởng cụ thể.
3. **Thấy tiến bộ mỗi ngày**  
   Ba mẹ theo dõi việc hoàn thành, duyệt kết quả và ghi nhận nỗ lực của con.

Homepage giữ các trang public cần thiết: bảng giá, khung thói quen, lộ trình, hướng dẫn sử dụng, chính sách và hỗ trợ sau khi nội dung được duyệt.

## 4. Bảng giá và hành trình thanh toán

### Bảng giá trên homepage

Hiển thị trực tiếp ba gói trả phí:

- Gói Cơ bản: 29.000 VNĐ/tháng, tối đa 1 bé.
- Gói Cao cấp tháng: 49.000 VNĐ/tháng, không giới hạn số bé theo contract hiện hành.
- Gói Cao cấp năm: 399.000 VNĐ/năm.

Mỗi thẻ gói có:

- tên và nhãn gói;
- giá và chu kỳ;
- giới hạn số bé;
- ba quyền lợi quan trọng nhất;
- nút `Chọn gói này` gắn chính xác `plan-id`;
- thông tin “7 ngày trải nghiệm, không cần thẻ tín dụng, không tự động gia hạn” khi đúng với chính sách sản phẩm hiện hành.

Không dùng một nút chung “Xem quyền lợi và thanh toán” rồi mở thêm bảng giá. Khách chọn gói ngay trên homepage.

### Checkout an toàn trên app domain

Nút trên homepage điều hướng top-level tới:

```text
https://goodhabittracking.vanhoa2191.workers.dev/checkout?plan=solo_monthly
https://goodhabittracking.vanhoa2191.workers.dev/checkout?plan=monthly
https://goodhabittracking.vanhoa2191.workers.dev/checkout?plan=yearly
```

Luồng checkout:

1. App kiểm tra `plan` chỉ thuộc allowlist ba gói bán.
2. Nếu chưa đăng nhập, app lưu ý định mua trong cùng app origin và bắt đầu Google OAuth.
3. Sau OAuth, khách quay lại `/checkout` với đúng gói đã chọn.
4. Nếu tài khoản chưa có gia đình, app tạo/hoàn tất family setup tối thiểu trước khi tạo đơn.
5. App hiển thị tóm tắt gói, số tiền và nút tạo thanh toán.
6. API app tạo đơn PayOS gắn với `family_id` và `user_id`.
7. QR, ngân hàng thụ hưởng, chủ tài khoản, số tài khoản, số tiền và nội dung chuyển khoản hiển thị trong checkout.
8. Webhook PayOS là nguồn xác nhận thanh toán; redirect trình duyệt chỉ để hiển thị trạng thái.
9. Khi webhook hợp lệ, entitlement được kích hoạt cho gia đình và app cập nhật trạng thái.

Khách vẫn bắt đầu thanh toán ngay từ homepage, nhưng phần xử lý tiền nằm ở app domain có đăng nhập. Không gọi API thanh toán xuyên domain và không nhúng secret vào HTML marketing.

## 5. Chủ sở hữu subscription

Subscription không gắn duy nhất vào email.

| Trường | Vai trò |
|---|---|
| `family_id` | Chủ thể nhận quyền lợi gói; unique entitlement theo schema hiện tại |
| `user_id` | Tài khoản đã mua hoặc quản trị lần cập nhật gói gần nhất |
| Email trong auth | Đăng nhập, biên nhận, thông báo và chăm sóc khách hàng |

Quy tắc:

- Đổi email không làm mất gói vì entitlement được tra bằng `family_id`.
- Thành viên khác trong cùng gia đình dùng quyền lợi theo role và policy, không tạo subscription mới.
- Email không được dùng làm khóa liên kết thanh toán vì email có thể đổi, khác chữ hoa/thường hoặc bị chuyển quyền.
- Admin tìm kiếm khách hàng bằng email được, nhưng mọi mutation phải ghi vào subscription theo ID chuẩn.

Contract này đã phù hợp với schema hiện tại: `payment_orders` lưu cả `family_id` và `user_id`; webhook upsert `user_subscriptions` theo unique `family_id`.

## 6. Phân quyền route

### Homepage sở hữu

- `/`
- `/pricing`
- `/framework`
- `/roadmaps`
- `/docs`
- `/privacy`
- `/terms`
- `/contact`
- canonical, Open Graph, sitemap và robots public

### App sở hữu

- `/`
- `/checkout`
- `/invite/caregiver`
- `/admin`
- toàn bộ `/api/*`
- `/manifest.webmanifest`, `/sw.js`, offline shell và PWA assets

Root app không còn là sales page. Root app chỉ quyết định parent, child, caregiver, demo hoặc cổng đăng nhập/nhập mã cho người chưa có session.

## 7. Auth, QR, lời mời và callback

- Google OAuth phải bắt đầu và kết thúc trên app origin để PKCE/session không bị tách giữa hai domain.
- Supabase allowlist chứa app root và các callback app cần thiết; giữ legacy origin trong cửa sổ chuyển đổi.
- PayOS return/cancel URL và webhook đều thuộc app origin.
- QR và caregiver invite mới luôn sinh URL app origin.
- QR cũ từ legacy origin được hỗ trợ trong cửa sổ chuyển đổi bằng manual code hoặc allowlist chính xác; không dùng wildcard origin.
- Homepage chỉ điều hướng sang app, không đọc cookie đăng nhập và không fetch API có credential.

## 8. SEO, PWA và cửa hàng ứng dụng

- Homepage là canonical owner và được index.
- App đặt `noindex`; các route API/admin không xuất hiện trong sitemap.
- Manifest và service worker chỉ được phát hành trên app domain.
- PWA cũ theo origin cũ không tự chuyển sang origin mới. Trong phương án tạm này, app giữ nguyên origin nên không mất PWA/session hiện tại.
- App Store và Play Store là phase riêng sau khi PWA ổn định. Có thể dùng Capacitor/native shell, package identity và verified app links; không nằm trong lần tách domain này.

## 9. Cấu hình

```text
NEXT_PUBLIC_MARKETING_URL=https://kidhabit-home.vanhoa2191.workers.dev
NEXT_PUBLIC_APP_URL=https://goodhabittracking.vanhoa2191.workers.dev
NEXT_PUBLIC_DEPLOY_TARGET=marketing|app
```

- Homepage build không nhận Supabase/PayOS/service-role secrets.
- App build/runtime giữ cấu hình Supabase, PayOS, pairing và lifecycle hiện tại.
- Production build fail nếu origin bắt buộc sai hoặc không dùng HTTPS.
- Không lấy redirect đích từ request host chưa được xác thực.

## 10. Migration không gián đoạn

1. Tạo homepage tĩnh và deploy lên Pages tạm, chưa thay app hiện tại.
2. Thêm `/checkout` vào app và kiểm thử login-resume-plan-PayOS.
3. Đổi toàn bộ CTA homepage sang app checkout, kiểm thử ba gói.
4. Chuyển public metadata và canonical sang homepage; app thành `noindex`.
5. Di chuyển public docs/legal sang homepage hoặc giữ redirect tương thích có chủ đích.
6. Khi homepage đã xanh, đổi root app sang app-only entry.
7. Giữ payment return, webhook, QR và invite cũ hoạt động trong cửa sổ chuyển đổi.
8. Quan sát lỗi auth, payment, QR, PWA và analytics trước khi gỡ compatibility.

## 11. Rollback

- App Worker hiện tại luôn giữ một version đã chứng nhận để redeploy.
- Homepage Pages có deployment độc lập; lỗi homepage không làm hỏng app/API.
- Nếu checkout mới lỗi, CTA tạm quay về pricing modal cũ trên app.
- Không rollback database khi chỉ rollback giao diện/domain.
- Không đổi pairing secret, Supabase project hoặc PayOS credentials trong cùng đợt tách domain.

## 12. Các phương án đã cân nhắc

### A. Static Pages + App Worker, được chọn

Ưu điểm: tách trách nhiệm rõ, homepage nhẹ, app giữ API cùng origin, deploy và rollback độc lập.  
Nhược điểm: cần quản lý hai pipeline và liên kết chéo chính xác.

### B. Hai bản Next.js/Worker

Ưu điểm: tái sử dụng component hiện tại nhanh hơn.  
Nhược điểm: homepage vẫn mang runtime/dependency không cần thiết, dễ vô tình phát hành API/PWA trên marketing origin.

### C. Một Worker định tuyến theo hostname

Ưu điểm: một artifact.  
Nhược điểm: vẫn kết dính release, khó rollback riêng và không đạt mục tiêu “đừng gom thành một cục”.

## 13. Tiêu chí nghiệm thu

- [ ] Homepage HTML có selling point đúng trải nghiệm KidHabit và không còn câu nói về độ dài trang.
- [ ] Homepage hiển thị đủ ba gói, mỗi gói có nút chọn riêng.
- [ ] Khách chưa đăng nhập chọn gói, đăng nhập Google và quay lại đúng gói mà không chọn lại.
- [ ] PayOS hiển thị đúng ngân hàng, chủ tài khoản, số tài khoản, số tiền, nội dung và QR.
- [ ] Webhook hợp lệ kích hoạt đúng `family_id`; replay không kích hoạt hai lần.
- [ ] Đổi email không làm mất entitlement gia đình.
- [ ] Parent, child, caregiver và admin vào đúng app surface.
- [ ] Homepage không có app secrets/API/PWA; app không bị index.
- [ ] Desktop và mobile không có popup trôi, tràn ngang hoặc CTA dưới 44px.
- [ ] Cả hai deployment có smoke test, health check và rollback độc lập.

## 14. Ngoài phạm vi

- Mua gói không cần tài khoản.
- Thanh toán quốc tế hoặc nhà cung cấp khác PayOS.
- Tự động gia hạn subscription.
- Viết app native hoặc đưa ngay lên App Store/Play Store.
- Chia API sang domain thứ ba.
