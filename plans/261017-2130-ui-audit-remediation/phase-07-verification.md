# Phase 07 — Nghiệm thu, re-audit và release handoff

Owner Kilo verifier; GPT độc lập nghiệm thu; AGY review visual/copy nếu runtime khả dụng. Depends01–06 accepted.

## Gate

Chạy [test-spec.md](test-spec.md): lint/typecheck/unit/integration/API phù hợp, full test suite, build mới, budget, critical E2E/a11y Chromium/mobile và WebKit focus/timer/theme/navigation. Các lỗi baseline phải có bằng chứng phân loại; không suppress test hoặc hạ budget. Build Cloudflare theo deployment path trước khi tuyên bố release-ready.

Re-audit đúng surfaces/data/flags; detector một lần sau UI xong, xác minh false-positive. UX score là nhận định phụ, không dùng “đạt32/40” làm thay thế task success/contrast tests. Không có P0/P1 mở;9nhóm đều có proof. V01–V05 có trạng thái reproduced-fixed hoặc not-reproduced với procedure. Performance báo metric thật và budget, không bịa Lighthouse nếu chưa chạy.

Kiểm tra fresh production-like start/reload: không hydration mismatch hoặc application error trong luồng chính; ghi HMR-only noise riêng. Manual screen reader và iOS/Android vật lý nếu chưa làm giữ trạng thái pending, không tick giả. Không deploy production, gửi email, chạy payment thật hoặc tạo public artifacts trong phase này.

## Handoff

`handoffs/phase-07.md`: audit closure matrix, command/exit/log manifest, final screenshots, before/after performance, remaining external gates, independent reviewer decision, rollback boundaries, change summary và release instructions cụ thể. Không để failed dispatch hoặc resource còn chạy không được ghi rõ. Sau nhận worker_done: reuse ngay hoặc worker-release theo skill.

Người nhận release nhận packet reviewable; trạng thái có thể là implementation-verified/manual-gates-pending, khác với production-released. Rollback theo từng phase patch/commit, không reset shared checkout. Mọi commit phát sinh dùng Lore protocol.
