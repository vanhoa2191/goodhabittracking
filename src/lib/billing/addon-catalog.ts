/** Things a family buys on top of a plan. They never touch `user_subscriptions`, earn no commission and get no referral discount. */
export const ADDON_IDS = ['ai_addon_monthly', 'printables'] as const;
export type AddonId = (typeof ADDON_IDS)[number];

/** Prices in VND. The AI add-on adds one month per payment; printables is a one-time purchase. */
export const ADDON_PRICES: Readonly<Record<AddonId, number>> = {
  ai_addon_monthly: 29000,
  printables: 99000,
};

export function isAddonId(value: unknown): value is AddonId {
  return typeof value === 'string' && (ADDON_IDS as readonly string[]).includes(value);
}

/** Printables stays hidden from customers until the sale flag is on. */
export function addonVisible(id: AddonId, flags: { readonly printablesSale: boolean }): boolean {
  return id === 'printables' ? flags.printablesSale : true;
}
