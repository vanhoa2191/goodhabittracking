# Fix brief (chung)
Nguồn: plans/audit-2026-10-27-remaining/reports/<lane>.md. Với MỖI phát hiện của lane bạn:
1. Tự tái hiện/kiểm chứng độc lập trong code hiện tại. Không xác nhận được -> ghi "không xác nhận" và KHÔNG sửa.
2. Xác nhận -> sửa tối thiểu đúng gốc + thêm/cập nhật test. Migration: tạo file mới (không sửa migration đã áp dụng), có rollback theo mẫu repo, KHÔNG áp dụng lên DB nào.
3. Chỉ sửa file thuộc lane của bạn (liệt kê trong task). Cần file ngoài lane -> ask.
4. Không commit/push, không deploy, không đụng prod. Chạy test/tsc/lint nặng chỉ qua: flock /tmp/emperor-heavy.lock <lệnh> (một tiến trình nặng tại một thời điểm cho cả máy). Ưu tiên test mục tiêu.
5. Ghi plans/audit-2026-10-27-remaining/fixes/<lane>.md: từng phát hiện -> xác nhận/không, file đã đổi, test đã chạy (kết quả thật), rủi ro còn lại.
6. Cuối: worker_done. Quyết định chính sách cần chủ dự án -> ask (đừng tự bịa).
AGENTS.md: Next.js bản này có breaking changes, đọc node_modules/next/dist/docs/ trước khi sửa code Next.
Worktree: audit-remaining (origin/main). Lane khác chạy song song, không đụng file ngoài lane. Không sửa/ghi đè migration có sẵn; tg-db-ci quyết định thứ tự/RPC override, nếu cần chính sách -> ask.
