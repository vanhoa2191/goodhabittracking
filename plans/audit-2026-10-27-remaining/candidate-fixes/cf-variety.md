# cf-variety — trùng lặp và tiến trình độ khó candidate V2

Ngày 2026-10-29. Phạm vi: nguồn sinh mechanic/generator và audit V2; không sửa JSON trong `content/`, không chạy lệnh generate ghi vào repo, không đổi release V1, hash hay pin, không commit/push/deploy.

## Tái hiện và sửa tại nguồn

| Phát hiện trong brief | Kết luận và sửa | Kiểm chứng |
|---|---|---|
| Board trùng cấu trúc, audit báo 137 fingerprint và 434 chữ ký chuẩn hóa trùng | **Xác nhận.** Generator trước chỉ tránh fingerprint, còn chữ ký audit cũ chủ yếu đếm kích thước/thành phần nên vừa bỏ lọt cấu trúc giống nhau vừa gộp nhầm các sơ đồ tường khác nhau. Đưa `normalizedCandidateSignature` dựa trên board thực vào generator và dùng cùng định nghĩa trong audit; mỗi slot thử tối đa 20 seed khi va chạm fingerprint hoặc chữ ký chuẩn hóa. | Probe sinh trong bộ nhớ toàn bộ 2.920 mục: **0 fingerprint trùng, 0 chữ ký chuẩn hóa trùng, 0 lần hết retry**, 0 lời giải sai, 0 schema sai. Chữ ký chuẩn hóa mới khác định nghĩa cũ nên số 434 lịch sử không so sánh trực tiếp; test đảm bảo hai sơ đồ đường đi khác ô tường không bị gộp chỉ vì cùng số tường. |
| `quantity-grouping` chỉ khoảng 8 câu trong 31 mục | **Xác nhận.** Cho `groupSize`, số nhóm và tổng thay đổi theo seed/quý, giới hạn mức nhỏ cho 3–5; giữ predicate chấp nhận mọi đáp án hợp lệ. | 31 seed của track 13+ có ít nhất 27 fingerprint khác nhau, checker nhận lời giải; probe toàn lịch không còn trùng. |
| `path-planning` hai góc cố định; 3–5 không có tường dù hướng dẫn nhắc tường | **Xác nhận.** Chọn start/goal trên hai cạnh theo seed, 3–5 luôn có ít nhất một tường, tăng kích thước/tường theo quý. Tăng riêng track 6–8 lên lưới 6 ô và 2 tường ở Q1 để độ phức tạp vượt 3–5. Solver lọc board không có đường. | 31 ngày × mọi variant 3–5 đều có tường và lời giải hợp lệ; bài kiểm tra monotonicity 96 cặp variant qua bốn track đạt sau sửa. |
| `flexibility-alternative` cặp góc và đường lặp | **Xác nhận.** Chọn hai điểm đầu/cuối theo seed, sinh tường theo quý, hàm tìm đường dùng chính hai điểm đó và loại đường không hợp lệ. | 40 seed có hơn hai cặp tọa độ đầu/cuối, checker nhận các lời giải; probe không còn fingerprint/chữ ký trùng. |
| `memory-sequence` vị trí thiếu/đổi cố định | **Xác nhận.** Chọn `missingIndex` và cặp `swappedIndices` theo seed; tăng chiều dài khi còn chỗ và rút thời gian hiển thị theo quý. | 40 seed có hơn hai vị trí thiếu và hơn hai cặp đổi; lời giải checker nhận. |
| `flexibility-perspective` đích luôn kề người nhìn | **Xác nhận.** Khoảng cách người nhìn–đích tăng theo track và quý; điểm nhìn chọn theo seed trong giới hạn bảng. | 40 seed track 13+ có cả khoảng cách lớn hơn một ô và lời giải hợp lệ; trung bình Q1→Q4 là 2,13→4 ô. |
| `reasoning-elimination` một manh mối hoặc manh mối thừa | **Xác nhận cho track lớn.** Sinh 2 manh mối cần thiết ở 9–12 và 3 ở 13+, cùng các phương án nhiễu để bỏ bất kỳ manh mối nào cũng còn nhiều hơn một ứng viên. 3–5 giữ mức một đến hai manh mối phù hợp tuổi. | 20 seed × hai track lớn: đúng một ứng viên khi đủ manh mối, hơn một nếu bỏ từng manh mối, checker nhận đáp án. |
| Các slot `g06-t3`/`g08-t3` lặp cấu trúc | **Xác nhận khi probe các slot lặp.** `g06-t3` xáo lệnh/phương hướng, đích và tường; `g08-t3` xáo cảnh và vị trí sai, kể cả vị trí đầu. | 30 seed track 3–5 đạt lần lượt ≥15 và ≥25 chữ ký khác nhau, checker nhận tất cả. |

