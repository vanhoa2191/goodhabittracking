// Prices for the public site, computed once at build time. The amounts must equal PLAN_PRICES in
// src/lib/billing/plan-catalog.ts (tests/unit/marketing-pricing.test.ts compares the two); this file stays
// plain ESM so the static build needs no TypeScript.

/** Pro Plus is announced, not on sale: no plan id, so no checkout link can be built for it. */
export const pricingTiers = Object.freeze({
  solo: {
    name: 'Gói Cơ bản',
    who: 'Cho nhà có một bé',
    month: { id: 'solo_monthly', amount: 39000 },
    year: { id: 'solo_yearly', amount: 399000 },
    features: ['1 hồ sơ bé', 'Khung 47 thói quen theo tuổi', 'Nhiệm vụ, sao và phần thưởng', 'Đồng bộ trên nhiều thiết bị', 'Mời người thân cùng theo dõi'],
    purchasable: true,
  },
  pro: {
    name: 'Gói Pro',
    who: 'Cho nhà có tối đa 5 bé',
    month: { id: 'monthly', amount: 59000 },
    year: { id: 'yearly', amount: 590000 },
    features: ['Tối đa 5 hồ sơ bé, mỗi bé một lộ trình', 'Mời người thân cùng theo dõi', 'Toàn bộ khung thói quen và lộ trình', 'Theo dõi tiến bộ cả nhà'],
    purchasable: true,
  },
  pro_plus: {
    name: 'Gói Pro Plus',
    who: 'Pro, thêm Huấn luyện viên thói quen',
    month: { id: null, amount: 79000 },
    year: { id: null, amount: 790000 },
    features: [
      'Mọi quyền lợi của Gói Pro',
      'Huấn luyện viên thói quen: gợi ý chia nhỏ thói quen bằng AI',
      'Tóm tắt tuần bằng AI cho ba mẹ',
      'Luôn do ba mẹ quyết định, không gửi tên hay nhật ký của bé',
    ],
    purchasable: false,
    status: 'Đang phát triển',
  },
});

const cycles = new Set(['month', 'year']);

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

/**
 * What a price card shows for one tier and billing cycle. Yearly: the full year at the monthly price, about how
 * much a month and a day, and the saving. Monthly: about how much a day (30-day month); no saving.
 */
export function priceView(tier, cycle) {
  const plan = Object.hasOwn(pricingTiers, tier) ? pricingTiers[tier] : null;
  if (!plan) throw new Error(`Unknown pricing tier: ${tier}`);
  if (!cycles.has(cycle)) throw new Error(`Unknown billing cycle: ${cycle}`);
  const { amount: price, id: planId } = plan[cycle];
  if (cycle === 'month') {
    return { tier, planId, price, fullYearPrice: null, perMonth: price, perDay: roundTo(price / 30, 10), saving: null, savingPercent: null, purchasable: plan.purchasable };
  }
  const fullYearPrice = plan.month.amount * 12;
  const saving = fullYearPrice - price;
  return {
    tier,
    planId,
    price,
    fullYearPrice,
    perMonth: roundTo(price / 12, 100),
    perDay: roundTo(price / 365, 10),
    saving,
    savingPercent: Math.round((saving / fullYearPrice) * 100),
    purchasable: plan.purchasable,
  };
}

/** The best yearly saving across the tiers, for the "Năm -17%" toggle. */
export const maxSavingPercent = Math.max(...Object.keys(pricingTiers).map((tier) => priceView(tier, 'year').savingPercent));

/** How much more Pro costs than the one-child plan for the same cycle. */
export function upgradeDifference(cycle) {
  return priceView('pro', cycle).price - priceView('solo', cycle).price;
}
