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
- `src/components/LandingPage.tsx`
- `src/lib/constants.ts`

## Requirements

- [ ] Vi-VN là source locale được duyệt; locale khác không lẫn tiếng Anh ngoài fallback được công bố.
- [x] Giá, ngày, giờ, tuổi và currency dùng formatter theo locale/market availability.
- [x] Public copy tách khỏi app copy; translation keys typed và có parity check.
- [x] Domain actions đã được tách theo các module auth/family/profile/activity/reward/billing/experience hiện hữu; `store.tsx` vẫn là adapter orchestration giữ contract public.
- [ ] Landing/content constants tách theo section/data, tránh duplicate Tailwind chỉ khi component boundary thật sự lặp.

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
- [ ] Bundle/performance không vượt budget hiện tại: build hiện vượt `maxTotalJavaScriptBytes` 26.219 bytes, chưa nâng budget.

## Verification evidence

- Formatter tests cover locale mapping, VND display, unavailable-market currency code, number/date/date-time.
- Locale parity suite remains green across all supported catalogs.
- Full unit suite and Chromium E2E suite are green; performance budget remains the only local quality gate not green.

## Success Criteria

Nội dung không trộn ngôn ngữ và các phần thay đổi thường xuyên có owner/module rõ, không cần sửa mega-file cho mỗi tính năng.

## Risks and rollback

- Không refactor đồng thời với thay đổi behavior. Mỗi commit/lát cắt có test và rollback độc lập.
- Không dịch bằng suy đoán các khái niệm chuyên môn; đánh dấu cần review thay vì bịa.
