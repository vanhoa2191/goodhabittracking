# Kế hoạch triển khai — Sinh hoạt hằng ngày

Ngày: 24/10/2026. Trạng thái: **chờ chủ sản phẩm duyệt**. Chưa dispatch worker nào.
Nguồn yêu cầu: `plan.md` cùng thư mục (mục 1–9 của Codex + mục 10 bổ sung). Khi mâu thuẫn, mục 10 thắng.

## 0. Quyết định đã chốt

| # | Quyết định | Giá trị |
|---|---|---|
| D1 | Điểm mặc định mục `WIT-DLY-*` | **5 sao/mục**, phụ huynh sửa được (kể cả 0). `WIT-NUT-01`/`WIT-CAP-01` giữ điểm cũ |
| D2 | Ngôn ngữ MVP | **Chỉ tiếng Việt**; copy ánh xạ theo ID để thêm `en` ở đợt sau |
| D3 | Chống trùng | UUIDv5 tất định + server coi `23505` là thành công idempotent (mục 10.1); không làm RPC/advisory lock |
| D4 | Phát hành | Sau cờ mới `dailyLivingHabits` (`NEXT_PUBLIC_DAILY_LIVING_HABITS`), merge “tối” rồi bật sau |
| D5 | Chuyển mẫu đánh răng gộp (P3b) | PR riêng, sau khi PR chính đã lên production |
| D6 | Nhánh | `feat/daily-living-habits` từ `origin/main` (`f04d14c`) trong Orca worktree riêng; không làm trên checkout hiện tại (đang có nhiều file chưa commit ngoài phạm vi) |

Phát hiện giúp giảm việc: màn hình của bé đã nhóm việc theo `timeOfDay` (`src/components/KidDashboard.tsx:606`), nên phía bé chỉ cần kiểm chứng, không phải xây mới.

## 1. Đội hình và model

Giới hạn máy: **tối đa 4 worker chạy cùng lúc** (kể cả reader và kilo).

| Lane | Agent / model | Vì sao chọn | Nhiệm vụ |
|---|---|---|---|
| **R — Inbox reader** | opencode · `opencode/deepseek-v4.1-flash-free` | Việc đọc/tóm tắt, cần rẻ và chạy lâu | Đọc inbox duy nhất, ghi `execution/reader-log.md`, chỉ báo coordinator khi cần quyết định / xong wave / bị chặn |
| **B — Backend P1** | codex · `gpt-6.1-sol`, reasoning **high** | Phần khó nhất: migration, API idempotent, sync/backup, transaction semantics | Namespace DLY, migration, `23505` readback, mapper/backup roundtrip, test API/SQL |
| **C — Catalog & dữ liệu** | opencode · `opencode/deepseek-v4.1-flash-free` | Việc nhỏ, hợp đồng rõ, nhiều test thuần | JSON catalog 12 mục + 4 bộ, validator, adapter, hàm ID tất định, copy vi theo ID, cờ |
| **U — UI phụ huynh** | agy · `gemini-4-argon-medium` | Mạnh về frontend, theo yêu cầu chủ sản phẩm | Thư viện Sinh hoạt hằng ngày, modal Bộ sinh hoạt, trạng thái Đã thêm/Khôi phục/Bé đã tự làm |
| **O — Onboarding** | opencode · `opencode/glm-5.3-flash-free` | Thay đổi gọn trong 3 file wizard, khác model để không dồn một model | Lựa chọn “Bắt đầu với sinh hoạt hằng ngày” trong HabitsStep/wizard/ConfirmStep |
| **E — E2E** | opencode · `opencode/deepseek-v4.1-flash-free` | Viết spec Playwright theo kịch bản đã cho sẵn | Spec E2E mới + a11y 375px |
| **V — Verifier độc lập** | cline · provider `cline`, `nvidia/nemotron-3-ultra-550b-a55b:free` | Lane khác hãng để rà chéo, không sửa code | Chạy toàn bộ cổng kiểm tra, lập ma trận nghiệm thu có bằng chứng, review diff theo tiêu chí |
| **K — Theo dõi push/CI/deploy** | kilo · `kilo/minimax/minimax-m3.1-flash` (dự phòng `kilo/kilo-auto/free`) | Việc đọc `gh`/log định kỳ, cần rẻ và ổn định | Theo dõi PR checks, CI main, job deploy, health sau deploy; báo vào inbox |

