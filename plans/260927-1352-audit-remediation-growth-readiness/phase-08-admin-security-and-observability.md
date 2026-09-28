---
title: "Phase 8: Admin Security and Observability"
status: implementation-complete
phase: 8
priority: P1
effort: "7-10 days"
dependencies: [1, 2]
---

# Phase 8: Admin Security and Observability

## Overview

Thay quyền admin dựa vào email env bằng quyền có thể quản trị/audit và bổ sung giám sát lỗi đã làm sạch dữ liệu nhạy cảm.

## Context links

- `src/lib/auth/admin-access.ts`
- `src/app/api/admin/`
- `src/app/admin/page.tsx`
- `src/components/AdminCustomerManager.tsx`
- `src/app/error.tsx`
- `src/app/api/health/route.ts`
- `supabase/migrations/202609210005_customer_admin.sql`

## Requirements

- [x] Admin authorization từ DB role/claim authoritative; `ADMIN_EMAILS` chỉ bootstrap khẩn cấp có expiry/runbook.
- [x] Step-up MFA cho thao tác coupon, đổi gói, refund, export và quyền admin.
- [x] Mọi mutation admin ghi actor, target, action, before/after đã tối thiểu hóa, reason, correlation ID và timestamp.
- [x] Error monitoring scrub child/profile/payment/pairing fields trước khi rời process.
- [x] Alerts cho health, payment webhook, profile/pairing failure spike, email outbox và deploy regression.

## Implementation Steps

1. Threat-model admin roles, bootstrap, revocation, account compromise và support workflow.
2. Tạo admin membership/audit schema, server authorization helper và MFA/reauth gate.
3. Chuyển từng API admin; test fail-closed, role revoke, stale session và cross-family impact.
4. Chọn monitoring provider sau redaction proof; chuẩn hóa sanitized error envelope/correlation ID.
5. Tạo alert thresholds từ baseline, dashboard/runbook và synthetic read-only checks.

## Discovery baseline (2026-09-28)

- `src/lib/auth/admin-access.ts` và bốn nhóm API admin hiện chỉ đối chiếu email với `ADMIN_EMAILS`; chưa có DB membership, expiry hoặc thu hồi tức thời.
- `/admin` chưa có server authorization gate. API vẫn fail-closed bằng 403 nhưng HTML/JS quản trị được phục vụ trước khi xác thực quyền.
- Coupon, customer, subscription và billing-case mutation chưa có một audit contract chung. Một số bảng có `created_by` và billing case có event history, nhưng chưa đủ actor/target/action/before-after tối thiểu/reason/correlation ID cho mọi mutation.
- Chưa có AAL2/MFA step-up cho coupon, đổi gói, refund/cancellation hoặc cấp quyền.
- `src/lib/observability/logger.ts` đã allowlist trường và nhiều API thường đã có correlation ID; API admin chưa dùng thống nhất. Đây là nền để mở rộng, không viết logger thứ hai.
- `/api/health` đã kiểm tra database, billing và pairing; lifecycle email đã có outbox, retry tối đa năm lần và dead-letter. Khoảng trống còn lại là tổng hợp các tín hiệu, redaction proof, alert threshold và recovery notification.
- OpenCode được dùng làm scout đọc-only. Báo cáo của nó hữu ích để định vị file nhưng nhận định “email fire-and-forget/no outbox” bị bác bỏ bằng migration `202609280001_lifecycle_revenue_operations.sql` và test Phase 6.

## Bounded execution order

1. Tạo DB-backed admin memberships, role scope, revoke/expiry và emergency bootstrap có hạn; thêm shadow authorization trước khi enforcement.
2. Tạo immutable admin audit contract và helper dùng chung; chuyển từng mutation với correlation ID, reason bắt buộc và before/after tối thiểu.
3. Yêu cầu Supabase AAL2 cho thao tác high-impact và luồng enrollment/challenge an toàn; không dùng parent PIN thay MFA.
4. Bảo vệ server-side `/admin`, thêm rate limit/pagination và test revoked, expired, stale-session, cross-role.
5. Mở rộng sanitized operational envelope, canary redaction tests và monitoring adapter không nằm trên critical path.
6. Định nghĩa baseline/threshold, synthetic read-only checks và diễn tập notify/recovery cho health, payment, profile/pairing, outbox và deploy.

## Todo

- [x] Không API admin nào chỉ dựa vào email string.
- [x] High-impact action yêu cầu step-up và reason.
- [x] Redaction unit/integration tests dùng canary secrets/PII và chứng minh không thoát ra.
- [x] Alert workflow có nhánh notify/recovery; production drill thật vẫn là release gate.

## Verification evidence

- `npm test`: 124 files, 513 tests passed.
- Admin E2E và full Chromium E2E: 115 passed, 3 intentionally skipped.
- `npm run typecheck`, `npm run lint`, `npm run build:cloudflare`: passed.
- SQL migration parser/integration checks, redaction, authorization and operational health tests: passed.
- Production public health was read-only checked at the current origin: HTTP 200, `ready`, all published dependency checks true. This does not certify the local un-deployed commit.

## Success Criteria

Quyền admin có cấp/thu hồi/audit rõ ràng; sự cố production được phát hiện mà log/telemetry không chứa dữ liệu nhạy cảm.

## Risks and rollback

- Sai migration quyền có thể khóa admin hợp lệ hoặc mở quyền. Rollout shadow-check trước enforcement.
- Monitoring SDK không được nằm trên critical path request.
