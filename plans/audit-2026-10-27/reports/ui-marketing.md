# Audit 2026-10-27 — lane `ui-marketing`

Phạm vi: UI/UX, accessibility, responsive, copy, SEO, mức tuân thủ `DESIGN.md`, đối chiếu `docs/claims-ledger.md` với nội dung công khai, và key i18n thiếu.

Thang mức độ dùng trong báo cáo:

- **P0** — đang chặn người dùng thật hoặc làm mất/sai tiền ngay trên production.
- **P1** — hợp đồng thiết kế/claim sai ở bề mặt liên quan tới tiền hoặc lời hứa công khai; sửa trước lần deploy tới.
- **P2** — lỗi a11y/i18n thật, có kịch bản hỏng rõ; sửa trong sprint này.
- **P3** — vệ sinh kỹ thuật, SEO phụ, hoặc rủi ro chỉ xảy ra khi cấu hình trôi.

**Kết quả: P0 = 0 · P1 = 1 · P2 = 7 · P3 = 9.**

Đã kiểm tra bằng: `npx tsc --noEmit` (sạch), `npx eslint . --max-warnings=0` (sạch), `npx vitest run tests/unit` (215 file / 2.595 test pass), build tĩnh `MARKETING_OUTPUT_DIR=/tmp/opencode/marketing node scripts/build-marketing.mjs` (23 trang), kiểm tra HTML tĩnh + axe-core/Playwright trên bản build (375px và 1440px).

Ghi chú môi trường: `node_modules` chưa tồn tại nên lane này đã chạy `npm ci --prefer-offline` (thư mục đã gitignore, không sửa file tracked). Máy chạy Node v22.22.0 trong khi `engines` yêu cầu `>=24` — chỉ ra cảnh báo EBADENGINE, không ảnh hưởng kết quả. Không có file `.env`/cấu hình deploy trong repo, nên **giá trị biến môi trường của production không thể xác minh từ repo**; các kết luận phụ thuộc flag được ghi rõ điều kiện.

---

## P1

### P1-1. `DESIGN.md` mô tả sai toàn bộ bảng giá đang bán (giá, số gói, nhãn, trạng thái Pro Plus)

- **File:dòng**: `DESIGN.md:60`, `DESIGN.md:61` (đối chiếu `src/lib/billing/plan-catalog.ts:11-14`, `apps/marketing/pricing.mjs:5-34`, `apps/marketing/render-site.mjs:500-503`, `apps/marketing/site-content.mjs:266`).
- **Bằng chứng (đã tự kiểm tra)**:
  - `DESIGN.md:60` ghi “Gói Cơ bản (39.000đ/tháng, 399.000đ/năm) và Gói Pro (59.000đ/tháng, 590.000đ/năm) … Gói Pro Plus is shown as coming soon”.
  - Giá thật trong `plan-catalog.ts:11-14`: `solo 49.000/399.000`, `pro 69.000/590.000`, `pro_plus 79.000/790.000`. Bản build `/pricing/` in ra `49.000 / 69.000 / 79.000` và `399000 / 590000 / 790000` (đã grep HTML build).
  - Pro Plus **đang bán thật**: `pricing.mjs:24-33` có `purchasable: true`, id checkout `pro_plus_monthly` / `pro_plus_yearly`, và trang có link `https://app.kidhabithero.com/checkout?plan=pro_plus_monthly`.
  - `DESIGN.md:60` nói “four-card comparison” + “Gói Pro Plus is shown as coming soon”; thực tế `render-site.mjs:501-503` render **3 thẻ** (`Object.keys(pricingTiers)`) cộng một toggle chu kỳ Tháng/Năm (`render-site.mjs:492`), không có thẻ “coming soon”.
  - `DESIGN.md:61` ghi nhãn “Khởi đầu nhẹ nhàng, Phổ biến nhất, Tiết kiệm nhất”; nhãn thật là `recommendedBadge: 'Hợp với gia đình mình'` (`site-content.mjs:266`) và chỉ gắn cho một thẻ.
  - `DESIGN.md:61` ghi tiết kiệm “69.000đ for Gói Cơ bản, 118.000đ for Gói Pro”; số thật do `pricing.mjs:63-64` tính (`month*12 - year`) = **189.000đ** và **238.000đ**, và trang in đúng `tiết kiệm 189.000đ` / `tiết kiệm 238.000đ`.
  - `DESIGN.md:61` còn thiếu hoàn toàn gói thứ ba và Add-on AI 29.000đ/tháng (`site-content.mjs:267`).
