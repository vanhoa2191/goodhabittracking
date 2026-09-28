---
title: "Phase 2: Legal Support and Trust Surfaces"
status: in-progress
phase: 2
priority: P0
effort: "3-5 days plus owner/legal review"
dependencies: []
---

# Phase 2: Legal Support and Trust Surfaces

## Overview

Tạo bề mặt tin cậy công khai bằng ngôn ngữ dễ hiểu cho phụ huynh, đồng thời ghi đúng chính sách dữ liệu trẻ em, thanh toán, hủy và hỗ trợ.

## Context links

- `docs/claims-ledger.md`
- `docs/deployment.md`
- `src/app/docs/page.tsx`
- `src/components/LandingPage.tsx`
- `src/components/CheckoutModal.tsx`

## Requirements

- [ ] `/privacy`, `/terms`, `/contact` có metadata, mobile layout và link toàn site.
- [ ] Privacy mô tả loại dữ liệu, mục đích, quyền cha mẹ/người giám hộ, retention, export/delete, analytics/marketing consent và contact.
- [ ] Terms mô tả trial, gói hiện hành, thanh toán một lần theo kỳ, hủy/refund, hành vi cấm và giới hạn dịch vụ.
- [ ] Không nhắc công nghệ backend cho người dùng phổ thông; dùng “đồng bộ đám mây”.
- [ ] Mọi claim pháp lý/sản phẩm đối chiếu `claims-ledger`; chỗ chưa được duyệt ghi rõ `[CẦN DUYỆT]` trong bản nháp, không lên production.

## Implementation Steps

1. Lập data/consent/retention inventory từ schema, APIs và docs hiện có.
2. Soạn nội dung vi-VN trước; có owner/legal review gate trước merge production.
3. Tạo public routes và footer/trust links tại landing, login, onboarding, checkout, settings.
4. Thêm contact flow chống spam, không thu dữ liệu trẻ không cần thiết.
5. Thêm route/link/copy/accessibility tests.

## Todo

- [ ] Data inventory và claim matrix hoàn tất.
- [ ] Owner duyệt privacy/terms/refund/contact.
- [ ] Tất cả link trả 200 và dùng được bằng bàn phím.
- [ ] Checkout hiển thị link điều khoản trước khi tạo đơn.

## Success Criteria

Phụ huynh hiểu KidHabit lưu gì, dùng vào đâu, cách yêu cầu hỗ trợ/xóa dữ liệu và điều kiện thanh toán mà không cần hiểu thuật ngữ kỹ thuật.

## Risks and rollback

- Không tự khẳng định tuân thủ luật hoặc thời hạn hoàn tiền khi chưa được duyệt.
- Có thể phát hành route ở trạng thái noindex staging; production chỉ mở sau approval.
