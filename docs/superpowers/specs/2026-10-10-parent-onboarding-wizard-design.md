# Onboarding phụ huynh: wizard 5 bước "thiết lập tới đâu, giải thích tới đó"

Trạng thái: **thiết kế đã chốt (10/10/2026)**, chưa viết mã.

## Vấn đề

`OnboardingModal` hiện là một form duy nhất: tên, biệt danh, tuổi, đồng ý, nút dùng thử. Phần giai đoạn tuổi, linh vật và xem trước thói quen nằm trong "Tùy chỉnh thêm" đóng sẵn. Lưu xong là đóng modal, phụ huynh rơi vào tab Duyệt việc mà:

- Không được giải thích vòng cốt lõi: con làm việc → được sao → ba mẹ duyệt (nếu cần) → con đổi sao lấy quà.
- Không biết đưa app cho bé thế nào (ghép máy bằng mã/QR hoặc dùng chung máy). Lối này nằm sâu ở `Gia đình → Hồ sơ các con`.
- Không có quà nào, nên sao chưa có ý nghĩa.
- Được nạp sẵn 6 thói quen, trong khi app khuyến nghị chỉ 1–4 thói quen mới một lúc (`newHabitLimit`), nên ngay ngày đầu đã vượt mức khuyến nghị.

## Mục tiêu

Phụ huynh hiểu app vận hành thế nào **qua chính các việc họ đang thiết lập**: mỗi bước làm một việc và giải thích ngay việc đó đóng vai trò gì. Hết wizard, gia đình có một bé, vài thói quen vừa sức, ít nhất một quà (nếu không bỏ qua), và bé đã có đường vào app.

Giữ nguyên: đăng nhập Google, đồng ý theo phiên bản chính sách, tự bắt đầu 7 ngày dùng thử, bảng xếp hạng mặc định tắt.

## Luồng

Thanh tiến độ "Bước X/5". Bước 1–3 có **Quay lại**. Dữ liệu chỉ được lưu khi bấm nút ở bước 4; từ đó không quay lại được nữa.

### Bước 1: Bé của bạn

- Thiết lập: họ tên (bắt buộc), tuổi (thanh kéo 0–18, mặc định 5), linh vật (hiện luôn, mặc định Leo), biệt danh (tùy chọn, để trống thì tự sinh như hiện nay).
- Giải thích: thẻ giai đoạn tuổi đổi theo thanh kéo (dùng lại `onboarding-copy` `stages[*].summary`), thêm câu "Tuổi quyết định giao diện con thấy và các thói quen được gợi ý."

### Bước 2: Thói quen đầu tiên

- Hiện 6 thói quen của giai đoạn tuổi (`generateAgeAdaptedHabits`). Chọn sẵn **N thói quen đầu tiên**, với N = `newHabitLimit(tuổi)` (1 / 2 / 3 / 4). Phụ huynh tick thêm hoặc bỏ.
- Bộ đếm "Đã chọn X · khuyến nghị N". Vượt N chỉ hiện cảnh báo mềm, không chặn.
- Mỗi thói quen có công tắc **"Ba mẹ duyệt"**, mặc định **theo cờ `requiresApproval` của mẫu**.
- Giải thích: "Con chạm Xong → được sao. Việc có Ba mẹ duyệt thì sao chỉ cộng sau khi ba mẹ xác nhận. Ít thói quen một lúc giúp con dễ thành nếp hơn."
- Bé 0–3 tuổi: thói quen mẫu là việc ba mẹ làm gương (`isParentRole`). Bước này nói rõ điều đó và **ẩn** công tắc duyệt.
- Bỏ chọn hết vẫn đi tiếp được, kèm dòng "Ba mẹ có thể thêm thói quen sau ở Thiết kế".

### Bước 3: Quà để đổi sao

