# Audit tg-content — 2026-10-28

## Kết quả

**P0: 0 · P1: 0 · P2: 3 · P3: 1.** Có hai lỗi dự đoán vị trí đáp án, một lỗi gate chất lượng catalog và một lỗi lộ mã kỹ thuật trong nội dung hiển thị/trợ năng. Không sửa code hoặc dữ liệu; chỉ ghi file báo cáo này.

Solo, read-only; đã đọc `plans/audit-2026-10-27-remaining/BRIEF.md`. Checkout được kiểm tra tại HEAD `ba935045cdc1f5cc73af9950d44914e6e371f2b2`. Các kết luận dưới đây dựa trên source, dữ liệu và lệnh chạy trong checkout này, không lấy trạng thái phát hành cũ làm trạng thái hiện tại.

## Phát hiện đã xác minh

### TG-C01 — P2 — Đáp án loại trừ luôn ở thẻ đầu tiên dù audit báo không lệch vị trí

- Vị trí: `src/components/thinking-games/ReasoningEliminationGame.tsx:115`; `src/lib/thinking-games/mechanics/remaining.ts:709`, `:729`; `scripts/check-thinking-games-candidates-v2.mjs:287`.
- Bằng chứng dữ liệu: cả **31/31 bài age_6_8 và 31/31 bài age_9_12** của `g04-t1` trong release có `solution === boardData.candidates[0].id === "candidate-1"`. Generator chỉ xáo `options`; renderer duyệt trực tiếp `board.candidates`, không dùng thứ tự `options`.
- Ví dụ: `content/thinking-games/manifests/release-365-v1.json:137`, `D001-bonus-vi68`. Render tĩnh component với chính board này cho button đầu tiên `data-testid="option-button-candidate-1"`; đáp án cũng là `candidate-1`.
- Kịch bản: trẻ chọn thẻ đầu tiên ở mọi lần gặp dạng loại trừ và đúng **62/62**, không cần đọc manh mối. `positionBiasErrors(release.items)` vẫn trả `[]` vì chỉ đo `board.options`, khác thứ tự trẻ nhìn thấy.
- Đề xuất: thống nhất thứ tự hiển thị và thứ tự audit, dùng shuffle xác định sẵn theo seed; cập nhật phần giải thích đánh số theo thứ tự thực tế. Thêm regression trên vị trí button render cho toàn bộ bài release, thay vì chỉ kiểm tra mảng `options`.

### TG-C02 — P2 — Chia nhóm có vị trí đáp án cố định theo chế độ

- Vị trí: `src/lib/thinking-games/mechanics/remaining.ts:1056`; `src/components/thinking-games/QuantityGroupingGame.tsx:113`; `scripts/check-thinking-games-candidates-v2.mjs:301`.
- Bằng chứng: generator sắp xếp tăng dần, cắt mảng lựa chọn và không shuffle. Renderer duyệt đúng mảng đó. Trong release, cho **cả hai track**, 8 bài `exact` và 8 bài `floor` đều có đáp án ở **vị trí 4**: tổng **32/32**. Riêng 6–8, 8 bài `remainder` và 7 bài `needed` đều có đáp án ở **vị trí 2**: **15/15**.
- Ví dụ: `content/thinking-games/manifests/release-365-v1.json:1520`, `D005-main-vi68`: `total=8`, `groupSize=2`, `mode=exact`, `options=[1,2,3,4]`, `solution=4`.
- Kịch bản: trẻ nhận dạng câu hỏi “mấy nhóm” rồi chọn ô thứ tư, không thực hiện phép chia. Trẻ 6–8 còn có thể chọn ô thứ hai cho mọi câu hỏi dư/cần thêm. Bộ audit gộp mọi mode/tuổi theo `gameTypeId`; tỷ lệ vị trí 4 là 32/62, thấp hơn ngưỡng 60%, nên bỏ lọt bias có điều kiện này.
- Đề xuất: chọn vị trí đáp án bằng seed như cách `g05-t1` đang làm, hoặc shuffle sau khi tạo distractor; thêm kiểm tra theo track/mode hoặc variant và kiểm tra thứ tự thực tế trên renderer. Giữ đáp án số và checker hiện có.

### TG-C03 — P2 — Gate trùng lặp bị vô hiệu vì bộ đếm chưa khởi tạo

