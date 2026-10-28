# Security / authentication / authorization audit — 2026-10-27

- Lane: `security-auth`; task `task_4582fa8d4e20`.
- Target: `/home/opc/orca/workspaces/goodhabittracking/emperor`, HEAD `83b118367fead8a79f7918c928e4f92dbdd0590e`.
- Đã đọc `plans/audit-2026-10-27/BRIEF.md`. Chỉ ghi báo cáo này; không sửa ứng dụng, commit, cài dependency, chạy migration, deploy hoặc gọi dịch vụ production.
- Phát hiện đã xác minh: **P0: 0 / P1: 0 / P2: 2 / P3: 0**. Hai lỗi giới hạn ở trình duyệt còn đăng nhập tài khoản phụ huynh; không phải bằng chứng truy cập chéo gia đình hoặc chiếm tài khoản admin.

## SEC-AUTH-01 — P2 — Quản lý phần thưởng bỏ qua khóa PIN phía máy chủ

**Vị trí:** `src/app/api/domain/rewards/route.ts:58`, `:78`, `:80`; `supabase/migrations/202609190001_family_tenancy.sql:403`; `supabase/migrations/202609300004_authoritative_command_hardening.sql:390`.

**Bằng chứng tự kiểm tra:**

- Route xác thực `getParentContext()` rồi ghi `rewards` bằng client của người dùng, nhưng không gọi `requireParentUnlock`. Cả `create`, `update`, `delete` đều có đường đi này, trong khi `src/app/api/domain/activities/route.ts:117` kiểm PIN trước khi ghi và `src/app/api/domain/commands/route.ts:80` kiểm PIN cho duyệt/hoàn quà.
- RLS insert/update/delete của `rewards` chỉ yêu cầu `can_manage_family(family_id)`. Migration hardening thu hồi ghi trực tiếp ở nhiều bảng nhưng không có `rewards` trong danh sách. Đối chiếu toàn bộ các migration không thấy bước thu hồi ghi `rewards` về sau; vì vậy chỉ thêm kiểm tra vào route vẫn để lại đường gọi PostgREST trực tiếp của phiên phụ huynh.
- Đã thực thi route hiện tại với schema Zod thật, `NextResponse.json` thay bằng `Response.json`, mock parent đã xác thực và DB adapter; không cung cấp cookie mở khóa. Cả ba thao tác trả **HTTP 200**, có **3 lần gọi adapter ghi dữ liệu**, và **0 lần kiểm PIN**. Mock `requireParentUnlock` được chuẩn bị để trả 403 nếu route gọi tới; route không sử dụng nó. Đây là kiểm chứng route cô lập, không phải HTTP/DB E2E.
- Đây là chức năng chỉnh sửa của phụ huynh (`src/components/ParentRewardsTab.tsx:53`, `:68`). Xóa phần thưởng còn hủy yêu cầu chưa giao và hoàn sao thông qua trigger `refund_deleted_reward` (`supabase/migrations/202610090030_family_operations_hardening.sql:641`).

**Kịch bản:** gia đình đã đặt PIN, trình duyệt phụ huynh chuyển sang chế độ bé và không có cookie mở khóa hợp lệ. Người sử dụng trình duyệt đó vẫn có phiên Supabase của phụ huynh; gửi POST cùng nguồn đến `/api/domain/rewards` với `{type:'delete', rewardId:<id trong gia đình>}` hoặc sửa giá quà vẫn qua xác thực vai trò và tới lớp ghi dữ liệu. Các thao tác phụ huynh này không cần biết PIN. Thiết bị chỉ có cookie phiên bé riêng không đáp ứng điều kiện khai thác này.

**Đề xuất:** áp dụng `requireParentUnlock` cho quản lý phần thưởng; chuyển thao tác ghi sang server sau kiểm PIN và thu hồi insert/update/delete của `authenticated` trên `rewards`, theo mẫu ghi hoạt động hiện có hoặc RPC bọc dành cho service role. Giữ điều kiện family, khóa hàng và trigger hoàn sao. Regression cần phủ cả ba thao tác khi PIN khóa và quyền gọi trực tiếp PostgREST, ngoài trường hợp có cookie hợp lệ và gia đình chưa đặt PIN.

## SEC-AUTH-02 — P2 — Nút khóa báo đã khóa trước khi cookie mở khóa được xóa, bỏ qua mọi lỗi

**Vị trí:** `src/lib/store.tsx:544`; liên quan `src/app/api/parent-pin/route.ts:58`, `src/lib/security/parent-unlock.ts:70`, `:100`.

**Bằng chứng tự kiểm tra:**

