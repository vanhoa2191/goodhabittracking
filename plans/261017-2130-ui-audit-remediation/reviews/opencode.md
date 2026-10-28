# Bounded plan review — UI audit remediation (opencode worker)

- Task: `task_fde583712a6f` / dispatch `ctx_90c0a4318a88`
- Date: 2026-10-17
- Inputs đã đọc: `AGENTS.md`, `.omx/reports/ui-audit-2026-10-17/report.md`, `plans/261017-2130-ui-audit-remediation/plan.md` và toàn bộ `phase-00..07`, `test-spec.md`, `orchestration.md`, `handoffs/TEMPLATE.md`
- Nguồn đã inspect (read-only): các file được viện dẫn trong audit (xem mục 2), tests hiện hữu liên quan
- Không chạy test/build, không sửa source, không cài đặt, không gọi production. Đánh giá dựa trên đọc code tĩnh; những gì chỉ xác minh được bằng runtime được ghi rõ là hypothesis.

## 1. Tổng verdict

Plan **phù hợp phạm vi, chấp nhận được với 5 điều kiện** (mục 6). Graph phase, coverage 9 nhóm audit, handoff protocol và test matrix nhìn chung chặt; các điểm cần chốt trước khi dispatch:

1. **Quyết định store scope cho A04** (phản hồi per-row) — gate "store chỉ đọc trước" trong `phase-01-parent-safety.md:7` mâu thuẫn một phần với chính exit gate của phase (async states cho `deliver`); coordinator phải mở scope trước hoặc chấp nhận phương án UI-only giảm trung thực.
2. **Ownership chuỗi `ParentApprovalsTab.tsx`**: 01 (behavior) → 02 (màu, tại dòng 106) → 05 (layout) phải ghi thành thứ tự bắt buộc trong packet, không chỉ "02 gửi đề xuất".
3. **Phase 01 phải sở hữu thêm** `parent-today-copy.ts` + `tests/e2e/parent-today.spec.ts` vì quyết định đổi nhãn bộ chọn ở `phase-01-parent-safety.md:11` phá test đang chạy (`parent-today.spec.ts:13` assert role name `Chọn bé`).
4. **`BulkTaskReview.tsx` ownership giao thoa**: 01 ghi `BulkTaskReview.tsx:15–47` nhưng A03 cần dòng 117 (nút approve) thuộc scope 02 — cần một owner duy nhất cho file trong mỗi lượt.
5. **V03 ownership giao thoa giữa 04 và 06** — cần giao hết icon KidDashboard cho 04, 06 chỉ verify.

## 2. Sự kiện quan sát được (đã đối chiếu trong source) — tách khỏi hypothesis

### Đã xác minh bằng code (observed)