- **Kịch bản lỗi**: người làm UI đọc `DESIGN.md` (file được repo coi là hợp đồng triển khai) rồi “sửa” trang giá về 39.000/59.000 và gắn nhãn “sắp ra mắt” cho Pro Plus để “đúng spec”. Trang giá khi đó nói một giá, `/checkout?plan=...` thu một giá khác — khách thấy sai giá ở bước thanh toán, phát sinh hoàn tiền hoặc tranh chấp. Ngoài ra spec hiện tại khiến reviewer tưởng Pro Plus chưa mở bán và có thể gỡ nút mua hợp lệ.
- **Đề xuất sửa**: cập nhật `DESIGN.md` §3 “Pricing hierarchy” theo đúng 3 tier + toggle chu kỳ + nhãn `'Hợp với gia đình mình'` + tiết kiệm 189.000đ/238.000đ + dòng Add-on AI; thêm một test đọc `plan-catalog.ts` và fail nếu giá trong `DESIGN.md` lệch (cùng kiểu `tests/unit/marketing-pricing.test.ts` đang làm cho `pricing.mjs`).

---

## P2

### P2-1. FAQ ưu đãi ra mắt vẫn hứa nâng cấp cho đơn mua “trước ngày Pro Plus ra mắt”, trong khi Pro Plus đã mở bán

- **File:dòng**: `apps/marketing/site-content.mjs:333` (render ra `/` và `/pricing/`); đối chiếu `docs/claims-ledger.md:23` và `docs/claims-ledger.md:25`.
- **Bằng chứng**: câu trả lời FAQ: “10 gia đình đầu tiên thanh toán Gói Pro theo năm **trước ngày Pro Plus ra mắt** sẽ được chuyển lên Pro Plus miễn phí…”. Ledger hàng 23 khẳng định Pro Plus “mở bán thật, không còn nhãn sắp ra mắt/đang phát triển”; ledger hàng 25 ghi rõ điều kiện ưu đãi là “Gói Pro năm, tối đa 1 suất mỗi gia đình, thu hồi khi hoàn tiền” và **“không dùng như lời hứa về ngày ra mắt Pro Plus”**. Trang `/pricing/` đồng thời bán Pro Plus (`pricing.mjs:24-33`). Đã xác nhận chuỗi này có mặt trong HTML build của `/` (1 lần) và `/pricing/` (2 lần).
- **Kịch bản lỗi**: khách đọc FAQ hôm nay kết luận ưu đãi đã hết hạn (vì Pro Plus đã ra mắt) nên không mua Gói Pro Năm — mất một suất ưu đãi thật; hoặc ngược lại, khách mua và cho rằng mình đủ điều kiện, rồi khiếu nại vì điều kiện thật không có mốc ngày đó. Cả hai đều là tranh chấp về một quyền lợi có giá trị bằng tiền.
- **Đề xuất sửa**: bỏ mệnh đề ngày, viết theo ledger: “10 gia đình đầu tiên thanh toán Gói Pro theo năm (mỗi gia đình tối đa một suất, thu hồi nếu đơn được hoàn tiền)…”. Thêm assert trong `tests/unit/marketing-build.test.ts` cấm chuỗi “trước ngày Pro Plus ra mắt” xuất hiện trong output.

### P2-2. Trang giá bán tính năng AI trong khi app mặc định tắt các flag đó và hiển thị “sắp có”

