# Billing / database audit — 2026-10-27

**Kết quả: P0 = 0, P1 = 2, P2 = 2, P3 = 0.** Chỉ đọc mã nguồn và chạy probe trong bộ nhớ; không sửa code, không chạy migration, không gọi PayOS/email/Supabase thật, không commit/deploy. File được tạo duy nhất bởi lane này là báo cáo này.

## Phát hiện

### BDB-01 — P1 — Xóa gia đình để lại checkout có thể nhận tiền nhưng không thể settlement

- **Vị trí:** `supabase/migrations/202609300007_account_lifecycle_integrity.sql:102-109`; FK tại `supabase/migrations/202609190001_family_tenancy.sql:170`; settlement cuối cùng tại `supabase/migrations/202610110001_pro_plus_and_addons.sql:220-224`; route tại `src/app/api/family/route.ts:23-28`.
- **Bằng chứng tự kiểm tra:** định nghĩa cuối của `delete_owned_family` chỉ tối giản metadata/URL/QR rồi xóa family; không kiểm tra đơn `PENDING`, không gọi hủy/reconcile provider, không tạo đường xử lý khoản tiền đến muộn. FK của `payment_orders.family_id` là `ON DELETE SET NULL`. Settlement kiểm tra `family_id is null` và trả `owner_missing` trước khi ghi event hoặc đổi đơn sang `PAID`. Wrapper PIN gọi chính hàm này; không có lớp xử lý checkout trước lời gọi.
- **Kịch bản:** mở QR trên một tab, xóa gia đình trên tab khác khi link còn hiệu lực, rồi chuyển tiền theo QR; hoặc tiền đã đến provider nhưng webhook đến sau thao tác xóa. Đơn vẫn `PENDING`, family bị null, webhook trả lỗi mismatch. Reconciler cũng không cứu được: `src/lib/billing/payos-reconcile.ts:109-117` gọi cùng RPC và chỉ coi `activated`/`duplicate`/`order_already_paid` là thành công. Không có bản ghi settlement hay tác vụ hoàn tiền tương ứng cho khoản đã nhận; route tạo billing case còn yêu cầu family/membership tồn tại.
- **Đề xuất:** chặn xóa khi có checkout chưa xác định kết quả; reconcile rồi hủy từng link bằng xác nhận từ provider trước khi xóa. Đồng thời có ledger/tác vụ xử lý thanh toán đến muộn độc lập với family còn tồn tại. Cần giữ thứ tự khóa order → family và kiểm thử cuộc đua deletion/webhook.
- **Mức xác minh:** chứng minh bằng luồng mã và FK cuối cùng; chưa thực thi SQL/PayOS.

### BDB-02 — P1 — Refund thuê bao hoàn tất nhưng toàn bộ thời gian thuê bao vẫn còn hiệu lực

- **Vị trí:** `supabase/migrations/202610110001_pro_plus_and_addons.sql:740-767`; nhánh hủy riêng tại dòng `777-785`; hàm kiểm entitlement tại dòng `404-424`.
- **Bằng chứng tự kiểm tra:** trong `manual_refund_confirmed`, RPC chỉ thu hồi entitlement với hai loại add-on (`ai_addon_monthly`, `printables`), sau đó reverse commission và revoke founding/promo claim. Không có cập nhật `user_subscriptions` cho bất kỳ gói tháng/năm/promo nào. Câu cập nhật subscription duy nhất của RPC nằm trong nhánh `subscription_cancelled`, mà nhánh này chỉ chấp nhận **case loại cancellation**, không phải refund. Không tìm thấy trigger refund khác thu hồi thời gian thuê bao trong chuỗi migration. Entitlement vẫn chỉ dựa vào subscription active và ngày hết hạn, không xét refund.
- **Kịch bản:** gia đình mua `pro_plus_yearly_b1g1` nhận hai năm; finance chuyển lại tiền và hoàn tất refund theo `docs/runbooks/lifecycle-and-refunds.md:37-41`. Hệ thống trả `updated`, giải phóng promo slot, nhưng gia đình vẫn giữ Pro Plus hai năm. Gói năm/tháng thông thường cũng giữ nguyên thời hạn; founding refund chỉ mất quyền từ claim, vẫn giữ quyền Pro cơ sở. Runbook hiện không có bước yêu cầu cancellation riêng để đóng phần quyền này.
- **Đề xuất:** trong cùng transaction xác nhận refund, hoàn tác phần thời gian/quyền mà đơn đã cấp, bảo toàn các lần mua khác và xử lý retry idempotent. Không chỉ hủy toàn bộ subscription nếu đã có renewal hợp lệ khác. Nếu sản phẩm cố ý hoàn tiền và giữ quyền, cần ghi chính sách đó rõ ràng và hiển thị cho finance; hiện đường thao tác hoàn tất refund không nói rõ điều này.
- **Mức xác minh:** đọc định nghĩa cuối cùng, các trigger liên quan và runbook; chưa thực thi database. Hành vi giữ quyền được chứng minh từ mã; đánh giá rủi ro dựa trên refund thông thường cần hoàn tác quyền đã mua.