| # | факт | Vị trí chính xác |
|---|---|---|
| O1 | Bộ chọn bé chỉ đổi `focusChildId` cho `ParentTodayCard` và panels tuỳ chọn; hàng đợi `pendingLogs` chỉ lọc theo `status`, không theo `childId` — queue/bulk luôn toàn gia đình. | `src/components/ParentApprovalsTab.tsx:44–47` (`focusChildId`), `:46` (`logs.filter(status)`), `:73` (today card), `:80` (BulkTaskReview), `src/components/BulkTaskReview.tsx:20` |
| O2 | Header hàng đợi hiện tại không có nhãn phạm vi nào (`copy.pendingTasks` + count); chip tên bé có sẵn trên từng hàng. | `ParentApprovalsTab.tsx:81–84`, `:99`; `BulkTaskReview.tsx:53–55`, `:92` |
| O3 | Single-row approve/reject là fire-and-forget `void`: cloud path gọi `reviewCloudLog` không trả kết quả; lỗi chỉ `setCloudSyncActive(false)` + `console.error`, không tín hiệu nào về UI. | `src/lib/store/habit-actions.ts:100–118` (`reviewCloudLog` void), `:279–283`, `:340–350` |
| O4 | `deliverRedemption` cloud chain hai lệnh `approve` rồi `deliver` cũng fire-and-forget; lỗi likewise chỉ tắt `cloudSyncActive` + `console.error`. `rejectRedemption` qua `persistCloudTransition` cũng void. | `src/lib/store/reward-actions.ts:114–128`, `:259–288`, `:289–300` |
| O5 | `cloudSyncActive` chỉ hiển thị như nhãn "đã kết nối" ở Header/Settings, không phải thông báo lỗi hàng đợi. | `src/components/Header.tsx:231–238`, `ParentSettingsTab.tsx:319` |
| O6 | Nút single-row không có `disabled`, busy state, hay guard bấm lặp; cloud path không có client guard trước double-click. | `ParentApprovalsTab.tsx:105–106` (approve/reject), `:140–141` (deliver/reject redemption) |
| O7 | `BulkTaskReview` ĐÃ có pattern đầy đủ cần tái dùng: `busy`, `message` (failed/success), `aria-live`, `disabled`, deselect sau success. | `BulkTaskReview.tsx:23–24`, `:31–48`, `:100–126` |
| O8 | `html.dark` chỉ override `--background`/`--foreground`; `--surface`, `--surface-kid`, `--surface-parent`, `--ink` giữ giá trị ấm → shell `.app-mode-kid`/`.app-mode-parent` vẫn nền kem trong dark. | `src/app/globals.css:9–23` (giá trị light), `:43–47` (dark chỉ 2 token), `:77–84`; `src/app/page.tsx:132–134` (class app-mode) |
| O9 | Nền nút màu sáng với chữ trắng: `bg-amber-500 … text-white` (timer Pause, points Confirm), `bg-emerald-600 … text-white` (approve/deliver). Override text màu ở `globals.css:86–102` chỉ áp cho *foreground* `text-amber-500` light-mode, không đụng `bg-*` của nút. | `HabitTimerModal.tsx:178` (emerald-600), `:196–199` (amber-500/indigo-600), `ParentDashboard.tsx:963`, `ParentApprovalsTab.tsx:106,141`, `BulkTaskReview.tsx:117` |
| O10 | Touch target dưới 44: close button `p-2` + icon 20px (≈38px ở font-scale 1.125); header profile trigger `min-h-[38px]/[40px]`. | `FontSettingsModal.tsx:43–49`, `HabitTimerModal.tsx:108–114`, `Header.tsx:190` |
| O11 | `FONT_OPTIONS`/`FONT_SIZE_SCALES` hardcode tiếng Việt trong code (name, previewSample, label); modal hiển thị trực tiếp; `item.label.split(' ')[0]` cắt nhãn. | `src/lib/appearance-context.tsx:17–48`; `FontSettingsModal.tsx:77–78`, `:108–112` |
| O12 | Reduced-motion dùng global kill `0.01ms !important`. | `globals.css:199–205` |
| O13 | Kid hero chứa badge/level/points/badges/fire/progress **trước** dải framework banner và danh sách task; task list bắt đầu sau hero + banner + (flag) các card tùy chọn. | `KidDashboard.tsx:325–451` (hero), `:453–464` (letter/prompt/panels), `:606–623` (framework banner), `:624+` (task sections) |
| O14 | Nút hoàn thành task là icon tròn (Circle/CheckCircle) — label chỉ trong `aria-label`/`title`, trong khi nút "Để sau" có chữ nhìn thấy. | `KidDashboard.tsx:750–783` (toggle), `:789–796` (defer có chữ) |
| O15 | Heading outline KidDashboard: `h1` (tên bé, `:368`) rồi `h3` section (`:642`) — skip h1→h3. | `KidDashboard.tsx:368`, `:642` |
| O16 | Demo banner (khi `isDemoSession && !currentUser`) render phía trên dashboard, cộng chiều cao viewport. | `src/app/page.tsx:153–160` |
| O17 | Tests hiện hữu: `tests/e2e/parent-today.spec.ts:13–19` assert role name **`Chọn bé`** và today-card scope; `:27–43` assert bulk bar idle. `tests/e2e/kid-hero-compact.spec.ts` chỉ check hero height tại 390×844 / 320×640 / 1280×800 — **không** có test 375×812 "first task above fold". Unit: `tests/unit/habit-actions.test.ts:412–471` phủ `reviewLogs` outcome (approved/rejected/skipped); không test nào phủ per-row busy/error của single approve cloud. `tests/parent-approvals-copy.test.ts` (path `tests/`, không phải `tests/unit/`) phủ parity copy approvals. |
| O18 | Age-band CSS đã có target 64px cho `[data-task-toggle]` ở young (`globals.css:230–240`) — mẫu "young theme 64px" mà phase 06 viện dẫn đã tồn tại. |

