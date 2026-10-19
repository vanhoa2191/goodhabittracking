---
target: KidHabit Hero app UI audit and redesign direction
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:/home/opc/orca/goodhabittracking/src/components/KidDashboard.tsx"
target_fingerprint: "sha256:55457b7b845ee5ffb849e5086fe7ca11f06ef7157030c4ea5d845d6fb35fa6ba"
target_path: /home/opc/orca/goodhabittracking/src/components/KidDashboard.tsx
timestamp: 2026-10-17T14-25-11Z
slug: src-components-kiddashboard-tsx
---
# KidHabit Hero — audit giao diện và hướng redesign, 17/10/2026

Method: dual-agent (A: /root/design_review · B: /root/technical_audit); browser verification by primary agent.

Kết luận: nên thiết kế lại thứ bậc thông tin và luồng thao tác. Mascot đất sét, nền vàng ấm và chữ Fraunces đã tạo nhận diện; điểm yếu là màn hình ưu tiên hồ sơ và thành tích trước việc trẻ cần làm.

Phạm vi: src/components/KidDashboard.tsx, ParentDashboard, ParentApprovalsTab, navigation, entry, timer, appearance và globals.css. Đã xem Chromium desktop1280×900/mobile375×812, demo/local, mặc định các experience flag không bật; kiểm tra dark qua class .dark. Chưa kiểm tra production, tài khoản cloud, trình đọc màn hình, cảm ứng vật lý, lỗi mạng hoặc Lighthouse. Đây là đánh giá chuyên gia, không phải usability study hoặc chứng nhận WCAG.

## Điểm đánh giá

Nielsen: trạng thái3, ngôn ngữ thực tế3, kiểm soát3, nhất quán2, phòng lỗi2, nhận biết3, hiệu quả2, tối giản2, phục hồi lỗi3, trợ giúp3 =26/40. Cần cải thiện đáng kể.

Kỹ thuật: accessibility2/4, theming2/4, responsive3/4 (layout/source, chưa kiểm tra touch), integrity3/4. Performance chưa đo; không cộng một điểm hiệu năng giả định vào tổng. Điểm tạm tính10/16 cho bốn chiều có đánh giá.

## Phát hiện ưu tiên

1. [P1] Nhiệm vụ bị đẩy khỏi màn hình đầu mobile. KidDashboard.tsx:325–524,638. 375×812 không thấy thẻ nhiệm vụ đầu; desktop1280×900 thẻ đầu bắt đầu khoảng y747. Banner demo góp thêm chiều cao nên không quy toàn bộ cho app thật. Thu gọn hero, đưa việc tiếp theo lên trước điểm/huy hiệu/khung phẩm chất. $impeccable distill.
2. [P1] Phạm vi chọn bé không nhất quán. ParentApprovalsTab.tsx:44–47,57–89,124; BulkTaskReview.tsx:20. Chọn bé đổi tổng quan, hàng đợi vẫn toàn gia đình. Lọc đồng nhất hoặc ghi rõ “Tổng quan của…” và “Cần duyệt — tất cả bé”. $impeccable clarify.
3. [P1] Chữ trắng trên nút màu sáng thiếu tương phản. HabitTimerModal.tsx:178,196–199; ParentDashboard.tsx:963; ParentApprovalsTab.tsx:106. Tính từ token Tailwind: white/amber500≈2.15:1, white/emerald600≈3.67:1, dưới4.5:1 với chữ nhỏ. Đây là tính toán token, chưa đối chiếu từng computed style trong mọi trạng thái. Dùng nền đậm hoặc mực tối phù hợp, kiểm tra lại WCAG1.4.3. $impeccable colorize.
4. [P1] Hàng duyệt mặc định thiếu phản hồi lưu/lỗi tại chỗ. ParentApprovalsTab.tsx:105–106,140–141 không có trạng thái busy/result riêng như BulkTaskReview. Chưa tái hiện lỗi mạng hoặc xác nhận global notice có bù hay không. Thêm khóa gửi lặp, trạng thái lưu, lỗi và thử lại rõ tại hàng. $impeccable harden.
5. [P2] Dark mode không đổi đủ surface token. globals.css:9–19,43–47,76–83. Browser xác nhận app surface vẫn rgb(251,248,243) trong dark; thẻ tối xen nền kem, một số chữ nhạt khó đọc. Bổ sung surface/ink/border dark đồng bộ. $impeccable colorize.
6. [P2] Ngôn ngữ khung thói quen và nút biểu tượng làm tăng công suy luận. KidDashboard.tsx:638,750–797. “Nhân thí”, “16 phẩm chất…” đi trước hành động đời thường; nút hoàn thành dùng vòng tròn trong khi “Để sau” có chữ. Đây là giả thuyết về hiểu nội dung, chưa có user test. Đặt “Tươi cười chào buổi sáng” trước; nhãn nhìn thấy “Con làm xong”/“Chờ ba mẹ”. Giữ khung nghĩa trong chi tiết. $impeccable clarify.
7. [P2] Một số vùng chạm dưới mục tiêu44×44. FontSettingsModal.tsx:45–48; HabitTimerModal.tsx:110–113; Header.tsx:190. Suy ra từ CSS, cần đo ở mọi font scale. Không tự động coi đây là lỗi WCAG2.5.8 AA. $impeccable adapt.
8. [P2] Cài đặt chữ còn nhãn Việt ở locale khác. appearance-context.tsx:17–54; FontSettingsModal.tsx:78,109–112. Dịch nhãn cỡ chữ/tên mô tả và giải thích mẫu font. $impeccable clarify.
9. [P3] Reduced-motion dùng global0.01ms override. globals.css:199–205. Các trạng thái tĩnh quan trọng vẫn còn; chưa thấy lỗi chặn thao tác. Chuyển dần sang phương án tĩnh có chủ đích khi chạm từng component. $impeccable animate.