### BDB-03 — P2 — Dispatcher báo gửi thành công ngay cả khi lưu kết quả thất bại

- **Vị trí:** `src/app/api/internal/lifecycle/dispatch/route.ts:60-66`, tương tự nhánh thất bại tại dòng `68-74`.
- **Bằng chứng tự kiểm tra:** kết quả `{ data, error }` của `finish_lifecycle_message` bị bỏ qua. PostgREST có thể trả lỗi trong object thay vì throw; RPC cũng có thể trả `false` khi không cập nhật được message. Cả hai trường hợp đều bị tính `sent += 1` và endpoint trả HTTP 200 / `success: true`.
- **Probe đã thực thi:** bundle đúng route bằng `esbuild` với `write:false`, mock provider chấp nhận, mock `finish_lifecycle_message` trả `{data:null,error:{message:'simulated database outage'}}`. Lần gọi đầu trả `{"success":true,"sent":1,"failed":0,"correlationId":"probe"}`. Khi mock claim trả lại message chưa được lưu, lần gọi thứ hai trả cùng kết quả; tổng `providerSends=2`, `finishWrites=2`. Probe không dùng network, không ghi file; việc claim lại được mô phỏng, không phải kết quả chạy PostgreSQL.
- **Kịch bản:** provider đã nhận email nhưng DB không lưu `sent`. Monitoring nhận báo cáo thành công; message còn processing được claim lại sau lease 10 phút (`202610090030_family_operations_hardening.sql:881-894`). Nhánh Brevo không truyền dedupe key cho provider (`src/lib/lifecycle/email.ts:153-164`), nên phía ứng dụng phát sinh yêu cầu gửi lại cùng email mà không có lớp chống lặp trong request. Lỗi ghi trạng thái thất bại cũng không được báo riêng.
- **Đề xuất:** chỉ tính hoàn tất khi RPC không lỗi và trả `true`; báo riêng lỗi persistence/uncertain delivery, giữ provider message ID để đối soát, không tự coi lỗi sau provider acceptance là một lần chưa gửi. Kiểm thử cả `error` lẫn `data:false`.

### BDB-04 — P2 — Lease outbox không có token nên worker cũ ghi đè kết quả của lần claim mới

- **Vị trí:** `supabase/migrations/202609280001_lifecycle_revenue_operations.sql:223-250`; claim cuối tại `supabase/migrations/202610090030_family_operations_hardening.sql:881-900`; provider fetch tại `src/lib/lifecycle/email.ts:155-164,170-183`.
- **Bằng chứng tự kiểm tra:** claim lấy lại processing quá 10 phút và tăng `attempts`, nhưng không trả token/attempt dùng để xác nhận quyền sở hữu lease. `finish_lifecycle_message` chỉ kiểm `id` và `status='processing'`, không kiểm `locked_at`, attempt hoặc worker token. Dispatcher gọi finish chỉ với ID. Hai provider fetch không đặt timeout/abort signal, nên không có giới hạn trong mã bảo đảm lần gửi cũ đã dừng trước khi lease được lấy lại.
- **Kịch bản race xác định từ SQL:** A claim attempt 1 rồi chậm; sau 10 phút B claim attempt 2 và đang gửi; A trả về lỗi và gọi finish failed. Điều kiện UPDATE vẫn đúng với row do B đang xử lý, nên A đổi row sang failed và xóa lease của B. B gửi thành công nhưng finish không cập nhật được vì status không còn processing; kết quả false lại bị bỏ qua theo BDB-03. Sau backoff, C có thể gửi lần nữa. Chiều ngược lại, A có thể ghi sent/provider ID của lần cũ lên lease của B.
- **Đề xuất:** phát token mỗi lần claim, yêu cầu token đó trong finish và UPDATE bằng compare-and-set; đặt timeout provider ngắn hơn lease và có chính sách đối soát trường hợp provider đã nhận nhưng kết quả chưa rõ. Dedupe key lúc enqueue chỉ chống tạo thêm row, không khóa được các lần gửi lại cùng row.
- **Mức xác minh:** kiểm tra chữ ký/điều kiện UPDATE và thứ tự trạng thái ở định nghĩa cuối; chưa chạy cuộc đua bằng hai kết nối database.

