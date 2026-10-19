# Review Kilo — cobertura và kế hoạch kiểm thử UI audit remediation

Tác giả: Kilo (verification/theme executor). Phạm vi: lập kế hoạch kiểm thử, không sửa mã nguồn, không commit, không cài đặt, không gọi production, không chạy thử nghiệm. Nguồn đọc: `.omx/reports/ui-audit-2026-10-17/report.md`, `package.json`, `plans/261017-2130-ui-audit-remediation/plan.md`, `test-spec.md`, `phase-00-baseline.md`, `phase-01-parent-safety.md`, `phase-02-visual-foundations.md`, `phase-06-inclusive-interaction.md`, `tests/e2e/*`, `tests/unit/*`, `playwright.config.ts`.

## 1. Tóm tắt đánh giáCoverage

9 nhóm audit (A01–A09) và 4 giả thuyết phụ (V01–V05) đã được ánh xạ trong `plan.md`. Hiện có bài kiểm thử liên quan nhưng cháu chưa đầy đủ để đóng bằng chứng cho mọi nhóm:

- Có sẵn và liên quan: `accessibility.spec.ts` (axe critical/serious=0, overflow 9 locale, reducedMotion reduce toàn cục), `appearance.spec.ts` (dark toggle, font size ≥15px, lỗi hydration 'hydrated'), `kid-hero-compact.spec.ts` (chiều cao hero tại 3 kích thước viewport), `task-card.spec.ts` (nhãn thẻ chi tiết, không emoji trang trí trên thẻ), `modal-focus.test.ts` (focus/trap/Escape dialog generic), `locale-parity.test.ts` (độ khớp key catalog 9 locale).
- Chưa có / chưa đủ: asserted toán tử tác vụ + nút chính trong viewport 375×812 trên demo và paired fixture; regression ph.selected scope/bulk ID; mutation chậm/thất bại/lại/thành công cho hàng duyệt; tỷ lệ tương phản tính toán theo trạng thái (normal/hover/focus/selected/disabled) tại light/dark/system; bounding box ≥44×44 CSS px theo cỡ chữ; heading outline/landmark; timer kết thúc announce + focus không rơi body; tofu emoji theo font/OS; build production-like + hiệu năng thực.

## 2. Bảng chỗ trống cobertura theo nhóm

