# Review biên tập vòng 2 (Sonnet) — Daily Thinking Games 365 ngày, V2

> Review độc lập, chỉ đọc; **không phê duyệt** — việc duyệt thuộc về chủ sở hữu. Phạm vi: 1.460 mục `age_6_8` + `age_9_12` trong `content/thinking-games/candidates/365-v2/batch-01..05`.

## 1. Đề xuất: **duyệt sau khi sửa**

Chất lượng đã tốt hơn rõ rệt so với vòng 1: **không còn** ID kỹ thuật, JSON thô, tiếng Anh `ahead/left/right/behind`, câu giữ chỗ, từ "đánh" bạo lực; engine chấp nhận 1.460/1.460 lời giải và brute-force g05-t3 (mọi tập con), g06-t1 và g07-t3 (đường đi DFS, tối đa 300 đường/mục, dài ≤14 ô) khớp đúng luật hiển thị (0 sai lệch). Nhưng **chưa nên cho trẻ chơi ngay** vì còn 250 mục mức `block` do 5 lỗi mang tính hệ thống (đều sửa được ở generator), cộng một lớp lỗi mới: giọng văn 9-12 quá học thuật và token `kích_cỡ`/`vị_trí` lộ ra.

**Cách đọc:** 5 lỗi `block` dưới đây sửa ở generator/renderer là xong cả 250 mục; sau đó nên chạy lại review (script).

## 2. Mức độ bao phủ (trung thực)

- **Đọc đủ văn bản dành cho trẻ: 1.460/1.460 mục.** Cách làm: dedupe bằng script rồi đọc hết bằng mắt toàn bộ chuỗi duy nhất — 730 tiêu đề, 120 lời mời, 194 hướng dẫn, 110 cặp gợi ý, ~600 lời giải thích (293 mẫu sau khi chuẩn hóa số). Mỗi mục chỉ ghép từ các chuỗi này nên mọi chữ trẻ nhìn thấy đều đã được đọc. **Không** đọc từng dòng bảng 1.460 hàng theo thứ tự mục.
- **`boardData`/`solution` đọc bằng mắt: 48 mục** (mỗi gameType × track một mẫu) cùng toàn bộ các cảnh/luật/bước của g08-t3, g04-t2, g06-t2. 1.412 mục còn lại chỉ kiểm bằng script (engine `checkAnswer`, brute force, đối chiếu lời giải thích với đáp án).
- Không dùng subagent. Không sửa file repo nào ngoài hai file đầu ra.

## 3. Số liệu

- Tổng cờ: **1622** (block **250**, fix **668**, nit **704**). Mục có ≥1 cờ: **983/1460**; theo mức cao nhất của mục: block **250**, fix **423**, nit **310**, không cờ **477**.

| Nhóm lỗi | Số cờ |
|---|---|
| copy | 676 |
| age | 277 |
| correctness | 259 |
| safety | 131 |
| monotony | 114 |
| hint | 106 |
| clarity | 39 |
| explanation | 20 |

| gameType | block | fix | nit |
|---|---|---|---|
| g01-t1 | 8 | 0 | 0 |
| g01-t3 | 0 | 12 | 60 |
| g02-t1 | 62 | 26 | 62 |
| g02-t2 | 60 | 9 | 60 |
| g03-t1 | 0 | 11 | 0 |
| g03-t2 | 0 | 22 | 0 |
| g03-t3 | 60 | 14 | 12 |
| g04-t1 | 0 | 72 | 0 |
| g04-t2 | 0 | 46 | 128 |
| g04-t3 | 0 | 9 | 60 |
| g05-t1 | 0 | 84 | 40 |
| g05-t2 | 0 | 2 | 70 |
| g05-t3 | 0 | 40 | 28 |
| g06-t1 | 0 | 18 | 9 |
| g06-t2 | 0 | 35 | 6 |
| g06-t3 | 0 | 10 | 66 |
| g07-t1 | 0 | 79 | 38 |
| g07-t2 | 60 | 82 | 14 |
| g08-t1 | 0 | 11 | 0 |
| g08-t2 | 0 | 62 | 0 |
| g08-t3 | 0 | 24 | 51 |

6-8 và 9-12: age_6_8: {'block': 121, 'fix': 211, 'nit': 375}; age_9_12: {'block': 129, 'fix': 457, 'nit': 329}.

