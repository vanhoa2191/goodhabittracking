# Kế hoạch bổ sung thói quen sinh hoạt hằng ngày

Ngày: 24/10/2026. Trạng thái: kế hoạch đề xuất, chưa triển khai. Đã rà soát và bổ sung (mục 10) — mục 10 được ưu tiên khi mâu thuẫn với các mục trước.
Chế độ: `$plan`, lập kế hoạch trực tiếp từ checkout hiện tại.

## 1. Mục tiêu và phạm vi

Giúp gia đình chỉ muốn rèn vài việc đơn giản tìm thấy, thêm và theo dõi ngay các việc như đánh răng, rửa mặt, thay đồ. Cùng một thói quen phải dùng được khi chọn lẻ trong danh sách hoặc chọn từ bộ mẫu.

MVP phục vụ hồ sơ trẻ và phụ huynh hiện có. Nội dung dùng ngôn ngữ đời thường, phù hợp cả trẻ lớn cần bắt đầu lại; không gắn nhãn “chỉ dành cho bé nhỏ”. Trẻ cần hỗ trợ vẫn có thể hoàn thành cùng người lớn. Chưa mở rộng hệ thống tài khoản sang người lớn tự theo dõi; đây là giả định phạm vi theo sản phẩm hiện tại, không phải kết luận rằng nhu cầu chỉ có ở trẻ em.

## 2. Hiện trạng đã kiểm tra

| Hiện trạng | Bằng chứng |
|---|---|
| Tab quản lý đã có Đang dùng, Thư viện, Bộ thói quen; Bộ hiện chỉ xuất hiện khi cờ bật và ngôn ngữ Việt | `src/components/ParentHabitsTab.tsx:32`, `src/components/ParentHabitsTab.tsx:41` |
| Thư viện tiếng Việt dùng framework; các ngôn ngữ khác dùng thư viện template cũ | `src/components/ParentHabitsTab.tsx:108` |
| Đã có rửa tay trước ăn `WIT-NUT-01`, gấp chăn `WIT-CAP-01`, đánh răng gộp sáng/tối `WIT-PHY-02` | `src/lib/constants.ts:495`, `src/lib/constants.ts:871`, `src/lib/constants.ts:924` |
| Mẫu đánh răng gộp hai buổi nhưng lịch chỉ là morning; bộ tuổi 3–6 cũng có tình trạng này | `src/lib/constants.ts:924`, `src/lib/wit-framework.ts:535` |
| Framework có vệ sinh thân thể trong hướng dẫn của một thói quen lớn | `src/data/habit-framework-v1.vi.json:352` |
| Framework runtime khóa 47 thói quen đã đối chiếu nguồn | `src/lib/habit-framework/catalog.ts:48`, `scripts/verify-habit-framework-source.mjs:82` |
| Bộ hiện tại chỉ nhận ID framework, 2–3 mục/bộ; test hiện xác nhận 20 bộ | `src/lib/habit-programs/programs.ts:8`, `tests/unit/habit-programs/programs.test.ts:9` |
| Đã có category selfcare, health, chores và lịch daily, morning/evening | `src/lib/domain/activity-mutations.ts:3` |
| Một log được nhận diện theo activity + child + date, nên hai buổi cần hai activity để theo dõi độc lập | `src/lib/store/local-habit-actions.ts:100`, `src/types/index.ts:102` |
| Thêm hàng loạt đã có createActivities/createMany; chống trùng hiện tại tại store chỉ xử lý journey | `src/lib/store/activity-actions.ts:61`, `src/app/api/domain/activities/route.ts:130` |
| API và DB đang giới hạn namespace legacy template; thêm mã mới cần cập nhật cả hai | `src/lib/domain/activity-mutations.ts:48`, `supabase/migrations/202609240001_legacy_template_refs.sql:9` |
| Dịch template cũ đang dựa vào vị trí trong pack, không phù hợp để chèn mục tùy ý | `src/lib/i18n/wit-template-copy.ts:7` |

## 3. Đề xuất sản phẩm

### Danh sách “Sinh hoạt hằng ngày”

