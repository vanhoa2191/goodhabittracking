# Fix lane `ui-marketing` — 2026-10-27

Phạm vi: P1-1, P2-1..7, P3-3/4/5/9 của `reports/ui-marketing.md`. Không commit, push, deploy hay gọi production.

| Phát hiện | Kiểm chứng độc lập | Sửa trong lane |
|---|---|---|
| P1-1 | Xác nhận: `DESIGN.md` ghi 39k/59k và Pro Plus chưa bán, trong khi `PLAN_PRICES` là 49k/69k/79k và 3 tier đều mua được. | Sửa §Pricing hierarchy theo catalog, chu kỳ Tháng/Năm, 3 thẻ, nhãn đề xuất, tiết kiệm 189k/238k/158k và Add-on AI. Test so tài liệu với `PLAN_PRICES`. |
| P2-1 | Xác nhận: FAQ còn “trước ngày Pro Plus ra mắt”, trái ledger và trang đang bán Pro Plus. | Bỏ điều kiện ngày, ghi giới hạn một suất/gia đình và thu hồi khi hoàn tiền; test output FAQ. |
| P2-2 | Xác nhận **có điều kiện**: AI quyền lợi xuất hiện trong giá, trong khi `NEXT_PUBLIC_PARENT_AI` và `NEXT_PUBLIC_HABIT_COACH` mặc định tắt; không có env production trong repo. | Khi flag tắt, gắn “sắp có” cho các dòng AI trên marketing và pricing/checkout app; giữ nguyên giá, SKU, hành vi thanh toán. Test parity flag và output build. |
| P2-3 | Xác nhận: ledger ghi 4 gói và tiết kiệm 69k/118k. | Sửa thành 3 tier/6 SKU, giá và tiết kiệm từ `PLAN_PRICES`; test đồng bộ tài liệu. |
| P2-4 | Xác nhận: timeline áp `opacity: .28` cho toàn `li` chứa chữ. | Giữ chữ đầy đủ opacity; chỉ đổi viền bubble chưa được kích hoạt và xóa transition opacity không còn dùng. Axe browser trên timeline không còn lỗi tương phản. |
| P2-5 | Xác nhận: focus ring mặc định dùng màu vàng nhạt trên kem. | Dùng xanh đậm `--green` cho focus mặc định, giữ override vàng của dock trên nền tối. Browser kiểm computed outline của trang privacy. |
| P2-6 | **Không xác nhận** phần “không có main”: `src/app/page.tsx` đã có `<main>`. **Xác nhận** thiếu skip link. | Thêm skip link bản địa hóa trước header và `id="noi-dung"`/`tabIndex={-1}` cho main; được điều phối viên cho mở `src/app/page.tsx` đúng mục đích này. |
| P2-7 | Xác nhận: 7 locale lấy nguyên 5 chuỗi checkout tiếng Anh. | Dịch 5 chuỗi cho fr/de/it/es/zh/ja/ko; test parity, không rỗng, không lặp bản en. |
| P3-3 | Xác nhận: nhiều BrandMark trùng ba SVG id. | Dùng `useId()` và test render hai instance có id/reference riêng. |
| P3-4 | Xác nhận: hai nơi audit chỉ ra còn `text-[11px]`. | Đổi legend và badge sang `text-xs`, badge dùng line height co giãn. |
| P3-5 | Xác nhận: 4 link pháp lý mở tab mới thiếu `rel`. | Thêm `noopener noreferrer` cho cả bốn. |
| P3-9 | Xác nhận: chú thích chương trình chỉ xuất hiện tiếng Việt, avatar desktop có alt tiếng Anh. | Thêm `programsNote` cho 9 locale và hiện theo flag ở mọi locale; avatar cạnh tên dùng alt rỗng. |

## File đã đổi

`DESIGN.md`, `docs/claims-ledger.md`, `apps/marketing/pricing.mjs`, `apps/marketing/site-content.mjs`, `apps/marketing/styles.css`, `src/app/page.tsx`, `src/components/BrandMark.tsx`, `src/components/CheckoutModal.tsx`, `src/components/HabitSupportTrend.tsx`, `src/components/Header.tsx`, `src/components/KidDashboard.tsx`, `src/components/ParentJourneysTab.tsx`, `src/components/onboarding/ConfirmStep.tsx`, `src/components/public/PricingPlans.tsx`, `src/lib/i18n/app-skip-copy.ts`, `src/lib/i18n/journeys-tab-copy.ts`, `src/lib/i18n/pricing-plan-copy.ts`, `src/lib/i18n/promo-copy.ts`, `src/lib/i18n/translations.ts`; test mục tiêu ở `tests/unit/marketing-pricing.test.ts`, `marketing-build.test.ts`, `marketing-promo-client.test.ts`, `plan-copy-coverage.test.ts`, `promo-pricing.test.ts`, `locale-parity.test.ts`, `ui-marketing-brand-mark.test.ts`, `tests/e2e/accessibility.spec.ts`, `marketing-home.spec.ts`.

## Kiểm chứng

- Vitest mục tiêu: **8 file, 293 test pass**. Lần chạy trước có 2 lỗi do expectation mới chưa khớp HTML có `<b>` và promo copy app riêng; đã sửa, chạy lại xanh.
- Sau chỉnh sửa nhỏ vị trí nhãn “sắp có” trước dấu câu: Vitest 4 file liên quan, **127 test pass**.
- `npx tsc --noEmit`: pass.
- ESLint các file mã đã đổi `--max-warnings=0`: pass. Lần đầu lẫn Markdown/CSS bị ESLint báo 3 cảnh báo “file ignored”; đã chạy lại đúng tập file hỗ trợ.
- `npm run build:marketing`: pass, 23 trang.
- Playwright marketing (375px): kiểm axe color-contrast timeline và focus ring trang privacy: **1 pass**. Lần đầu test dùng selector `.site-header` trên trang home không có selector đó; đã sửa test chuyển sang privacy và chạy lại xanh.
- Playwright app Chromium: skip link đầu trang chuyển focus bàn phím tới `main#noi-dung`: **1 pass**.
- `git diff --check`: pass.
- Impeccable detector đã chạy một lần; trả exit 2 vì cảnh báo thiết kế có sẵn ở các đoạn ngoài diff (viền accent, bounce easing, indigo/purple), không liên quan sửa lane này.

## Rủi ro còn lại

- Chưa xác minh giá trị flag AI của production. Bản marketing dựng với env mặc định tắt sẽ hiển thị “sắp có”; bản dựng và app phải dùng cùng flag để claim phản ánh đúng trạng thái phục vụ thực tế. Không thử API live.
- Checkout vẫn cho mua gói/Add-on AI theo chính sách hiện hành khi tính năng AI tắt; nhãn mới chỉ công bố trạng thái, không thay đổi điều kiện bán. Chủ dự án cần quyết định riêng nếu muốn chặn mua Add-on khi AI chưa bật.
- `Header.tsx` là file chia sẻ với lane khác; diff của lane này trong file đó chỉ thay `alt` của avatar. Đã báo điều phối viên để khi tích hợp giữ đúng quyền sở hữu hai phần sửa.
