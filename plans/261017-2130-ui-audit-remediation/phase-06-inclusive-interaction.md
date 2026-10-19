# Phase 06 — Touch, i18n, motion, semantics

Owner Kilo (touch/motion/focus) và OpenCode (appearance i18n), file ownership giao tách; reviewer GPT + AGY copy. Depends04/05 accepted. A07/A08/A09, V01/V02/V03.

## Files

Kilo: `Header.tsx:190`, `ThemeSelector.tsx:32`, `HabitTimerModal.tsx:110–213`, relevant headings và `globals.css:199–205`. OpenCode: `appearance-context.tsx:17–47`, `FontSettingsModal.tsx:45–112`, appearance copy và locale tests. FontSettingsModal close-target do OpenCode áp dụng theo spec Kilo, không cùng ghi file. Chốt quyền globals sau02/04/05.

KidDashboard headings/icons thuộc04;06 chỉ verify trừ correction handoff được coordinator cấp. Sau02 nhả HabitTimerModal toàn file mới sửa touch/focus; các ranges dòng chỉ dùng tìm kiếm, không thay file-level ownership.

## Công việc

1. Đo actual bounding boxes tại100/108/118% font; primary/close/profile/theme controls≥44×44 CSS px, spacing không chồng nhau; young theme theo64px target hiện có.
2. Tách labels font/size khỏi persistent options IDs; dùng patterns i18n9locale. Không đổi selected key hoặc localStorage value, không dùng split(' ')[0] để cắt nhãn. Mẫu font đa ngôn ngữ cần ghi rõ vai trò.
3. Regression trước khi bỏ global0.01ms: timer/praise/confetti/swipe/loading có trạng thái tĩnh. Chỉ giảm authored motion liên quan, giữ thông báo status và focus; không bỏ guard cho animation bên thứ ba chưa được xử lý.
4. Timer tự kết thúc phải announce và focus chuyển tới CTA/heading có nghĩa, không nhảy về body. Semantics heading hợp lý child/parent/dialog; giữ style độc lập cấp heading.
5. Xử lý emoji thiết yếu khi reproduce, dùng asset/Lucide hiện có; copy/emoji trang trí không thay hàng loạt.

## Exit gate / handoff

9locale label checks + EN/DE/JA long-copy runtime,375/768/1280 overflow và200% zoom reflow pass; labels/saved preferences reload đúng; keyboard Tab/Escape/focus restore và timer finish có test; motion reduce không mất kết quả thao tác. Không tuyên bố screen-reader tested nếu chỉ accessibility tree/axe. Handoff `handoffs/phase-06.md` kèm bounds, translation matrix, normal/reduced evidence và outstanding manual-device gates. Rollback từng touch/i18n/motion patch riêng.
