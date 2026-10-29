# quality-infra fixes (hoàn tất bởi coordinator sau khi worker hết quota)

| Mã | Kết quả | Thay đổi |
|---|---|---|
| QI-01 | Đã sửa, xác minh | next/eslint-config-next 16.3.8→16.4.1, zod ^4.6.6, vitest/coverage ^4.1.12, wrangler ^4.153.0. `npm audit --omit=dev`: 0 vulnerabilities; `npm run check:audit` passed. `next build` thành công trên 16.4.1. |
| QI-02 | Đã sửa | scripts/check-audit.mjs xử lý JSON lỗi registry thay vì báo passed; test trong tests/unit/check-audit.test.ts. |
| QI-03 | Đã sửa; lộ ra vi phạm ngân sách thật | check-performance-budget.mjs tính cả layout cha; test mới tests/unit/check-performance-budget.test.ts. Đo thật: route `/` = 1,783,933 B > ngưỡng 1,700,000 B (script cũ chỉ thấy 1,324,665 B). `npm run check:performance` hiện FAIL — cần quyết định: giảm bundle hoặc nâng ngưỡng có chủ đích. |
| QI-04 | Đã sửa | Playwright cấp cấu hình Supabase giả lập; test consent không còn skip, báo lỗi rõ khi thiếu cấu hình. |
| QI-05 | Đã sửa | .github/workflows/ci.yml chạy project mobile-chromium (quest-deferral, kid-bottom-nav, a11y-menus). Chưa chạy trên CI thật. |
| QI-06/07 | Không sửa (P3) | |

Kiểm chứng toàn cây: tsc 0 lỗi; ESLint sạch; vitest 3418 test (sau khi bump EXPECTED_SCHEMA_VERSION → 202610270001): tất cả pass; next build OK. E2E Playwright chưa chạy lại.