| ID | Độ nghiêm | Bài kiểm thử hiện có | Chỗ trống chính Kilo bổ sung (kiến thức kiểm thử, không sửa mã) |
|----|-----------|----------------------|-----------------------------------------------------------------|
| A01 P1 | Nhiệm vụ dưới fold | `kid-hero-compact.spec.ts` (hero compact) | Tên nhiệm vụ + nút chính nằm trọn viewport sử dụng được 375×812 trừ sticky header/bottom-nav; demo và paired fixture; empty state có CTA/giải thích, không assert giả nhiệm vụ tồn tại |
| A02 P1 | Scope chọn bé/hàng đợi | (chưa tìm thấy bài chuyên biệt) | Selector “Xem tổng quan của…” / “Cần duyệt — tất cả bé”; 2 bé có pending; đổi bé không review nhầm; bulk IDs đúng scope; single và bulk chạy đầy đủ |
| A03 P1 | Tương phản hành động | `appearance.spec.ts` (dark, font size) | Tỷ lệ computed foreground/background cho timer Pause/Complete, approve, confirm points, footer/callout; normal ≥4.5:1, large ≥3:1, control/focus ≥3:1; light + dark + system qua UI và reload, không chỉ ép `.dark` |
| A04 P1 | Phản hồi lưu/lỗi hàng duyệt | (chưa tìm thấy) | busy/result riêng hàng, khóa gửi lặp, lỗi + thử lại rõ, không báo thành công giả, announce trước/kèm xóa, focus hàng kế hoặc heading hàng đợi |
| A05 P2 | Dark surface token | `appearance.spec.ts` (toggle dark) | Toàn bộ surface/ink/border dark qua thiết lập UI, mô phỏng hệ thống và reload; không nền sáng sót trong dark |
| A06 P2 | Nhãn/thuật ngữ | `task-card.spec.ts` (nhãn chi tiết) | Hành động đời trước taxonomy; label trạng thái open/saving/pending/completed/read-only nhìn thấy; tên truy cập cùng nghĩa; không xóa nghĩa gốc |
| A07 P2 | Vùng chạm <44×44 | (chưa tìm thấy) | getBoundingClientRect điều khiển bị ảnh hưởng ≥44×44 CSS px tại 100/108/118% cỡ chữ; focus ring không bị clip, không chồng, không tràn ngang |
| A08 P2 | Font cứng tiếng Việt | `locale-parity.test.ts` (độ khớp key) | Nhãn 9 locale, không dùng tên bản dịch làm key; cài đặt lưu cũ nạp lại đúng; mẫu font dài không bị split/truncate mất nghĩa; EN/DE/JA long-copy runtime |
| A09 P3 | Global motion kill 0.01ms | `accessibility.spec.ts` (reducedMotion reduce) | Reduced motion giữ kết quả/loading và timer announce; không confetti/bounce; phản hồi mặc định không mất; freeze/advance clock, không sleep phút thật |
| V01 | Heading skip h1→h3 | (chưa tìm thấy) | Phân cấp heading có nghĩa, landmarks/label dialog đúng; axe serious/critical=0 trên trạng thái bị ảnh hưởng; không sửa bằng role giả |
| V02 | Timer focus/status | `modal-focus.test.ts` (dialog generic) | Timer kết thúc announce, focus chuyển CTA/heading có nghĩa không nhảy body; Escape và khôi phục focus đúng; HabitTimerModal-specific |
| V03 | Emoji tofu local | `task-card.spec.ts` (không emoji trên thẻ) | Reproduce theo font/OS; biểu tượng thiết yếu dùng hệ/Lucide hiện có; không thay toàn bộ emoji trang trí |
| V04 | HMR/hydration dev | `appearance.spec.ts` (lỗi 'hydrated') | Fresh production build/reload không lỗi hydration hoặc application error luồng chính; HMR-only dev ghi riêng, không trộn vào kết quả production |
| V05 | Hiệu năng chưa đo | `scripts/check-performance-budget.mjs` (chưa chạy) | Build mới, asset/route bytes, ảnh tải, báo metric thật theo budget hiện hữu; không giả Lighthouse |

## 3. Nguyên tắc kiểm thử regression-trước

- Regression cho luồng quan trọng phải có trước khi dọn hero/card/copy/CSS: bảo vệ completion/undo, approval/deferral, today/history boundary, timer completion, reward goal/balance, bottom-nav scroll, read-aloud, swipe fallback. Tái dùng `task-card`, `quest-deferral`, `kid-history`, `habit-fire`, `kid-bottom-nav`, `phase-five-daily-experience` trước khi thêm bài mới.
- Không viết kiểm thử gương đối triển khai: không assert chuỗi class, không kiểm thử chỉ khẳng định triển khai nội bộ, không dùng screenshot làm chuẩn trạng thái mong muốn khóa layout sai.
- Thay đổi chỉ style dùng kiểm tra computed/trình duyệt phù hợp, không thêm unit test chỉ khẳng định class.
- Mỗi thất bại phân loại introduced / pre-existing / infra bằng tái hiện, không tự bỏ qua.

## 4. Ma trận cờ / ngôn ngữ / tuổi / viewport

| Trục | Mẫu bắt buộc | Cách tránh nhân tích Descartes |
|------|--------------|-------------------------------|
| Vai trò/dữ liệu | demo, paired child, cloud-like parent fixture; 2 bé có pending task + reward; empty / many / long-name | Scope/mutation chạy đầy đủ trên parent fixture; demo/paired chạy primary child flow |
| Cờ | D0: cờ optional tắt; E1: cấu hình regression-on trong `playwright.config.ts`; ageTheme tắt/bật riêng tiến trình/build | Cờ public compile-time; build/server/process tách, lưu manifest; không localStorage giả cờ |
| Tuổi | 0–3 người chăm sóc, 3–8, 9–12, 13+, unknown | Mỗi tuổi kiểm tra tác vụ/nhãn/đồng hành; screenshot đại diện trẻ nhỏ + tuổi teen, không mọi tổ hợp |
| Viewport | 375×812, 768×1024, 1280×900 | Kiểm geometry/tràn ngang cả 3; visual chụp mobile + desktop trong một vòng |
| Cỡ chữ | 100/108/118%; trình duyệt zoom 200% | Bounds/reflow điều khiển chạm tới; không bắt above-fold tại zoom 200% |
| Chủ đề/运动 | light, dark, system × normal, reduce | Tương phản/trạng thái riêng; chụp light/dark đại diện; kiểm kết quả tĩnh trong reduce |
| Ngôn ngữ | vi, en, fr, de, it, es, zh, ja, ko | Kiểm nhãn/parity cả 9; runtime dài vi/en/de/ja trên màn ảnh bị ảnh hưởng và smoke 9 locale |
| Máy trình | Chromium desktop/mobile; WebKit desktop/mobile nếu có sẵn; iOS/Android vật lý riêng | Kết quả tự động ghi engine + giả lập/touche synthesis; manual chờ không gộp vào pass |

