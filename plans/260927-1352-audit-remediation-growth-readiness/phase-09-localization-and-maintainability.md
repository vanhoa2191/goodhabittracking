---
title: "Phase 9: Localization and Maintainability"
status: in-progress
phase: 9
priority: P2
effort: "8-12 days"
dependencies: [3, 4, 5, 6, 7, 8]
---

# Phase 9: Localization and Maintainability

## Overview

Hoàn thiện parity locale cần thiết và tách các module quá rộng sau khi contract hành vi đã ổn định.

## Context links

- `src/lib/i18n/`
- `src/data/habit-framework-v1.vi.json`
- `src/lib/store.tsx`
- `src/lib/store/`
- `apps/marketing/site-content.mjs`
- `apps/marketing/render-site.mjs`
- `src/lib/constants.ts`

## Requirements

- [ ] Vi-VN là source locale được duyệt; locale khác không lẫn tiếng Anh ngoài fallback được công bố.
- [x] Giá, ngày, giờ, tuổi và currency dùng formatter theo locale/market availability.
- [x] Public copy tách khỏi app copy; translation keys typed và có parity check.
- [x] Domain actions đã được tách theo các module auth/family/profile/activity/reward/billing/experience hiện hữu; `store.tsx` vẫn là adapter orchestration giữ contract public.
- [x] Public sales copy và renderer tách khỏi app bundle; marketing không import auth, API, PayOS hoặc Supabase.

## Implementation Steps

1. Inventory missing/fallback keys và content framework; ưu tiên VN, EN, rồi locale có bằng chứng nhu cầu.
2. Thêm automated parity/placeholder/interpolation tests và human review checklist.
3. Viết characterization tests cho store selectors/actions và landing behaviors trước refactor.
4. Tách store theo auth, family, profile, activity/reward, billing, experience; giữ adapter API cũ trong quá trình chuyển nội bộ.
5. Tách landing sections/data và shared UI primitives theo usage thật; đo bundle/performance sau mỗi lát cắt.

## Todo

- [x] Locale parity report không có fallback ngoài catalog fallback đã công bố.
- [x] Characterization + integration tests giữ nguyên hành vi.
- [x] Module dependency không tạo vòng import trong typecheck/build.
- [x] Performance gate đo tải ban đầu theo từng route, không cộng code-split của các route không được tải cùng nhau. Route lớn nhất là `/` ở `1,792,380` bytes, dưới budget `1,900,000`; chunk lớn nhất `787,067` bytes, dưới budget `1,000,000`. Tổng static chunks `2,526,219` bytes vẫn được in như diagnostic.

## Verification evidence

- Formatter tests cover locale mapping, VND display, unavailable-market currency code, number/date/date-time.
- Locale parity suite remains green across all supported catalogs.
- Full unit suite, Chromium E2E suite and route-aware performance gate are green; remaining Phase 9 work is maintainability follow-up rather than a failing local quality gate.
- Home route first-load assets currently measure `1,792,380` bytes from the generated App Router entry manifest; this is a diagnostic signal, not a replacement for the repository-wide budget.
- Performance script now reads App Router entry manifests and checks the largest route initial payload; this prevents a lazy route from masking or falsely failing the first-load gate.

## Success Criteria

Nội dung không trộn ngôn ngữ và các phần thay đổi thường xuyên có owner/module rõ, không cần sửa mega-file cho mỗi tính năng.

## Risks and rollback

- Không refactor đồng thời với thay đổi behavior. Mỗi commit/lát cắt có test và rollback độc lập.
- Không dịch bằng suy đoán các khái niệm chuyên môn; đánh dấu cần review thay vì bịa.
