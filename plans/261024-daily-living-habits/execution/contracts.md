# Hợp đồng chung — Sinh hoạt hằng ngày (WIT-DLY)

Nguồn: `../plan.md` (mục 10 thắng) và `../execution-plan.md`. Worktree: `/home/opc/orca/workspaces/goodhabittracking/daily-living-habits`, nhánh `vanhoa2191/daily-living-habits`, base `origin/main` = `8e36808`. Baseline: lint + typecheck + vitest pass (345 file, 3736 test).

Lane chỉ sửa file thuộc phần mình sở hữu (execution-plan.md mục 3). Cần file khác → hỏi qua inbox.

## 1. Cờ

`src/lib/experience-flags.ts`: thêm `dailyLivingHabits: process.env.NEXT_PUBLIC_DAILY_LIVING_HABITS === 'true'` vào `defaultExperienceFlags` và vào zod schema overrides (`z.boolean().optional()`), theo đúng mẫu `habitPrograms`. UI mới chỉ hiện khi `defaultExperienceFlags.dailyLivingHabits && language === 'vi'`.

## 2. Catalog (lane C)

File: `src/data/daily-living-habits-v1.vi.json`, `src/lib/daily-living-habits.ts`.

```ts
export const DAILY_LIVING_CONTENT_VERSION = 'daily-living-v1';

export type DailyLivingTemplate = {
  readonly id: string;              // 'WIT-DLY-01'..'WIT-DLY-10' | 'WIT-NUT-01' | 'WIT-CAP-01'
  readonly source: 'daily' | 'legacy';   // legacy = tham chiếu WIT_HABIT_PACKS, không sao chép
  readonly title: string;           // tên đầy đủ (thẻ)
  readonly shortTitle: string;      // nhãn ngắn
  readonly icon: string;
  readonly category: ActivityCategory;   // 'selfcare' | 'health' | 'chores'
  readonly timeOfDay: TimeOfDay;
  readonly points: number;          // daily: 5
  readonly description: string;     // 1 câu
  readonly support?: string;        // phần mở rộng "người lớn hỗ trợ"
  readonly cue?: string;            // tín hiệu mẫu, ví dụ "Sau khi thức dậy"
};

export type DailyLivingSet = {
  readonly id: string;              // 'DLS-01'..'DLS-04'
  readonly title: string;
  readonly description: string;
  readonly itemIds: readonly string[];   // 2–5, mọi ID phải tồn tại trong catalog
};
```

- 12 mục đúng bảng ở `../plan.md` mục 3. Với `source: 'legacy'` (`WIT-NUT-01`, `WIT-CAP-01`), `title/points/icon/timeOfDay/category` **lấy từ `WIT_HABIT_PACKS`** (`src/lib/constants.ts`) lúc chạy — JSON chỉ chứa `shortTitle`/`description` hiển thị. Không sao chép ID sang bản mới, không đổi `WIT_HABIT_PACKS`.
- 4 bộ: `DLS-01 Bắt đầu nhẹ nhàng` (DLY-01, DLY-03), `DLS-02 Buổi sáng gọn gàng` (DLY-01, DLY-03, DLY-05, DLY-04, WIT-CAP-01), `DLS-03 Buổi tối sẵn sàng` (DLY-02, DLY-07, DLY-09, DLY-10), `DLS-04 Tự chăm sóc mỗi ngày` (DLY-01, DLY-02, DLY-03, WIT-NUT-01, DLY-06).
- Phải export: `DAILY_LIVING_TEMPLATES`, `DAILY_LIVING_SETS`, `getDailyLivingTemplate(id)`, `validateDailyLivingCatalog()` (ID duy nhất, bộ chỉ tham chiếu ID hợp lệ, 2–5 mục/bộ, mục legacy tồn tại trong `WIT_HABIT_PACKS`).
- Category `selfcare/health/chores` đã có trong `activityCategorySchema`. Không thêm category mới.
- Copy hiển thị tiếng Việt theo ID: `src/lib/i18n/daily-living-copy.ts` (`getDailyLivingCopy(language)`), gồm nhãn tab, nút Thêm/Đã thêm/Khôi phục/Bé đã tự làm/Luyện lại, thông báo lưu, câu "rửa tay là tổng kết theo ngày, không ghi từng lần". Mọi chuỗi UI đi qua file này; không viết chuỗi cứng trong component.

