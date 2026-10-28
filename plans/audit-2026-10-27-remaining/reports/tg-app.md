# Audit tg-app — 2026-10-27

**Phạm vi:** ứng dụng thinking-games, engine/mechanics/content loader, API parent/child, dashboard/settings, feature flags, giới hạn chi phí/request, quyền family/child, dữ liệu trẻ, a11y và coverage tests. HEAD kiểm tra: `ba935045cdc1f5cc73af9950d44914e6e371f2b2`.

**Kết quả: P0=0, P1=1, P2=7, P3=0 — 8 phát hiện.** Không sửa code, không migration/deploy, không gọi production hoặc `verify-live-*`; chỉ ghi báo cáo này. Các phát hiện DB dưới đây được dẫn để chứng minh lỗi tích hợp ứng dụng; không thay thế audit DB riêng.

## Phát hiện đã xác minh

### TG-APP-01 — P1 — Lưu settings luôn gọi sai HTTP method

- **Vị trí:** `src/lib/store/thinking-games-client.ts:58`, `src/lib/store/thinking-games-client.ts:101`; `src/app/api/domain/thinking-games/settings/route.ts:39`; caller `src/components/ThinkingGamesSettingsSection.tsx:57`.
- **Bằng chứng:** helper `json()` cố định `method: 'POST'`; update settings dùng helper này, nhưng route chỉ export `GET` và `PUT`. Đã đọc hướng dẫn Next cài tại `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`, xác nhận method không được implement trả 405. Probe chạy client thật với `autoImplementMethods` của Next cài trong repo: `method=POST, HTTP=405`, sau đó client ném `invalid_response / unknown`.
- **Kịch bản:** phụ huynh bật/tắt trò chơi, đổi giờ ngủ hoặc độ tuổi rồi bấm Lưu; request không bao giờ vào handler cập nhật hay kiểm tra PIN. UI báo lỗi PIN dù lỗi thực tế là method, gia đình mới không thể bật tính năng qua giao diện.
- **Đề xuất:** thống nhất client/route dùng PUT; thêm integration test nối request của client tới method dispatch thật, assert method chứ không chỉ URL/body.

### TG-APP-02 — P2 — Client từ chối mọi success status thực tế của settings

- **Vị trí:** `src/lib/store/thinking-games-client.ts:6`, `src/lib/store/thinking-games-client.ts:43`; `src/app/api/domain/thinking-games/settings/route.ts:58`; `supabase/migrations/202610210001_thinking_games.sql:911`, `:918`, `:926`.
- **Bằng chứng:** RPC trả `updated`, `disabled`, hoặc `scheduled`, route đưa nguyên status đó lên envelope. Enum client không có cả ba. Probe với schema thật cho ba envelope HTTP 200 đều cho `accepted=false`. `tests/api/thinking-games-settings.test.ts:60` dùng outer `status:'available'` và giấu `scheduled` trong data, khác response của route nên không phát hiện mismatch.
- **Kịch bản:** sau khi sửa TG-APP-01, server có thể đã ghi thành công nhưng UI vẫn báo không thể lưu và gợi ý lỗi PIN; người dùng không biết trò chơi đã bị bật/tắt hoặc đã đặt lịch thay đổi.
- **Đề xuất:** thêm settings statuses vào contract hoặc chuẩn hóa outer status về `available`; dùng chung schema server/client và test cả ba kết quả thực của RPC. Lỗi này độc lập với HTTP method và vẫn còn sau khi sửa TG-APP-01.

### TG-APP-03 — P2 — Đóng/reload game ở parent mode làm mất đường mở lại attempt trong ngày

