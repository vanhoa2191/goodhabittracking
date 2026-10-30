import type { BoardData, GameAgeTrack, GameTypeId, PathStep } from '../types';

export const VIETNAMESE_COORDINATE = (point: PathStep): string => {
  return `hàng ${point.y + 1}, cột ${point.x + 1}`;
};

export const DIRECTION_VI: Record<string, string> = {
  ahead: 'ở ngay phía trước',
  behind: 'ở ngay phía sau',
  left: 'ở bên tay trái',
  right: 'ở phía bên phải',
  up: 'đi lên trên',
  down: 'đi xuống dưới',
};

export const DIRECTION_SHORT_VI: Record<string, string> = {
  ahead: 'phía trước',
  behind: 'phía sau',
  left: 'bên trái',
  right: 'sang phải',
  up: 'lên',
  down: 'xuống',
};

const AGE_3_5_INVITATIONS: Partial<Record<GameTypeId, readonly string[]>> = {
  'g01-t1': ['Cùng nhìn xem tiếp theo là hình nào nhé!', 'Nhìn dãy hình, rồi cùng đoán hình kế tiếp nhé!', 'Người lớn đọc dãy cho bạn nghe, rồi bạn chọn hình tiếp theo nhé!', 'Dãy này đang đi theo một điệu, mình cùng đoán tiếp nhé!', 'Hình nào sẽ đứng ở cuối dãy? Mình cùng chọn nhé!', 'Nhìn hai bước đầu, rồi đoán bước tiếp theo nhé!'],
  'g01-t2': ['Cùng tìm hình lạc đàn trong dãy nhé!', 'Có một hình không giống các bạn, mình cùng tìm nhé!', 'Nhìn kỹ dãy hình, rồi chỉ hình bị lạc nhé!', 'Có một hình đứng sai chỗ, mình cùng bắt nó nhé!', 'Hình nào không đi theo dãy? Mình cùng tìm nhé!', 'Nghe người lớn đọc dãy, rồi chỉ hình lạ nhé!'],
  'g01-t3': ['Cho số vào chiếc máy kỳ diệu, xem số nào ra nhé!', 'Cùng đoán xem chiếc máy làm gì với các số nhé!', 'Nghe người lớn đọc, rồi tìm số máy sẽ nhả ra nhé!', 'Chiếc máy đang biến số này thành số khác, mình cùng đoán nhé!', 'Số vào rồi số ra, máy làm gì vậy nhỉ? Mình cùng xem nhé!', 'Nhìn hai ví dụ của máy, rồi thử số mới nhé!'],
  'g02-t1': ['Cùng tìm hình giống hình mẫu nhé!', 'Nhìn hình mẫu, rồi chọn hình giống hệt nhé!', 'Hình nào giống hình mẫu nhất? Mình cùng tìm nhé!', 'Tìm cho mình hình trùng khớp với hình mẫu nhé!', 'Hai hình giống nhau hoàn toàn, mình cùng ghép nhé!', 'Nhìn từng ô trong hình mẫu, rồi chọn hình đúng nhé!'],
  'g02-t2': ['Cùng xoay hình và xem nó trông thế nào nhé!', 'Hình xoay xong sẽ ra sao? Mình cùng đoán nhé!', 'Nghe người lớn đọc cách xoay, rồi chọn hình đúng nhé!', 'Quay hình một vòng và xem nó thành gì nhé!', 'Hình quay xong sẽ nằm thế nào? Mình cùng đoán nhé!', 'Người lớn đọc cách quay, bạn tìm hình đúng nhé!'],
  'g02-t3': ['Cùng làm cho hai bên giống nhau như trong gương nhé!', 'Tìm ô còn thiếu để hình đối xứng nhé!', 'Hình này có hai nửa giống nhau, mình cùng hoàn thành nhé!', 'Mình gấp đôi hình lại, hai bên khớp nhau chứ? Cùng kiểm tra nhé!', 'Tìm ô giúp hai nửa giống hệt nhau nhé!', 'Hình như soi gương, mình cùng hoàn thành nhé!'],
  'g03-t1': ['Nhìn kỹ rồi nhớ thứ tự, mình cùng xếp lại nhé!', 'Ai đến trước, ai đến sau? Mình cùng nhớ lại nhé!', 'Nghe người lớn đọc, rồi xếp lại đúng thứ tự nhé!', 'Nhìn kỹ thứ tự, rồi mình cùng xếp lại nhé!', 'Hình nào đứng đầu, hình nào đứng sau? Mình cùng nhớ nhé!', 'Nhớ dãy này nhé, lát nữa mình xếp lại cùng nhau!'],
  'g03-t2': ['Nhìn các ô vừa sáng lên, rồi cùng người lớn tìm lại nhé!', 'Cùng nghe người lớn đọc hướng dẫn, rồi nhớ những ô sáng nhé!', 'Nhìn các ô sáng thật kỹ, rồi mình cùng tìm lại nhé!', 'Ô nào vừa sáng lên nhỉ? Mình cùng nhớ nhé!', 'Người lớn đếm cùng bạn, rồi chạm lại các ô sáng nhé!'],
  'g03-t3': ['Cùng tìm xem có gì thay đổi nhé!', 'Hai bức tranh có gì khác nhau? Mình cùng tìm nhé!', 'Nhìn trước, nhìn sau, rồi chỉ chỗ đã đổi nhé!', 'Hai bức tranh gần giống nhau, mình cùng tìm chỗ khác nhé!', 'Có thứ gì vừa thay đổi? Mình cùng nhìn kỹ nhé!', 'Nhìn bức tranh trước, rồi tìm điều đã khác nhé!'],
  'g04-t1': ['Cùng đoán xem là bạn nào, dựa vào các gợi ý nhé!', 'Mỗi gợi ý loại đi một bạn, mình cùng tìm bạn còn lại nhé!', 'Nghe người lớn đọc gợi ý, rồi chọn đúng nhé!', 'Gợi ý nào loại được bạn nào? Mình cùng đoán nhé!', 'Mỗi gợi ý giúp mình bớt đi một lựa chọn, cùng thử nhé!', 'Nghe gợi ý rồi tìm bạn còn lại nhé!'],
  'g04-t2': ['Nếu thế này thì sẽ ra sao? Mình cùng đoán nhé!', 'Nghe luật chơi, rồi cùng tìm kết quả nhé!', 'Làm theo luật của lượt này và tìm đáp án nhé!', 'Nếu có luật này thì điều gì xảy ra? Mình cùng nghĩ nhé!', 'Nghe luật rồi tìm kết quả cùng mình nhé!', 'Làm theo luật từng bước, mình cùng tìm đáp án nhé!'],
  'g04-t3': ['Cùng tìm thêm một manh mối để biết bạn nào phù hợp nhé!', 'Nhìn các gợi ý rồi chọn điều còn thiếu để tìm đúng bạn nhé!', 'Còn thiếu một manh mối nữa, mình cùng tìm nhé!', 'Manh mối nào giúp mình biết chính xác bạn nào? Cùng chọn nhé!', 'Nghe gợi ý rồi chọn manh mối còn thiếu nhé!'],
  'g05-t1': ['Cùng tìm quả cân còn thiếu để hai đĩa thăng bằng nhé!', 'Nhìn hai đĩa cân rồi tìm số cân giúp chúng thăng bằng nhé!', 'Hai đĩa cân chưa bằng nhau, mình cùng thêm quả cân nhé!', 'Quả cân nào làm hai bên thăng bằng? Mình cùng tìm nhé!', 'Đếm hai đĩa cân cùng người lớn, rồi chọn số thiếu nhé!'],
  'g05-t2': ['Cùng chia đồ vật thành những nhóm bằng nhau nhé!', 'Nhìn số đồ vật rồi tìm xem chia được mấy nhóm nhé!', 'Mình cùng chia đều đồ vật vào các nhóm nhé!', 'Mỗi nhóm có mấy món? Mình cùng đếm nhé!', 'Đếm cùng người lớn, rồi chia thành các nhóm nhé!'],
  'g05-t3': ['Cùng chọn các món cho đủ số cần nhé!', 'Chọn vài món sao cho vừa đủ nhé!', 'Nghe người lớn đọc, rồi chọn các món vừa đủ nhé!', 'Chọn các món sao cho cộng lại vừa đủ nhé!', 'Món nào ghép với món nào thì vừa đủ? Mình cùng thử nhé!', 'Cùng người lớn đếm, rồi chọn các món vừa đủ nhé!'],
  'g06-t1': ['Cùng tìm đường đi tới đích nhé!', 'Giúp bạn nhỏ đi qua đường, tránh vật cản nhé!', 'Nhìn bản đồ, rồi vẽ đường tới đích cùng mình nhé!', 'Giúp bạn nhỏ tìm đường đi tới đích nhé!', 'Đường nào đi tới đích mà không vướng gì? Mình cùng tìm nhé!', 'Đi từng ô một tới đích cùng mình nhé!'],
  'g06-t2': ['Cùng xếp các việc theo thứ tự để làm nhé!', 'Việc nào cần làm trước? Mình cùng xếp lại nào!', 'Việc nào làm trước, việc nào làm sau? Mình cùng xếp nhé!', 'Nghe người lớn đọc, rồi xếp việc đúng thứ tự nhé!', 'Cùng xếp các việc thành một dãy đúng thứ tự nhé!'],
  'g06-t3': ['Cùng tìm bước đi giúp bạn robot tới đích nhé!', 'Bạn giúp robot sửa một bước để đi đúng đường nhé!', 'Chương trình của robot có một bước sai, mình cùng sửa nhé!', 'Robot đi lạc rồi, mình cùng tìm bước sai nhé!', 'Xem robot đi từng bước, rồi sửa bước sai nhé!'],
  'g07-t1': ['Cùng xếp lại các hình theo cách mới nhé!', 'Lần này có cách xếp mới, mình cùng thử nhé!', 'Nghe luật mới, rồi xếp các hình đúng nhóm nhé!', 'Hôm nay mình xếp theo cách khác, cùng thử nhé!', 'Cùng một nhóm hình, nhưng luật xếp mới, mình thử nhé!', 'Nghe luật xếp mới rồi chọn các hình hợp luật nhé!'],
  'g07-t2': ['Hãy nhìn theo hướng bạn ấy đang nhìn để tìm món đồ nhé!', 'Cùng tưởng tượng mình đứng ở chỗ bạn ấy và tìm đồ vật nhé!', 'Đứng ở chỗ bạn ấy, đồ vật nằm bên nào? Mình cùng nghĩ nhé!', 'Nhìn từ phía bạn ấy, mình cùng tìm đồ vật nhé!', 'Người lớn chỉ hướng nhìn, bạn tìm món đồ nhé!'],
  'g07-t3': ['Còn cách nào khác không? Mình cùng tìm nhé!', 'Cùng nghĩ thêm một cách khác để làm nhé!', 'Tìm cách mới mà vẫn đúng luật nhé!', 'Mình tìm một cách khác nữa, vẫn đúng luật nhé!', 'Có cách nào khác cũng đúng không? Mình cùng thử nhé!', 'Cách quen không dùng được, mình cùng nghĩ cách mới nhé!'],
  'g08-t1': ['Cùng tìm chỗ khác nhau giữa hai hình nhé!', 'Hai hình này giống nhau gần hết, mình cùng soi nhé!', 'Nhìn kỹ rồi chỉ chỗ khác nhau nhé!', 'Soi thật kỹ, hai hình khác nhau ở đâu? Mình cùng tìm nhé!', 'Mỗi ô một lần, mình cùng so hai hình nhé!', 'Chỉ cho mình chỗ khác nhau giữa hai hình nhé!'],
  'g08-t2': ['Cùng chọn hình có cả hai điều giống nhau nhé!', 'Tìm hình thỏa hai gợi ý cùng lúc nhé!', 'Nghe người lớn đọc, rồi chọn hình hợp cả hai nhé!', 'Hình nào hợp cả hai gợi ý? Mình cùng tìm nhé!', 'Chọn hình có cả hai điều mình cần nhé!', 'Kiểm từng gợi ý một, rồi chọn hình hợp cả hai nhé!'],
  'g08-t3': ['Cùng tìm điều không hợp với quy tắc nhé!', 'Trong các tình huống, cái nào không đúng quy tắc? Mình cùng tìm nhé!', 'Nghe người lớn đọc quy tắc, rồi chỉ điều không hợp nhé!', 'Tình huống nào không đúng quy tắc? Mình cùng tìm nhé!', 'Có một điều không hợp quy tắc, mình cùng bắt nó nhé!', 'Nghe từng tình huống rồi chỉ điều không đúng nhé!'],
};