Coordinator (Claude, phiên này): chốt hợp đồng, review & xác minh lại mọi claim của worker, commit theo phase, mở PR, áp migration production qua cổng an toàn. Không worker nào được push/merge/chạy SQL production.

Nếu một model free bị rate-limit hoặc chất lượng kém hai lần liên tiếp: lane C/O/E đổi sang `opencode/big-pickle`; lane V đổi sang `kilo/poolside/laguna-s-2.1:free` qua cline; báo coordinator trước khi đổi.

## 2. Giao thức inbox

- Mọi lệnh dùng `orca-ide orchestration …`, **không** dùng `orca orchestration` (là GUI launcher, thoát mã 3 — xem `plans/261021-daily-thinking-games/execution/cli-guidance.md`).
- Worker gửi báo cáo tới **terminal handle của reader** (`--to term_<reader>`), không gửi `--to run:<id>` của run con (lỗi `dispatch_run_mismatch` đã gặp).
- `worker_done` gửi kèm `--task-id`, `--dispatch-id`, `--files-modified`, `--report-path`.
- Mỗi worker ghi báo cáo chi tiết ở `plans/261024-daily-living-habits/execution/<lane>-<việc>.md`; tin nhắn inbox chỉ tóm tắt ≤5 dòng + đường dẫn.
- Reader: không trả lời thay coordinator các câu hỏi phạm vi/sản phẩm; gom heartbeat, chỉ escalate khi (a) cần quyết định, (b) một wave xong, (c) worker bị chặn > 15 phút, (d) worker báo sửa file ngoài phần sở hữu. Reader sống đến khi mọi lane đã đóng.
- Câu hỏi chặn việc: `orca-ide orchestration ask … --timeout-ms 600000`.

## 3. Sở hữu file (không hai lane cùng sửa một file)

| Lane | File được sửa |
|---|---|
| C | `src/data/daily-living-habits-v1.vi.json`, `src/lib/daily-living-habits.ts`, `src/lib/daily-living-habits-id.ts`, `src/lib/i18n/daily-living-copy.ts`, `src/lib/experience-flags.ts` (chỉ thêm cờ), `tests/unit/daily-living-habits*.test.ts` |
| B | `supabase/migrations/202610250001_daily_living_template_refs.sql` (+ preflight/rollback theo mẫu repo), `src/lib/domain/activity-mutations.ts`, `src/app/api/domain/activities/route.ts`, `src/lib/supabase/mappers.ts`, `src/lib/family-backup.ts` (chỉ nếu cần), `tests/api/activity-mutations.test.ts`, `tests/unit/legacy-template-identity.test.ts`, test SQL tương ứng |
| U | `src/components/DailyLivingHabitLibrary.tsx`, `src/components/DailyLivingSetModal.tsx`, `src/components/ParentHabitsTab.tsx`, `src/components/HabitProgramsPanel.tsx` (chỉ điểm gắn), `src/lib/store/activity-actions.ts` (chỉ kiểm tra trùng phía client cho lane mới) |
| O | `src/components/onboarding/HabitsStep.tsx`, `src/components/onboarding/ConfirmStep.tsx`, `src/lib/onboarding/wizard.ts`, `src/lib/i18n/onboarding-wizard-copy.ts` (chỉ khóa mới), test onboarding liên quan |
| E | `tests/e2e/daily-living-habits.spec.ts`, fixture riêng của spec |
| V, K, R | Chỉ ghi file báo cáo trong `execution/` |

Cần sửa file của lane khác → hỏi qua inbox, coordinator quyết.

## 4. Wave và phụ thuộc

### Wave 0 — Coordinator (không có worker)

1. Tạo Orca worktree `feat/daily-living-habits` từ `origin/main`; `npm ci`; chạy `npm run lint && npm run typecheck && npm run test` làm baseline, ghi kết quả.
2. Viết `execution/contracts.md`, cố định:
   - Kiểu `DailyLivingTemplate` (`id`, `title`, `shortTitle`, `icon`, `category`, `timeOfDay`, `points`, `description`, `support`, `cue`), `DailyLivingSet` (`id`, `title`, `itemIds`).
   - `dailyLivingActivityId(familyId, scope, templateId): Promise<string>` — UUIDv5 qua Web Crypto SHA-1 (không thêm dependency; chạy được trên Worker và trình duyệt). Namespace UUID cố định ghi trong contract.
   - `toHabitActivity(template, { childId, overrides }): NewActivity` với `legacyTemplateId`, `targetAgeStage: 'all'`, `recurrenceType: 'daily'`, `requiresApproval: false`.
   - Trạng thái gán: `available | added | archived | graduated | sharedCovers`.
   - Tên cờ và khóa copy.
