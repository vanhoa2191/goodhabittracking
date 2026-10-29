# cf-correct — candidate V2 correctness

Ngày: 2026-10-29. Worktree: `audit-remaining`. Phạm vi: engine/generator đầu vào cho candidate V2; không sửa JSON trong `content/`, không regenerate vào repo, không promote, commit, push, deploy hay migration.

## Tái hiện và sửa

| Phát hiện trong brief | Kết luận và cách sửa | Kiểm chứng |
|---|---|---|
| P1 spatial-rotation `quarter-mirror` | Xác nhận: công thức cũ `(y, maxX-x)` là phép xoay thuần, định thức dương. Công thức xoay 90° theo chiều kim đồng hồ rồi phản chiếu trái–phải là `(y,x)`, định thức âm. Đã sửa ở `rotateCells`. | Oracle tọa độ độc lập, 40 seed × 4 track, đúng một option khớp. |
| P1 spatial-rotation `mirror` thiếu trục | Xác nhận: tutorial chung không nêu trục; hai phép phản chiếu có thể cùng được hiểu đúng. Tutorial board-aware nêu rõ trái–phải; generator bỏ distractor phản chiếu trên–dưới, kể cả khi nó trùng với một phép biến đổi khác. | Kiểm tra tutorial thực sự dùng bởi generator V2 và hình trong từng lựa chọn, 4 track. |
| P1 rule-error repeat sửa được hai vị trí | Xác nhận bằng `lá, hoa, lá, quả`, period 2: sửa vị trí 2 hoặc 4 đều thành chuỗi lặp. Generator mới có ít nhất ba quan sát cho mỗi lớp dư; solver thử bỏ từng vị trí và chỉ chấp nhận một vị trí sửa được. Sửa ở cả đầu chuỗi để bỏ quy tắc đoán vị trí. | Brute-force độc lập cho alternating/repeat/increment, 100 seed × 4 variant × 4 track; trường hợp mơ hồ phải bị từ chối. |
| P1 planning-command-order lộ lời giải, chỉ có một thứ tự | Xác nhận: generator cũ sinh chuỗi toàn phần và liệt kê cạnh theo đúng thứ tự chuỗi. Đổi sang DAG có hai nhánh không phụ thuộc, xáo luật theo seed và tránh thứ tự canonical; hai bước chuẩn bị có thể đổi chỗ. Predicate cũ đã chấp nhận mọi topological sort. Thêm bước thứ sáu cho 13+ thay vì cạnh bắc cầu thừa. | Vét cạn mọi hoán vị của các board 3–6 bước, đúng ít nhất hai thứ tự hợp lệ; solver/checker thống nhất với oracle độc lập. |
| spatial-symmetry find-break có hai ô lệch nhưng một lựa chọn | Xác nhận: checker vốn chấp nhận cả hai nhưng generator giấu một ô. Đưa cả hai ô vào options; explanation mô tả cặp ô không khớp và chấp nhận chọn một trong hai. | Tìm hai ô lệch trực tiếp từ grid, kiểm tra cả hai có trong options và checker nhận cả hai. |
| reasoning-if-then nhãn hai bước/hai điều kiện nhưng một luật | Xác nhận ở 3–5. Đặt tối thiểu hai luật cho hai variant này và chọn kết luận cuối chuỗi; bỏ shortcut đi tắt tới đáp án, thay bằng một luật không có tiền đề đã biết. | Kiểm tra không có luật một bước từ facts suy trực tiếp ra solution; đúng một option suy ra được. |
| quantity-target có nhiều đáp án | Có nhiều tập hợp hợp lệ là chủ ý của predicate; **không xác nhận lỗi từ chối đáp án thay thế**, không sửa predicate. | Oracle độc lập vét cạn mọi tập con cho 4 mode × 15 seed × 4 track, kiểm tra cả tập sai, số món tối đa, fewest, exact-two, not-over. |
| memory-change property lộ đáp án theo định dạng | Xác nhận: trước sửa solution là lựa chọn duy nhất dạng tên + màu. Nhiễu mới đều cùng dạng tên + màu, có xáo seed. | 30 seed × 4 track; mọi option cùng định dạng, chỉ một option đúng. |
| positionBias g05-t2 | Xác nhận ngay cả khi renderer đã shuffle: pool quá nhỏ sinh lại cùng thứ tự; shuffle độc lập vẫn có nhóm 5/8 cùng slot. Vary pool theo seed và cân bằng slot hiển thị qua các vòng lịch 96 ngày; renderer và audit dùng cùng `displayQuantityGroupingOptions`. | Probe toàn lịch theo track/variant và test hồi quy 365 ngày; zero bias flags sau sửa. |
| positionBias rule-error | Xác nhận thiếu audit: trước đây audit chỉ đọc `options`, bỏ qua `sequence`. Generator đã được phép đặt lỗi tại mọi vị trí; audit mới ghi nhận index và nhóm theo track/variant. | Fixture 30 đáp án cố định bị audit chặn; test vị trí 0/1 và ít nhất 4 vị trí khác nhau trên mỗi variant/track. |
| positionBias missing-info | Xác nhận **target card** luôn đứng đầu; vị trí option đáp án đã được shuffle. Shuffle cards và cân bằng vị trí target qua lịch; audit thêm stratum target riêng. | Fixture target luôn đứng đầu bị audit chặn, probe toàn lịch không còn bias. |

