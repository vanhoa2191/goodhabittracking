# Phase 05 — Màn phụ huynh phản hồi trước

Owner OpenCode; reviewers AGY Gemini/Kilo; handoff →06/07. Depends01/02/03 accepted. A02/A04/A06.

## Files và giới hạn

`ParentDashboard.tsx:312–331`, `ParentApprovalsTab.tsx`, `ParentTodayCard.tsx`, `ParentNavigation.tsx`, parent copy modules và tests được giao. Không ghi globals/Header đồng thời với04; các thay đổi shared shell chuyển sang06 qua packet.

## Công việc

Khóa semantics Phase01; thu gọn banner/mode hero; làm inbox pending là focal action, scope của tổng quan và queue nằm gần phần bị tác động. Tên bé trên row và batch summary giữ rõ; empty state có next step hợp lý; weekly observation ở sau việc cần xử lý và chỉ dùng dữ liệu có thật. Không bịa insight/AI coaching mới.

Sau review AGY:family inbox xuất hiện **trước** khối tổng quan theo bé. Bộ chọn bé nằm bên trong section “Tổng quan từng bé” phía dưới, không ngồi trên family inbox như bộ lọc toàn trang. Inbox có heading “Cần duyệt — tất cả bé”, tên bé mỗi row/batch và counts theo family; scope summary không phủ queue. Nếu future brief muốn workspace filter thì cần contract/test mới, không tự đảo D03.

Giữ ba primary areas và deep link/query behavior. Đổi nhãn “Thiết kế” chỉ khi brief03 accepted và9locale có copy; ID section/URL không đổi theo nhãn. Giữ pairing, PIN, reward delivery/settings và tab keyboard semantics. Không ẩn thông tin lỗi để giảm chiều cao.

## Exit gate

375×812 có entry action “Cần duyệt”/queue hoặc empty-state CTA nhìn thấy, banner không lấn phần chính; số lượng/child identity đúng; slow/failure/retry/bulk tests01 còn pass. Tab/deep link/reload khôi phục section; multi-child names dài không tràn ngang. Empty queue không hiện nút gây hiểu nhầm có việc cần duyệt.

## Handoff

`handoffs/phase-05.md`: contract01 unchanged/explicit reviewed change, screenshots data-rich+empty, navigation/queue test logs, copy locale status, ownership released. GPT accept trước06. Rollback presentation patch05, giữ logic bugfix01 độc lập.