### Hypothesis (chưa xác minh, cần phase 00/07 đo)

- H1: Tỷ lệ contrast tính từ token (≈2.15:1 amber-500, ≈3.67:1 emerald-600) — số token hợp lý nhưng phải đo computed style sau transition, mọi state, cả dark (audit đã caveat).
- H2: Lỗi HMR/hydration trong dev console; chưa reproduce trên production build.
- H3: Emoji tofu local (glyph thiếu theo OS/font).
- H4: "Không thấy lỗi chặn thao tác" khi reduced-motion global kill — cần test trạng thái tĩnh trước khi gỡ.
- H5: Performance/bundle — chưa đo.

## 3. Review trọng tâm A — Approval scope (A02)

**Quyết định plan** (`phase-01-parent-safety.md:11`): giữ hàng đợi toàn gia đình, đổi nhãn bộ chọn thành "Xem tổng quan của…" và gắn nhãn "Cần duyệt — tất cả bé" tại queue/bulk.

**Đánh giá**: đúng hướng. Giữ semantics backend hiện hữu (O1) tránh migration; selector đã có `aria-pressed` và today-card đã scoped ("Hôm nay của X", `ParentTodayCard.tsx:40`) nên nhãn mới chỉ cần làm rõ ranh giới, không cần logic mới. Counts family-wide của `ParentActionStrip` (`ParentApprovalsTab.tsx:75–77`) và app badge (`:52`) nhất quán với contract này — **không cần sửa**.

**Khoảng trống plan cần bổ sung:**

1. **DailyEase-off path** (`ParentApprovalsTab.tsx:80–113`, nhánh `dailyEase ? <BulkTaskReview/> : inline list`): exit gate 01 đã hứa "default dailyEase-off và dailyEase-on đều có phản hồi" — đúng, nhưng nhãn phạm vi phải xuất hiện ở **cả ba** nơi: inline heading (`:81–84`), `BulkTaskReview` heading (`BulkTaskReview.tsx:53–55`), và bulk selection summary (`:101`). Plan chỉ ghi "queue/bulk" chung chung.
2. **Không trộn hai semantics** (test-spec `A02 scope`): test phải khẳng định switching child **không** đổi số hàng queue trong contract family-default — hiện chưa có test nào (O17).
3. Copy: thêm key scope (vd `queueScopeAllChildren`, `chooserPrefix`) vào `src/lib/i18n/parent-approvals-copy.ts` và/hoặc `parent-today-copy.ts` — cả 9 locale; **không** đổi key storage hay `ParentSection` IDs (`parent-section-url` contract, được phủ bởi `tests/unit/parent-section-url.test.ts` — không thuộc scope sửa).

**Acceptance tests đo được (đề xuất):**

- E2E (fixture 2 bé có pending task + reward, `tests/e2e/cloud-family-fixture.ts` + `pin-helper.ts`): (a) đổi bé → `parent-today-card` đổi nội dung VÀ count hàng queue + `bulk-selection-summary` giữ nguyên; (b) heading queue khớp chuỗi copy module theo locale đang test, có `data-testid` ổn định (vd `pending-tasks-scope`) thay vì hardcode vi; (c) mỗi hàng có chip tên bé (đã có — giữ nguyên, assert presence); (d) select-all chỉ chọn ID thuộc `logs` hiển thị (assert payload request).
- Unit: parity 9 locale cho key mới, theo mẫu `tests/parent-approvals-copy.test.ts`.
- Regression: sửa `parent-today.spec.ts:13` theo label mới; giữ `aria-pressed` semantics (test hiện hữu assert tại `:19`).

## 4. Review trọng tâm B — Per-row mutation feedback (A04)

