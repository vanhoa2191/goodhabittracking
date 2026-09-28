---
phase: 1
title: "Trust and Critical Journey Hotfixes"
status: implementation-complete
priority: P0
effort: "4-6 days"
dependencies: []
---

# Phase 1: Trust and Critical Journey Hotfixes

## Overview

Sửa các lỗi có thể chặn luồng thật: camera QR bị header chặn, PIN phụ huynh không an toàn, lỗi mạng làm form hồ sơ mắc kẹt, nhãn thao tác trẻ chưa mô tả nhiệm vụ.

## Context links

- `next.config.ts`
- `src/components/ChildQrScanner.tsx`
- `src/components/ParentSettingsTab.tsx`
- `src/lib/store.tsx`
- `src/components/CustomerProfilePrompt.tsx`
- `src/components/KidDashboard.tsx`
- `tests/e2e/entry-journey.spec.ts`
- `tests/e2e/accessibility.spec.ts`

## Requirements

- [x] Chỉ cấp camera cho same-origin app; vẫn chặn microphone/geolocation.
- [x] CSP cho phép worker cần thiết của `qr-scanner` mà không nới script/frame/connect ngoài nhu cầu.
- [x] PIN không mặc định `1234`, không hiển thị rõ, bắt buộc tạo/đổi trước khi dùng cổng phụ huynh.
- [x] Có giới hạn thử PIN và thời gian khóa; trạng thái authoritative thuộc gia đình, không chỉ local state.
- [x] Save profile luôn thoát trạng thái loading khi timeout/network/JSON/API lỗi và hiển thị correlation ID an toàn.
- [x] Nút nhiệm vụ có accessible name chứa tên nhiệm vụ.

## Implementation Steps

1. Viết regression test chứng minh header production hiện chặn camera/worker; thêm test same-origin QR và manual fallback.
2. Sửa `Permissions-Policy` và CSP tối thiểu; xác minh camera trên HTTPS thật, iOS Safari và Android Chrome.
3. Thiết kế migration/RPC cho PIN hash, `pin_configured_at`, failed-attempt window và lockout; không lưu/log PIN thô.
4. Thay UI đổi PIN bằng create/verify/change flow; xóa mọi copy hiển thị PIN hiện tại.
5. Chuẩn hóa async profile save bằng `try/catch/finally`, timeout, disabled state, retry và error mapping.
6. Cập nhật task toggle label, focus order và test screen-reader name.

## Todo

- [x] Header security tests xanh.
- [x] QR scanner state và manual code fallback hoạt động khi camera bị từ chối.
- [x] PIN migration + API + UI + tests hoàn chỉnh ở local candidate.
- [x] Profile network-failure E2E không treo.
- [x] Task label E2E/a11y dùng tên nhiệm vụ cụ thể.

## Verification evidence

- `npm run lint`, `npm run typecheck`, `npm run build` đều exit 0 trên candidate hiện tại.
- Unit/API/migration: 40 focused tests xanh; full Vitest trước thay đổi cuối có 454 tests xanh.
- Playwright Chromium: 93/93; Phase 1 trên desktop + mobile Chromium: 10/10.
- Review độc lập không còn blocker sau khi form đổi PIN chờ trạng thái authoritative.
- Production gate còn lại: áp migration trước client, chạy RPC thật trên PostgreSQL, rồi quét camera trên iOS Safari và Android Chrome qua HTTPS. Gate này thuộc Phase 10 và không được suy diễn từ test mock.

## Success Criteria

Luồng đăng nhập, tạo hồ sơ, ghép thiết bị bằng QR/mã và chuyển chế độ phụ huynh chạy được trên thiết bị thật; không làm yếu isolation/CSP ngoài phạm vi đã liệt kê.

## Risks and rollback

- CSP sai có thể làm QR vẫn hỏng hoặc nới XSS surface. Rollback header riêng, giữ manual code.
- PIN migration phải rollout server trước client và có recovery flow cho phụ huynh đã đăng nhập.
- Không deploy client phụ thuộc schema mới trước khi preflight production xanh.