- `lockParent()` đặt `isParentUnlocked=false`, chuyển mode sang `kid`, rồi gọi `void fetch('/api/parent-pin', { method: 'DELETE' }).catch(() => undefined)`. Không chờ phản hồi, không kiểm `response.ok`, không báo lỗi hoặc thử lại.
- Cookie là HttpOnly, chỉ route DELETE xóa bằng phản hồi Set-Cookie. Cookie đã ký vẫn hiệu lực tối đa 2 giờ; kiểm tra phía máy chủ chỉ đối chiếu chữ ký, người dùng, gia đình, phiên bản PIN và hạn dùng.
- Đã trích và thực thi chính callback `lockParent` từ source. Tạo cookie thử nghiệm bằng **hàm `issueParentUnlock` thật**, rồi xác minh bằng **`hasParentUnlock` và `requireParentUnlock` thật**; DB trạng thái PIN được mock thành `{configured:true, version:'test-v1'}` và dùng secret giả cục bộ.
- Với từng trường hợp fetch **trả 503** và **reject lỗi mạng**, kết quả đều là giao diện `kid/locked`, cookie cũ vẫn được `hasParentUnlock` chấp nhận, và `requireParentUnlock` trả `null` (cho phép thao tác nhạy cảm). Không có secret thật hoặc kết nối mạng trong phép thử.

**Kịch bản:** phụ huynh đã mở khóa, nhấn khóa khi kết nối chập chờn, server lỗi hoặc request chưa hoàn tất, rồi giao máy cho bé vì giao diện đã hiện chế độ bé. Cookie còn hiệu lực nên yêu cầu ghi cần PIN có thể tiếp tục được máy chủ chấp nhận khi mạng hồi phục; trạng thái hiển thị không phản ánh việc khóa máy chủ. Lỗi cũng xảy ra ở HTTP 4xx/5xx vì `fetch` vẫn resolve và code không đọc status.

**Đề xuất:** có trạng thái “đang khóa”, chờ DELETE thành công và kiểm `response.ok` trước khi xác nhận đã khóa/giao máy. Khi thất bại, hiển thị lỗi, thử lại có giới hạn và không tuyên bố khóa thành công; chặn luồng thao tác phụ huynh trong lúc chờ. Kiểm thử riêng phản hồi chậm, 403/503 và lỗi mạng; xác nhận lần ghi cần PIN sau khóa thành công bị từ chối 403. Nếu cần thu hồi quyền ngay cả khi không nhận được phản hồi xóa cookie, thiết kế thêm cơ chế thu hồi phía máy chủ; cookie HMAC tự chứa hiện tại không cung cấp khả năng đó.

## Phạm vi và các kiểm soát đã đối chiếu

Đã rà soát 58 file route trong `src/app/api`, các helper thuộc `src/lib/{auth,security,admin,pairing,devices}`, client Supabase, middleware, cấu hình header, `.env.example`/gitignore, `docs/security-privacy.md` và chuỗi 72 migration. Các route được đọc ở mức xác thực, kiểm nguồn gốc, vai trò, dữ liệu đầu vào, cách chọn RPC/service role và các thao tác cần PIN; không coi đây là kiểm thử mọi nhánh nghiệp vụ thanh toán/AI.

