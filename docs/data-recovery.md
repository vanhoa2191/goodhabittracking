# Data Recovery

## User backup

Phụ huynh tải được bản sao JSON toàn bộ dữ liệu gia đình từ thẻ "Dữ liệu gia đình" (`src/components/FamilyDataCard.tsx`) và nhật ký của bé dưới dạng CSV. Khôi phục từ file JSON chỉ có ở chế độ cục bộ (chưa đăng nhập). Dữ liệu gia đình trên cloud được khôi phục theo phần Operator backup bên dưới; không dùng client để ghi đè cloud state.

Định dạng bản sao JSON và các hàm export/import nằm ở `src/lib/family-backup.ts` và `src/lib/store/family-backup-actions.ts`.

## Operator backup

- Trước mỗi migration: Supabase logical backup và kiểm tra có thể đọc manifest/table counts.
- Hằng ngày: backup managed của Supabase theo gói dịch vụ.
- Hằng quý: restore vào project cách ly, chạy parser/schema checks và E2E family isolation.

Mục tiêu ban đầu: RPO 24 giờ, RTO 4 giờ. Điều chỉnh sau khi có dữ liệu vận hành.

## Restore drill

1. Tạo Supabase project cách ly.
2. Restore backup gần nhất.
3. Áp migration còn thiếu theo thứ tự.
4. Đổi toàn bộ secret của môi trường drill.
5. Chạy unit/API, RLS cross-family, pairing revoke, payment idempotency và domain concurrency tests.
6. Ghi thời gian phục hồi, checksum/table counts và sai lệch.

## Rollback

Worker rollback dùng deployment trước đó. Database rollback chỉ dùng script không phá dữ liệu trong `supabase/rollbacks/`; không drop table/column trong incident. Nếu migration mới có lỗi, chặn traffic mutation, rollback app, giữ dữ liệu và tạo forward-fix migration.