- **Vị trí:** `src/components/ThinkingGameCard.tsx:82`, `:86`, `:133`; `src/app/api/domain/thinking-games/start/route.ts:26`, `:42`; `supabase/migrations/202610210001_thinking_games.sql:719`.
- **Bằng chứng:** lần đầu parent start trả `puzzle`; nhánh SQL khi entitlement đã tồn tại và state khác `granted` chỉ trả `entitlementId`, `attemptId`, `state`, không trả `puzzle`. Card đóng game bằng cách xóa puzzle khỏi state; start lại chỉ mở khi response có cả puzzle và attempt ID. Precheck route đọc `existing.status`, trong khi `thinking_game_parent_state_as` tại SQL `:668` trả `ok/serverLocalDay/featureEnabled/...` và không có status, nên không cung cấp cơ chế phục hồi.
- **Kịch bản:** parent mở main game cho bé, bấm Đóng hoặc reload, rồi bấm Chơi trong cùng ngày; card nhận attempt cũ nhưng hiện “Hôm nay chưa có trò chơi phù hợp”, không mở bảng. Tương tự khi attempt ban đầu được tạo trên thiết bị khác.
- **Đề xuất:** API resume/state trả public puzzle được pin của attempt đã có, giữ nguyên attempt/content; card hydrate attempt đó. Thêm regression start → exit/reload → start trong parent mode. Không tạo attempt mới để né lỗi.

### TG-APP-04 — P2 — Parent finish đổi lỗi nghiệp vụ thành success envelope

- **Vị trí:** `src/app/api/domain/thinking-games/finish/route.ts:43`; `supabase/migrations/202610210001_thinking_games.sql:815`; đối chiếu child handler `src/app/api/child/thinking-games/finish/route.ts:54`.
- **Bằng chứng:** parent handler chỉ xử lý transport `error`, bỏ qua `data.ok === false`, rồi gọi `success(data.status, data.data)`. Chạy handler thật qua in-memory bundle, stub RPC trả `{ok:false, code:'attempt_expired', status:'expired', data:{attemptId:'expired'}}`: nhận HTTP 200, body `{ok:true,schemaVersion:'v1',status:'expired',data:{attemptId:'expired'}}`. SQL có đúng nhánh lỗi này; child handler đã xử lý riêng nhưng parent handler thiếu.
- **Kịch bản:** game đang mở qua ngày địa phương mới; submit trả lỗi expiry nhưng API làm mất `attempt_expired`. Client tiếp tục ném `invalid_response` vì `expired` cũng không thuộc success enum; player biến exception thành phản hồi trả lời sai, không hướng dẫn bắt đầu ngày mới.
- **Đề xuất:** giữ failure envelope và mapping HTTP giống child handler; test expiry/rollover cho parent finish thay vì chỉ test correct/wrong answer.

### TG-APP-05 — P2 — Cookie giả vẫn kích hoạt service-role lookup trước xác thực, không có limiter ứng dụng

- **Vị trí:** `src/app/api/child/thinking-games/finish/route.ts:23`, `:25`, `:29`, `:44`, `:46`; request schema `:16`; scope validation RPC tại `supabase/migrations/202610210001_thinking_games.sql:835`.
- **Bằng chứng:** route chỉ kiểm tra cookie có tồn tại rồi hash, đọc attempt + private grading payload bằng admin client với attempt UUID do caller cung cấp; session/child scope chỉ được kiểm tra trong RPC sau parse/catalog/checker. Probe handler thật với cookie giả và stub lookup không tìm thấy row: HTTP 409 `invalid_puzzle`, **1 admin lookup, 0 session validations**. Không có limiter/counter/quota trong các route thinking-games, middleware hay SQL thinking-games; `rate_limited` chỉ xuất hiện ở type/copy, không có nhánh phát sinh trong flow này. Body được `request.json()` đọc toàn bộ và `answer` là `z.unknown()`.
- **Kịch bản:** client HTTP bên ngoài có thể tự đặt cookie bất kỳ và lặp request với UUID hợp lệ về cú pháp, gây service-role DB roundtrip trước khi bị từ chối. Nếu biết UUID tồn tại, còn đi qua parse/checker; lỗi shape/content được trả trước authorization tạo oracle về attempt. Không cần vượt CSRF: server-to-server có thể bỏ Origin. Payload lớn cũng không bị giới hạn trong handler.
- **Đề xuất:** dùng lookup/RPC lấy pinned content sau khi xác thực session và scope child/family; giới hạn body/answer theo mechanic và rate-limit theo session/IP trước DB/grading. Áp dụng scope check sớm tương tự cho parent finish. Đây là xác minh thứ tự xử lý và thiếu guard trong repo, **không phải** bằng chứng vượt quyền ghi kết quả hoặc đọc PII ra response; RPC cuối vẫn kiểm tra chủ sở hữu. Chưa xác minh rule WAF bên ngoài repo.

