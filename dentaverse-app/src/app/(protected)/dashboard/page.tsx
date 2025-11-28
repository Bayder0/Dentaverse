import { prisma } from "@/lib/prisma";
import { getMonthKey } from "@/lib/date";
import { computeMonthlyMetrics, getMonthlyKpiSeries } from "@/lib/kpis";
import { getBucketTree } from "@/lib/buckets";
import { formatCurrency, formatPercent } from "@/lib/format";
import { RevenueTrendChart } from "@/components/charts/revenue-trend";
import { MonthSelector } from "@/components/month-selector";
import { LayoutDashboard, Stethoscope } from "lucide-react";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ months?: string | string[] }> | { months?: string | string[] };
}) {
  // Handle both Promise and direct object for searchParams (Next.js 15 compatibility)
  const params = searchParams instanceof Promise ? await searchParams : (searchParams || {});
  
  const now = new Date();
  const monthsParam = params?.months;
  let selectedMonths: string[];
  
  if (!monthsParam) {
    selectedMonths = [getMonthKey(now)];
  } else if (Array.isArray(monthsParam)) {
    selectedMonths = monthsParam.filter(Boolean);
  } else if (typeof monthsParam === "string") {
    selectedMonths = monthsParam.split(",").filter(Boolean).map(m => m.trim());
  } else {
    selectedMonths = [getMonthKey(now)];
  }
  
  if (selectedMonths.length === 0) {
    selectedMonths = [getMonthKey(now)];
  }

  // Ensure all month keys are valid format (YYYY-MM)
  const validMonths = selectedMonths.filter(m => /^\d{4}-\d{2}$/.test(m));
  if (validMonths.length === 0) {
    validMonths.push(getMonthKey(now));
  }

  // Get current user session to check role
  const session = await getSession();
  const userRole = session?.user?.role;
  const isOwner = userRole === "OWNER";
  const isSeller = userRole === "SELLER";
  
  // If seller, get their seller profile to filter by their sales only
  let sellerProfileId: string | null = null;
  if (isSeller && session?.user?.id) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    sellerProfileId = sellerProfile?.id || null;
  }

  // Build where clause - filter by months and seller (if seller)
  const salesWhere: any = {
    monthKey: { in: validMonths },
  };
  if (isSeller && sellerProfileId) {
    salesWhere.sellerId = sellerProfileId;
  }

  // Query ONLY sales records that match the selected months (and seller if applicable)
  const [salesAggregation, series, bucketTree, sellerGroups, courseGroups, recentSales] = await Promise.all([
    prisma.sale.aggregate({
      where: salesWhere,
      _sum: {
        priceBefore: true,
        priceAfterDiscount: true,
        profitAfterPlatform: true,
        netProfit: true,
        discountAmount: true,
      },
      _count: { _all: true },
    }),
    getMonthlyKpiSeries(8),
    isOwner ? getBucketTree(validMonths) : Promise.resolve([]),
    prisma.sale.groupBy({
      where: salesWhere,
      by: ["sellerId"],
      _sum: {
        priceAfterDiscount: true,
        netProfit: true,
        sellerCommission: true,
      },
      _count: { _all: true },
    }),
    prisma.sale.groupBy({
      where: salesWhere,
      by: ["courseId"],
      _sum: {
        priceAfterDiscount: true,
        netProfit: true,
      },
      _count: { _all: true },
    }),
    prisma.sale.findMany({
      where: salesWhere,
      orderBy: { saleDate: "desc" },
      take: 10,
      include: {
        course: true,
        seller: {
          include: { user: true },
        },
        discount: true,
      },
    }),
  ]);

  // Calculate KPIs from aggregated sales data for selected months ONLY
  // These values come directly from sales records filtered by monthKey
  // If no sales exist for the selected months, all values will be 0
  const revenue = Number(salesAggregation._sum.priceAfterDiscount ?? 0);
  const profit = Number(salesAggregation._sum.profitAfterPlatform ?? 0);
  const netProfit = Number(salesAggregation._sum.netProfit ?? 0);
  const priceBefore = Number(salesAggregation._sum.priceBefore ?? 0);
  const discountTotal = Number(salesAggregation._sum.discountAmount ?? 0);
  const salesCount = salesAggregation._count._all ?? 0;

  const kpis = {
    revenue,
    profit,
    netProfit,
    averageSaleValue: salesCount === 0 ? 0 : revenue / salesCount,
    discountRate: priceBefore === 0 ? 0 : discountTotal / priceBefore,
    grossMargin: revenue === 0 ? 0 : netProfit / revenue,
    salesCount,
    revenueGrowth: null,
    profitGrowth: null,
    salesGrowth: null,
  };

  const sellerIds = sellerGroups.map((group) => group.sellerId).filter((id): id is string => Boolean(id));
  const sellers = await prisma.sellerProfile.findMany({
    where: { id: { in: sellerIds } },
    include: { user: true },
  });

  const sellerLookup = new Map(sellers.map((seller) => [seller.id, seller]));

  const topSellers = sellerGroups
    .filter((group) => group.sellerId)
    .map((group) => ({
      seller: sellerLookup.get(group.sellerId!),
      salesCount: group._count._all,
      revenue: Number(group._sum.priceAfterDiscount ?? 0),
      netProfit: Number(group._sum.netProfit ?? 0),
      commission: Number(group._sum.sellerCommission ?? 0),
    }))
    .filter((item) => item.seller)
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 5);

  // For sellers, get their total commission
  const sellerCommission = isSeller && sellerProfileId 
    ? (topSellers.find(s => s.seller?.id === sellerProfileId)?.commission ?? 0)
    : 0;

  const courses = await prisma.course.findMany({
    where: { id: { in: courseGroups.map((group) => group.courseId) } },
  });

  const courseLookup = new Map(courses.map((course) => [course.id, course]));

  const coursePerformance = courseGroups
    .map((group) => ({
      course: courseLookup.get(group.courseId),
      revenue: Number(group._sum.priceAfterDiscount ?? 0),
      netProfit: Number(group._sum.netProfit ?? 0),
      count: group._count._all,
    }))
    .filter((item) => item.course)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  const primaryBuckets = [...bucketTree].sort((a, b) => b.remaining - a.remaining).slice(0, 3);

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-100 rounded-full -mr-40 -mt-40 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-200 rounded-full -ml-30 opacity-15"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-base uppercase tracking-[0.3em] font-bold text-cyan-600">Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-cyan-500 opacity-60" />
          <h1 className="text-3xl font-bold text-cyan-900">Overview & Statistics</h1>
        </div>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <MonthSelector />
          <div className="text-sm text-cyan-600">
            {isSeller ? (
              <span>Your statistics for: <span className="font-semibold">{validMonths.length === 1 ? validMonths[0] : `${validMonths.length} months`}</span></span>
            ) : validMonths.length === 1 ? (
              <span>Showing data for: <span className="font-semibold">{validMonths[0]}</span></span>
            ) : (
              <span>Aggregating <span className="font-semibold">{validMonths.length} months</span>: {validMonths.slice(0, 3).join(", ")}{validMonths.length > 3 ? "..." : ""}</span>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{isSeller ? "Your Revenue" : "Revenue"}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(kpis.revenue)}</p>
          <p className="text-xs text-slate-400">Avg sale {formatCurrency(kpis.averageSaleValue)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{isSeller ? "Your Commission" : "Net Profit"}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(isSeller ? sellerCommission : kpis.netProfit)}
          </p>
          <p className="text-xs text-emerald-600">
            {isSeller ? `${kpis.salesCount} sales` : `Gross margin ${formatPercent(kpis.grossMargin)}`}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Discount Rate</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(kpis.discountRate)}</p>
          <p className="text-xs text-slate-400">{kpis.salesCount} sales</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Profit growth vs prev.</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {kpis.profitGrowth ? formatPercent(kpis.profitGrowth) : "n/a"}
          </p>
          <p className="text-xs text-slate-400">Automatically compared</p>
        </div>
      </section>

      {!isSeller && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Revenue vs net profit</h2>
                <p className="text-sm text-slate-500">Rolling 8 months</p>
              </div>
            </div>
            <div className="mt-4">
              <RevenueTrendChart data={series.map((item) => ({ monthKey: item.monthKey, revenue: item.revenue, netProfit: item.netProfit }))} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Funds available</h2>
            <p className="text-sm text-slate-500">Key allocation buckets</p>
            <div className="mt-4 space-y-4">
              {primaryBuckets.map((bucket) => (
                <div key={bucket.id}>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{bucket.label}</p>
                    <p>{formatCurrency(bucket.remaining)}</p>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{
                        width: `${bucket.inflow === 0 ? 0 : Math.min((bucket.remaining / bucket.inflow) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Used {formatCurrency(bucket.used)} of {formatCurrency(bucket.inflow)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!isSeller && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Top sellers</h2>
                <p className="text-sm text-slate-500">Current month performance</p>
              </div>
            </div>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Seller</th>
                <th>Sales</th>
                <th>Revenue</th>
                <th>Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topSellers.map((item) => (
                <tr key={item.seller!.id}>
                  <td className="py-2">
                    <p className="font-medium text-slate-900">{item.seller?.user?.name ?? "Seller"}</p>
                    <p className="text-xs text-slate-400">Level {item.seller?.level}</p>
                  </td>
                  <td>{item.salesCount}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>{formatCurrency(item.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Course mix</h2>
          <p className="text-sm text-slate-500">Which programs drive value</p>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Course</th>
                <th>Sales</th>
                <th>Revenue</th>
                <th>Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coursePerformance.map((item) => (
                <tr key={item.course!.id}>
                  <td className="py-2 font-medium text-slate-900">{item.course?.name}</td>
                  <td>{item.count}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>{formatCurrency(item.netProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{isSeller ? "Your Recent Sales" : "Recent sales"}</h2>
            <p className="text-sm text-slate-500">{isSeller ? "Your latest entries" : "Latest entries and their allocation"}</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Date</th>
                <th>Course</th>
                <th>Seller</th>
                <th>Revenue</th>
                <th>Net</th>
                <th>Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="py-2">{new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td>
                    <p className="font-medium text-slate-900">{sale.course.name}</p>
                    <p className="text-xs text-slate-400">{sale.course.type}</p>
                  </td>
                  <td>{sale.seller?.user?.name ?? "N/A"}</td>
                  <td>{formatCurrency(Number(sale.priceAfterDiscount))}</td>
                  <td>{formatCurrency(Number(sale.netProfit))}</td>
                  <td>{sale.discount?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


