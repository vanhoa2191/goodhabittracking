# Phase 03 — Chốt product truth và brief trải nghiệm

Owner GPT + AGY Gemini3.8Flash; reviewer khác người viết; handoff →04/05. Depends00 accepted. Audit A01/A06 và design specificity.

## Scope

Planning/docs-only: PRODUCT.md (chỉ sau bước xác nhận theo Impeccable init), existing DESIGN.md và brief riêng cho child/parent theo schema từ skill. Không viết lại app hoặc bịa phân khúc người dùng.

## Công việc

Đọc init/shape/new-work của Impeccable; xác nhận khoảng trống product một vòng thực sự trước khi viết PRODUCT.md: nhóm tuổi mặc định hoặc đa nhóm; role của người chăm sóc0–3; phần nào chỉ là giả thuyết. Với câu trả lời chưa có, ghi decision pending trong phase packet; tiếp tục bugfix01/02, không tự giả user approved. App là Operate/code-first, không cần tạo ảnh marketing hoặc mua asset để lập brief.

Giữ visual identity, thiết kế lại composition: bé = greeting ngắn, next practice, day list, progress; phụ huynh = scope, review inbox, short summary, settings. Chốt primary action words và trạng thái (pending/saving/verified/read-only), priority khi nhiều optional panels bật, all-family scope của01. Tài liệu khung phẩm chất vẫn truy cập được sau progressive disclosure, không xóa factual content hoặc đổi reward economics.

Thiết kế theo0–3,3–8,9–12,13+ với unknown age fallback, không coi ageTheme đang bật. Ghi layout cho375/768/1280, text scaling, empty/pending/error/success, many children/tasks và night theme. Xác định next task dựa trên lịch đang có, không tự giới thiệu recommendation engine.

Sau review AGY:0–3 là **nhánh caregiver-led hiện hữu cần bảo toàn**, không mặc định trẻ tự đọc/bấm checklist; không áp tiêu chí child-self-action above-fold cho nhánh này.03 phải ghi role/first action/actor riêng từng nhánh và unknown-age fallback đang có. Chưa xác nhận product truth thì không thay nhánh0–3 hoặc bật ageTheme mới. “Phân khúc thương mại trọng tâm” có thể còn mở nếu không đổi hành vi; “ai thực hiện primary action và workflow nào được đổi” là quyết định chặn nếu có thay đổi.

## Exit gate

Product decisions được xác nhận/đánh dấu rõ; mỗi brief nêu job/audience/mode/focal action/states/boundaries. Reviewer xác nhận scope01 không bị đảo ngầm và A01 có mục tiêu hình học đo được. Chốt brief theo shape trước implementation; nếu thật sự muốn replacement visual world phải đi new-work riêng, không gọi đó là polish.

Packet03 phải có `blocking_decisions: []`, `nonblocking_decisions`, `approved_surface_scope` và actor/state map. Chỉ accepted khi blocking_decisions rỗng và bước xác nhận cần thiết của Impeccable đã hoàn tất. Nếu còn quyết định chặn, status=awaiting-product-decision/blocked,04/05 không dispatch;01/02 vẫn tiếp tục. Không bàn giao pending critical choices dưới nhãn accepted, không bắt worker tự chọn để vượt gate.

## Handoff

`handoffs/phase-03.md`: confirmed/open decision log, brief paths, composition/state map, copy examples (draft không thay domain truth), flag policy, reviewer verdict.04/05 chỉ bắt đầu trên brief accepted. Rollback docs patch, không ghi đè DESIGN lịch sử thiếu review.
