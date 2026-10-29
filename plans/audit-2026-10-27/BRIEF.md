# Audit brief (chung cho mọi worker)
- READ-ONLY: không sửa code, không commit, không chạy migration/deploy, không đụng prod. Chỉ được ghi 1 file báo cáo tại plans/audit-2026-10-27/reports/<lane>.md.
- AGENTS.md: Next.js bản này có breaking changes — đọc node_modules/next/dist/docs/ trước khi kết luận về API Next.
- Mỗi phát hiện: mức độ (P0/P1/P2/P3), file:dòng, bằng chứng (đã tự kiểm tra, không đoán), kịch bản lỗi, đề xuất sửa ngắn. Không báo cáo thứ không xác minh được.
- Chạy được: npm test/lint/tsc/typecheck (read-only). Không chạy script verify-live-*.
- Cuối: gửi worker_done (outcome succeeded/failed) kèm đường dẫn báo cáo + đếm P0/P1/P2/P3. Gặp quyết định cần chủ dự án -> ask.
- Giới hạn tài nguyên: máy yếu, tối đa 1 tiến trình build/test nặng cùng lúc.