`candidateQuarter` đọc ngày trong seed candidate `D###` để tăng độ khó ở `rule-sequence`, `memory-sequence`, `path-planning` và các mechanic liên quan. Seed không có lịch candidate được coi như Q1 để giữ hành vi gọi trực tiếp ổn định. Việc sửa generator không chạm dữ liệu đã phát hành.

## Độ khó đo trên lịch 365 ngày mới trong bộ nhớ

Mỗi ô là Q1 → Q2 → Q3 → Q4. Trung bình `difficultyScore` chỉ là chỉ báo giữa các trò khác loại, không phải thước đo tâm lý học; các chỉ số board ngay dưới cho thấy nguồn thay đổi cụ thể.

| Track | Trung bình `difficultyScore` | Rộng lưới đường đi | Số tường đường đi | Độ dài chuỗi luật | `groupSize` |
|---|---|---|---|---|---|
| 3–5 | 5,33 → 5,50 → 6,10 → 6,29 | 5 → 5 → 6 → 6 | 1 → 2 → 3 → 4 | 4 → 5 → 6 → 7 | 2 → 3 → 3,88 → 4 |
| 6–8 | 6,92 → 7,12 → 7,76 → 8,02 | 6 → 6 → 7 → 7 | 2 → 3 → 4 → 5 | 5 → 6 → 7 → 8 | 3,38 → 4,43 → 5,50 → 6,38 |
| 9–12 | 9,11 → 9,18 → 9,86 → 10,07 | 7 → 7 → 8 → 8 | 4 → 5 → 6 → 7 | 6 → 7 → 8 → 8 | 4,75 → 5,57 → 6,50 → 7,50 |
| 13+ | 10,69 → 10,78 → 11,25 → 11,46 | 8 → 8 → 9 → 9 | 6 → 7 → 8 → 9 | 7 → 8 → 8 → 8 | 5,88 → 6,57 → 7,38 → 8,50 |

13+ có ba manh mối cần thiết ở `reasoning-elimination` so với hai ở 9–12, lưới 8–9 ô và 6–9 tường so với 7–8 ô và 4–7 tường, cùng nhóm phép chia lớn hơn. Một số chuỗi đã chạm trần độ dài ở Q3–Q4; độ khó vẫn tăng qua tường, nhóm và khoảng cách.

## File đổi và kiểm tra

- Nguồn: `src/lib/thinking-games/age.ts`, `mechanics/{rule-sequence,memory-sequence,path-planning,remaining}.ts`, `scripts/{generate,check}-thinking-games-candidates-v2.mjs`.
- Test: `tests/unit/thinking-games/candidate-variety.test.ts`; cập nhật kỳ vọng số va chạm lịch sử theo chữ ký mới trong `round2-content-fixes.test.ts`. Các file `remaining.ts`, hai script và test round2 cũng có thay đổi của lane khác trong cùng worktree; danh sách này chỉ mô tả khối thuộc cf-variety.
- `npx vitest run tests/unit/thinking-games/generator-quality.test.ts tests/unit/thinking-games/candidate-variety.test.ts`: **17/17 pass**.
- Suite lọc path/memory/P06/quality đã chạy trước sửa chênh lệch track cuối: **20 pass, 29 skip**. Sau sửa cuối, 17/17 ở trên đã kiểm path và monotonicity.
- `npm run typecheck`: **pass** sau sửa cuối. ESLint các file lane với `--max-warnings=0`: **pass**; `git diff --check`: **pass**. Probe toàn bộ 2.920 mục là gọi `generateBatch` trong bộ nhớ, ghi kết quả kiểm chứng vào `/tmp/cf-variety-probe-final.json`, không ghi JSON candidate trong repo.

## Việc còn lại và giới hạn

- Coordinator sinh lại candidate V2 một lần sau cả ba lane, rồi chạy audit và suite đầy đủ trên artifact mới. JSON V2 hiện lưu trong repo vẫn là bản cũ; các test hash/provenance gắn với nó chưa thể xanh chỉ bằng sửa nguồn.
- `targetSeconds` chưa đổi theo quý vì giới hạn tuổi và các phép kiểm release hiện ràng buộc hàm thời gian; tốc độ hiển thị memory đã giảm. Cần đánh giá bằng trải nghiệm thực tế trước khi đổi thời gian đích chung.
- Bài kiểm trong bộ nhớ, schema và unit test không thay thế kiểm tra trình duyệt, khả năng tiếp cận hay thử nghiệm với trẻ. Không có xác nhận dữ liệu production hoặc deploy.