- Vị trí: `scripts/check-thinking-games-candidates-v2.mjs:836`, `:979`, `:987`, `:1044`, `:1088`. Cùng mẫu khởi tạo/tăng bộ đếm cũng có trong `checkBatch` của file này.
- Bằng chứng chạy lại `checkAll({write:false})` trên **Node 26.11.1**: `itemCount=2920`, `uniqueFingerprints=2783`, `uniqueNormalized=2486`; tương ứng **137 dòng dư fingerprint và 434 dòng dư chuẩn hoá**. `Number.isNaN(metrics.duplicateFingerprints)` và `Number.isNaN(metrics.normalizedCollisions)` đều là `true`.
- Nguyên nhân: các trường này không tồn tại trong `metrics` ban đầu; `undefined += n` thành `NaN`. So sánh `NaN > 0` trả false, nên kết quả là `quality.blocked=false`, `quality.duplicateFingerprints=0`, `quality.normalizedCollisions=0`, `status=pass_with_review_warnings`. Khi ghi JSON, các metric NaN thành `null`; hiện tượng này cũng có trong artifact đã lưu `plans/261021-daily-thinking-games/execution/content-candidate-audits/p08-365-v2-catalog.json`.
- Kịch bản: người/automation dùng `quality.blocked` hoặc các tổng `quality.*` để quyết định cần xử lý trùng lặp nhận kết quả không chặn và tổng bằng 0. Danh sách warning có cap 250 nên cũng không thể dùng nó để suy ra tổng đầy đủ. `fingerprintsUnique=false` vẫn còn là tín hiệu cảnh báo, nhưng không sửa được gate đang tính sai.
- Đề xuất: khởi tạo đủ bộ đếm, đồng bộ số liệu `quality` từ số đếm thực, kiểm tra `Number.isFinite` trước khi ra status. Nếu trùng lặp được chấp nhận có chủ đích, ghi quyết định đó bằng policy riêng; không để NaN quyết định. Regression cần một corpus nhỏ có trùng, xác nhận số đếm, JSON và blocked/status.

### TG-C04 — P3 — Mã nội bộ còn xuất hiện ở UI và tên trợ năng

- Vị trí: `src/components/thinking-games/ReasoningMissingInfoGame.tsx:105`; `src/components/thinking-games/QuantityTargetGame.tsx:168`; đường render thật truyền nguyên board tại `src/components/thinking-games/ThinkingGamePlayer.tsx:323`, `:359`.
- Bằng chứng render tĩnh (React `renderToStaticMarkup`, bundle trong bộ nhớ, không ghi source/artifact): `D009-bonus-vi68` hiển thị nguyên `candidate-1`, `candidate-2`, `candidate-3`, `candidate-4` trong text; `D010-bonus-vi68` có các accessible name như `aria-label="Món item-1: giá trị 1"`. Dữ liệu ví dụ lần lượt tại `content/thinking-games/manifests/release-365-v1.json:3236` và `:3658`.
- Phạm vi: release có **60 bài g04-t3** dùng nhãn ứng viên kỹ thuật và **60 bài g05-t3** dùng mã item trong nhãn trợ năng. Không có bằng chứng lộ JSON thô trong flow trẻ; JSON ở các component preview nội bộ không được tính là lỗi production trong báo cáo này.
- Kịch bản: trẻ đọc mã tiếng Anh thay tên dễ hiểu; trẻ dùng trình đọc màn hình nghe “item-1”. Quét `copyAuditErrors` trên các trường văn bản của item không thấy lỗi vì các chuỗi này được tạo tại renderer từ ID của board.
- Đề xuất: dùng “Bạn số 1”, “Món số 1” theo thứ tự hiển thị và giữ ID trong event/key/data-testid. Kiểm tra cả text render và accessible name, ngoài các field copy lưu sẵn.

## Kiểm tra nội dung và engine đã chạy