## 3. ID tất định (lane C viết, lane B dùng ở server)

File: `src/lib/daily-living-habits-id.ts`, **không import gì phía client/server riêng** (chạy được ở trình duyệt, Node và Cloudflare Worker; chỉ dùng Web Crypto `crypto.subtle`).

```ts
export const DAILY_LIVING_NAMESPACE = '6f1d5b2e-8a47-4c3e-9b0a-2d7e41c9a8f5';
export async function dailyLivingActivityId(
  familyId: string, scope: string | null /* childId, null = cả nhà */, templateId: string,
): Promise<string>;   // UUIDv5 (SHA-1) của `${familyId}|${scope ?? 'shared'}|${templateId}`
export function isDailyLivingTemplateId(id: string): boolean;  // /^WIT-DLY-\d{2}$/
```

- UUIDv5 theo RFC 4122 §4.3: SHA-1(namespace bytes ‖ name UTF-8), version 5, variant 10xx. Test vector cố định bắt buộc (một vector tự tính bằng thư viện chuẩn ngoài, ghi cả hai trong test).
- ID tất định chỉ dùng cho `WIT-DLY-*`. `WIT-NUT-01`/`WIT-CAP-01` giữ `crypto.randomUUID()` như thư viện cũ.

## 4. Adapter (lane C)

```ts
export type DailyLivingAssignment = {
  readonly childId: string | null;   // null chỉ khi người dùng chọn rõ "cả nhà"
  readonly points?: number; readonly timeOfDay?: TimeOfDay; readonly cue?: string;
};
export async function toHabitActivity(
  template: DailyLivingTemplate, familyId: string, assignment: DailyLivingAssignment,
): Promise<Omit<HabitActivity, 'createdAt'>>;
```

Kết quả: `legacyTemplateId: template.id`, `targetAgeStage: 'all'`, `recurrenceType: 'daily'`, `recurrenceDays: [0..6]`, `requiresApproval: false`, `isActive: true`, `isParentRole: false`, `instructions: template.support`, `id` = ID tất định nếu `WIT-DLY-*` (ngược lại để store tự cấp). Phần `userId/familyId` do server điền như hiện nay.

Trạng thái gán cho UI:
```ts
export type DailyLivingStatus = 'available' | 'added' | 'archived' | 'graduated' | 'sharedCovers';
export function dailyLivingStatus(
  template: DailyLivingTemplate, childId: string, activities: readonly HabitActivity[],
): DailyLivingStatus;
```
- `added`: có activity `isActive` cùng `legacyTemplateId` và (`childId` trùng hoặc null→`sharedCovers` nếu null).
- `archived`: có activity cùng template/bé nhưng `isActive: false` và `graduatedAt` rỗng.
- `graduated`: `graduatedAt` có giá trị.
- `WIT-NUT-01`/`WIT-CAP-01`: dùng `matchesLegacyTemplateAssignment` (`src/lib/legacy-template-identity.ts`) để nhận cả bản cũ không có `legacyTemplateId`.
- Không bao giờ suy luận trùng chỉ từ tiêu đề với activity tự tạo.

## 5. Server (lane B)