- **File:dòng**: `apps/marketing/pricing.mjs:12`, `:20`, `:30-32`; `src/lib/experience-flags.ts:18-19`; `src/components/ParentSettingsTab.tsx:254-255`, `src/components/ParentDashboard.tsx:440`, `src/components/WeeklyReviewCard.tsx:66`.
- **Bằng chứng**: pricing bán “Gợi ý AI 20 lượt/tháng” (Cơ bản, Pro) và “Gợi ý AI không giới hạn”, “Huấn luyện viên thói quen”, “Tóm tắt tuần bằng AI” (Pro Plus) không kèm nhãn điều kiện. Cùng lúc `experience-flags.ts:18-19` mặc định `habitCoach` và `parentAi` là `false` (`process.env.NEXT_PUBLIC_* === 'true'`, `.env.example:29-30` đặt `false`), và khi tắt, UI hiện thẻ “sắp có” (`AiComingSoonCard`, `AiComingSoonButton`). `src/lib/ai/handler.ts:46` trả 404 `ai_disabled` khi tắt.
- **Giới hạn xác minh**: không có `.env`/cấu hình deploy trong repo nên **không xác minh được production có bật 2 flag này hay không**. Kết luận chỉ đúng khi production không set `NEXT_PUBLIC_PARENT_AI=true` và `NEXT_PUBLIC_HABIT_COACH=true`.
- **Kịch bản lỗi**: nếu production thiếu một trong hai flag, khách trả 79.000đ/tháng cho Pro Plus và nhận màn hình “tính năng sắp có” cho đúng ba quyền lợi được dùng để bán gói — sai lệch giữa thứ được quảng cáo và thứ nhận được, có thể bị coi là quảng cáo sai và phải hoàn tiền.
- **Đề xuất sửa**: (a) kiểm tra ngay env production (gọi một endpoint AI, 404 `ai_disabled` = đang tắt); (b) nếu chưa bật, thêm nhãn “sắp có” cho các dòng AI trên trang giá; (c) thêm test build đọc `experience-flags` env mẫu và fail nếu trang giá bán tính năng đang tắt — giống cách `marketing-pricing.test.ts` đang khoá giá.

### P2-3. `claims-ledger.md` hàng giá vẫn ghi số tiết kiệm cũ (69.000đ / 118.000đ) và “4 gói”

- **File:dòng**: `docs/claims-ledger.md:22`.
- **Bằng chứng**: ledger ghi “Khung giá 4 gói trả phí (Gói Cơ bản và Gói Pro, mỗi gói theo tháng và theo năm)” và “số tiết kiệm (69.000đ, 118.000đ) tính từ chính các giá trên”. Giá hiện hành (`plan-catalog.ts:11-14`) cho tiết kiệm 189.000đ và 238.000đ; trang build in đúng hai số này. Số gói bán được là 6 SKU / 3 tier (`PAID_PLAN_IDS`), gồm cả Pro Plus đang mở bán.
- **Kịch bản lỗi**: đây là file nguồn sự thật cho mọi claim công khai. Người sửa nội dung “đối chiếu ledger” sẽ sửa trang giá về 69.000đ/118.000đ (khớp ledger nhưng sai số học), khiến trang công bố mức tiết kiệm thấp hơn thực tế gần 3 lần — mâu thuẫn với số in cạnh giá và với chính sách hoàn tiền, gây mất tin cậy ở đúng chỗ khách đang cân nhắc trả tiền.
- **Đề xuất sửa**: cập nhật hàng 22 thành “3 gói trả phí (Cơ bản/Pro/Pro Plus), mỗi gói tháng và năm, cộng Add-on AI”, sửa tiết kiệm thành 189.000đ / 238.000đ / 158.000đ, và ghi rõ số này suy ra từ `PLAN_PRICES` chứ không chép tay.

### P2-4. Timeline trang chủ làm mờ nội dung xuống 28% opacity → tương phản 1.42:1 (WCAG 1.4.3 fail)

