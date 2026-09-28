# Architecture

KidHabit Hero phát hành hai artifact độc lập từ cùng repository: website giới thiệu tĩnh trên Cloudflare Pages và ứng dụng modular monolith Next.js 16 trên Cloudflare Workers. Browser chỉ giữ UI state và public Supabase client. Mọi quyết định nhạy cảm nằm ở Worker route hoặc PostgreSQL function.

## Ranh giới

- `src/components`: giao diện trẻ em/phụ huynh, không nắm quyền cấp entitlement.
- `src/lib/store.tsx`: composition state, local demo và query refresh; cloud commands gọi API.
- `src/app/api`: xác thực request, schema validation, rate limit và điều phối RPC.
- `src/lib/domain`: command contracts, state transitions và date-only rules.
- `src/lib/billing`: PayOS signing/provider client chỉ dùng server.
- `supabase/migrations`: tenancy, RLS, pairing, billing, transactions và privacy lifecycle.
- `apps/marketing`: nội dung bán hàng và tài liệu công khai, không import auth, API, PayOS hoặc Supabase.
- `dist/marketing`: artifact HTML/CSS/JS tĩnh do `npm run build:marketing` tạo, không commit vào Git.

Website marketing sở hữu canonical, sitemap, robots và nội dung công khai. App origin luôn `noindex`, sở hữu PWA, đăng nhập, QR, checkout, callback và API. Link mua hàng đi từ Pages tới `/checkout?plan=...` trên app origin; entitlement vẫn gắn với `family_id`, không gắn với email.

## Dòng dữ liệu cloud

1. Supabase SSR đọc user từ cookie.
2. `getParentContext` ánh xạ user sang family membership.
3. Route validate payload strict và gọi RPC.
4. RPC khóa row liên quan, kiểm tra family, thực hiện idempotent transaction.
5. Client refetch canonical state; lỗi không được hiển thị như thành công.

Child device dùng HttpOnly session token. Database chỉ lưu SHA-256 digest và capabilities; API trả đúng một child scope.

## Demo

Sản phẩm thật mặc định đồng bộ đám mây, không cho người dùng chọn chế độ lưu cục bộ. Demo dùng dữ liệu mẫu và lưu thay đổi trong sessionStorage của tab để giữ trạng thái khi tải lại; khi thiết lập gia đình hoặc đăng nhập, dữ liệu demo bị xóa và không trộn với dữ liệu thật.

## Ngôn ngữ thích ứng

Server chọn một trong chín locale theo thứ tự: lựa chọn người dùng đã lưu, quốc gia từ Cloudflare, `Accept-Language`, rồi tiếng Anh. Lựa chọn thủ công được lưu đồng thời vào cookie và localStorage; cookie là nguồn ưu tiên khi hai bản ghi lệch nhau để HTML, metadata SSR và giao diện sau hydration luôn cùng ngôn ngữ.

## Quyết định bền vững

Xem [`adr/0001-family-tenancy-and-rls.md`](adr/0001-family-tenancy-and-rls.md). Billing và domain rules được biểu diễn bằng migration thay vì logic client để giữ đúng dưới concurrency.