const AGE_13_PLUS_INVITATIONS: Partial<Record<GameTypeId, readonly string[]>> = {
  'g01-t1': ['Xác định quy luật của dãy rồi chọn phần tử tiếp theo.', 'Phân tích nhịp lặp hoặc mức tăng để hoàn thành dãy.', 'Dãy này theo quy luật nào? Tìm phần tử tiếp theo.', 'Nhận ra nhịp của dãy rồi chọn phần tử kế tiếp.', 'Thử đoán trước bước tiếp theo, rồi kiểm chứng với quy luật của dãy.'],
  'g01-t2': ['Tìm phần tử không tuân theo quy luật chung của dãy.', 'Đối chiếu từng vị trí để xác định chỗ sai quy luật.', 'Một phần tử trong dãy đang lệch nhịp, bạn tìm ra nó chứ?', 'Soát từng vị trí để tìm điểm phá vỡ quy luật.', 'Dãy này có một lỗi ẩn, hãy lần ra vị trí đó.'],
  'g01-t3': ['Tìm phép biến đổi của máy từ các cặp số mẫu.', 'Suy ra quy tắc đầu vào – đầu ra rồi áp dụng cho số mới.', 'Từ các cặp mẫu, suy ra điều chiếc máy đang làm với số.', 'Thử đoán quy tắc của máy rồi kiểm tra trên mọi cặp mẫu.', 'Tìm ra phép tính ẩn trước khi áp dụng cho số mới.'],
  'g02-t1': ['Đối chiếu hình mẫu với các lựa chọn theo vị trí và số ô.', 'Tìm hình có cấu trúc trùng khớp với hình mẫu.', 'Tìm hình khớp với mẫu về vị trí và số ô.', 'Chỉ một lựa chọn giữ nguyên cấu trúc của mẫu, bạn chọn hình nào?', 'So từng lựa chọn với mẫu để loại dần những hình lệch.'],
  'g02-t2': ['Xác định phép xoay được mô tả rồi chọn hình tương ứng.', 'Theo dõi vị trí các ô sau phép xoay để chọn hình đúng.', 'Hình sẽ trông thế nào sau phép xoay này? Hãy hình dung trước khi chọn.', 'Theo dõi một ô làm mốc để suy ra hình sau khi xoay.', 'Dựng lại phép xoay trong đầu rồi so với các lựa chọn.'],
  'g02-t3': ['Đối chiếu các cặp ô qua trục để hoàn thành hình đối xứng.', 'Tìm vị trí làm hình không còn đối xứng qua trục gương.', 'Hoàn thiện hình đối xứng bằng cách đối chiếu các cặp ô qua trục.', 'Chỉ một vị trí đang phá vỡ sự đối xứng, hãy tìm ra nó.', 'Hình dung gương đặt ở trục rồi kiểm tra từng cặp ô.'],
  'g03-t1': ['Ghi nhớ trình tự xuất hiện rồi khôi phục dãy.', 'Quan sát chuỗi và tái lập đúng thứ tự sau khi ẩn.', 'Ghi nhớ thứ tự rồi khôi phục dãy sau khi nó biến mất.', 'Nhóm các phần tử thành cụm để nhớ dễ hơn, rồi tái hiện dãy.', 'Dãy sắp ẩn đi, bạn giữ được bao nhiêu trong đầu?'],
  'g03-t2': ['Ghi nhớ các vị trí sáng trên lưới rồi chọn lại.', 'Theo dõi vị trí từng ô để tái hiện chính xác mẫu.', 'Nhớ các ô vừa sáng rồi chọn lại đúng vị trí.', 'Tạo hình dạng trong đầu từ các ô sáng để dễ nhớ hơn.', 'Mẫu sắp ẩn đi. Ghi nhớ rồi tái hiện chính xác.'],
  'g03-t3': ['So sánh hai cảnh để xác định thay đổi.', 'Đối chiếu trước và sau, rồi chỉ ra điều đã đổi.', 'Hai cảnh chỉ khác nhau ở một chi tiết, bạn nhận ra không?', 'Ghi nhớ cảnh đầu, rồi chỉ ra điều đã thay đổi ở cảnh sau.', 'Quét từng khu vực của cảnh để tìm điểm khác biệt.'],
  'g04-t1': ['Kết hợp các dữ kiện để loại trừ những phương án không phù hợp.', 'Đối chiếu từng manh mối và xác định phương án còn lại.', 'Loại dần các phương án mâu thuẫn với manh mối cho tới khi còn một.', 'Mỗi manh mối thu hẹp thêm một lựa chọn, bạn cần mấy manh mối để chắc chắn?', 'Đọc kỹ từng dữ kiện rồi chọn phương án không bị loại.'],
  'g04-t2': ['Dùng các quy tắc đã cho để suy ra kết luận.', 'Lần theo quan hệ giữa các dữ kiện để tìm kết quả hợp lệ.', 'Dựa vào các quy tắc đã cho để rút ra kết luận chắc chắn.', 'Nếu quy tắc đúng thì điều gì chắc chắn xảy ra? Hãy suy luận.', 'Lần theo từng quy tắc cho tới kết quả cuối cùng.'],
  'g04-t3': ['Xác định thông tin bổ sung cần thiết để phân biệt các khả năng.', 'Tìm manh mối còn thiếu để kết luận duy nhất.', 'Còn thiếu dữ kiện nào để chỉ ra đáp án duy nhất?', 'Chọn manh mối giúp loại hết các khả năng còn lại.', 'Tìm thông tin bổ sung đủ để chắc chắn về kết luận.'],
  'g05-t1': ['Tính phần chênh lệch để hai bên cân bằng.', 'Dựa vào tổng khối lượng mỗi bên để tìm số còn thiếu.', 'Hai bên chưa cân. Tính phần thiếu để chúng bằng nhau.', 'So tổng hai đĩa cân rồi tìm số còn thiếu.', 'Tìm giá trị khiến cán cân nằm ngang.'],
  'g05-t2': ['Xác định số nhóm, phần dư hoặc số lượng cần thêm.', 'Chia tổng số theo kích thước nhóm và chọn kết quả tương ứng.', 'Chia đều số lượng theo nhóm rồi xác định kết quả cần tìm.', 'Tính số nhóm, phần dư hoặc phần cần thêm một cách chính xác.', 'Từ tổng số và kích thước nhóm, suy ra đáp án cần chọn.'],
  'g05-t3': ['Tìm tập hợp đáp ứng mục tiêu và điều kiện lựa chọn.', 'Tính tổng các phương án rồi chọn tập hợp hợp lệ.', 'Chọn tập phương án có tổng đúng bằng mục tiêu.', 'Thử ghép các phương án để đạt đủ mục tiêu mà vẫn đúng điều kiện.', 'Có nhiều cách ghép nhưng chỉ một cách thỏa mọi điều kiện, bạn tìm ra chứ?'],
  'g06-t1': ['Lập lộ trình thỏa các điều kiện trên bản đồ.', 'Tìm đường phù hợp từ điểm đầu tới đích.', 'Lập lộ trình ngắn gọn, tránh vật cản và ghé các điểm cần thiết.', 'Lên kế hoạch đường đi trước khi di chuyển.', 'Tìm đường hợp lệ từ điểm xuất phát tới đích.'],
  'g06-t2': ['Sắp xếp các công việc sao cho mọi quan hệ trước–sau đều đúng.', 'Dựa vào các ràng buộc để tìm thứ tự thực hiện hợp lệ.', 'Sắp xếp công việc sao cho mọi ràng buộc trước–sau đều thỏa.', 'Xác định việc nào phải làm trước để suy ra thứ tự hợp lệ.', 'Mỗi ràng buộc loại bớt một cách sắp xếp, hãy tìm thứ tự còn lại.'],
  'g06-t3': ['Xác định lệnh sai và thay bằng hướng đi phù hợp.', 'Theo dõi đường đi để tìm bước cần điều chỉnh.', 'Một lệnh trong chương trình đang sai, hãy tìm và sửa nó.', 'Chạy thử từng bước để phát hiện lệnh làm lộ trình lệch.', 'Gỡ lỗi lộ trình bằng cách thay đúng một lệnh.'],
  'g07-t1': ['Áp dụng tiêu chí mới để phân loại lại các hình.', 'Đổi tiêu chí phân loại và chọn các hình phù hợp.', 'Tiêu chí đã đổi. Phân loại lại các hình theo luật mới.', 'Cùng một nhóm hình nhưng luật phân loại mới cho kết quả khác.', 'Áp dụng cách phân loại mới thay vì thói quen cũ.'],
  'g07-t2': ['Quy chiếu vị trí theo hướng nhìn của nhân vật.', 'Xác định vị trí tương đối từ hướng đang quan sát.', 'Nhìn từ vị trí của nhân vật, đồ vật nằm ở đâu?', 'Đặt mình vào chỗ của nhân vật để xác định trái – phải.', 'Đổi góc nhìn sang nhân vật rồi xác định vị trí đồ vật.'],
  'g07-t3': ['Tìm một phương án khác vẫn đáp ứng các điều kiện.', 'Thử cách giải mới và kiểm tra tính hợp lệ của nó.', 'Tìm một cách làm khác vẫn thỏa mọi điều kiện.', 'Cách quen thuộc không còn dùng được, bạn có phương án khác không?', 'Thử hướng giải mới rồi kiểm tra xem nó có hợp lệ không.'],
  'g08-t1': ['So sánh hai hình theo từng hàng và cột.', 'Liệt kê các vị trí khác nhau giữa hai hình.', 'Soi từng hàng, từng cột để tìm điểm khác nhau giữa hai hình.', 'Hai hình gần như trùng nhau, hãy chỉ ra những chỗ lệch.', 'Quét có hệ thống để không bỏ sót chỗ khác nhau nào.'],
  'g08-t2': ['Chọn các hình thỏa đồng thời cả hai tiêu chí.', 'Kiểm tra từng tiêu chí trên mỗi hình trước khi chọn.', 'Tìm hình đáp ứng đồng thời cả hai tiêu chí.', 'Kiểm tra từng tiêu chí rồi giữ lại các hình thỏa cả hai.', 'Giao của hai điều kiện là những hình nào?'],
  'g08-t3': ['Tìm tình huống vi phạm quy tắc đã cho.', 'Đối chiếu từng tình huống với điều kiện và chọn trường hợp lệch.', 'Trong các tình huống, đâu là điều đi ngược quy tắc?', 'Đối chiếu từng tình huống với quy tắc để tìm trường hợp lệch.', 'Chỉ một tình huống vi phạm điều kiện đã cho, bạn chọn đúng chứ?'],
};

