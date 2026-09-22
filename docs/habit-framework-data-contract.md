# Hợp đồng dữ liệu khung thói quen 0–18 tuổi

Tài liệu này là chuẩn nội dung để con người và agent cập nhật thư viện thói quen KidHabit. Nó không thay thế schema giao dịch của gia đình; `habit_activities` vẫn là các nhiệm vụ cụ thể do phụ huynh tạo hoặc áp dụng cho con.

JSON Schema đi kèm nằm tại [`schemas/habit-framework.schema.json`](schemas/habit-framework.schema.json); bản mẫu tối thiểu có thể chạy kiểm tra tại [`schemas/habit-framework.example.json`](schemas/habit-framework.example.json). Bản đối chiếu từng ID của nội dung đang chạy nằm tại [`schemas/habit-framework-v1.reconciliation.json`](schemas/habit-framework-v1.reconciliation.json).

## 1. Thứ tự ưu tiên nguồn

1. **Cấu trúc chuẩn:** `KHUNG_THOI_QUEN_0-18_TDTT_TDNT_v1.md` — phiên bản 1.0, gồm 5 giai đoạn và 47 thói quen. Đây là nguồn quyết định cấu trúc, ID, thứ tự giai đoạn, lĩnh vực, nhịp thực thi và đo lường.
2. **Giải nghĩa và truy vết:** `DO_HINH_KHAI_NIEM_SO_DO_MAT_MA_TDTT_TDNT_MENTOR_MASTER_THEO_CHU_DE.md`. File này chỉ được dùng để làm rõ khái niệm nguồn; không dùng bố cục 669 trang làm cấu trúc dữ liệu ứng dụng.
3. **Bằng chứng khoa học:** các tài liệu khoa học được khung 0–18 dẫn lại. Mọi ngưỡng sức khỏe, phát triển hoặc an toàn phải có nguồn độc lập đã kiểm tra trước khi được xuất bản trong app. Các dẫn nguồn chưa được kiểm tra độc lập mang trạng thái `[CẦN KIỂM CHỨNG]`.
4. **Code hiện tại:** dùng để xác định điểm tích hợp và tương thích, không được phép đổi nghĩa khung nguồn.

Hai bản nguồn được nhận diện bằng checksum để lần cập nhật sau có thể phát hiện file đã thay đổi:

| Vai trò | Tên file | SHA-256 |
|---|---|---|
| Cấu trúc chuẩn | `KHUNG_THOI_QUEN_0-18_TDTT_TDNT_v1.md` | `85460efcafe42bc585582954dbb559969126b3e09da79c0929762563773f31d0` |
| Khái niệm nguồn | `DO_HINH_KHAI_NIEM_SO_DO_MAT_MA_TDTT_TDNT_MENTOR_MASTER_THEO_CHU_DE.md` | `4273a1c4d8981e65afddf33e3df76b0bfc611ff2d85cc902c7f4ad9a0a606f30` |

Không chép toàn bộ hai file vào repo. Khi nguồn thay đổi, tạo bản phát hành nội dung mới và lưu checksum mới trong gói dữ liệu.

Cấu trúc và bản chép 47 thói quen v1 đã được duyệt theo chỉ đạo của chủ dự án ngày 22/09/2026. Lệnh `npm run verify:habit-framework -- <đường-dẫn-file-khung>` đối chiếu checksum nguồn và payload của từng ID; lệnh không có đường dẫn kiểm tra dữ liệu runtime với manifest đã khóa. Việc duyệt này xác nhận tính trung thành với file nguồn, **không** đồng nghĩa các nhận định khoa học trong nguồn đã được kiểm chứng độc lập. Trạng thái bằng chứng hiện hành là `source-only`.

## 2. Cấu trúc chuẩn được giữ nguyên

Một `FrameworkRelease` phải phản ánh sáu phần của file khung:

1. **Nguyên lý thiết kế:** vai trò người lớn, mức tự chủ, tiêu chí vào giai đoạn và nguyên tắc an toàn.
2. **Bản đồ khung:** lĩnh vực đời sống và các trục khái niệm.
3. **Năm giai đoạn:** 0–3, 3–6, 6–12, 12–15 và 15–18.
4. **Bốn mươi bảy thói quen:** ID ổn định, định nghĩa, biểu hiện đạt, hoạt động mẫu, đồng hành và cách đo.
5. **Trục cắt ngang:** 7 sự giàu, 16 chân dung, 8 tố chất, 9 dạng người, 7 bố thí và 6 chữ vàng.
6. **Nhịp thực thi, đo lường và nguồn:** nhật ký ngày/tuần/quý, chỉ số tự theo dõi, quy tắc chống phản tác dụng và dẫn nguồn.

Số lượng 47 là thuộc tính của **nội dung v1**, không phải giới hạn vĩnh viễn của schema. Thêm, bỏ hoặc tách một thói quen bắt buộc tăng `contentVersion` và ghi rõ alias/migration.

### 2.1. Năm giai đoạn chuẩn

| ID | Khoảng tuổi khuyến nghị | Tên giai đoạn | Vai trò chính của người lớn |
|---|---|---|---|
| `GD1` | 0–3 | Nền tảng an toàn & Giác quan | Làm mẫu và mô tả |
| `GD2` | 3–6 | Khám phá & Ý chí | Làm cùng và nhắc |
| `GD3` | 6–12 | Cần cù & Kỹ năng | Giám sát và cùng làm |
| `GD4` | 12–15 | Bản sắc & Cảm xúc | Đồng hành, cùng tuân luật |
| `GD5` | 15–18 | Định hướng & Trách nhiệm | Cố vấn và hậu thuẫn |

Tuổi được lưu bằng **tháng** để không tạo khe hở ở ngày sinh. Khoảng tuổi chỉ là gợi ý; `entranceCriteria` mới là dữ liệu quyết định nội dung có phù hợp với trẻ hay không. Không dùng giai đoạn như chẩn đoán phát triển.

### 2.2. Năm lĩnh vực

| Mã | Ý nghĩa trong dữ liệu |
|---|---|
| `NT` | Nội tâm: nhận biết và điều hòa bản thân |
| `SK` | Sức khỏe: ngủ, vận động, dinh dưỡng và chăm sóc thân |
| `MQH` | Mối quan hệ: giao tiếp, lễ, biết ơn, hợp tác và dẫn dắt |
| `HT` | Học tập: học cách học, tự học và tạo sản phẩm tri thức |
| `TC` | Tài chính: tiết chế, quản lý nguồn lực và tạo giá trị |

`HT` và `TC` là hai lĩnh vực riêng để truy vấn, nhưng có thể liên kết bằng `pairedDomains`. Không gộp chúng thành một enum và cũng không buộc mọi thói quen học tập phải chứa hoạt động kiếm tiền.

## 3. Cách hiểu các trục khái niệm

Phần này tách rõ **khái niệm nguồn** và **cách dùng trong app**. App chỉ trình bày hành vi phù hợp lứa tuổi; không biến quan niệm triết lý thành kết luận khoa học hay đánh giá con người.

