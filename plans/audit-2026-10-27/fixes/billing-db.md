# Billing/database fixes — 2026-10-27

## Kết quả

Đã độc lập xác nhận BDB-01..04 trong định nghĩa migration/route cuối cùng và sửa cả bốn. **Kiểm thử mục tiêu: 8 file / 91 tests PASS; TypeScript PASS; ESLint phạm vi sửa PASS; SQL và PL/pgSQL parse PASS.** Không áp dụng migration, scenario hoặc rollback lên bất kỳ DB nào; không gọi PayOS/email/Supabase thật, không commit/push/deploy.

## Quyết định và phạm vi được duyệt

- BDB-01: chặn xóa family có đơn PENDING; tiền đến sau hủy/xóa phải được ghi vào hàng đợi có thể xử lý độc lập family.
- BDB-02: coordinator duyệt ghi before/after grant cho settlement mới, replay các lần mua còn hiệu lực khi refund, và fail-closed đối với lịch sử thiếu provenance hoặc chuỗi đã thay đổi ngoài settlement/refund. **Không backfill lịch sử trong lane này.** Case giữ open với `subscription_grant_review_required`.
- Coordinator duyệt thêm các route `src/app/api/internal/lifecycle/dispatch/route.ts`, `src/app/api/payment/webhook/route.ts`, `src/app/api/admin/billing-cases/route.ts`, rollback mới theo thư mục thực tế `supabase/rollbacks/`, và entry của lane trong `supabase/schema.sql`. Không sửa migration cũ hoặc migration của lane khác.

## Theo phát hiện

| ID | Xác nhận độc lập | Sửa và bằng chứng | Rủi ro / giới hạn còn lại |
| --- | --- | --- | --- |
| BDB-01 | `delete_owned_family` minimised rồi xóa mà không kiểm PENDING; FK order SET NULL; settlement trả owner_missing/cancelled trước ledger. | Migration mới khóa order → family, kiểm lại PENDING sau family lock trước minimisation/deletion; route trả 409 với mã và hướng dẫn reconcile/hủy. Thanh toán hợp lệ của cancelled/ownerless order tạo `billing_late_payments` needs_review, unique provider reference, không chứa payload thô; webhook ack `late_payment_recorded`, phát tín hiệu vận hành và không cấp quyền. Test API deletion/webhook PASS; fixture SQL chuẩn bị kiểm guard, duplicate và amount mismatch. | Pending phải reconcile/hủy qua quy trình provider hiện có. Queue cần finance đối soát/hoàn tiền rồi resolve; đơn gốc có thể vẫn CANCELLED/PENDING, ledger độc lập là bản ghi khoản đã nhận. Race PostgreSQL và provider chưa chạy. |
| BDB-02 | Nhánh refund chỉ thu hồi add-on, không sửa subscription. | `subscription_order_grants` ghi snapshot trước/sau theo thứ tự settlement; projection dùng chung cho settle và replay. Refund loại đúng đơn, replay các đơn sau bằng plan và thời điểm mua gốc, kiểm continuity + current state trước ghi; revoke marker và case finality chống trừ lại. Thao tác nằm cùng transaction với reverse commission, revoke offer và đóng case. Thiếu provenance/chuỗi bị sửa ngoài trả review-required và không đóng case. Test API refund PASS; fixture có tháng/năm/B1G1/lifetime + mua sau, retry, duplicate webhook, legacy và external edits. | Lịch sử thiếu snapshot, admin/coupon thay đổi xen giữa không được tự suy đoán hoặc hủy cả subscription. Chưa chạy fixture trên PostgreSQL; chưa chứng minh runtime/concurrency/ACL. |
| BDB-03 | Route bỏ qua `{error,data:false}` sau provider send; regression mới ban đầu tái hiện HTTP 200 sai. | Chỉ tăng sent/failed sau RPC không lỗi và data===true. Lỗi persistence trả HTTP 503 và persistenceFailures; accepted/uncertain send tăng uncertain, không chuyển thành failed/retryable. Best-effort ghi quarantine giữ provider ID nếu DB hồi phục; RPC throw cũng được xử lý. Regression error, false, throw, failed-state write, accepted ID quarantine và transport uncertainty PASS. | Nếu DB tiếp tục lỗi thì provider ID chỉ có trong bộ nhớ; không log nó để tránh rò rỉ. Row processing cũ được quarantine khi lease hết, operator đối soát bằng thời gian/dedupe/provider. |
| BDB-04 | Claim chỉ tăng attempts; finish chỉ so ID/status, không lease token; fetch không timeout. | Claim UUID mới mỗi lần, finish bắt buộc lease_token và CAS id/status/token; overload cũ trả false để worker cũ không ghi đè. Expired processing luôn dead_letter delivery_uncertain, không tự reclaim. Fetch timeout 30s; batch dispatcher 10 để chừa margin so lease 10 phút. Source contract + SQL/PLpgSQL parse PASS; fixture stale failure/stale success/current finish được chuẩn bị. | Không có provider delivery idempotency chung cho Brevo; uncertain cần đối soát thủ công. Chưa chạy hai kết nối PostgreSQL. Rollout phải pause/drain dispatcher, migrate rồi deploy app tương ứng trước resume. |

