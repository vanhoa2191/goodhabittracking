import { plans } from './site-content.mjs';

// Nội dung pháp lý dùng chung cho website giới thiệu và ứng dụng.
// Mỗi khối là một đoạn văn (chuỗi) hoặc một danh sách (mảng chuỗi).

export const legalVersion = '2026-09-29';
export const legalUpdatedLabel = '29/09/2026';

const planDescriptors = {
  solo_monthly: 'tối đa một hồ sơ bé',
  monthly: 'nhiều hồ sơ bé',
  yearly: 'nhiều hồ sơ bé, thanh toán một lần cho 12 tháng',
};

function priceLine(plan) {
  const period = plan.cadence.includes('năm') ? 'một năm' : 'một tháng';
  return `${plan.price} VNĐ cho ${period}, ${planDescriptors[plan.id]}.`;
}

function contactBlock(supportEmail, topic) {
  if (supportEmail) {
    return `${topic} Hãy gửi email tới ${supportEmail}. Không gửi mã PIN phụ huynh, mã ghép thiết bị còn hiệu lực, nội dung nhật ký của bé hoặc thông tin ngân hàng đầy đủ.`;
  }
  return `${topic} Hãy dùng kênh email hỗ trợ chính thức trong trang Liên hệ. Không gửi mã PIN phụ huynh, mã ghép thiết bị còn hiệu lực, nội dung nhật ký của bé hoặc thông tin ngân hàng đầy đủ.`;
}

