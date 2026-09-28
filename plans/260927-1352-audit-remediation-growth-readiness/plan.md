---
title: "KidHabit Audit Remediation and Growth Readiness"
description: "Khắc phục các khoảng trống đã xác minh trong audit, củng cố hành trình ba mẹ và trẻ, rồi chứng nhận production theo chiến lược ưu tiên Việt Nam."
status: in-progress
priority: P1
effort: "12-17 engineering weeks plus legal review and measurement windows"
issue: null
branch: main
tags: [bugfix, frontend, backend, security, growth, accessibility, tech-debt]
blockedBy: []
blocks: [260923-0030-complete-experience-roadmap]
created: 2026-09-27
---

# KidHabit Audit Remediation and Growth Readiness

## Overview

Kết hợp audit PDF 44 trang với kiểm tra repo và production gần nhất. Chỉ lập kế hoạch cho vấn đề còn đúng; không làm lại các hạng mục đã hoàn thành và không coi giới hạn của phiên audit cũ là lỗi sản phẩm.

## Outcome contract

- Trẻ vào thẳng trải nghiệm trẻ; phụ huynh đã đăng nhập vào thẳng khu vực phụ huynh; landing chỉ phục vụ khách mới hoặc người chủ động mở.
- Quét QR, nhập mã thủ công, hồ sơ, thanh toán và kích hoạt gói là các luồng chặn phát hành: phải được kiểm thử trên thiết bị thật.
- Landing ngắn hơn, tải được nội dung bán hàng trong HTML máy chủ, có trang pháp lý/hỗ trợ và metadata chia sẻ đầy đủ.
- Chỉ dùng bằng chứng thật, có sự đồng ý; không tạo testimonial, số liệu hoặc tuyên bố “top 1%” giả.
- Giữ ưu tiên Việt Nam. Các locale khác dùng cho trải nghiệm/giới thiệu; checkout quốc tế chỉ mở sau quyết định kinh doanh riêng.
- Không thu dữ liệu trẻ, nội dung nhiệm vụ, mã ghép nối hoặc dữ liệu thanh toán vào analytics/monitoring.

## Audit reconciliation

Chi tiết: [Audit reconciliation](./research/audit-reconciliation.md).

| Kết luận | Cách xử lý |
|---|---|
| Lỗi QR camera đã xác minh nhưng PDF bỏ sót | P0 trong Phase 1 |
| Legal, SEO/share, lifecycle, PWA, admin hardening, observability còn thiếu | Giữ trong roadmap |
| CI/build “chưa rõ” trong PDF | Không tạo task; bằng chứng hiện tại đã có CI/build xanh |
| Hồ sơ bé từng lỗi nhưng người dùng đã xác nhận tạo được | Giữ test hồi quy, không coi là bug đang mở |
| Accessibility hiện có 24/24 test xanh | Mở rộng coverage theo state/viewport; chỉ sửa lỗi tái hiện được |
| Quốc tế hóa thương mại | Không đảo quyết định ưu tiên Việt Nam |
| KPI top 1% trong PDF | Xem là giả thuyết; đo baseline rồi mới chốt target |

## Execution order

```text
P0: Phase 1 ----+       Phase 2 -> Phase 3
                |          |         |
                v          v         v
P1:          Phase 5    Phase 6   Phase 4
                |          |         |
                +----------+----+----+
                                v
                         Phase 7 + Phase 8
                                |
P2:                          Phase 9
                                |
                                v
                            Phase 10
```

Phases 1 và 2 có thể bắt đầu song song. Phases 4 và 5 chạy song song sau khi Phase 3 chốt cấu trúc public/app. Phase 7 và 8 chỉ phát hành sau khi trust, consent và observability đã có.

## Phases

Current state: Phase 1, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7 và phần implementation của Phase 8 đã hoàn tất và kiểm chứng local. Phase 9 đã có formatter locale/market, parity test, route-aware performance gate và các domain action module hiện hữu; phần tách nốt store/landing vẫn đang làm. Migration/RPC PostgreSQL thật, camera iOS/Android, caregiver invite hai tài khoản, consented analytics staging, lifecycle email production smoke và cài PWA thiết bị thật được giữ làm release gate tương ứng ở Phase 10. Phase 2 đã có publication gate và các surface nháp, còn chờ chủ sản phẩm chốt thông tin pháp lý/hỗ trợ trước khi bật công khai. Không coi production health hiện tại là bằng chứng deploy cho các thay đổi local chưa được phát hành.