3. Khởi động reader trước tiên.

### Wave 1 — Nền dữ liệu (song song) · worker: R, C, B (3/4)

- **C** (≈ nửa ngày): catalog + validator (ID duy nhất, bộ chỉ tham chiếu ID hợp lệ, 2–5 mục/bộ, tham chiếu `WIT-NUT-01`/`WIT-CAP-01` tồn tại trong `WIT_HABIT_PACKS`), adapter, hàm ID tất định có test vector cố định, copy vi theo ID, cờ. Test: 47 framework/20 program không đổi.
- **B** (≈ 1–1,5 ngày): bắt đầu ngay với regression test trước khi sửa; migration chỉ đổi regex CHECK sang có `DLY`; zod regex; nhánh `23505` trong `createMany`/`create`: chỉ khi mọi ID xung đột bằng `dailyLivingActivityId(...)` tính lại từ `familyId` của phụ huynh đã xác thực → đọc lại, trả thành công; ngược lại vẫn 409. Kiểm tra roundtrip mapper, backup/restore, child session giữ `legacyTemplateId` DLY. Dùng hàm ID theo chữ ký trong contract (C giao trước; nếu chưa có, B viết stub theo contract, coordinator hợp nhất).
- **Cổng Wave 1** (coordinator): đọc diff, tự chạy `npm run test`, `npm run test:sql`, `npm run verify:habit-framework`; commit `C` và `B` thành 2 commit riêng.

### Wave 2 — Giao diện (song song) · worker: R, U, O, B-dư (≤4)

- **U** (≈ 1,5–2 ngày): P2 Thư viện (tab con “Sinh hoạt hằng ngày” / “Theo khung phát triển”, chọn bé, xem trước lịch/điểm, Thêm/Đang lưu/Đã thêm/Khôi phục/Bé đã tự làm/Luyện lại, chọn rõ “cả nhà”) → P3 modal Bộ sinh hoạt (chọn bé → chọn mục, mặc định 1–2 mục chưa có theo `newHabitLimit` → xác nhận, hiện tổng sao) → sau thành công chuyển về Đang dùng, lọc đúng bé. Mọi thứ sau cờ. Dùng skill `impeccable`/DESIGN.md của repo cho UI.
- **O** (≈ nửa ngày, bắt đầu khi C xong): HabitsStep có lựa chọn “Bắt đầu với sinh hoạt hằng ngày” (chỉ vi + cờ bật), `StarterHabitChoice` thêm `source` + `templateId`, ConfirmStep tạo qua adapter của C.
- **B** nếu còn việc từ cổng Wave 1 thì xử lý tiếp; nếu không, B đóng để nhường slot.
- **Cổng Wave 2**: coordinator chạy app local/demo, tự bấm luồng chính (chọn lẻ, chọn bộ, áp lại bộ, hai bé, mục chung), kiểm tra màn hình bé hiển thị Sáng/Tối đúng; commit U, O.

### Wave 3 — Kiểm chứng · worker: R, E, V (3/4)

- **E**: `tests/e2e/daily-living-habits.spec.ts` theo kịch bản: onboarding chỉ đánh răng sáng + rửa mặt; thư viện chọn lẻ; bộ “Buổi sáng gọn gàng” chỉ thêm phần thiếu; bấm hai lần; hai tab; hai bé + mục chung; hoàn thành đánh răng sáng không ảnh hưởng tối; tải lại trang; 375px không tràn; bàn phím/focus sau đóng modal.
- **V** (bắt đầu khi E đã đẩy spec lần đầu): chạy `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:sql`, `npm run verify:habit-framework`, `npm run verify:habit-framework-translation`, `npm run build`, E2E mới + regression `habit-programs-start.spec.ts`, `activity-mutation.spec.ts`; điền `execution/acceptance-matrix.md` (12 tiêu chí mục 6 + tiêu chí onboarding mục 10.2 + tiêu chí 5 đã sửa ở 10.1), mỗi dòng có lệnh/bằng chứng. Lỗi → báo inbox, coordinator giao lại lane sở hữu file.
- **Cổng Wave 3**: coordinator chạy lại độc lập các lệnh V báo pass (không chấp nhận claim không bằng chứng).

