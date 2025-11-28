import type { SellerLevelRule } from "@prisma/client";

type SaleCalculationInput = {
  basePrice: number;
  discountAmount: number;
  platformFeeRate: number;
  commissionRate: number;
};

export type SaleCalculationResult = {
  revenue: number;
  priceAfterDiscount: number;
  platformFee: number;
  profitAfterPlatform: number;
  sellerCommission: number;
  netProfit: number;
};

export function calculateSaleFinancials({
  basePrice,
  discountAmount,
  platformFeeRate,
  commissionRate,
}: SaleCalculationInput): SaleCalculationResult {
  const priceAfterDiscount = Math.max(basePrice - discountAmount, 0);
  const platformFee = round(priceAfterDiscount * platformFeeRate);
  const profitAfterPlatform = round(priceAfterDiscount - platformFee);
  const sellerCommission = round(profitAfterPlatform * commissionRate);
  const netProfit = round(profitAfterPlatform - sellerCommission);

  return {
    revenue: priceAfterDiscount,
    priceAfterDiscount,
    platformFee,
    profitAfterPlatform,
    sellerCommission,
    netProfit,
  };
}

export function determineSellerLevel(
  salesCount: number,
  rules: SellerLevelRule[]
): SellerLevelRule {
  const sorted = [...rules].sort((a, b) => a.level - b.level);
  return (
    sorted.find((rule) => {
      if (rule.maxSales === null) {
        return salesCount >= rule.minSales;
      }
      return salesCount >= rule.minSales && salesCount <= rule.maxSales;
    }) ?? sorted[0]
  );
}

export function nextLevelProgress(salesCount: number, rule: SellerLevelRule) {
  if (rule.maxSales === null) {
    return { target: null, remaining: 0 };
  }

  const target = (rule.maxSales ?? 0) + 1;
  const remaining = Math.max(target - salesCount, 0);
  return { target, remaining };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