// Natural invitation variants per game type (avoiding repetitive "Bạn cùng thử nhé?")
export const GAME_INVITATIONS: Record<GameTypeId, readonly string[]> = {
  'g01-t1': [
    'Mình có dãy quy luật rất thú vị, bạn xem nhịp điệu của nó nhé!',
    'Hôm nay chúng mình cùng tìm phần tiếp theo của chuỗi quy luật này nhé!',
    'Bạn hãy quan sát thật tinh mắt để đoán xem số hoặc hình nào sẽ xuất hiện tiếp theo.',
    'Cùng mình tìm ra nhịp tăng hoặc bước lặp của dãy này nào bạn!',
    'Chào bạn, thử thách điền tiếp vào dãy quy luật đang chờ bạn trổ tài đấy!',
  ],
  'g01-t2': [
    'Trong chuỗi này có một vị trí bị đặt nhầm, bạn tìm giúp mình nhé!',
    'Cùng mình làm thám tử tìm xem chi tiết nào đang phá vỡ nhịp của dãy nhé!',
    'Bạn hãy quan sát thật kỹ xem hình hoặc số nào đứng chưa đúng quy luật.',
    'Mình phát hiện có một lỗi nhỏ trong chuỗi, bạn cùng mình chỉ ra vị trí đó nha!',
    'Thử thách tìm phần sai hôm nay sẽ giúp bạn rèn luyện đôi mắt tinh anh đấy!',
  ],
  'g01-t3': [
    'Chiếc máy biến đổi này hoạt động rất kỳ diệu, bạn khám phá cùng mình nhé!',
    'Hãy xem chiếc máy biến đổi các con số thế nào rồi tìm kết quả tiếp theo nhé!',
    'Cùng mình giải mã bí mật của cỗ máy biến đổi số ngày hôm nay nào bạn!',
    'Bạn thử đoán xem khi cho số mới vào máy thì kết quả đầu ra sẽ là bao nhiêu?',
    'Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé!',
  ],
  'g02-t1': [
    'Mỗi hình đều có một chiếc bóng thật đẹp, bạn ghép bóng cùng mình nhé!',
    'Bạn hãy nhìn kỹ hình mẫu và tìm chiếc bóng khớp nhất trong các lựa chọn.',
    'Cùng mình so từng góc cạnh để tìm chiếc bóng chuẩn xác cho hình nào!',
    'Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha!',
    'Chào bạn, bạn đã sẵn sàng tìm bóng cho hình mẫu cùng mình chưa nào?',
  ],
  'g02-t2': [
    'Khi xoay hình mẫu một vòng, nó sẽ trông như thế nào nhỉ? Bạn thử đoán xem!',
    'Cùng mình tưởng tượng hình mẫu khi xoay sang hướng mới sẽ ra hình nào nhé!',
    'Bạn hãy quan sát góc xoay và tìm hình sau khi xoay đúng hướng nào.',
    'Thử thách xoay hình hôm nay giúp bạn rèn luyện trí tưởng tượng không gian đấy!',
    'Mình có câu đố xoay hình rất vui, bạn cùng mình tìm hình đúng nhé!',
  ],
  'g02-t3': [
    'Hai bên gương đang chờ bạn hoàn thành để đối xứng thật đẹp đấy!',
    'Cùng mình tìm ô còn thiếu để bức tranh trở nên cân xứng hoàn hảo nhé!',
    'Bạn hãy nhìn trục gương và tìm xem ô nào giúp bức tranh đối xứng nào.',
    'Thử thách hoàn thành đối xứng hôm nay sẽ thử tài khéo mắt của bạn!',
    'Chào bạn, cùng mình khám phá vẻ đẹp đối xứng của bức tranh này nhé!',
  ],
  'g03-t1': [
    'Một dãy các từ sắp xuất hiện rồi biến mất, bạn nhớ thứ tự cùng mình nhé!',
    'Bạn hãy tập trung nhìn dãy thật kỹ để xếp lại đúng như lúc đầu nha!',
    'Cùng mình rèn luyện trí nhớ bằng cách ghi nhớ thứ tự của các bạn nhỏ nhé!',
    'Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha!',
    'Chào bạn, cùng mình chơi trò nhớ thứ tự các đồ vật thật vui nhé!',
  ],
  'g03-t2': [
    'Các bạn nhỏ đang trốn trong ô, bạn hãy nhớ vị trí của các bạn ấy nhé!',
    'Hãy nhớ xem những ô nào vừa sáng lên trên bảng nha bạn!',
    'Cùng mình thử tài siêu trí nhớ với bảng vị trí ngày hôm nay nào!',
    'Bạn hãy tập trung quan sát các vị trí xuất hiện rồi chỉ lại thật đúng nhé!',
    'Chào bạn, thử thách nhớ vị trí trên lưới ô vuông đã sẵn sàng rồi đấy!',
  ],
  'g03-t3': [
    'Giữa hai cảnh vừa có một sự thay đổi nhỏ, bạn có nhận ra không nào?',
    'Cùng mình so sánh hai bức tranh xem điều gì vừa mới thay đổi nhé!',
    'Bạn hãy tinh mắt phát hiện xem người bạn nào vừa đổi khác nha!',
    'Thử thách nhận ra thay đổi hôm nay sẽ rèn cho bạn đôi mắt rất tinh đấy!',
    'Chào bạn, hãy nhìn thật kỹ hai cảnh và chỉ ra điểm thay đổi cùng mình nhé!',
  ],
  'g04-t1': [
    'Có nhiều manh mối thú vị, bạn cùng mình tìm ra bạn nhỏ đúng nhất nhé!',
    'Hãy đọc từng manh mối và loại trừ dần để tìm ra đáp án chính xác nha!',
    'Cùng mình làm thám tử nhí suy luận theo các dấu hiệu gợi ý nào bạn!',
    'Thử thách suy luận loại trừ hôm nay sẽ giúp bạn rèn luyện tư duy logic đấy!',
    'Chào bạn, hãy dùng các manh mối để tìm ra bạn nhỏ bí ẩn cùng mình nhé!',
  ],
  'g04-t2': [
    'Từ các điều đã biết và luật Nếu - Thì, bạn suy luận cùng mình nhé!',
    'Hãy ghép nối các quy tắc suy luận để tìm ra kết luận chắc chắn nhất nào!',
    'Cùng mình thử tài suy luận logic với những điều kiện Nếu - Thì ngày hôm nay!',
    'Bạn hãy dùng tư duy logic để tìm ra sự thật tiếp theo từ những gì đã có nhé!',
    'Chào bạn, thử thách suy luận Nếu - Thì hôm nay rất thú vị, cùng thử sức nào!',
  ],
  'g04-t3': [
    'Để biết chắc bạn nhỏ này là ai, chúng mình cần thêm manh mối nào nhỉ?',
    'Cùng mình tìm mẩu thông tin còn thiếu để hoàn thành bài toán suy luận nhé!',
    'Bạn hãy xem những gợi ý đã có và chọn thêm điều kiện cần thiết nhất nào.',
    'Thử thách tìm manh mối còn thiếu hôm nay sẽ thử tài tư duy sắc bén của bạn!',
    'Chào bạn, bạn hãy giúp mình tìm thêm một gợi ý quyết định để giải đố nhé!',
  ],
  'g05-t1': [
    'Hai chiếc đĩa cân đang nghiêng, bạn giúp mình tìm số cân để thăng bằng nhé!',
    'Hãy tính xem cần thêm bao nhiêu để hai bên cân bằng nhau nha!',
    'Cùng mình làm cho chiếc cân trở nên thăng bằng thật đẹp mắt nào bạn!',
    'Thử thách cân thăng bằng hôm nay sẽ giúp bạn thành chuyên gia tính toán đấy!',
    'Chào bạn, cùng mình tìm quả cân còn thiếu để hai đĩa cân bằng nhau nhé!',
  ],
  'g05-t2': [
    'Có rất nhiều món quà cần chia thành từng nhóm đều nhau, bạn giúp mình nhé!',
    'Hãy tính xem chia được bao nhiêu nhóm hoặc còn dư lại mấy phần nha bạn!',
    'Cùng mình rèn luyện phép chia qua việc phân chia các nhóm thật đều nào!',
    'Thử thách chia nhóm hôm nay rất vui và hữu ích, bạn cùng mình làm nhé!',
    'Chào bạn, hãy trổ tài tính toán để chia đều các phần cùng mình nhé!',
  ],
  'g05-t3': [
    'Chiếc giỏ đang chờ bạn chọn các món đồ sao cho vừa đủ số mục tiêu đấy!',
    'Hãy chọn những con số phù hợp để đạt đúng mục tiêu mà không bị vượt quá nhé!',
    'Cùng mình nhặt các món đồ vào giỏ để đạt được tổng điểm mong muốn nào!',
    'Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào!',
    'Chào bạn, bạn hãy chọn các số thật khéo léo để đạt đúng mục tiêu cùng mình nhé!',
  ],
  'g06-t1': [
    'Bản đồ mê cung đã mở ra, bạn dẫn đường cho bạn nhỏ về đích cùng mình nhé!',
    'Hãy tìm một lối đi an toàn, tránh các bức tường và đi tới đích nha!',
    'Cùng mình lên kế hoạch cho từng bước chân để đến đích một cách khéo léo nào!',
    'Thử thách tìm đường hôm nay sẽ giúp bạn rèn luyện khả năng quan sát không gian đấy!',
    'Chào bạn, hãy cầm bút vẽ đường đi thông minh nhất để về đích cùng mình nhé!',
  ],
  'g06-t2': [
    'Các bước công việc đang bị đảo lộn, bạn xếp lại đúng thứ tự giúp mình nhé!',
    'Hãy sắp xếp các câu lệnh để mọi việc diễn ra tuần tự từ đầu đến cuối nha!',
    'Cùng mình lập trình thứ tự các bước hành động sao cho thật hợp lý nào bạn!',
    'Thử thách xếp lệnh hôm nay sẽ giúp bạn có tư duy của một nhà lập trình nhí đấy!',
    'Chào bạn, bạn hãy giúp mình sắp xếp các bước công việc theo đúng trình tự nhé!',
  ],
  'g06-t3': [
    'Chương trình robot bị sai một bước rồi, bạn cùng mình sửa lại cho đúng nhé!',
    'Hãy xem robot đi tới đâu bị vướng và đổi lại một bước để tới đích an toàn nha!',
    'Cùng mình sửa lỗi cho bạn robot để bạn ấy hoàn thành chuyến đi xuất sắc nào!',
    'Thử thách sửa bước sai hôm nay sẽ rèn cho bạn tính cẩn thận và quan sát tỉ mỉ đấy!',
    'Chào bạn, bạn hãy làm chuyên gia gỡ lỗi giúp bạn robot đến đích cùng mình nhé!',
  ],
  'g07-t1': [
    'Bây giờ luật chơi đã đổi, bạn phân loại lại các hình theo đặc điểm mới nhé!',
    'Hãy quên cách chia cũ đi và gom các hình theo yêu cầu mới cùng mình nha!',
    'Cùng mình rèn luyện sự linh hoạt khi chuyển sang cách phân loại mới nào bạn!',
    'Thử thách đổi luật phân loại hôm nay sẽ giúp tư duy của bạn thật nhạy bén đấy!',
    'Chào bạn, cùng mình chọn các hình đúng với đặc điểm mới của vòng chơi nhé!',
  ],
  'g07-t2': [
    'Nếu đứng ở vị trí của bạn nhỏ kia, bạn sẽ thấy đồ vật ở phía nào nhỉ?',
    'Hãy thử đổi góc nhìn và xác định hướng của đồ vật theo vị trí mới nha bạn!',
    'Cùng mình luyện khả năng tưởng tượng khi nhìn thế giới từ góc độ của bạn khác nào!',
    'Thử thách đổi góc nhìn hôm nay rất thú vị, bạn hãy đặt mình vào vị trí đó nhé!',
    'Chào bạn, cùng mình khám phá hướng nhìn mới trong câu đố ngày hôm nay nhé!',
  ],
  'g07-t3': [
    'Con đường quen thuộc đã bị chặn, bạn tìm một lối đi khác cùng mình nhé!',
    'Hãy tìm một con đường mới vẫn đưa chúng mình về đích an toàn nha bạn!',
    'Cùng mình rèn tính linh hoạt bằng cách tìm cách giải mới cho bài toán này nào!',
    'Thử thách cách giải khác hôm nay sẽ thử xem bạn có nghĩ ra lối đi mới không đấy!',
    'Chào bạn, hãy chỉ cho mình một con đường mới hợp lệ để đến đích cùng bạn nhé!',
  ],
  'g08-t1': [
    'Hai bức tranh trông rất giống nhau, nhưng có những điểm khác, bạn tìm nhé!',
    'Hãy so sánh từng hàng và từng cột để không bỏ sót điểm khác biệt nào nha bạn!',
    'Cùng mình làm thám tử tinh mắt tìm ra tất cả những chỗ khác nhau nào!',
    'Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé!',
    'Chào bạn, hãy soi thật kỹ hai bức tranh và tìm các điểm khác cùng mình nhé!',
  ],
  'g08-t2': [
    'Hãy tìm tất cả các hình có đủ cả hai đặc điểm mà đề bài đưa ra bạn nhé!',
    'Bạn hãy kiểm tra từng hình thật kỹ để chọn đúng những hình có cả hai dấu hiệu nha!',
    'Cùng mình kết hợp hai tiêu chuẩn để lọc ra những người bạn phù hợp nhất nào!',
    'Thử thách quan sát hai đặc điểm hôm nay sẽ rèn cho bạn thói quen bao quát đấy!',
    'Chào bạn, cùng mình tìm các hình có đủ hai đặc điểm trong thử thách này nhé!',
  ],
  'g08-t3': [
    'Trong các tình huống này có một điều chưa hợp lý, bạn tìm ra giúp mình nhé!',
    'Hãy quan sát từng bức tranh và chỉ ra chi tiết không phù hợp với quy tắc nha!',
    'Cùng mình xem bức tranh nào có điều bất thường so với những bức tranh còn lại nào!',
    'Thử thách chi tiết bất hợp lý hôm nay sẽ giúp bạn rèn óc quan sát đời sống đấy!',
    'Chào bạn, bạn hãy tinh mắt tìm ra tình huống chưa hợp lý cùng mình nhé!',
  ],
};