**Hiện trạng (O3–O7)**: hàng single-row (task approve/reject và redemption deliver/reject) không có busy/result/error nào; store action `void`. Bulk đã OK (O7) làm mẫu.

**Hai phương án, plan chưa chọn:**

- **Option A — UI-only, không sửa store**: hàng tự quản lý `busy`/`error` local; kết quả suy ra bằng cách đọc lại `logs`/`redemptions` từ store sau khi bấm (demo thì đồng bộ, cloud thì phải poll/await sync — không có promise). *Ưu:* không đụng store gate. *Nhược:* không phân biệt "đang gửi" vs "mất kết quả"; không có outcome `skipped` (stale row); âm thanh/analytics lệch so với bulk; **thành công giả có thể xảy ra** nếu request fail mà UI đơn giản là "không thấy row biến mất" → plan cấm "không giả success" nên Option A rất khó đạt exit gate trung thực trên cloud.
- **Option B — mở scope store tối thiểu** (đề xuất): thêm contract async trả kết quả cho single log/redemption. Lối gọn nhất: `ParentApprovalsTab` gọi `reviewLogs([log.id], decision)` **đã tồn tại** và trả `BatchReviewOutcome | null` (`habit-actions.ts:297–338`, demo + cloud, đã unit-tested); khác biệt cần chấp nhận hoặc bù: `approvalLag` analytics thành `'unknown'` và âm thanh khác (`approveLog` chơi `playTaskComplete`/`playClick` per log, `reviewLogs` chơi một lần). Redemption cần sửa `deliverRedemption`/`rejectRedemption`/`persistCloudTransition` để trả promise (hiện `reward-actions.ts:114–128,259–300` void) — **đây là thay đổi store thật sự**, phải nằm trong scope coordinator mở trước dispatch 01.

**Đề xuất**: Option B, với (i) giữ nguyên signature `approveLog`/`rejectLog` cho caller khác, thêm `reviewSingleLog`/`transitionRedemptionAsync` rather than đổi chỗ; (ii) parity demo/cloud trong cùng contract; (iii) double-click guard cả client (`busy` state) lẫn server đã có (`already_reviewed` → `skipped`) — test đếm **đúng 1 request**.

**Acceptance tests đo được (đề xuất, bám test-spec `A04 mutation`):**

- E2E single-row: delay route → button `disabled` + `aria-busy="true"`; double click → đúng 1 request (route counter); fail 500 → hàng còn nguyên, `role="alert"` hiển thị chuỗi locale (không chứa `failureCode` thô), retry thành công → hàng biến mất, focus chuyển sang hàng kế hoặc heading `#pending-tasks`; success → announcement `role="status"`.
- E2E redemption deliver: hai lệnh chain (approve+deliver) — chỉ báo xong khi cả hai xong; fail ở lệnh thứ hai → hàng vẫn pending, có lỗi tại chỗ.
- Unit (nếu Option B): outcome `{approved|rejected|skipped|error}` cho single-log, demo parity; `deliverRedemption` reject → caller nhận failure, `cloudSyncActive` không phải tín hiệu lỗi duy nhất.
- Giữ nguyên: không tự cộng điểm/pending (assert points authoritative sau sync).

**Ranh giới PIN/entitlement**: plan cấm đổi PIN server/domain command IDs/MAX_BATCH_REVIEW — đồng ý, không mâu thuẫn gì đã quan sát.

## 5. Thứ tự refactor an toàn — kiểm chứng graph

Graph 00 → (01 ∥ 02 ∥ 03) → (04 ∥ 05) → 06 → 07 đúng về dependency chức năng; các điểm cần siết:

1. **01 vs 02 giao nhau trên 2 file** (`ParentApprovalsTab.tsx:106`, `BulkTaskReview.tsx:117` thuộc cả hai). Sửa đổi đề xuất: 01 **giữ nguyên class màu hiện tại** (chỉ thêm state wrapper), 02 patch màu **sau khi 01 handoff accepted**, ghi rõ trong `phase-02` scope dòng "Mọi file đang được01 giữ thì Kilo chỉ gửi đề xuất token" là **bắt buộc sequencing 01→02 cho hai file này**, không chạy song song. Nếu muốn 01 nhận luôn màu: 02 phải xuất bảng token (giá trị hex + tỷ lệ đo được) trước, 01 apply và ghi credit — coordinator quyết một trong hai, không để ngỏ.
2. **04 có thể đụng CSS age-band** (`globals.css:230–241` set radius/size cho `[data-testid='kid-hero']`/`[data-task-toggle]`): nếu hero compaction cần đổi rule này, 04 sẽ ghi `globals.css` đang thuộc 02. Điều khoản "06 chốt quyền globals sau02/04/05" (`phase-06:7`) hàm ý 04 được ghi — cần viết rõ: **04 chỉ được sửa block 230–241, mọi thay đổi khác trong globals.css phải qua packet 02**.
3. **01 → 05 sequencing trên `ParentApprovalsTab.tsx`**: 05 depend 01/02/03 đã đúng; sau khi 01+02 nhả, 05 dọn layout (`phase-05` nêu `ParentDashboard.tsx:312–331` + `ParentApprovalsTab`) — không có conflict mới.
4. **02 → 06 trên `HabitTimerModal.tsx`**: 02 sửa màu `:178,:196–199`; 06 sửa touch/focus `:110–213` — range chồng nhau ở footer buttons. Vì 06 depend 04/05 (sau 02) nên thứ tự an toàn; 02 handoff phải nhả toàn file, không chỉ các dòng đã sửa.
5. **03 docs-only** không đụng file app — song song 01/02 an toàn; **04/05 không bắt đầu khi 03 chưa accepted** đã được plan khóa — giữ nguyên (brief quyết hierarchy/labels).
6. **Cleanup ordering** (`plan.md:99`): "mỗi lượt một mùi: duplicate emphasis → label ambiguity → token bypass" — nhất quán với việc 04 (reorder/compact) trước 06 (motion/touch polish). Không phản đối.
7. **Phase 00 trước 01/02/03** — đúng; 00 không sửa UI, chỉ fixture/test/baseline. Lưu ý: 00 cần tạo fixture 2-be + route delay/failure **trước** khi 01 viết mutation tests (`phase-00:14`) — đây là bottleneck thật, đừng dispatch 01 sớm hơn.

## 6. Xung đột ownership file — bảng tổng hợp và cách gỡ

