import { isOlderTrack } from '../age';
import { hashSeed } from '../seeded';
import type { GameAgeTrack, GameTypeId } from '../types';

type HintPair = readonly [string, string];
type HintModes = Readonly<Record<string, readonly HintPair[]>>;
type TierHints = Readonly<{ young: HintModes; older: HintModes }>;

// Hint 1 only points at where or how to look and never gives the answer away; hint 2 may narrow
// the search. Younger tracks (3-5, 6-8) get short concrete hints in everyday words that say where to
// look. Older tracks (9-12, 13+) get strategy nudges: what to compare and which rule to test.
// {trait}, {value}, {target} and {max} are filled from the board when a hint needs them.
export const TRACK_HINTS: Readonly<Record<GameTypeId, TierHints>> = {
  'g01-t1': {
    young: {
      increment: [['Nhìn các số từ trái sang phải nhé.', 'Mỗi số hơn số ngay trước nó bao nhiêu nhỉ?']],
      interleaved: [['Các số này như hai đội đứng xen kẽ nhau.', 'Nhìn riêng các số đứng ở vị trí thứ nhất, thứ ba, thứ năm xem chúng đổi thế nào.']],
      alternating: [['Nhìn xem hai hình nào cứ thay nhau xuất hiện.', 'Đọc nhỏ cả dãy: cái này, cái kia, cái này, cái kia.']],
      repeat: [['Có một nhóm nhỏ cứ lặp đi lặp lại đó.', 'Tìm xem nhóm đó bắt đầu từ hình nào.']],
    },
    older: {
      increment: [['Thử so từng cặp số đứng cạnh nhau xem hiệu của chúng thế nào.', 'Nếu hiệu giống nhau ở mọi cặp, bạn chỉ cần cộng hiệu đó vào số cuối cùng.']],
      interleaved: [['Thử tách dãy thành hai dãy nhỏ: các số ở vị trí lẻ và các số ở vị trí chẵn.', 'Mỗi dãy nhỏ có bước tăng riêng; xem vị trí tiếp theo thuộc dãy nào rồi dùng bước của dãy đó.']],
      alternating: [['Thử so mỗi phần tử với phần tử cách nó một vị trí.', 'Nếu mọi cặp như vậy đều giống nhau thì nhịp lặp chỉ có hai phần tử.']],
      repeat: [['Tìm đoạn ngắn nhất mà khi lặp lại sẽ tạo ra đúng dãy này.', 'Đếm xem dãy đã dài bao nhiêu để biết vị trí tiếp theo rơi vào chỗ nào của đoạn lặp.']],
    },
  },
  'g01-t2': {
    young: {
      increment: [['Đọc các số từ trái sang phải nhé.', 'Nhìn xem số nào tăng không đều như các số còn lại.']],
      alternating: [['Hai hình phải thay nhau xuất hiện đều đặn.', 'Tìm chỗ hai hình giống nhau đứng liền nhau.']],
      repeat: [['Tìm nhóm nhỏ cứ lặp lại mãi.', 'So nhóm đầu với từng nhóm sau để thấy chỗ lệch.']],
    },
    older: {
      increment: [['Tính hiệu giữa các cặp số đứng cạnh nhau.', 'Vị trí nào làm hiệu đổi khác so với những chỗ còn lại thì chỗ đó có vấn đề.']],
      alternating: [['Dựa vào hai phần tử đầu để xác định nhịp thay phiên.', 'Duyệt từng vị trí; vị trí nào khác phần tử cách nó hai bước thì đáng nghi.']],
      repeat: [['Xác định đoạn lặp từ phần đầu dãy rồi đối chiếu từng đoạn sau với nó.', 'Chỗ nào khác phần tử cách đó đúng một độ dài đoạn lặp thì đó là chỗ sai.']],
    },
  },
  'g01-t3': {
    young: {
      default: [
        ['Nhìn một ví dụ: số đi vào là gì, số đi ra là gì?', 'Thử với ví dụ thứ hai xem máy làm giống nhau không.'],
        ['Máy làm cùng một việc với mọi số.', 'Nhìn xem số lúc ra to hơn, nhỏ hơn hay chỉ đổi chỗ các chữ số.'],
      ],
    },
    older: {
      default: [
        ['So số vào và số ra ở từng ví dụ để đoán việc máy làm.', 'Thử luật vừa đoán trên mọi ví dụ trước khi áp dụng cho số mới.'],
        ['Tìm điều chung ở tất cả ví dụ chứ đừng chỉ nhìn một cái.', 'Máy có thể cộng, trừ, nhân hoặc đảo chữ số; hãy thử từng khả năng với các ví dụ.'],
      ],
    },
  },
  'g02-t1': {
    young: {
      default: [
        ['Đếm xem hình mẫu có bao nhiêu ô.', 'Chọn hình có cùng số ô, rồi nhìn xem hình dạng có giống không.'],
        ['Nhìn thật kỹ hình mẫu trước nhé.', 'Hình đúng không bị xoay và cũng không bị dịch sang chỗ khác.'],
      ],
    },
    older: {
      default: [
        ['Loại ngay những hình thừa hoặc thiếu ô so với hình mẫu.', 'Với các hình còn lại, xem hình nào giữ đúng vị trí giữa các ô, không bị xoay hay dịch.'],
        ['Chọn một ô ở góc hình mẫu làm mốc rồi so từng hình.', 'Hình nào cùng mốc mà các ô xung quanh bị lệch thì không phải hình cần tìm.'],
      ],
    },
  },
  'g02-t2': {
    young: {
      rotate: [['Hãy xoay đầu theo, hoặc xoay tờ giấy trong tưởng tượng.', 'Nhìn một ô ở góc hình mẫu xem nó chạy đến đâu.']],
      flip: [['Hình này bị lật, không chỉ xoay.', 'Nhìn một ô ở góc hình mẫu xem nó nhảy sang chỗ nào.']],
    },
    older: {
      rotate: [['Chọn một ô nổi bật làm mốc rồi theo dõi nó sau khi xoay.', 'Loại những hình bị lật như soi gương, vì xoay không làm đổi mặt của hình.']],
      flip: [['Đây là phép lật, nên hãy tìm hình đã đổi mặt chứ không chỉ xoay.', 'Dùng một ô góc làm mốc và dự đoán chỗ mới của nó trước khi nhìn các hình.']],
    },
  },
  'g02-t3': {
    young: {
      fill: [['Nhìn đường chia đôi ở giữa tranh.', 'Mỗi ô có một ô bạn ở bên kia đường, giống hệt nó.']],
      'find-break': [['Hai bên của tranh phải giống nhau như soi gương.', 'Tìm chỗ hai bên không giống nhau.']],
    },
    older: {
      fill: [['Với mỗi ô, hình dung ô đối xứng với nó qua trục.', 'Ô trống cần giống ô đối xứng của nó, nên hãy xem ô đó đang là gì.']],
      'find-break': [['Đi từng ô ở một bên và so với ô đối xứng của nó ở bên kia trục.', 'Chỉ có một cặp ô khác nhau; hãy chọn ô thuộc cặp đó.']],
    },
  },
  'g03-t1': {
    young: {
      recall: [['Nhớ bạn đứng đầu tiên trước nhé.', 'Đọc thầm theo thứ tự: một, hai, ba.']],
      missing: [['Nhớ lại ô nào bị trống.', 'Nghĩ xem bạn đứng trước và bạn đứng sau ô đó là ai.']],
      swapped: [['Chú ý hai vị trí được đánh dấu.', 'Nhớ lại bạn đứng ở mỗi vị trí đó lúc đầu.']],
      grouped: [['Chia dãy thành từng nhóm nhỏ.', 'Nhớ từng nhóm một, rồi ghép lại.']],
    },
    older: {
      recall: [['Gắn các từ thành một câu chuyện ngắn để dễ nhớ thứ tự.', 'Nhớ phần đầu và phần cuối của dãy trước, rồi điền phần ở giữa.']],
      missing: [['Xác định vị trí trống rồi nhớ hai từ đứng hai bên nó.', 'Loại các từ đã xuất hiện ở những vị trí khác; từ còn lại là ứng viên.']],
      swapped: [['Chỉ tập trung vào hai vị trí được đánh dấu, đừng nhớ cả dãy.', 'Hình dung lại dãy ban đầu và đọc từ ở từng vị trí đó.']],
      grouped: [['Chia dãy theo cỡ nhóm rồi nhớ mỗi nhóm như một khối.', 'Khi trả lời, ghép các khối lại theo đúng thứ tự đã xuất hiện.']],
    },
  },
  'g03-t2': {
    young: {
      recall: [['Nhớ ô nằm ở góc hay ở giữa bảng.', 'Đếm xem có mấy ô sáng rồi chỉ lại.']],
      missing: [['Có một ô sáng đã biến mất.', 'So bảng bây giờ với lúc đầu.']],
    },
    older: {
      recall: [['Dùng các góc và mép bảng làm mốc để nhớ vị trí.', 'Nhớ theo hình các ô sáng tạo nên, chẳng hạn một hàng hay một đường chéo.']],
      missing: [['So các ô còn hiện với trí nhớ về lúc đầu để tìm ô vắng mặt.', 'Nhớ theo hàng và cột để loại dần những ô vẫn còn đó.']],
    },
  },
  'g03-t3': {
    young: {
      removed: [['Đếm xem cảnh sau còn đủ bạn không.', 'Có một bạn đã đi mất rồi.']],
      added: [['Đếm xem cảnh sau có nhiều bạn hơn không.', 'Có một bạn mới vừa đến.']],
      swapped: [['Các bạn vẫn đủ, chỉ đứng khác chỗ.', 'Nhìn từng chỗ đứng, xem ai đã đổi chỗ.']],
      property: [['Các bạn vẫn đủ và đứng yên.', 'Nhìn xem ai vừa đổi màu.']],
    },
    older: {
      removed: [['Đếm số đồ vật ở hai cảnh để biết cảnh sau thiếu hay thừa.', 'Gạch dần những đồ vật có mặt ở cả hai cảnh; đồ vật còn lại chính là điều đã đổi.']],
      added: [['Đếm số đồ vật ở hai cảnh để biết cảnh sau nhiều hơn hay ít hơn.', 'Gạch dần những đồ vật xuất hiện ở cả hai cảnh; đồ vật còn lại là đồ mới thêm.']],
      swapped: [['Số đồ vật không đổi, nên hãy so từng vị trí giữa hai cảnh.', 'Chỉ có hai vị trí khác nhau; hai đồ vật ở đó đã đổi chỗ cho nhau.']],
      property: [['Số lượng và vị trí không đổi, nên hãy so thuộc tính của từng đồ vật.', 'Đối chiếu màu sắc ở từng vị trí giữa hai cảnh để tìm chỗ khác.']],
    },
  },
  'g04-t1': {
    young: {
      default: [
        ['Đọc manh mối đầu tiên thật kỹ.', 'Bạn nào không giống manh mối thì úp xuống nhé.'],
        ['Nhìn từng bạn nhỏ một và hỏi: bạn này có khớp không?', 'Bạn nào khác manh mối ở một chỗ cũng không phải.'],
      ],
    },
    older: {
      default: [
        ['Bắt đầu từ manh mối loại được nhiều ứng viên nhất.', 'Dùng lần lượt từng manh mối để loại dần, đến khi chỉ còn một bạn khớp mọi manh mối.'],
        ['Tách các manh mối ra: manh mối nào nói về màu, manh mối nào nói về hình?', 'Với mỗi bạn, kiểm tra tất cả manh mối; chỉ cần sai một manh mối là loại.'],
      ],
    },
  },
  'g04-t2': {
    young: {
      default: [
        ['Bắt đầu từ điều bạn đã biết chắc.', 'Tìm câu Nếu - Thì nói về điều đó nhé.'],
        ['Nhìn điều đã biết ở phía trên.', 'Luật nào bắt đầu bằng điều đó thì cho ta một điều mới.'],
      ],
    },
    older: {
      default: [
        ['Đi từng bước: từ điều đã biết, dùng luật phù hợp để tìm điều mới.', 'Lặp lại với điều mới tìm được cho đến khi không suy thêm được nữa.'],
        ['Hình dung các mũi tên nối từng điều theo mỗi luật Nếu - Thì.', 'Đi theo mũi tên xuất phát từ điều đã biết; chỉ những điều đến được mới đáng chọn.'],
      ],
    },
  },
  'g04-t3': {
    young: {
      default: [
        ['Nhìn xem có mấy bạn giống bạn cần tìm.', 'Cần thêm một manh mối để chỉ còn lại đúng một bạn.'],
        ['Những điều đã biết vẫn còn nhiều bạn phù hợp.', 'Manh mối tốt là manh mối chỉ đúng với một bạn.'],
      ],
    },
    older: {
      default: [
        ['Liệt kê các bạn còn khớp với những điều đã biết.', 'Tìm đặc điểm mà bạn cần tìm có nhưng các bạn còn lại không có.'],
        ['Hỏi mình: manh mối nào giúp phân biệt bạn cần tìm với bạn dễ nhầm nhất?', 'Thử từng lựa chọn; sau khi thêm nó mà chỉ còn một bạn thì giữ lại.'],
      ],
    },
  },
  'g05-t1': {
    young: {
      replace: [['Tính tổng mỗi đĩa cân nhé.', 'Quả cân được đánh dấu sẽ đổi thành quả mới.']],
      compare: [['Xem đĩa nào nặng hơn.', 'Hai đĩa chênh nhau bao nhiêu thì cần thêm bấy nhiêu.']],
      missing: [['Cộng các quả cân đã có ở mỗi đĩa.', 'Đĩa nhẹ hơn cần thêm đúng phần còn thiếu.']],
    },
    older: {
      replace: [['Tính tổng đĩa còn lại, rồi tính phần còn lại của đĩa có quả bị thay.', 'Quả mới bằng tổng cần có trừ đi các quả còn giữ lại ở cùng đĩa.']],
      compare: [['Cộng từng đĩa rồi so hai tổng.', 'Hiệu của hai tổng chính là phần cần thêm vào đĩa nhẹ hơn.']],
      missing: [['Gọi quả còn thiếu là ẩn số rồi viết: tổng đĩa này bằng tổng đĩa kia.', 'Số cần tìm là hiệu giữa hai tổng đã biết.']],
    },
  },
  'g05-t2': {
    young: {
      groups: [['Gom các đồ vật thành từng nhóm nhỏ.', 'Đếm xem gom được mấy nhóm.']],
      remainder: [['Gom thành các nhóm bằng nhau trước.', 'Phần không đủ một nhóm là phần còn dư.']],
      needed: [['Gom thành các nhóm bằng nhau trước.', 'Xem nhóm cuối còn thiếu mấy phần mới đủ.']],
    },
    older: {
      groups: [['Hỏi mình: trong tổng số có bao nhiêu lần cỡ một nhóm?', 'Dùng phép chia, hoặc cộng dồn cỡ nhóm cho đến khi sát tổng.']],
      remainder: [['Tìm số nhóm trọn vẹn lớn nhất rồi tính phần còn lại.', 'Phần dư bằng tổng trừ đi số nhóm trọn vẹn nhân với cỡ nhóm.']],
      needed: [['Tìm phần dư khi chia đều tổng cho cỡ nhóm.', 'Phần cần thêm bằng cỡ nhóm trừ đi phần dư.']],
    },
  },
  'g05-t3': {
    young: {
      fewest: [['Thử chọn ít món trước nhé.', 'Nếu chưa đủ mục tiêu {target} thì mới thêm món khác.']],
      'exact-two': [['Chỉ chọn đúng hai món.', 'Chọn một món, rồi xem món kia phải là số nào để đủ {target}.']],
      'not-over': [['Cộng dần nhưng đừng vượt quá {target}.', 'Thử món lớn trước, rồi thêm món nhỏ.']],
      any: [['Cộng thử hai món, xem có đủ {target} không.', 'Bạn chỉ được chọn nhiều nhất {max} món.']],
    },
    older: {
      fewest: [['Bắt đầu từ các số lớn để cần ít món nhất.', 'Khi đã có một cách đạt {target}, thử thay hai món nhỏ bằng một món lớn.']],
      'exact-two': [['Với mỗi số, tính số còn thiếu để đạt {target}.', 'Kiểm tra số thiếu đó có trong giỏ không; có thì đó là cặp cần chọn.']],
      'not-over': [['Thử các tổ hợp bắt đầu từ số lớn nhất mà tổng chưa quá {target}.', 'Tổng tốt nhất là tổng lớn nhất không quá {target}; so các tổ hợp để chắc chắn.']],
      any: [['Tìm cặp hoặc bộ ba có tổng đúng {target}.', 'Giới hạn {max} món giúp bạn loại các tổ hợp quá dài.']],
    },
  },
  'g06-t1': {
    young: {
      reach: [['Đi từng ô một, tránh ô tường.', 'Nếu gặp tường thì rẽ sang hướng khác.']],
      waypoint: [['Tìm ngôi sao trên bản đồ.', 'Đi qua ngôi sao rồi mới về đích.']],
      ordered: [['Hai ngôi sao có số một và số hai.', 'Đi tới sao số một trước, sao số hai sau, rồi mới về đích.']],
      shortest: [['Mỗi bước nên đi gần đích hơn.', 'Đừng đi vòng nhé.']],
    },
    older: {
      reach: [['Nhìn cả bản đồ trước, rồi chọn hướng đi chung từ chỗ xuất phát đến đích.', 'Nếu bị chặn, quay lại và thử lối rẽ khác thay vì cố đi tiếp.']],
      waypoint: [['Chia đường đi thành hai đoạn: từ chỗ xuất phát đến ngôi sao, rồi từ ngôi sao đến đích.', 'Mỗi đoạn tự tìm đường tránh tường.']],
      ordered: [['Chia đường đi thành ba đoạn theo thứ tự các số.', 'Đoạn sau chỉ bắt đầu khi đã đến đúng ngôi sao của đoạn trước.']],
      shortest: [['Thử đếm số bước của hai lối khác nhau rồi so sánh.', 'Tránh đi lùi hoặc đi vòng; mỗi bước phải rút ngắn khoảng cách đến đích.']],
    },
  },
  'g06-t2': {
    young: {
      default: [
        ['Việc nào phải làm trước tiên?', 'Nghĩ xem ở nhà bạn làm việc đó thế nào nhé.'],
        ['Hình dung bạn đang làm việc đó thật.', 'Việc nào xong rồi mới làm được việc tiếp theo?'],
      ],
    },
    older: {
      default: [
        ['Tìm bước không cần bước nào khác đi trước, đó là bước đầu tiên.', 'Sau đó tìm bước chỉ phụ thuộc vào bước vừa đặt, và cứ thế nối tiếp.'],
        ['Với từng cặp bước, hỏi: bước nào là điều kiện của bước kia?', 'Nối các cặp lại với nhau thành một chuỗi dài từ đầu đến cuối.'],
      ],
    },
  },
  'g06-t3': {
    young: {
      default: [
        ['Đi theo từng mũi tên của robot.', 'Dừng ở chỗ robot bắt đầu đi lạc xa khỏi đích.'],
        ['Robot cần đi từ chỗ xuất phát đến đích.', 'Có một lệnh đang đi ngược hướng cần đi.'],
      ],
    },
    older: {
      default: [
        ['Mô phỏng từng lệnh và theo dõi vị trí của robot sau mỗi bước.', 'Bước làm robot lệch khỏi đường tới đích là bước cần đổi; hãy chọn hướng sao cho robot vẫn đến được đích.'],
        ['Đếm xem mỗi hướng cần bao nhiêu lệnh để đi từ chỗ xuất phát đến đích.', 'So với dãy lệnh hiện có để thấy hướng nào đang thừa hoặc thiếu.'],
      ],
    },
  },
  'g07-t1': {
    young: {
      default: [['Đọc luật mới ở phía trên thật kỹ.', 'Chỉ chọn những hình có {trait} đúng như luật.']],
    },
    older: {
      default: [['Quên luật cũ đi và dùng luật mới để xét từng hình.', 'Kiểm tra từng hình theo đặc điểm {trait}; hình nào đạt thì chọn, đừng bỏ sót hình nào.']],
    },
  },
  'g07-t2': {
    young: {
      default: [
        ['Nhìn mũi tên của bạn nhỏ.', 'Phía mũi tên chỉ là phía trước của bạn ấy.'],
        ['Hãy xoay đầu theo hướng bạn nhỏ nhìn.', 'Đồ vật ở trước mặt, sau lưng hay bên tay nào của bạn ấy?'],
      ],
    },
    older: {
      default: [
        ['Đặt mình vào chỗ bạn nhỏ và quay mặt theo hướng nhìn của bạn ấy.', 'Trước mặt, sau lưng, tay trái, tay phải của bạn ấy khác với phía trên, dưới, trái, phải của màn hình.'],
        ['Xác định hướng nhìn của bạn nhỏ, rồi hình dung trục trước sau và trái phải theo hướng đó.', 'Đặt đồ vật lên trục ấy để biết vị trí so với bạn nhỏ, không so với màn hình.'],
      ],
    },
  },
  'g07-t3': {
    young: {
      default: [['Đường xám là đường đã đi rồi.', 'Tìm một đường mới không trùng đường xám nhé.']],
    },
    older: {
      default: [['Tìm điểm đầu tiên mà bạn có thể rẽ khác đường xám.', 'Sau khi rẽ, kiểm tra không đi vào ô tường và vẫn đến được đích.']],
    },
  },
  'g08-t1': {
    young: {
      default: [
        ['So từng hàng của hai hình nhé.', 'Nhìn kỹ từng ô: hai ô cùng chỗ có giống nhau không?'],
        ['Nhìn hàng đầu tiên của hai hình trước.', 'Rồi xuống hàng thứ hai, cứ thế đến hết.'],
      ],
    },
    older: {
      default: [
        ['Quét theo hàng hoặc theo cột và so từng ô với ô cùng vị trí ở hình kia.', 'Đánh dấu mỗi chỗ khác nhau; có thể có nhiều hơn một chỗ nên đừng dừng quá sớm.'],
        ['Chia mỗi hình thành các vùng nhỏ và so lần lượt từng vùng.', 'Sau khi so xong, thử so lại theo thứ tự khác, chẳng hạn theo cột thay vì theo hàng.'],
      ],
    },
  },
  'g08-t2': {
    young: {
      default: [
        ['Tìm điều kiện thứ nhất trước.', 'Trong các hình đạt, tìm tiếp hình có điều kiện thứ hai.'],
        ['Có hai đặc điểm cần tìm.', 'Chọn hình có cả hai đặc điểm, không chỉ một.'],
      ],
    },
    older: {
      default: [
        ['Dùng điều kiện thứ nhất để loại bớt hình, rồi xét điều kiện thứ hai trong các hình còn lại.', 'Hình đúng phải thỏa cả hai điều kiện cùng lúc và có thể có nhiều hình như vậy.'],
        ['Lọc theo đặc điểm dễ nhận ra hơn trước để thu hẹp lựa chọn.', 'Với mỗi hình còn lại, kiểm tra điều kiện kia rồi quyết định chọn hay bỏ.'],
      ],
    },
  },
  'g08-t3': {
    young: {
      default: [
        ['Đọc luật chuẩn ở trên.', 'Tìm tình huống làm khác luật.'],
        ['Việc nào ở đây không nên làm?', 'Nhìn xem việc nào lạ so với các việc còn lại.'],
      ],
    },
    older: {
      default: [
        ['Đối chiếu từng tình huống với luật chuẩn.', 'Chỉ có một tình huống đi ngược luật; loại dần các tình huống phù hợp.'],
        ['Tìm điểm chung của các tình huống rồi xem tình huống nào phá vỡ điểm chung đó.', 'Đối chiếu điểm chung ấy với luật chuẩn để chắc chắn.'],
      ],
    },
  },
};

export type HintContext = Readonly<{ ageTrack: GameAgeTrack; seed: string }>;

export type HintVars = Readonly<Record<string, string | number>>;

function fill(text: string, vars: HintVars): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/** Track-specific hint pair for one board; a mode the table does not know falls back to its first mode. */
export function getTrackHints(
  gameTypeId: GameTypeId,
  ageTrack: GameAgeTrack,
  seed: string,
  mode = 'default',
  vars: HintVars = {},
): readonly [string, string] {
  const tier = isOlderTrack(ageTrack) ? 'older' : 'young';
  const modes = TRACK_HINTS[gameTypeId][tier];
  const pairs = modes[mode] ?? modes['default'] ?? Object.values(modes)[0] ?? [];
  const pair = pairs[hashSeed(`${seed}|${gameTypeId}|${tier}|${mode}|hint`) % pairs.length] as HintPair;
  return [fill(pair[0], vars), fill(pair[1], vars)];
}