## 4. Mục `block` (250 mục — 5 nguyên nhân)

- **g07-t2 "Đổi góc nhìn" — đáp án luôn là "phía trước" (60/60 mục)**. Vật luôn nằm ngay trước mặt bạn nhỏ nên trẻ không phải đổi góc nhìn; lựa chọn luôn ở vị trí thứ 3; lời giải thích còn lặp "ở ở". Trích: "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước."
- **Cách sửa:** Sinh board để vật nằm đủ 4 phía (trước/sau/trái/phải) rồi xáo lựa chọn; lời giải thích: "Từ chỗ bạn nhỏ đang hướng lên trên, đồ vật nằm ở bên tay trái."
- **60 mục:** D007-main-vi68, D007-main-vi912, D020-bonus-vi68, D020-bonus-vi912, D031-main-vi68, D031-main-vi912, D044-bonus-vi68, D044-bonus-vi912, D055-main-vi68, D055-main-vi912, D068-bonus-vi68, D068-bonus-vi912, D079-main-vi68, D079-main-vi912, D092-bonus-vi68, D092-bonus-vi912, D103-main-vi68, D103-main-vi912, D116-bonus-vi68, D116-bonus-vi912, D127-main-vi68, D127-main-vi912, D140-bonus-vi68, D140-bonus-vi912, D151-main-vi68, D151-main-vi912, D164-bonus-vi68, D164-bonus-vi912, D175-main-vi68, D175-main-vi912, D188-bonus-vi68, D188-bonus-vi912, D199-main-vi68, D199-main-vi912, D212-bonus-vi68, D212-bonus-vi912, D223-main-vi68, D223-main-vi912, D236-bonus-vi68, D236-bonus-vi912, D247-main-vi68, D247-main-vi912, D260-bonus-vi68, D260-bonus-vi912, D271-main-vi68, D271-main-vi912, D284-bonus-vi68, D284-bonus-vi912, D295-main-vi68, D295-main-vi912, D308-bonus-vi68, D308-bonus-vi912, D319-main-vi68, D319-main-vi912, D332-bonus-vi68, D332-bonus-vi912, D343-main-vi68, D343-main-vi912, D356-bonus-vi68, D356-bonus-vi912

- **g02-t1 "Ghép bóng" — đáp án luôn là lựa chọn đầu / "Hình A" (62/62)**. Giao diện hiển thị đúng thứ tự mảng (không xáo) nên trẻ chỉ cần bấm Hình A. Trích: "Hình có đúng số ô và hình dạng khớp hoàn toàn với bóng mẫu là Hình A."
- **Cách sửa:** Xáo options theo seed (hoặc khi render); lời giải thích mô tả hình thay vì nhãn cố định.
- **62 mục:** D002-main-vi68, D002-main-vi912, D015-bonus-vi68, D015-bonus-vi912, D026-main-vi68, D026-main-vi912, D039-bonus-vi68, D039-bonus-vi912, D050-main-vi68, D050-main-vi912, D063-bonus-vi68, D063-bonus-vi912, D074-main-vi68, D074-main-vi912, D087-bonus-vi68, D087-bonus-vi912, D098-main-vi68, D098-main-vi912, D111-bonus-vi68, D111-bonus-vi912, D122-main-vi68, D122-main-vi912, D135-bonus-vi68, D135-bonus-vi912, D146-main-vi68, D146-main-vi912, D159-bonus-vi68, D159-bonus-vi912, D170-main-vi68, D170-main-vi912, D183-bonus-vi68, D183-bonus-vi912, D194-main-vi68, D194-main-vi912, D207-bonus-vi68, D207-bonus-vi912, D218-main-vi68, D218-main-vi912, D231-bonus-vi68, D231-bonus-vi912, D242-main-vi68, D242-main-vi912, D255-bonus-vi68, D255-bonus-vi912, D266-main-vi68, D266-main-vi912, D279-bonus-vi68, D279-bonus-vi912, D290-main-vi68, D290-main-vi912, D303-bonus-vi68, D303-bonus-vi912, D314-main-vi68, D314-main-vi912, D327-bonus-vi68, D327-bonus-vi912, D338-main-vi68, D338-main-vi912, D351-bonus-vi68, D351-bonus-vi912, D362-main-vi68, D362-main-vi912