// Age-appropriate, diversified tutorials
export const GAME_TUTORIALS: Record<GameTypeId, {
  age_6_8: readonly string[];
  age_9_12: readonly string[];
}> = {
  'g01-t1': {
    age_6_8: [
      'Bạn nhìn nhịp lặp hoặc bước tăng của dãy, rồi chọn phần tiếp theo nhé.',
      'Đọc to các phần theo thứ tự, tìm xem phần nào đến tiếp theo.',
      'Quan sát cách dãy thay đổi đều đặn để chọn đúng ô còn thiếu.',
    ],
    age_9_12: [
      'Tìm xem dãy tăng thêm bao nhiêu hoặc lặp lại theo nhịp nào, rồi chọn phần tiếp theo.',
      'So hai phần tử liền nhau xem chúng khác nhau thế nào để tìm ra quy luật của dãy.',
      'Xem mỗi phần thay đổi thế nào so với phần ngay trước nó, rồi điền phần tiếp theo.',
    ],
  },
  'g01-t2': {
    age_6_8: [
      'Bạn đọc cả chuỗi và bấm vào vị trí đang bị lệch nhịp nhé.',
      'Tìm xem ô nào làm cho cả dãy bị sai quy luật quen thuộc.',
      'Quan sát từng bước của dãy và chọn phần đứng nhầm chỗ nhé.',
    ],
    age_9_12: [
      'Kiểm tra từng phần tử xem có hợp với quy luật của dãy không, rồi chỉ ra phần bị sai.',
      'Tìm phần tử làm dãy không còn tăng đều hoặc không còn lặp đúng nhịp.',
      'Đọc lại cả dãy và chọn vị trí không theo quy luật của các phần còn lại.',
    ],
  },
  'g01-t3': {
    age_6_8: [
      'Bạn xem các ví dụ chiếc máy làm mẫu, rồi chọn kết quả cho số mới nhé.',
      'Nhìn xem số vào máy thay đổi như thế nào để đoán số ra tiếp theo.',
      'Tìm quy tắc biến đổi của cỗ máy qua các số mẫu rồi tính kết quả nha.',
    ],
    age_9_12: [
      'So số đưa vào với số đi ra ở các ví dụ để đoán cỗ máy làm gì, rồi tính số còn thiếu.',
      'Xem các cặp số mẫu để tìm ra phép tính mà cỗ máy đã dùng.',
      'Dùng đúng phép tính của cỗ máy cho con số mà đề bài hỏi.',
    ],
  },
  'g02-t1': {
    age_6_8: [
      'Bạn chọn chiếc bóng có đúng các ô và hình dạng như hình mẫu nhé.',
      'So từng ô của bóng với hình mẫu để tìm chiếc bóng khớp nhất.',
      'Nhìn kỹ dáng hình và số ô để chọn đúng bóng của hình mẫu.',
    ],
    age_9_12: [
      'Đếm số ô và xem các ô nằm ở đâu để tìm bóng giống hệt hình mẫu.',
      'Có những bóng gần giống nhau, hãy so vị trí từng ô với hình mẫu để phân biệt.',
      'Nhìn thật kỹ hình dạng và chọn bóng khớp hoàn toàn với hình mẫu.',
    ],
  },
  'g02-t2': {
    age_6_8: [
      'Bạn tưởng tượng hình mẫu khi xoay và chọn hình đúng sau khi xoay nhé.',
      'Xem hình quay sang hướng nào rồi tìm hình tương ứng bên dưới.',
      'Xoay thử hình trong suy nghĩ để tìm đúng vị trí mới của các ô.',
    ],
    age_9_12: [
      'Xem hình mẫu xoay theo kiểu nào, rồi tìm hình trông giống như vậy sau khi xoay.',
      'Xoay khác với lật như soi gương, hãy phân biệt kỹ để không chọn nhầm hình nhé.',
      'Tưởng tượng từng ô của hình mẫu chạy sang chỗ mới khi cả hình xoay.',
    ],
  },
  'g02-t3': {
    age_6_8: [
      'Bạn tìm ô còn thiếu hoặc ô đang làm mất vẻ đối xứng qua chiếc gương nhé.',
      'Nhìn hai bên trục gương xem ô nào cần điền để hai bên giống hệt nhau.',
      'So từng cặp ô đối xứng qua đường kẻ giữa để tìm đúng vị trí.',
    ],
    age_9_12: [
      'Gấp đôi hình theo đường giữa: ô nào không có ô trùng bên kia thì cần bổ sung hoặc là ô bị lệch.',
      'So từng cặp ô nằm đối nhau hai bên đường giữa để tìm ô cần chọn.',
      'So hai nửa của lưới xem chỗ nào chưa cân đối, rồi hoàn thành hình đối xứng.',
    ],
  },
  'g03-t1': {
    age_6_8: [
      'Nhìn dãy thật kỹ; khi dãy ẩn đi, bạn xếp lại các từ theo đúng thứ tự nhé.',
      'Đọc thầm từng từ theo thứ tự để nhớ và xếp lại thật đúng.',
      'Ghi nhớ nhịp điệu của các hình ảnh rồi xếp lại sau khi chúng biến mất nha.',
    ],
    age_9_12: [
      'Nhớ thứ tự các phần tử xuất hiện, rồi xếp lại đúng như ban đầu.',
      'Gom các từ thành từng nhóm nhỏ trong đầu sẽ giúp bạn nhớ thứ tự dễ hơn.',
      'Nhìn thật tập trung trong lúc dãy hiện ra, rồi xếp lại đúng vị trí ban đầu.',
    ],
  },
  'g03-t2': {
    age_6_8: [
      'Bạn xem các ô sáng đèn, sau đó bấm lại đúng những vị trí vừa thấy nhé.',
      'Nhớ xem những người bạn vừa đứng ở ô nào trên bảng ô vuông.',
      'Tập trung nhìn các vị trí xuất hiện rồi bấm lại thật chính xác nha.',
    ],
    age_9_12: [
      'Nhớ những ô nào đã sáng lên trên lưới, rồi chọn lại đủ các ô đó.',
      'Nhớ mỗi ô nằm ở hàng nào, cột nào sẽ giúp bạn không nhầm chỗ.',
      'Hình dung lại các ô đã sáng nằm ở đâu trên lưới, rồi chọn lại chúng.',
    ],
  },
  'g03-t3': {
    age_6_8: [
      'Bạn xem cảnh trước và cảnh sau, rồi chọn điều vừa mới thay đổi nhé.',
      'Nhìn thật kỹ xem bạn nào vừa đổi chỗ, đổi màu hoặc biến mất nha.',
      'So sánh hai bức tranh để tìm ra một điểm khác lạ vừa xuất hiện.',
    ],
    age_9_12: [
      'So cảnh trước với cảnh sau từng món một để tìm ra điều đã thay đổi.',
      'Xem kỹ màu sắc, số lượng và chỗ đứng của từng món để nhận ra điểm khác.',
      'So nhanh hai cảnh nối tiếp nhau xem cái gì mất đi, mới đến hoặc đổi chỗ.',
    ],
  },
  'g04-t1': {
    age_6_8: [
      'Bạn đọc các gợi ý và chọn bạn nhỏ còn lại sau khi gạch bớt nhé.',
      'Gạch dần những hình không đúng gợi ý, hình còn lại chính là đáp án.',
      'Xem kỹ từng lời gợi ý để tìm ra đúng người bạn bí mật.',
    ],
    age_9_12: [
      'Đọc từng manh mối, cái nào nói "là" hay "không phải" đều giúp bạn loại bớt lựa chọn sai.',
      'Loại dần từng lựa chọn không hợp, cho đến khi chỉ còn lại một đáp án.',
      'Dùng cùng lúc tất cả manh mối để tìm ra lựa chọn đúng duy nhất.',
    ],
  },
  'g04-t2': {
    age_6_8: [
      'Bạn xem những điều đã biết và luật Nếu - Thì để tìm kết luận đúng nhé.',
      'Nếu có điều này thì sẽ có điều kia; bạn nối tiếp để tìm kết quả nha.',
      'Dùng gợi ý có sẵn và luật dẫn đường để tìm ra điều chắc chắn xảy ra.',
    ],
    age_9_12: [
      'Đọc các câu "nếu ... thì ..." và những điều đã biết, rồi suy ra điều chắc chắn đúng.',
      'Nối từng câu "nếu ... thì ..." với nhau, đi từ điều đã biết đến kết quả cuối cùng.',
      'Kiểm tra từng bước suy nghĩ và chọn kết luận chắc chắn đúng, không thể sai.',
    ],
  },
  'g04-t3': {
    age_6_8: [
      'Bạn xem các gợi ý đã có và chọn thêm một điều cần biết để tìm ra bạn nhỏ nhé.',
      'Tìm xem còn thiếu gợi ý nào để biết chắc chắn đáp án đúng.',
      'Chọn đúng mẩu thông tin giúp chúng mình nhận ra người bạn này ngay lập tức.',
    ],
    age_9_12: [
      'Tìm xem còn thiếu thông tin nào thì mới biết chắc đó là ai hoặc cái nào.',
      'Xem thông tin nào bổ sung vào là đủ để chỉ còn đúng một lựa chọn.',
      'Chọn manh mối còn thiếu để không còn băn khoăn giữa các lựa chọn nữa.',
    ],
  },
  'g05-t1': {
    age_6_8: [
      'Bạn tính để hai bên đĩa cân có cùng cân nặng bằng nhau nhé.',
      'Tìm quả cân còn thiếu để hai bên cân thăng bằng thật đẹp.',
      'Cộng số bên này rồi tìm số còn thiếu để bên kia nặng bằng nhau nha.',
    ],
    age_9_12: [
      'Tính xem cần thêm hoặc đổi quả cân nặng bao nhiêu để hai đĩa cân bằng nhau.',
      'Cộng số cân ở mỗi đĩa, rồi xem đĩa nhẹ hơn còn thiếu bao nhiêu để bằng đĩa kia.',
      'So tổng số cân của hai đĩa để tìm số cân còn thiếu.',
    ],
  },
  'g05-t2': {
    age_6_8: [
      'Bạn chia đều rồi đếm xem được bao nhiêu nhóm hoặc còn dư mấy phần nhé.',
      'Chia các món thành từng phần bằng nhau rồi trả lời câu hỏi.',
      'Đếm xem chia được mấy nhóm đủ và còn thừa lại mấy bạn nha.',
    ],
    age_9_12: [
      'Chia đều thành các nhóm bằng nhau rồi xem được mấy nhóm đầy đủ và còn dư bao nhiêu.',
      'Tính xem cần thêm bao nhiêu nữa thì có thêm được một nhóm đầy đủ.',
      'Đọc kỹ mỗi nhóm có bao nhiêu phần tử, rồi chia theo đúng số đó.',
    ],
  },
  'g05-t3': {
    age_6_8: [
      'Bạn chọn các món đồ sao cho tổng đúng với yêu cầu của đề bài nhé.',
      'Bấm chọn những con số sao cho đúng điều kiện đề bài đưa ra nha.',
      'Gom các số lại với nhau sao cho khớp với yêu cầu của đề bài nhé.',
    ],
    age_9_12: [
      'Chọn một vài số sao cho tổng của chúng đúng như đề bài yêu cầu.',
      'Thử các cách chọn khác nhau cho đến khi đúng điều đề bài đặt ra.',
      'Vừa chọn vừa cộng nhẩm để ghép các số cho đúng yêu cầu của đề bài.',
    ],
  },
  'g06-t1': {
    age_6_8: [
      'Đi từ ô bắt đầu đến ô đích, tránh các bức tường nhé.',
      'Vẽ đường đi an toàn đưa bạn nhỏ về đích mà không đâm vào chướng ngại vật.',
      'Tìm một đường đi từ ô bắt đầu đến ô đích mà không chạm vào tường nhé.',
    ],
    age_9_12: [
      'Vẽ một đường từ điểm xuất phát đến đích, tránh vật cản.',
      'Tìm lối đi an toàn qua các ô trống rồi về tới đích.',
      'Nhìn cả bảng trước, rồi vạch đường tránh tường để tới đích.',
    ],
  },
  'g06-t2': {
    age_6_8: [
      'Bạn sắp các bước việc làm sao cho mọi việc diễn ra đúng thứ tự trước sau nhé.',
      'Xem việc nào phải làm trước, việc nào làm sau rồi xếp lại cho đúng.',
      'Đặt các tấm thẻ hành động theo trình tự tự nhiên hàng ngày nha bạn.',
    ],
    age_9_12: [
      'Xếp các lệnh theo đúng thứ tự: việc nào phải làm trước, việc nào làm sau.',
      'Xem bước nào cần xong trước thì bước khác mới làm được, rồi xếp thành thứ tự đúng.',
      'Xếp các bước thành một dãy hợp lý để hoàn thành việc cần làm.',
    ],
  },
  'g06-t3': {
    age_6_8: [
      'Bạn tìm một bước cần đổi để bạn robot đi đúng đường tới đích nhé.',
      'Robot đi lệch ở bước nào nhỉ? Bạn đổi hướng bước đó để giúp bạn ấy nhé.',
      'Xem lại từng bước đi của robot và sửa lại một bước sai duy nhất nha.',
    ],
    age_9_12: [
      'Tìm lệnh đi sai hướng trong chương trình và chọn cách sửa cho đúng.',
      'Tìm bước đi đâm vào vật cản hoặc đi lệch khỏi đích, rồi sửa lại bước đó.',
      'Chỉ cần đổi đúng một bước đi là cả lộ trình sẽ tới được đích.',
    ],
  },
  'g07-t1': {
    age_6_8: [
      'Bạn phân loại các hình theo đặc điểm mới mà đề bài yêu cầu nhé.',
      'Gom các hình có cùng màu, cùng hình dạng hoặc kích thước theo luật mới nha.',
      'Đổi sang cách chia mới và chọn tất cả những hình phù hợp.',
    ],
    age_9_12: [
      'Luật đã đổi rồi, hãy chọn tất cả các hình hợp với luật mới.',
      'Quên cách chia nhóm cũ đi và chia lại các hình theo đặc điểm mới.',
      'Xem lại từng hình theo đặc điểm vừa đổi, như hình dạng, màu sắc hay kích cỡ.',
    ],
  },
  'g07-t2': {
    age_6_8: [
      'Bạn đứng vào vị trí người quan sát và chọn xem đồ vật ở phía nào nhé.',
      'Nhìn theo hướng mắt của bạn nhỏ để xem đồ vật ở trước, sau, trái hay phải.',
      'Tưởng tượng mình đang đứng ở đó và chỉ ra hướng của đồ vật nha.',
    ],
    age_9_12: [
      'Tưởng tượng mình đang đứng đúng chỗ bạn nhỏ và nhìn theo hướng mũi tên.',
      'Xem đồ vật nằm ở đâu so với bạn nhỏ, không phải so với màn hình của bạn.',
      'Chọn đồ vật đang ở phía trước, phía sau, bên trái hay bên phải của bạn nhỏ.',
    ],
  },
  'g07-t3': {
    age_6_8: [
      'Bạn tìm một con đường mới hợp lệ mà không đi trùng với đường cũ nhé.',
      'Tìm lối đi khác đưa bạn nhỏ về đích an toàn nha bạn.',
      'Vẽ một đường đi mới lạ để tránh đường quen thuộc đã có.',
    ],
    age_9_12: [
      'Tìm một đường đi khác, không giống đường đã có, mà vẫn tới được đích.',
      'Nghĩ thêm một lối đi nữa từ chỗ xuất phát đến đích.',
      'Tìm đường mới tránh các vật cản và không giống đường lần trước.',
    ],
  },
  'g08-t1': {
    age_6_8: [
      'Bạn tìm tất cả các ô có hình khác nhau giữa hai bức tranh nhé.',
      'So từng ô theo hàng và cột để tìm ra những điểm thay đổi.',
      'Nhìn thật tinh mắt xem những ô nào ở tranh bên phải đã bị đổi khác nha.',
    ],
    age_9_12: [
      'So hai bức tranh lần lượt từng hàng, từng cột để tìm hết các ô khác nhau.',
      'Đặt hai bức tranh cạnh nhau và tìm những ô đã bị đổi.',
      'Nhìn thật kỹ để tìm đủ mọi ô không giống nhau giữa hai hình.',
    ],
  },
  'g08-t2': {
    age_6_8: [
      'Bạn chọn mọi hình có đủ cả hai đặc điểm mà đề bài nhắc tới nhé.',
      'Kiểm tra từng hình xem có vừa đúng hình dạng vừa đúng màu sắc không nha.',
      'Tìm những người bạn mang đủ cả hai dấu hiệu nhận biết.',
    ],
    age_9_12: [
      'Chọn tất cả các hình có cả hai đặc điểm mà đề bài nêu.',
      'Với mỗi hình, kiểm tra xem nó có đủ cả hai đặc điểm hay chỉ có một.',
      'Chỉ chọn những hình hợp với cả hai điều kiện đã cho.',
    ],
  },
  'g08-t3': {
    age_6_8: [
      'Bạn tìm tình huống có chi tiết chưa đúng với quy tắc chung nhé.',
      'Xem các bức tranh và chỉ ra bạn nhỏ nào đang làm hành động khác lạ.',
      'Tìm chi tiết không cùng nhóm hoặc không đúng cách thức thường ngày nha.',
    ],
    age_9_12: [
      'Tìm tình huống có chỗ vô lý hoặc không hợp với quy tắc chung của nhóm.',
      'Xem từng chi tiết có hợp lý không, và mỗi thứ nên thuộc nhóm nào.',
      'Chỉ ra bức tranh có chi tiết lạ, không hợp với bối cảnh của nó.',
    ],
  },
};