Thêm lựa chọn dễ thấy ngay trong Thư viện, đứng trước khung phát triển khi vào tiếng Việt. Hai lựa chọn nội dung: “Sinh hoạt hằng ngày” và “Theo khung phát triển”. Chọn lẻ được; không bắt đầu một chương trình dài hạn mới để sử dụng các mục này.

Mỗi thẻ chỉ cần tên việc, biểu tượng, buổi thực hiện, mô tả một câu và nút Thêm. Hướng dẫn/người lớn hỗ trợ nằm trong phần mở rộng. Khi thêm phải xác định bé nhận; mặc định bé đang chọn, nếu chưa chọn thì yêu cầu chọn trong luồng. Áp dụng cho cả nhà là lựa chọn chủ động, không phải mặc định ngầm `childId: null` như thư viện cũ (`LegacyHabitTemplateLibrary.tsx:53`).

Đợt đầu đề xuất 12 mục; ID dưới đây là ID thiết kế, phải kiểm tra không trùng khi triển khai:

| ID | Tên hiển thị | Buổi mặc định | Ghi chú |
|---|---|---|---|
| WIT-DLY-01 | Đánh răng buổi sáng | Sáng | Một lần hoàn thành riêng |
| WIT-DLY-02 | Đánh răng buổi tối | Tối | Một lần hoàn thành riêng |
| WIT-DLY-03 | Rửa mặt | Sáng | Có thể làm cùng người lớn |
| WIT-DLY-04 | Chải tóc | Sáng | Có thể bỏ chọn |
| WIT-DLY-05 | Thay quần áo sạch | Sáng | Cho phép sửa buổi |
| WIT-DLY-06 | Tắm/rửa theo nếp sinh hoạt | Tối | Gia đình chỉnh lịch phù hợp |
| WIT-DLY-07 | Cất quần áo bẩn đúng chỗ | Tối | Một hành vi quan sát được |
| WIT-DLY-08 | Cất đồ chơi sau khi chơi | Bất kỳ | Thêm tín hiệu sau khi chơi |
| WIT-DLY-09 | Chuẩn bị đồ cho ngày mai | Tối | Đổi thành cặp sách nếu phù hợp |
| WIT-DLY-10 | Lên giường theo giờ đã chọn | Tối | Giờ do gia đình chọn |
| WIT-NUT-01 | Rửa tay trước khi ăn | Bất kỳ | Tham chiếu mẫu cũ, không tạo ID khác |
| WIT-CAP-01 | Gấp chăn, sắp xếp giường | Sáng | Tham chiếu mẫu cũ, không tạo ID khác |

Tên ngắn ở danh sách mới là nhãn trình bày; giữ nguyên dữ liệu/điểm/lịch của activity cũ đã lưu. Nếu dùng mục cũ và đổi lịch thành anytime trong bản xem trước, lưu như tùy chỉnh mới của người dùng, không cập nhật hàng loạt bản cũ.

Rửa tay là checklist tổng kết theo ngày trong MVP, không phải ghi nhận từng bữa/lần rửa. Giao diện phải nói rõ điều này. Chưa thêm bộ đếm nhiều lần trong ngày hoặc các chỉ tiêu sức khỏe cứng; kiểm chứng nguồn chuyên môn trước khi xuất bản hướng dẫn có định lượng.

### Bộ thói quen

| Bộ | Mục gợi ý |
|---|---|
| Bắt đầu nhẹ nhàng | Đánh răng sáng, rửa mặt |
| Buổi sáng gọn gàng | Đánh răng sáng, rửa mặt, thay đồ sạch, chải tóc, gấp chăn |
| Buổi tối sẵn sàng | Đánh răng tối, cất quần áo bẩn, chuẩn bị đồ ngày mai, lên giường theo giờ chọn |
| Tự chăm sóc mỗi ngày | Đánh răng sáng, đánh răng tối, rửa mặt, rửa tay trước ăn, tắm/rửa |

Các bộ là tập lựa chọn từ cùng danh mục, không phải activity có điểm riêng. Khi chọn bộ: chọn bé → xem trước và chọn từng mục → xác nhận. Mặc định chọn 1–2 việc chưa có, theo khả năng/tuổi; có thể thêm các mục còn lại sau. Tái sử dụng quy ước `newHabitLimit`, giải thích nếu vượt số gợi ý; đây là giới hạn mềm (`src/lib/habit-programs/config.ts:41`). Không ép kích hoạt toàn bộ 4–5 mục của một bộ.

