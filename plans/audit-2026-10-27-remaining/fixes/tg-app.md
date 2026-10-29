# Fix tg-app — 2026-10-28

Phạm vi: TG-APP-01..08 trong `reports/tg-app.md`. Đã đọc FIX-BRIEF và hướng dẫn Route Handlers của bản Next cài trong worktree; kiểm chứng lại độc lập từng điều kiện lỗi trong source trước khi sửa. Cả 8 phát hiện được xác nhận, không có mục “không xác nhận”. Không commit/push, không deploy, không gọi production, không áp dụng hoặc sửa migration.

Coordinator đã cho phép mở rộng lane sang `src/components/ThinkingGameCard.tsx` và helper server qua phản hồi `msg_9f1b70cf3df9`. Không chỉnh 4 component thuộc lane tg-content; thay đổi giải thích `displayReasoningEliminationExplanation` do lane khác thêm vào ThinkingGamePlayer được giữ nguyên.

## Từng phát hiện

| ID | Kiểm chứng độc lập | Sửa và bằng chứng regression | Rủi ro còn lại |
| --- | --- | --- | --- |
| TG-APP-01 | Xác nhận: helper JSON hardcode POST trong khi settings route chỉ có PUT/GET. | `thinking-games-client.ts`: update dùng PUT, các command khác giữ POST. Test nối client với `autoImplementMethods` thực của Next và handler settings thực, qua đủ 3 kết quả RPC. | Test auth/PIN/DB được mock, chưa kiểm chứng PIN qua DB thật. |
| TG-APP-02 | Xác nhận: RPC `updated/disabled/scheduled` không thuộc enum success client; route chuyển nguyên status lên outer envelope. | Settings PUT chuẩn hóa outer status thành `available`; giữ nguyên toàn bộ RPC result trong `data`, bao gồm `data.status` mà settings UI đọc để thông báo scheduled. Test client→Next method dispatch→PUT→RPC fixture cho cả 3 status. | Không thay đổi chính sách áp dụng settings. |
| TG-APP-03 | Xác nhận: parent start trả attempt cũ không có puzzle, và precheck đọc `status` không tồn tại trong state RPC. | Parent start bỏ precheck không có tác dụng; sau start RPC thành công, nếu thiếu puzzle thì đọc đúng attempt pin với filter attempt/child/family, validate catalog và dùng `toPublicPuzzle`. API test mở lại 2 lần giữ nguyên attempt/content và không lộ solution/predicate; browser test card thực start→close→start→reload→start. | DB mutation/revocation race và migration thực do lane tg-db-ci kiểm chứng; API không tự tạo attempt khác để resume. |
| TG-APP-04 | Xác nhận: parent finish không xử lý `data.ok === false`. | Parent finish giữ failure envelope/mapping HTTP như child. Test `attempt_expired/day_changed` trả 409 với code và messageKey; card đóng board và hướng dẫn tải lại ngày mới. Browser test submit expiry qua card/player thực ở desktop và mobile. | Chưa chạy rollover bằng clock/DB thật. |
| TG-APP-05 | Xác nhận: cookie chỉ cần tồn tại đã đọc private attempt, lookup không scope child đã xác thực; parent lookup chưa filter family; body không giới hạn và không có application limiter. | Child finish xác thực bằng RPC `get_child_session` có sẵn trước khi tạo admin lookup, filter attempt theo child từ session. Parent finish filter thêm family từ parent context. Hai finish handler dùng reader streaming tối đa 16 KiB (cả khi thiếu Content-Length), limiter 60 request/phút/IP và session hoặc parent, tối đa 2.048 bucket; từ chối 429 trước DB và có Retry-After. Test cookie giả không đọc attempt/chấm điểm, thứ tự auth→lookup, scope child/family, body lớn, rotate cookie/IP, reset cửa sổ, capacity fail-closed. Checker hiện hữu tiếp tục xác minh mechanic sau khi scope được chấp nhận. | Limiter nằm trong từng isolate/process, không phải quota phân tán; isolate mới hoặc traffic phân tán vẫn cần edge/WAF nếu muốn giới hạn tổng deployment. IP dùng `cf-connecting-ip` khi có, phụ thuộc proxy đáng tin ghi đè header; nơi không có header dùng bucket `unknown` chung. Không tuyên bố chống DDoS toàn hệ thống. |
| TG-APP-06 | Xác nhận: card production chỉ gửi slot main dù settings cho phép bonus. | State parent/child bổ sung `bonusAvailable` từ entitlement trong ngày đã scope sau auth: main đang started/finished và chưa thắng, bonus được granted/started. Helper hỗ trợ quan hệ PostgREST to-one object hoặc array. Card hydrate trên mount/focus, khi đóng/mở, và mỗi 60 giây; hiện “Chơi thêm” khi server có grant và gửi slot bonus. Các điều kiện start vẫn do RPC kiểm tra. Unit/API test eligibility, main thắng, revoked/finished, thiếu grant/error; browser mount card thực kiểm tra parent/paired và không có grant. | Grant hoặc quiet-hours có thể đổi sau lần hydrate; server start vẫn quyết định và có thể từ chối. Cập nhật trên thiết bị khác được phát hiện khi focus hoặc trong khoảng 60 giây. Chưa chạy E2E với thói quen/approval DB thật. |
| TG-APP-07 | Xác nhận: MiniCellGrid aria-hidden và tên option không chứa dữ kiện hình. | MiniCellGrid thành ảnh có accessible label mô tả kích thước, gốc tọa độ và từng ô tô đậm (hàng/cột tính từ 1). Hai spatial mechanics dùng cùng representation trong tên từng option. Test SSR assert hình gốc và từng lựa chọn có đầy đủ dữ kiện phân biệt. | Chưa thử bằng thiết bị screen reader thực; mô tả theo tọa độ bằng tiếng Việt theo copy hiện hữu của mechanics. |
| TG-APP-08 | Xác nhận: hint đổi lifecycle sang hints; frame và callback player chỉ cho pause khi playing. | Frame giữ nút Pause và Escape trong hints; player chấp nhận pause trước/sau await cho playing hoặc hints, giữ nguyên guard pending/context. Browser player thực: playing→hint→close→pause→resume→hint→close→Escape. | Chưa kiểm tra assistive hardware; test Chromium desktop/mobile đều qua. |

