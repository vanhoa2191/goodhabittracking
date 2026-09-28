---
title: "Phase 10: Release Certification and Production Rollout"
status: in-progress
phase: 10
priority: P0
effort: "4-6 days plus staged observation"
dependencies: [1, 2, 3, 4, 5, 6, 7, 8, 9]
---

# Phase 10: Release Certification and Production Rollout

## Overview

Chứng nhận toàn bộ hành trình trên staging/production, rollout theo lớp và giữ đường rollback không làm mất dữ liệu gia đình.

## Context links

- `scripts/verify-release-candidate.mjs`
- `scripts/verify-live-family-boundaries.mjs`
- `scripts/verify-live-family-lifecycle.mjs`
- `.github/workflows/`
- `docs/deployment.md`
- `docs/data-recovery.md`
- `plans/260923-0030-complete-experience-roadmap/phase-09-release-validation-and-rollout.md`

## Requirements

- [ ] Migration inventory/preflight/backup/rollback được chốt trước Worker deploy.
- [ ] CI, Cloudflare build, unit/API/integration/E2E/a11y/performance/secrets xanh ở exact commit. Local evidence: build/unit/E2E/a11y/secrets xanh; route-aware performance gate xanh (`/` 1,792,380 bytes, largest chunk 787,067 bytes). Tổng static chunks 2,526,219 bytes vẫn là diagnostic.
- [ ] Manual QA trên desktop, iOS Safari, Android Chrome cho guest/demo/parent/kid/admin.
- [ ] PayOS create/QR/webhook/return/entitlement và refund/support được chứng nhận không lộ secret/PII.
- [ ] Rollout bằng feature flags/cohorts; health/alerts quan sát trong cửa sổ đã định nghĩa.

## Implementation Steps

1. Reconcile migrations chưa áp từ plan cũ; tạo backup phù hợp Supabase Free và chạy preflight transaction-safe.
2. Chạy `npm run ci`, `npm run build:cloudflare`, focused E2E/a11y/performance và release verifier trên exact SHA.
3. QA ma trận: new visitor, returning parent, paired child, payment return, profile retry, QR/manual, legal/support, PWA update, admin step-up.
4. Deploy canary/flags trước; quan sát health, errors, payment, outbox, profile/pairing và rollback signals.
5. Sau ổn định, mở theo phase, cập nhật deployment/runbook và đóng các checkbox trùng ở plan `260923`.

## Todo

- [ ] Migration backup/preflight evidence lưu không chứa dữ liệu khách hàng.
- [ ] Exact-SHA CI/build/test ledger xanh.
- [ ] Manual QA evidence cho thiết bị thật.
- [ ] Production health/dependency checks xanh sau deploy.
- [ ] Rollback drill hoặc dry-run có thời gian/owner rõ.

## Verification evidence

- `npm run verify:live-boundaries` passed against the configured Supabase project: anonymous access denied, same-family access allowed, cross-family access denied. The verifier used synthetic accounts/fixtures and cleaned them up in `finally`; this does not replace migration backup/preflight or exact-SHA production certification.
- `npm run verify:live-lifecycle` passed against the configured production origin: persistent pairing, credential rotation, child completion, parent approval, reward delivery, reconnect, revoke and owner deletion. The verifier used one synthetic family and cleaned it up in `finally`; this does not prove PayOS, device-camera or release-SHA coverage.
- Supabase migration preflight listed exactly four pending migrations (`202609270004` through `202609280003`); `supabase db push --yes` applied them, and a subsequent migration list showed local/remote parity. Production `/api/health` then returned HTTP 200 with `status=ready` and all dependency checks true.
- Supabase Free has no managed scheduled backup/PITR available in the dashboard; local schema-only dump was not produced because Docker/Podman and `pg_dump` are unavailable. Backup/rollback evidence remains open for the release gate.
- Cloudflare Worker deploy from commit `d6818e6` completed as version `c66d1b58-b2ed-4068-970a-16e4a0ebc1e1`. Post-deploy checks returned HTTP 200/`ready`, all dependency checks true, public landing/pricing/manifest 200, and both live verifiers passed again against the deployed origin.

## Success Criteria

Production đáp ứng global acceptance criteria, không có regression P0/P1 mới trong observation window và operator có thể rollback an toàn mà không xóa dữ liệu.

## Risks and rollback

- Không deploy Worker phụ thuộc schema trước migration.
- Rollback bằng feature flag/redeploy commit trước; migration destructive không nằm trong plan này.
- Nếu payment, isolation, profile hoặc pairing fail, dừng rollout ngay cả khi UI/SEO đã xanh.