### Wave 4 — Phát hành · worker: R, K (+ lane sửa lỗi nếu cần)

1. Coordinator commit E, mở PR `feat/daily-living-habits` → `main` (mô tả: phạm vi, cờ tắt mặc định, migration, rollback).
2. **K** theo dõi checks của PR (`quality`, `sql`, `browser`), báo lỗi kèm log job.
3. **Cổng owner #1 — migration production** (trước merge, vì code mới ghi `WIT-DLY-*`):
   - Preflight: đếm hàng vi phạm regex mới (phải 0), xác nhận constraint hiện tại.
   - Áp DDL qua Supabase MCP `execute_sql` (không dùng `apply_migration` — sinh version 14 chữ số); ghi ledger version 12 chữ số `202610250001`.
   - Nếu MCP từ chối, coordinator giao file SQL chính xác để owner chạy ở SQL editor.
4. **Cổng owner #2 — merge**: chỉ merge khi owner đồng ý. Merge → CI main → job deploy Cloudflare.
5. **K** theo dõi CI main, job `deploy`, bước “Verify production health after deploy”, và lưu ý trường hợp deploy bị bỏ qua vì có commit mới hơn trên main. Báo kết quả + link run.
6. **Cổng owner #3 — bật cờ**: owner đặt `NEXT_PUBLIC_DAILY_LIVING_HABITS=true` cho build production (biến build-time, cần build lại). K theo dõi lần deploy đó; coordinator smoke test trên production bằng tài khoản thử của owner.

### Wave 5 — P3b chuyển mẫu đánh răng gộp (PR riêng, sau khi Wave 4 ổn định)

- **B** (codex, high): phát hiện mẫu gộp `WIT-PHY-02` và mẫu theo tuổi (đối chiếu cấu trúc, không theo tên); luồng “Giữ / Chuyển sang sáng+tối”; lưu hai mục mới thành công rồi mới tạm dừng mục gộp; mục shared chỉ chuyển khi chọn rõ cho cả nhà; giả lập lỗi giữa chừng.
- **U** gắn UI lựa chọn; **V** kiểm tiêu chí 8; **K** theo dõi phát hành như Wave 4 (không cần migration).

## 5. Lịch đồng thời (tối đa 4)

| Wave | Đang chạy | Số |
|---|---|---|
| 0 | R | 1 |
| 1 | R, C, B | 3 |
| 2 | R, U, O (+B nếu còn sửa) | 3–4 |
| 3 | R, E, V | 3 |
| 4 | R, K (+1 lane sửa lỗi) | 2–3 |
| 5 | R, B, U → V → K | ≤4 |

Trước mỗi lần dispatch, coordinator đếm worker đang sống; đủ 4 thì chờ.

## 6. Dự kiến thời gian

Wave 0: 1–2 giờ · Wave 1: 1–1,5 ngày · Wave 2: 1,5–2 ngày · Wave 3: 1 ngày · Wave 4: nửa ngày + thời gian chờ owner · Wave 5: 1–1,5 ngày.
Tổng tới khi bật cờ trên production: **khoảng 4–5 ngày làm việc**, chưa tính thời gian chờ duyệt. Đây là ước lượng; model free có thể chậm hơn.

## 7. Rollback

- Code: tắt cờ (cần build lại) hoặc revert PR; dữ liệu `WIT-DLY-*` đã tạo vẫn là activity bình thường, vẫn hiển thị và log được.
- Migration: chỉ thu hẹp lại regex khi `select count(*) … where legacy_template_id like 'WIT-DLY-%'` = 0; nếu không, giữ constraint mở (vô hại).
- Không xóa hay sửa dữ liệu người dùng ở bất kỳ bước rollback nào.

## 8. Điều kiện hoàn thành

- Mọi dòng trong `execution/acceptance-matrix.md` có bằng chứng và được coordinator chạy lại.
- PR chính đã merge, deploy pass health check, migration ghi ledger đúng version.
- Owner bật cờ và smoke test production qua được: thêm đánh răng sáng + rửa mặt cho một bé, bé hoàn thành và hoàn tác được.
- Wave 5 là phần tiếp theo, không chặn hoàn thành MVP.

## 9. Cần owner duyệt

1. Đội hình và model ở mục 1.
2. Ba cổng owner ở Wave 4 (migration production, merge, bật cờ).
3. Tách Wave 5 thành PR sau.