- **File:dòng**: `apps/marketing/styles.css:566` (`[data-motion] .timeline li:not(.on) { opacity: .28; }`), điều khiển bởi `apps/marketing/client.js:162-169`.
- **Bằng chứng**: đo bằng axe-core trên bản build ở 375×812, sau khi cuộn tới timeline và chờ 1,5s (trạng thái ổn định, không phải hiệu ứng đang chạy): 2 mục (`7:10 Nhanh lên, muộn rồi!`, `7:15Ba nói bao nhiêu lần rồi?`) nằm trọn trong viewport với `opacity: 0.28`; axe báo `color-contrast` serious, `foreground #cacac2 on background #f3eee5 = 1.42:1` (cần 4.5:1, chữ 16px bold không thuộc diện “large text”). Ở 1440px cũng lặp lại cùng lỗi. Chỉ mục đang “on” mới đạt 1.0.
- **Kịch bản lỗi**: mọi mục nằm dưới mốc 62% chiều cao viewport bị làm mờ vĩnh viễn cho tới khi người dùng cuộn qua; khách có thị lực kém hoặc màn hình ngoài trời không đọc được đúng những câu kết của câu chuyện (phần “điểm rơi” marketing). Đây là nội dung thật, không phải trang trí.
- **Đề xuất sửa**: nâng mờ tối thiểu lên mức còn ≥4.5:1 (ví dụ `opacity: .72` với `--ink-2`), hoặc giữ 1.0 và chỉ đổi màu viền/bubble cho mục đang đọc; nếu vẫn muốn hiệu ứng thì chỉ áp cho phần trang trí, không áp cho `time`/text.

### P2-5. Focus ring của site marketing chỉ đạt 1.75:1 trên nền kem (WCAG 1.4.11 / 2.4.11)

- **File:dòng**: `apps/marketing/styles.css:146` (`outline: 3px solid var(--color-sun)`), `--color-sun: #f3b23c` ở `styles.css:13`; nền `--bg: #faf7f2` (`styles.css:3`).
- **Bằng chứng**: tính tương phản WCAG: `#f3b23c` trên `#faf7f2` = **1.75:1**, trên `#f3eee5` = **1.62:1** (cần ≥3:1 cho focus indicator). Quy tắc này áp toàn cục cho `a`, `button`, `summary` — tức header, footer, và mọi trang `/privacy/`, `/terms/`, `/docs/`, `/blog/*` (các trang này không nằm trong `.story` nên không được override bởi `.story :focus-visible` ở `styles.css:426`, vốn dùng `--green` = 7.05:1).
- **Kịch bản lỗi**: người dùng bàn phím không thấy focus đang ở đâu khi tab qua header/footer hoặc đọc trang pháp lý — đúng nhóm người dùng cần focus ring nhất; với thanh địa chỉ mờ hoặc màn hình sáng yếu thì viền gần như vô hình.
- **Đề xuất sửa**: đổi outline mặc định sang `var(--green)` (7.05:1) và giữ `--sun` cho `.dock`/nền tối, hoặc dùng hai lớp `outline + box-shadow` tối để đạt ≥3:1 trên mọi nền.

### P2-6. App không có skip link và không có landmark `main`

- **File:dòng**: `src/app/layout.tsx:98-104` (body chỉ có provider + `{children}`); không tồn tại `<main>` hay `role="main"` trong `src/app` ngoài `src/app/admin/page.tsx:14,26`, `src/app/admin/security/page.tsx:14,24`, `src/app/error.tsx:15`.
- **Bằng chứng**: `grep -rn 'role="main"' src` → không có kết quả; `grep -rn '<main' src/app` chỉ ra 5 dòng thuộc admin/error. `grep -rn 'skip-link\|Bỏ qua' src/app src/components` → không có kết quả, trong khi site marketing có (`apps/marketing/render-site.mjs:183`, `.skip-link` ở `styles.css:94`).
- **Kịch bản lỗi**: người dùng bàn phím/switch trên dashboard phải tab qua toàn bộ header (logo, chuyển ngôn ngữ, cỡ chữ, âm thanh, docs, hồ sơ, đăng xuất…) ở **mỗi** lần điều hướng trước khi tới nội dung; screen reader không có landmark để nhảy thẳng vào vùng làm việc chính. WCAG 2.4.1 (Bypass Blocks, level A).
- **Đề xuất sửa**: thêm `<a class="skip-link" href="#noi-dung">Bỏ qua điều hướng</a>` ngay đầu `body` và bọc vùng nội dung chính của `src/app/page.tsx` trong `<main id="noi-dung">`; copy vào module i18n (đừng hardcode).

### P2-7. 5 chuỗi kết quả thanh toán chỉ có tiếng Anh ở 7 locale

