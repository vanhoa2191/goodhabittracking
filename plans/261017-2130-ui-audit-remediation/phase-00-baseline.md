# Phase 00 — Baseline và khóa hành vi

Owner Kilo; reviewer GPT; handoff → OpenCode01, Kilo02, AGY/GPT03. Status: accepted; see handoff for baseline evidence and explicit downstream gaps.

## Đầu vào và scope

Đọc audit và ma trận trong plan.md; đọc `playwright.config.ts`, `tests/e2e/accessibility.spec.ts`, `parent-today.spec.ts`, `appearance.spec.ts`, `task-card.spec.ts`, `kid-hero-compact.spec.ts`, `phase-five-daily-experience.spec.ts`; tìm coverage trước khi viết. Không sửa UI. Chỉ sở hữu fixture/test/baseline report được coordinator giao.

## Công việc

1. Chụp HEAD + dirty manifest (chỉ path/hash, không secrets), Node≥24, dependencies; ghi cờ env public theo allowlist, không dump .env.
2. Tái hiện9nhóm và V01–V05; đánh dấu source-only, browser-confirmed, false-positive hay chưa đo. Theme đi qua selector thực thay vì chỉ ép class.
3. Thêm/chỉnh regression cho scope/feedback và behavior sẽ bị cleanup chạm tới. Không khóa layout sai bằng screenshot test làm chuẩn mong muốn. Test bug mới được phép red riêng; suite hiện hữu ghi baseline rõ.
4. Tạo fixtures hai bé pending task+reward, empty, nhiều task, long names; thêm delay/failure cho mutation. Ưu tiên dùng cloud-family-fixture và pin-helper hiện có. Không gọi production.
5. Capture demo, paired-child và parent fixture ở375/768/1280; prod-like build để phân biệt hydration/HMR. Đo asset/bundle theo budget hiện hữu; không dùng Next dev compile time làm perf metric.

## Exit gate

Mỗi A/V ID có reproduction hoặc kết luận giới hạn; scope test chỉ ra chính xác sự lệch summary/queue, slow/failure tests có assert giữ context; baseline commands/exit codes lưu đủ. Không làm giả build/test pass khi chưa chạy. Input cho03 nêu nhóm tuổi thương mại chưa quyết, ageTheme off/on đã tách.

## Handoff

Điền `handoffs/phase-00.md`: manifest/fixtures/test-gap report, screenshot paths, flag matrix, regression red cases, perf baseline, ownership test files. GPT nhận, phân các test files cho phase01/02; chỉ dispatch sau phase00 accepted. Rollback: bỏ patch tests/fixture trong scope, giữ report.