## File thuộc lane

Điểm code để review trên snapshot kết thúc: `remaining.ts:82` cân bằng slot; `:156` phép biến đổi; `:215` oracle sửa chuỗi; `:241` nhánh lịch sử; `:500` đối xứng; `:655` thay đổi màu; `:828` nếu–thì; `:905` missing-info; `:1095` chia nhóm; `:1258` thứ tự lệnh. Các số dòng thuộc `src/lib/thinking-games/mechanics/remaining.ts` và có thể dịch nếu lane khác tiếp tục sửa file chung.

- `src/lib/thinking-games/mechanics/remaining.ts`: chỉ các khối/hàm kể trên; các diff khác trong file thuộc lane cùng chạy.
- `src/lib/thinking-games/content/copy.ts`: thêm block `getNaturalTutorial` cho spatial-rotation có trục; phần wording khác do cf-copy sở hữu. g06 gọi helper board-aware để dùng luật đã xáo.
- `src/lib/thinking-games/schema.ts`: tăng giới hạn rule-error lên 12 phần tử (ba chu kỳ + độ khó theo track); command-order tối đa 6 bước/6 cạnh.
- `src/lib/thinking-games/types.ts` và schema: optional `mechanicRevision: 2` cho hai board rule-error/spatial-rotation để phân biệt ngữ nghĩa mới với catalog lịch sử.
- `scripts/check-thinking-games-candidates-v2.mjs`: `candidateCorrectnessErrors` độc lập, được gọi trong batch/all audit; thêm index rule-error và bias stratum cho missing-info target.
- `tests/unit/thinking-games/candidate-correctness.test.ts`: test hồi quy mới.
- `tests/unit/thinking-games/round3-mechanics.test.ts`, `round3-titles-hints.test.ts`: theo chỉ đạo coordinator, đổi assertion literal tutorial g06 sang wording tương đương của cf-copy; vẫn kiểm đủ quan hệ trước/sau.

## Bằng chứng đã chạy

- Trước sửa, test hồi quy ban đầu: **31 failed / 6 passed**. Đây là tái hiện trực tiếp trên code lúc bắt đầu lane.
- Sau sửa, test lane **49 ca** (nằm trong lượt **94/94 pass** bên dưới, gồm ca tương thích cuối). Có oracle độc lập cho phép biến đổi, vị trí sửa, topological sort, đối xứng và tập con số lượng; không chỉ so solver với chính nó. Static DOM trên hai track đang quảng bá kiểm vị trí số của grouping và vị trí target card đúng với audit.
- Mechanics + age complexity regression: **70/70 pass** (`candidate-correctness`, `generator-quality`, `track-design`), sau khi sửa chênh lệch độ khó bị mất do chuỗi dài tối thiểu.
- Probe in-memory **cuối cùng sau tương thích** bằng hàm `generateBatch` trên 5 batch của CSV, 4 track: **1.088 mục thuộc 9 type lane**, zero schema/correctness/known-answer/wrong-answer errors và **zero position-bias errors**. Chỉ ghi `/tmp/cf-correct-probe.json`, không ghi candidate JSON trong repo. Engine hash snapshot: `1d275aa64bbfcf647047b3c2fb9cdd293fdfd5aea0f981a751456d5b1334954d`.
- ESLint mục tiêu pass; `git diff --check` pass. **`npm run typecheck` cuối cùng pass** sau khi các lane sửa narrowing trong test.
- Full thinking-games suite lần đầu: **305 pass / 14 fail**. Gồm 3 assertion wording g06 do cf-copy, 3 hash/provenance V2 chờ regenerate, 2 age regression đã sửa và pass lại, 6 kiểm tra artifact cũ/release bị ảnh hưởng bởi solver mới (xem quyết định bên dưới).
- Sau nhánh tương thích: **94/94 pass trên 7 file** gồm test lane, round3 mechanics/titles, P06/P06-v2, synthetic fixtures và release-bundle-build. Release admission cũ đã phục hồi mà không sửa byte dữ liệu hay pins.
- Full suite cuối: **324 pass / 5 fail / 329 tổng**; artifact `/tmp/cf-correct-full-vitest.json`. Ba fail là hash/provenance V2 cũ; một fail age-monotonicity thuộc `g06-t1`/`path-planning` lane cf-variety (đã báo coordinator: hai variant có trung bình 3–5 lớn hơn 6–8); một fail là timeout ~61 giây của `round2` catalog audit khi chạy đồng thời cả suite. **Chạy riêng `round2-content-fixes.test.ts` sau đó pass 23/23, 26,60 giây**; không sửa test hoặc tăng timeout để làm nó pass.

