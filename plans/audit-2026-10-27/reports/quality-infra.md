# Audit quality-infra — 2026-10-27

## Phạm vi và kết luận

- Checkout: `/home/opc/orca/workspaces/goodhabittracking/emperor`, HEAD `83b118367fead8a79f7918c928e4f92dbdd0590e`; đây là bằng chứng của checkout này, không phải production hay các nhánh tính năng khác.
- Đã đọc brief; chỉ ghi báo cáo này. Không sửa source/config/lockfile, không commit, không migration/deploy, không gọi provider hoặc `verify-live-*`.
- Lint, TypeScript và toàn bộ Vitest đạt. Dependency audit thất bại và vì nằm trước build trong `npm run ci`, hiện chặn quality gate.
- **7 phát hiện: P0=0, P1=1, P2=4, P3=2.** Không có kết luận rằng production bị khai thác hoặc có RCE thực thi được.

## Bằng chứng chạy thật

Các lệnh chạy bằng Node **26.11.1** qua `PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH`; Node mặc định của shell là 22.22.0, thấp hơn `package.json:75` yêu cầu `>=24`. Lint/typecheck rồi Vitest chạy tuần tự; Vitest giới hạn một worker.

| Kiểm tra | Kết quả quan sát |
|---|---|
| `npm run lint` | Exit 0, `eslint . --max-warnings=0` |
| `npm run typecheck -- --incremental false` | Exit 0; không ghi lại `tsconfig.tsbuildinfo` |
| `npm test -- --maxWorkers=1 --reporter=dot` | Exit 0; **312 files, 3.369 tests passed**, 115,63 giây |
| `npm run verify:habit-framework` | Exit 0; 47 records; checksum `85460efcafe42bc585582954dbb559969126b3e09da79c0929762563773f31d0` |
| `npm run verify:habit-framework-translation` | Exit 0; en/ko/fr/de/it/es/zh/ja, mỗi ngôn ngữ 47 habits và 5 stages |
| `npm run guide:check` | Exit 0; 26 generated guide files khớp source |
| `npm run check:secrets` | Exit 0; scanner báo 1.499 files; đây là kết quả detector hiện có, không chứng minh mọi dạng secret đều được phát hiện |
| `npm run check:audit` | **Exit 1**; high/critical advisories không nằm trong allowlist |
| `npm audit --json` qua child process, chỉ in summary | Exit 1; 10 package entries: 1 critical, 4 high, 5 moderate; một package có thể chứa nhiều advisories |
| Hai fixture chạy source script trong `node:vm`, filesystem/process được mock trong bộ nhớ | Xác nhận QI-02 và QI-03; không tạo fixture/report phụ |

Chưa chạy `npm run ci` nguyên chuỗi, Next/OpenNext build, performance trên artifact thật, Playwright/browser, SQL runtime, Workerd preview hoặc live smoke. `.next` và `.open-next` không có ở lần kiểm tra; build/browser sẽ tạo artifact ngoài file báo cáo, còn brief chỉ cho ghi báo cáo và cho phép test/lint/tsc. SQL runtime tạo database nên không thực hiện trong lane read-only; không suy từ test Vitest sang SQL/production acceptance. Các stderr có chữ `failed` trong Vitest là các kịch bản lỗi được test; kết quả suite cuối cùng không có test thất bại.

## Phát hiện

### QI-01 — P1: dependency gate đang chặn CI với lockfile hiện tại

**Vị trí:** `package.json:48`, `package.json:53`, `package.json:65`, `package.json:72`, `package.json:73`; gate ở `package.json:39`, `.github/workflows/ci.yml:22`.

**Bằng chứng:** `npm run check:audit` exit 1; `npm ls next zod undici body-parser vite --all` xác nhận các phiên bản sau:

| Dependency | Phiên bản đã resolve | High/critical advisory được gate báo |
|---|---|---|
| `next` | 16.3.8 | GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r, GHSA-673q-mjm6-r5xr |
| `zod` | 4.6.5 | GHSA-mrhx-c7xc-m3w5 |
| `body-parser` qua OpenNext AWS → express | 2.3.0 | GHSA-27r3-jxmh-p828 |
| `undici` qua wrangler → miniflare | 7.29.1 | GHSA-xjj6-f33q-929c |
| `vite` qua Vitest, development tooling | 8.3.0 | GHSA-587h-7wmj-h5pm |

`npm audit --omit=dev` vẫn báo body-parser và undici: đây là phân loại dependency graph của npm, **không phải bằng chứng hai thư viện này được serve trong Worker**. `@opennextjs/cloudflare` nằm trong dependencies; wrangler được share trong cây tooling.

**Giới hạn bảo mật đã kiểm tra:** `npm ls sharp --all` xác nhận Next dùng `sharp@0.35.5 overridden`, đúng workaround của [advisory image optimization](https://github.com/advisories/GHSA-2464-fhr4-w9xw). `next.config.ts` không bật Cache Components và tìm `use cache` trong `src/` không có directive tương ứng, nên chưa xác nhận điều kiện của [advisory cache RCE](https://github.com/advisories/GHSA-673q-mjm6-r5xr). Các yếu tố này không làm `check:audit` xanh và không thay thế nâng bản; không nâng severity thành P0 theo nhãn advisory.

**Kịch bản lỗi:** push/PR chạy quality → `npm run ci` dừng ở `check:audit` trước `build:cloudflare` và `check:performance`; deploy cần quality thành công tại `.github/workflows/ci.yml:77` nên bị chặn. Rủi ro runtime thực tế cần lane security đánh giá reachability, không suy từ npm severity.

**Đề xuất:** cập nhật Next và eslint-config-next đồng bộ lên bản đã vá, kiểm tra tương thích OpenNext, cập nhật lockfile cho Zod ≥4.6.6, body-parser ≥2.4.0, undici ≥7.30.1 và Vite >8.3.2; `npm audit` hiện đề xuất Next 16.4.3. Upstream ghi bản vá Next 16.4.1 và [Zod 4.6.6](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5); kiểm tra advisory mới khi thực hiện rồi chạy lại audit/build/runtime. Không mở rộng allowlist production để bỏ qua các lỗi này.

### QI-02 — P2: audit wrapper báo passed khi npm trả JSON lỗi registry

**Vị trí:** `scripts/check-audit.mjs:41`, `scripts/check-audit.mjs:26`, `scripts/check-audit.mjs:54`.

**Bằng chứng:** `audit()` chỉ kiểm tra stdout có tồn tại rồi `JSON.parse`, không kiểm tra `result.error`, trạng thái process hay shape báo cáo. `findBlockingAdvisories()` dùng `report?.vulnerabilities ?? {}`; JSON lỗi không có vulnerabilities trở thành báo cáo sạch. Đã chạy chính source trong VM với `spawnSync` trả `{status:1, stdout:'{"error":{"code":"E503","summary":"registry unavailable"}}', stderr:''}` cho cả hai lượt audit; output thực tế:

```text
AUDIT_ERROR_FIXTURE ["Dependency audit passed: no high or critical advisories outside the dev-only allowlist."]
```

Đây là lỗi được inject để kiểm tra nhánh xử lý; registry thật trong lượt audit của lane vẫn trả báo cáo vulnerabilities hợp lệ.

**Kịch bản lỗi:** registry/proxy trả JSON lỗi khi CI chạy audit → quality tiếp tục như đã kiểm tra dependency, trong khi không có kết quả audit hợp lệ. Exit 1 cũng là trạng thái npm dùng cho vulnerabilities, nên không thể chỉ coi mọi exit khác 0 là transport failure.

**Đề xuất:** từ chối `report.error`, spawn error/signal và shape không hợp lệ; xác nhận `vulnerabilities` cùng metadata trước khi phân tích. Bổ sung regression cho JSON registry error, stdout rỗng/malformed và báo cáo vulnerabilities exit 1; hiện `tests/unit/check-audit.test.ts:28` chỉ kiểm tra allowlist/advisory helpers.

### QI-03 — P2: initial JavaScript budget bỏ sót layout chunks

**Vị trí:** `scripts/check-performance-budget.mjs:25`, `scripts/check-performance-budget.mjs:29`, `scripts/check-performance-budget.mjs:41`; ngưỡng tại `config/performance-budget.json:2`.

**Bằng chứng:** script tìm đúng một key `[project]/src/app/<route>/page`, cộng files của page và không cộng layout cha. Installed Next thực sự đọc script tags theo từng `layoutOrPagePath` ở `node_modules/next/dist/server/app-render/get-layer-assets.js:19` và lấy `entryJSFiles[filePathWithoutExt]` ở `get-css-inlined-link-tags.js:18`. App có client providers trong root layout, xem `src/app/layout.tsx:6` và `src/app/layout.tsx:99`.

Đã chạy source script với filesystem mock: page chunk 100.000 bytes; hai layout chunks mỗi chunk 900.000 bytes; `entryJSFiles` chứa page và layout riêng. Tổng initial fixture 1.900.000 bytes vượt ngưỡng 1.700.000; từng chunk vẫn dưới 1.000.000. Output thực tế:

```json
{"status":"passed","largestInitialRoute":{"route":"/","bytes":100000,"files":1},"allChunksBytes":1900000,"largestChunk":{"bytes":900000}}
```

**Kịch bản lỗi:** thêm JS vào shared provider/layout làm initial payload vượt budget nhưng page-only counter và single-chunk check vẫn xanh. Đây là lỗi cách đo đã reproduce; không khẳng định bundle hiện tại vượt ngưỡng vì không build artifact thật.

**Đề xuất:** tính union deduplicated của page, toàn bộ parent layouts và entry/bootstrap assets của route; parse manifest có cấu trúc thay vì tìm chuỗi. Thêm fixture page+layout regression và đối chiếu network resources của một production render. Ngưỡng đang đo raw bytes; không thể thay cho LCP/INP hoặc kích thước truyền gzip/Brotli.

### QI-04 — P2: hai browser regression về consent bị skip trên CI sạch

**Vị trí:** `tests/e2e/analytics-consent.spec.ts:26`, `tests/e2e/parent-reminders.spec.ts:38`, `playwright.config.ts:6`, `playwright.config.ts:45`, `.github/workflows/ci.yml:61`.

**Bằng chứng:** cả hai test đọc `process.env.NEXT_PUBLIC_SUPABASE_URL` trong process Playwright và skip nếu thiếu. Config chỉ fallback URL giả trong biến cục bộ `e2eSupabaseUrl`, rồi đưa nó vào `webServer.env` của process Next; không gán vào environment của process runner. Job browser không khai báo public Supabase env, khác với deploy step. Test đã có routes/session mocks nên không cần production credentials để chạy. `loadEnvConfig(process.cwd())` có thể làm test chạy trên máy có `.env.local`, nhưng không giải quyết clean checkout CI.

**Kịch bản lỗi:** clean CI không có `.env.local` và không có Supabase env → app dev server vẫn lên nhờ fallback nhưng regression signed-in analytics consent và parent reminder opt-in/revoke tự skip. Đây là kết luận từ control flow/config đã đọc, chưa chạy browser để đếm skip thực tế.

**Đề xuất:** dùng chung synthetic Supabase origin/key cho runner và server hoặc fixture chung; khai báo rõ env ở browser job. Không cần cấp secret thật; cần assert các test bắt buộc không skip ở CI.

### QI-05 — P2: mobile Chromium project không được workflow nào chạy

**Vị trí:** `playwright.config.ts:74`, `.github/workflows/ci.yml:61`, `.github/workflows/webkit-nightly.yml:36`, `tests/e2e/quest-deferral.spec.ts:35`.

**Bằng chứng:** CI PR/main chỉ chạy `--project=chromium`; nightly chỉ webkit/mobile-safari với danh sách spec có giới hạn. Tìm `mobile-chromium` trong `.github/` không có lệnh chạy. Phone swipe test gọi `test.skip(!isMobile)` và dùng CDP (`newCDPSession`, dòng 46), nên desktop Chromium bỏ qua và WebKit không thay thế được test này. Nightly mặc định cũng không chọn `quest-deferral`, `kid-bottom-nav` hoặc `a11y-menus`.

**Kịch bản lỗi:** child swipe deferral/completion hoặc bottom navigation mobile hồi quy nhưng các workflow PR và nightly mặc định không chạy các ca chuyên biệt đó. Một số spec khác tự resize viewport trên desktop; chúng không thay thế touch/CDP tests có `isMobile` gate.

**Đề xuất:** thêm một job/step mobile-chromium có giới hạn, tối thiểu quest-deferral, kid-bottom-nav, a11y-menus và các luồng child chính; giữ workers=1 cho CI. Kiểm tra lại danh sách nightly để các ca mobile a11y thực sự được gọi.

### QI-06 — P3: các module chỉ còn test tiêu thụ làm tăng chi phí bảo trì

**Vị trí:** `src/lib/i18n/landing-ui-copy.ts:23`, `src/lib/server-features.ts:16`, `src/lib/public-funnel.ts:27`, `src/lib/public-proof.ts:53`, `src/lib/domain/local-date.ts:1`.

**Bằng chứng:** đã quét graph import tương đối/alias trong 539 source TS/TSX files rồi kiểm tra lại bằng `rg` cả module paths và exported symbols trên `src/`, `scripts/`, `tests/`. Năm module trên không có consumer production; consumer nằm trong test tương ứng. `landing-ui-copy.ts` giữ copy chín ngôn ngữ, được `tests/parent-secondary-copy.test.ts` đọc nhưng UI không import. `public-proof`/`public-funnel` còn được docs tham chiếu, nên không kết luận nội dung domain không cần nữa.

**Kịch bản lỗi:** đổi UI/feature thật vẫn có thể để test của module bỏ dùng xanh; người sửa tiếp tục duy trì copy/feature flags hoặc tin rằng funnel instrumentation đã được nối. Chưa đo bundle và không khẳng định các module này đang làm bundle lớn hơn.

**Đề xuất:** xác nhận chủ đích của từng module; xóa module/test nếu đã bỏ chức năng, hoặc nối vào đúng consumer nếu là chức năng chưa hoàn thành. Nếu giữ làm specification, chuyển ra runtime tree và ghi rõ trạng thái trong docs. Không tự xóa trong audit.

### QI-07 — P3: deployment guide lặp checklist và còn gọi marketing là Pages

**Vị trí:** `docs/deployment.md:31`, `docs/deployment.md:69`, `docs/deployment.md:87`; thực tế script tại `scripts/run-marketing-pages.mjs:23`.

**Bằng chứng:** mục tên miền/checklist dòng 12–29 lặp lại tại 31–46. First setup dòng 69–71 vẫn gọi marketing origin là Pages, trong khi dòng 7 và 89 nói dùng Workers Static Assets, không dùng Pages. Script gọi `wrangler deploy <static-directory> --name kidhabit-home` ngoài app config, phù hợp Workers; workflow hiện hardcode custom domains, không còn các origin tạm mà dòng 87 mô tả.

**Kịch bản lỗi:** operator đọc checklist setup cũ có thể tìm sai sản phẩm Cloudflare hoặc sửa một bản checklist nhưng bỏ sót bản còn lại. Đây là sai lệch tài liệu, không có bằng chứng deploy hiện tại dùng sai nền tảng.

**Đề xuất:** giữ một checklist tên miền, đổi nhãn Pages sang marketing Worker/static origin, sửa câu “origin tạm”; giữ các cảnh báo về legacy Pages project trong đoạn riêng.

## Độ phủ vùng rủi ro và build/deploy đã đối chiếu

| Vùng | Bằng chứng hiện có | Giới hạn cần giữ rõ |
|---|---|---|
| Payment webhook/order creation/reconciliation | API tests kiểm signature trước DB, duplicate/idempotent result, mismatch, provider uncertainty; signature unit tests riêng; tất cả nằm trong suite đã đạt | API dùng mock RPC/provider. Script SQL có preflight và real two-connection contention tests nhưng lane chưa chạy |
| Parent PIN/child access | `tests/api/parent-unlock-gates.test.ts:42` liệt kê 11 sensitive actions và assert không mutation khi thiếu PIN; child completion không bị gate. Pairing tests cover expired/revoked/consumed/rate limit | Không chứng nhận Auth/PostgREST/RLS production; SQL family fixture là projection, có stub crypto được ghi rõ tại `tests/integration/migrations/family-operations-runtime.mjs:28` |
| Consent/notifications/browser | Có test opt-in, revoke và anonymous no-request | QI-04 làm hai test signed-in skip khi CI sạch |
| Touch/mobile/accessibility | Có mobile projects, test phone swipe và mobile bottom bar | QI-05: các ca này không được workflow mặc định gọi đầy đủ |
| Guide/content | Framework và translations verifier đã đạt; guide test so generated content với committed files (`tests/unit/guide-build.test.ts:20`) | Việc `guide:check` không có trong npm ci không phải lỗ hổng riêng vì Vitest đã kiểm điều tương ứng |
| Audit/performance gate | Audit allowlist có expiry; production không được exempt. Performance check ở cuối npm ci | Thiếu regression cho audit transport error và layout-byte accounting, QI-02/03 |

`vitest.config.mts:17` chọn `tests/**/*.test.ts` với environment node; không có configured coverage thresholds. Có package coverage-v8 nhưng CI không chạy coverage. Không đưa ra phần trăm coverage khi chưa đo; số tests lớn không đồng nghĩa coverage runtime, RLS hoặc browser đầy đủ.

Đã đọc installed Next docs `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md` và `03-api-reference/06-cli/next.md` trước khi kết luận về build: Next 16 dùng Turbopack mặc định cho build, còn Playwright app server dùng dev webpack. OpenNext wrapper thực hiện build rồi mới preview/deploy theo mode (`scripts/run-cloudflare.mjs:44`); root wrangler main/assets trỏ `.open-next/worker.js` và `.open-next/assets`, có nodejs_compat. Không thấy cấu hình trỏ nhầm Pages cho app.

Luồng CI thực tế phù hợp phần lớn deployment guide: deploy cần quality/browser/sql; app đợi marketing release đúng SHA, chặn deploy cũ nếu main đã đổi ở configuration step, rồi kiểm health version cùng dependency checks. Secrets/public build vars được khai báo riêng tại deploy; không kiểm tra giá trị thực trên GitHub/Cloudflare. SQL job PostgreSQL 18.4, loopback URL và ba harness khớp `docs/deployment.md:236`.

**Khoảng trống chứng nhận:** CI browser dùng `next dev`, release harness dùng `next start` (`scripts/verify-release-candidate.mjs:142`), không có predeploy Workerd startup smoke trong workflows đã đọc. Build/OpenNext thành công và Node browser tests không chứng minh Worker khởi động; đây là giới hạn verification cần bổ sung, không phải lỗi runtime đã reproduce. Health probes sau deploy có ích nhưng xảy ra sau thay đổi production. Build/performance thật, mobile/browser, local SQL và Workerd smoke còn là các gate chưa thực thi trong lượt audit này.

## Thứ tự xử lý đề xuất

1. Sửa dependency gate QI-01 rồi chạy lại audit; giữ phân biệt nhãn advisory với reachability thực tế.
2. Thêm regression và sửa hai gate báo xanh sai QI-02/QI-03.
3. Bảo đảm signed-in consent tests thực sự chạy và thêm mobile-chromium tối thiểu, QI-04/QI-05.
4. Chạy build + performance artifact + local SQL + Workerd smoke trong lane được phép tạo artifact, sau đó browser acceptance. Không gọi production để thay cho local verification.
5. Dọn module bỏ dùng và deployment guide, QI-06/QI-07; audit này chưa thực hiện simplification nào.

File thay đổi của lane: chỉ `plans/audit-2026-10-27/reports/quality-infra.md`. `.gitignore` đã bẩn khi bắt đầu và được giữ nguyên.