export function buildLegalPages({ supportEmail = '' } = {}) {
  const privacy = {
    title: 'Chính sách quyền riêng tư',
    description: 'KidHabit Hero thu thập, sử dụng, lưu giữ và bảo vệ dữ liệu của gia đình như thế nào, cùng các lựa chọn dành cho phụ huynh.',
    sections: [
      {
        title: '1. Chính sách này áp dụng cho ai',
        blocks: [
          'KidHabit Hero là ứng dụng giúp gia đình xây dựng thói quen cho trẻ. Chính sách này giải thích KidHabit thu thập và sử dụng dữ liệu gì, lưu ở đâu, chia sẻ với ai và phụ huynh có những lựa chọn nào.',
          'KidHabit dành cho phụ huynh và người giám hộ. Trẻ không tự tạo tài khoản: trẻ chỉ dùng hồ sơ đã được phụ huynh ghép với thiết bị bằng mã QR hoặc mã nhập tay.',
          'Khi tạo gia đình và xác nhận đồng ý trong ứng dụng, bạn xác nhận mình là người lớn có quyền quản lý dữ liệu của bé và đã đọc chính sách này. Đây là bản giải thích bằng ngôn ngữ dễ hiểu, không phải tuyên bố chứng nhận tuân thủ một chế độ pháp lý cụ thể.',
        ],
      },
      {
        title: '2. Dữ liệu KidHabit thu thập',
        blocks: [
          [
            'Tài khoản phụ huynh: email và tên hiển thị từ tài khoản Google dùng để đăng nhập, số điện thoại nếu bạn tự nhập, cùng các lựa chọn nhận thông tin.',
            'Hồ sơ bé: tên hoặc biệt danh, năm sinh, nhân vật đồng hành hoặc ảnh đại diện và màu hiển thị. Bạn nên dùng biệt danh thay vì họ tên đầy đủ của bé.',
            'Hoạt động của gia đình: thói quen, nhiệm vụ, tiến độ, điểm, phần thưởng, huy hiệu và lời khen. Nếu gia đình bật thêm, còn có nhật ký một câu của bé, danh sách ước và thành phố ước mơ.',
            'Thiết bị của bé: khi ghép thiết bị, hệ thống tạo phiên đăng nhập cho đúng hồ sơ bé trên thiết bị đó. Mã ghép chỉ được lưu ở dạng đã mã hóa một chiều, không lưu mã gốc dưới dạng đọc được.',
            'Gói và thanh toán: gói đã chọn, trạng thái kích hoạt, mã đơn, số tiền và trạng thái thanh toán. KidHabit không thu thập mật khẩu hay thông tin đăng nhập ngân hàng của bạn.',
            'Lựa chọn đồng ý và dữ liệu kỹ thuật tối thiểu: lịch sử đồng ý theo phiên bản chính sách, dấu vết đã mã hóa của địa chỉ mạng để giới hạn số lần thử ghép mã, và mã lỗi để hỗ trợ.',
          ],
          'KidHabit không yêu cầu vị trí, danh bạ hay micro. Camera chỉ được dùng để quét mã QR ghép thiết bị và chỉ bật sau khi người dùng chủ động chọn quét.',
          'Chế độ trải nghiệm thử (demo) lưu dữ liệu mẫu ngay trên thiết bị của bạn và không gửi vào tài khoản thật.',
        ],
      },
      {
        title: '3. Mục đích sử dụng dữ liệu',
        blocks: [
          [
            'Đồng bộ trải nghiệm gia đình, hiển thị đúng nhiệm vụ cho từng bé và ghi nhận tiến độ.',
            'Ghép và thu hồi thiết bị của bé, bảo vệ khu vực phụ huynh bằng mã PIN và ngăn truy cập nhầm sang gia đình khác.',
            'Tạo đơn thanh toán, xác minh giao dịch, kích hoạt đúng gói và xử lý yêu cầu hoàn tiền.',
            'Hỗ trợ khách hàng, phát hiện lỗi, giữ an toàn hệ thống và chống lạm dụng.',
            'Gửi nhắc việc hoặc nội dung tiếp thị chỉ khi phụ huynh chủ động đồng ý, ở từng mục riêng.',
            'Đo lường ẩn danh chỉ khi phụ huynh bật lựa chọn này; mặc định là tắt. Dữ liệu đo lường không chứa tên, nội dung nhiệm vụ hay nhật ký của bé. Hiện dữ liệu đo lường chưa được gửi tới bên thứ ba; nếu điều này thay đổi, chính sách sẽ được cập nhật trước khi áp dụng.',
          ],
        ],
      },
      {
        title: '4. Chia sẻ dữ liệu',
        blocks: [
          'KidHabit không bán dữ liệu của bé và không dùng dữ liệu của bé để quảng cáo nhắm mục tiêu. Dữ liệu chỉ được chia sẻ trong các trường hợp sau:',
          [
            'Google, để xác thực khi bạn chọn đăng nhập bằng tài khoản Google.',
            'PayOS, để tạo và xác nhận giao dịch chuyển khoản khi bạn mua gói. PayOS nhận thông tin cần cho giao dịch, không nhận dữ liệu hồ sơ hay hoạt động của bé.',
            'Nhà cung cấp hạ tầng đám mây, để lưu trữ dữ liệu và chạy ứng dụng. Họ chỉ xử lý dữ liệu theo yêu cầu của KidHabit để cung cấp dịch vụ.',
            'Cơ quan nhà nước có thẩm quyền, khi pháp luật yêu cầu.',
          ],
        ],
      },
      {
        title: '5. Nơi lưu trữ dữ liệu',
        blocks: [
          'Dữ liệu tài khoản và gia đình được lưu trên hạ tầng đám mây đặt ngoài Việt Nam, hiện ở khu vực Sydney (Úc). Ứng dụng và trang web được phân phối qua mạng lưới toàn cầu nên dữ liệu kỹ thuật của yêu cầu truy cập có thể đi qua máy chủ ở nhiều quốc gia.',
          'Dữ liệu của chế độ demo nằm trên thiết bị của bạn và không được chuyển đi.',
        ],
      },
      {
        title: '6. Bảo mật dữ liệu',
        blocks: [
          [
            'Dữ liệu mỗi gia đình được tách biệt bằng kiểm soát truy cập ở tầng cơ sở dữ liệu, không để gia đình này xem dữ liệu của gia đình khác.',
            'Khu vực phụ huynh được bảo vệ bằng mã PIN; thiết bị của bé chỉ truy cập được hồ sơ của đúng bé đó.',
            'Có giới hạn số lần thử ghép mã. Phụ huynh có thể làm mới mã ghép hoặc thu hồi từng thiết bị bất cứ lúc nào.',
            'Kết nối được mã hóa bằng HTTPS. Xác nhận thanh toán được kiểm tra chữ ký trước khi kích hoạt gói.',
          ],
          'Không hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố ảnh hưởng đến dữ liệu của bạn, KidHabit sẽ thông báo cho bạn và cơ quan có thẩm quyền theo quy định của pháp luật.',
        ],
      },
      {
        title: '7. Lưu giữ và xóa dữ liệu',
        blocks: [
          'Dữ liệu gia đình được giữ trong khi gia đình còn sử dụng dịch vụ. KidHabit hiện chưa áp dụng thời hạn tự động xóa khi tài khoản không hoạt động.',
          'Chủ gia đình có thể xóa toàn bộ dữ liệu gia đình trong khu vực quản lý, gồm hồ sơ bé, thói quen, tiến độ, phần thưởng và thiết bị đã ghép. Việc xóa không thể tự khôi phục từ tài khoản.',
          'Bản ghi giao dịch được tách khỏi dữ liệu hồ sơ của bé và có thể được giữ lại để đối soát, xử lý hoàn tiền và thực hiện nghĩa vụ kế toán, pháp lý trong thời hạn quy định.',
        ],
      },
      {
        title: '8. Quyền và lựa chọn của phụ huynh',
        blocks: [
          [
            'Xem và chỉnh sửa hồ sơ phụ huynh và hồ sơ bé ngay trong ứng dụng.',
            'Bật hoặc tắt đo lường ẩn danh, nhắc việc và nhận thông tin tiếp thị ở từng mục riêng, và rút lại đồng ý bất cứ lúc nào. Một số tính năng có thể không dùng được nếu thiếu dữ liệu tương ứng.',
            'Xuất nhật ký của bé thành tệp CSV khi tính năng nhật ký được bật; yêu cầu bản sao các dữ liệu khác, chỉnh sửa hoặc xóa qua email hỗ trợ.',
            'Thu hồi thiết bị đã ghép hoặc xóa toàn bộ dữ liệu gia đình bằng bước xác nhận dành cho chủ gia đình.',
            'Nếu cho rằng dữ liệu bị xử lý sai, hãy liên hệ KidHabit trước; bạn cũng có quyền khiếu nại tới cơ quan nhà nước có thẩm quyền.',
          ],
        ],
      },
      {
        title: '9. Dữ liệu của trẻ em',
        blocks: [
          'Trẻ không tự nhập email, số điện thoại hay thông tin thanh toán. Mọi thiết lập về hồ sơ, thiết bị và thanh toán do phụ huynh quản lý.',
          'Bảng xếp hạng công khai mặc định tắt; tên thật của bé chỉ hiển thị khi phụ huynh chủ động bật. Nếu bạn nghĩ một trẻ đã nhập thông tin không phù hợp, hãy liên hệ để KidHabit hỗ trợ xóa.',
        ],
      },
      {
        title: '10. Cookie và lưu trữ trên thiết bị',
        blocks: [
          'KidHabit dùng cookie và bộ nhớ cục bộ cần thiết để giữ phiên đăng nhập, phiên thiết bị của bé, ngôn ngữ và giao diện. KidHabit không dùng cookie quảng cáo.',
          'Trang giới thiệu tải phông chữ từ dịch vụ Google Fonts, nên địa chỉ mạng của bạn có thể được gửi tới Google khi xem trang.',
        ],
      },
      {
        title: '11. Thay đổi chính sách',
        blocks: [
          `Phiên bản hiện tại có hiệu lực từ ${legalUpdatedLabel}. Khi thay đổi đáng kể cách xử lý dữ liệu, KidHabit sẽ cập nhật ngày hiệu lực và thông báo trong ứng dụng trước khi yêu cầu bạn đồng ý lại.`,
        ],
      },
      {
        title: '12. Liên hệ',
        blocks: [contactBlock(supportEmail, 'Nếu có câu hỏi hoặc yêu cầu về dữ liệu, gồm xem, chỉnh sửa, xuất hoặc xóa dữ liệu,')],
      },
    ],
  };

  const terms = {
    title: 'Điều khoản sử dụng',
    description: 'Các quy định khi phụ huynh và gia đình sử dụng KidHabit Hero, gồm tài khoản, thanh toán, hoàn tiền và trách nhiệm của hai bên.',
    sections: [
      {
        title: '1. Chấp nhận điều khoản',
        blocks: [
          'Khi tạo tài khoản hoặc sử dụng KidHabit Hero, bạn đồng ý với điều khoản này và với Chính sách quyền riêng tư. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.',
        ],
      },
      {
        title: '2. Dịch vụ KidHabit cung cấp',
        blocks: [
          'KidHabit là công cụ giúp gia đình tổ chức thói quen, nhiệm vụ và phần thưởng cho trẻ. Phụ huynh là người quyết định nội dung, mức độ và cách ghi nhận phù hợp với con.',
          'Nội dung trong ứng dụng không thay thế tư vấn y tế, tâm lý hay giáo dục chuyên môn, và KidHabit không cam kết một kết quả phát triển cụ thể cho trẻ.',
        ],
      },
      {
        title: '3. Tài khoản phụ huynh',
        blocks: [
          [
            'Người tạo tài khoản phải là người lớn có quyền quản lý dữ liệu của bé, như cha mẹ hoặc người giám hộ.',
            'Bạn cung cấp thông tin chính xác và chịu trách nhiệm bảo vệ tài khoản Google, mã PIN phụ huynh và các thiết bị đã ghép. Hãy thu hồi ngay thiết bị bị mất hoặc không còn sử dụng.',
            'Nếu bạn mời thêm người đồng hành trong gia đình, họ cũng phải tuân thủ điều khoản này, và chủ gia đình chịu trách nhiệm về lời mời của mình.',
          ],
        ],
      },
      {
        title: '4. Thiết bị và hồ sơ của trẻ',
        blocks: [
          'Trẻ sử dụng KidHabit thông qua mã ghép do phụ huynh cấp. Không chia sẻ mã ghép với người ngoài gia đình; hãy làm mới mã khi nghi ngờ mã bị lộ.',
          'Chế độ trải nghiệm thử (demo) chỉ lưu dữ liệu mẫu trên thiết bị của bạn, không đồng bộ vào tài khoản và có thể mất khi xóa dữ liệu trình duyệt.',
        ],
      },
      {
        title: '5. Dùng thử 7 ngày',
        blocks: [
          'Mỗi gia đình đủ điều kiện có thể kích hoạt một lần dùng thử 7 ngày. Không cần thẻ tín dụng và KidHabit không tự động trừ tiền khi thời gian dùng thử kết thúc.',
        ],
      },
      {
        title: '6. Gói trả phí và thanh toán',
        blocks: [
          'Các gói trả phí hiện có:',
          plans.map(priceLine),
          'Giá, thời hạn và quyền lợi áp dụng cho đơn được hiển thị trước khi bạn tạo mã thanh toán. Thanh toán bằng VNĐ qua chuyển khoản do PayOS xử lý, hiện phục vụ người dùng tại Việt Nam.',
          'Mỗi khoản thanh toán chỉ áp dụng cho kỳ đã chọn. KidHabit không tự động gia hạn hoặc tự động ghi nợ kỳ tiếp theo; khi hết hạn, bạn chủ động chọn và thanh toán lại nếu muốn tiếp tục.',
          'Gói được kích hoạt sau khi PayOS xác nhận giao dịch. Nếu đã chuyển khoản mà gói chưa được kích hoạt, hãy gửi mã đơn và thời điểm giao dịch tới email hỗ trợ.',
          'KidHabit có thể thay đổi giá hoặc quyền lợi của các gói. Thay đổi chỉ áp dụng cho đơn mới, không ảnh hưởng kỳ bạn đã thanh toán.',
        ],
      },
      {
        title: '7. Hoàn tiền trong 30 ngày',
        blocks: [
          'Nếu chưa hài lòng, bạn có thể yêu cầu hoàn tiền trong vòng 30 ngày kể từ ngày thanh toán. Hãy gửi mã đơn và thời điểm thanh toán tới email hỗ trợ. Yêu cầu được xác minh theo dữ liệu giao dịch.',
          'Ứng dụng chưa có nút hoàn tiền tự động nên yêu cầu được xử lý qua email. Cách này cũng áp dụng khi chuyển khoản nhầm hoặc thanh toán trùng. Không gửi ảnh có đầy đủ số tài khoản hoặc dữ liệu của trẻ.',
        ],
      },
      {
        title: '8. Nội dung của gia đình',
        blocks: [
          'Nội dung bạn nhập vào KidHabit, như tên thói quen, nhiệm vụ, phần thưởng và nhật ký, vẫn thuộc về gia đình bạn. Bạn cho phép KidHabit lưu và xử lý nội dung đó chỉ để cung cấp dịch vụ cho gia đình bạn.',
        ],
      },
      {
        title: '9. Hành vi không được phép',
        blocks: [
          [
            'Truy cập dữ liệu của gia đình khác, chia sẻ phiên đăng nhập hoặc tìm cách vượt giới hạn bảo mật.',
            'Dùng ứng dụng để quấy rối, làm nhục, ép buộc trẻ hoặc đăng nội dung xâm phạm quyền của người khác.',
            'Can thiệp vào hệ thống thanh toán, giả mạo giao dịch, gửi yêu cầu tự động hoặc gây gián đoạn dịch vụ.',
          ],
        ],
      },
      {
        title: '10. Tính sẵn sàng và thay đổi dịch vụ',
        blocks: [
          'KidHabit cố gắng duy trì dịch vụ ổn định nhưng không cam kết dịch vụ không bao giờ gián đoạn. KidHabit có thể tạm dừng tính năng để bảo trì, xử lý sự cố hoặc bảo vệ gia đình, và có thể thay đổi hoặc ngừng một tính năng khi cần.',
        ],
      },
      {
        title: '11. Trách nhiệm của KidHabit',
        blocks: [
          'Dịch vụ được cung cấp theo hiện trạng. Trong phạm vi pháp luật cho phép, KidHabit không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc gián đoạn dịch vụ hoặc từ các sự kiện nằm ngoài kiểm soát hợp lý. Điều này không ảnh hưởng đến các quyền mà pháp luật bảo vệ người tiêu dùng dành cho bạn.',
        ],
      },
      {
        title: '12. Chấm dứt và xóa dữ liệu',
        blocks: [
          'Bạn có thể ngừng sử dụng và xóa dữ liệu gia đình trong ứng dụng bất cứ lúc nào; việc xóa không thể tự khôi phục. Xem thêm Chính sách quyền riêng tư.',
          'KidHabit có thể tạm ngừng tài khoản vi phạm điều khoản này, và sẽ thông báo cho bạn khi có thể.',
        ],
      },
      {
        title: '13. Thay đổi điều khoản và luật áp dụng',
        blocks: [
          `Phiên bản hiện tại có hiệu lực từ ${legalUpdatedLabel}. Khi thay đổi đáng kể, KidHabit sẽ cập nhật ngày hiệu lực và thông báo trước khi yêu cầu bạn đồng ý lại. Điều khoản này được điều chỉnh theo pháp luật Việt Nam.`,
        ],
      },
      {
        title: '14. Liên hệ',
        blocks: [contactBlock(supportEmail, 'Nếu có câu hỏi về điều khoản, thanh toán hoặc hoàn tiền,')],
      },
    ],
  };

  return { privacy, terms };
}