Sau khi thêm thành công, chuyển về Đang dùng, lọc đúng bé và đưa các mục vừa thêm vào tầm nhìn. Hiển thị Sáng/Tối rõ ràng ở phía trẻ bằng cách trình bày `timeOfDay` đã có; một chạm hoàn thành, có thể hoàn tác, không thêm bước bắt buộc chụp ảnh hoặc nhập ghi chú.

## 4. Quyết định kỹ thuật

1. Tạo catalog sinh hoạt riêng, có phiên bản, ID và bộ tham chiếu ID. Không chèn vào 47 framework habits hoặc giả mạo ID `GD*`. Không sửa 20 bộ framework thành bộ sinh hoạt. Cơ sở: các hợp đồng khóa tại `catalog.ts:48`, `programs.ts:8` và `docs/habit-framework-data-contract.md:25`.
2. Đề xuất dùng `legacyTemplateId` hiện có làm định danh lưu trữ template và mở rộng namespace `WIT-DLY-*`; tên hiển thị không dùng chữ legacy. Thêm migration mới để mở rộng CHECK, API validator tương ứng và test roundtrip; không sửa migration cũ, không thêm cột/dependency chỉ để đổi tên. Những mẫu tái sử dụng giữ nguyên ID WIT-NUT/CAP.
3. Không thêm nhóm daily vào `WIT_HABIT_PACKS` cũ nếu làm thay đổi vị trí dịch/nhân đôi danh mục. Catalog mới tham chiếu hai mục cũ bằng ID; copy mới ánh xạ theo ID, không theo index. Các file hiện hữu liên quan: `constants.ts:459`, `wit-template-copy.ts:7`, `legacy-template-identity.ts:4`.
4. Tái sử dụng `createActivity`/`createActivities` và UI/validation phổ thông. Thêm một adapter nhỏ tạo HabitActivity từ template sinh hoạt. Không buộc modal chương trình framework nhận dữ liệu giả; chỉ tách phần chọn/xác nhận nếu có nhu cầu dùng chung thực tế (`HabitProgramStartModal.tsx:38`).
5. Trùng chính xác: cùng template ID và phạm vi bé; mục chung cả nhà đang hoạt động cũng phủ bé đó. Không gộp sáng/tối. Phân biệt mục đã lưu trữ để cho người dùng chủ động khôi phục, không tự xóa hoặc ghi đè tùy chỉnh. Mục tự tạo không tự nhận diện chỉ theo tiêu đề; khi có khả năng tương đương, cho người dùng chọn giữ hoặc bỏ mục mới.
6. *(Đã thu gọn ở mục 10.1.)* Chống gửi lặp bằng ID activity ổn định theo gia đình + bé/phạm vi + template; xác minh semantics createMany/upsert trước khi dùng. Server phải xử lý cùng ý định gửi lại mà không nhân đôi hoặc ghi đè bản đã chỉnh. Với mục cũ có ID ngẫu nhiên, kiểm tra assignment và tạo phải trong cùng transaction có khóa theo family + template, bao phủ cả đường thư viện cũ và đường mới, đồng thời xét shared/child scope. Đề xuất RPC hẹp cho template assignment với transaction-scoped advisory lock; không dùng kiểm tra rồi insert rời nhau. ID ổn định chỉ là lớp bảo vệ gửi lại, không thay thế tính atomic. Cần kiểm thử đồng thời hai tab, không chỉ disable nút ở client (`activity-actions.ts:61`, `activities/route.ts:130`).
7. Giữ nguyên cơ chế điểm/duyệt/log hiện tại. Đề xuất mẫu mới 10 sao/mục, cho phụ huynh sửa kể cả 0; mẫu cũ giữ điểm hiện có. Hai buổi đánh răng là hai mục có điểm riêng, bản xem trước phải thể hiện rõ tổng điểm thay vì âm thầm coi tương đương điểm mẫu gộp.

### Tương thích đánh răng cũ

