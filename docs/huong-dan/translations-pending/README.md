# Bản dịch hướng dẫn chờ xuất bản

Bản dịch 12 chương (cùng mục lục) sang Pháp, Đức, Ý, Tây Ban Nha, Trung, Nhật, Hàn, dịch từ bản tiếng Anh `docs/huong-dan/i18n/en/` bằng Codex và đã kiểm cấu trúc (neo `<a id>`, đích liên kết, điểm đánh dấu `<!--op-->`). **Chưa xuất bản và chưa có người bản ngữ đọc lại**: thư mục này nằm ngoài đường quét của `scripts/build-user-guide.mjs`, nên ngôn ngữ chưa được bật vẫn đọc tiếng Anh.

## Bật một ngôn ngữ

1. Người bản ngữ rà thuật ngữ và giọng văn (đặc biệt Hàn, Nhật, Trung); có thể nhờ Codex `gpt-6-luna` rà nhất quán thuật ngữ giữa các chương.
2. Chuyển thư mục: `git mv docs/huong-dan/translations-pending/<mã> docs/huong-dan/i18n/<mã>`.
3. Thêm mã vào `GUIDE_TRANSLATIONS` trong `src/lib/guide/guide-locale.ts`.
4. Chạy `npm run guide:build` rồi `npm run guide:check`, và `npx vitest run tests/unit/guide-build.test.ts tests/unit/guide-translations.test.ts user-guide-links` (các test này đòi ngôn ngữ đã bật phải đủ chương, đủ mục, đủ liên kết và bảng, gần như không còn chữ Việt).
5. Mở `/docs` ở ngôn ngữ đó, đọc thử một chương, rồi merge.

## Giữ cho khớp

Mỗi khi chương tiếng Việt/Anh đổi, bản dịch ở đây cũ đi. Cập nhật lại bằng Codex (dịch từ bản Anh mới) hoặc để ngôn ngữ đó đọc tiếng Anh cho tới khi cập nhật. Bản dịch hiện tại khớp với bản Anh tại thời điểm có mục "Gợi ý bằng AI" (chương 9).