Tổng9 nhóm: P0=0, P1=4, P2=4, P3=1. Không có P0 được xác nhận trong phạm vi khảo sát.

## Điều nên giữ

- Nhận diện ấm, mascot đồng nhất, chữ tiêu đề có cá tính; phân vai bé/phụ huynh có cơ sở.
- Chia nhiệm vụ theo buổi; phân biệt đã xong và chờ duyệt; hỗ trợ để sau và đọc nội dung.
- Điều hướng phụ huynh gom7 mục thành3 nhóm, có keyboard semantics; modal/focus và paired-child boundary được quan tâm.

## Hướng redesign đề xuất: Nhật ký trưởng thành của gia đình

Đây là concept đề xuất, chưa phải hướng thương hiệu đã được duyệt. Sản phẩm hỗ trợ nhiều giai đoạn nhưng chưa có PRODUCT.md để chốt phân khúc trọng tâm.

Bé: lời chào ngắn → một việc tiếp theo → nhiệm vụ theo buổi → tiến bộ nhỏ. Dùng nhịp mầm cây/ngôi sao từ logo làm nét riêng; mascot đồng hành ở lúc bắt đầu/chúc mừng, không cạnh tranh với nhiệm vụ. Mỗi thẻ có hành động bằng chữ. Điểm, huy hiệu và xếp hạng nằm ở vị trí thứ cấp.

Phụ huynh: tổng quan ngắn theo bé → việc cần phản hồi → ghi nhận trong tuần → thiết lập. Ưu tiên inbox duyệt, scope luôn hiện. Có thể đổi “Thiết kế” thành nhãn trực tiếp như “Thói quen & quà” sau kiểm tra hiểu nhãn.

Theo tuổi: trẻ nhỏ cần ảnh và chữ ngắn, vùng chạm rộng;9–12 tuổi có nhiều tự chủ hơn;13+ dùng lời văn trưởng thành, mascot tùy chọn;0–3 là nhật ký do người chăm sóc dùng. Cơ chế ageTheme hiện có nhưng phụ thuộc flag, không được giả định đang bật trên production. Đây là giả thuyết thiết kế cần xác thực, không phải dữ liệu nghiên cứu người dùng.

Thị giác: giữ amber/indigo và nền ấm, dùng tương phản chức năng rõ; giảm hero chứa số liệu, chip và card lồng nhau. Hệ thống biểu tượng ổn định thay emoji tại chỗ quan trọng; một số emoji thiếu glyph trong môi trường local, chưa xác nhận production. Không thêm mascot, hiệu ứng hoặc tính năng mới để tạo khác biệt.

## Cognitive load, persona, cảm xúc

Tải nhận thức mức vừa: level, giai đoạn, sao, huy hiệu, chuỗi và phần trăm xuất hiện trước hành động. Đây là sáu thông tin, không phải sáu lựa chọn điều hướng. Người mới cần hiểu ngay việc tiếp theo; phụ huynh bị gián đoạn cần phản hồi đã lưu và scope rõ; người dùng bàn phím cần kiểm tra focus khi hàng duyệt biến mất. Trải nghiệm khích lệ tốt ở chúc mừng nhưng cần lời trấn an rõ ở chờ duyệt/lưu lỗi. Tránh mã chẩn đoán trong lời nhắn cho trẻ (KidDashboard.tsx:811).

## Máy quét và giới hạn

CLI43 cảnh báo trên22 file:39 ai-color-palette,4 bounce-easing. Không coi chúng là43 lỗi: palette là chủ ý DESIGN.md, bounce chúc mừng có ngữ cảnh/reduced-motion. Browser overlay cũng gắn cờ font phổ biến/nền kem: đây không phải lý do tự động đổi nhận diện. Cảnh báo heading h1→h3 cần sửa cấu trúc theo ngữ nghĩa. Overlay là công cụ audit, không phải thành phần app.

Dev console có lỗi HMR/router và hydration trong phiên xem thử; chưa xác nhận trên production. Không dùng tốc độ compile để đánh giá tốc độ sản phẩm. Không chạy regression suite vì không sửa UI; không kết luận tất cả tests đang pass.

## Trình tự và tiêu chí xác nhận

Trước hết sửa scope duyệt, phản hồi lưu, contrast và dark; tiếp theo shape/distill màn bé/phụ huynh; cuối cùng adapt/clarify/polish và audit lại. Có thể chạy từng lệnh hoặc theo nhóm ưu tiên.

Tiêu chí: nhiệm vụ và hành động chính xuất hiện trong viewport375×812 với dữ liệu đại diện; scope đúng trên tổng quan/hàng đợi/bulk; nhãn chữ nhỏ đạt4.5:1; không tràn ngang375/768/1280; luồng chính dùng được bằng bàn phím; test trẻ/phụ huynh thật theo nhóm tuổi trước rollout.

## Quyết định cho vòng sau

1. Ưu tiên: A) sửa lỗi phạm vi/contrast/phản hồi trước; B) dựng concept màn bé; C) dựng concept cả hai vai.
2. Đối tượng mặc định: A)3–8 tuổi; B)9–12 tuổi; C)nhiều nhóm tuổi với trải nghiệm phân nhánh.

Chỉ có artifact báo cáo/evidence được tạo. Không thay đổi giao diện, không có cleanup/refactor hoặc commit.