| # | Phase | Priority | Depends on | Release gate |
|---|---|---:|---|---|
| 1 | [Trust and critical journey hotfixes](./phase-01-trust-and-critical-journey-hotfixes.md) | P0 | - | QR, PIN, profile resilience xanh |
| 2 | [Legal, support and trust surfaces](./phase-02-legal-support-and-trust-surfaces.md) | P0 | - | nội dung được chủ sản phẩm duyệt |
| 3 | [SEO, share and public information architecture](./phase-03-seo-share-and-public-information-architecture.md) | P0 | 2 | crawler/share artifacts hợp lệ |
| 4 | [Homepage conversion and verified proof](./phase-04-homepage-conversion-and-verified-proof.md) | P1 | 3 | demo-first funnel quan sát được |
| 5 | [Parent and child daily experience](./phase-05-parent-and-child-daily-experience.md) | P1 | 1, 3 | hành trình mobile không bị cản |
| 6 | [Lifecycle messaging and revenue operations](./phase-06-lifecycle-messaging-and-revenue-operations.md) | P1 | 2 | email/refund có consent và idempotency |
| 7 | [PWA and safe family growth](./phase-07-pwa-and-safe-family-growth.md) | P1 | 3, 5, 6 | cài đặt/offline/share không lộ dữ liệu trẻ |
| 8 | [Admin security and observability](./phase-08-admin-security-and-observability.md) | P1 | 1, 2 | role, audit log, redaction, alerts xanh |
| 9 | [Localization and maintainability](./phase-09-localization-and-maintainability.md) | P2 | 3-8 | parity nội dung + module boundaries |
| 10 | [Release certification and production rollout](./phase-10-release-certification-and-production-rollout.md) | P0 | 1-9 | production smoke + rollback đã diễn tập |

## Global acceptance criteria

- [ ] Một phụ huynh mới hoàn tất đăng nhập, tạo hồ sơ bé, nhận gợi ý, ghép thiết bị và giao việc mà không gặp ngõ cụt.
- [ ] Một trẻ đã ghép thiết bị chỉ thấy trải nghiệm của đúng trẻ đó và hoàn thành nhiệm vụ bằng chạm, vuốt hoặc bàn phím.
- [ ] QR camera chạy trên iOS Safari và Android Chrome; nhập mã vẫn là fallback đầy đủ.
- [ ] Thanh toán PayOS và kích hoạt entitlement được chứng nhận bằng callback/webhook thật đã làm sạch dữ liệu nhạy cảm.
- [ ] Legal/support, robots, sitemap, manifest, Open Graph và public routes trả 200 trên production.
- [ ] Analytics, email và monitoring tuân consent, minimization và redaction.
- [ ] `npm run ci`, `npm run build:cloudflare`, test E2E/a11y trọng yếu và production smoke đều xanh.

## Measurement policy

- Đo baseline trước. Không đưa target của PDF thành cam kết sản phẩm.
- Theo dõi TTFV, activation, D7/D30 retention, trial conversion và renewal bằng định nghĩa trong `docs/product-analytics.md`.
- Mọi dashboard phải ghi rõ mẫu, cửa sổ thời gian, consent population và giới hạn dữ liệu.

## Scope boundaries

- Không làm native app, subscription tự động gia hạn, payment provider quốc tế hoặc quảng cáo nhắm mục tiêu trẻ em trong plan này.
- Không tạo social proof giả; khi chưa đủ bằng chứng, dùng ảnh sản phẩm, quy trình và claim đã xác minh.
- Không xóa các tính năng engagement đang có; giữ sau feature flag tới khi đủ migration, consent và QA.

## Cross-plan dependency

Plan này chặn bước release còn lại của `260923-0030-complete-experience-roadmap`. Các task đã hoàn thành ở plan cũ được giữ nguyên; các task chưa hoàn thành về analytics, parent IA và release validation được đối chiếu tại đầu Phase tương ứng để tránh làm trùng.

<!-- slug: audit-remediation-growth-readiness -->