// Rule-specific tutorials. Some checkers enforce a rule that depends on the board
// (how many tokens to answer, which positions to pick, how many items to select,
// whether only the shortest path counts). Those boards must not reuse the generic
// tutorial above, otherwise the child is told a rule the checker does not apply.
export const GAME_MODE_TUTORIALS: Partial<Record<GameTypeId, Record<string, {
  age_6_8: readonly string[];
  age_9_12: readonly string[];
}>>> = {
  'g03-t1': {
    missing: {
      age_6_8: [
        'Nhìn dãy thật kỹ; khi dãy ẩn đi, bạn chọn từ ở ô còn trống nhé.',
        'Ghi nhớ dãy các từ; sau khi dãy ẩn đi, bạn điền lại từ ở ô bị bỏ trống nha.',
        'Đọc thầm từng từ theo thứ tự để nhớ, rồi chọn từ cho ô để trống.',
      ],
      age_9_12: [
        'Ghi nhớ toàn bộ dãy; khi dãy ẩn đi, bạn cho biết từ nào nằm ở ô bị bỏ trống.',
        'Tập trung quan sát chuỗi trong thời gian ngắn rồi điền đúng từ vào ô để trống.',
        'Gom các từ thành nhóm nhỏ trong tâm trí để nhớ chính xác từ ở ô bị bỏ trống.',
      ],
    },
    swapped: {
      age_6_8: [
        'Nhìn dãy thật kỹ; khi dãy ẩn đi, bạn chọn hai từ ở hai ô được đánh dấu nhé.',
        'Ghi nhớ dãy các từ; sau khi dãy ẩn đi, bạn điền lại hai ô được đánh dấu nha.',
        'Đọc thầm từng từ theo thứ tự để nhớ, rồi chọn hai từ cho ô đánh dấu.',
      ],
      age_9_12: [
        'Ghi nhớ toàn bộ dãy; khi dãy ẩn đi, bạn cho biết hai từ nằm ở ô được đánh dấu.',
        'Tập trung quan sát chuỗi trong thời gian ngắn rồi điền đúng hai từ vào ô đánh dấu.',
        'Gom các từ thành nhóm nhỏ trong tâm trí để nhớ chính xác hai từ ở ô đánh dấu.',
      ],
    },
  },
  'g03-t2': {
    missing: {
      age_6_8: [
        'Bạn xem các ô sáng đèn; ô đã đánh dấu rồi thì bỏ qua, hãy bấm ô sáng đèn còn lại nhé.',
        'Nhớ xem ngôi sao sáng ở ô nào; ô đã đánh dấu rồi, bạn bấm ô sáng đèn còn lại nha.',
        'Tập trung nhìn các vị trí xuất hiện rồi bấm đúng ô sáng đèn chưa đánh dấu nha.',
      ],
      age_9_12: [
        'Nhớ những ô đã sáng trên lưới; bỏ qua ô đã đánh dấu và chọn ô sáng còn lại.',
        'Nhớ mỗi ô nằm ở hàng nào, cột nào, rồi chọn ô sáng chưa được đánh dấu.',
        'Hình dung lại các ô đã sáng trên lưới và chọn ô sáng còn lại.',
      ],
    },
  },
  'g05-t1': {
    replace: {
      age_6_8: [
        'Một quả cân sẽ được thay bằng quả mới; bạn tìm quả nặng bao nhiêu để hai đĩa cân bằng nhé.',
        'Nhìn quả cân được đánh dấu; thay nó bằng quả nặng bao nhiêu thì hai đĩa cân bằng nha?',
        'Cộng hai đĩa cân, rồi tìm số cân cần thay cho quả đã đánh dấu nhé.',
      ],
      age_9_12: [
        'Tính xem quả cân mới phải nặng bao nhiêu để hai đĩa cân bằng nhau.',
        'Tìm quả cân được đánh dấu rồi tính số cân thay vào để hai đĩa cân bằng.',
        'Cộng số cân ở hai đĩa sau khi bỏ quả đã đánh dấu để tìm số cân cần thay vào.',
      ],
    },
  },
  'g05-t3': {
    fewest: {
      age_6_8: [
        'Chọn các món sao cho tổng đúng bằng mục tiêu và số món chọn là ít nhất nhé.',
        'Gom thật ít món vừa đủ để cộng ra đúng số mục tiêu nha.',
        'Tìm cách dùng ít món nhất mà vẫn đủ số điểm cần đạt nhé.',
      ],
      age_9_12: [
        'Chọn các số có tổng đúng bằng mục tiêu, và số lượng số chọn phải ít nhất.',
        'Dùng ít nhất số món có thể mà tổng vẫn đúng số điểm cần đạt.',
        'Tìm cách chọn có số lượng ít nhất mà tổng vẫn đúng bằng mục tiêu.',
      ],
    },
    'exact-two': {
      age_6_8: [
        'Chọn đúng hai món sao cho tổng đúng bằng mục tiêu nhé.',
        'Chọn hai món vừa đủ để cộng ra số mục tiêu nha.',
        'Bấm đúng hai món đồ để tổng của chúng bằng mục tiêu nhé.',
      ],
      age_9_12: [
        'Chọn đúng hai số có tổng bằng mục tiêu.',
        'Tìm một cặp số cộng lại đúng bằng mục tiêu rồi chọn cả hai số đó.',
        'Hai số bạn chọn phải cộng lại đúng bằng mục tiêu.',
      ],
    },
    'not-over': {
      age_6_8: [
        'Chọn các món sao cho tổng không vượt quá mục tiêu và là lớn nhất nhé.',
        'Bỏ món làm vượt mục tiêu rồi gom sao cho tổng vừa đủ nhất nha.',
        'Gom các món sao cho tổng vừa khít mục tiêu mà không vượt quá nhé.',
      ],
      age_9_12: [
        'Chọn các số có tổng lớn nhất có thể mà không vượt quá mục tiêu.',
        'Bỏ những số làm tổng vượt mục tiêu, rồi chọn sao cho tổng còn lại lớn nhất.',
        'Tìm cách chọn có tổng lớn nhất mà vẫn không vượt quá mục tiêu.',
      ],
    },
    any: {
      age_6_8: [
        'Chọn các món sao cho tổng đúng bằng mục tiêu, tối đa {maxItems} món nhé.',
        'Gom các món vào giỏ sao cho tổng vừa đúng mục tiêu và không quá {maxItems} món nha.',
        'Bấm chọn các món để tổng đúng mục tiêu, tối đa {maxItems} món nhé.',
      ],
      age_9_12: [
        'Chọn các số có tổng đúng bằng mục tiêu, nhưng không quá {maxItems} số.',
        'Chọn các số để tổng đúng mục tiêu, nhớ chỉ được dùng tối đa {maxItems} số.',
        'Ghép các số cho tổng đúng yêu cầu, và không chọn quá {maxItems} món.',
      ],
    },
  },
  'g06-t1': {
    shortest: {
      age_6_8: [
        'Đếm bước để tìm đường ngắn nhất từ ô bắt đầu đến ô đích, tránh các bức tường nhé.',
        'Có nhiều đường tới đích, nhưng chỉ đường ít bước nhất mới đúng nha.',
        'Chọn đường có ít bước nhất để đưa bạn nhỏ tới đích an toàn nhé.',
      ],
      age_9_12: [
        'Tìm đường ngắn nhất từ ô bắt đầu đến ô đích, tránh các bức tường; đường dài hơn sẽ không được tính.',
        'So các đường có thể đi và chọn đường dùng ít bước nhất để tới đích.',
        'Chọn đường ít bước nhất, đi vòng thừa là chưa đúng nhé.',
      ],
    },
    ordered: {
      age_6_8: [
        'Trên đường đi, bạn phải ghé ngôi sao số 1 trước, rồi mới tới ngôi sao số 2 nhé.',
        'Nhớ ghé qua ngôi sao số 1 trước khi tới ngôi sao số 2 rồi mới về đích nha.',
        'Hãy đi qua ngôi sao số 1 trước, ngôi sao số 2 sau, cuối cùng về đích nhé.',
      ],
      age_9_12: [
        'Đường đi phải qua ngôi sao số 1 trước rồi mới tới ngôi sao số 2.',
        'Ghé ngôi sao số 1, rồi ngôi sao số 2, sau đó mới về đích.',
        'Đi theo đúng số thứ tự trên các ngôi sao, rồi mới tới đích.',
      ],
    },
    waypoint: {
      age_6_8: [
        'Đi từ ô bắt đầu đến ô đích, tránh các bức tường và nhớ ghé qua ngôi sao nhé.',
        'Vẽ đường đi an toàn, đi qua ngôi sao rồi về đích nha.',
        'Tìm một đường đi tới đích, nhớ ghé qua ngôi sao trên bảng nhé.',
      ],
      age_9_12: [
        'Vẽ đường từ ô bắt đầu tới ô đích, tránh bức tường và phải đi qua ngôi sao.',
        'Đi sao cho đường đi ghé qua ngôi sao rồi mới tới đích.',
        'Tìm đường đi tránh vật cản, qua ngôi sao và kết thúc ở ô đích.',
      ],
    },
    reach: {
      age_6_8: [
        'Đi từ ô bắt đầu đến ô đích, tránh các bức tường nhé.',
        'Vẽ đường đi an toàn đưa bạn nhỏ về đích mà không đâm vào chướng ngại vật.',
        'Tìm một đường đi tới ô đích mà không chạm vào tường nhé.',
      ],
      age_9_12: [
        'Vẽ một đường từ ô bắt đầu tới ô đích mà không chạm vào vật cản.',
        'Tìm lối đi an toàn qua các ô trống để về tới đích.',
        'Nhìn cả bảng trước, rồi vạch đường tránh tường để tới đích.',
      ],
    },
  },
};

