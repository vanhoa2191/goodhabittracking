# Review candidate V2 (thinking-games 365 ngày) — READ-ONLY
Worktree: /home/opc/orca/workspaces/goodhabittracking/audit-remaining. Dữ liệu: content/thinking-games/candidates/365-v2/ (batch-01..05 + candidate-manifest-v2.json, mỗi file 0.6–7 MB: KHÔNG đọc nguyên file; dùng node/python lọc theo ageTrack, theo ngày, theo cơ chế). Mỗi track 730 mục. Status hiện tại: design_only / pending_human_review.
Nhiệm vụ: review CHẤT LƯỢNG NỘI DUNG của track được giao, như biên tập viên người thật:
1. Tiếng Việt: lỗi chính tả/ngữ pháp, câu cứng/dịch máy, ký tự ngoài tiếng Việt (CJK, Cyrillic…) — quét TOÀN BỘ track bằng script, không chỉ mẫu.
2. Phù hợp độ tuổi: từ vựng, độ dài, độ khó, chủ đề (không sợ hãi, không bạo lực, không thương mại/quảng cáo, không định kiến giới/vùng miền).
3. Đúng/giải được: mỗi puzzle có đúng 1 đáp án hợp lý, đáp án đúng khớp đề, giải thích khớp đáp án (chú ý số/thứ tự hiển thị "Bạn số N" khớp vị trí thẻ sau khi xáo), không lộ lời giải trong đề.
4. Lặp: các mục gần như giống nhau (cùng khung, chỉ đổi số/màu), liệt kê cụm trùng nhiều nhất. Audit tự động đang báo 137 fingerprint trùng/434 mục trùng cấu trúc toàn catalog.
5. Độ khó tăng dần hợp lý qua 365 ngày; cân bằng cơ chế.
Cách làm: viết script quét toàn bộ (lưu script vào plans/audit-2026-10-27-remaining/candidate-review/<lane>-scripts/), rồi đọc kỹ MẪU phân tầng tối thiểu 120 mục (đều theo ngày và cơ chế) bằng mắt. Báo cáo số liệu thật, không suy diễn.
Đầu ra: plans/audit-2026-10-27-remaining/candidate-review/<lane>.md gồm: Kết luận (đạt/cần sửa/chặn) cho track; bảng phát hiện P1/P2/P3 với itemId, trích đoạn, lý do, đề xuất sửa; thống kê quét toàn bộ; mục đã đọc bằng mắt (id). KHÔNG sửa file nội dung/mã/migration; không commit; chỉ ghi file báo cáo + scripts. Lệnh nặng chạy qua: flock /tmp/emperor-heavy.lock <lệnh>. Hoàn tất -> worker_done tóm tắt 3 dòng.