### TG-APP-06 — P2 — Settings cho phép bonus nhưng dashboard không có đường chơi bonus

- **Vị trí:** `src/components/ThinkingGamesSettingsSection.tsx:87`; `src/components/ThinkingGameCard.tsx:75`, `:82`, `:83`, `:123`; mount production `src/components/KidDashboard.tsx:479`.
- **Bằng chứng:** checkbox bonus được load/save; production card cố định `slot:'main'` ở cả parent/paired và `'main'` ở local, không đọc state/bonus eligibility và không có control chọn bonus. Player chỉ render puzzle đã nhận; preview harness có selector nhưng các trang preview bị chặn ở production. Đã đối chiếu call sites của client và component.
- **Kịch bản:** gia đình bật bonus, bé đáp ứng điều kiện server; dashboard vẫn chỉ có nút Chơi gọi main, không thể tiêu thụ bonus entitlement qua UI thực tế.
- **Đề xuất:** hydrate state/eligibility và hiển thị action bonus khi được phép, giữ nguyên điều kiện server. Thêm test dashboard thật với main chưa thắng và bonus vừa được cấp; không dùng preview selector làm bằng chứng hoàn thành integration.

### TG-APP-07 — P2 — Bảng hình của hai spatial mechanics bị ẩn hoàn toàn với screen reader

- **Vị trí:** `src/components/thinking-games/game-utils.tsx:72`; `src/components/thinking-games/SpatialRotationGame.tsx:92`, `:124`, `:136`; `src/components/thinking-games/SpatialSilhouetteGame.tsx:84`, `:126`.
- **Bằng chứng:** `MiniCellGrid` đặt `aria-hidden="true"` trên toàn bộ grid và không có text tương đương. Rotation option chỉ có accessible name “Lựa chọn N: hình xoay”; không mô tả ô hoặc hình. SSR probe render component thật với release puzzle `D007-bonus-vi68`: **5 grid hidden**, 4 option names đều là tên chung theo thứ tự, không có nội dung phân biệt hình. Silhouette dùng cùng helper.
- **Kịch bản:** trẻ dùng screen reader nghe được hướng dẫn xoay và tên A/B/C/D nhưng không tiếp cận được hình gốc hay hình lựa chọn, nên không có dữ kiện để giải. Các button vẫn có tên nên kiểm tra axe về unnamed controls không đủ phát hiện.
- **Đề xuất:** cung cấp mô tả hình/toạ độ hoặc representation tương đương có nghĩa cho hình gốc và từng lựa chọn; giữ phần ô trang trí hidden khi có text thay thế. Bổ sung assertion accessibility tree/content cho từng spatial mechanic, không chỉ chạy axe.

### TG-APP-08 — P2 — Xem gợi ý làm mất nút và phím tắt tạm dừng

- **Vị trí:** `src/components/thinking-games/ThinkingGamePlayer.tsx:143`; `src/components/thinking-games/ThinkingGameFrame.tsx:152`, `:187`, `:252`.
- **Bằng chứng:** request hint đổi player state thành `hints`. Frame chỉ render Pause và xử lý Escape khi state là `playing`; đóng callout chỉ đổi local hint level, không trả player state về `playing`. SSR probe với callback Pause: `playing → pauseButton=true`, `hints → pauseButton=false`. Board vẫn chơi được trong `hints`.
- **Kịch bản:** bé bấm Gợi ý rồi đóng gợi ý; không còn nút Tạm dừng và Escape không gọi pause cho đến khi dùng một action khác đổi state (ví dụ Chơi lại). Không phải chỉ trạng thái hiển thị của callout.
- **Đề xuất:** cho phép pause/Escape trong các trạng thái gameplay thích hợp hoặc giữ hint visibility độc lập với lifecycle playing; test playing → hint → close → pause/Escape.

