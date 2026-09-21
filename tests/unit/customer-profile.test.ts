import { describe, expect, it } from 'vitest';
import { needsCustomerProfileCompletion } from '@/lib/customer-profile';

describe('customer profile completion', () => {
  it('requires a phone after Google sign-in', () => {
    expect(needsCustomerProfileCompletion({ displayName: 'Nguyễn An', phone: null })).toBe(true);
  });

  it('requires a valid full name even when a phone exists', () => {
    expect(needsCustomerProfileCompletion({ displayName: ' ', phone: '0912345678' })).toBe(true);
  });

  it('accepts a complete customer profile', () => {
    expect(needsCustomerProfileCompletion({ displayName: 'Nguyễn An', phone: '0912345678' })).toBe(false);
  });
});