- `activityMutationSchema`: `legacyTemplateId` regex → `/^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY|DLY)-\d{2}$/` (`src/lib/domain/activity-mutations.ts:48`).
- Migration mới `supabase/migrations/202610250001_daily_living_template_refs.sql`: drop/add CHECK `habit_activities_legacy_template_id_check` với regex tương ứng `^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY|DLY)-[0-9]{2}$`. Không sửa migration cũ. Thêm preflight + rollback theo mẫu repo (rollback chỉ chạy khi không còn hàng `WIT-DLY-%`).
- `route.ts` `create`/`createMany`: nếu insert lỗi `23505` **và** mọi activity trong request có `legacyTemplateId` dạng `WIT-DLY-*` **và** `activity.id === await dailyLivingActivityId(parent.familyId, activity.childId, activity.legacyTemplateId)` → đọc lại các hàng đó (`family_id` = của phụ huynh đã xác thực, `id in (...)`), nếu đủ hàng thì trả cùng phản hồi thành công như lần đầu. Mọi trường hợp khác giữ 409 cũ. Không đổi hành vi của lane khác. Không cho ghi đè hàng đã tồn tại.
- Kiểm tra mapper `src/lib/supabase/mappers.ts`, `src/lib/family-backup.ts`, child session giữ `legacyTemplateId`/ID DLY qua sync và khôi phục (viết test nếu chưa có).

## 6. Store/UI phụ huynh (lane U)

- Gọi `createActivities` (không viết đường lưu mới). Trước khi gọi, lọc các mục `added`/`sharedCovers`; mục `archived` → nút Khôi phục dùng `updateActivity(isActive: true)`; mục `graduated` → nút Luyện lại (`graduatedAt: null`, `isActive: true`) — dùng đúng hàm cập nhật có sẵn trong store.
- Kết quả `createActivities` trả `false` (timeout/lỗi) → hiện "Lưu chưa được xác nhận", **không** hiện thành công; sau đó đọc lại từ store/sync. Tham khảo `HabitProgramStartModal` và `onNotConfirmed` của `HabitProgramsPanel`.
- Mặc định bé đang chọn (`activeChildId`); chưa có thì bắt chọn. "Cả nhà" là lựa chọn riêng, có chú thích rằng mục chung không thể được bé tự làm riêng.
- Chọn bộ: mặc định tick tối đa `newHabitLimit(tuổi bé)` mục chưa có (ưu tiên theo thứ tự trong bộ); hiện tổng sao; không ép chọn hết.
- Sau thành công: về tab Đang dùng, lọc đúng bé, focus vào thông báo (`role="status"`, như `startedNotice`).
- Giao diện theo `DESIGN.md`; 375px không tràn ngang; nút ≥ `min-h-11`.

## 7. Onboarding (lane O)

- `StarterHabitChoice` thành union có `source: 'age' | 'daily'`; mục `daily` mang `templateId` thay vì `templateIndex`. Mọi chỗ đang dùng `templateIndex` (`HabitsStep`, `ConfirmStep`, `wizard.ts`, test) phải tiếp tục đúng cho `source: 'age'` (không đổi hành vi hiện tại).
- Lựa chọn “Bắt đầu với sinh hoạt hằng ngày” chỉ hiện khi cờ bật và `language === 'vi'`; thay danh sách bằng bộ `DLS-01`, tôn trọng `newHabitLimit`.
- ConfirmStep tạo qua `toHabitActivity` của lane C.

## 8. Quy tắc chung

- Không thêm dependency. Không dùng `any`, không `@ts-ignore`. Test viết trước khi sửa phần ranh giới (API/DB).
- Không chạy migration lên môi trường thật; không push; không merge; không chạy SQL production.
- Không đổi 47 framework habits, 20 programs, `WIT_HABIT_PACKS`, `wit-template-copy.ts`.
- Báo cáo mỗi lane: `execution/<lane>-<việc>.md` gồm file đã sửa, lệnh test đã chạy kèm kết quả thật, điểm chưa chắc.
- Trước khi báo xong: `npm run lint && npm run typecheck && npx vitest run <file liên quan>`; lane B thêm `npm run test:sql` nếu có DB test cục bộ, nếu không ghi rõ không chạy được.
