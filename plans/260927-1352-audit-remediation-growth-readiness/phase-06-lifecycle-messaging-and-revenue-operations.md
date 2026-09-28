---
title: "Phase 6: Lifecycle Messaging and Revenue Operations"
status: implementation-complete
phase: 6
priority: P1
effort: "7-10 days"
dependencies: [2]
---

# Phase 6: Lifecycle Messaging and Revenue Operations

## Overview

Xây lifecycle tối thiểu giúp phụ huynh hiểu bước tiếp theo, nhận xác nhận giao dịch và được hỗ trợ; tách rõ transactional với marketing.

## Context links

- `src/app/api/entitlement/`
- `src/app/api/payment/`
- `src/app/api/privacy/`
- `src/components/AccountProfileCard.tsx`
- `src/components/AdminCustomerManager.tsx`
- `docs/deployment.md`

## Requirements

- [x] Transactional: welcome/setup, trial nearing end, payment receipt/status, support/refund status.
- [x] Marketing/win-back chỉ gửi khi consent chủ động còn hiệu lực; unsubscribe/suppression là authoritative.
- [x] Outbox/idempotency chống gửi lặp khi webhook, cron hoặc retry chạy lại.
- [x] Không đưa tên/nội dung hoạt động của trẻ vào email, subject, log hoặc provider metadata.
- [x] Refund/cancellation có policy, trạng thái, audit trail và thao tác admin rõ ràng.

## Implementation Steps

1. So sánh provider theo data region, deliverability, webhook, suppression, Cloudflare compatibility và chi phí; ghi ADR.
2. Tạo email outbox + template registry + preference/suppression model; migration theo server-first rollout.
3. Phát sự kiện từ trial/payment/support bằng idempotency key; gửi qua Worker/Cron có retry giới hạn và dead-letter visibility.
4. Thêm admin refund/cancel workflow, customer notification và reconciliation với PayOS status.
5. Test duplicate webhook, provider outage, bounced/suppressed address, revoked consent và redaction.

## Todo

- [x] Provider ADR được ghi nhận; production enablement vẫn chờ sender domain và privacy/retention approval.
- [x] Template vi-VN và fallback English được kiểm tra bằng schema/test.
- [x] Transactional/marketing consent boundaries có migration và contract tests.
- [x] Refund/cancel runbook và admin audit trail hoàn chỉnh.

## Success Criteria

Một lifecycle event chỉ tạo một thông báo phù hợp; người dùng kiểm soát marketing; operator có thể giải quyết thanh toán/hỗ trợ mà không sửa DB thủ công.

## Risks and rollback

- Provider là điểm phụ thuộc mới: app core không được fail khi email fail.
- Tắt sender/Cron là rollback; giữ outbox để replay có kiểm soát.

## Implementation evidence

- Migration `202609280001_lifecycle_revenue_operations.sql` tạo outbox, dedupe key, bounded retry, skip-locked claim, dead-letter, suppression và billing-case audit trail.
- Profile, trial window, payment activation, subscription cancellation và support/refund status đều phát lifecycle event server-side; core write không phụ thuộc provider.
- Dispatcher dùng Resend qua HTTPS với cùng durable idempotency key; GitHub scheduler gọi endpoint có `CRON_SECRET` mỗi giờ.
- Signed provider webhook ghi suppression cho bounce/complaint/suppressed; payload sai chữ ký hoặc quá 5 phút bị từ chối.
- Admin có luồng tạo/xử lý hỗ trợ, hủy link PayOS đang chờ, hủy subscription và hoàn tiền thủ công bắt buộc xác nhận.
- ADR: `docs/adr/0002-transactional-email-outbox.md`; runbook: `docs/runbooks/lifecycle-and-refunds.md`.
- Migration parse, 13 lifecycle unit/API/integration tests, typecheck, lint và production build: đạt.
- Admin E2E desktop/mobile: 2/2 đạt; ảnh full-page đã được kiểm tra trực quan ở cả hai viewport.
- Production email vẫn mặc định tắt. Sender domain, processor/privacy, retention, secret và real inbox smoke test được giữ làm release gate Phase 10, không giả lập thành production evidence.
