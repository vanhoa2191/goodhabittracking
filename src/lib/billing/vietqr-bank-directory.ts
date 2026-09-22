import 'server-only';

import { z } from 'zod';

const bankDirectorySchema = z.object({
  code: z.literal('00'),
  data: z.array(z.object({
    name: z.string().min(1),
    shortName: z.string().min(1),
    bin: z.coerce.string().min(1),
  })),
});

const bankNameFallbacks: Readonly<Record<string, string>> = {
  '422589': 'CIMB · Ngân hàng TNHH MTV CIMB Việt Nam',
  '458761': 'HSBC · Ngân hàng TNHH MTV HSBC (Việt Nam)',
  '533948': 'Citibank · Ngân hàng Citibank, N.A. - Chi nhánh Hà Nội',
  '546034': 'CAKE · TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank',
  '546035': 'Ubank · TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank',
  '668888': 'KBank · Ngân hàng Đại chúng TNHH Kasikornbank',
  '796500': 'DBSBank · DBS Bank Ltd - Chi nhánh Thành phố Hồ Chí Minh',
  '801011': 'Nonghyup · Ngân hàng Nonghyup - Chi nhánh Hà Nội',
  '963388': 'Timo · Ngân hàng số Timo by Ban Viet Bank',
  '970400': 'SaigonBank · Ngân hàng TMCP Sài Gòn Công Thương',
  '970403': 'Sacombank · Ngân hàng TMCP Sài Gòn Thương Tín',
  '970405': 'Agribank · Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
  '970406': 'Vikki · Ngân hàng TNHH MTV Số Vikki',
  '970407': 'Techcombank · Ngân hàng TMCP Kỹ thương Việt Nam',
  '970408': 'GPBank · Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu',
  '970409': 'BacABank · Ngân hàng TMCP Bắc Á',
  '970410': 'StandardChartered · Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam',
  '970412': 'PVcomBank · Ngân hàng TMCP Đại Chúng Việt Nam',
  '970414': 'MBV · Ngân hàng TNHH MTV Việt Nam Hiện Đại',
  '970415': 'VietinBank · Ngân hàng TMCP Công thương Việt Nam',
  '970416': 'ACB · Ngân hàng TMCP Á Châu',
  '970418': 'BIDV · Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
  '970419': 'NCB · Ngân hàng TMCP Quốc Dân',
  '970421': 'VRB · Ngân hàng Liên doanh Việt - Nga',
  '970422': 'MBBank · Ngân hàng TMCP Quân đội',
  '970423': 'TPBank · Ngân hàng TMCP Tiên Phong',
  '970424': 'ShinhanBank · Ngân hàng TNHH MTV Shinhan Việt Nam',
  '970425': 'ABBANK · Ngân hàng TMCP An Bình',
  '970426': 'MSB · Ngân hàng TMCP Hàng Hải Việt Nam',
  '970427': 'VietABank · Ngân hàng TMCP Việt Á',
  '970428': 'NamABank · Ngân hàng TMCP Nam Á',
  '970429': 'SCB · Ngân hàng TMCP Sài Gòn',
  '970430': 'PGBank · Ngân hàng TMCP Thịnh vượng và Phát triển',
  '970431': 'Eximbank · Ngân hàng TMCP Xuất Nhập khẩu Việt Nam',
  '970432': 'VPBank · Ngân hàng TMCP Việt Nam Thịnh Vượng',
  '970433': 'VietBank · Ngân hàng TMCP Việt Nam Thương Tín',
  '970434': 'IndovinaBank · Ngân hàng TNHH Indovina',
  '970436': 'Vietcombank · Ngân hàng TMCP Ngoại Thương Việt Nam',
  '970437': 'HDBank · Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh',
  '970438': 'BaoVietBank · Ngân hàng TMCP Bảo Việt',
  '970439': 'PublicBank · Ngân hàng TNHH MTV Public Việt Nam',
  '970440': 'SeABank · Ngân hàng TMCP Đông Nam Á',
  '970441': 'VIB · Ngân hàng TMCP Quốc tế Việt Nam',
  '970442': 'HongLeong · Ngân hàng TNHH MTV Hong Leong Việt Nam',
  '970443': 'SHB · Ngân hàng TMCP Sài Gòn - Hà Nội',
  '970444': 'CBBank · Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam',
  '970446': 'COOPBANK · Ngân hàng Hợp tác xã Việt Nam',
  '970448': 'OCB · Ngân hàng TMCP Phương Đông',
  '970449': 'LPBank · Ngân hàng TMCP Lộc Phát Việt Nam',
  '970452': 'KienLongBank · Ngân hàng TMCP Kiên Long',
  '970454': 'VietCapitalBank · Ngân hàng TMCP Bản Việt',
  '970455': 'IBKHN · Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh Hà Nội',
  '970456': 'IBKHCM · Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh TP. Hồ Chí Minh',
  '970457': 'Woori · Ngân hàng TNHH MTV Woori Việt Nam',
  '970458': 'UnitedOverseas · Ngân hàng United Overseas - Chi nhánh TP. Hồ Chí Minh',
  '970462': 'KookminHN · Ngân hàng Kookmin - Chi nhánh Hà Nội',
  '970463': 'KookminHCM · Ngân hàng Kookmin - Chi nhánh Thành phố Hồ Chí Minh',
  '970466': 'KEBHanaHCM · Ngân hàng KEB Hana - Chi nhánh Thành phố Hồ Chí Minh',
  '970467': 'KEBHANAHN · Ngân hàng KEB Hana - Chi nhánh Hà Nội',
  '971005': 'ViettelMoney · Tổng Công ty Dịch vụ số Viettel',
  '971011': 'VNPTMoney · VNPT Money',
  '971025': 'MoMo · CTCP Dịch Vụ Di Động Trực Tuyến',
  '971133': 'PVcomBank Pay · Ngân hàng số PVcomBank',
  '977777': 'MAFC · Công ty Tài chính TNHH MTV Mirae Asset Việt Nam',
  '999888': 'VBSP · Ngân hàng Chính sách Xã hội',
};

function fallbackBankName(bankBin: string): string {
  return bankNameFallbacks[bankBin] ?? `Ngân hàng có BIN ${bankBin}`;
}

export async function resolveVietQrBankName(bankBin: string): Promise<string> {
  try {
    const response = await fetch('https://api.vietqr.io/v2/banks', {
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return fallbackBankName(bankBin);

    const parsed = bankDirectorySchema.safeParse(await response.json());
    const bank = parsed.success
      ? parsed.data.data.find((candidate) => candidate.bin === bankBin)
      : undefined;
    if (!bank) return fallbackBankName(bankBin);

    return bank.shortName === bank.name
      ? bank.name
      : `${bank.shortName} · ${bank.name}`;
  } catch {
    return fallbackBankName(bankBin);
  }
}