- **g02-t2 "Xoay hình" — đáp án luôn là lựa chọn đầu / "Hình A" (60/60)**. Trích: "Khi xoay hình mẫu đúng góc quay, ta được kết quả là Hình A."
- **Cách sửa:** Như trên.
- **60 mục:** D007-bonus-vi68, D007-bonus-vi912, D018-main-vi68, D018-main-vi912, D031-bonus-vi68, D031-bonus-vi912, D042-main-vi68, D042-main-vi912, D055-bonus-vi68, D055-bonus-vi912, D066-main-vi68, D066-main-vi912, D079-bonus-vi68, D079-bonus-vi912, D090-main-vi68, D090-main-vi912, D103-bonus-vi68, D103-bonus-vi912, D114-main-vi68, D114-main-vi912, D127-bonus-vi68, D127-bonus-vi912, D138-main-vi68, D138-main-vi912, D151-bonus-vi68, D151-bonus-vi912, D162-main-vi68, D162-main-vi912, D175-bonus-vi68, D175-bonus-vi912, D186-main-vi68, D186-main-vi912, D199-bonus-vi68, D199-bonus-vi912, D210-main-vi68, D210-main-vi912, D223-bonus-vi68, D223-bonus-vi912, D234-main-vi68, D234-main-vi912, D247-bonus-vi68, D247-bonus-vi912, D258-main-vi68, D258-main-vi912, D271-bonus-vi68, D271-bonus-vi912, D282-main-vi68, D282-main-vi912, D295-bonus-vi68, D295-bonus-vi912, D306-main-vi68, D306-main-vi912, D319-bonus-vi68, D319-bonus-vi912, D330-main-vi68, D330-main-vi912, D343-bonus-vi68, D343-bonus-vi912, D354-main-vi68, D354-main-vi912

- **g03-t3 "Nhận ra thay đổi" — đáp án luôn là lựa chọn đầu (60/60)**. Trích: "Ở cảnh sau, quả đã biến mất khỏi khung hình."
- **Cách sửa:** Xáo options.
- **60 mục:** D011-main-vi68, D011-main-vi912, D024-bonus-vi68, D024-bonus-vi912, D035-main-vi68, D035-main-vi912, D048-bonus-vi68, D048-bonus-vi912, D059-main-vi68, D059-main-vi912, D072-bonus-vi68, D072-bonus-vi912, D083-main-vi68, D083-main-vi912, D096-bonus-vi68, D096-bonus-vi912, D107-main-vi68, D107-main-vi912, D120-bonus-vi68, D120-bonus-vi912, D131-main-vi68, D131-main-vi912, D144-bonus-vi68, D144-bonus-vi912, D155-main-vi68, D155-main-vi912, D168-bonus-vi68, D168-bonus-vi912, D179-main-vi68, D179-main-vi912, D192-bonus-vi68, D192-bonus-vi912, D203-main-vi68, D203-main-vi912, D216-bonus-vi68, D216-bonus-vi912, D227-main-vi68, D227-main-vi912, D240-bonus-vi68, D240-bonus-vi912, D251-main-vi68, D251-main-vi912, D264-bonus-vi68, D264-bonus-vi912, D275-main-vi68, D275-main-vi912, D288-bonus-vi68, D288-bonus-vi912, D299-main-vi68, D299-main-vi912, D312-bonus-vi68, D312-bonus-vi912, D323-main-vi68, D323-main-vi912, D336-bonus-vi68, D336-bonus-vi912, D347-main-vi68, D347-main-vi912, D360-bonus-vi68, D360-bonus-vi912

- **g01-t1 dạng "hai nhịp đan xen" (8 mục 9-12) — lời giải thích sai**: nói "mỗi nhịp tăng thêm 2" nhưng dãy 1,2,3,3,5,4 có nhịp lẻ +2, nhịp chẵn +1. Trích: "Hai nhịp số tăng đều đan xen, mỗi nhịp tăng thêm 2. Số tiếp theo là 7."
- **Cách sửa:** Viết theo từng nhịp: "Các số ở vị trí lẻ (1, 3, 5) tăng thêm 2, các số ở vị trí chẵn (2, 3, 4) tăng thêm 1. Số tiếp theo ở vị trí lẻ nên là 7."
- **8 mục:** D049-main-vi912, D062-bonus-vi912, D145-main-vi912, D158-bonus-vi912, D241-main-vi912, D254-bonus-vi912, D337-main-vi912, D350-bonus-vi912

