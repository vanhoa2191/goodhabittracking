# Phase 02 — Contrast và dark mode

Owner Kilo; reviewer GPT; handoff →04/05/06. Depends00 accepted. Audit A03/A05.

## Scope

`src/app/globals.css:9–129`; action styles ở `HabitTimerModal.tsx:178,196–199`, `ParentDashboard.tsx:963`, `ParentApprovalsTab.tsx:106`, `BulkTaskReview.tsx:117`, `KidIndependence.tsx`, `FamilyDataCard.tsx` sau xác minh. Mọi file đang được01 giữ thì Kilo chỉ chuẩn bị đề xuất token; Kilo áp dụng phần button sau khi01 nhả ownership. Không song song ghi shared file.

Quyết định sau review:02 thực hiện core token/timer/point-confirm độc lập với01, nhưng **chỉ patch ParentApprovalsTab và BulkTaskReview sau khi01 accepted/nhả toàn file**. Không giao OpenCode apply màu cùng lúc. Phase02 chưa được accepted toàn phần trước khi phần màu shared-file hoàn tất. Vì vậy02 có hai slice: core song song01, parent-action phụ thuộc01;05 chờ02 accepted cuối. Packet ghi rõ cả hai slice.

## Cleanup plan

Khóa appearance/completion behavior trước; thay lặp palette từng nhóm state, ưu tiên semantic tokens hiện có. Bổ sung dark values đầy đủ surface/ink/border; không thêm design-system layer. Thu gọn override toàn cục chỉ khi mọi consumer đã kiểm tra, không xóa slate normalization hàng loạt. Giữ warm/indigo brand, không rebrand.

Đo computed color thực sau transition cho normal/hover/focus/selected/disabled ở light/dark/system; alpha composite đúng background. Chữ thường≥4.5:1, large≥3:1; control/focus≥3:1 nơi áp dụng; disabled ghi ngoại lệ hợp lệ nhưng vẫn đọc được. Timer chạy/tạm dừng/hoàn tất, point-confirm, approve, footer và demo callout nằm trong mẫu bắt buộc.

## Exit gate / handoff

`appearance.spec.ts`, accessibility cases và computed ratio assertions quan trọng pass; dùng UI đổi theme và reload bảo toàn lựa chọn; nền app/header/footer không sót light trong dark. Screenshot light/dark375/1280 và contrast table lưu `handoffs/phase-02.md`; GPT reviewer accept, nhả globals và action files. Rollback token/style patch, không đổi theme storage IDs.
