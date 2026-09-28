---
title: "Phase 4: Homepage Conversion and Verified Proof"
status: implementation-complete
phase: 4
priority: P1
effort: "5-8 days plus measurement window"
dependencies: [3]
---

# Phase 4: Homepage Conversion and Verified Proof

## Overview

Rút gọn sales page quanh một hành trình demo-first, giữ đăng nhập rõ ràng, dùng proof thật và đo funnel với ranh giới consent.

## Context links

- `src/components/LandingPage.tsx`
- `src/components/Header.tsx`
- `src/components/PricingModal.tsx`
- `src/lib/product-analytics.ts`
- `src/lib/analytics-consent-context.tsx`
- `docs/product-analytics.md`
- `docs/claims-ledger.md`

## Requirements

- [x] Above-the-fold giải thích đối tượng, kết quả, cách hoạt động và CTA demo trong một màn hình mobile hợp lý.
- [x] Demo là CTA chính để giảm ma sát; Google login/pricing vẫn luôn thấy và dùng được.
- [x] Trang chủ ngắn hơn; nội dung khung/lộ trình/bảng giá dài chuyển sang routes riêng.
- [x] Chỉ hiển thị testimonial/case study có nguồn và consent; khi chưa có dùng product proof đã xác minh.
- [x] Funnel analytics không thu PII và không chạy trái consent policy.

## Implementation Steps

1. Định nghĩa funnel: landing view -> demo start -> value event -> signup -> profile -> trial -> checkout -> paid.
2. Thiết kế lại section hierarchy và mobile sticky CTA; giữ light-default và typography dễ đọc.
3. Xây proof registry có source, consent, expiry/review owner; không hardcode lời chứng thực vô nguồn.
4. Instrument first-party anonymous aggregate hoặc consented analytics theo quyết định Phase 2; tách khỏi child analytics.
5. Reconcile migration consent/destination còn mở trong plan `260923`; staging phải thấy event hợp lệ trước khi bật production.
6. Chạy accessibility, performance budget và A/B chỉ sau khi baseline đủ điều kiện.

## Todo

- [x] Mobile/desktop landing không overflow và giảm rõ độ dài so với baseline audit.
- [x] Demo hoàn thành value event mà không cần tài khoản.
- [x] Không có proof/metric không truy được nguồn.
- [x] Dashboard funnel được ghi rõ là chưa khả dụng cho tới khi có consent population, destination và cửa sổ đo được duyệt.

## Success Criteria

Khách mới hiểu sản phẩm và chạm giá trị nhanh; conversion được đo trung thực mà không đổi riêng tư lấy số liệu.

## Risks and rollback

- Demo-first là giả thuyết, không chân lý. Feature flag CTA order và rollback nếu activation/quality giảm.
- Không tối ưu theo click nếu làm tăng nhầm lẫn hoặc giảm tỷ lệ hoàn tất hồ sơ.

## Implementation evidence

- Demo là CTA đầu tiên; Google sign-in và pricing vẫn hiển thị. Mobile có sticky CTA 48px.
- Landing không còn render catalogue framework/roadmap/plan dài; nội dung sâu chuyển sang ba public routes.
- Product proof đi qua registry có evidence; testimonial thiếu source/consent hoặc hết hạn bị loại.
- Funnel schema từ chối PII/free text và không emit khi thiếu explicit consent hoặc destination sink.
- `typecheck`, `lint`, production `build`, performance budget và 5 unit tests mới: đạt.
- Entry/public/smoke E2E: 56/56 trên desktop + mobile; landing desktop giảm từ baseline gate 5600px xuống dưới 4700px, không overflow.
- Analytics destination vẫn cố ý chưa bật; staging event và baseline measurement là release gate phụ thuộc quyết định Phase 2, không được giả lập bằng fixture.
