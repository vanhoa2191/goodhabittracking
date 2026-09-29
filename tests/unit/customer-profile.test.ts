import { describe, expect, it } from 'vitest';
import { isValidPhone, needsCustomerProfileCompletion, normalizePhone } from '@/lib/customer-profile';

describe('customer profile completion', () => {
  it('asks for a phone number when none is stored', () => {
    expect(needsCustomerProfileCompletion({ displayName: 'Nguyễn An', phone: null })).toBe(true);
  });

  it('asks for a name when it is blank', () => {
    expect(needsCustomerProfileCompletion({ displayName: ' ', phone: '0912345678' })).toBe(true);
  });

  it('treats a stored phone that is not a real number as missing', () => {
    expect(needsCustomerProfileCompletion({ displayName: 'Nguyễn An', phone: 'abc' })).toBe(true);
    expect(needsCustomerProfileCompletion({ displayName: 'Nguyễn An', phone: '12345' })).toBe(true);
  });

  it('does not ask again once name and a valid phone are on file', () => {
    expect(needsCustomerProfileCompletion({ displayName: 'Nguyễn An', phone: '0912345678' })).toBe(false);
  });
});

describe('phone numbers', () => {
  it.each(['0912345678', '0912 345 678', '091-234-5678', '+84 912 345 678', '(028) 3822 1234', '+1 415 555 0132'])(
    'accepts %s',
    (value) => {
      expect(isValidPhone(value)).toBe(true);
    },
  );

  it.each([undefined, null, '', '   ', 'abc', '12345678', '0912 345 67x', '+', '1234567890123456', 'kidhabit@gmail.com', '09123<script>'])(
    'rejects %s',
    (value) => {
      expect(isValidPhone(value)).toBe(false);
    },
  );

  it('stores a compact form that keeps a leading plus', () => {
    expect(normalizePhone(' +84 912-345 678 ')).toBe('+84912345678');
    expect(normalizePhone('(028) 3822 1234')).toBe('02838221234');
  });
});
