import type { BoardData, GameAgeTrack, GameTypeId, PathStep } from '../types';

export const VIETNAMESE_COORDINATE = (point: PathStep): string => {
  return `hàng ${point.y + 1}, cột ${point.x + 1}`;
};

export const DIRECTION_VI: Record<string, string> = {
  ahead: 'ở ngay phía trước',
  behind: 'ở ngay phía sau',
  left: 'ở bên tay trái',
  right: 'ở bên tay phải',
  up: 'đi lên trên',
  down: 'đi xuống dưới',
};

export const DIRECTION_SHORT_VI: Record<string, string> = {
  ahead: 'phía trước',
  behind: 'phía sau',
  left: 'bên trái',
  right: 'bên phải',
  up: 'lên',
  down: 'xuống',
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
    'Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy!',
  ],
  'g02-t1': [
    'Mỗi hình đều có một chiếc bóng thật đẹp, bạn ghép bóng cùng mình nhé!',
    'Bạn hãy nhìn kỹ hình mẫu và tìm chiếc bóng khớp nhất trong các lựa chọn.',
    'Cùng mình so từng góc cạnh để tìm chiếc bóng chuẩn xác cho hình nào!',
    'Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé.',
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
    'Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào!',
    'Chào bạn, cùng mình chơi trò nhớ thứ tự các đồ vật thật vui nhé!',
  ],
  'g03-t2': [
    'Các bạn nhỏ đang trốn trong ô, bạn hãy nhớ vị trí của các bạn ấy nhé!',
    'Hãy nhớ thật nhanh xem những ô nào vừa sáng lên trên bảng nha bạn!',
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
    'Hãy tính toán thật nhanh xem cần thêm bao nhiêu để hai bên cân bằng nhau nha!',
    'Cùng mình làm cho chiếc cân trở nên thăng bằng thật đẹp mắt nào bạn!',
    'Thử thách cân thăng bằng hôm nay sẽ giúp bạn thành chuyên gia tính toán đấy!',
    'Chào bạn, cùng mình tìm quả cân còn thiếu để hai đĩa cân bằng nhau nhé!',
  ],
  'g05-t2': [
    'Có rất nhiều món quà cần chia thành từng nhóm đều nhau, bạn giúp mình nhé!',
    'Hãy tính xem chia được bao nhiêu nhóm hoặc còn dư lại mấy phần nha bạn!',
    'Cùng mình rèn luyện phép chia qua việc phân chia các nhóm thật đều nào!',
    'Thử thách chia nhóm hôm nay rất vui và hữu ích, bạn cùng mình làm nhé!',
    'Chào bạn, hãy trổ tài tính toán nhanh để chia đều các phần cùng mình nhé!',
  ],
  'g05-t3': [
    'Chiếc giỏ đang chờ bạn chọn các món đồ sao cho vừa đủ số mục tiêu đấy!',
    'Hãy chọn những con số phù hợp để đạt đúng mục tiêu mà không bị vượt quá nhé!',
    'Cùng mình nhặt các món đồ vào giỏ để đạt được tổng điểm mong muốn nào!',
    'Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy!',
    'Chào bạn, bạn hãy chọn các số thật khéo léo để đạt đúng mục tiêu cùng mình nhé!',
  ],
  'g06-t1': [
    'Bản đồ mê cung đã mở ra, bạn dẫn đường cho bạn nhỏ về đích cùng mình nhé!',
    'Hãy tìm một lối đi an toàn, tránh các bức tường và ghé qua điểm cần đến nha!',
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
    'Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy!',
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
      'Xác định quy luật tăng giảm hoặc nhịp lặp của dãy để chọn giá trị kế tiếp.',
      'Phân tích bước nhảy giữa các phần tử để tìm quy luật của dãy số hoặc hình.',
      'Quan sát mối liên hệ giữa các vị trí liên tiếp để điền phần tử tiếp theo chính xác.',
    ],
  },
  'g01-t2': {
    age_6_8: [
      'Bạn đọc cả chuỗi và bấm vào vị trí đang bị lệch nhịp nhé.',
      'Tìm xem ô nào làm cho cả dãy bị sai quy luật quen thuộc.',
      'Quan sát từng bước của dãy và chọn phần đứng nhầm chỗ nhé.',
    ],
    age_9_12: [
      'Đối chiếu từng phần tử với quy luật chung của dãy để chỉ ra điểm sai sót.',
      'Xác định phần tử làm đứt gãy bước nhảy hoặc nhịp lặp có sẵn của dãy.',
      'Kiểm tra tính nhất quán của chuỗi và chọn đúng vị trí vi phạm quy tắc.',
    ],
  },
  'g01-t3': {
    age_6_8: [
      'Bạn xem các ví dụ chiếc máy làm mẫu, rồi chọn kết quả cho số mới nhé.',
      'Nhìn xem số vào máy thay đổi như thế nào để đoán số ra tiếp theo.',
      'Tìm quy tắc biến đổi của cỗ máy qua các số mẫu rồi tính kết quả nha.',
    ],
    age_9_12: [
      'Phân tích quy tắc chuyển đổi giữa đầu vào và đầu ra để suy ra kết quả cho câu hỏi.',
      'So sánh các cặp số mẫu để tìm quy luật số học của cỗ máy biến đổi.',
      'Áp dụng chính xác phép biến đổi từ các ví dụ mẫu vào con số cần tìm.',
    ],
  },
  'g02-t1': {
    age_6_8: [
      'Bạn chọn chiếc bóng có đúng các ô và hình dạng như hình mẫu nhé.',
      'So từng ô của bóng với hình mẫu để tìm chiếc bóng khớp nhất.',
      'Nhìn kỹ dáng hình và số ô để chọn đúng bóng của hình mẫu.',
    ],
    age_9_12: [
      'So sánh chi tiết cấu trúc từng ô và đường viền để nhận diện bóng chính xác.',
      'Phân biệt các bóng gần giống nhau dựa trên vị trí các ô cấu tạo của hình mẫu.',
      'Đối chiếu tỉ mỉ hình dạng hình học để chọn bóng hoàn toàn trùng khớp.',
    ],
  },
  'g02-t2': {
    age_6_8: [
      'Bạn tưởng tượng hình mẫu khi xoay và chọn hình đúng sau khi xoay nhé.',
      'Xem hình quay sang hướng nào rồi tìm hình tương ứng bên dưới.',
      'Xoay thử hình trong suy nghĩ để tìm đúng vị trí mới của các ô.',
    ],
    age_9_12: [
      'Xác định góc quay và chiều xoay để tìm trạng thái sau khi xoay của hình mẫu.',
      'Phân biệt giữa phép xoay và phép lật gương để không bị chọn nhầm hình nhé.',
      'Tưởng tượng sự dịch chuyển tọa độ các ô của hình mẫu khi quay quanh tâm.',
    ],
  },
  'g02-t3': {
    age_6_8: [
      'Bạn tìm ô còn thiếu hoặc ô đang làm mất vẻ đối xứng qua chiếc gương nhé.',
      'Nhìn hai bên trục gương xem ô nào cần điền để hai bên giống hệt nhau.',
      'So từng cặp ô đối xứng qua đường kẻ giữa để tìm đúng vị trí.',
    ],
    age_9_12: [
      'Dựa vào trục đối xứng ngang hoặc dọc để xác định ô cần bù hoặc ô làm lệch đối xứng.',
      'So sánh từng cặp điểm đối xứng qua trục phản chiếu để tìm ra vị trí chính xác.',
      'Phân tích sự cân đối giữa hai nửa lưới ô vuông để hoàn thành hình đối xứng.',
    ],
  },
  'g03-t1': {
    age_6_8: [
      'Nhìn dãy thật kỹ; khi dãy ẩn đi, bạn xếp lại các từ theo đúng thứ tự nhé.',
      'Đọc thầm từng từ theo thứ tự để nhớ và xếp lại thật đúng.',
      'Ghi nhớ nhịp điệu của các hình ảnh rồi xếp lại sau khi chúng biến mất nha.',
    ],
    age_9_12: [
      'Ghi nhớ trình tự xuất hiện của các phần tử và tái hiện lại chính xác toàn bộ chuỗi.',
      'Gom các từ thành nhóm nhỏ trong tâm trí để ghi nhớ thứ tự hiệu quả hơn.',
      'Tập trung quan sát chuỗi trong thời gian ngắn rồi sắp xếp lại đúng vị trí ban đầu.',
    ],
  },
  'g03-t2': {
    age_6_8: [
      'Bạn xem các ô sáng đèn, sau đó bấm lại đúng những vị trí vừa thấy nhé.',
      'Nhớ xem những người bạn vừa đứng ở ô nào trên bảng ô vuông.',
      'Tập trung nhìn các vị trí xuất hiện rồi bấm lại thật chính xác nha.',
    ],
    age_9_12: [
      'Ghi nhớ vị trí không gian của các điểm trên lưới và chọn lại đầy đủ các điểm đó.',
      'Sử dụng các dấu mốc hàng và cột để ghi nhớ chính xác tọa độ các ô vừa xuất hiện.',
      'Tái hiện lại cấu trúc phân bố của các điểm nhớ trên bảng lưới ô vuông.',
    ],
  },
  'g03-t3': {
    age_6_8: [
      'Bạn xem cảnh trước và cảnh sau, rồi chọn điều vừa mới thay đổi nhé.',
      'Nhìn thật kỹ xem bạn nào vừa đổi chỗ, đổi màu hoặc biến mất nha.',
      'So sánh hai bức tranh để tìm ra một điểm khác lạ vừa xuất hiện.',
    ],
    age_9_12: [
      'Đối chiếu chi tiết giữa hai trạng thái trước và sau để xác định chính xác sự thay đổi.',
      'Quan sát tỉ mỉ thuộc tính, số lượng hoặc vị trí của các đối tượng để nhận ra điểm mới.',
      'Phân tích nhanh sự biến đổi giữa hai khung hình liên tiếp để tìm ra đáp án đúng.',
    ],
  },
  'g04-t1': {
    age_6_8: [
      'Bạn đọc các gợi ý và chọn bạn nhỏ còn lại sau khi gạch bớt nhé.',
      'Gạch dần những hình không đúng gợi ý, hình còn lại chính là đáp án.',
      'Xem kỹ từng lời gợi ý để tìm ra đúng người bạn bí mật.',
    ],
    age_9_12: [
      'Phân tích các manh mối khẳng định và phủ định để loại trừ các phương án không phù hợp.',
      'Sử dụng phương pháp loại suy từng bước để xác định đối tượng duy nhất thỏa mãn.',
      'Kết hợp chặt chẽ tất cả các điều kiện để tìm ra ứng viên chính xác.',
    ],
  },
  'g04-t2': {
    age_6_8: [
      'Bạn xem những điều đã biết và luật Nếu - Thì để tìm kết luận đúng nhé.',
      'Nếu có điều này thì sẽ có điều kia; bạn nối tiếp để tìm kết quả nha.',
      'Dùng gợi ý có sẵn và luật dẫn đường để tìm ra điều chắc chắn xảy ra.',
    ],
    age_9_12: [
      'Áp dụng quy tắc suy luận Nếu - Thì từ tiền đề cho trước để rút ra kết luận logic.',
      'Nối các mắt xích suy luận liên tiếp để đi từ thông tin ban đầu đến kết quả cuối cùng.',
      'Kiểm tra tính hợp lệ của chuỗi lập luận để chọn kết luận không thể bác bỏ.',
    ],
  },
  'g04-t3': {
    age_6_8: [
      'Bạn xem các gợi ý đã có và chọn thêm một điều cần biết để tìm ra bạn nhỏ nhé.',
      'Tìm xem còn thiếu gợi ý nào để biết chắc chắn đáp án đúng.',
      'Chọn đúng mẩu thông tin giúp chúng mình nhận ra người bạn này ngay lập tức.',
    ],
    age_9_12: [
      'Xác định thông tin còn thiếu mang tính quyết định để thu hẹp phạm vi về một đối tượng.',
      'Phân tích xem dữ kiện nào là điều kiện cần và đủ để khẳng định danh tính mục tiêu.',
      'Lựa chọn bổ sung manh mối thích hợp nhằm loại bỏ hoàn toàn sự không chắc chắn.',
    ],
  },
  'g05-t1': {
    age_6_8: [
      'Bạn tính để hai bên đĩa cân có cùng cân nặng bằng nhau nhé.',
      'Tìm quả cân còn thiếu để hai bên cân thăng bằng thật đẹp.',
      'Cộng số bên này rồi tìm số còn thiếu để bên kia nặng bằng nhau nha.',
    ],
    age_9_12: [
      'Tính toán giá trị quả cân cần thêm hoặc thay thế để hai bên đạt trạng thái cân bằng.',
      'Thiết lập sự tương đương về tổng khối lượng giữa hai đĩa cân để tìm số còn thiếu.',
      'Giải bài toán cân thăng bằng bằng cách so sánh tổng số lượng hai vế.',
    ],
  },
  'g05-t2': {
    age_6_8: [
      'Bạn chia đều rồi đếm xem được bao nhiêu nhóm hoặc còn dư mấy phần nhé.',
      'Chia các món thành từng phần bằng nhau rồi trả lời câu hỏi.',
      'Đếm xem chia được mấy nhóm đủ và còn thừa lại mấy bạn nha.',
    ],
    age_9_12: [
      'Vận dụng phép chia có dư để xác định số nhóm trọn vẹn hoặc số phần dư tương ứng.',
      'Tính toán chính xác số phần cần bổ sung để tạo thêm một nhóm hoàn chỉnh.',
      'Phân tích bài toán chia nhóm đều theo yêu cầu kích thước mỗi nhóm.',
    ],
  },
  'g05-t3': {
    age_6_8: [
      'Bạn chọn các món đồ sao cho tổng đúng với yêu cầu của đề bài nhé.',
      'Bấm chọn những con số sao cho đúng điều kiện đề bài đưa ra nha.',
      'Gom các số lại với nhau sao cho khớp với yêu cầu của đề bài nhé.',
    ],
    age_9_12: [
      'Lựa chọn tập hợp các số sao cho tổng giá trị thỏa mãn đúng điều kiện đề bài đưa ra.',
      'Tối ưu cách chọn để đáp ứng chính xác tiêu chí của đề bài nêu ra.',
      'Tính nhẩm linh hoạt để kết hợp các số đúng điều kiện đề bài yêu cầu.',
    ],
  },
  'g06-t1': {
    age_6_8: [
      'Đi từ ô bắt đầu đến ô đích, tránh các bức tường và ghé qua điểm cần đến nhé.',
      'Vẽ đường đi an toàn đưa bạn nhỏ về đích mà không đâm vào chướng ngại vật.',
      'Tìm một đường đi hợp lệ đến ô đích và ghé qua các điểm mốc trên bảng nhé.',
    ],
    age_9_12: [
      'Vẽ một lộ trình hợp lệ từ điểm xuất phát đến đích, tránh vật cản và qua các điểm mốc.',
      'Sắp xếp các bước đi sao cho an toàn, đi đủ các điểm mốc rồi mới tới đích.',
      'Định vị không gian trên lưới để vạch ra đường đi hợp lệ và an toàn.',
    ],
  },
  'g06-t2': {
    age_6_8: [
      'Bạn sắp các bước việc làm sao cho mọi việc diễn ra đúng thứ tự trước sau nhé.',
      'Xem việc nào phải làm trước, việc nào làm sau rồi xếp lại cho đúng.',
      'Đặt các tấm thẻ hành động theo trình tự tự nhiên hàng ngày nha bạn.',
    ],
    age_9_12: [
      'Sắp xếp chuỗi các câu lệnh hoặc thao tác theo quy trình logic và mối quan hệ trước sau.',
      'Phân tích điều kiện phụ thuộc giữa các bước để xây dựng trình tự thực thi chuẩn xác.',
      'Thiết lập quy trình hành động tuần tự hợp lý để hoàn thành mục tiêu công việc.',
    ],
  },
  'g06-t3': {
    age_6_8: [
      'Bạn tìm một bước cần đổi để bạn robot đi đúng đường tới đích nhé.',
      'Robot đi lệch ở bước nào nhỉ? Bạn đổi hướng bước đó để giúp bạn ấy nhé.',
      'Xem lại từng bước đi của robot và sửa lại một bước sai duy nhất nha.',
    ],
    age_9_12: [
      'Chẩn đoán câu lệnh sai hướng trong chương trình và chọn phương án sửa đổi phù hợp.',
      'Phát hiện bước đi đâm vào chướng ngại hoặc chệch đích để điều chỉnh chính xác.',
      'Thực hiện gỡ lỗi bằng cách thay thế một bước đi duy nhất giúp lộ trình thành công.',
    ],
  },
  'g07-t1': {
    age_6_8: [
      'Bạn phân loại các hình theo đặc điểm mới mà đề bài yêu cầu nhé.',
      'Gom các hình có cùng màu, cùng hình dạng hoặc kích thước theo luật mới nha.',
      'Đổi sang cách chia mới và chọn tất cả những hình phù hợp.',
    ],
    age_9_12: [
      'Chuyển đổi linh hoạt sang tiêu chuẩn phân loại mới và chọn tất cả các đối tượng tương ứng.',
      'Loại bỏ cách tư duy phân nhóm cũ để gom tập hợp đối tượng theo thuộc tính mới.',
      'Phân loại lại các hình dựa trên đặc điểm màu sắc, hình học hoặc kích thước vừa đổi.',
    ],
  },
  'g07-t2': {
    age_6_8: [
      'Bạn đứng vào vị trí người quan sát và chọn xem đồ vật ở phía nào nhé.',
      'Nhìn theo hướng mắt của bạn nhỏ để xem đồ vật ở trước, sau, trái hay phải.',
      'Tưởng tượng mình đang đứng ở đó và chỉ ra hướng của đồ vật nha.',
    ],
    age_9_12: [
      'Xoay chuyển góc nhìn tâm lý sang vị trí người quan sát để xác định hướng tương đối.',
      'Phân tích tọa độ vị trí theo hệ quy chiếu của nhân vật quan sát trong không gian.',
      'Định hướng chính xác vị trí đồ vật là phía trước, phía sau, bên trái hay bên phải.',
    ],
  },
  'g07-t3': {
    age_6_8: [
      'Bạn tìm một con đường mới hợp lệ mà không đi trùng với đường cũ nhé.',
      'Tìm lối đi khác đưa bạn nhỏ về đích an toàn nha bạn.',
      'Vẽ một đường đi mới lạ để tránh đường quen thuộc đã có.',
    ],
    age_9_12: [
      'Tìm kiếm phương án lộ trình thay thế hợp lệ không trùng với đường đi ban đầu.',
      'Phát huy tính linh hoạt tư duy để tìm lối thoát thứ hai từ xuất phát đến đích.',
      'Khám phá đường đi mới né tránh các vật cản và khác biệt với lời giải trước đó.',
    ],
  },
  'g08-t1': {
    age_6_8: [
      'Bạn tìm tất cả các ô có hình khác nhau giữa hai bức tranh nhé.',
      'So từng ô theo hàng và cột để tìm ra những điểm thay đổi.',
      'Nhìn thật tinh mắt xem những ô nào ở tranh bên phải đã bị đổi khác nha.',
    ],
    age_9_12: [
      'So sánh có hệ thống theo từng hàng và cột để phát hiện mọi điểm khác biệt trên lưới.',
      'Nhận diện các ô bị thay đổi chi tiết giữa hai bức tranh đối chiếu song song.',
      'Quan sát tỉ mỉ để xác định toàn bộ các tọa độ có sự sai lệch giữa hai hình.',
    ],
  },
  'g08-t2': {
    age_6_8: [
      'Bạn chọn mọi hình có đủ cả hai đặc điểm mà đề bài nhắc tới nhé.',
      'Kiểm tra từng hình xem có vừa đúng hình dạng vừa đúng màu sắc không nha.',
      'Tìm những người bạn mang đủ cả hai dấu hiệu nhận biết.',
    ],
    age_9_12: [
      'Lọc ra tất cả các đối tượng thỏa mãn đồng thời cả hai thuộc tính yêu cầu.',
      'Kiểm tra giao điểm của hai tập hợp đặc điểm trên từng hình mẫu lựa chọn.',
      'Xác định chính xác các hình có đầy đủ hai tiêu chuẩn nhận diện đã cho.',
    ],
  },
  'g08-t3': {
    age_6_8: [
      'Bạn tìm tình huống có chi tiết chưa đúng với quy tắc chung nhé.',
      'Xem các bức tranh và chỉ ra bạn nhỏ nào đang làm hành động khác lạ.',
      'Tìm chi tiết không cùng nhóm hoặc không đúng cách thức thường ngày nha.',
    ],
    age_9_12: [
      'Phát hiện tình huống chứa yếu tố phi lý hoặc vi phạm quy tắc chung của nhóm.',
      'Phân tích tính hợp lý của các chi tiết hành vi và phân nhóm đối tượng.',
      'Chỉ ra chính xác bức tranh chứa chi tiết bất thường không phù hợp với bối cảnh.',
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
        'Ghi nhớ vị trí các điểm sáng trên lưới; bỏ qua ô đã đánh dấu và chọn ô sáng còn lại.',
        'Dùng dấu mốc hàng và cột để nhớ tọa độ các ô vừa sáng rồi chọn ô chưa đánh dấu.',
        'Tái hiện lại phân bố các điểm nhớ trên bảng lưới và chọn ô sáng còn lại.',
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
        'Tính giá trị quả cân cần thay thế để tổng khối lượng hai đĩa cân bằng nhau.',
        'Xác định quả cân được đánh dấu rồi tìm số cân thay thế giúp hai đĩa cân thăng bằng.',
        'So sánh tổng số lượng hai vế sau khi thay quả cân đã đánh dấu để tìm số cần thay.',
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
        'Chọn tập hợp các số sao cho tổng đúng mục tiêu và số phần tử là ít nhất.',
        'Tối ưu số món chọn sao cho vẫn đạt đúng tổng số điểm yêu cầu.',
        'Tìm tổ hợp có số phần tử ít nhất nhưng tổng giá trị vẫn đúng mục tiêu.',
      ],
    },
    'exact-two': {
      age_6_8: [
        'Chọn đúng hai món sao cho tổng đúng bằng mục tiêu nhé.',
        'Chọn hai món vừa đủ để cộng ra số mục tiêu nha.',
        'Bấm đúng hai món đồ để tổng của chúng bằng mục tiêu nhé.',
      ],
      age_9_12: [
        'Chọn đúng hai số sao cho tổng giá trị đúng bằng mục tiêu.',
        'Tìm một cặp số có tổng đúng mục tiêu rồi chọn cả hai vào.',
        'Hai phần tử được chọn phải có tổng giá trị đúng mục tiêu yêu cầu.',
      ],
    },
    'not-over': {
      age_6_8: [
        'Chọn các món sao cho tổng không vượt quá mục tiêu và là lớn nhất nhé.',
        'Bỏ món làm vượt mục tiêu rồi gom sao cho tổng vừa đủ nhất nha.',
        'Gom các món sao cho tổng vừa khít mục tiêu mà không vượt quá nhé.',
      ],
      age_9_12: [
        'Chọn tập hợp các số sao cho tổng không vượt mục tiêu và đạt giá trị lớn nhất.',
        'Loại các phần làm vượt mục tiêu rồi tối đa hóa tổng còn lại.',
        'Tìm tổ hợp có tổng lớn nhất nhưng vẫn không vượt quá mục tiêu đã cho.',
      ],
    },
    any: {
      age_6_8: [
        'Chọn các món sao cho tổng đúng bằng mục tiêu, tối đa {maxItems} món nhé.',
        'Gom các món vào giỏ sao cho tổng vừa đúng mục tiêu và không quá {maxItems} món nha.',
        'Bấm chọn các món để tổng đúng mục tiêu, tối đa {maxItems} món nhé.',
      ],
      age_9_12: [
        'Chọn tập hợp các số sao cho tổng đúng mục tiêu và không quá {maxItems} số.',
        'Tối ưu danh sách chọn sao cho tổng đúng mục tiêu trong khi giới hạn {maxItems} phần tử.',
        'Kết hợp các số đạt đúng tổng yêu cầu mà vẫn tuân thủ giới hạn {maxItems} món đã chọn.',
      ],
    },
  },
  'g06-t1': {
    shortest: {
      age_6_8: [
        'Tìm đường ngắn nhất từ ô bắt đầu đến ô đích, tránh các bức tường nhé.',
        'Đường ngắn nhất sẽ đi thẳng về đích; bạn hãy vạch đường đó nha.',
        'Chọn đường có ít bước nhất để đưa bạn nhỏ tới đích an toàn nhé.',
      ],
      age_9_12: [
        'Lập kế hoạch đường đi ngắn nhất từ điểm xuất phát đến đích, tránh vật cản.',
        'Tìm lộ trình có số bước ít nhất để tới đích an toàn nhé.',
        'Chọn đường đi ít bước nhất, tránh vật cản và đi qua các điểm mốc nếu có.',
      ],
    },
    ordered: {
      age_6_8: [
        'Trên đường đi, bạn phải ghé lấy chiếc chìa khóa trước rồi mới tới cánh cửa nhé.',
        'Nhớ ghé qua chiếc chìa khóa ở giữa đường trước khi bước vào cánh cửa nha.',
        'Hãy đi qua chiếc chìa khóa trước, đến cánh cửa sau cùng nhé.',
      ],
      age_9_12: [
        'Lộ trình phải đi qua chiếc chìa khóa trước rồi mới tới cánh cửa đích.',
        'Sắp xếp đường đi sao cho điểm lấy chìa được ghé trước điểm mở cửa.',
        'Định hướng để ghé lấy chìa khóa trước, sau đó mới tiến tới cánh cửa.',
      ],
    },
    default: {
      age_6_8: [
        'Đi từ ô bắt đầu đến ô đích, tránh các bức tường và ghé qua điểm cần đến nhé.',
        'Vẽ đường đi an toàn đưa bạn nhỏ về đích mà không đâm vào chướng ngại vật.',
        'Tìm một đường đi hợp lệ đến ô đích và ghé qua các điểm mốc trên bảng nhé.',
      ],
      age_9_12: [
        'Vẽ một lộ trình hợp lệ từ điểm xuất phát đến đích, tránh vật cản và qua các điểm mốc.',
        'Sắp xếp các bước đi sao cho an toàn, đi đủ các điểm mốc rồi mới tới đích.',
        'Định vị không gian trên lưới để vạch ra đường đi hợp lệ và an toàn.',
      ],
    },
  },
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
  if (gameTypeId === 'g06-t1') {
    if (boardData.kind !== 'path-planning') return null;
    if (boardData.shortestPathOnly === true) return 'shortest';
    if (boardData.waypointOrder === 'ordered') return 'ordered';
    return 'default';
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

export function getNaturalInvitation(gameTypeId: GameTypeId, day: number, seed: string): string {
  const variants = GAME_INVITATIONS[gameTypeId];
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
  const trackGroup = ageTrack === 'age_6_8' || ageTrack === 'age_3_5' ? 'age_6_8' : 'age_9_12';
  const mode = getTutorialMode(gameTypeId, boardData);
  const modeVariants = mode ? GAME_MODE_TUTORIALS[gameTypeId]?.[mode]?.[trackGroup] : undefined;
  const variants = modeVariants && modeVariants.length > 0
    ? modeVariants
    : GAME_TUTORIALS[gameTypeId]?.[trackGroup];
  if (!variants || variants.length === 0) return 'Bạn quan sát thật kỹ và chọn đáp án chính xác nhé.';
  return formatTutorial(selectBySeed(variants, seed, day), boardData);
}