| Kiểm tra | Kết quả tự quan sát |
|---|---|
| `node scripts/check-thinking-games-release-bundle.mjs` | Exit 0; complete release-profile validation; 1.460 items; digest khớp pin/proof. Đã chạy lại thành công bằng Node 26.11.1. |
| `node scripts/check-thinking-games-content.mjs` | Exit 0; editorial, pilot và release PASS; pilot-as-release và placeholder bị từ chối đúng dự kiến. |
| V1 `checkAll({write:false})` | Exit 0, `review_blocked_quality`; 2.920/2.920 schema, known solution, solver, wrong-answer probes, malformed probes qua; alternate 362/362; 0 error. Chỉ là archive thiết kế, không được dùng làm release. |
| V2 `checkAll({write:false})` | Exit 0; 2.920/2.920 ở năm kiểm tra tương tự; alternate 148/148; 0 error, 250 warning có cap. Provenance true; các lỗi chất lượng ở TG-C03 khiến status PASS-with-warnings không phải bằng chứng không trùng. Đã chạy lại trên Node 26.11.1. |
| Quét trực tiếp release qua engine và các helper audit hiện có | 1.460/1.460 schema/known answer/wrong probes/malformed probes qua; alternate 74/74; 0 `copyAuditErrors`, 0 `positionBiasErrors`, 0 `crossTrackErrors`. TG-C01/02/04 nêu rõ giới hạn các phép quét này. |
| Duyệt hết lựa chọn hữu hạn của bài đáp án đơn | **912 bài** (gồm mọi index của `g01-t2` và options đơn còn lại), mỗi bài có đúng một lựa chọn được checker chấp nhận; 0 bài có 0 hoặc >1 đáp án. Không suy rộng thành tính duy nhất cho các trò đường đi, tập hợp hay thứ tự cho phép nhiều cách đúng. |
| Đối chiếu batch V2 và manifest V2 | 2.920 item trong năm batch bằng đúng item cùng ID của manifest, 0 mismatch. |
| Đối chiếu nội dung release và V2 | 0 khác biệt trong title, invitation, tutorial, explanation, boardData, solution, validSolutionPredicate, hints, targetSeconds, fingerprint và ruleVariantId của 1.460 item cùng ID. |
| Test có sẵn | **5 files / 64 tests PASS**, Node 26.11.1, 7,16 giây, `--maxWorkers=1 --no-file-parallelism`. Các file: `round3-mechanics`, `round3-copy`, `round3-titles-hints`, `round2-content-fixes`, `release-bundle-build` trong `tests/unit/thinking-games/`. |
| Render component | Render tĩnh ba component với dữ liệu release thật xác nhận TG-C01 và TG-C04; chưa chạy browser/device/screen reader. |

Shell mặc định là Node 22.22.0 dù `package.json` yêu cầu >=24. Sau khi phát hiện, đã dùng binary có sẵn `/home/opc/.nvm/versions/node/v26.11.1/bin/node` cho release-bundle, V2 toàn catalog và 64 test nêu trên; không cài dependency. V1, script content-check và lần quét trực tiếp release ban đầu chạy trên Node 22; engine hash quan sát vẫn khớp `e2ee48b85e3f760d54d6550ca8fc7d1fc135f193bfceb5bc6155543dacdd0848`. Không suy ra khả năng hỗ trợ Node 22 của sản phẩm.

Không chạy trực tiếp CLI candidate checker với `--all` vì mặc định nó ghi lại audit. Đã import V1 và gọi API `{write:false}`. Với V2, `checkAll` chưa export: đọc file vào bộ nhớ, đổi relative import sang file URL, cố định `import.meta.url` về URL file gốc, thêm `export {checkAll}` trong bản module trong bộ nhớ rồi gọi `{write:false}`. Không sửa file checker. Các validator engine chỉ tạo/xoá bundle tạm dưới thư mục tạm của hệ điều hành theo cơ chế sẵn có.

Lệnh test có thể lặp lại:

```sh
/home/opc/.nvm/versions/node/v26.11.1/bin/node node_modules/vitest/vitest.mjs run \
  tests/unit/thinking-games/round3-mechanics.test.ts \
  tests/unit/thinking-games/round3-copy.test.ts \
  tests/unit/thinking-games/round3-titles-hints.test.ts \
  tests/unit/thinking-games/round2-content-fixes.test.ts \
  tests/unit/thinking-games/release-bundle-build.test.ts \
  --maxWorkers=1 --no-file-parallelism
```

## Độ tuổi, giọng văn, trùng lặp và provenance

