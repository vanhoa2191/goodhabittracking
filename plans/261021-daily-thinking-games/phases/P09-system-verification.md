# P09 — QA hệ thống và readiness

Trạng thái: PLANNED, chưa triển khai hoặc nghiệm thu.
Owner: Kilo, GPT review findings.
Receiver/reviewer: GPT / AGY pilot.
Phụ thuộc: P07, P08.

## Đầu vào

- Đọc `../plan.md`, `../test-spec.md`, contract version hiện hành và handoff ACCEPTED của phase phụ thuộc.
- Kiểm tra dirty files và `../plan.md` (phần phân công/lock); bạn không làm một mình trong checkout. Không revert người khác.
- Nếu viết Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/` trước khi sửa.

## Công việc

1. Chạy test matrix test-spec.md, gồm 20 concurrent starts, replay IDs, RLS, expired/revoked, cross-family, cutoff/DST.
2. Chạy lint/typecheck/unit/API/integration; build Cloudflare/performance/secrets/audit/required CI; record exact commands và exit codes.
3. Real browser: hai tab/chia state, đổi child, offline/reconnect, response out of order, rollover, approval late/undo.
4. Visual-verdict mỗi iteration; a11y keyboard/tap/screen reader/mute/reduced motion và viewport 375px/desktop.
5. Report mọi finding severity/file:line/repro/fix; trả đúng owner; reviewer không tự giảm gate để pass.

## Phạm vi file / artifact

- `verification-matrix.md`
- `command-logs/`
- `visual verdict JSON/screenshots`
- `findings.md`
- `release-candidate-manifest.json`

## Tham chiếu hiện tại

- `package.json`
- `tests/unit`
- `tests/api`
- `tests/integration`
- `tests/e2e`
- `scripts/check-performance-budget.mjs`

## Gate có thể kiểm chứng

- [ ] Zero unresolved P1/P2; baseline lỗi có trước được ghi và có quyết định chặn release, không lặng lẽ bỏ qua.
- [ ] Phân biệt PASS/MOCK-ONLY/NOT-RUN/BLOCKED; không dùng local green để tuyên bố production green.
- [ ] Migration apply/preflight/rollback local và kill-switch rehearsal pass.
- [ ] Catalog, source licenses, age/locale coverage và performance budget cùng version release candidate.

## Kiểm chứng

- Theo test-spec.md; full npm run ci khi môi trường đủ, lỗi network/tooling phải ghi rõ và xử lý trước release.

## Rollback / phục hồi

Không deploy/đánh dấu release-ready khi thiếu SQL thật, browser thật hoặc còn P1/P2.

## Handoff bắt buộc

- Artifact: `../handoffs/P09.md`. Điền template, đính evidence; không chỉ gửi thông báo chat.
- Gửi tới **GPT / AGY pilot**; nêu task/dispatch/run, SHA, file locks, command/exit codes, environment, findings và việc tiếp.
- Receiver xác minh artifact và ghi ACCEPTED/REWORK/BLOCKED. P1/P2 hoặc evidence bắt buộc thiếu không pass gate.
- Khi worker_done được nhận, coordinator reuse đúng terminal cho dispatch kế tiếp hoặc worker-release theo guide.
- Không tự bắt đầu phase sau nếu dependency chưa ACCEPTED.
