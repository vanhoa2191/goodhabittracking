---
title: "Phase 5: Parent and Child Daily Experience"
status: implementation-complete
phase: 5
priority: P1
effort: "6-9 days"
dependencies: [1, 3]
---

# Phase 5: Parent and Child Daily Experience

## Overview

Giảm ma sát hằng ngày cho phụ huynh và trẻ trên mobile/desktop, dựa trên lỗi tái hiện được thay vì sửa lại toàn bộ UI đã qua kiểm thử.

## Context links

- `src/components/KidDashboard.tsx`
- `src/components/ParentDashboard.tsx`
- `src/components/ParentNavigation.tsx`
- `src/components/ParentSettingsTab.tsx`
- `src/components/ParentRewardsTab.tsx`
- `src/components/RewardTemplateLibrary.tsx`
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/mobile-dialogs.spec.ts`

## Requirements

- [x] Trẻ thấy chi tiết/cách làm nhiệm vụ; completion có motion/sound/haptic nhưng tôn trọng reduced-motion và mute.
- [x] Swipe hint chỉ hiện ở thiết bị có pointer/touch phù hợp; click/keyboard luôn là đường tương đương.
- [x] Heading hierarchy, focus management, contrast và 44px targets đạt WCAG 2.2 AA cho states thực tế.
- [x] Parent mobile không bị banner chồng đẩy thao tác chính xuống dưới; settings nhóm theo việc cần làm.
- [x] Phần thưởng gia đình đang dùng đứng trước thư viện gợi ý dài.

## Implementation Steps

1. Bổ sung E2E/a11y fixtures cho child paired, parent signed-in, empty/loading/error, modal và 375/768/1280.
2. Sửa chỉ các vi phạm tái hiện được: amber contrast, heading order, device hint, focus/scroll locking.
3. Gom banner thành one-at-a-time priority surface; giữ error/payment/security trước tips.
4. Chia settings theo thiết bị, tài khoản, riêng tư/thông báo, giao diện; giữ deep links ổn định.
5. Đảo thứ tự rewards và thêm progressive disclosure cho thư viện mẫu.

## Todo

- [x] Full-surface axe matrix xanh cho landing, child task/detail, parent approvals/rewards/settings và các locale hiện có.
- [x] Mobile modal giữ trong viewport, khóa focus và trả focus đúng.
- [x] Parent có điều hướng theo nhóm tác vụ, rewards hiện nội dung gia đình trước thư viện dài và action chính đạt target 44px.
- [x] Child có touch/click/keyboard parity.

## Success Criteria

Ba mẹ và trẻ hoàn thành các tác vụ thường ngày trên điện thoại bằng ít bước, không mất ngữ cảnh, không phụ thuộc cử chỉ ẩn.

## Risks and rollback

- Không đổi navigation/copy đã xác minh nếu usability test không chứng minh lợi ích.
- Mỗi thay đổi lớn UI sau feature flag; không gom vào một mega-redesign.

## Implementation evidence

- Completion chỉ rung sau khi lưu thành công; không rung khi reduced-motion hoặc mutation cloud thất bại. Âm thanh undo và complete dùng đúng cue.
- Swipe hint chỉ hiện với coarse pointer; nút chi tiết và nút hoàn thành luôn tồn tại cho click/keyboard.
- Settings có năm deep link theo tác vụ: thiết bị, tài khoản, riêng tư/thông báo, giao diện và bảo vệ PIN.
- Rewards gia đình đứng trước thư viện gợi ý; thư viện được thu gọn bằng progressive disclosure.
- Amber contrast và vùng bấm 44px đã được sửa tại banner demo, approvals và reward actions.
- `typecheck`, `lint`, production `build`: đạt.
- E2E trọng yếu trên desktop + mobile: task parity, haptic, rewards, settings, failed cloud completion, mobile dialogs và full-surface axe đều đạt sau khi chạy lại phần thay đổi.
- QA trực quan local xác nhận landing chuyển vào child dashboard, bố cục nhiệm vụ đầy đủ và không overflow ở viewport trình duyệt; interaction chi tiết/parent được bảo vệ thêm bằng E2E semantic locators.
