Bạn là WATCHER cho đợt audit (chỉ đọc file, không sửa code). Theo dõi plans/audit-2026-10-27/events.jsonl (script ghi mỗi worker_done/escalation/question, mỗi dòng 1 JSON) bằng vòng lặp bash: so sánh số dòng (wc -l) mỗi 60s, giữ tool bash chạy vòng lặp với timeout dài.
Khi có dòng MỚI: đọc, tóm tắt <=5 dòng (lane, outcome, số P0/P1, đường dẫn báo cáo) rồi gửi coordinator:
orca-ide terminal send --terminal term_7b2000cd-42ba-41ee-9521-c673791cc604 --text "[WATCHER] <tóm tắt>" --enter --json
KHÔNG báo heartbeat/tiến độ thường lệ. Chỉ báo khi (a) worker_done, (b) escalation/question cần quyết định, (c) 30 phút không có sự kiện mà worker terminal đã thoát (orca-ide terminal list --json).
Phải ở lại sống đến khi cả 5 lane (security-auth, billing-db, product-logic, ui-marketing, quality-infra) đều có worker_done, rồi gửi 1 tin "[WATCHER] ALL DONE" và dừng.