- Gợi ý 3 quà trải nghiệm, rẻ sao, lấy từ `MEANINGFUL_REWARD_TEMPLATES`: `experience-bedtime-story` (25), `experience-meal-choice` (35), `experience-parent-time` (40). Chọn sẵn quà đầu tiên. Giá sao sửa được (số nguyên dương). Có nút **Để sau** (không chọn quà nào).
- Giải thích: "Con kiếm khoảng **S sao/ngày** → quà C sao ≈ **D ngày** cố gắng", với S = `estimateDailyStars(thói quen đã chọn)` và D = `daysToReward(C, S)`. Nếu S = 0 thì bỏ câu ước tính. Kèm luồng: con xin → ba mẹ duyệt → trao quà; từ chối thì con được hoàn sao.
- Tên và mô tả 3 quà lấy từ copy của wizard (9 ngôn ngữ), không lấy tên tiếng Việt trong mẫu.

### Bước 4: Xác nhận & bắt đầu

- Tóm tắt: 1 bé (tên, tuổi), X thói quen, Y quà.
- Ô đồng ý và dòng chính sách, điều khoản: giữ nguyên nội dung hiện tại.
- Nút: "Bắt đầu 7 ngày dùng thử & tạo hồ sơ" khi đã đăng nhập và chưa có gói; ngược lại là "Hoàn tất" (giữ logic nhãn hiện tại).

### Bước 5: Đưa app cho bé

Hai lựa chọn:

- **Máy riêng của bé** (chỉ khi `currentUser`): hiện mã kết nối và QR của bé, kèm 3 bước: mở app trên máy bé → "Đây là thiết bị của bé?" → quét QR hoặc nhập mã.
- **Dùng chung máy này**: nếu `parentPinConfigured` là false thì hiện ô đặt PIN 4 số (có "Bỏ qua") với lời giải thích "PIN giữ khu phụ huynh khỏi tay bé". Sau đó nút **Mở màn hình của bé**.

Giải thích cuối: "Ba mẹ xem tiến độ và duyệt ở **Hôm nay → Duyệt việc**. Nhấn **?** cạnh mỗi mục để đọc hướng dẫn." Nút **Vào bảng phụ huynh** đóng wizard.

Chưa đăng nhập (bản demo hoặc local): chỉ hiện "Dùng chung máy này".

## Cấu trúc code

`OnboardingModal` giữ export và props (`isOpen`, `onClose`) nên `src/app/page.tsx` và `StartTrialEntry.tsx` không đổi. Bên trong nó chỉ còn `ModalShell` bọc `OnboardingWizard`.

| File | Vai trò |
|---|---|
| `src/lib/onboarding/wizard.ts` (mới) | Logic thuần: kiểu `WizardDraft`, `initialHabitSelection(age)`, `estimateDailyStars(habits)`, `daysToReward(cost, dailyStars)`, `canAdvance(step, draft)` |
| `src/components/onboarding/OnboardingWizard.tsx` (mới) | Giữ bản nháp, bước hiện tại, thanh tiến độ, Tiếp/Quay lại, gửi dữ liệu ở bước 4 |
| `src/components/onboarding/{ChildStep,HabitsStep,RewardsStep,ConfirmStep,HandoffStep}.tsx` (mới) | Mỗi bước một file. Bước 1–4 chỉ nhận `draft` + `onChange`, không gọi store; `HandoffStep` gọi store cho mã, PIN và chế độ bé |
| `src/lib/i18n/onboarding-wizard-copy.ts` (mới) | Tiêu đề bước, câu giải thích, tên/mô tả 3 quà gợi ý, 9 ngôn ngữ |
| `src/components/OnboardingModal.tsx` | Rút gọn thành lớp vỏ |
| `src/lib/store/profile-actions.ts`, `src/lib/store.tsx` | `createProfile` nhận thêm tham số tùy chọn `{ starterHabits?: ReadonlyArray<{ templateIndex: number; requiresApproval: boolean }> }` |

Thay đổi ở store: khi có `starterHabits`, chỉ nạp các mẫu ở `templateIndex` đã chọn, ghi đè `requiresApproval`; khi không có thì giữ nguyên hành vi cũ (nạp cả bộ theo `ageStage`). RPC phía server đã nhận danh sách tùy ý (tối đa 50) nên **không cần migration**.

## Luồng dữ liệu khi bấm nút ở bước 4

Giữ thứ tự của code hiện tại:

1. `POST /api/privacy/consent` (khi có `currentUser`).
2. `activateFreeTrial()` khi có `currentUser` và chưa `isPro`.
3. `createProfile(profile, profileRequestId, { starterHabits })`. `profileRequestId` sinh một lần cho cả wizard nên bấm lại sau lỗi không tạo trùng.
4. `createReward` lần lượt cho từng quà đã chọn, cùng dạng với `RewardTemplateLibrary` (`stock: -1`, `isActive: true`), tên và mô tả theo ngôn ngữ hiện tại.
5. `sounds.playLevelUp()` rồi sang bước 5.

Lỗi ở mục 1–3 (đồng ý, dùng thử, tạo hồ sơ) thì ở lại bước 4, hiện thông báo lỗi như hiện nay. Lỗi ở mục 4 (tạo quà) không chặn: sang bước 5 kèm ghi chú "Chưa thêm được quà, ba mẹ thêm lại ở Thiết kế → Đổi quà".

Bước 5:

- Máy riêng: nếu `childCodes[child.id]` chưa có thì gọi `generateChildCodes()`. QR tạo bằng `readPairingCredential(child.id)` và `QRCode.toDataURL`, giống `ParentChildrenTab`.
- Dùng chung: `updateParentPin({ newPin })` nếu phụ huynh nhập PIN, sau đó `setActiveChildId(child.id)`, `setMode('kid')`, `onClose()`.

## Lỗi và trường hợp biên

| Tình huống | Xử lý |
|---|---|
| Thiếu tên bé | Không cho Tiếp, lỗi dưới ô nhập, focus về ô (như hiện tại) |
| Bỏ chọn hết thói quen | Cho đi tiếp, bỏ câu ước tính ở bước 3 |
| Lỗi đồng ý, dùng thử hoặc tạo hồ sơ | Ở lại bước 4, thông báo lỗi hiện có, bấm lại an toàn |
| Lỗi tạo quà | Không chặn, ghi chú ở bước 5 |
| Lỗi lấy mã/QR | "Lấy mã ở Gia đình → Hồ sơ các con"; "Dùng chung máy này" vẫn dùng được |
| Đặt PIN lỗi hoặc sai định dạng | Lỗi tại ô PIN; vẫn có "Bỏ qua, mở màn hình của bé" |
| Đóng (X/Esc) ở bước 1–3 | Hủy bản nháp; `/start` mở lại wizard vì gia đình chưa có bé (hành vi hiện tại) |
| Đóng ở bước 5 | Đóng bình thường, dữ liệu đã lưu |

Khả năng truy cập: đổi bước thì tiêu đề bước nhận focus, vùng `aria-live` đọc "Bước X/5"; nút bấm cao tối thiểu 44px.

## Kiểm thử

- `tests/unit/onboarding-wizard.test.ts` (mới): `initialHabitSelection` ở tuổi 2 / 4 / 8 / 16; `estimateDailyStars` và `daysToReward` (gồm trường hợp 0 sao); `canAdvance` từng bước.
- Unit store: `createProfile` có `starterHabits` chỉ nạp đúng mẫu với đúng cờ duyệt; không có thì giữ hành vi cũ.
- `tests/unit/onboarding-modal.test.ts`: viết lại theo wizard; bước 4 gọi đồng ý → dùng thử → tạo hồ sơ → tạo quà theo thứ tự; lỗi tạo quà không chặn bước 5.
- `tests/e2e/single-signup-profile.spec.ts`: cập nhật theo 5 bước; thêm kịch bản đi hết "Dùng chung máy này" và kết thúc ở màn hình của bé.
- `npm run test:a11y` cho wizard.

## Tài liệu

Viết lại mục "Tạo hồ sơ bé đầu tiên" trong `docs/huong-dan/01-bat-dau.md` và bản `docs/huong-dan/i18n/en`, chạy `npm run guide:build`. Các bản trong `translations-pending` để nguyên.

## Ngoài phạm vi

- Lưu bản nháp để thoát giữa chừng rồi quay lại tiếp.
- Dịch toàn bộ `MEANINGFUL_REWARD_TEMPLATES`.
- Hướng dẫn chạy thử một vòng duyệt ngay trong onboarding.