| Trục | Nghĩa nguồn | Cách dùng trong KidHabit |
|---|---|---|
| 7 sự giàu | Bảy phương diện trưởng thành toàn diện: trí tuệ, tâm thái, nhân cách, phẩm chất, năng lực, thể chất, vật chất (Chủ đề 17, trang 229–234; Chủ đề 49, trang 651–653) | **Đích phát triển dài hạn**. Không chấm trẻ là “giàu/nghèo”; chỉ dùng để cân bằng danh mục thói quen. |
| 16 chân dung | Các chân dung MASTER–MENTOR–WIT trên đồ hình Chủ đề 49, trang 648 | **Hướng trưởng thành**, không phải kiểu tính cách. ID chuẩn là `CD-01`…`CD-16`; nội dung code hiện tại có tên “16 chân dung” nhưng khác nghĩa nên không được coi là cùng taxonomy. |
| 8 tố chất nhân tài | Sức học tập, kiên trì, dũng cảm nhận lỗi, dũng cảm thay đổi, cống hiến, gánh vác, trân trọng–biết ơn, khiêm tốn (Chủ đề 19, trang 275–277) | **Phẩm chất quan sát được** trong hành vi. Phản hồi phải ghi nhận nỗ lực/hành vi cụ thể, không dán nhãn trẻ. |
| 9 dạng người | Chuỗi nhận dạng → đối đãi → thu hút → trở thành đối với chín vai trò quan hệ (Chủ đề 18, trang 240–248) | **Năng lực hiểu quan hệ**, ưu tiên cho tuổi lớn. Không cho phép app gắn nhãn một người thật là “thần tài”, “cao nhân”… |
| 7 bố thí | Nhan, Nhãn, Ngôn, Tâm, Phòng, Thân, Tọa thí (Chủ đề 21, trang 314–317) | **Bảy nhóm hành vi thân thiện và cho đi**. Dùng câu chữ đời thường, không dùng như cam kết về công đức, phước đức hay kết quả siêu hình. |
| 6 chữ vàng | Đơn giản, vui vẻ, tin tưởng, nhẹ nhàng, thường xuyên, dụng tâm (Chủ đề 32, trang 441–446) | **Cổng kiểm tra chất lượng hoạt động**. Hoạt động phải đạt ít nhất 4/6 tiêu chí trước khi xuất bản. |
| Giáo dục tận gốc | Định hướng nâng nhận thức nội tâm và tầng bậc trí tuệ (Chủ đề 44, trang 578–581; Chủ đề 49, trang 652) | Mỗi thói quen phải có `childMeaning` và `parentGuidance`, tức giải thích “vì sao” trước khi yêu cầu lặp hành vi. |

### 3.1. Mười sáu chân dung chuẩn

`CD-01` Trí Tuệ Học Giả; `CD-02` Tâm Thái An Vui; `CD-03` Nhân Cách Kiện Toàn; `CD-04` Phẩm Chất Ưu Tú; `CD-05` Năng Lực Xuất Chúng; `CD-06` Thân Hình Người Mẫu; `CD-07` Sức Khỏe Người Sắt; `CD-08` Quảng Bá Siêu Phàm; `CD-09` Giao Tiếp Thông Thái; `CD-10` Luật Sắt Bản Thân; `CD-11` Tầm Nhìn Thấu Suốt; `CD-12` Thấu Hiểu Nhân Sinh; `CD-13` Bác Ái Lĩnh Chúng; `CD-14` Đức Hành Thiên Hạ; `CD-15` Lục Lộc Đại Thuận; `CD-16` Làm Người Thành Công.

`CD-16` là đích tổng hợp, không được hiển thị như một điểm số ngang hàng với 15 chân dung còn lại.

## 4. Mô hình dữ liệu được chọn

Mô hình ưu tiên cấu trúc file nhưng tách dữ liệu biên tập khỏi dữ liệu giao dịch:

```text
FrameworkRelease
├── SourceRef[]
├── AgeStage[5]
├── Concept[]
└── HabitTemplate[] (v1: 47)
    ├── ConceptLink[]
    ├── ActivityVariant[]
    ├── SuccessSignal[]
    ├── Measurement[]
    └── EvidenceRef[]

HabitTemplate --được áp dụng--> HabitActivity --được ghi nhận--> ActivityLog
```

### 4.1. `FrameworkRelease`

Một bản phát hành nội dung hoàn chỉnh. Nó giữ `schemaVersion`, `contentVersion`, checksum nguồn, danh mục giai đoạn, khái niệm, thói quen và chính sách vận hành. Không sửa tại chỗ một release đã xuất bản.

### 4.2. `Concept`

Mọi mục thuộc 7 sự giàu, 16 chân dung, 8 tố chất, 9 dạng người, 7 bố thí hoặc 6 chữ vàng là một concept có:

- ID số ổn định (`WEALTH-01`, `CD-01`, `TALENT-01`, `PERSON-01`, `GIVING-01`, `ACTION-01`);
- tên và diễn giải tiếng Việt;
- `sourceMeaning` để bảo toàn nghĩa nguồn;
- `appInterpretation` để quy định cách trình bày an toàn trong app;
- dẫn chiếu chủ đề/trang;
- trạng thái kiểm duyệt.

Không dùng slug phiên âm làm khóa chính. Cách này tránh lỗi như `Nhan`/`Nhãn` và cho phép đổi tên hiển thị mà không đổi ID.

### 4.3. `HabitTemplate`

Đây là nội dung chuẩn của một thói quen, không chứa lịch cụ thể hay điểm thưởng của một gia đình. Các trường bắt buộc:

- `id`: mã `GD<giai đoạn>-<lĩnh vực>-<số>`;
- `sourceAliases`: mã cũ hoặc lỗi chính tả từng xuất hiện trong nguồn;
- `stageIds`, `primaryDomain`, `pairedDomains`;
- `name`, `purpose`, `childMeaning`, `parentGuidance`;
- `entranceCriteria`, `successSignals`, `safetyNotes`;
- `conceptLinks`: quan hệ có kiểu thay vì mảng chuỗi `truc` tự do;
- `activityVariants`: hành động theo vai trò và mức tự chủ;
- `measurements`: cách tự theo dõi, không suy diễn thành phẩm chất con người;
- `evidenceRefs` và `reviewStatus`.

### 4.4. `ActivityVariant`

Một thói quen có thể có nhiều cách thực hành. Mỗi biến thể phải khai báo:

- ai thực hiện: `parent`, `child` hoặc `family`;
- tối đa ba bước;
- tần suất và thời lượng gợi ý;
- mức hỗ trợ người lớn/trẻ;
- cổng Sáu chữ vàng;
- ghi chú an toàn và khả năng điều chỉnh theo nhu cầu cá nhân.

Ở `GD1`, phần lớn biến thể có `actor: parent` hoặc `family`; không giao trách nhiệm phát triển cho trẻ 0–3 tuổi.

### 4.5. `HabitActivity` hiện hữu

[`src/types/index.ts`](../src/types/index.ts) và các migration trong [`supabase/migrations`](../supabase/migrations) sở hữu nhiệm vụ thực tế của gia đình: lịch, giờ, điểm, phê duyệt và trạng thái. Nhiệm vụ áp dụng từ thư viện hiện lưu `frameworkHabitId` và `frameworkContentVersion`; nhiệm vụ do phụ huynh tự tạo có thể không có hai trường này.

Điểm, sao, streak và phần thưởng là **lớp tạo động lực của sản phẩm**, không phải bằng chứng rằng trẻ đã đạt một sự giàu, chân dung hay tố chất. Không dùng chúng để xếp hạng mức trưởng thành theo framework.

## 5. Chuẩn hóa các điểm chưa nhất quán trong file v1

| Điểm nguồn | Quyết định canonical |
|---|---|
| `GD5-HT-02` có tên tài chính và `linh_vuc: TC` | ID chuẩn là `GD5-TC-01`; giữ `GD5-HT-02` trong `sourceAliases`. Không âm thầm sửa dữ liệu nhập cũ. |
| `BT-2-NhanThi-AnhMat` và `BT-2-NhanThiAnhMat` | ID chuẩn `GIVING-02`, nhãn “Nhãn thí”; chuỗi cũ là alias. |
| `enum_chin_muc_do_tu_chu` nhưng chỉ có 5 mức | Đổi tên trường thành `autonomyLevels`; giữ đúng 5 mức. |
| Schema gợi ý ghi tối thiểu 3/6 chữ vàng, quy tắc nội dung ghi dưới 4/6 phải loại | Chọn **tối thiểu 4/6** vì đây là quy tắc kiểm duyệt rõ ràng ở phần vận hành. |
| Giai đoạn 12–18 trong app hiện tại | Framework giữ hai giai đoạn `GD4` 12–15 và `GD5` 15–18. Lớp tương thích có thể ánh xạ cả hai về UI cũ cho đến khi migration hoàn tất. |
| “16 chân dung” trong `src/lib/wit-framework.ts` khác danh sách MASTER–MENTOR–WIT | Không tái sử dụng khóa hiện tại. Taxonomy mới dùng `CD-01`…`CD-16`; dữ liệu cũ cần bảng mapping được duyệt thủ công. |
| “66 ngày” xuất hiện trong tên một thói quen | Giữ như gợi ý biên tập của nguồn, không dùng làm ngưỡng hoàn thành cứng; chính file dẫn khoảng biến thiên rộng `[CẦN KIỂM CHỨNG]`. |

