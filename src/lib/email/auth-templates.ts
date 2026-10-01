import {
  emailButton,
  emailCodeBox,
  emailMutedNote,
  emailParagraph,
  renderEmailShell,
} from './layout.ts';

// Templates pasted into Supabase → Authentication → Emails. Go-template placeholders ({{ .Token }},
// {{ .ConfirmationURL }}, {{ .NewEmail }}) are filled in by Supabase, so they pass through untouched.

export type AuthEmailTemplate = {
  readonly file: string;
  readonly dashboardName: string;
  readonly subject: string;
  readonly html: string;
};

const IGNORE_NOTE = 'Nếu bạn không yêu cầu thư này, cứ bỏ qua; không có gì thay đổi với tài khoản của bạn.';
const FOOTER = 'Thư tự động từ KidHabit Hero, vui lòng không trả lời. KidHabit Hero không bao giờ hỏi mật khẩu, mã PIN phụ huynh hay thông tin thẻ qua email.<br>KidHabit Hero · kidhabithero.com';

const codeBody = (intro: string, expiry: string) =>
  emailParagraph(intro)
  + emailCodeBox('{{ .Token }}')
  + emailParagraph(expiry)
  + emailMutedNote(`Không chia sẻ mã này với bất kỳ ai. ${IGNORE_NOTE}`);

const linkBody = (intro: string, label: string) =>
  emailParagraph(intro)
  + emailButton(label, '{{ .ConfirmationURL }}')
  + emailMutedNote(`Nút không mở được? Dán liên kết này vào trình duyệt:<br><span style="word-break:break-all">{{ .ConfirmationURL }}</span><br><br>${IGNORE_NOTE}`);

function template(
  file: string,
  dashboardName: string,
  subject: string,
  preheader: string,
  bodyHtml: string,
): AuthEmailTemplate {
  return {
    file,
    dashboardName,
    subject,
    html: renderEmailShell({ lang: 'vi', title: subject, preheader, bodyHtml, footerNote: FOOTER }),
  };
}

export const AUTH_EMAIL_TEMPLATES: readonly AuthEmailTemplate[] = [
  // Used by the one-time code login (signInWithOtp); the mail carries the code only, no link.
  template(
    'magic-link.html',
    'Magic link',
    'Mã đăng nhập KidHabit Hero của bạn',
    'Mã gồm 6 chữ số, dùng một lần, hết hạn sau 10 phút.',
    codeBody(
      'Xin chào! Nhập mã dưới đây vào màn hình đăng nhập KidHabit Hero để vào hồ sơ phụ huynh.',
      'Mã dùng một lần và hết hạn sau <strong>10 phút</strong>.',
    ),
  ),
  // First sign-in of a new address also arrives through this template when email confirmation is on.
  template(
    'confirm-signup.html',
    'Confirm sign up',
    'Chào mừng đến với KidHabit Hero: xác nhận email',
    'Nhập mã này để xác nhận email và bắt đầu.',
    codeBody(
      'Cảm ơn bạn đã tạo tài khoản phụ huynh KidHabit Hero. Nhập mã dưới đây để xác nhận email và bắt đầu thiết lập hồ sơ cho bé.',
      'Mã dùng một lần và hết hạn sau <strong>10 phút</strong>.',
    ),
  ),
  template(
    'invite.html',
    'Invite user',
    'Bạn được mời vào KidHabit Hero',
    'Chấp nhận lời mời để tạo tài khoản.',
    linkBody('Bạn được mời tham gia KidHabit Hero. Bấm nút bên dưới để chấp nhận lời mời và tạo tài khoản.', 'Chấp nhận lời mời'),
  ),
  template(
    'recovery.html',
    'Reset password',
    'Khôi phục quyền truy cập KidHabit Hero',
    'Bấm nút để quay lại tài khoản của bạn.',
    linkBody('Chúng tôi nhận được yêu cầu khôi phục quyền truy cập tài khoản KidHabit Hero của bạn. Bấm nút bên dưới để tiếp tục.', 'Khôi phục tài khoản'),
  ),
  template(
    'email-change.html',
    'Change email address',
    'Xác nhận email mới cho KidHabit Hero',
    'Xác nhận để đổi email đăng nhập.',
    linkBody('Bạn muốn đổi email đăng nhập KidHabit Hero sang <strong>{{ .NewEmail }}</strong>. Bấm nút bên dưới để xác nhận thay đổi.', 'Xác nhận email mới'),
  ),
  template(
    'reauthentication.html',
    'Reauthentication',
    'Mã xác nhận thao tác trên KidHabit Hero',
    'Nhập mã này để xác nhận thao tác nhạy cảm.',
    codeBody(
      'Để bảo vệ tài khoản, KidHabit Hero cần xác nhận lại danh tính của bạn trước khi tiếp tục. Nhập mã dưới đây vào ứng dụng.',
      'Mã dùng một lần và hết hạn sau <strong>10 phút</strong>.',
    ),
  ),
];
