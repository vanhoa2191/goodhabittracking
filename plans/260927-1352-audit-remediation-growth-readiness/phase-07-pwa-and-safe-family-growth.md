---
title: "Phase 7: PWA and Safe Family Growth"
status: implementation-complete
phase: 7
priority: P1
effort: "7-10 days"
dependencies: [3, 5, 6]
---

# Phase 7: PWA and Safe Family Growth

## Overview

Cho phép cài KidHabit như ứng dụng web và mở vòng lặp mời người chăm sóc/chia sẻ thành tích mà không cache hoặc phát tán dữ liệu trẻ.

## Context links

- `src/app/manifest.ts` (extend the Phase 3 baseline)
- `public/`
- `src/components/ChildDevicesPanel.tsx`
- `src/lib/auth/`
- `supabase/migrations/`

## Requirements

- [x] Manifest/icon/theme/start URL hợp lệ và installable trên Android/iOS hướng dẫn phù hợp.
- [x] Service worker chỉ cache public shell/static assets; không cache API, auth, child profile, payment hoặc admin responses.
- [x] Invite caregiver dùng token một lần, có hạn, role tối thiểu, revoke và audit.
- [x] Share achievement mặc định không có tên/ảnh/tuổi/nhiệm vụ của trẻ; preview trước khi chia sẻ.
- [x] Referral không khuyến khích spam và không gắn tracking trẻ em.

## Implementation Steps

1. Chốt cache matrix và threat model trước khi thêm service worker.
2. Mở rộng manifest baseline của Phase 3, thêm icons/offline public fallback và update/recovery UX để tránh stale app.
3. Thiết kế caregiver membership roles, invite lifecycle, RPC/API và acceptance flow.
4. Tạo privacy-safe share cards từ template không PII; chỉ thêm dữ liệu do phụ huynh nhập sau preview/consent.
5. Test offline/logout/account switch, cache purge, expired/replayed invite và cross-family access.

## Todo

- [x] Chrome installability gate (`Page.getAppManifest` và `Page.getInstallabilityErrors`) không có lỗi; Lighthouse production được chạy lại ở Phase 10.
- [x] Sensitive route cache audit không có hit.
- [x] Caregiver invitation isolation tests xanh.
- [x] Share preview không có child identifiers mặc định.

## Implementation evidence

- Manifest có icon PNG `192x192`, `512x512`, maskable và Apple touch icon; production build đăng ký service worker thành công.
- `public/sw.js` dùng allowlist, navigation chỉ network-first với offline public fallback; API, admin, invite, auth, pricing, privacy và terms không bị service worker can thiệp.
- Migration `202609280002_caregiver_invites.sql` chỉ lưu hash token, khóa hàng khi accept, chặn replay/expiry/revoke/cross-family và giữ role `caregiver` ngoài `can_manage_family`.
- Người chăm sóc được đưa vào dashboard chỉ đọc; account switch xóa family scope trước khi chờ snapshot mới và bỏ snapshot đến trễ của tài khoản cũ.
- Chia sẻ thành tích dùng nội dung generic, URL không query/hash, không referral ID và bắt buộc mở preview trước thao tác chia sẻ.
- Kiểm chứng: 497/497 unit/API/integration tests, 10/10 hành trình Phase 7 desktop/mobile, 2/2 production PWA/cache checks, lint, typecheck và Next production build đều xanh.

## Phase 10 release carry-over

- Áp migration caregiver vào PostgreSQL production/staging và chạy accept/replay/revoke bằng hai tài khoản thật.
- Chạy lại Lighthouse PWA trên URL production và cài thử Android Chrome/iOS Safari trên thiết bị thật.

## Success Criteria

KidHabit cài được, cập nhật an toàn và hỗ trợ gia đình cùng chăm sóc mà không biến dữ liệu của trẻ thành growth payload.

## Risks and rollback

- Service worker stale có thể giữ code cũ: cần versioning, skip-waiting có kiểm soát và clear-cache recovery.
- Caregiver roles mở rộng authorization surface; rollout sau feature flag và security review.
