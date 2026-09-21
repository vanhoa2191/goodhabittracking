export type CustomerProfileCompletion = {
  readonly displayName: string;
  readonly phone: string | null;
};

export function needsCustomerProfileCompletion(profile: CustomerProfileCompletion): boolean {
  return profile.displayName.trim().length < 2 || !profile.phone?.trim();
}