`WIT-PHY-02` và mẫu theo tuổi vẫn giữ lịch sử, tên và điểm đã lưu. Khi phát hiện mẫu gộp đang áp dụng cho bé, hiển thị lựa chọn “Giữ mục hiện tại” hoặc “Chuyển sang hai mục sáng/tối”. Mặc định giữ mục cũ và không chọn hai mục mới. Chỉ khi phụ huynh chọn chuyển, lưu hai mục mới thành công rồi mới tạm dừng mục gộp; lỗi giữa chừng phải có trạng thái rõ và cho phục hồi. Nếu mục gộp là shared (`childId: null`), chỉ cho chuyển cả nhà sang hai mục shared sau khi phụ huynh chọn rõ; nếu chỉ đang cấu hình một bé, giữ nguyên mục shared và bỏ chọn hai mục mới, không tạm dừng shared ảnh hưởng các bé khác. Không nhân đôi log cũ sang hai activity mới. Mẫu theo tuổi không có legacyTemplateId cần đối chiếu cấu trúc đã biết hoặc hỏi người dùng, không đoán chỉ theo tên (`wit-framework.ts:535`, `legacy-template-identity.ts:9`).

## 5. Trình tự triển khai

### P1 — Dữ liệu, định danh và bảo toàn dữ liệu cũ

- Thêm dự kiến `src/data/daily-living-habits-v1.vi.json` và `src/lib/daily-living-habits.ts`: 12 mục, 4 bộ, validator, adapter, tham chiếu ID cũ và nhãn ngắn.
- Thêm regression tests trước thay đổi các ranh giới API/DB: ID cũ vẫn hợp lệ, không đổi 47 framework/20 programs, giữ lịch sử đánh răng gộp. Các test nền: `tests/unit/legacy-template-identity.test.ts:10`, `tests/unit/habit-programs/programs.test.ts:9`.
- Mở namespace tại `src/lib/domain/activity-mutations.ts:48`; thêm migration mới, preflight và rollback theo mẫu repo; rà các allowlist/SQL đang có trước sửa.
- Kiểm tra sync và backup/restore giữ ID mới qua `src/lib/supabase/mappers.ts`, `src/lib/family-backup.ts`, API và child pairing. Không chạy migration lên môi trường thật trong bước lập kế hoạch.

### P2 — Thư viện và thêm từng mục

- Tích hợp lựa chọn Sinh hoạt hằng ngày tại `src/components/ParentHabitsTab.tsx:108`; dự kiến thêm `DailyLivingHabitLibrary.tsx` và copy tiếng Việt theo ID.
- Chọn bé, xem lịch/điểm, Thêm/Đã thêm/Đang lưu/Lưu chưa được xác nhận, xử lý mục cũ và mục chung cả nhà.
- Hoàn thiện chống trùng cả client/server tại `src/lib/store/activity-actions.ts:61` và `src/app/api/domain/activities/route.ts:130` theo phạm vi lane mới, tránh sửa hành vi createMany khác ngoài nhu cầu.

### P3 — Bộ sinh hoạt và luồng phía trẻ

- Thêm phần “Sinh hoạt hằng ngày” vào Bộ thói quen, dùng cùng catalog P1; giữ nhóm “Theo khung phát triển” hiện có. Điểm tích hợp `src/components/HabitProgramsPanel.tsx:21` và `ParentHabitsTab.tsx:100`.
- Thêm modal chọn bé/mục/xác nhận cho bộ mới; không bắt buộc nhập từng cue dài. Tín hiệu mẫu ngắn có thể sửa, ví dụ “Sau khi thức dậy”.
- Sáng/tối hiển thị riêng trong Đang dùng và ở `src/components/KidDashboard.tsx`; tái dùng hoàn thành/hoàn tác hiện có. Luồng chuyển mẫu đánh răng gộp cần kiểm tra lỗi từng bước.

### P4 — Kiểm chứng và mở phạm vi

- Nghiệm thu toàn bộ tiêu chí bên dưới ở local/demo và môi trường DB test, rồi mới cân nhắc rollout.
- MVP copy mới tiếng Việt, tuân thủ cờ và giới hạn ngôn ngữ hiện có; không bật tab bộ sinh hoạt nửa dịch ở locale khác. Dịch đầy đủ theo ID là đợt tiếp theo; không đụng bảng dịch template cũ theo index.
- Sau khi dùng thử, mới xem xét mở tài khoản tự theo dõi cho người lớn, onboarding mục tiêu “Sinh hoạt cơ bản”, và ghi nhiều lần/ngày. Không gắn phần mở rộng này vào điều kiện hoàn thành MVP.

