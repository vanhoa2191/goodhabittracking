# Phase 01 — Scope và phản hồi duyệt việc

Owner OpenCode; reviewer GPT và Kilo; handoff → Phase05. Depends00 accepted. Audit A02/A04.

## Files

`src/components/ParentApprovalsTab.tsx`, `BulkTaskReview.tsx` (sở hữu toàn file theo lượt), copy modules `parent-approvals-copy.ts`/`parent-actions-copy.ts`/`parent-today-copy.ts`; `tests/e2e/parent-today.spec.ts`, `tests/parent-approvals-copy.test.ts`, `tests/unit/parent-today-copy-languages.test.ts` và tests scope/mutation được giao. Không sở hữu ParentDashboard/global CSS.

Coordinator đã mở **scope store tối thiểu cho A04** sau review OpenCode: `src/lib/store/reward-actions.ts` và phần khai báo action tương ứng trong `src/lib/store.tsx`; unit tests reward-actions. Single task ưu tiên gọi `reviewLogs([id], decision)` đã trả `Promise<BatchReviewOutcome | null>` trong `habit-actions.ts:297–338`, không tạo wrapper single-log mới chỉ để đổi tên. Đối chiếu và giữ semantics âm thanh/analytics hợp lý, không bịa approvalLag. Signature legacy approveLog/rejectLog và các caller không liên quan giữ nguyên. Nếu cần thay habit action thực sự, phải chỉ ra gap cụ thể và mở scope bằng packet, không tách lại store.

## Quyết định và thực hiện

Default giữ hàng đợi toàn gia đình để không đổi semantics backend: đổi nhãn bộ chọn thành “Xem tổng quan của…” và gắn “Cần duyệt — tất cả bé” tại queue/bulk, giữ tên bé mỗi hàng. Nếu03 chọn một workspace theo bé, cập nhật contract và fixtures trước khi đổi, không để selector nửa-filter.

Regression trước: selected summary và family queue có tên scope đúng; bulk chỉ chứa IDs đang hiển thị theo contract. Single approve/reject/deliver dùng async states, pending guard trong handler và disabled; lỗi giữ hàng, thông báo locale và retry; thành công announce trước/đồng thời remove; focus sang hàng kế hoặc queue heading khi hết. Reuse feedback/copy patterns của BulkTaskReview; không giả success, không tự tăng điểm/pending.

Task rows approve/reject: một logical click chỉ tạo một review request, bao gồm rapid double click trước rerender. Redemption: mở rộng contract action hiện có để trả outcome có thể await (success/failure và authoritative state cần thiết), cập nhật type và tất cả caller liên quan; ưu tiên tái dùng cùng action, không thêm abstraction chung. Giữ domain command/PIN/server semantics hiện hữu. Delivery có thể gồm approve rồi deliver: chỉ báo “đã giao” sau deliver thành công; nếu approve thành công nhưng deliver thất bại, **không giả row còn pending**. Đồng bộ trạng thái approved thật, giữ row hoặc recovery panel “Đã duyệt, chưa giao”, cung cấp retry deliver theo transition contract hiện hữu. Request count cho delivery theo command sequence hợp lệ, không ép một request cho workflow hai bước. Phân biệt command đã thành công nhưng refresh thất bại với command thất bại để tránh duplicate/retry sai; chưa có server evidence thì báo chưa xác nhận và đối chiếu lại, không tạo side effect mới.

Nhãn phạm vi phải có ở inline task queue, BulkTaskReview heading/selection summary và redemption queue; đổi bé không đổi family queue counts/IDs. Đổi accessible name bộ chọn cần cập nhật parent-today spec có assertion `Chọn bé`; không bỏ assertion scope. Phase01 soạn đủ9locale theo nghĩa đã chốt, GPT duyệt nghĩa;03 chỉ fine-tune, không chặn bugfix. Chuỗi quyền ghi bắt buộc: **01 →02 phần màu trên ParentApprovalsTab/BulkTaskReview →05 layout**.

Bulk recovery sau review AGY:đối chiếu batch RPC transaction/outcome hiện hữu trước khi giả định lỗi từng mục. Nếu server atomic, test rollback/unknown response; nếu outcome approved/rejected/skipped khác nhau, announce kết quả thật rồi reconcile IDs còn pending, không suy từ aggregate counts thành per-ID success. Không gửi lại cả mảng cũ mù quáng sau timeout. Sau refresh chỉ chọn/retry pending IDs còn hợp lệ, không lặp mục đã xử lý trên thiết bị khác. PIN/auth hết hạn giữ context/selection có thể khôi phục, đi qua unlock hiện hữu, không bypass PIN; revalidate scope/pending trước gửi lại. Chưa biết outcome thì báo cần xác nhận lại, không tick tất cả thành công.

Không đổi PIN server, domain command IDs, MAX_BATCH_REVIEW hoặc entitlement. Không thêm confirm modal cho mọi thao tác reversible; chỉ giữ confirmation chính sách hiện hữu.

## Exit gate

Hai bé, task+reward, all/single/bulk, slow/double click/failure/retry và stale pending đều đúng; default dailyEase-off và dailyEase-on đều có phản hồi; rapid double click không tạo duplicate logical operation; delivery partial success/refresh failure được phân biệt và giữ recovery; error không mất context; keyboard focus có vị trí hợp lý. Async contract có unit tests local/cloud/failure/partial-success, audit tất cả caller và typecheck. Lint/typecheck và tests liên quan pass.

## Handoff

`handoffs/phase-01.md`: contract phạm vi, mutation result semantics, labels9locale, test proof, pending/error/success captures, released files. GPT accept trước khi05 dọn bố cục. Rollback patch01; không migration/data rewrite.