- **File:dòng**: `src/lib/i18n/translations.ts:31-37` (fr/de/it/es/zh/ja/ko đều `...checkoutCopy.en`); nguồn `translations.ts:11-26`.
- **Bằng chứng**: `checkoutCopy` chỉ có `vi` và `en`; 7 locale còn lại spread bản `en`, nên `secureCheckoutAction`, `paymentReturnActivated`, `paymentReturnPending`, `paymentReturnCancelled`, `paymentReturnError` hiện tiếng Anh. Đã kiểm tra 281 key top-level của 9 file locale là **khớp đủ** — đây là lỗ hổng duy nhất của lớp i18n, không phải thiếu key hàng loạt.
- **Kịch bản lỗi**: phụ huynh dùng ja/ko/zh/de/fr/es/it bấm thanh toán rồi quay về: toàn bộ trang trước đó đúng ngôn ngữ, riêng câu quyết định “đã kích hoạt / đang chờ / đã huỷ / không xác minh được” lại là tiếng Anh. Đây là thời điểm nhạy cảm nhất (tiền đã rời tài khoản); người không đọc tiếng Anh không biết gói đã kích hoạt hay chưa và dễ bấm thanh toán lần hai.
- **Đề xuất sửa**: thêm 5 chuỗi cho từng locale trong file locale tương ứng (không spread `en`), và thêm test parity: mọi key của `checkoutCopy.vi` phải có bản dịch khác rỗng ở 8 locale còn lại.

---

## P3

### P3-1. Site marketing tải font từ Google Fonts CDN, không self-host, và dùng face khác `DESIGN.md`

- **File:dòng**: `apps/marketing/render-site.mjs:173-175`; `apps/marketing/styles.css:33-34`; CSP `apps/marketing/security-headers.mjs:24-25`; đối chiếu `DESIGN.md:41`.
- **Bằng chứng**: HTML build có `<link rel="preconnect" href="https://fonts.googleapis.com">` và `…/css2?family=Be+Vietnam+Pro…`; `--font-display`/`--font-body` đều là `"Be Vietnam Pro"`. `DESIGN.md:41` quy định stack self-host Plus Jakarta Sans, Fraunces cho headline landing, JetBrains Mono cho mã. App dùng `next/font/google` (self-host lúc build, `src/app/layout.tsx:2,21-33`) nên chỉ marketing lệch. CSP phải mở `style-src`/`font-src` cho 2 domain này.
- **Kịch bản lỗi**: request CSS font là render-blocking tới domain bên thứ ba; khi Google Fonts chậm/bị chặn (mạng công ty, một số ISP trong khu vực), trang rơi về `system-ui` — mất hoàn toàn dáng chữ thương hiệu ở đúng trang bán hàng, và thêm 2 lần DNS/TLS trước khi vẽ chữ.
- **Đề xuất sửa**: self-host `Be Vietnam Pro` (woff2, subset vietnamese) trong `apps/marketing/` và bỏ 3 dòng preconnect/font; sau đó chốt lại `DESIGN.md:41` theo face thực tế đang dùng hoặc đổi marketing sang các face trong DESIGN.

### P3-2. 9 tiêu đề và 3 meta description dài quá ngưỡng hiển thị SERP

- **File:dòng**: sinh từ `apps/marketing/blog.mjs` (title ghép `| Blog KidHabit Hero`) và `apps/marketing/site-content.mjs`; đo trên HTML build.
- **Bằng chứng** (đo trên `/tmp/opencode/marketing`): title > 65 ký tự ở 9/23 trang, dài nhất `/blog/khong-co-con-so-21-ngay/` = 98 ký tự; description > 160 ở 3 trang: `/blog/bat-dau-voi-it-thoi-quen/` 166, `/blog/khong-co-con-so-21-ngay/` 186, `/gioi-thieu/` 167.
- **Kịch bản lỗi**: Google cắt giữa từ ở tiêu đề/description → mất phần phân biệt (“…| Blog KidHabit Hero” bị cắt, hoặc mất vế “vì sao không có con số 21 ngày”), giảm CTR ở đúng các bài nhắm truy vấn dài.
- **Đề xuất sửa**: rút hậu tố blog xuống `| KidHabit`, đặt trần mềm 60/155 ký tự và thêm assert trong `tests/unit/marketing-build.test.ts` để chặn hồi quy.