- **Độ phủ đúng phạm vi:** release là tiếng Việt, hai track `age_6_8` và `age_9_12`, mỗi track 730 items = 365 main + 365 bonus. Không có release cho mọi tuổi “9+”; `age_13_plus` và `age_3_5` chỉ có trong candidates. Metadata release có 24 game types, 96 type/variant pairs, 8 nhóm kỹ năng; 358/358 cửa sổ 8 ngày đủ kỹ năng; format cách tối thiểu 11 ngày.
- **Độ khó giữa hai track:** V2 check trên 730 cặp day/slot ghi `notHarder=0`, `clearlyHarder=726`; mọi game type qua ngưỡng trung bình 9–12 >=1,1 lần 6–8 theo thang điểm engine. Hai track không dùng trùng hint ở cùng vị trí trong cặp. Đây là proxy cấu trúc, không phải kết luận đọc hiểu/phát triển của trẻ thật. Chưa tự quan sát child-pilot; chữ ký release cũng nói rõ không claim independent review/child-pilot.
- **An toàn/giọng hỗ trợ:** quét toàn bộ title/invitation/tutorial/explanation/hints và JSON board của release không tìm thấy bộ từ cấm về IQ, hạ thấp trẻ, áp lực tốc độ/ganh đua đang dùng trong checker. Đọc mẫu cả 24 loại, cùng các sửa trước đây về thẻ ký hiệu `g04-t2`, luật riêng `g06-t2`, giải thích hành động `g08-t3`; không tái hiện lỗi thuộc các nhóm sửa đó. Không biến regex/test pass thành chứng nhận mọi sắc thái tiếng Việt hay an toàn sư phạm.
- **Trùng lặp còn thật:** release 6–8 có **707/730 fingerprint riêng**, 626 normalized signature; 9–12 có **713/730 fingerprint riêng**, 632 normalized signature. Ví dụ cùng board `[total=8,groupSize=2,mode=exact,options=[1,2,3,4]]` của 6–8 lặp ở `D005-main`, `D197-main`, `D210-bonus`, `D293-main`; các item lần lượt tại release `:1520`, `:74823`, `:80093`, `:111435`. Đây là nội dung ôn lặp trong catalog 365 ngày, không đủ bằng chứng để gọi là vi phạm cam kết “mọi bài hoàn toàn khác nhau”; không đếm thành finding riêng. Khoảng cách fingerprint vẫn qua release gate. Normalized signature là heuristic, không tương đương 434 câu hỏi hoàn toàn giống nhau.
- **V1:** 2.206 unique fingerprints / 2.193 normalized trên 2.920; bộ checker V1 chặn chất lượng đúng. Release dùng nội dung V2, nên không báo lỗi archive V1 như lỗi phục vụ trẻ hiện tại.
- **Pin/proof:** release SHA256 `dd623f9e19d98d72387fc3cd15470f1239a55baf6507bb1c9708ec2a22f1010e` khớp `src/lib/thinking-games/server/release-manifest.ts:18` và `release-365-v1.validation.json`. Manifest là `approved`, mọi item có editorial cùng chủ sản phẩm, toàn catalog có chữ ký rõ phạm vi 1.460 item và ngày duyệt 23/10.
- **Provenance V2:** engine hash hiện tại khớp metadata và nguồn của tất cả 2.920 item; source CSV hash được checker xác nhận. `source.commit` ở đây là SHA256 của engine bundle do generator tạo, không phải Git commit; xem `scripts/generate-thinking-games-candidates-v2.mjs:153`, `:345`. Không yêu cầu Git phải chứa object mang hash này.
- **Dấu duyệt nguồn không bị nhầm với hash hiện tại:** candidate manifest hiện tại hash `f8fe17cf9f7d8728ee15a487f7f7a78b80b666f336dc20ac23cd66ec9691e838`; thay duy nhất engine hash `e2ee48...` về `f649e4224478fc181cb844ff27a88149e7a9c9602949ace0ae66da3c12ae71c3` trong raw manifest, trong bộ nhớ, cho đúng `2430e697d36746b91c57ee2f84f0315683262c90e16e5613631347a3e76ae6e1` ghi trong chữ ký nguồn của release. Kết hợp đối chiếu 0 thay đổi nội dung ở trên, đây là drift provenance sau bản vá dependency được ghi nhận, không phải bằng chứng thay nội dung sau duyệt.

## Đối chiếu hồ sơ review và claims-ledger

