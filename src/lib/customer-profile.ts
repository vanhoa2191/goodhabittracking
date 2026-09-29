export type CustomerProfileCompletion = {
  readonly displayName: string;
  readonly phone: string | null;
};

const phoneCharacters = /^\+?[\d\s().-]+$/u;
const minPhoneDigits = 9;
const maxPhoneDigits = 15;

export function isValidPhone(value: string | null | undefined): boolean {
  const phone = value?.trim() ?? '';
  if (!phone || !phoneCharacters.test(phone)) return false;
  const digits = phone.replace(/\D/gu, '').length;
  return digits >= minPhoneDigits && digits <= maxPhoneDigits;
}

export function normalizePhone(value: string): string {
  return value.trim().replace(/[\s().-]/gu, '');
}

export function needsCustomerProfileCompletion(profile: CustomerProfileCompletion): boolean {
  return profile.displayName.trim().length < 2 || !isValidPhone(profile.phone);
}