## 5. 20 lỗi `fix` quan trọng nhất (mỗi nhóm một ví dụ + số mục)

1. **nhiều gameType · age · 252 mục (9-12)** — Hướng dẫn 9-12 quá học thuật (30+ câu khác nhau, ví dụ "hệ quy chiếu", "giao điểm của hai tập hợp", "loại suy")
   - Ví dụ `D002-main-vi912`: "Đối chiếu tỉ mỉ hình dạng hình học để chọn bóng hoàn toàn trùng khớp."
   - Sửa: "So kỹ hình mẫu với từng chiếc bóng, rồi chọn bóng giống hệt hình mẫu nhé."
2. **g05-t1 · correctness · 62 mục** — Đáp án luôn là lựa chọn thứ 2 (62/62 mục) vì options là dãy số tăng dần quanh đáp án; trẻ đoán được vị trí
   - Ví dụ `D002-bonus-vi68`: "Cần thêm 1 để hai bên đĩa cân có cân nặng bằng nhau."
   - Sửa: "Xáo trộn options hoặc đặt đáp án ở vị trí ngẫu nhiên"
3. **g04-t1 · copy · 62 mục** — Lộ token kỹ thuật dạng snake_case ("kích_cỡ"/"vị_trí") trong lời giải thích hiển thị cho trẻ; câu "bạn còn lại" dễ hiểu nhầm là đang nói với trẻ
   - Ví dụ `D001-bonus-vi68`: "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số 1 (màu đỏ, hình tam giác, kích_cỡ to)."
   - Sửa: "Sau khi loại trừ theo các manh mối, chỉ còn Bạn số 1 hợp với mọi manh mối (màu đỏ, hình tam giác, kích cỡ to)."
4. **g07-t2 · copy · 60 mục** — Lặp từ "ở ở" trong lời giải thích
   - Ví dụ `D007-main-vi68`: "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước."
   - Sửa: "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ngay phía trước."
5. **g08-t2 · copy · 32 mục** — Lộ token kỹ thuật dạng snake_case ("kích_cỡ"/"vị_trí") trong lời giải thích hiển thị cho trẻ
   - Ví dụ `D008-main-vi68`: "Các hình có đủ cả hai đặc điểm (hình là tròn và kích_cỡ là to) là: hình 1, hình 4, hình 5."
   - Sửa: "Các hình có đủ cả hai đặc điểm (hình là tròn và kích cỡ là to) là: hình 1, hình 4, hình 5."
6. **g07-t1 · copy · 30 mục** — Lộ token kỹ thuật dạng snake_case ("kích_cỡ"/"vị_trí") trong lời giải thích hiển thị cho trẻ
   - Ví dụ `D052-bonus-vi68`: "Theo quy tắc mới (kích_cỡ là "to"), các hình phù hợp là: hình 2, hình 4."
   - Sửa: "Theo quy tắc mới (kích cỡ là "to"), các hình phù hợp là: hình 2, hình 4."
7. **g07-t1 · copy · 16 mục** — Gợi ý 2 máy móc và lộ token snake_case ("có đúng kích cỡ là ..."), không giống lời nói với trẻ
   - Ví dụ `D052-bonus-vi68`: "Quan sát từng hình và chỉ chọn những hình có đúng kích_cỡ là "to"."
   - Sửa: "Hãy nhìn từng hình và chỉ chọn những hình có kích cỡ to."
8. **g05-t3 · hint · 16 mục** — Gợi ý 2 khó hiểu ("cộng các số lại rồi xem món nào là thừa") và không giúp tìm tổ hợp ít món
   - Ví dụ `D010-bonus-vi68`: "Cộng các số lại rồi xem món nào là thừa, bỏ đi thì có còn đúng mục tiêu 8 không nhé."
   - Sửa: "Thử lấy món có số lớn nhất trước, rồi xem cần thêm món nào để đủ 8."
