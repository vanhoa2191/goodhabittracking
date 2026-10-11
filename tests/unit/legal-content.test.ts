import { describe, expect, it } from 'vitest';
import { buildLegalPages, legalUpdatedLabel, legalVersion } from '../../apps/marketing/legal-content.mjs';
import { plans } from '../../apps/marketing/site-content.mjs';

type Block = string | readonly string[];

function flatten(page: { sections: ReadonlyArray<{ title: string; blocks: readonly Block[] }> }) {
  return page.sections.flatMap((section) => [section.title, ...section.blocks.flat()]).join('\n');
}

describe('shared legal content', () => {
  const { privacy, terms } = buildLegalPages({ supportEmail: 'support@example.com' });
  const privacyText = flatten(privacy);
  const termsText = flatten(terms);

  it('carries a dated version that matches the visible update label', () => {
    expect(legalVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const [year, month, day] = legalVersion.split('-');
    expect(legalUpdatedLabel).toBe(`${day}/${month}/${year}`);
  });

  it('describes the data, recipients, storage location and parental controls the product really has', () => {
    for (const phrase of ['Google', 'PayOS', 'Sydney', 'không bán dữ liệu', 'xóa toàn bộ dữ liệu gia đình', 'nhật ký', 'Camera chỉ được dùng để quét mã QR']) {
      expect(privacyText).toContain(phrase);
    }
  });

  it('discloses the identity-free sign-in cookie shared by the site and the app', () => {
    expect(privacyText).toContain('cookie báo hiệu “đã đăng nhập”');
    expect(privacyText).toContain('không chứa thông tin cá nhân hay phiên đăng nhập');
    expect(privacyText).toContain('hết hạn sau 7 ngày');
  });

  it('does not promise anything the product does not do', () => {
    expect(privacyText).not.toMatch(/tuân thủ (GDPR|COPPA|Nghị định)/i);
    expect(privacyText).not.toMatch(/(đảm bảo|cam kết)[^.]*tuyệt đối/);
    expect(privacyText).toContain('Không hệ thống nào an toàn tuyệt đối');
    expect(termsText).not.toMatch(/tự động gia hạn cho/);
  });

  it('builds the price list from the same plans the marketing pricing page sells', () => {
    for (const plan of plans) {
      expect(termsText).toContain(`${plan.price} VNĐ`);
    }
    expect(termsText).toContain('Không cần thẻ tín dụng');
    expect(termsText).toContain('không tự động gia hạn');
  });

  it('states the 30-day refund rule and the trial rule', () => {
    expect(termsText).toContain('Hoàn tiền trong 30 ngày');
    expect(termsText).toContain('trong vòng 30 ngày kể từ ngày thanh toán');
    expect(termsText).toContain('dùng thử 7 ngày');
  });

  it('discloses each promo price, duration, cap, cutoff, referral exclusion and refund seat revocation', () => {
    const blocks = terms.sections.flatMap((section) => section.blocks.flat());
    const upsell = blocks.find((block) => typeof block === 'string' && block.startsWith('Ưu đãi nâng cấp Pro Plus:')) as string;
    const b1g1 = blocks.find((block) => typeof block === 'string' && block.startsWith('Ưu đãi mua 1 năm tặng 1 năm:')) as string;
    expect(upsell).toContain('690.000đ');
    expect(upsell).toContain('1 năm');
    expect(upsell).toContain('200');
    expect(upsell).toContain('không có ngày kết thúc');
    expect(b1g1).toContain('790.000đ');
    expect(b1g1).toContain('2 năm');
    expect(b1g1).toContain('100');
    expect(b1g1).toContain('31/12/2026');
    expect(b1g1).toContain('Asia/Saigon');
    for (const block of [upsell, b1g1]) {
      expect(block).toContain('không cộng dồn');
      expect(block).toContain('10%');
      expect(block).toContain('30 ngày');
      expect(block).toContain('thu hồi');
    }
  });

  it('shows the support mailbox when configured and falls back to the contact page otherwise', () => {
    expect(privacyText).toContain('support@example.com');
    expect(termsText).toContain('support@example.com');
    const without = buildLegalPages();
    expect(flatten(without.privacy)).not.toContain('@');
    expect(flatten(without.privacy)).toContain('trang Liên hệ');
  });
});
