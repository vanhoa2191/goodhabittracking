# Hướng dẫn đăng bài trên blog

Blog nằm trong site marketing tĩnh (`kidhabithero.com/blog/`). Mỗi bài là một tệp Markdown; bộ dựng sinh trang bài, trang danh sách, trang theo chủ đề, RSS và mục sitemap. Không cần cơ sở dữ liệu hay trình soạn thảo riêng.

## Thêm một bài

1. Tạo tệp `apps/marketing/blog/<slug>.md`. Tên tệp chính là địa chỉ bài (`/blog/<slug>/`): chữ thường, không dấu, nối bằng gạch ngang, và **không đổi sau khi đăng** vì đổi là mất thứ hạng tìm kiếm.
2. Bắt đầu tệp bằng phần đầu:

```
---
title: Tiêu đề bài (tối đa 90 ký tự, có từ khóa chính ở đầu)
description: Mô tả 80–160 ký tự, hiện trên kết quả tìm kiếm và khi chia sẻ (tối đa 200).
date: 2026-10-05
updated: 2026-10-20        # tùy chọn, khi sửa nội dung đáng kể
author: Đội ngũ KidHabit   # tùy chọn
tags: [thoi-quen, khoa-hoc]  # chữ thường không dấu; hiện thành trang chủ đề
mascot: fox                # leo, bunny, panda, fox, turtle, bee
draft: true                # tùy chọn: bài nháp không được dựng
---
```

3. Viết nội dung bằng Markdown: `##` và `###` cho tiêu đề (không dùng `#` vì tiêu đề bài đã là `h1`), danh sách `-` hoặc `1.`, trích dẫn `>`, **đậm**, *nghiêng*, `mã`, liên kết `[chữ](địa-chỉ)`, ảnh `![mô tả](/duong-dan-hoac-https)`. Mọi thứ trông như HTML đều bị thoát ký tự, và liên kết chỉ nhận `https://`, `/`, `#`, `mailto:`.
4. Chạy `npm run build:marketing` rồi `npm run preview:marketing` để xem thử, và `npm test` để chạy kiểm tra. Merge vào `main` thì bản deploy tự đăng.

Bài sai định dạng (thiếu tiêu đề, ngày sai, thẻ hay mascot lạ, mô tả quá dài) làm bản dựng thất bại thay vì đăng lỗi lên site.

## Quy tắc nội dung (bắt buộc)

- Theo `docs/claims-ledger.md`: **mô tả điều nghiên cứu cho biết và điều sản phẩm làm, không hứa kết quả cho một em bé**. Bộ kiểm thử chặn các từ như "đảm bảo", "chắc chắn", "cam kết", "100%", "chữa".
- Mỗi bài nói rõ giới hạn của bằng chứng (hoặc "chưa biết", hoặc "không thay thế tư vấn chuyên gia") và có ít nhất một liên kết nội bộ tới `/science/`, `/framework/` hoặc bài khác.
- Nêu nguồn khi trích số liệu; chỉ dùng nguồn đã có ở `src/data/science-content.json` hoặc đã đối chiếu bản gốc và ghi vào sổ kiểm chứng.
- Mô tả tính năng phải đúng với sản phẩm đang chạy.

## Danh sách kiểm tra SEO cho mỗi bài

- Một từ khóa chính, đặt trong tiêu đề, mô tả, `##` đầu tiên và vài dòng đầu.
- Tiêu đề trả lời một câu hỏi thật của ba mẹ ("Xây thói quen cho trẻ mất bao lâu?").
- 2 đến 4 liên kết nội bộ (khung thói quen, cơ sở khoa học, bài liên quan) và một lời mời dùng thử ở cuối (đã có sẵn trong mẫu).
- Ảnh có mô tả (`alt`), dưới 200 KB.
- Bài dài từ 3 mục `##` trở lên tự có mục lục.

## Những gì trang đã làm sẵn

Thẻ canonical, Open Graph kiểu bài viết, dữ liệu có cấu trúc `BlogPosting` và `BreadcrumbList`, `Blog` cho trang danh sách, ngày đăng và ngày cập nhật, thời gian đọc, RSS tại `/blog/feed.xml`, sitemap có ngày sửa cuối, trang chủ đề `/blog/tag/<thẻ>/`, bài liên quan theo thẻ.

## Việc để sau

Phân trang khi có nhiều hơn khoảng mười hai bài, ảnh bìa riêng cho từng bài, tìm kiếm trong blog và gửi sitemap lên Google Search Console.
