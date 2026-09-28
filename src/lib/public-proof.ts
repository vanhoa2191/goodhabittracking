export type PublicProductProof = {
  readonly kind: 'product';
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly statement: string;
  readonly evidence: readonly string[];
  readonly reviewedAt: string;
};

export type PublicTestimonialProof = {
  readonly kind: 'testimonial';
  readonly id: string;
  readonly quote: string;
  readonly attribution: string;
  readonly sourceReference: string;
  readonly consentedAt: string;
  readonly reviewAfter: string;
};

export type PublicProof = PublicProductProof | PublicTestimonialProof;

export const PUBLIC_PROOF_REGISTRY: readonly PublicProof[] = [
  {
    kind: 'product',
    id: 'demo-without-account',
    icon: '⚡',
    title: 'Thử trước khi đăng ký',
    statement: 'Ba mẹ có thể mở bản demo và chạm thử hành trình của trẻ mà chưa cần tạo tài khoản.',
    evidence: ['tests/e2e/entry-journey.spec.ts', 'src/lib/store/use-local-family-lifecycle.ts'],
    reviewedAt: '2026-09-28',
  },
  {
    kind: 'product',
    id: 'trial-without-renewal',
    icon: '🎁',
    title: '7 ngày trải nghiệm, không tự gia hạn',
    statement: 'Giai đoạn trải nghiệm không yêu cầu thẻ tín dụng và ứng dụng không có cơ chế tự động trừ tiền khi hết hạn.',
    evidence: ['src/app/api/entitlement/trial/route.ts', 'src/lib/payos.ts'],
    reviewedAt: '2026-09-28',
  },
  {
    kind: 'product',
    id: 'separate-family-surfaces',
    icon: '👨‍👩‍👧',
    title: 'Mỗi người thấy đúng việc của mình',
    statement: 'Trẻ đã ghép thiết bị vào thẳng giao diện của trẻ; phụ huynh đã đăng nhập vào thẳng khu vực quản lý.',
    evidence: ['tests/e2e/entry-journey.spec.ts'],
    reviewedAt: '2026-09-28',
  },
];

export function getPublishableProof(now: Date = new Date(), registry: readonly PublicProof[] = PUBLIC_PROOF_REGISTRY): readonly PublicProof[] {
  return registry.filter((proof) => {
    if (proof.kind === 'product') return proof.evidence.length > 0;
    const reviewAfter = Date.parse(proof.reviewAfter);
    return Boolean(proof.sourceReference && proof.consentedAt)
      && Number.isFinite(reviewAfter)
      && reviewAfter > now.getTime();
  });
}