## 6. Quy tắc biên tập và cập nhật

1. **Không đổi ID đã xuất bản.** Nếu sửa mã nguồn, thêm alias và migration.
2. **Không nhập trực tiếp một đoạn OCR.** Mọi khái niệm OCR phải được đối chiếu phần văn bản/trang nguồn và có `reviewStatus`.
3. **Không trộn nghĩa nguồn với lời nói cho trẻ.** Giữ riêng `sourceMeaning`, `appInterpretation`, `childMeaning` và `parentGuidance`.
4. **Không hard-code nội dung đa ngôn ngữ trong template.** Dùng khóa dịch; tiếng Việt là bản chuẩn nghĩa.
5. **Không coi tuổi là cổng duy nhất.** Tuổi chọn gợi ý ban đầu; phụ huynh xác nhận tiêu chí vào giai đoạn.
6. **Không biến khái niệm thành chẩn đoán hoặc xếp hạng trẻ.** Chỉ đo hành vi/tần suất trẻ tự theo dõi.
7. **Ngưỡng sức khỏe cần nguồn có thẩm quyền và ngày kiểm tra.** Khi nguồn thay đổi, tạo version mới thay vì sửa lịch sử.
8. **Mọi hoạt động mới phải đạt ít nhất 4/6 chữ vàng**, tối đa ba bước và có kiểm tra an toàn theo tuổi.
9. **Mỗi thói quen phải truy vết được:** tối thiểu một nguồn khung, một khái niệm liên quan và người duyệt nội dung.

## 7. Quy trình cập nhật lần sau

1. So checksum hai file nguồn với `SourceRef` của release hiện hành.
2. Lập diff theo các khóa: giai đoạn, ID thói quen, trục khái niệm, hoạt động, đo lường, nguồn.
3. Phân loại thay đổi: sửa chữ không đổi nghĩa, đổi nghĩa, thêm/bỏ concept, thêm/bỏ thói quen, đổi bằng chứng sức khỏe.
4. Tăng `contentVersion`; tăng `schemaVersion` chỉ khi cấu trúc dữ liệu thay đổi.
5. Chạy `npm run verify:habit-framework -- <đường-dẫn-file-khung>` và các kiểm tra contract: ID duy nhất, đủ 5 giai đoạn, số lượng v1 là 47, liên kết concept tồn tại, quality gate ≥4, nguồn hợp lệ.
6. Duyệt nội dung tiếng Việt trước; sau đó mới cập nhật bản dịch.
7. Chỉ khi release được duyệt mới tạo mapping/migration sang `HabitActivity` của app.

## 8. Tiêu chí chấp nhận một release nội dung

- Không có ID trùng hoặc liên kết concept mồ côi.
- Mọi habit có định nghĩa cho trẻ, hướng dẫn phụ huynh, ít nhất một biến thể, biểu hiện đạt và cách đo.
- Mọi con số sức khỏe có `EvidenceRef` đã kiểm tra hoặc bị chặn xuất bản.
- Không có câu chữ dán nhãn, hứa hẹn kết quả siêu hình/y tế, so sánh trẻ với trẻ khác hoặc dùng điểm như thước đo nhân cách.
- Có alias cho mọi mã đã từng được dùng nhưng được chuẩn hóa lại.
- Bản phát hành v1 giữ đúng cấu trúc 5 giai đoạn và 47 thói quen của file ưu tiên.