## File đã đổi (chỉ phần thuộc lane)

- `supabase/migrations/202610270001_billing_lifecycle_recovery.sql` (mới).
- `supabase/rollbacks/202610270001_billing_lifecycle_recovery.rollback.sql` (mới, guard không cho rollback nếu đã có grant/late receipt hoặc uncertain/in-flight delivery).
- `supabase/schema.sql`: chỉ thêm entry migration billing; giữ entry của lane security, đã bàn giao manifest cho lane đó tiếp tục.
- `src/app/api/family/route.ts`.
- `src/app/api/internal/lifecycle/dispatch/route.ts`.
- `src/app/api/payment/webhook/route.ts`.
- `src/app/api/admin/billing-cases/route.ts`.
- `src/lib/lifecycle/email.ts`.
- `tests/api/privacy-lifecycle.test.ts`.
- `tests/api/lifecycle-dispatch.test.ts`.
- `tests/api/payment-webhook.test.ts`.
- `tests/api/billing-cases-refund.test.ts`.
- `tests/unit/lifecycle-email.test.ts`.
- `tests/integration/migrations/billing-lifecycle-recovery.test.ts` (mới, ghi rõ source validation only).
- `tests/integration/migrations/billing-lifecycle-recovery.scenarios.sql` (mới, fixture có rollback, **chưa thực thi**).
- `docs/runbooks/lifecycle-and-refunds.md`.
- Báo cáo này.

Đơn giản hóa: dùng một `project_subscription_order` cho cả settlement và replay thay vì hai thuật toán cấp thời gian riêng; tận dụng trạng thái dead_letter sẵn có để giữ uncertain delivery, không thêm dependency hoặc hàng đợi email khác.

## Kiểm chứng thực thi

Mọi lệnh nặng chạy qua `flock /tmp/emperor-heavy.lock`.

1. Trước sửa, regression dispatch/deletion: **6 failed / 6 passed**. Chứng minh sai thông báo deletion, thiếu lease token và false-success persistence.
2. Sau sửa, lệnh cuối:

```sh
flock /tmp/emperor-heavy.lock npx vitest run tests/api/lifecycle-dispatch.test.ts tests/api/privacy-lifecycle.test.ts tests/unit/lifecycle-email.test.ts tests/api/billing-cases-refund.test.ts tests/api/payment-webhook.test.ts tests/api/payment-status.test.ts tests/api/payment-reconcile.test.ts tests/integration/migrations/billing-lifecycle-recovery.test.ts
```

**PASS 8 files / 91 tests**, Vitest 4.1.12, duration 3.13s. Có mock provider/DB; các contract SQL là phân tích nguồn, không phải kết quả thực thi DB.

3. `flock /tmp/emperor-heavy.lock npx tsc --noEmit`: **PASS**, exit 0.
4. ESLint `--max-warnings=0` toàn bộ 11 file TS sửa/thêm: **PASS**, exit 0; lint lại dispatcher và các test sửa cuối: **PASS**.
5. `@libpg-query/parser` `parse` **và** `parsePlPgSQL` migration mới, rollback và scenario: **PASS** (được chạy lại trong suite cuối).
6. `git diff --check`: **PASS** tại thời điểm kiểm.
7. So `supabase/schema.sql` với danh sách migration sort: **PASS** tại thời điểm bàn giao manifest; checkout dùng chung vẫn có các lane tiếp tục sửa.

## Chưa làm / bước tiếp theo

- Không chạy migration/rollback/scenario trên DB nào theo brief. Cần môi trường disposable được phép để chạy fixture và hai-session deletion/webhook, concurrent refund/renewal, stale lease CAS, ACL/RLS, rollback guards; parse xanh không thay thế các gate này.
- Không thực thi provider, live webhook/refund/email, deploy hoặc production smoke.
- Trước rollout: pause lịch dispatch, drain send đang chạy; áp dụng migration rồi app đồng bộ trước resume; theo runbook kiểm queue late-payment và uncertain email.
- Không làm backfill legacy; ca review-required cần quy trình repair được duyệt từ chứng cứ tài chính/quyền trước khi hoàn tất.
- Không sửa/hoàn nguyên các diff của lane khác trong checkout dùng chung.
