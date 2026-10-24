# Báo cáo Lane U — UI phụ huynh (Sinh hoạt hằng ngày)

Ngày: 24/10/2026
Lane: U (`gemini-4-argon-medium`)
Task ID: `task_de5c398bdcc0` · Dispatch ID: `ctx_1bee26a1af4e`

## 1. Các file đã tạo / sửa (thuộc phạm vi Lane U)

1. `src/lib/i18n/daily-living-copy.ts`
   - Bổ sung các khóa copy tiếng Việt (và fallback tiếng Anh) cho bộ chọn thư viện (`frameworkTabLabel`, `libraryContentChoiceLabel`, `libraryIntro`), bộ chọn bé & chú thích "Cả nhà" (`childSelectLabel`, `childSelectPlaceholder`, `allFamilyOption`, `allFamilyNote`), nhãn buổi (`timeOfDayLabels`), trạng thái thẻ (`savingButton`, `addedSharedButton`, `sharedCoversNote`, `archivedLabel`, `supportSummary`, `cueLabel`), và modal bộ sinh hoạt (`setsIntro`, `frameworkSetsTitle`, `openSetButton`, `setModalChildLabel`, `setModalLimitHint`, `setModalOverLimitHint`, `setItemAlreadyAdded`, `setItemSharedAdded`, `setItemTimeLabel`, `setItemPointsLabel`, `setTotalPointsLabel`, `setAllItemsAddedNotice`, `setCancelButton`, `setConfirmButton`).
   - Không có bất kỳ chuỗi cứng hoặc ternary ngôn ngữ nào trong các component `.tsx`.

2. `src/components/DailyLivingHabitLibrary.tsx` (tạo mới)
   - Hiển thị 12 thẻ sinh hoạt hằng ngày từ `getAllDailyLivingTemplates()`: biểu tượng, tên việc, buổi (`Sáng`/`Chiều`/`Tối`/`Bất kỳ`), số sao, mô tả 1 câu, và khối `<details><summary>` mở rộng "Hướng dẫn cho người lớn".
   - Thẻ `WIT-NUT-01` (Rửa tay trước ăn) hiển thị rõ `handWashingNote` (`data-testid="hand-washing-note"`).
   - Bộ chọn `<select>` chọn bé: mặc định `activeChildId`; nếu chưa có bé được chọn thì hiển thị thông báo lý do (`errorNoChildSelected`) và disable nút Thêm; "Cả nhà" là lựa chọn riêng có chú thích rõ ràng rằng mục chung không tách riêng trạng thái "Bé đã tự làm" cho từng bé.
   - Nút hành động theo `dailyLivingStatus`:
     - `available` → `Thêm` (`await toHabitActivity(...)` → `createActivities([activity])`, chống bấm đúp qua `pendingRef` + `disabled`).
     - `added` / `sharedCovers` → `Đã thêm` / `Đã thêm (mục chung)` (`disabled`, kèm ghi chú `sharedCoversNote` nếu do mục chung).
     - `archived` → `Khôi phục` (`updateActivity(id, { isActive: true })`).
     - `graduated` → nhãn `Bé đã tự làm` + nút `Luyện lại` (`updateActivity(id, { graduatedAt: null, isActive: true })`).
   - Xử lý kết quả lưu: trả `false` → hiển thị `saveUnconfirmedNotice` (`role="alert"`), không báo thành công; trả `true` → hiển thị `savedNotice` / `restoreNotice` / `practiceAgainNotice` (`role="status" aria-live="polite"`).