## Phạm vi và bằng chứng kiểm tra

- Đã đọc brief và kiểm tra checkout create/status/webhook/reconcile, admin billing case/refund, affiliate/referral routes; các helper billing/referral/lifecycle/Supabase; đường entitlement, cloud sync, identity/reset và các action store tiêu biểu. Không khẳng định đã kiểm thử động mọi action store.
- Rà soát cấu trúc **toàn bộ 72 migration**, gồm thứ tự manifest, định nghĩa thay thế, security definer/search path; đọc sâu chuỗi billing/referral/affiliate/founding/promo/add-on và lifecycle. Đã dùng `@libpg-query/parser` sẵn có để parse từng file: **72/72 không lỗi cú pháp**. `supabase/schema.sql` khớp chính xác danh sách tên migration đã sort; không thiếu/lặp/sai thứ tự trong manifest.
- Quét định nghĩa hàm cuối theo tên thu được 132 tên; không thấy hàm SECURITY DEFINER trong tập quét thiếu `SET search_path`. Đây là kiểm tra nguồn, không phải chứng nhận ACL/RLS runtime hoặc đầy đủ theo từng overload.
- Parse **16/16 rollback** không lỗi cú pháp; **56/72 migration không có file rollback cùng tên**, gồm các migration tiền mới. Không tính riêng việc thiếu down migration thành bug vì có dữ liệu ledger cần giữ và deployment docs cho phép rollback Worker. Tuy nhiên chưa có bằng chứng chạy rollback hoặc chứng minh app cũ tương thích đầy đủ với schema mới; không được coi parse xanh là rollout/rollback xanh.
- Đã đọc guide Next.js được cài trong `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` và `03-api-reference/04-functions/cookies.md`; không dựa vào quy ước Next.js cũ để kết luận.
- Probe dispatcher trong bộ nhớ đã chạy và xác nhận BDB-03 như output ở trên. Không chạy suite build/test nặng để tôn trọng giới hạn một tiến trình dùng chung; không chạy script `verify-live-*`, `test:sql`, SQL migration/preflight/rollback, browser hay provider thật.

## Những cơ chế đã thấy đúng và giới hạn còn lại

- Settlement khóa order rồi family, kiểm amount/description, chống lặp theo provider reference; add-on được settle trước nhánh subscription nên không đổi gói. Refund có unique index một xác nhận cho mỗi order và khóa order/case; retry add-on refund không trừ thêm lần nữa.
- Checkout năm dùng khóa attribution identities và family, tái sử dụng reservation trước kiểm quota promo; cancellation thông thường đòi provider xác nhận chưa có tiền trước khi đổi local status. Giá cuối TS/SQL đã đọc khớp Solo 49k/399k, Pro 69k/590k, Plus 79k/790k, promo 690k/790k, AI 29k, printables 99k.
- Founding slots dùng khóa offer và đếm active claims. Promo cho phép nhiều reservation khi còn suất, sau đó **cố ý** honor mọi đơn đã trả kể cả vượt số suất; hành vi này có comment và scenario `slot_overfill_honoured`, nên không báo như race ngoài ý muốn. Referral không cộng thêm giảm giá vào promo và add-on không có commission/discount.
- Các ACL thực tế, PL/pgSQL runtime, khóa/race trên PostgreSQL, thứ tự triển khai app/schema và live webhook/refund vẫn chưa được chạy ở lane read-only này. Cần test hồi quy riêng cho bốn phát hiện trước khi sửa/đóng; báo cáo này không phải phê duyệt production.
