import { getMonthlyKpiSeries } from "@/lib/kpis";
import { formatCurrency, formatPercent } from "@/lib/format";
import { RevenueTrendChart } from "@/components/charts/revenue-trend";
import { BarChart3, Stethoscope } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const series = await getMonthlyKpiSeries(12);
  const latest = series.at(-1);

  const aggregations = {
    quarter: aggregate(series, 3),
    half: aggregate(series, 6),
    year: aggregate(series, 12),
  };

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-100 rounded-full -mr-40 -mt-40 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-200 rounded-full -ml-30 opacity-15"></div>
      <header className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-base uppercase tracking-[0.3em] font-bold text-cyan-600">Analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-cyan-500 opacity-60" />
          <h1 className="text-3xl font-bold text-cyan-900">KPIs, trends and month-over-month checks</h1>
        </div>
        <p className="text-base text-cyan-700 mt-2">Discount rate, average sale value, revenue and profit growth.</p>
      </header>

      {latest ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Average sale value" value={formatCurrency(latest.averageSaleValue)} helper="per enrollment" />
          <KpiCard label="Discount rate" value={formatPercent(latest.discountRate)} helper="vs. list price" />
          <KpiCard
            label="Revenue growth"
            value={latest.revenueGrowth ? formatPercent(latest.revenueGrowth) : "n/a"}
            helper="vs previous month"
          />
          <KpiCard
            label="Sales count growth"
            value={latest.salesGrowth ? formatPercent(latest.salesGrowth) : "n/a"}
            helper="vs previous month"
          />
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Revenue & net profit trend</h2>
        <p className="text-sm text-slate-500">12 months rolling view</p>
        <div className="mt-4">
          <RevenueTrendChart data={series.map((item) => ({ monthKey: item.monthKey, revenue: item.revenue, netProfit: item.netProfit }))} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Timeframe comparison</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Period</th>
                <th>Revenue</th>
                <th>Net profit</th>
                <th>Sales count</th>
                <th>Gross margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 font-medium text-slate-900">Quarter (last 3 months)</td>
                <td>{formatCurrency(aggregations.quarter.revenue)}</td>
                <td>{formatCurrency(aggregations.quarter.netProfit)}</td>
                <td>{aggregations.quarter.sales}</td>
                <td>{formatPercent(aggregations.quarter.grossMargin)}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-slate-900">Half-year (6 months)</td>
                <td>{formatCurrency(aggregations.half.revenue)}</td>
                <td>{formatCurrency(aggregations.half.netProfit)}</td>
                <td>{aggregations.half.sales}</td>
                <td>{formatPercent(aggregations.half.grossMargin)}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-slate-900">Year-to-date (12 months)</td>
                <td>{formatCurrency(aggregations.year.revenue)}</td>
                <td>{formatCurrency(aggregations.year.netProfit)}</td>
                <td>{aggregations.year.sales}</td>
                <td>{formatPercent(aggregations.year.grossMargin)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">KPI snapshots</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Month</th>
                <th>Revenue</th>
                <th>Net profit</th>
                <th>Avg sale</th>
                <th>Discount rate</th>
                <th>Gross margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {series.map((item) => (
                <tr key={item.monthKey}>
                  <td className="py-2 font-medium text-slate-900">{item.monthKey}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>{formatCurrency(item.netProfit)}</td>
                  <td>{formatCurrency(item.averageSaleValue)}</td>
                  <td>{formatPercent(item.discountRate)}</td>
                  <td>{formatPercent(item.grossMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function aggregate(series: Awaited<ReturnType<typeof getMonthlyKpiSeries>>, months: number) {
  const slice = series.slice(-months);
  const totals = slice.reduce(
    (acc, item) => {
      acc.revenue += item.revenue;
      acc.netProfit += item.netProfit;
      acc.sales += item.salesCount;
      acc.gross += item.grossMargin;
      return acc;
    },
    { revenue: 0, netProfit: 0, sales: 0, gross: 0 }
  );
  const grossMargin = slice.length === 0 ? 0 : totals.gross / slice.length;
  return { revenue: totals.revenue, netProfit: totals.netProfit, sales: totals.sales, grossMargin };
}

function KpiCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{helper}</p>
    </div>
  );
}