### P3-3. `BrandMark` khai báo id SVG trùng khi render 2 lần trên cùng trang

- **File:dòng**: `src/components/BrandMark.tsx:19-26` (`brand-surface`, `brand-sprout`, `brand-shadow`).
- **Bằng chứng**: id là hằng chuỗi trong mỗi instance `<svg>`; `fill="url(#brand-surface)"` tham chiếu id đầu tiên trong document. BrandMark được render ở `Header` và ở `AppEntryGate`/`PublicInfoPage`, nên trang đăng nhập có ≥2 instance cùng id.
- **Kịch bản lỗi**: trình duyệt phân giải `url(#…)` về instance đầu tiên; nếu instance đó bị unmount (đổi nhánh render) hoặc nằm trong `<defs>` của một SVG `display:none`, logo thứ hai mất gradient/đổ bóng và hiện thành khối phẳng; HTML vẫn “hợp lệ” nên không test nào bắt được.
- **Đề xuất sửa**: dùng `useId()` của React để sinh hậu tố id (`brand-surface-${id}`) và tham chiếu theo biến.

### P3-4. Chữ 11px vẫn còn ở 2 component (DESIGN §3 cấm 10–11px)

- **File:dòng**: `src/components/HabitSupportTrend.tsx:31`, `src/components/KidDashboard.tsx:1130`.
- **Bằng chứng**: `DESIGN.md:53` — “Tiny 10–11px text is not part of the refreshed system”; cả hai chỗ dùng class `text-[11px]`. Chỗ thứ hai là badge số trên tab nhiệm vụ của bé (chữ quan trọng, không phải metadata trang trí).
- **Kịch bản lỗi**: trên máy 375px với `font-scale` mặc định 1.08, 11px ≈ 11.9px thực — badge số và legend xu hướng khó đọc với phụ huynh lớn tuổi; khi người dùng tăng cỡ chữ, badge có `leading-5` cố định nên chữ bị cắt.
- **Đề xuất sửa**: đổi cả hai sang `text-xs` (12px) và kiểm tra lại `leading` của badge.

### P3-5. 4 link `target="_blank"` thiếu `rel="noopener noreferrer"`

- **File:dòng**: `src/components/CheckoutModal.tsx:260-261`, `src/components/onboarding/ConfirmStep.tsx:59-60`.
- **Bằng chứng**: `<Link … target="_blank">` cho `/terms/` và `/privacy/` không có `rel`; các chỗ khác trong repo làm đúng (`src/components/CheckoutPaymentDetails.tsx:157-158` có `rel="noopener noreferrer"`).
- **Kịch bản lỗi**: trình duyệt hiện đại tự ngầm `noopener` nên rủi ro bảo mật thấp, nhưng trang đích vẫn nhận `window.opener` trên trình duyệt cũ/webview của một số Android; đồng thời không có `noreferrer` nên URL đơn hàng có thể lộ trong referrer.
- **Đề xuất sửa**: thêm `rel="noopener noreferrer"` cho 4 chỗ; hoặc bỏ `target="_blank"` vì `/terms/`, `/privacy/` đã là trang tĩnh mở cùng tab được.

### P3-6. `body { overflow-x: hidden }` che lỗi tràn ngang thay vì để layout reflow

- **File:dòng**: `src/app/globals.css:62`.
- **Bằng chứng**: rule tồn tại đúng như trên, áp cho mọi trang app. `DESIGN.md` §4 yêu cầu reflow không cuộn ngang ở 320–375px; site marketing dùng cách ngược lại (`apps/marketing/styles.css:420` `overflow-x: clip`). Lane này **không reproduce được** một phần tử tràn cụ thể vì app cần biến môi trường/Supabase để render — nên đây là rủi ro cấu trúc, không phải lỗi đã thấy.
- **Kịch bản lỗi**: bất kỳ thành phần nào rộng quá viewport (bảng admin, `min-w-*`, modal) sẽ bị **cắt mất nội dung bên phải** thay vì xuất hiện thanh cuộn; người dùng mất nội dung mà không có dấu hiệu nào, và không ai phát hiện vì “không có scrollbar ngang”.
- **Đề xuất sửa**: tạm đổi sang `overflow-x: clip` (giống marketing) và thêm một e2e ở 375px assert `document.documentElement.scrollWidth <= innerWidth`, để lỗi tràn lộ ra thành test fail thay vì bị che.

