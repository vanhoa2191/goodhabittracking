# Kilo — planning sufficiency final approval

Coordinator archive of actual Kilo Code stdout (kilo-auto/free), text-only clarification review. Task task_a4c75b0a86b9 / dispatch ctx_19d1f10346ba. Manual lifecycle recovery, no worker_done claimed; verdict concerns planning coverage, not implemented tests. Original REVISE remains in kilo-final.md.

APPROVE.

test-spec.md cùng cổng phase 00/01/07 đã kế hoạch đầy đủ mọi khoảng trống kilo.md liệt kê cho A01–A09, V01–V05 và cờ compile-time:

- A01: hình chữ nhật tên task + nút chính nằm trong viewport 375×812 trừ sticky header/bottom-nav; chạy demo và paired fixture; trống → CTA/giải thích, không khẳng định task tồn tại, không chụp màn hình mù.
- A02: hai bé có task/chờ; chuyển bé không xem nhầm bé khác; ID bulk khớp phạm vi hiển thị; single và bulk chạy đầy đủ; không lẫn hai ngữ nghĩa.
- A03/A05: contrast tính toán sau font/theme/transition ổn định cho timer Pause/Complete, approve, xác nhận điểm, footer/callout; tỷ lệ theo loại thành phần; đổi theme qua UI, mô phỏng hệ thống và reload, không chỉ ép `.dark`; bề surface/màu/viền tối qua cài đặt UI và reload, không tràn bề sáng trong tối.
- A04: busy/result mỗi hàng, khóa gửi kép, chậm/thất bại/lại/thành công, hàng lỗi từ session khác; số lượng/payload yêu cầu, native disabled + handler guard, giữ ngữ cảnh khi lỗi, thông báo trạng thái/lỗi, không chỉ đếm toast. Quyết định quyền hạn: approve thành công/giao thất bại (hàng duyệt/chưa giao, có thể retry giao); giao thành công/làm mới thất bại (không retry mù); phân biệt lệnh thành công nhưng làm mới thất bại vs lệnh thất bại; không có bằng chứng máy chủ → báo chưa xác nhận, đối chiếu lại, không side effect mới.
- A06: nhãn hiển thị open/saving/pending/completed/read-only; tên truy cập đồng nghĩa; chi tiết task giữ taxonomy/thật; tiêu đề hoạt động đã lưu không bị viết lại ngoài phạm vi; lỗi không chứa raw `failureCode`.
- A07: `getBoundingClientRect` ≥44×44 CSS px mọi cỡ font; vòng focus không bị cắt, chồng chéo, tràn ngang.
- A08: nhãn 9 ngôn ngữ không dùng ID dịch; nạp cài đặt đã lưu đúng; font/kích thước persist sau reload; tên/mẫu không bị tách/cắt mất nghĩa.
- A09/V02: giảm chuyển động giữ văn bản kết quả/đang tải và thông báo timer; không confetti/bounce; giữ phản hồi mặc định; đồng hồ đóng băng/tiến hành, không ngủ phút thực; HabitTimerModal: thông báo kết thúc timer, focus CTA/heading không phải body, Escape và khôi phục focus đúng.
- V01: thứ tự heading có ý nghĩa, landmark/nhãn dialog đúng, axe serious/critical = 0, không sửa bằng vai trò giả.
- V03: tái tạo tofu theo font/OS; biểu tượng cần thiết dùng fallback hệ thống/Lucide hiện có; không thay thế toàn bộ biểu tượng trang trí.
- V04: build/reload sản xuất mới không sai hydration hoặc lỗi ứng dụng trong luồng chính; tiếng ồn HMR chỉ dev, không trộn vào kết quả sản xuất.
- V05: build mới, bytes asset/route, tải ảnh, chỉ số thực so ngân sách hiện có; không gian Lighthouse; bytes chunk artifact/route và ảnh tải là bằng chứng tối thiểu.
- Cờ compile-time: D0 tắt, E1 regression-on trong `playwright.config.ts`, `ageTheme` off/on riêng theo process/build; cờ công khai qua build/server/process riêng, lưu manifest, không giả cờ `localStorage`.

Cổng phase-00 (baseline, fixture 3 viewport, build sản xuất tương đương), phase-01 (A02/A04 ngữ nghĩa đột biến, phân phối bán thành công, khôi phục mass, 9 ngôn ngữ) và phase-07 (chạy đầy đủ, build mới, ngân sách, E2E/a11y Chromium/mobile + WebKit, không gian Lighthouse giả, kiểm tra reload sản xuất-like không sai hydration) đủ để nghiệm thu kế hoạch này. Không tồn tại yêu cầu kế hoạch bị thiếu hoặc mâu thuẫn. Không khẳng định bất kỳ kiểm tra nào đã pass.
