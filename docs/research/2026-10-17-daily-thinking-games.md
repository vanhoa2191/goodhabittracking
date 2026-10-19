# Trò chơi tư duy: nghiên cứu GitHub và hành trình 365 ngày

Ngày nghiên cứu: 2026-10-17. Trạng thái: đề xuất sản phẩm, chưa triển khai trò chơi.

## Quyết định đề xuất

- Xưng hô trong toàn bộ nội dung trò chơi: **mình – bạn**, kể cả hướng dẫn, lời gợi ý, kết quả, thông báo và âm thanh đọc.
- Mỗi ngày có một lượt chính 60–120 giây; hoàn thành nhiệm vụ sớm mở thêm một lượt khác 60–120 giây. Tối đa hai lượt/ngày.
- Thiết kế 365 ngày trải nghiệm, mỗi ngày có hai vị trí nội dung: **365 lượt chính + 365 lượt thưởng = 730 bản mô tả lượt chơi**.
- Dùng 24 dạng trò trong tám nhóm tư duy, 52 bối cảnh tuần, 12 chương. Tái sử dụng cơ chế nhưng thay đổi quy tắc, dữ kiện và cách giải; thay hình/màu đơn thuần không được tính là đề mới.
- Bảng CSV đi kèm là lịch biên tập đủ 365 ngày, chưa phải 730 câu đố có bàn chơi, đáp án và kiểm định hoàn chỉnh.

## Repo đã xác minh

Đã đọc README, giấy phép và một phần mã nguồn; chưa cài, build hay chơi thử các repo. Trạng thái push chỉ là bằng chứng có thay đổi repository, không phải cam kết bảo trì hoặc chất lượng.

