# Audit Reconciliation

## Sources

- `kidhabit-audit.pdf`, 44 trang, ngày 2026-09-27, kiểm tra commit `3509df7`.
- Repo hiện tại tại commit `3509df7` và các kế hoạch đang mở trong `plans/`.
- Bằng chứng phiên gần nhất: health production sẵn sàng; test accessibility hiện có 24/24; focused entry/profile E2E 16/16; người dùng đã xác nhận tạo hồ sơ bé thành công.

## Findings accepted

| Finding | Evidence | Plan owner |
|---|---|---|
| Thiếu `/privacy`, `/terms`, `/contact` | Chỉ có `/`, `/docs`, `/admin` | Phase 2 |
| Public HTML/SEO/share chưa đủ | `/` là client page; thiếu robots, sitemap, manifest, OG image | Phase 3 |
| Landing dài, thiếu proof thật và route chuyên biệt | `LandingPage.tsx` lớn; public IA mỏng | Phase 4 |
| PIN mặc định và hiển thị rõ | `store.tsx` khởi tạo `1234`; settings render PIN | Phase 1 |
| Lifecycle/revenue ops chưa có | Không có email provider/outbox/refund workflow | Phase 6 |
| PWA chưa có | Không có manifest/service worker | Phase 7 |
| Admin dựa vào danh sách email | `src/lib/auth/admin-access.ts` | Phase 8 |
| Monitoring lỗi chưa có | Không có error sink/redaction contract | Phase 8 |
| Một số nội dung locale fallback | Khung dữ liệu tập trung ở bản tiếng Việt | Phase 9 |
| Store/landing có trách nhiệm quá rộng | `store.tsx`, `LandingPage.tsx` | Phase 9 |

## Findings corrected or narrowed

| Audit statement | Reconciliation |
|---|---|
| Security headers tốt | `camera=()` và CSP thiếu `worker-src blob:` đang chặn QR scanner; sửa có giới hạn trong Phase 1. |
| Build/CI chưa xác minh | Đây là giới hạn phiên audit, không phải defect. Chỉ chạy lại ở release gate. |
| Accessibility có một số lỗi | Suite hiện tại xanh; mở rộng ma trận state/viewport và chỉ sửa lỗi tái hiện được. |
| Cần thương mại hóa toàn cầu ngay | Trái quyết định ưu tiên Việt Nam. Locale ngoài VN giữ trải nghiệm phù hợp và thông báo khả dụng rõ ràng. |
| Tạo hồ sơ bé đang lỗi | Đã được người dùng xác nhận chạy lại; giữ regression test và observability. |
| CTA phải đổi demo-first | Chấp nhận như giả thuyết conversion; rollout có measurement và không hạ khả năng đăng nhập. |

## Product decisions preserved

- Gói hiện hành: Cơ bản 29K/tháng cho 1 bé, Cao cấp 49K/tháng, Cao cấp năm 399K/năm; không có gói trọn đời ở UI bán hàng.
- Cloud sync là mặc định; không đưa lựa chọn “lưu cục bộ” trở lại.
- QR cố định, phụ huynh có thể làm mới; trẻ quét camera hoặc nhập mã thủ công.
- Landing là sales page cho khách mới; session phụ huynh/trẻ quay lại đi thẳng vào app.
- Ưu tiên Việt Nam và PayOS trong giai đoạn hiện tại.

## Open decisions deferred to implementation gates

1. Chủ sản phẩm hoặc tư vấn pháp lý duyệt câu chữ privacy/terms/refund trước production.
2. Chọn nhà cung cấp email sau khi so sánh data region, webhook, suppression, chi phí và Cloudflare compatibility.
3. Chọn error-monitoring provider sau khi chứng minh scrubber loại bỏ child/profile/payment fields.
4. Chỉ đặt KPI sau tối thiểu một cửa sổ baseline hợp lệ; các số trong PDF không phải cam kết.