### P3-7. `manifest.ts` dùng màu mặc định của Tailwind/indigo, không theo token thiết kế, và khoá `lang: 'vi'`

- **File:dòng**: `src/app/manifest.ts:12-14`.
- **Bằng chứng**: `background_color: '#f8fafc'` (slate-50), `theme_color: '#4f46e5'` (indigo-600), `lang: 'vi'`. Bảng màu app dùng sand/amber (`src/app/globals.css:36-40`), và marketing đặt `theme-color` là `#1f5f47` (`apps/marketing/render-site.mjs:171`). App hỗ trợ 9 ngôn ngữ (`src/lib/i18n/translations.ts`).
- **Kịch bản lỗi**: splash screen PWA màu xám xanh và thanh trạng thái màu indigo xuất hiện trước khi app kịp vẽ, tạo nháy màu lệch thương hiệu mỗi lần mở từ home screen; `lang: 'vi'` khiến screen reader/OS coi app là tiếng Việt kể cả khi người dùng chọn `ja`.
- **Đề xuất sửa**: đặt `background_color` theo `--color-sand-50`, `theme_color` theo màu thương hiệu đang dùng ở marketing, và bỏ `lang` (hoặc sinh manifest theo ngôn ngữ request như `layout.tsx` đang làm với `<html lang>`).

### P3-8. Cast `language as Exclude<Language,'vi'|'en'|'fr'>` che mất nhánh `en`/`fr`

- **File:dòng**: `src/lib/i18n/portrait-guide-copy.ts:292`.
- **Bằng chứng**: `LOCALES[language] ?? makeCompactLocale(language as Exclude<…>)` — nếu `LOCALES` thiếu key `en` hoặc `fr`, hàm sẽ gọi `makeCompactLocale` với giá trị mà type đã loại bỏ. Hiện `LOCALES` có đủ key nên hành vi runtime đúng, nhưng kiểu dữ liệu đang nói dối: TypeScript không còn khả năng cảnh báo nếu ai đó xoá một entry.
- **Kịch bản lỗi**: một lần refactor `LOCALES` (đổi tên key, lazy-load) sẽ rơi vào nhánh fallback mà không có lỗi biên dịch; phụ huynh `en`/`fr` nhận bản dịch “compact” sai định dạng (tên nhân vật không dịch, thiếu `goldWords`).
- **Đề xuất sửa**: bỏ cast, để `makeCompactLocale(language)` nhận `Language` và tự xử lý `vi`/`en`/`fr`; hoặc dùng `satisfies Record<Exclude<Language,'vi'>, …>` cho `LOCALES` để thiếu key là lỗi compile.

### P3-9. Chuỗi hiển thị nằm ngoài module copy (1 tiếng Việt hardcode, 1 alt tiếng Anh hardcode)

- **File:dòng**: `src/components/ParentJourneysTab.tsx:97`, `src/components/Header.tsx:316`.
- **Bằng chứng**: `ParentJourneysTab.tsx:97` render nguyên câu tiếng Việt “Lộ trình này gợi ý thứ tự thêm thói quen…” chỉ khi `language === 'vi'`, thay vì nằm trong `src/lib/i18n/*` như các câu khác trong cùng file (`copy.description`). `Header.tsx:316` đặt `alt="Google avatar"` — tiếng Anh, trong khi chỗ tương ứng ở `Header.tsx:477` dùng `chromeCopy.avatarAlt`.
- **Kịch bản lỗi**: câu tiếng Việt không thể dịch khi bật thêm ngôn ngữ, và vì điều kiện là `language === 'vi'` nên người dùng `en` **không thấy** thông tin định tuyến tính năng (không chỉ là chưa dịch — nội dung bị mất). Alt tiếng Anh bị screen reader đọc lên giữa UI tiếng Việt ở badge tài khoản desktop.
- **Đề xuất sửa**: chuyển câu ở `ParentJourneysTab` vào module copy (khoá `journeys.programsNote`) cho cả 9 locale; đổi `alt="Google avatar"` thành `alt=""` (avatar cạnh tên người dùng là trang trí) hoặc dùng `chromeCopy.avatarAlt`.

