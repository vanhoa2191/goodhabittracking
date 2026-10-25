# Verification Report — Lane V (Độc lập)

Ngày: 2026-10-24. Worktree: `/home/opc/orca/workspaces/goodhabittracking/daily-living-habits`, nhánh `vanhoa2191/daily-living-habits`, base `origin/main` = `8e36808`.

---

## 1. Kết quả chạy lệnh (Việc 1)

| Lệnh | Exit Code | Kết quả chi tiết |
|------|-----------|------------------|
| `npm run lint` | **KHÔNG HOÀN THÀNH** | ESLint chạy quá lâu (>5 phút mỗi lần), không trả về kết quả trong timeout. Chạy background 3 lần đều không ghi log ra `/tmp/lint*.log`. Cần chạy riêng với cache hoặc tăng timeout. |
| `npm run typecheck` | **0 (PASS)** | `tsc --noEmit` hoàn tất 9.2s, không lỗi type. |
| `npm run test` (vitest toàn bộ) | **1 (FAIL)** | **3831 passed, 3 failed** (baseline 3736 + 95 tests mới). 3 failed:<br>1. `tests/unit/schema-version.test.ts:9` — expected `'202610250001'`, received `'202610240001'` (schema version chưa cập nhật cho migration mới).<br>2. `tests/unit/experience-flags.test.ts:6` — `defaultExperienceFlags` thiếu `dailyLivingHabits: false` trong expected object.<br>3. `tests/integration/migrations/family-tenancy.test.ts:289` — schema manifest thiếu `202610250001_daily_living_template_refs.sql` (74 vs 75 expected).<br>**Không có regression** framework/program/template cũ. |
| `npm run verify:habit-framework` | **0 (PASS)** | `Habit framework verified: 47 records, source 85460efcafe42bc585582954dbb559969126b3e09da79c0929762563773f31d0.` |
| `npm run verify:habit-framework-translation` | **0 (PASS)** | `Habit framework translations verified: en, ko, fr, de, it, es, zh, ja (47 habits, 5 stages each).` |
| `npm run build` | **0 (PASS)** | Next.js 16.4.2 Turbopack build thành công ~1114ms compile + 757ms static pages. Tất cả 102 routes compile OK. |
| `git diff --check origin/main..HEAD` | **2 (FAIL)** | `src/components/onboarding/HabitsStep.tsx:46: trailing whitespace.` (dòng `const selectedCount = draft.habits.filter((habit) => habit.selected && \`). |

---

## 2. Ma trận nghiệm thu (Việc 2)

File: `plans/261024-daily-living-habits/execution/acceptance-matrix.md`

**Tóm tắt**: 12 tiêu chí §6 + 1 tiêu chí onboarding §10.2 + 2 tiêu chí 5 sửa §10.1 = **15 dòng**.

| Trạng thái | Số lượng |
|------------|----------|
| **ĐẠT** | 2 (tiêu chí 2, 11) |
| **CHƯA ĐẠT** | 10 (tiêu chí 1, 3, 4, 5, 6, 7, 9, 10, O1, 5a, 5b) |
| **KHÔNG KIỂM ĐƯỢC** | 2 (tiêu chí 8, 12) |

**Lưu ý quan trọng**: 10/15 dòng ghi **"chỉ đọc code"** — có unit test logic nhưng **thiếu test E2E/integration** cho luồng end-to-end (Thư viện → chọn → tạo activity, onboarding đầy đủ, race condition hai tab, migration rollback, cross-family, a11y tự động). Các tiêu chí **ĐẠT** (2, 11) đều có bằng chứng lệnh/test thực tế.
---

## 3. Phân tích diff `git diff origin/main..HEAD` (bỏ `plans/`) — Việc 3

Tổng cộng 42 files changed, 4887 insertions(+), 60 deletions(-). Phân loại findings theo mức độ:

---

### 🔴 CRITICAL (Chặn phát hành)

| # | File:Dòng | Mô tả | Bằng chứng |
|---|-----------|-------|------------|
| C1 | `src/components/onboarding/HabitsStep.tsx:46` | **Trailing whitespace** — `git diff --check` fail. Vi phạm pre-commit/CI. | `git diff --check` exit code 2. |
| C2 | `supabase/preflight/` (thiếu file) | **Thiếu rollback migration** `202610250001_daily_living_template_refs.rollback.sql`. `contracts.md` §5 yêu cầu rollback; `verify.sql` dòng 23–25 báo `daily_living_template_rollback_blocked` nhưng không có file rollback thực thi. | `ls supabase/preflight/` chỉ có `.verify.sql`. |

---

### 🟠 HIGH (Lỗi logic / bảo mật / hợp đồng)

| # | File:Dòng | Mô tả | Bằng chứng |
|---|-----------|-------|------------|
| H1 | `tests/unit/schema-version.test.ts:9` | **Test expectation chưa cập nhật** migration mới. `EXPECTED_SCHEMA_VERSION = '202610240001'` nhưng migration mới là `202610250001`. | Test failed: expected `'202610250001'` received `'202610240001'`. |
| H2 | `tests/unit/experience-flags.test.ts:6` | **Test expectation thiếu flag mới**. Expected object thiếu `dailyLivingHabits: false`. | Test failed: received có `dailyLivingHabits: false` mà expected không có. |
| H3 | `tests/integration/migrations/family-tenancy.test.ts:289` | **Schema manifest test expectation thiếu migration mới**. Historical migrations list thiếu `202610250001_daily_living_template_refs.sql`. | Test failed: expected 75 entries, manifest có 74. |
| H4 | `tests/unit/daily-living-habits.test.ts:93-95` | **Weak test**: `validateDailyLivingCatalog passes without throwing` chỉ kiểm tra `not.toThrow()`, **không validate kết quả trả về** (duplicated ID, invalid refs, v.v.). | `expect(() => validateDailyLivingCatalog()).not.toThrow();` — assert luôn pass miễn không throw. |
---

### 🟡 MEDIUM (Chất lượng / thiếu kiểm thử / a11y chưa verify)

| # | File:Dòng | Mô tả | Bằng chứng |
|---|-----------|-------|------------|
| M1 | `tests/unit/daily-living-habits.test.ts:99` | `toBeDefined()` theo sau bởi assertion cụ thể — **không weak** (có check `id` và `shortTitle` ngay sau). | Dòng 99-101 có check giá trị thực. |
| M2 | `src/lib/daily-living-habits.ts` | **Chỉ đọc code**: `toHabitActivity` dùng `crypto.randomUUID()` cho legacy template (WIT-NUT-01, WIT-CAP-01) — phù hợp hợp đồng (server tạo ID), nhưng client không dùng deterministic ID cho legacy. | Dòng 138-140: `id: activityId ?? crypto.randomUUID()`. |
| M3 | `src/app/api/domain/activities/route.ts:161-179` | Idempotent 23505 chỉ áp cho `WIT-DLY-*` (đúng hợp đồng). **Chỉ đọc code**: logic readback scoped đúng `family_id = parent.familyId`, không rò rỉ cross-family. | Dòng 173: `.eq('family_id', parent.familyId)`. |
| M4 | `supabase/migrations/202610250001_daily_living_template_refs.sql` | **Migration additive**: chỉ thêm `DLY` vào regex CHECK (`^WIT-(NUT\|GIV\|VIR\|MIN\|PER\|WIS\|CAP\|PHY\|DLY)-[0-9]{2}$`), không xóa constraint cũ. Đồng bộ với zod schema `activity-mutations.ts:48`. | Diff migration + `activity-mutations.ts` dòng 48. |
| M5 | `src/components/DailyLivingHabitLibrary.tsx`, `DailyLivingSetModal.tsx`, `HabitsStep.tsx` | **A11y**: có `focus-visible:ring-2`, `role="status"`, `aria-live="polite"`, `role="switch"`, `aria-checked`, `aria-label`, `data-testid`, `min-h-11` ≥ 44px. **KHÔNG KIỂM ĐƯỢC** tự động (Playwright cổng 3000 bận). | Grep `focus-visible\|role=\|aria-` — đầy đủ. |
| M6 | `src/lib/i18n/daily-living-copy.ts`, `onboarding-wizard-copy.ts` | **Không có chuỗi cứng tiếng Việt** ngoài file copy. Tất cả UI qua `getDailyLivingCopy(language)` / `getOnboardingWizardCopy(language)`. Hỗ trợ 9 locale (MVP chỉ vi). | Grep chuỗi Việt trong component — không thấy. |
| M7 | `src/components/onboarding/HabitsStep.tsx` | **Cờ flag gating đúng**: `showDailyOption = defaultExperienceFlags.dailyLivingHabits && language === 'vi'` (dòng 27). Không hiện khi flag tắt hoặc locale khác vi. | Dòng 27, 82-106. |

---

### 🟢 LOW / INFO (Tuân thủ hợp đồng / pattern đúng)

| # | Mô tả | Bằng chứng |
|---|-------|------------|
| L1 | Experience flag `dailyLivingHabits` thêm đúng pattern `habitPrograms` (`.env.example`, `ci.yml`, `experience-flags.ts`, `deployment.md`). | Diff `.env.example`, `.github/workflows/ci.yml`, `src/lib/experience-flags.ts`, `docs/deployment.md`. |
| L2 | Deterministic ID `dailyLivingActivityId` dùng UUIDv5 (SHA-1) namespace cố định `6f1d5b2e-8a47-4c3e-9b0a-2d7e41c9a8f5`, chỉ dùng Web Crypto (`crypto.subtle`), chạy được browser/Node/Worker. | `src/lib/daily-living-habits-id.ts` dòng 51-55. |
| L3 | Legacy template `WIT-NUT-01`/`WIT-CAP-01` resolve fields từ `WIT_HABIT_PACKS` lúc runtime (không sao chép), dùng `matchesLegacyTemplateAssignment` cho identity. | `src/lib/daily-living-habits.ts` dòng 20, 140-150; `legacy-template-identity.ts`. |
| L4 | Catalog validation `validateDailyLivingCatalog()` kiểm tra: ID duy nhất, bộ 2-5 mục, legacy tồn tại trong packs. | `src/lib/daily-living-habits.ts` dòng 200-250; test 341 cases pass. |
| L5 | Store/UI dùng `createActivities` có sẵn, không viết đường lưu mới. Trạng thái `added`/`archived`/`graduated`/`sharedCovers` xử lý đúng nút Thêm/Khôi phục/Luyện lại. | `src/components/DailyLivingHabitLibrary.tsx` dòng 380-425. |
| L6 | Onboarding `StarterHabitChoice` union `source: 'age' \| 'daily'` với `templateId` cho daily, `templateIndex` cho age — không breaking change behavior age. | `src/lib/onboarding/wizard.ts`, `HabitsStep.tsx` dòng 46-52. |

---

## 4. Tổng kết & Khuyến nghị

| Vấn đề | Mức độ | Hành động cần thiết |
|--------|--------|---------------------|
| Trailing whitespace `HabitsStep.tsx:46` | CRITICAL | Fix ngay (xoá khoảng trắng cuối dòng). |
| Thiếu rollback migration file | CRITICAL | Tạo `supabase/preflight/202610250001_daily_living_template_refs.rollback.sql` theo pattern repo (drop constraint mới, add constraint cũ, chỉ chạy khi không còn `WIT-DLY-%`). |
| 3 test expectation cũ (schema-version, experience-flags, family-tenancy manifest) | HIGH | Cập nhật expected values cho migration/flag mới. |
| Weak test `validateDailyLivingCatalog not.toThrow` | HIGH | Thêm test negative: duplicate ID, invalid set ref, missing legacy → phải throw. |
| Thiếu test E2E/integration cho 10/15 tiêu chí nghiệm thu | MEDIUM | Viết test E2E: Thư viện tab, chọn lẻ/bộ, onboarding, race condition, migration, cross-family, a11y. |
| Lint không chạy xong | MEDIUM | Chạy `npx eslint src --max-warnings=0` hoặc tăng timeout CI; cache eslint. |

**Kết luận**: Code triển khai **tuân thủ hợp đồng** (contracts.md) về catalog, ID deterministic, flag gating, i18n, migration additive, cross-family protection. **3 test expectation chưa cập nhật** và **1 weak test** cần sửa. **Thiếu rollback migration** và **trailing whitespace** là 2 blocker CRITICAL. Ma trận nghiệm thu chỉ **2/15 ĐẠT** có bằng chứng lệnh/test thực tế; phần lớn **CHƯA ĐẠT** do thiếu test E2E/integration (chỉ có unit test logic).

---

## 5. File đính kèm

- `plans/261024-daily-living-habits/execution/acceptance-matrix.md` — Ma trận 15 tiêu chí chi tiết.