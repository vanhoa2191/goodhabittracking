import { describe, expect, it } from 'vitest';
import { getPublishableProof, PUBLIC_PROOF_REGISTRY, type PublicProof } from '@/lib/public-proof';

describe('public proof registry', () => {
  it('publishes only product proof with evidence or current consented testimonials', () => {
    expect(getPublishableProof(new Date('2026-09-28T00:00:00.000Z'))).toEqual(PUBLIC_PROOF_REGISTRY);
    expect(PUBLIC_PROOF_REGISTRY.every((proof) => proof.kind === 'product' && proof.evidence.length > 0)).toBe(true);
  });

  it('keeps expired or unconsented testimonials out of publishable proof', () => {
    const invalid = [
      ...PUBLIC_PROOF_REGISTRY,
      { kind: 'testimonial', id: 'missing-consent', quote: 'Example', attribution: 'Parent', sourceReference: 'source', consentedAt: '', reviewAfter: '2027-01-01' },
      { kind: 'testimonial', id: 'expired', quote: 'Example', attribution: 'Parent', sourceReference: 'source', consentedAt: '2026-01-01', reviewAfter: '2026-09-01' },
    ] satisfies readonly PublicProof[];
    const publishable = getPublishableProof(new Date('2026-09-28T00:00:00.000Z'), invalid);
    expect(publishable).toHaveLength(PUBLIC_PROOF_REGISTRY.length);
    expect(publishable.some((proof) => proof.kind === 'testimonial')).toBe(false);
  });
});