const AGE_3_5_TUTORIALS: Partial<Record<GameTypeId, readonly string[]>> = {
  'g03-t1': ['Cùng nghe người lớn đọc dãy từ, rồi nhớ thứ tự nhé.', 'Nhìn các từ cùng người lớn; khi chúng ẩn đi, hãy chọn từ còn thiếu nhé.'],
  'g04-t2': ['Mỗi từ là một tấm thẻ. Hãy nhìn điều đã biết rồi tìm thẻ tiếp theo nhé.', 'Cùng nghe người lớn đọc quy tắc, rồi tìm điều sẽ xảy ra nhé.'],
  'g05-t1': ['Nhìn hai đĩa cân rồi tìm số giúp chúng thăng bằng nhé.', 'Tìm số cân còn thiếu để hai bên thăng bằng nhé.'],
  'g05-t2': ['Chia đều các món thành từng nhóm rồi đếm số nhóm nhé.', 'Đếm các món và xem chia được mấy nhóm bằng nhau nhé.'],
  'g06-t2': ['Nghe người lớn đọc các việc rồi xếp việc cần làm trước lên trước nhé.', 'Hãy xếp các việc theo thứ tự để mọi thứ làm đúng nhé.'],
  'g06-t3': ['Nhìn đường của robot rồi chọn bước giúp bạn ấy tới đích nhé.', 'Cùng tìm hướng đi đúng để robot đến đích nhé.'],
  'g07-t2': ['Hãy nhìn theo hướng bạn ấy đang nhìn rồi tìm món đồ nhé.', 'Tưởng tượng mình đứng ở chỗ bạn ấy để biết món đồ ở đâu nhé.'],
};