9. **g04-t2 · correctness · 15 mục** — Luật "nếu mặt trời thì buổi sáng" không đúng ngoài đời (mặt trời có cả buổi chiều); trẻ biết sự thật sẽ bị rối
   - Ví dụ `D028-main-vi912`: "Từ những điều đã biết chắc chắn và áp dụng luật Nếu - Thì, ta tìm ra kết luận là đánh răng."
   - Sửa: "Đổi chuỗi luật thành: nếu trời hửng sáng thì thức dậy; nếu thức dậy thì đánh răng; ..."
10. **g07-t1 · copy · 14 mục** — Gợi ý 2 máy móc và lộ token snake_case ("có đúng vị trí là ..."), không giống lời nói với trẻ
   - Ví dụ `D076-bonus-vi68`: "Quan sát từng hình và chỉ chọn những hình có đúng vị_trí là "trên"."
   - Sửa: "Hãy nhìn từng hình và chỉ chọn những hình nằm ở vị trí trên."
11. **g02-t1 · safety · 13 mục** — giọng "đòi hỏi bạn phải" gây áp lực
   - Ví dụ `D002-main-vi68`: "Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé."
   - Sửa: "Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha!"
12. **g08-t3 · explanation · 12 mục** — Cảnh đáp án là "Bạn chạy băng qua bên ngoài vạch kẻ an toàn" nhưng lời giải thích nói "đi sai hướng", lệch với luật "đi đúng vạch"
   - Ví dụ `D085-bonus-vi68`: "Tình huống 2 chưa hợp lý vì có đặc điểm "đi sai hướng", trong khi quy tắc chuẩn yêu cầu "đi đúng vạch"."
   - Sửa: "Tình huống 2 chưa đúng vì bạn nhỏ chạy ra ngoài vạch kẻ an toàn, còn luật là đi đúng vạch."
13. **g05-t3 · safety · 12 mục** — giọng kiểm tra/chấm năng lực ("sẽ kiểm tra khả năng ... của bạn")
   - Ví dụ `D021-main-vi68`: "Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy!"
   - Sửa: "Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem!"
14. **g01-t3 · safety · 12 mục** — giọng kiểm tra năng lực
   - Ví dụ `D046-bonus-vi912`: "Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy!"
   - Sửa: "Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé!"
15. **g06-t1 · clarity · 11 mục** — Hướng dẫn nói phải ghé qua điểm mốc nhưng bảng không có điểm mốc nào (waypoints rỗng); trẻ sẽ đi tìm thứ không tồn tại
   - Ví dụ `D003-bonus-vi68`: "Đi từ ô bắt đầu đến ô đích, tránh các bức tường và ghé qua điểm cần đến nhé."
   - Sửa: "Đi từ ô bắt đầu đến ô đích, tránh các bức tường nhé."
16. **g06-t2 · clarity · 11 mục** — Chuỗi bắt buộc "Xới cơm" trước "Múc canh", nhưng ngoài đời múc canh trước vẫn đúng; trẻ xếp hợp lý có thể bị chấm sai
   - Ví dụ `D006-main-vi68`: "Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà."
   - Sửa: "Bỏ ràng buộc giữa "Xới cơm" và "Múc canh" (chấp nhận cả hai thứ tự) hoặc bỏ bước "Múc canh"; lời giải thích: "Thứ tự đúng: Lấy bát → Xới cơm → Mời cả nhà → Ăn cơm.""
17. **g03-t1 · safety · 11 mục** — so sánh trẻ với nhau và áp lực tốc độ ("ai nhớ nhanh và chính xác hơn") trái giọng không phạt, không thi đua
   - Ví dụ `D016-bonus-vi68`: "Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào!"
   - Sửa: "Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ thôi!"
18. **g06-t2 · clarity · 10 mục** — Bước "Rửa tay" đứng trước "Xoa xà phòng" rồi "Rửa sạch" gây rối (rửa tay hai lần?)
   - Ví dụ `D067-bonus-vi68`: "Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch."
   - Sửa: "Thứ tự đúng của các bước là: Mở vòi → Làm ướt tay → Xoa xà phòng → Rửa sạch."
19. **g08-t1 · safety · 9 mục** — giọng kiểm tra năng lực
   - Ví dụ `D053-bonus-vi912`: "Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy!"
   - Sửa: "Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé!"