## Quyết định tương thích đã duyệt và triển khai

Solver chặt hơn ban đầu làm P06 cũ có repeat mơ hồ bị từ chối; phép quarter-mirror đúng làm solution cũ của synthetic/release V1 không còn đúng. Coordinator đã duyệt qua thread `msg_0e77133a80d7`: thêm optional `mechanicRevision: 2` chỉ cho hai board rule-error/spatial-rotation. Generator mới luôn gắn revision 2 và audit V2 chặn board thiếu revision; board lịch sử không có revision giữ cách diễn giải cũ, không sửa byte dữ liệu. Test độc lập kiểm cả hai nhánh và bộ release admission đã pass lại.

## Rủi ro / phần coordinator còn làm

- Coordinator cần sinh lại candidate V2 **một lần** sau các lane, rồi chạy full candidate audit và tests hash/provenance; các JSON cũ chưa phản ánh các sửa.
- Coordinator/lane cf-variety cần xử lý `g06-t1` age-monotonicity còn fail và xác minh lại full suite sau khi mọi lane dừng sửa. Full suite cuối chưa xanh; không được diễn giải kết quả lane này là toàn bộ candidate đã sẵn sàng promote.
- Cân bằng slot dùng nhịp lịch hiện tại: hai lần xuất hiện mỗi variant trên chu kỳ 96 ngày. Nếu đổi CSV/lịch, phải chạy lại test toàn lịch và audit theo track/variant.
- Evidence là local engine, static schema và unit test; chưa kiểm browser tương tác, screen reader, child pilot hoặc production.
- Các lỗi/ngữ nghĩa lịch sử không được sửa ngược vào V1: việc giữ tương thích là quyết định rõ ràng của coordinator. Chỉ candidate mới có revision 2 nhận ngữ nghĩa đã sửa; không promote/deploy trong lane này.

## Kiểm lại theo yêu cầu tiếp tục của người dùng

- Không dùng lại lifecycle task/dispatch đã hoàn tất; phiên Orca hiện tại không có Run được gắn. Không sửa source ngoài lane, không sinh lại candidate hay thay hash/pin.
- Test lại `candidate-correctness`, `generator-quality`, `track-design`: **76 pass / 1 fail / 77 tổng**. Fail còn tái hiện ở hai variant `g06-t1` trong kiểm tra age-monotonicity; các ca thuộc cf-correct pass. Artifact: `/tmp/cf-correct-continuation-vitest.json`.
- Test lại 8 file `candidate-correctness`, `round3-mechanics`, `round3-titles-hints`, `p06-fixtures`, `p06-fixtures-v2`, `synthetic-release-fixture`, `release-bundle-build`, `round2-content-fixes` với `--maxWorkers=2`: **117/117 pass**. Artifact: `/tmp/cf-correct-continuation-compat.json`.
- `npm run typecheck` pass; `git diff --check` pass; `git diff --exit-code -- content/thinking-games` pass, xác nhận lần tiếp tục này không thay đổi dữ liệu catalog. Chỉ cập nhật báo cáo này.