const AGE_3_5_MODE_TUTORIALS: Partial<Record<GameTypeId, Record<string, readonly string[]>>> = {
  'g03-t1': {
    missing: ['Nghe người lớn đọc dãy từ; khi dãy ẩn đi, hãy chọn từ còn thiếu nhé.', 'Nhìn dãy từ cùng người lớn rồi nhớ từ ở ô trống nhé.'],
    swapped: ['Nghe người lớn đọc dãy từ; khi dãy ẩn đi, hãy chọn hai từ ở ô được đánh dấu nhé.', 'Nhìn kỹ thứ tự các từ cùng người lớn rồi nhớ hai ô được đánh dấu nhé.'],
  },
  'g05-t2': {
    needed: ['Đếm xem cần thêm mấy món để đủ một nhóm nữa nhé.', 'Còn thiếu bao nhiêu món để làm thêm một nhóm bằng nhau?'],
    exact: ['Chia đều các món thành nhóm rồi đếm số nhóm nhé.', 'Tìm xem chia đều thì được chính xác bao nhiêu nhóm nhé.'],
    remainder: ['Chia đều các món rồi đếm xem còn dư mấy món nhé.', 'Tìm số món còn lại sau khi chia thành các nhóm bằng nhau nhé.'],
    floor: ['Đếm số nhóm đủ món sau khi chia đều nhé.', 'Tìm xem xếp được bao nhiêu nhóm trọn vẹn nhé.'],
  },
};

const AGE_13_PLUS_MODE_TUTORIALS: Partial<Record<GameTypeId, Record<string, readonly string[]>>> = {
  'g03-t1': {
    missing: ['Ghi nhớ trình tự rồi xác định phần tử bị lược khỏi dãy.', 'Khôi phục phần tử còn thiếu dựa trên thứ tự đã quan sát.'],
    swapped: ['Ghi nhớ dãy rồi xác định hai phần tử ở vị trí được đánh dấu.', 'Tái lập hai giá trị tại các vị trí được yêu cầu.'],
  },
  'g05-t2': {
    needed: ['Tính số lượng cần bổ sung để tạo thêm một nhóm đủ kích thước.', 'Xác định phần còn thiếu để hoàn thành một nhóm nữa.'],
    exact: ['Chia tổng số cho kích thước nhóm để tìm số nhóm chính xác.', 'Tính số nhóm khi mọi phần tử đều được chia hết.'],
    remainder: ['Tính phần dư sau khi chia thành các nhóm đủ kích thước.', 'Xác định số phần tử còn lại sau phép chia.'],
    floor: ['Tính số nhóm trọn vẹn có thể lập được.', 'Chỉ tính các nhóm đủ kích thước sau khi chia.'],
  },
  'g06-t1': {
    shortest: ['So sánh các lộ trình và chọn đường có ít bước nhất.', 'Chọn lộ trình ngắn nhất, đồng thời thỏa các điều kiện trên bản đồ.'],
    ordered: ['Đi qua các điểm trung chuyển theo đúng thứ tự được chỉ định.', 'Kiểm tra thứ tự các điểm cần ghé trước khi tới đích.'],
    waypoint: ['Tìm đường tới đích có đi qua điểm trung chuyển.', 'Lộ trình phải tránh vật cản và ghé điểm được đánh dấu.'],
    reach: ['Tìm một lộ trình hợp lệ từ điểm đầu tới đích.', 'Tránh các ô bị chặn khi nối điểm đầu với đích.'],
  },
};