## 5. Kiểm thử build production-like và bằng chứng hiệu năng

1. Chạy `npm run lint` (`eslint . --max-warnings=0`), `npm run typecheck` (`tsc --noEmit`), `npm run test` (vitest run), rồi `npm run build` (`next build`).
2. Khởi động `npm run start` (`next start -H 0.0.0.0`) trên cổng trống, dừng đúng PID sau khi kiểm tra; kiểm tra fresh production-like start/reload: không lỗi hydration mismatch hoặc application error trong luồng chính; ghi HMR-only dev riêng.
3. Chạy `npm run check:performance` (`node scripts/check-performance-budget.mjs`) dựa trên build mới và `config/performance-budget.json`; không điều chỉnh ngưỡng để xanh.
4. Release candidate Cloudflare: `npm run build:cloudflare` và gate hiện hữu, không thay bằng nhận định từ dev server.
5. By chứng tối thiểu cho V05: artifact/route chunk bytes và ảnh tải trước–sau; báo metric thật và budget, không bịa Lighthouse nếu chưa chạy.
6. Môi trường E2E: fixture endpoint giả, không key production; đặt locale qua cookie/init trước navigation để tránh nhiếc hydration do reload sai thời điểm.

## 6. Lệnh và trình tự kiểm thử (chưa chạy, chỉ là runbook)

```bash
rtk npm run lint
rtk npm run typecheck
rtk npm run test
rtk npm run build
rtk npm run check:performance
rtk npx playwright test tests/e2e/parent-today.spec.ts tests/e2e/task-card.spec.ts tests/e2e/appearance.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/phase-five-daily-experience.spec.ts --project=chromium --project=mobile-chromium
```

WebKit tập trung cho navigation, chủ đề, modal/timer focus và luồng nhạy với chạm; kiểm tra engine đã cài trước khi chạy. Full E2E và các gate tĩnh/bảo mật/nội dung bắt buộc theo CI ở Phase 07.

## 7. Ràng buộc và mở

- Không commit, không sửa nguồn, không cài đặt, không gọi production trong lượt này.
- File sở hữu chung (`globals.css`, `Header.tsx`, `ParentDashboard.tsx`, `KidDashboard.tsx`) chỉ một người ghi tại một thời điểm; Kilo chỉ gửi đề xuất token cho file đang được OpenCode giữ.
- Đơn vị thương mại tuổi chưa quyết (plan.md: đa nhóm tuổi, ageTheme vẫn theo cờ hiện hữu); kiểm thử tách cờ ageTheme tắt/bật, không assuming production bật.
- Manual screen reader và thiết bị iOS/Android vật lý nếu chưa làm giữ trạng thái pending, không tick giả.
- Không đặt mục tiêu điểm UX tùy ý thay cho acceptance; UX score là nhận định phụ, không dùng thay test thành công/tương phản.

## 8. Kết luận

Cobertura hiện có chào starken cho dark theme, overflow locale, accessibility tree và hero compact, nhưng còn chỗ trống rõ trên A01 asserted viewport, A02/A04 scope/mutation feedback, A03 computed contrast toàn trạng thái, A07 touch target, V01/V02/V03/V04/V05. Kilo sẽ bổ sung kiến thức kiểm thử theo ma trận ở mục 4, ưu tiên regression行为 trước cleanup, và thu bằng chứng build production-like + hiệu năng thực theo mục 5–6. File này chỉ là kế hoạch reviews; chưa có kết quả pass nào được suy ra từ nó.