## Bằng chứng kiểm tra và coverage

- Đọc brief, Next route-handler guide cài trong repo, source API parent/child, schema/checkers/scheduler/registry, content-row/catalog, production card/settings/frame và các test liên quan.
- **PASS:** ESLint tập trung, exit 0, không warning: `node node_modules/eslint/bin/eslint.js src/lib/thinking-games src/components/thinking-games src/components/ThinkingGameCard.tsx src/components/ThinkingGamesSettingsSection.tsx src/lib/store/thinking-games-client.ts src/lib/store/thinking-games-local.ts src/app/api/child/thinking-games src/app/api/domain/thinking-games --max-warnings=0`.
- In-memory probes dùng esbuild `write:false`, Node, React SSR và Next helper thật; không viết source/test mới. Các handler probes stub Supabase/auth để kiểm tra nhánh điều khiển; không phải E2E với database hay browser. Các kết quả cụ thể được ghi ngay tại từng finding.
- Unit/API suite: đang chờ phân bổ single-heavy-test slot từ coordinator; sẽ cập nhật kết quả trước khi bàn giao.
- Coverage hiện tại có bộ engine/adversarial/manifest/cross-age khá rộng; `tests/api/thinking-games-settings.test.ts` mock transport nên bỏ lọt method và outer status. `tests/api/thinking-games-finish-regression.test.ts` có parent happy path nhưng chưa có `data.ok:false`. Real-stack E2E dùng preview harness, được skip trong CI khi không provision real stack; không chứng minh dashboard/settings production hoạt động.

## Những guard đã thấy và giới hạn audit

- `NEXT_PUBLIC_THINKING_GAMES` điều khiển mount card/settings; server `ENABLE_THINKING_GAMES` kiểm soát release catalog cho start/finish. Pilot/internal flags bị ép false ở `NODE_ENV=production` trong `src/lib/server-features.ts:28`; preview pages/API cũng có production guards. Không thấy flow gọi model/LLM trong lane này: chi phí chính là Worker, request và DB, không phải inference theo lượt chơi.
- Release JSON có 1.460 items, **4.259.889 bytes** trên đĩa. Catalog cache admission theo isolate và dùng build-time validation proof, tránh validate cả năm trên mỗi request. `check-cloudflare-runtime.mjs:95` chỉ đo request start không có session, kiểm tra ngưỡng 1.000 ms local; không đo CPU grading, request authenticated hoặc chi phí theo lượng request. Không khẳng định vượt CPU/giá cụ thể vì chưa benchmark Worker.
- `toPublicPuzzle` là projection tường minh, bỏ `solution`, grading predicate và explanation riêng tư. Finish dùng checker server; DB RPC kiểm tra live session/child hoặc `can_manage_family` và child trong family. Chưa thấy bằng chứng cross-family ghi thắng hay response lộ raw PII trong phạm vi đã kiểm tra. TG-APP-05 vẫn cần sửa vì lookup diễn ra trước scope validation.
- Settings write/excuse yêu cầu parent unlock và PIN; parent settings GET dùng authenticated client + RLS, SELECT grant đã có migration `202610240001`. DB có cascade cho các bảng attempt/journey theo child/family. Không kiểm tra thực tế retention/export/delete ngoài lane.
- Modal status dùng `useModalFocus` để focus/trap/Escape; nhiều control có touch target và accessible names. Điều này không bù được việc thiếu nội dung cho spatial grids ở TG-APP-07.
- Không chạy build, full-project typecheck, full test suite, browser/axe, SQL runtime harness hoặc live validation trong audit này; không suy luận trạng thái production từ source. Không sửa schema hay xung đột migrations nêu trong brief.

## Bàn giao

Chỉ thêm `plans/audit-2026-10-27-remaining/reports/tg-app.md`; không có thay đổi hay simplification code. Ưu tiên sửa hai contract settings cùng lúc, sau đó parent reopen/expiry, authorization trước lookup và coverage dashboard/a11y. Các lỗi nêu trên còn nguyên vì nhiệm vụ read-only; cần regression tests tương ứng trong nhánh sửa.