const AGE_13_PLUS_TUTORIALS: Partial<Record<GameTypeId, readonly string[]>> = {
  'g01-t1': ['Xác định quy luật rồi chọn phần tử kế tiếp.', 'So sánh các phần tử liên tiếp để suy ra quy luật.'],
  'g01-t2': ['Tìm phần tử không tuân theo quy luật chung.', 'Đối chiếu từng vị trí và xác định chỗ sai.'],
  'g01-t3': ['Suy ra phép biến đổi từ các ví dụ rồi áp dụng.', 'Tìm quan hệ đầu vào–đầu ra của máy biến đổi.'],
  'g02-t1': ['So số ô và vị trí của chúng để tìm hình trùng khớp.', 'Đối chiếu cấu trúc của từng lựa chọn với hình mẫu.'],
  'g02-t2': ['Theo dõi vị trí các ô sau phép xoay.', 'Phân biệt phép xoay với phép đối xứng gương.'],
  'g02-t3': ['Đối chiếu các cặp ô qua trục đối xứng.', 'Tìm vị trí làm hình mất đối xứng qua trục.'],
  'g03-t1': ['Ghi nhớ trình tự rồi khôi phục dãy sau khi ẩn.', 'Quan sát chuỗi và tái lập đúng thứ tự.'],
  'g03-t2': ['Ghi nhớ các vị trí sáng rồi chọn lại trên lưới.', 'Theo dõi từng ô để tái hiện chính xác mẫu.'],
  'g03-t3': ['So sánh hai cảnh để xác định thay đổi.', 'Đối chiếu cảnh trước và sau rồi chỉ ra điểm khác.'],
  'g04-t1': ['Kết hợp các dữ kiện để loại trừ phương án.', 'Đối chiếu từng manh mối với các khả năng.'],
  'g04-t2': ['Áp dụng các quy tắc đã cho để suy ra kết luận.', 'Lần theo quan hệ giữa các dữ kiện để tìm kết quả.'],
  'g04-t3': ['Tìm thông tin cần bổ sung để phân biệt các khả năng.', 'Xác định manh mối còn thiếu để có kết luận duy nhất.'],
  'g05-t1': ['Tính phần chênh lệch để hai bên cân bằng.', 'Dựa vào tổng mỗi bên để tìm giá trị còn thiếu.'],
  'g05-t2': ['Chia tổng số theo kích thước nhóm và xác định kết quả.', 'Tìm số nhóm, phần dư hoặc số lượng cần bổ sung.'],
  'g05-t3': ['Tìm tập hợp đáp ứng mục tiêu và điều kiện lựa chọn.', 'Tính tổng các phương án rồi chọn tập hợp hợp lệ.'],
  'g06-t1': ['Lập lộ trình thỏa các điều kiện trên bản đồ.', 'Tìm đường phù hợp từ điểm đầu tới đích.'],
  'g06-t2': ['Sắp xếp công việc theo các quan hệ trước–sau.', 'Dựa vào ràng buộc để tìm thứ tự hợp lệ.'],
  'g06-t3': ['Tìm lệnh sai và thay bằng hướng đi phù hợp.', 'Theo dõi lộ trình để xác định bước cần chỉnh.'],
  'g07-t1': ['Áp dụng tiêu chí mới để phân loại lại các hình.', 'Chọn các hình phù hợp với tiêu chí vừa đổi.'],
  'g07-t2': ['Quy chiếu vị trí theo hướng nhìn của nhân vật.', 'Xác định vị trí tương đối từ hướng quan sát.'],
  'g07-t3': ['Tìm phương án khác vẫn đáp ứng điều kiện.', 'Thử cách giải mới rồi kiểm tra tính hợp lệ.'],
  'g08-t1': ['So sánh hai hình theo từng hàng và cột.', 'Xác định các vị trí khác nhau giữa hai hình.'],
  'g08-t2': ['Chọn các hình thỏa đồng thời cả hai tiêu chí.', 'Kiểm tra từng tiêu chí trên mỗi hình trước khi chọn.'],
  'g08-t3': ['Đối chiếu từng tình huống với quy tắc đã cho.', 'Tìm trường hợp vi phạm điều kiện.'],
};

// Which rule variant of a board decides how the child must answer.
export function getTutorialMode(gameTypeId: GameTypeId, boardData?: BoardData | null): string | null {
  if (!boardData) return null;
  if (gameTypeId === 'g03-t1') {
    return boardData.kind === 'memory-sequence' ? (boardData.mode ?? 'recall') : null;
  }
  if (gameTypeId === 'g03-t2') {
    return boardData.kind === 'memory-position' ? boardData.mode : null;
  }
  if (gameTypeId === 'g05-t1') {
    return boardData.kind === 'quantity-balance' ? boardData.mode : null;
  }
  if (gameTypeId === 'g05-t3') {
    return boardData.kind === 'quantity-target' ? boardData.mode : null;
  }
  if (gameTypeId === 'g05-t2') {
    return boardData.kind === 'quantity-grouping' ? boardData.mode : null;
  }
  if (gameTypeId === 'g06-t1') {
    if (boardData.kind !== 'path-planning') return null;
    if (boardData.shortestPathOnly === true) return 'shortest';
    if (boardData.waypointOrder === 'ordered') return 'ordered';
    return boardData.waypoints.length > 0 ? 'waypoint' : 'reach';
  }
  return null;
}

function formatTutorial(template: string, boardData?: BoardData | null): string {
  if (!boardData || boardData.kind !== 'quantity-target') return template;
  return template.replace(/\{maxItems\}/g, String(boardData.maxItems));
}

// Deterministic helper to select item by seed
export function selectBySeed<T>(list: readonly T[], seed: string | number, salt = 0): T {
  const str = String(seed);
  let hash = salt;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % list.length;
  return list[index]!;
}

export function getNaturalInvitation(gameTypeId: GameTypeId, day: number, seed: string, ageTrack?: GameAgeTrack): string {
  const variants = ageTrack === 'age_3_5'
    ? AGE_3_5_INVITATIONS[gameTypeId] ?? GAME_INVITATIONS[gameTypeId]
    : ageTrack === 'age_13_plus'
      ? AGE_13_PLUS_INVITATIONS[gameTypeId] ?? GAME_INVITATIONS[gameTypeId]
      : GAME_INVITATIONS[gameTypeId];
  if (!variants || variants.length === 0) return 'Mình có thử thách thú vị, bạn cùng khám phá nhé!';
  return selectBySeed(variants, seed, day);
}

export function getNaturalTutorial(
  gameTypeId: GameTypeId,
  ageTrack: GameAgeTrack,
  day: number,
  seed: string,
  boardData?: BoardData | null,
): string {
  if (gameTypeId === 'g02-t2' && boardData?.kind === 'spatial-rotation') {
    const instruction = {
      quarter: 'Xoay hình 90 độ theo chiều kim đồng hồ.',
      half: 'Xoay hình 180 độ.',
      mirror: 'Lật hình qua gương theo chiều trái–phải: bên trái đổi sang bên phải.',
      'quarter-mirror': 'Xoay hình 90 độ theo chiều kim đồng hồ, rồi lật hình vừa xoay theo chiều trái–phải.',
    }[boardData.turn];
    return `${instruction} Chọn hình đúng sau thao tác này.`;
  }
  if (gameTypeId === 'g06-t2' && boardData?.kind === 'planning-command-order') {
    const orderRules = boardData.before.map(([first, second]) => {
      const firstText = boardData.commands.find((command) => command.id === first)!.text;
      const secondText = boardData.commands.find((command) => command.id === second)!.text;
      return `${firstText} phải làm trước ${secondText}`;
    }).join('. ');
    return ageTrack === 'age_3_5'
      ? `Nghe người lớn đọc: ${orderRules}.`
      : `Các quy tắc của lượt này: ${orderRules}.`;
  }
  const trackGroup = ageTrack === 'age_6_8' || ageTrack === 'age_3_5' ? 'age_6_8' : 'age_9_12';
  const mode = getTutorialMode(gameTypeId, boardData);
  const modeVariants = ageTrack === 'age_3_5' && mode
    ? AGE_3_5_MODE_TUTORIALS[gameTypeId]?.[mode]
    : ageTrack === 'age_13_plus' && mode
      ? AGE_13_PLUS_MODE_TUTORIALS[gameTypeId]?.[mode]
    : mode ? GAME_MODE_TUTORIALS[gameTypeId]?.[mode]?.[trackGroup] : undefined;
  const variants = modeVariants && modeVariants.length > 0
    ? modeVariants
    : ageTrack === 'age_3_5'
      ? AGE_3_5_TUTORIALS[gameTypeId] ?? GAME_TUTORIALS[gameTypeId]?.[trackGroup]
      : ageTrack === 'age_13_plus'
        ? AGE_13_PLUS_TUTORIALS[gameTypeId] ?? GAME_TUTORIALS[gameTypeId]?.[trackGroup]
        : GAME_TUTORIALS[gameTypeId]?.[trackGroup];
  if (!variants || variants.length === 0) return 'Bạn quan sát thật kỹ và chọn đáp án chính xác nhé.';
  const tutorial = formatTutorial(selectBySeed(variants, seed, day), boardData);
  if (gameTypeId === 'g04-t2' && boardData?.kind === 'reasoning-if-then') {
    return ageTrack === 'age_3_5'
      ? tutorial
      : `Mỗi từ là một thẻ. Hãy dùng các quy tắc trong lượt này để tìm kết quả. ${tutorial}`;
  }
  return tutorial;
}