20. **g06-t1 · clarity · 4 mục** — Bảng có điểm mốc bắt buộc nhưng hướng dẫn không nhắc; trẻ có thể đi thẳng tới đích rồi bị chấm sai
   - Ví dụ `D123-bonus-vi912`: "Định vị không gian trên lưới để vạch ra đường đi hợp lệ và an toàn."
   - Sửa: "Nhìn bản đồ ô vuông rồi vẽ đường đi từ chỗ bắt đầu đến đích, nhớ ghé qua điểm mốc và tránh các bức tường nhé."

## 6. Vấn đề hệ thống khác (không gắn từng mục)

- [fix/age] Gợi ý 1 và 2 giống hệt nhau giữa 6-8 và 9-12 ở mọi gameType (110 cặp gợi ý duy nhất cho 1460 mục; gợi ý không đổi theo ngày). 9-12 không được gợi ý khó hơn, 6-8 nhận gợi ý có từ như "phần tử", "cấu trúc", "quy luật tăng hoặc bước lặp"  
  Ví dụ: g01-t2 gợi ý 2: "So sánh xem phần tử nào ở đây không cùng quy luật tăng hoặc bước lặp với các phần còn lại."  
  Sửa: Viết bản gợi ý riêng cho 6-8: "Bạn thử nhìn xem hình nào đứng lạc chỗ so với nhịp của cả dãy nhé."
- [fix/age] Lời mời (invitation) dùng chung cho cả hai track: 136/730 cặp cùng ngày-cùng slot có lời mời giống hệt, và chỉ có 120 câu mời khác nhau cho cả 1460 mục (khoảng 5 câu mỗi gameType, lặp lại sau mỗi ~11 ngày). Nhiều câu mời giảng bài ("sẽ giúp bạn rèn…") thay vì mời chơi  
  Ví dụ: "Thử thách tìm phần sai hôm nay sẽ giúp bạn rèn luyện đôi mắt tinh anh đấy!"  
  Sửa: Mở rộng thành ≥10 câu mời mỗi gameType, khác nhau giữa 6-8 và 9-12, giọng mời chơi: "Hôm nay mình cùng tìm phần đứng nhầm chỗ nhé!"
- [fix/monotony] Thiếu đa dạng nội dung bên trong gameType: g08-t3 chỉ có 4 cảnh "sai" (ví dụ "Bạn mang bánh ngọt và nước có ga vào chơi" xuất hiện 16 lần) và 26 cảnh tổng; g06-t2 chỉ 6 kịch bản/track (12 tổng) cho 62 mục; g04-t2 chỉ 13 bộ luật cho 62 mục; g04-t3 luôn hỏi đúng thuộc tính "hình"; g03-t1 dạng "điền ô thiếu" luôn thiếu ô thứ 3  
  Ví dụ: g08-t3: "Bạn mang bánh ngọt và nước có ga vào chơi"; g06-t2: "Thứ tự đúng của các bước là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch."  
  Sửa: Tăng thư viện cảnh/kịch bản lên ≥30 mỗi gameType, xáo vị trí ô thiếu, đổi thuộc tính hỏi; thêm cảnh "sai" đa dạng hơn trà sữa/bánh ngọt (nên tránh luôn đồ ngọt, nước có ga làm ví dụ sai).
- [nit/copy] Tiêu đề "Chủ đề · Tên trò" (ví dụ "Bưu điện · Cân bằng hai bên", "Dấu tích cổ · Tìm phần sai") có chủ đề không liên quan nội dung thực của đề (đề chỉ gồm hoa/lá/mây/số); 6-8 và 9-12 cùng tiêu đề; một số tên trò khó với 6-8 ("Xếp lệnh", "Chi tiết bất hợp lý", "Đủ mục tiêu")  
  Ví dụ: "Bưu điện · Cân bằng hai bên"  
  Sửa: Bỏ phần chủ đề hoặc chọn chủ đề khớp bài; đổi "Xếp lệnh" → "Xếp các bước", "Chi tiết bất hợp lý" → "Chuyện nào chưa đúng?", "Đủ mục tiêu" → "Gom cho đủ".
