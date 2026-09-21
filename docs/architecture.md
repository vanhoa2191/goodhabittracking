# Architecture

KidHabit Hero là modular monolith Next.js 16 triển khai trên Cloudflare Workers. Browser chỉ giữ UI state và public Supabase client. Mọi quyết định nhạy cảm nằm ở server route hoặc PostgreSQL function.

## Ranh giới

- `src/components`: giao diện trẻ em/phụ huynh, không nắm quyền cấp entitlement.
- `src/lib/store.tsx`: composition state, local demo và query refresh; cloud commands gọi API.
- `src/app/api`: xác thực request, schema validation, rate limit và điều phối RPC.
- `src/lib/domain`: command contracts, state transitions và date-only rules.
- `src/lib/billing`: PayOS signing/provider client chỉ dùng server.
- `supabase/migrations`: tenancy, RLS, pairing, billing, transactions và privacy lifecycle.

## Dòng dữ liệu cloud

1. Supabase SSR đọc user từ cookie.
2. `getParentContext` ánh xạ user sang family membership.
3. Route validate payload strict và gọi RPC.
4. RPC khóa row liên quan, kiểm tra family, thực hiện idempotent transaction.
5. Client refetch canonical state; lỗi không được hiển thị như thành công.

Child device dùng HttpOnly session token. Database chỉ lưu SHA-256 digest và capabilities; API trả đúng một child scope.

## Local/demo

Local mode dùng fixture và localStorage, không gọi mutation cloud. UI luôn hiển thị cảnh báo dữ liệu chỉ nằm trên thiết bị và cung cấp export/import JSON.

## Quyết định bền vững

Xem [`adr/0001-family-tenancy-and-rls.md`](adr/0001-family-tenancy-and-rls.md). Billing và domain rules được biểu diễn bằng migration thay vì logic client để giữ đúng dưới concurrency.