- `execution/content-review/SUMMARY.md` là tổng hợp vòng đầu 22/10 với nhiều cờ trước sửa. Không sử dụng con số 1.401 item bị cờ hoặc 452 block như tình trạng hiện tại.
- `execution/content-review/round3-final-codex.md` và `round3-final-gemini.md` là closure kỹ thuật sau sửa. Bằng chứng hiện tại tương thích với việc các sửa mechanics/copy/title/hint đã qua: 64 test cùng solver/copy validator đều xanh. Không tuyên bố đọc tay lại đủ 1.460 bài chỉ từ kết quả này.
- `round3-final-input-sha256.json` là snapshot lịch sử. Đối chiếu các group chứa đường dẫn/hash trực tiếp: 30 entry tồn tại, 13 khác hiện tại (7 candidate documents + 6 candidate audits), trong khi 6 source và 4 test được liệt kê vẫn khớp. Việc đổi provenance và báo cáo tương ứng đã được giải thích trong `execution/codex-game-release-2026-10-24.md`; phép khôi phục hash nguồn bên trên tự xác minh điều này. Không dùng snapshot cũ để khẳng định current bytes đã được review độc lập nguyên trạng.
- `execution/codex-game-release-2026-10-24.md` cùng editorialApproval hiện tại supersede trạng thái “chưa có human approval” của các handoff round 3. Chủ sản phẩm đã có dấu duyệt phạm vi 6–8/9–12; độc lập editorial/child-pilot vẫn chưa có bằng chứng trong lane này. Không tự suy luận dấu duyệt bị thiếu hoặc không hợp lệ vì báo cáo trước đó còn pending.
- `docs/claims-ledger.md:10`, `:18` giới hạn cam kết kết quả giáo dục và yêu cầu claim mới có owner/nguồn/ngày/phạm vi. Chưa thấy entry riêng thinking-games/365 ngày, cũng không tìm thấy claim thinking-games/365 trong `apps/marketing/site-content.mjs`, `src/lib/public-proof.ts`, `src/data/science-content.json`. Không có cơ sở báo lỗi marketing mới; khi quảng bá cần giữ đúng “365 ngày nội dung tiếng Việt cho 6–8 và 9–12”, không biến thành tăng IQ/đã thử nghiệm với trẻ/nội dung 9+ mọi tuổi.

Tái hiện TG-C03 qua checker hiện có, không ghi audit JSON:

```sh
/home/opc/.nvm/versions/node/v26.11.1/bin/node --input-type=module <<'JS'
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const path = process.cwd() + '/scripts/check-thinking-games-candidates-v2.mjs';
const url = pathToFileURL(path).href;
let source = fs.readFileSync(path, 'utf8')
  .replace(/from '(\.\/[^']+)'/g, (_, p) => `from '${new URL(p, url).href}'`)
  .replaceAll('import.meta.url', JSON.stringify(url));
source += '\nexport { checkAll };';
const checker = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const { result: r } = await checker.checkAll({ write: false });
console.log({ status: r.status, unique: r.metrics.uniqueFingerprints,
  normalized: r.metrics.uniqueNormalized, quality: r.quality,
  duplicateIsNaN: Number.isNaN(r.metrics.duplicateFingerprints),
  normalizedIsNaN: Number.isNaN(r.metrics.normalizedCollisions) });
JS
```

## Giới hạn và việc còn lại

- Các phát hiện đã có bằng chứng source/data/render tĩnh; cần lane sửa được cấp ownership thực hiện TG-C01..04 rồi chạy lại validator và regression có ý nghĩa. Báo cáo này không sửa lỗi và không cấp phép phát hành.
- Việc quét 912 bộ lựa chọn dùng checker hiện tại để đếm, nên chứng minh tính duy nhất theo engine; không thay thế chứng minh độc lập mọi quy luật toán học có thể suy diễn từ một dãy ngắn. Các bài nhiều đáp án hợp lệ được giữ riêng về ý nghĩa, không ép thành một đáp án duy nhất.
- Chưa chạy browser, thiết bị thật, screen reader, nghiên cứu đọc hiểu hoặc child-pilot; chưa kiểm tra production, feature flag, DB import hoặc deploy. Không chạy migration hay bất kỳ `verify-live-*` nào. Các receipt live cũ chỉ là hồ sơ tham chiếu, không phải live check của lần audit này.
- Không đổi code nên không thực hiện cleanup/simplification, lint/typecheck/build toàn repo. Kiểm tra dùng validators nội dung có sẵn, test liên quan và render tĩnh; không có kết luận về API Next.js. Không thêm dependency, commit hoặc push.