| File | Các phase ghi quyền | Mức rủi ro | Đề xuất gỡ |
|---|---|---|---|
| `ParentApprovalsTab.tsx` | 01 (behavior, `:44–141`), 02 (màu `:106`), 05 (layout) | Cao — 3 phase | Chuỗi bắt buộc 01→02→05, mỗi bước một packet nhả file; 02 chỉ gửi token table cho 2 file này. |
| `BulkTaskReview.tsx` | 01 (`:15–47`), 02 (`:117`) | Trung bình | 01 sở hữu **toàn file** (cần sửa feedback trong này nếu tái dùng pattern); 02 gửi giá trị màu, 01 apply hoặc 02 patch sau handoff 01. |
| `src/lib/i18n/parent-approvals-copy.ts` + `tests/parent-approvals-copy.test.ts` | 01 (implicit trong "copy modules") | Thấp | Ghi rõ ownership 01; 05 không ghi file này. |
| `src/lib/i18n/parent-today-copy.ts` + `tests/e2e/parent-today.spec.ts` + `tests/unit/parent-today-copy-languages.test.ts` | **Chưa ai** — nhưng quyết định 01 đổi nhãn bộ chọn đụng | Cao — sẽ vỡ test đang xanh | Giao cho 01; 05 chỉ đọc. |
| `src/lib/store/habit-actions.ts`, `reward-actions.ts` | 01 gate "chỉ đọc" (`phase-01:7`) | Cao — chặn A04 trung thực | Coordinator mở scope Option B trước dispatch, hoặc bằng văn bản chấp nhận Option A + ghi residual risk "thành công giả cloud". |
| `ParentDashboard.tsx` | 02 (`:963`), 05 (`:312–331`) | Thấp — thứ tự đã đúng (05 depend 02) | Giữ; 02 handoff nhả toàn file. |
| `src/app/globals.css` | 02 (core), 04 (block age-band `:230–241` nếu cần), 06 (`:199–205`) | Trung bình | Viết phân vùng block cho 04; 06 chỉ sau 02/04/05 accepted (đã ghi). |
| `KidDashboard.tsx` | 04 (toàn file), 06 (V03 emoji + headings) | Trung bình | 04 owns trọn; 06 không sửa file này — 06 verify headings/tofu và chỉ can thiệp nếu 04 bàn giao bằng packet. |
| `HabitTimerModal.tsx` | 02 (`:178,:196–199`), 06 (`:110–213` touch/focus/timer announce) | Trung bình — range chồng | 02 nhả toàn file trong handoff; 06 reopen. |
| `Header.tsx` | 06 (Kilo, `:190`) | Thấp | 04/05 không đụng (05 đã ghi "không ghi globals/Header đồng thời với04"). |
| `FontSettingsModal.tsx` | 06: Kilo spec, OpenCode apply | Đã ghi rõ trong plan | OK — giữ "không cùng ghi file". |
| `tests/e2e/task-card.spec.ts`, `kid-hero-compact.spec.ts`, `quest-deferral.spec.ts` | 04 (behavior lock) | Thấp | 04 owns; 07 chỉ đọc. |
| `tests/e2e/parent-today.spec.ts`, `parent-panels.spec.ts` | 01 (scope label), 05 (layout asserts) | Trung bình | 01 trước, nhả cho 05. |
| `tests/e2e/appearance.spec.ts` | 02 (contrast/theme), 06 (i18n font labels) | Thấp | 02 trước, nhả cho 06 (đã phụ thuộc đúng). |
| `tests/e2e/accessibility.spec.ts` | 06 (semantics), 07 (gate) | Thấp | 06 owns thay đổi; 07 chạy nhưng không ghi. |

## 7. Điều plan làm tốt (không cần sửa)

- Nguyên tắc "store authoritative, không giả success" và reuse pattern `BulkTaskReview` — đúng với O3–O7.
- Test matrix Descartes-bounded (`test-spec.md:5–16`), tách D0/E1 theo build flag thay vì localStorage — đúng với ràng buộc compile-time flags của repo (`src/lib/experience-flags`).
- Cấm screenshot test khóa layout sai làm chuẩn (`phase-00:13`) và cap visual loop 2 vòng/slice — hợp lý.
- A01 acceptance theo rectangle-in-viewport thay vì "task exists" (`test-spec.md:22`) — đo được; nên **kế thừa** `kid-hero-compact.spec.ts` (đang test 390/320/1280) thay vì tạo spec trùng.
- Rollback theo phase patch, không reset shared checkout; Lore cho commit — nhất quán repo rules.
- `worker_done` ≠ phase acceptance (`plan.md:93`) — phân biệt đúng vai trò worker này (review-only, không có quyền edit).

## 8. Câu hỏi mở gửi coordinator (không block việc khác)

1. A04: phê duyệt Option B (mở scope store `reward-actions.ts` + contract single-log) hay chấp nhận Option A + residual risk? (mục 4)
2. A02/A03 giao nhau trên `ParentApprovalsTab.tsx`/`BulkTaskReview.tsx`: chọn mô hình "01 apply màu theo token table của 02" hay "02 patch sau 01"? (mục 5.1)
3. Nhãn "Xem tổng quan của…" / "Cần duyệt — tất cả bé" cần copy 9 locale từ 01 — ai sở hữu duyệt copy (GPT reviewer theo plan) và thời điểm so với brief 03? Đề xuất: 01 soạn theo nghĩa hiện có, 03 chỉ fine-tune wording, tránh chặn bugfix.

## 9. Giới hạn review này

- Chưa xác minh runtime: contrast computed, hydration dev errors, tofu, hiệu năng (H1–H5) — thuộc 00/07.
- Chưa đọc toàn bộ `KidDashboard.tsx` (1141 dòng) ngoài vùng audit; nhận định trên dựa các slice 320–834 và citation của audit.
- Không thay thế acceptance phase nào; tài liệu này là input review cho coordinator.