## 6. Tiêu chí nghiệm thu

1. Từ Thói quen → Thư viện, thấy lựa chọn Sinh hoạt hằng ngày và tìm được đánh răng/rửa mặt mà không cần biết mã framework hoặc nhóm phẩm chất.
2. Catalog có 12 mục độc lập, ID duy nhất; 4 bộ chỉ tham chiếu ID hợp lệ; hai mục rửa tay/gấp chăn dùng ID cũ. Không có bản sao mới của chúng khi thêm từ hai đường khác nhau.
3. Chọn lẻ hoặc chọn bộ đều tạo cùng loại activity và mặc định đúng bé đã chọn. Mục chung cả nhà phải được chọn rõ ràng.
4. Hoàn thành đánh răng sáng không hoàn thành đánh răng tối. Mỗi mục/ngày chỉ nhận điểm một lần; hoàn tác chỉ tác động đúng mục đó. Rửa tay không được mô tả là log từng bữa.
5. Áp dụng lại bộ, nhấn nhanh hai lần, gửi lại sau timeout, dùng hai tab: không sinh assignment mới trùng. Timeout không hiển thị thông báo đã thành công khi chưa đọc lại được dữ liệu.
6. Có thể chọn một mục trong bộ, xem và sửa lịch/điểm trước xác nhận; hủy không tạo dữ liệu. Mặc định chỉ 1–2 việc mới theo tuổi, không chọn sẵn toàn bộ bộ dài.
7. Bộ có mục đã tồn tại chỉ thêm phần thiếu; bộ không còn mục thiếu thông báo rõ. Bé A có mục đó không chặn thêm cho bé B; mục chung đang hoạt động được tính cho cả hai.
8. Mẫu đánh răng gộp mặc định được giữ lại; chuyển đổi cần lựa chọn chủ động, không mất log, không âm thầm đổi tổng điểm. Giả lập lỗi lưu hai mục mới không được làm mất mẫu cũ đang hoạt động; cấu hình một bé không làm mất mục shared của các bé khác.
9. Đổi tên, chỉnh lịch, lưu trữ/khôi phục và sync lại vẫn giữ định danh, không khiến mục xuất hiện lại như chưa thêm.
10. Local/demo, API gia đình, child session và backup/restore giữ lịch, child scope, ID và điểm; truy cập chéo gia đình bị từ chối.
11. Các test/validator 47 framework, 20 program và ID template cũ vẫn pass; bản dịch cũ không đổi thứ tự hoặc sai nội dung do index.
12. Kiểm tra 375px và desktop: không tràn ngang, tab/checkbox/nút dùng được bằng bàn phím, focus đúng sau đóng modal và thông báo lưu có thể được đọc bởi công nghệ hỗ trợ.

## 7. Cách kiểm chứng khi triển khai