---

## Đã kiểm tra và KHÔNG phải lỗi (ghi lại để khỏi audit lại)

- **Key i18n đủ**: 9 file locale có đúng 281 key top-level giống nhau (script đối chiếu riêng). Lỗ hổng duy nhất là 5 chuỗi `checkoutCopy` ở P2-7.
- **A11y tĩnh của site marketing**: 23 trang build — không có id trùng, mọi `<img>` có `alt`, mọi `<button>` có `type`, không nhảy bậc heading, đúng 1 `<h1>`/trang, không có accessible name rỗng (2 link promo `hidden` được JS điền trước khi hiện).
- **Radio toggle giá**: `role="radiogroup"` + `role="radio"` + `aria-checked` + roving `tabindex` đúng chuẩn (kiểm trên HTML build), không phải lỗi.
- **Target size**: đo thực tế ở 375px trên `/`, `/pricing/`, `/privacy/`, `/docs/` — không có link/nút nào dưới 24×24px (kể cả `.legal-toc a`, `.science-sources a` vì padding dọc + line-height đã đủ).
- **Tràn ngang**: `scrollWidth == innerWidth` ở 375px trên cả 6 trang đo được của marketing.
- **Không có link/neo hỏng**: quét toàn bộ 23 trang — 0 href/src nội bộ trỏ tới file không tồn tại, 0 `#anchor` không có đích.
- **Link CTA sang app hợp lệ**: mọi `?plan=` trên trang giá (`solo_*`, `monthly/yearly`, `pro_plus_*`, `ai_addon_monthly`, 2 promo) đều được `src/app/checkout/page.tsx` + `CheckoutEntry.tsx:28-30` xử lý (add-on đi qua `isAddonId`/`addonVisible`).
- **Giá công khai khớp code**: `/pricing/` in 49.000/69.000/79.000 và 399.000/590.000/790.000, khớp `plan-catalog.ts`; tiết kiệm 189.000/238.000 khớp phép tính. Sai nằm ở tài liệu (P1-1, P2-3), không ở trang.
- **Input và modal trong app**: mọi `<input>`/`<select>` nằm trong `<label>` hoặc có `aria-label`; focus trap + nhãn dialog đúng (`src/lib/use-modal-focus.ts`, `src/components/ui/ModalShell.tsx:84-91`, có `aria-modal` + trả focus).
- **`prefers-reduced-motion`**: app xử lý ở `src/app/globals.css:199-206` và trong component; marketing xử lý ở `apps/marketing/styles.css:771-774` (timeline về opacity 1). Không phải lỗi.
- **`<html lang>`**: app cập nhật theo ngôn ngữ cả SSR lẫn sau khi đổi (`src/app/layout.tsx:94`, `src/lib/i18n/context.tsx:96`). Không phải lỗi.
- **Font trong app**: `next/font/google` self-host lúc build nên vẫn đúng tinh thần “self-hosted” của `DESIGN.md:41`; chỉ marketing tải CDN (P3-1).
- **Dữ liệu khung thói quen**: `/framework/` in “47 thói quen”, “5 giai đoạn”, dải tuổi `0-3 / 3-6 / 6-12 / 12-15 / 15-18` khớp `src/data/habit-framework-v1.vi.json`.
- **SEO khác**: canonical tự trỏ đúng trên từng trang marketing, `sitemap.xml` có đủ 23 URL, `robots.txt` cho phép index + trỏ sitemap, `og:image` là URL tuyệt đối; app origin để `noindex` toàn cục (`src/app/layout.tsx:62`, `src/app/robots.ts`) nên các trang `/pricing`, `/privacy`… bản app không tạo duplicate content.
- **Prompt AI**: `src/lib/ai/sanitize.ts` + `prompts.ts` chỉ gửi tiêu đề thói quen và số đếm, không gửi tên/nhật ký của bé — claim “không gửi tên hay nhật ký của bé” trên trang giá là đúng.