3. `src/components/DailyLivingSetModal.tsx` (tạo mới)
   - Sử dụng `ModalShell` (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="daily-living-set-modal-title"`, đóng bằng `Escape`, trả focus về nút mở modal khi đóng).
   - Chọn bé (select) → xem trước từng mục trong bộ:
     - Mục đã có (`added` / `sharedCovers` / `graduated` / `archived`) hiển thị `"Đã có"` (hoặc `"Đã có (mục chung)"`) và disable checkbox; mục của bé khác không chặn bé đang chọn.
     - Mặc định tick tối đa `newHabitLimit(tuổi bé)` mục chưa có (`available`) theo đúng thứ tự trong bộ (`defaultSelectedSetItemIds`).
     - Cho phép chỉnh buổi (`select`) và số sao (`input type="number"` giới hạn `0..100` qua `clampHabitPoints`) cho từng mục; hiển thị tổng sao của các mục đã tick (`calculateSelectedTotalPoints`).
     - Khi không còn mục thiếu cho bé đang chọn → hiển thị thông báo `setAllItemsAddedNotice` và disable nút Xác nhận.
     - Hủy → đóng modal, không tạo dữ liệu.
     - Xác nhận → gọi `createActivities` một lần duy nhất cho các mục đã tick; thành công gọi `onStarted(selectedChildId)`, không xác nhận được gọi `onNotConfirmed()`.

4. `src/components/ParentHabitsTab.tsx`
   - Trong tab `Thư viện`, khi `defaultExperienceFlags.dailyLivingHabits && language === 'vi'`, hiển thị bộ chọn 2 lựa chọn `"Sinh hoạt hằng ngày"` (đứng trước, mặc định) và `"Theo khung phát triển"` (`HabitFrameworkLibrary`). Khi cờ tắt hoặc ngôn ngữ khác, giữ nguyên hoàn toàn hành vi cũ.
   - Mở rộng callback `onStarted(childId)` của `HabitProgramsPanel` để đặt `selectedChildId = childId` (lọc đúng bé vừa thêm), bật `startedNotice` (`role="status"`, tự động nhận focus) và chuyển về tab `Đang dùng`.

5. `src/components/HabitProgramsPanel.tsx`
   - Khi `defaultExperienceFlags.dailyLivingHabits && language === 'vi'`, hiển thị phần `"Sinh hoạt hằng ngày"` liệt kê 4 bộ (`DLS-01..04`) và mở `DailyLivingSetModal` khi chọn bộ. Giữ nguyên phần chương trình theo khung phát triển bên dưới.

6. `src/lib/store/activity-actions.ts`
   - Bổ sung `overlapsDailyLivingAssignment` để kiểm tra chống trùng phía client cho các mục thuộc danh mục sinh hoạt hằng ngày (`WIT-DLY-01..10`, `WIT-NUT-01`, `WIT-CAP-01`) trong cùng tab (cả local/demo và cloud in-flight/state hiện có), đồng thời cho phép gửi lại (retry) nếu lần lưu cloud trước trả về `false`. Không thay đổi hành vi `createMany` của các lane khác.

7. `tests/unit/daily-living-parent-ui.test.ts` (tạo mới)
   - Kiểm thử các hàm logic thuần: `defaultSelectedSetItemIds` theo `newHabitLimit` và phạm vi bé/mục chung, `clampHabitPoints` & `calculateSelectedTotalPoints`, `resolveDailyLivingCardState` & `findMatchingDailyLivingActivities`, `overlapsDailyLivingAssignment` trong `createActivityActions`, phân tách `timeOfDay` (`morning`/`evening`) khi hoàn thành/hoàn tác qua `toggleLocalHabit`, và tương thích gợi ý ra trường/giảm sao (`summarizeChildHabits`, `nextLowerStarStep`) cho `WIT-DLY-*`.

## 2. Xác nhận màn hình bé (`src/components/KidDashboard.tsx`)

- `src/components/KidDashboard.tsx` (dòng 338–347 và 602–645) đã chia `dueActivities` theo `taskSections` (`morning`, `afternoon`, `evening`, `anytime`, `deferred`) và xác định trạng thái hoàn thành theo `activity.id` trong ngày.
- Vì `WIT-DLY-01` (`morning`) và `WIT-DLY-02` (`evening`) có ID tất định riêng biệt và `requiresApproval: false`, bé chạm 1 lần vào mục sáng chỉ ghi/xóa log của `WIT-DLY-01`, hoàn toàn không ảnh hưởng tới `WIT-DLY-02` ở nhóm buổi tối. Không cần sửa `src/components/KidDashboard.tsx`; đã khóa bằng unit test trong `tests/unit/daily-living-parent-ui.test.ts`.

## 3. Lệnh kiểm tra đã chạy và kết quả thật

1. **ESLint trên toàn bộ file của Lane U**:
   ```bash
   npx eslint --max-warnings=0 src/components/DailyLivingHabitLibrary.tsx src/components/DailyLivingSetModal.tsx src/components/ParentHabitsTab.tsx src/components/HabitProgramsPanel.tsx src/lib/store/activity-actions.ts src/lib/i18n/daily-living-copy.ts tests/unit/daily-living-parent-ui.test.ts
   ```
   - Kết quả: **Pass (exit code 0, 0 errors, 0 warnings)**.
   - Lưu ý: Khi chạy `npm run lint` toàn repo tại thời điểm kiểm tra, có 4 warning `@typescript-eslint/no-unused-vars` ở `src/components/onboarding/HabitsStep.tsx` và `src/lib/onboarding/wizard.ts` (thuộc Lane O đang chạy song song trên cùng worktree; các file của Lane U sạch 100%).

2. **Typecheck (`npm run typecheck`)**:
   - Các file thuộc Lane U (`DailyLivingHabitLibrary.tsx`, `DailyLivingSetModal.tsx`, `ParentHabitsTab.tsx`, `HabitProgramsPanel.tsx`, `activity-actions.ts`, `daily-living-copy.ts`, `daily-living-parent-ui.test.ts`): **0 lỗi TypeScript**.
   - Lưu ý: Tại thời điểm chạy `tsc --noEmit`, chỉ có lỗi ở các file onboarding đang sửa dở của Lane O (`HabitsStep.tsx`, `OnboardingWizard.tsx`, `wizard.ts`, `onboarding-modal.test.ts`).

3. **Unit tests (`npx vitest run`)**:
   ```bash
   npx vitest run tests/unit/daily-living-parent-ui.test.ts tests/unit/activity-actions.test.ts tests/unit/daily-living-habits.test.ts tests/unit/hardcoded-language-ternary.test.ts tests/unit/no-native-dialogs.test.ts tests/unit/modal-focus.test.ts
   ```
   - Kết quả thật:
     - `tests/unit/hardcoded-language-ternary.test.ts` (3 tests) — PASS
     - `tests/unit/no-native-dialogs.test.ts` (1 test) — PASS
     - `tests/unit/modal-focus.test.ts` (4 tests) — PASS
     - `tests/unit/daily-living-habits.test.ts` (29 tests) — PASS
     - `tests/unit/activity-actions.test.ts` (5 tests) — PASS
     - `tests/unit/daily-living-parent-ui.test.ts` (10 tests) — PASS
     - Tổng: **6 test files passed, 52 tests passed (0 failed)**.

## 4. Điểm cần lưu ý / chưa chắc

- Ở chế độ local/demo khi `familyId` trong store là `null`, `DailyLivingHabitLibrary` và `DailyLivingSetModal` truyền fallback `'local-family'` vào `toHabitActivity(template, familyId ?? 'local-family', ...)` để vẫn sinh UUIDv5 tất định nhất quán theo `(scope, templateId)`. Khi đăng nhập cloud, `familyId` lấy từ store khớp với `parent.familyId` trên server.
- Chờ Lane O hoàn tất các file onboarding để `npm run lint` và `npm run typecheck` toàn repo xanh hoàn toàn.
