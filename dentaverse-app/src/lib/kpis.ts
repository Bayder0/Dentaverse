import { prisma } from "./prisma";
import { getPreviousMonthKey } from "./date";

export type MonthlyKpi = {
  monthKey: string;
  revenue: number;
  profit: number;
  netProfit: number;
  averageSaleValue: number;
  discountRate: number;
  grossMargin: number;
  salesCount: number;
  revenueGrowth: number | null;
  profitGrowth: number | null;
  salesGrowth: number | null;
};

function ratio(current: number, previous: number | null) {
  if (!previous || previous === 0) return null;
  return (current - previous) / previous;
}

export async function computeMonthlyMetrics(monthKey: string): Promise<MonthlyKpi> {
  const aggregation = await prisma.sale.aggregate({
    where: { monthKey },
    _sum: {
      priceBefore: true,
      priceAfterDiscount: true,
      profitAfterPlatform: true,
      netProfit: true,
      discountAmount: true,
    },
    _count: { _all: true },
  });

  const revenue = Number(aggregation._sum.priceAfterDiscount ?? 0);
  const profit = Number(aggregation._sum.profitAfterPlatform ?? 0);
  const netProfit = Number(aggregation._sum.netProfit ?? 0);
  const priceBefore = Number(aggregation._sum.priceBefore ?? 0);
  const discountTotal = Number(aggregation._sum.discountAmount ?? 0);
  const salesCount = aggregation._count._all ?? 0;

  const averageSaleValue = salesCount === 0 ? 0 : revenue / salesCount;
  const discountRate = priceBefore === 0 ? 0 : discountTotal / priceBefore;
  const grossMargin = revenue === 0 ? 0 : netProfit / revenue;

  const previousKey = getPreviousMonthKey(monthKey);
  const previousSnapshot = await prisma.monthlyKpiSnapshot.findUnique({
    where: { monthKey: previousKey },
  });

  const revenueGrowth = ratio(revenue, previousSnapshot?.revenue ? Number(previousSnapshot.revenue) : null);
  const profitGrowth = ratio(profit, previousSnapshot?.profit ? Number(previousSnapshot.profit) : null);
  const salesGrowth = ratio(
    salesCount,
    previousSnapshot?.salesCount ? Number(previousSnapshot.salesCount) : null
  );

  const payload: MonthlyKpi = {
    monthKey,
    revenue,
    profit,
    netProfit,
    averageSaleValue,
    discountRate,
    grossMargin,
    salesCount,
    revenueGrowth,
    profitGrowth,
    salesGrowth,
  };

  await prisma.monthlyKpiSnapshot.upsert({
    where: { monthKey },
    update: payload,
    create: payload,
  });

  return payload;
}

export async function getMonthlyKpiSeries(limit = 12) {
  const snapshots = await prisma.monthlyKpiSnapshot.findMany({
    orderBy: { monthKey: "desc" },
    take: limit,
  });

  if (snapshots.length === 0) {
    return [];
  }

  return snapshots
    .map((snapshot) => ({
      monthKey: snapshot.monthKey,
      revenue: Number(snapshot.revenue),
      profit: Number(snapshot.profit),
      netProfit: Number(snapshot.netProfit),
      averageSaleValue: Number(snapshot.averageSaleValue),
      discountRate: Number(snapshot.discountRate),
      grossMargin: Number(snapshot.grossMargin),
      salesCount: snapshot.salesCount,
      revenueGrowth: snapshot.revenueGrowth ? Number(snapshot.revenueGrowth) : null,
      profitGrowth: snapshot.profitGrowth ? Number(snapshot.profitGrowth) : null,
      salesGrowth: snapshot.salesGrowth ? Number(snapshot.salesGrowth) : null,
    }))
    .sort((a, b) => (a.monthKey > b.monthKey ? 1 : -1));
}