- [nit/explanation] Lời giải thích đúng nhưng khô và hiếm khi nêu "vì sao" (ví dụ g01-t2 chỉ nói vị trí sai, không nói quy luật), không có câu động viên; giọng lẫn "ta"/"bạn"/"mình"  
  Ví dụ: "Vị trí thứ 4 (lá) chưa đúng với quy luật của chuỗi."  
  Sửa: "Chuỗi này lặp lại sao – cá, nên ở vị trí thứ 4 phải là sao. Mình đã tìm ra chỗ lệch rồi nhé!"
- [nit/age] Khoảng cách độ khó 6-8 → 9-12 chủ yếu chỉ hơn 1 phần tử (chuỗi dài hơn 1, thêm 1 lựa chọn); g01-t3 và g03-t2 có cùng độ lớn bảng ở cả hai track; ngoài ra khác biệt chủ yếu là văn phong hướng dẫn (và văn phong 9-12 quá học thuật)  
  Ví dụ: g03-t2 board 6-8 và 9-12 cùng 4x4 ô  
  Sửa: Tăng bước tăng/giảm, số phép biến đổi, kích thước lưới cho 9-12; giữ lời hướng dẫn thân thiện.
- [nit/age] Còn khoảng 40 câu hướng dẫn 9-12 dùng từ trừu tượng ở mức nhẹ hơn (phần tử, đối chiếu, chính xác, trạng thái, thuộc tính…) và hầu hết thiếu giọng "mình – bạn"; chỉ các câu nặng nhất mới bị gắn cờ riêng  
  Ví dụ: "Phân tích bước nhảy giữa các phần tử để tìm quy luật của dãy số hoặc hình."  
  Sửa: Viết lại toàn bộ tutorial 9-12 theo mẫu "Xem mỗi phần thay đổi thế nào so với phần trước để tìm quy luật nhé."

## 7. Vòng 1 — còn tồn tại gì?

- **ID kỹ thuật / JSON thô / ahead-left-right-behind trong câu chữ cho trẻ** → *resolved*: Quét toàn bộ title/invitation/tutorial/hints/explanation: 0 lần xuất hiện candidate-N, item-N, shape-/turn-/fix-/fact-/scene-/step-, ahead/behind/left/right, ngoặc JSON, "undefined/null".
- **Câu giữ chỗ g08-t3 ("Bạn N đang chơi việc N")** → *resolved*: Cảnh dùng câu tiếng Việt thật; xem monotony: chỉ 26 cảnh tổng.
- **Bạo lực "đánh" (D196)** → *resolved*: Chỉ còn "đánh dấu", "đánh răng"; còn 79 lần "đâm vào" (nit).
- **Gợi ý làm lộ đáp án** → *resolved*: Không gợi ý nào chứa chính đáp án (kiểm tra script); gợi ý 2 của g05-t1 nói gần như công thức tính (chấp nhận được ở gợi ý 2).
- **g06-t1 "một đường đi hợp lệ" vs đường ngắn nhất** → *resolved-for-shortest, new-mismatch*: Biến thể "chọn đường ít bước" nay có tutorial/giải thích nói rõ "ngắn nhất/ít bước nhất" và engine chấp nhận đúng mọi đường ngắn nhất (brute force 0 sai lệch). Nhưng còn 12 mục tutorial/lời mời nhắc điểm mốc không tồn tại và 4 mục có điểm mốc mà tutorial không nhắc (xem flags category clarity).
- **Ràng buộc ngầm g05-t3 / g03-t2 / g05-t1 / g03-t1** → *resolved*: Engine brute force g05-t3 khớp luật nêu trong tutorial; mọi lời giải đều được checker chấp nhận (1460/1460).
- **Board lặp lại (g06-t3 và gameType khác)** → *partly-remaining*: 28 nhóm board trùng hoàn toàn (82 mục) còn lại ở g05-t2 và g07-t2.
- **Token kỹ thuật mới (không có trong round 1)** → *NEW*: "kích_cỡ", "vị_trí" (snake_case) lộ trong lời giải thích/gợi ý của g04-t1 (62), g07-t1 (30), g08-t2 (32).
- **Lỗi mới: đáp án luôn ở cùng vị trí / g07-t2 luôn "phía trước" / giải thích dãy đan xen sai** → *NEW*: Xem flags severity block.

## 8. 10 ví dụ xuất sắc (nên lấy làm mẫu giọng văn)