## File thay đổi của lane

- `src/lib/store/thinking-games-client.ts`
- `src/lib/thinking-games/server/request-guards.ts` (mới)
- `src/lib/thinking-games/server/availability.ts` (mới)
- `src/app/api/domain/thinking-games/settings/route.ts`
- `src/app/api/domain/thinking-games/start/route.ts`
- `src/app/api/domain/thinking-games/finish/route.ts`
- `src/app/api/domain/thinking-games/state/route.ts`
- `src/app/api/child/thinking-games/finish/route.ts`
- `src/app/api/child/thinking-games/state/route.ts`
- `src/components/ThinkingGameCard.tsx`
- `src/components/thinking-games/game-utils.tsx`
- `src/components/thinking-games/SpatialRotationGame.tsx`
- `src/components/thinking-games/SpatialSilhouetteGame.tsx`
- `src/components/thinking-games/ThinkingGameFrame.tsx`
- `src/components/thinking-games/ThinkingGamePlayer.tsx` (chỉ 2 điều kiện pause của lane này)
- `tests/api/thinking-games-settings.test.ts`
- `tests/api/thinking-games-finish-regression.test.ts`
- `tests/unit/thinking-games-app-guards.test.ts` (mới)
- `tests/unit/thinking-games-spatial-accessibility.test.ts` (mới)
- `tests/e2e/thinking-games-app-regression.spec.ts` (mới)
- Báo cáo này.

Simplification: xóa parent-state precheck không đúng contract và thừa DB roundtrip; tái sử dụng parser pin/catalog/public projection hiện hữu; dùng một mô tả ô chung cho cả spatial mechanics; chuẩn hóa settings envelope thay vì mở rộng enum giao thức ở hai nơi. Không thêm dependency.

## Kiểm tra đã chạy

Tất cả test/tsc/lint nặng chạy qua `flock /tmp/emperor-heavy.lock`.

- **PASS 56/56, 7 file**: `npx vitest run tests/api/thinking-games-finish-regression.test.ts tests/api/thinking-games-settings.test.ts tests/api/thinking-games-catalog.test.ts tests/unit/thinking-games-app-guards.test.ts tests/unit/thinking-games-spatial-accessibility.test.ts tests/unit/thinking-games-content-row.test.ts tests/unit/thinking-games-local.test.ts`.
- **PASS 10/10** browser regression card/player, hai viewport 1280×800 và 375×812; sau đó **PASS 2/2** test expiry vừa bổ sung, cùng hai viewport. Headless Chromium thực `/usr/bin/chromium-browser`, không dùng mock DOM. API response là fixture, dynamic import adapter thay cho Next runtime, không có DB/server Next; đây là kiểm tra component production trong browser, không phải full-stack/deployed E2E.
- Browser command: `npx playwright test --config=/tmp/tg-app-playwright.config.cjs --max-failures=1 --timeout=10000`; lượt thêm expiry dùng `--grep expired`. Config tạm trỏ `testDir` tới `tests/e2e`, match `thinking-games-app-regression.spec.ts`, workers=1, reporter=list, launchOptions.executablePath=`/usr/bin/chromium-browser`, hai project viewport nêu trên; không khởi động webServer. Spec tự bundle production card/player bằng esbuild và intercept API ở localhost.
- **PASS**: `npx tsc --noEmit --incremental false` toàn worktree.
- **PASS**, 0 warning: ESLint toàn bộ source/test của lane đã chỉnh với `--max-warnings=0`.
- **PASS**: `git diff --check`.
- **PASS**: mechanical design detector Impeccable trên 6 UI file của lane trả `[]`; đây không phải chứng nhận WCAG hoặc visual QA với CSS production.

Các lần chạy đầu đã phát hiện lỗi kiểu trong test mới và lỗi fixture browser (thiếu define process.env, origin không localhost, tên accessible của hint/resume). Đã sửa test harness, rồi mới có các lượt PASS nêu trên; không diễn giải các lỗi fixture đó thành lỗi production.

Không chạy full suite/build, SQL runtime, WAF/load test, screen reader thực hoặc live verification. Có các lane khác đang thay đổi worktree; chỉ danh sách trên thuộc trách nhiệm tg-app. Chính sách dữ liệu/DB không thay đổi.