- Unit: catalog/reference integrity, adapter lịch sáng/tối, assignment scope, mẫu cũ và chuyển đổi; mở rộng `tests/unit/activity-actions.test.ts`, `tests/unit/legacy-template-identity.test.ts`; thêm tests riêng cho daily living.
- API/DB integration: mở rộng `tests/api/activity-mutations.test.ts`; kiểm tra migration CHECK chấp nhận DLY và ID cũ, từ chối ID sai; hai yêu cầu đồng thời, timeout/readback, isolation gia đình và chuyển đổi lỗi giữa chừng.
- E2E: thêm file cho thư viện/bộ mới; đối chiếu đường chọn lẻ → chọn bộ → apply lại, hai bé, mẫu chung, buổi sáng/tối và tải lại trang. Giữ regression `tests/e2e/habit-programs-start.spec.ts`, `tests/e2e/activity-mutation.spec.ts`.
- Chạy sau triển khai: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run verify:habit-framework`, `npm run verify:habit-framework-translation`, E2E liên quan, kiểm tra a11y và build theo pipeline repo. Chạy static diff/secret check theo scope. Migration runtime phải dùng DB test, không suy diễn từ test đọc chuỗi SQL.
- Đây là kế hoạch: chưa chạy bộ kiểm chứng tính năng vì chưa thay đổi mã sản phẩm.

## 8. Rủi ro và giảm thiểu

- Vỡ đối chiếu nguồn framework: dùng catalog độc lập; không tăng số lượng framework để chứa việc nhỏ.
- Trùng giữa template, age bundle, custom habit và framework: ID ổn định cho trường hợp biết chắc; lựa chọn rõ ràng khi chỉ tương đương về ý nghĩa; không gộp log hoặc tự xóa dữ liệu.
- Mở ID mới nhưng API/DB/backup chưa đồng bộ: triển khai additive với test xuyên ranh giới; kiểm tra constraint hiện hành và rollback không thể thu hẹp khi còn hàng DLY.
- Quá tải hoặc điểm tăng ngoài ý muốn: chỉ chọn ít mục lúc đầu, xem trước số mục và tổng điểm; không thưởng thêm cho cả bộ.
- Tên sinh hoạt tưởng đơn giản nhưng khác nhu cầu từng người: cho sửa lịch, buổi, mức hỗ trợ; không hứa thời hạn hình thành thói quen hoặc áp mốc sức khỏe cứng.
- Checkout dùng chung đang có thay đổi ngoài scope: chỉ ghi tài liệu mới trong bước này; khi triển khai kiểm tra lại git status và chia quyền sở hữu file trước sửa.

## 9. Bàn giao

Đề xuất một executor thực hiện P1 → P2 → P3, một verifier độc lập kiểm tra P4 nếu cần. Chỉ tách nội dung/i18n và kiểm thử khi đã chốt hợp đồng P1; không cho nhiều người cùng sửa ParentHabitsTab/store/API.

Hoàn thành bước lập kế hoạch khi tài liệu tồn tại, đường dẫn tham chiếu được kiểm tra, phạm vi/tiêu chí rõ. Việc triển khai, commit, migration thật và phát hành là công việc tiếp theo, chưa được thực hiện bởi tài liệu này.

## 10. Bổ sung sau rà soát (24/10/2026)

Đã đối chiếu lại các dẫn chứng ở mục 2 với code hiện tại: đều đúng. Các điều chỉnh dưới đây thay thế phần tương ứng phía trên.

### 10.1 Thu gọn chống trùng (thay quyết định 6)

RPC + advisory lock là quá nặng so với rủi ro (hậu quả xấu nhất là một mục trùng, phụ huynh xóa được). MVP làm như sau:

- ID activity cho mục `WIT-DLY-*` là UUIDv5 tất định từ `familyId + (childId | 'shared') + templateId`. Khóa chính trở thành ràng buộc nguyên tử, không cần lock.
- Server hiện chỉ `insert` cho `createMany` (`src/app/api/domain/activities/route.ts:130`) và trả 409 khi lỗi. Bổ sung: nếu lỗi là `23505` và mọi ID xung đột đều là ID tất định của lane sinh hoạt, đọc lại các hàng đó trong cùng family và trả thành công idempotent. Không đổi hành vi createMany của lane khác.
- Xóa activity là xóa cứng và log cascade theo `(activity_id, family_id)` (`supabase/migrations/202609190001_family_tenancy.sql:302`), nên thêm lại sau khi xóa dùng lại ID mà không “hồi sinh” log cũ. Mục đã lưu trữ (`isActive: false`) xung đột ID → UI đưa ra “Khôi phục” thay vì “Thêm”.
- Hai mục dùng lại `WIT-NUT-01`/`WIT-CAP-01` có thể đã tồn tại với ID ngẫu nhiên: chỉ kiểm tra phía client qua `legacyTemplateId`/`matchesLegacyTemplateAssignment`. Chấp nhận rủi ro trùng hiếm khi hai tab cùng thêm. Chỉ làm RPC khóa nếu sau phát hành có dữ liệu cho thấy trùng thật.
- Tiêu chí 5 sửa lại: bấm hai lần/gửi lại/hai tab không tạo trùng cho mục `WIT-DLY-*`; với hai mục cũ, không trùng trong cùng tab.

### 10.2 Lối vào từ onboarding (bổ sung vào P3)

Nhóm người dùng “chỉ muốn sinh hoạt cơ bản” quyết định ngay ở bước chọn thói quen đầu tiên, nhưng `src/components/onboarding/HabitsStep.tsx:20` hiện chỉ đưa mẫu theo tuổi (`generateAgeAdaptedHabits`, chọn theo index). Bổ sung:

- Thêm lựa chọn “Bắt đầu với sinh hoạt hằng ngày” ở HabitsStep (chỉ khi tiếng Việt), thay danh sách bằng bộ “Bắt đầu nhẹ nhàng”, vẫn tôn trọng `newHabitLimit`.
- `StarterHabitChoice` cần thêm nguồn (`age` | `daily`) và `templateId`, không dùng `templateIndex` cho mục sinh hoạt. Kiểm tra `src/lib/onboarding/wizard.ts` và ConfirmStep tạo activity qua cùng adapter P1.
- Thêm vào tiêu chí nghiệm thu: phụ huynh mới hoàn tất onboarding chỉ với đánh răng sáng + rửa mặt, rồi thấy đúng hai mục đó ở Đang dùng và ở màn hình của bé.

### 10.3 Ra trường và giảm sao (bổ sung vào P3)

Việc như đánh răng, rửa mặt là ứng viên điển hình để “bé đã tự làm” (`src/components/HabitGraduation.tsx`, `src/lib/habit-programs/graduation.ts`, `star-step.ts`). Cần:

- Xác nhận `summarizeChildHabits` đưa mục `WIT-DLY-*` vào gợi ý ra trường/giảm sao như các mục khác; thêm test.
- Thư viện/bộ hiển thị mục đã ra trường (`graduatedAt` có giá trị) là “Bé đã tự làm” với tùy chọn “Luyện lại”, không phải “Thêm”.
- Mục chung cả nhà không ra trường được cho từng bé (`HabitGraduation.tsx:40`). Đây thêm một lý do để mặc định gán theo bé.

### 10.4 Chi tiết dữ liệu bổ sung cho P1

- Mục sinh hoạt đặt `targetAgeStage: 'all'`, `recurrenceType: 'daily'`, `requiresApproval: false` mặc định, để bé một chạm là xong.
- Điểm: các mục này nhỏ và làm mỗi ngày, “Buổi sáng gọn gàng” ở 10 sao/mục là 50 sao mỗi sáng. Đề xuất mặc định 5 sao/mục và kiểm tra lại với giá phần thưởng mẫu trong `src/lib/reward-templates.ts` trước khi chốt. **Cần chủ sản phẩm quyết.**
- Migration mở CHECK: chỉ thêm `DLY` vào regex (`^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY|DLY)-[0-9]{2}$`) ở migration mới, đồng bộ regex zod ở `activity-mutations.ts:48`. Rollback chỉ chạy được khi không còn hàng DLY; ghi rõ trong preflight.

### 10.5 Ngôn ngữ

App có 9 locale (`src/lib/i18n/locales`); MVP chỉ tiếng Việt nghĩa là người dùng locale khác vẫn chỉ có mẫu gộp `WIT-PHY-02`. Nội dung (12 mục + 4 bộ) ngắn và phổ quát, nên đề xuất đưa tiếng Anh vào MVP nếu tỷ lệ người dùng `en` đáng kể; các locale còn lại để đợt sau. Copy ánh xạ theo ID ngay từ đầu nên thêm locale không phải sửa cấu trúc. **Cần chủ sản phẩm quyết; mặc định giữ chỉ tiếng Việt.**

### 10.6 Thứ tự đề xuất sau điều chỉnh

P1 (catalog + adapter + namespace/migration + ID tất định + idempotent 23505) → P2 (Thư viện chọn lẻ) → P3 (Bộ sinh hoạt, onboarding, ra trường, hiển thị Sáng/Tối phía bé) → P4 (nghiệm thu). Luồng chuyển mẫu đánh răng gộp (mục 4) có thể tách thành P3b và phát hành sau nếu P3 quá lớn, vì mặc định đã là giữ mục cũ.