| Repo | Bằng chứng và điểm hữu ích | Giới hạn và hướng sử dụng |
| --- | --- | --- |
| [mazipan/coding-kids](https://github.com/mazipan/coding-kids) | React 19, TypeScript, Vite; MIT. Có dữ liệu bài cơ bản/nâng cao, 15 nhóm thinking; `src/types/index.ts` và `PuzzlePlayer.tsx` định nghĩa 12 kiểu câu đố. Có script audit nội dung và tests. API GitHub ghi nhận push 2026-09-19, chưa archived. | Gần stack app nhất. Thẩm định từng dữ liệu/renderer trước khi chọn lọc. Không có sẵn lịch 365 ngày, thưởng theo nhiệm vụ, tiếng Việt hoặc đồng bộ lượt theo trẻ. Không kéo cả Blockly, router, store và hệ thống XP vào app. |
| [Gugatb/puzzles](https://github.com/Gugatb/puzzles) | Bản PWA của bộ Simon Tatham; MIT cho phần web và upstream. TypeScript/Lit, C biên dịch WebAssembly. README có quy trình build generator. API ghi nhận push 2026-01-28, chưa archived. | Phù hợp nghiên cứu bộ sinh/giải đề logic; chọn bàn nhỏ và kiểm tra thời lượng với trẻ. Có các phụ thuộc theo dõi lỗi Sentry trong package; không nhập nguyên cấu hình hoặc cả PWA. |
| [llaske/sugarizer](https://github.com/llaske/sugarizer) | Nền tảng hoạt động giáo dục trên web. Root LICENSE/NOTICE Apache-2.0. Có `Tangram.activity`, `MazeWeb.activity`, `MindMath.activity`. API ghi nhận push 2026-07-30, chưa archived. | Tham khảo hoạt động trực quan. Kiểm tra giấy phép từng activity, thư viện và asset trước khi lấy; không suy root license áp cho mọi thành phần. Không phải React component có thể gắn ngay. |
| [KDE/gcompris](https://github.com/KDE/gcompris) | Bộ hoạt động giáo dục cho trẻ 2–10, QtQuick/QML. README giải thích bộ tổng thể AGPL v3; mã nội bộ GPL v3+, có thư viện AGPL. GitHub trỏ upstream sang KDE Invent. | Nguồn tham khảo cách chia tuổi và luật chơi; ưu tiên tự xây cơ chế phù hợp web. Không chọn làm nền React hoặc nhập code/assets hàng loạt. |
| [guilyx/awesome-daily-minigames](https://github.com/guilyx/awesome-daily-minigames) | Danh mục các trò theo ngày; giấy phép danh mục CC0-1.0. API ghi nhận push 2026-10-14. | Chỉ dùng tìm ý tưởng. Đây không phải bộ mã nguồn của các trò được liên kết; giấy phép danh mục không cấp quyền sao chép từng trò. |

Giấy phép nguồn: [CodeKids MIT](https://github.com/mazipan/coding-kids/blob/main/LICENSE), [Puzzles MIT](https://github.com/Gugatb/puzzles/blob/main/LICENSE), [Sugarizer LICENSE](https://github.com/llaske/sugarizer/blob/master/LICENSE), [Sugarizer NOTICE](https://github.com/llaske/sugarizer/blob/master/NOTICE), [GCompris README](https://github.com/KDE/gcompris#licence).

Kết luận trong phạm vi các nguồn đã kiểm tra: có nhiều thành phần gần nhu cầu; chưa tìm thấy bộ hoàn chỉnh khớp đồng thời trẻ em, 1–2 phút, 365 ngày, tiếng Việt và thưởng theo nhiệm vụ. Khuyến nghị thẩm định CodeKids trước, nghiên cứu Simon Tatham cho generator ở bước sau. Chưa quyết định nhập code hay thêm dependency.

## Danh mục 24 dạng trò

| Nhóm | Ba dạng trò |
| --- | --- |
| Quy luật | Điền phần tiếp theo; tìm phần sai; suy ra máy biến đổi |
| Không gian | Ghép bóng; xoay hình; hoàn thành đối xứng |
| Trí nhớ | Nhớ thứ tự; nhớ vị trí; nhận ra thay đổi |
| Suy luận | Loại trừ theo manh mối; nếu–thì; tìm thông tin còn thiếu |
| Số lượng | Cân bằng hai bên; chia nhóm; chọn tổ hợp đủ mục tiêu |
| Lập kế hoạch | Tìm đường; xếp lệnh; sửa một bước sai |
| Linh hoạt | Đổi luật phân loại; đổi góc nhìn; tìm cách giải khác |
| Quan sát | Tìm điểm khác biệt; tìm vật theo hai đặc điểm; tìm chi tiết bất hợp lý |

Mỗi dạng có bốn hướng thay đổi luật trong CSV. Các hướng này tiếp tục cần bộ dữ kiện riêng, đáp án kiểm chứng và phương án gợi ý. Không coi phép nhân số template là bằng chứng đã có nội dung hoàn thiện.

## Cấu trúc 365 ngày

| Chương | Ngày | Hành trình |
| --- | --- | --- |
| 1 | 1–28 | Khu vườn khám phá |
| 2 | 29–56 | Ngôi nhà sáng tạo |
| 3 | 57–91 | Khu rừng bí mật |
| 4 | 92–119 | Thành phố tí hon |
| 5 | 120–147 | Đại dương xanh |
| 6 | 148–182 | Xưởng robot |
| 7 | 183–210 | Nông trại bốn mùa |
| 8 | 211–238 | Bảo tàng kỳ thú |
| 9 | 239–273 | Trạm không gian |
| 10 | 274–301 | Đảo phát minh |
| 11 | 302–329 | Chuyến tàu khám phá |
| 12 | 330–364 | Lễ hội ý tưởng |
| Kết hành trình | 365 | Cuộc hẹn của những người khám phá |

Một tuần có bối cảnh chung, nhưng đổi nhóm tư duy theo ngày. Không gắn cứng thứ Hai luôn là toán hoặc cuối tuần luôn khó. Mỗi tám ngày, lịch hai lượt bao phủ cả tám nhóm; lượt thưởng khác nhóm lượt chính. Nhóm trở lại có cơ chế khác và dữ kiện mới. Giữ khoảng cách ít nhất bảy ngày giữa hai lần xuất hiện cùng dạng trò, tính cả lượt chính lẫn thưởng.

Kết quả kiểm tra CSV đã lưu: 365 dòng ngày liên tục, 730 ID slot không trùng, 24 dạng trò; mỗi dạng xuất hiện 30–31 lần tính cả hai slot; khoảng cách thực tế nhỏ nhất giữa hai lần cùng dạng là 11 ngày. Các cửa sổ tám ngày liên tiếp đều bao phủ tám nhóm kỹ năng. Đây là kiểm tra cấu trúc lịch, không phải kiểm tra chất lượng đề hoặc lợi ích học tập.

Nhịp độ: lần đầu gặp một cơ chế có ví dụ mẫu; những lần sau đổi quan hệ hoặc ràng buộc. Mỗi tuần có ngày nhẹ và ngày phối hợp; bài phối hợp vẫn chỉ có một mục tiêu rõ và phải chơi thử để vừa 1–2 phút. Không tăng khó chỉ vì ngày thứ 300 lớn hơn ngày thứ 30.

Ngày hành trình là ngày trải nghiệm của từng trẻ: lần đầu bắt đầu lượt chính trong một ngày địa phương hợp lệ sẽ dùng ngày tiếp theo; nghỉ không mất trang, không bắt đầu lại. Tải lại trang không tăng ngày. Một lượt đang dở thuộc ngày đã mở và có thể tiếp tục; không tự cấp lượt chính mới chỉ vì đổi ngày khi đang chơi. Backend phải quy định xử lý lượt dở trước khi chuyển sang lượt hôm nay để không vượt giới hạn. Nếu cần chu kỳ theo lịch năm thay vì hành trình cá nhân, đó là quyết định sản phẩm khác; bản này chọn hành trình cá nhân để không phạt vắng mặt.

## Luồng từng lượt

1. Thẻ ngày hôm nay: tên trò, hình minh họa, thời lượng dự kiến; không tự mở toàn màn hình.
2. Lời mời: “Mình có một câu đố mới. Bạn cùng khám phá nhé?”
3. Hướng dẫn: một câu, ví dụ bằng hình; có đọc hướng dẫn khi nội dung âm thanh được duyệt.
4. Chơi: một câu đố hoặc vài vòng nhỏ; có gợi ý, tạm dừng và rời đi. Không dùng đồng hồ đếm ngược làm điều kiện thắng. 60–120 giây là mục tiêu thiết kế, không cắt ngang khi hết thời gian.
5. Kết thúc: một nhận xét khớp hành vi quan sát được và giải thích đáp án bằng hình.
6. Quay về nhiệm vụ. Nếu đã đủ điều kiện thưởng, có nút lượt hai; không tự chạy tiếp.

Lượt hai là nội dung độc lập, độ khó tương đương hoặc nhẹ hơn, không đòi đã thắng lượt một. Không dùng thưởng để mở khóa kiến thức thiết yếu của các ngày sau. Lượt thưởng bỏ qua không ảnh hưởng tiến độ.

## Điều kiện thưởng

- Ít nhất một nhiệm vụ bắt buộc đến hạn trong ngày; tất cả nhiệm vụ bắt buộc đã hoàn thành hợp lệ trước mốc phụ huynh đặt theo múi giờ gia đình.
- Nếu cần duyệt: thời điểm máy chủ nhận báo hoàn thành dùng để xét sớm, trạng thái duyệt dùng để mở thưởng; không phạt vì ba mẹ duyệt muộn.
- Mốc thưởng phải tương thích nhiệm vụ buổi tối; việc sát giờ ngủ không được khuyến khích đánh dấu trước. Có giờ ngừng chơi do gia đình đặt.
- Hoãn không bằng hoàn thành. Ngày nghỉ, sửa lịch, việc thêm sau mốc, thu hồi duyệt và mất mạng phải có chính sách rõ trước khi code; không âm thầm thay đổi điều kiện đã hứa trong ngày.
- Máy chủ lưu quyền chơi và lượt theo trẻ/ngày/slot, ngăn refresh, đa tab và đa thiết bị cấp trùng. Lượt đã chơi không bị xóa khỏi lịch sử khi trạng thái nhiệm vụ đổi; lưu riêng nguồn quyền thưởng để xử lý việc thu hồi.

## Độ tuổi và khả năng tiếp cận

- Thử nghiệm trước với 6–8 và 9–12 tuổi. 3–5 cần phiên bản ít bước, có người lớn hỗ trợ; 13+ cần lời dẫn, hình ảnh và logic riêng. Không gắn cùng một đề cho tất cả.
- Cùng ngày và cùng kỹ năng có các phiên bản theo mức: ít phần tử/một ràng buộc; nhiều phần tử/hai ràng buộc; phối hợp hoặc suy ngược. Mọi mức đều giữ thời lượng mục tiêu.
- Độ khó được chọn theo khả năng từng kỹ năng và hỗ trợ của phụ huynh; không hiển thị xếp hạng trí tuệ. Dùng gợi ý không bị phạt.
- Nút lớn, không chỉ phân biệt bằng màu, có cách chạm chọn thay kéo thả, giảm chuyển động, tắt âm thanh; không phụ thuộc emoji có hướng hiển thị khác nhau giữa thiết bị.

730 vị trí là cho một tuyến nội dung. Nếu mọi vị trí đều có bốn phiên bản tuổi thì phạm vi kiểm duyệt có thể lên tới 2.920 phiên bản; việc dùng chung generator chỉ giảm công sức, không thay kiểm tra.

## Nguyên tắc nội dung và xưng hô

- Mời chơi: “Mình có một thử thách mới. Bạn muốn thử không?”
- Gợi ý: “Bạn thử nhìn hai hình đầu nhé.”
- Chưa đúng: “Cách này chưa khớp. Mình cùng xem lại quy luật nhé.”
- Khi có hành vi thử lại: “Bạn đã thử một cách khác để giải câu đố.”
- Mở thưởng: “Bạn đã hoàn thành các nhiệm vụ đúng lịch. Hôm nay có thêm một trò!”
- Kết buổi: “Mình dừng ở đây nhé. Bạn nghỉ mắt một chút nào.”

Không dùng xưng hô người lớn–trẻ trong trò chơi; không dùng lời thoại gây tội lỗi khi vắng mặt, không mất chuỗi bộ sưu tập, không mua lượt, không tính điểm tốc độ. Lời khen hành vi chỉ xuất hiện khi có bằng chứng tương ứng.

## Biên soạn và kiểm định trước khi phát hành

Mỗi slot cần: ID/version, nhóm kỹ năng, dạng trò, quy tắc, dữ kiện/bàn chơi, độ tuổi/mức, đáp án hoặc tập đáp án hợp lệ, lời giải, hai gợi ý, lời thoại, nguồn và giấy phép nếu tái sử dụng. Đề sinh bằng seed vẫn phải được kiểm tra khả giải; seed khác không bảo đảm đề khác hoặc phù hợp tuổi.

Quy trình: template → sinh/biên soạn trước → bộ giải/chấm xác nhận → người đọc kiểm tra nghĩa và độ tuổi → chơi thử trên điện thoại → khóa bản phát hành. Chỉ yêu cầu đáp án duy nhất ở trò thiết kế một đáp án; trò tìm nhiều cách phải chấp nhận mọi lời giải hợp lệ. Dùng dấu vân tay cấu trúc để phát hiện đề trùng dù đổi màu, xoay hoặc đổi tên.

Cửa kiểm tra: đủ 365 ngày và 730 ID slot; nhóm thưởng khác nhóm chính; khoảng cách dạng trò; không có đề bất khả giải; gợi ý không mâu thuẫn; lời thoại mình–bạn; không rò đáp án từ nhãn; phiên bị gián đoạn; qua ngày/múi giờ; duyệt trễ; nhiều thiết bị. Chơi thử mới xác minh được mục tiêu 1–2 phút và mức hứng thú.

## Cách triển khai đề xuất

1. Thẩm định kỹ phần thinking của CodeKids: một renderer, dữ liệu mẫu và script audit; xác minh đúng/sai, giấy phép từng phần và mức phụ thuộc. Không nhập cả ứng dụng.
2. Prototype ba dạng đại diện và một tuần nội dung, dùng cùng trạng thái lượt chính/thưởng của thiết kế cuối.
3. Hoàn thiện 24 cơ chế theo giai đoạn, biên soạn trước từng đợt nội dung; lịch 365 ngày giữ vai trò bản đồ sản phẩm đầy đủ.
4. Chỉ công bố có trọn 365 ngày khi các slot và mức tuổi đã qua kiểm định. Theo dõi hiểu luật, thời lượng, nhu cầu gợi ý, quay lại và chất lượng hoàn thành nhiệm vụ; không tối ưu thời gian màn hình.

Tài liệu thêm: [Harvard — hoạt động thực hành chức năng điều hành](https://developingchild.harvard.edu/resources/handouts-tools/brainbuildingthroughplay/), [APA — lời khen cụ thể theo cách làm](https://www.apa.org/education-career/k12/using-praise). Đây là định hướng thiết kế; chưa phải bằng chứng trò chơi của app cải thiện năng lực nhận thức rộng.