- `D009-bonus-vi912` (invitation): "Để biết chắc bạn nhỏ này là ai, chúng mình cần thêm manh mối nào nhỉ?" — Lời mời dạng câu hỏi, đúng giọng "mình – bạn", không áp lực.
- `D005-main-vi68` (invitation): "Có rất nhiều món quà cần chia thành từng nhóm đều nhau, bạn giúp mình nhé!" — Có bối cảnh, từ đơn giản, giọng nhờ vả thân thiện hợp 6-8.
- `D011-bonus-vi68` (invitation): "Hãy xem robot đi tới đâu bị vướng và đổi lại một bước để tới đích an toàn nha!" — Kể một tình huống cụ thể (robot bị vướng) rồi mới nêu việc cần làm, tích cực và dễ hình dung.
- `D011-bonus-vi68` (tutorial): "Robot đi lệch ở bước nào nhỉ? Bạn đổi hướng bước đó để giúp bạn ấy nhé." — Nói rõ việc cần làm trong 2 câu ngắn, nhân hóa nhẹ nhàng.
- `D023-bonus-vi68` (tutorial): "Nhìn hai bên trục gương xem ô nào cần điền để hai bên giống hệt nhau." — Ngắn, hình ảnh gương quen thuộc, trẻ hiểu ngay việc cần làm.
- `D017-bonus-vi68` (tutorial): "Nếu có điều này thì sẽ có điều kia; bạn nối tiếp để tìm kết quả nha." — Giải thích luật Nếu - Thì bằng lời đời thường.
- `D060-bonus-vi68` (tutorial): "Bạn tìm một con đường mới hợp lệ mà không đi trùng với đường cũ nhé." — Nêu đủ luật (đường mới, không trùng đường cũ) mà vẫn ngắn.
- `D025-main-vi68` (hint): "Nhìn xem mỗi số tăng thêm bao nhiêu." — Gợi ý 1 gợi mở đúng cách, không lộ đáp án; gợi ý 2 "Thử tính khoảng cách giữa hai số liền nhau." thu hẹp tự nhiên.
- `D051-main-vi68` (hint): "Chia chuỗi thành các nhóm 2 từ." — Mẹo ghi nhớ thật sự (chunking) lại không lộ thứ tự; gợi ý 2 "Nhớ từng nhóm theo thứ tự rồi ghép lại." nối tiếp mượt.
- `D006-main-vi68` (hint): "Bạn hãy tìm việc nào cần làm đầu tiên trong các hành động thường ngày nhé." — Gợi ý 1 dẫn trẻ đến điểm xuất phát của chuỗi mà không nêu thứ tự.

## 9. Người duyệt nên kiểm tra tay

- Mở g07-t2, g02-t1, g02-t2, g03-t3 trong giao diện thật và xác nhận đúng là đáp án luôn ở lựa chọn đầu/3 (script đọc từ `boardData`, chưa chạy UI).
- Mở 3 mục g06-t1 có điểm mốc (ví dụ D123-bonus-vi912, D134-main-vi68) và 3 mục không có điểm mốc (D003-bonus-vi68, D099-bonus-vi68) để xem câu hướng dẫn có khớp bản đồ.
- Đọc to 10 hướng dẫn 9-12 bất kỳ cho một bạn 9-10 tuổi nghe; xem bạn có hiểu không (nghi ngờ "hệ quy chiếu", "giao điểm", "loại suy").
- g04-t2: xem luật "mặt trời → buổi sáng" và cách hiển thị "Nếu có … thì …" trong giao diện (câu có tự nhiên không).
- g08-t3: xem 4 cảnh "sai" lặp lại — chủ sở hữu quyết định có chấp nhận ví dụ đồ ngọt/nước có ga, "chạy ngược chiều" làm cảnh sai hay không.
- g06-t2: nên chơi thử chuỗi "Lấy bát → Xới cơm → Múc canh → Mời cả nhà" để xem có đáng bị coi sai khi múc canh trước không.
- Chơi thử 1 tuần liên tiếp (7 ngày × 2 slot) ở một track để cảm nhận độ lặp của lời mời và gợi ý; script không đo được "cảm giác chán".
- Kiểm tra vài mục g05-t1 xem hiển thị "đĩa Trái" và có nhìn thấy quả cân đánh dấu đúng như hướng dẫn.