| Bề mặt | Bằng chứng và kết quả trong source hiện tại |
| --- | --- |
| Xác thực parent | `parent-context.ts` dùng `auth.getUser()`, đọc membership của user, chỉ nhận `owner/parent/guardian`; không nhận family ID do request tự khai. |
| Admin MFA/RBAC | `admin-access.ts` kiểm user, membership, hạn và thu hồi; mặc định yêu cầu AAL2. Mọi route admin dùng `authorizeAdmin`; ngoại lệ AAL1 ở trang thiết lập MFA cho phép vào màn hình thiết lập, không tự mở quyền ghi API. Bootstrap yêu cầu email đã xác nhận, cửa sổ tối đa 24 giờ và AAL2 cho tạo membership. Các thao tác ghi có audit trước; không thấy đường bypass admin đã xác minh. |
| RLS/read scope | Đã theo dõi thay đổi sau migration gốc: `202610020004` siết private reads; `202610030001` giới hạn caregiver vào projection. Không báo lỗi từ policy cũ khi policy mới đã thay thế. |
| SECURITY DEFINER / PIN wrappers | Đã theo dõi `202610050001`, `202610050002`, `202610090030`, `202610110001`: wrapper `_as` chỉ service role, `act_as_user` đóng với API roles và dùng transaction-local identity. Bản gốc cần PIN bị revoke; CREATE OR REPLACE sau đó được đối chiếu với các ACL đã đặt. Chưa chứng minh trạng thái quyền trong DB đã deploy. |
| Ghép đôi / phiên bé | Token ngẫu nhiên 32 byte; lưu digest; cookie bé HttpOnly/Secure ở production. Các RPC bé đối chiếu token hash, hết hạn, thu hồi, capability và child/family. Exchange cuối cùng chỉ service role; rate limit mỗi nguồn trước, ngân sách chung chỉ áp dụng mã tay, tránh kết luận từ bản migration limiter cũ. |
| CSRF | Kiểm kê route ghi: tất cả route đang hoạt động có `rejectCrossSiteRequest`; ngoại lệ duy nhất `family/code` đã nghỉ và chỉ trả 404. Guard từ chối cross-site/same-site sibling/Origin null. Chấp nhận caller không có Origin/Fetch-Site là hành vi phục vụ server-to-server, không tự coi là bypass browser CSRF. |
| Internal/webhooks | Internal dispatch/reconcile/operations có bearer secret; PayOS kiểm HMAC trên raw data, schema và kết quả DB; webhook email có HMAC và cửa sổ timestamp. Không gọi provider trong audit. |
| CSP/headers | Source middleware tạo nonce từng request, đặt CSP trên request/response; script production không có unsafe-inline, deny framing/object và hạn form/base. Next config đặt HSTS, nosniff, referrer và permissions policy; marketing static build có script hash. Chưa kiểm header thực tế sau adapter/CDN. |
| Marketing API | **Không có `apps/marketing/app/api` trong checkout này.** `apps/marketing` hiện là các module dựng static site và header; không suy diễn một API surface không tồn tại. |
| Secrets | Chỉ `.env.example` là file env được track, không có secret thật trong file mẫu. Script secret scan hiện tại PASS; không in giá trị môi trường hay nội dung secret ra báo cáo. Kết quả không thay thế kiểm secret history hoặc secret store của deployment. |

## Kiểm chứng đã thực thi và giới hạn

1. `node scripts/check-secrets.mjs`: **PASS**, 1.495 file được script liệt kê; scanner bao gồm cả file untracked không bị ignore nên con số không đồng nghĩa tất cả đều tracked. Không phát hiện secret bằng các detector hiện có.
2. Parse **72/72 migration PASS** bằng `@libpg-query/parser` 17.6.10, cùng version trong lockfile. Chỉ kiểm cú pháp, không thực thi SQL, RLS hoặc role grants trên PostgreSQL.
3. Kiểm tra cô lập source bằng Node **26.11.1** + TypeScript **5.9.3**: **26 assertion admin policy PASS**, gồm ma trận role/AAL, thiếu/hết hạn/thu hồi membership và giới hạn bootstrap; **10 assertion origin/bearer PASS**. Dependency stub được giới hạn ở NextResponse/getAppOrigin; logic helper lấy từ checkout audit.
4. Hai phép tái hiện source ở phần phát hiện: ba reward mutations không kiểm PIN; hai kiểu lỗi khóa vẫn giữ cookie được chấp nhận. Dùng compiler/tooling đọc từ `/home/opc/orca/goodhabittracking/node_modules`, không tạo symlink hoặc cài vào checkout. Reward schema chạy với Zod **4.6.6** từ đó, còn lockfile target là **4.6.5**; không coi đây là test suite chạy đúng toàn bộ dependency lock của target.
5. Checkout không có `node_modules`; do đó **không chạy npm test/lint/typecheck/build**, không đọc được guide Next ở `node_modules/next/dist/docs/` của đúng target (lock Next **16.3.8**, checkout lân cận cài **16.4.2**). Không kết luận lỗi API Next từ trí nhớ hay từ bản khác. Các phát hiện trên dựa vào logic ứng dụng, không dựa vào khác biệt phiên bản Next.
6. Không có HTTP/browser E2E, DB runtime test, kiểm provider/production hoặc npm dependency advisory audit trong lane này. Không chạy `verify-live-*`. Phải kiểm trạng thái migration/ACL thực tế và header sau deploy trong một đợt có quyền runtime riêng trước khi tuyên bố production an toàn.

## Hướng sửa và rủi ro còn lại

Ưu tiên đóng đồng thời route và đường ghi DB trực tiếp ở SEC-AUTH-01; chỉ sửa giao diện hoặc chỉ thêm guard vào route sẽ không đủ. Với SEC-AUTH-02, trạng thái khóa cần dựa trên phản hồi xóa cookie, kèm xử lý thất bại rõ ràng. Audit này không sửa hoặc đơn giản hóa mã ứng dụng; file thay đổi duy nhất của lane là báo cáo này, và các thay đổi sẵn có của checkout được giữ nguyên.
