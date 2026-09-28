---
title: "Phase 3: SEO Share and Public Information Architecture"
status: implementation-complete
phase: 3
priority: P0
effort: "5-7 days"
dependencies: [2]
---

# Phase 3: SEO Share and Public Information Architecture

## Overview

Tách public marketing shell khỏi app state để crawler, link preview và khách mới nhận nội dung đúng, trong khi người đã có session vẫn đi thẳng vào trải nghiệm phù hợp.

## Context links

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/components/LandingPage.tsx`
- `src/lib/i18n/language-detection.ts`
- `public/`

## Requirements

- [x] Hero, product value và pricing có HTML server-rendered; không phụ thuộc hydration để crawler đọc.
- [x] App/session shell vẫn client-side nhưng không gây flash landing cho phụ huynh/trẻ quay lại.
- [x] Có `/pricing`, `/framework`, `/roadmaps`; `/docs` giữ vai trò hướng dẫn sử dụng.
- [x] `robots.ts`, `sitemap.ts`, `manifest.ts`, canonical, Open Graph/Twitter image và structured data chỉ dùng claim xác minh.
- [x] Locale/country metadata giữ VN là thị trường thương mại; ngoài VN không hiện checkout PayOS như thể hỗ trợ toàn cầu.

## Implementation Steps

1. Tách server marketing route khỏi client app controller bằng boundary rõ ràng; giữ contract chuyển landing/app hiện có.
2. Di chuyển nội dung chuyên sâu sang routes riêng; định nghĩa navigation và breadcrumbs.
3. Bổ sung metadata per route, OG assets, robots/sitemap/manifest và schema Organization/SoftwareApplication phù hợp.
4. Thiết kế availability messaging theo locale/country; không chặn trải nghiệm demo.
5. Thêm SSR snapshot, crawler, metadata, no-flash session và broken-link tests.

## Todo

- [x] `curl` HTML `/` thấy nội dung hero/pricing có nghĩa.
- [x] Public routes, robots, sitemap, manifest trả đúng status/content-type.
- [x] Link preview có title, description, image và canonical đúng.
- [x] Parent/kid returning-session tests không hồi về sales page.

## Success Criteria

Khách mới, crawler và mạng xã hội thấy public site hoàn chỉnh; người dùng cũ không bị phá hành trình trực tiếp vào app.

## Risks and rollback

- SSR/client split dễ gây hydration mismatch. Giữ boundary nhỏ và contract tests trước refactor lớn.
- Không cache response phụ thuộc session/country theo cách trộn dữ liệu người dùng.

## Implementation evidence

- Root HTML trả hero và bảng giá có nghĩa trước hydration; landing được che trước paint khi request có auth cookie hoặc thiết bị đã ghi nhận phiên app.
- Các route `/pricing`, `/framework`, `/roadmaps` dùng server components và nguồn dữ liệu sản phẩm hiện có; `/pricing` chỉ mở checkout tại Việt Nam, ngoài Việt Nam chuyển sang demo.
- Metadata gồm canonical, Open Graph, Twitter card, JSON-LD không có rating/testimonial; robots chặn `/admin` và `/api`; sitemap chỉ liệt kê public routes đã duyệt.
- `npm run typecheck`, `npm run lint`, `npm run build`: đạt.
- `public-discovery.spec.ts` + `entry-journey.spec.ts`: 20/20 trên desktop và mobile khi chạy tuần tự như CI.
- Visual QA desktop bảng giá: bố cục ba gói, độ tương phản và điều hướng đều rõ; automated overflow checks đạt ở viewport mobile.
- Ghi chú hạ tầng test: Next dev Turbopack từng panic nội bộ khi hai browser projects đồng thời compile các route mới; production build Turbopack đạt và CI hiện chạy một worker, nên không xem đây là lỗi ứng dụng.
