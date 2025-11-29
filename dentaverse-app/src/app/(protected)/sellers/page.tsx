import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getMonthKey } from "@/lib/date";
import { formatCurrency, formatPercent } from "@/lib/format";
import { CreateSellerForm } from "./create-seller-form";
import { DeleteButton } from "@/components/delete-button";
import { deleteSellerAction } from "@/app/actions";
import { Users, Stethoscope } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SellersPage() {
  const session = await getSession();
  const currentUser = session?.user;
  const isOwner = currentUser?.role === "OWNER";
  const monthKey = getMonthKey(new Date());
  const [profiles, monthlyStats, levelRules, recentHistory, recentSales] = await Promise.all([
    prisma.sellerProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sale.groupBy({
      where: { monthKey },
      by: ["sellerId"],
      _sum: {
        priceAfterDiscount: true,
        netProfit: true,
        sellerCommission: true,
      },
      _count: { _all: true },
    }),
    prisma.sellerLevelRule.findMany({
      orderBy: { level: "asc" },
    }),
    prisma.sellerLevelHistory.findMany({
      orderBy: { changedAt: "desc" },
      take: 20,
      include: {
        seller: {
          include: { user: true },
        },
      },
    }),
    prisma.sale.findMany({
      orderBy: { saleDate: "desc" },
      take: 20,
      include: {
        course: true,
        seller: {
          include: { user: true },
        },
      },
    }),
  ]);

  const statsMap = new Map(
    monthlyStats.map((stat) => [
      stat.sellerId,
      {
        count: stat._count._all,
        revenue: Number(stat._sum.priceAfterDiscount ?? 0),
        netProfit: Number(stat._sum.netProfit ?? 0),
        commission: Number(stat._sum.sellerCommission ?? 0),
      },
    ])
  );

  const sellers = profiles.map((profile) => {
    const stats = statsMap.get(profile.id);
    return {
      id: profile.id,
      name: profile.user?.name ?? "Seller",
      level: profile.level,
      sales: profile.salesThisMonth,
      monthSales: stats?.count ?? 0,
      monthRevenue: stats?.revenue ?? 0,
      monthCommission: stats?.commission ?? 0,
      totalCommission: Number(profile.totalCommissionPaid ?? 0),
      currentRate: Number(profile.currentCommission ?? 0),
    };
  });

  const activeSellers = sellers.length;
  const totalCommissionDue = sellers.reduce((sum, seller) => sum + seller.monthCommission, 0);
  const totalSales = sellers.reduce((sum, seller) => sum + seller.monthSales, 0);

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full -mr-32 -mt-32 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-200 rounded-full -ml-24 opacity-15"></div>
      <header className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Users className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-base uppercase tracking-[0.3em] font-bold text-cyan-600">Sellers</p>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-cyan-500 opacity-60" />
          <h1 className="text-3xl font-bold text-cyan-900">Commission control tower</h1>
        </div>
      </header>

      {isOwner && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CreateSellerForm />
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Active sellers" value={activeSellers.toString()} helper="With portal access" />
        <SummaryCard label="Sales logged" value={totalSales.toString()} helper="This month" />
        <SummaryCard label="Commission payable" value={formatCurrency(totalCommissionDue)} helper="After platform fee" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Seller scoreboard</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Seller</th>
                <th>Level</th>
                <th>Sales this month</th>
                <th>Revenue</th>
                <th>Commission</th>
                <th>Total commission</th>
                {isOwner && <th>Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellers.map((seller) => (
                <tr key={seller.id}>
                  <td className="py-2">
                    <p className="font-medium text-slate-900">{seller.name}</p>
                    <p className="text-xs text-slate-400">{formatPercent(seller.currentRate)}</p>
                  </td>
                  <td>{seller.level}</td>
                  <td>{seller.monthSales}</td>
                  <td>{formatCurrency(seller.monthRevenue)}</td>
                  <td>{formatCurrency(seller.monthCommission)}</td>
                  <td>{formatCurrency(seller.totalCommission)}</td>
                  {isOwner && (
                    <td>
                      <DeleteButton
                        action={deleteSellerAction}
                        id={seller.id}
                        idFieldName="sellerId"
                        label="Delete"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Level rules</h2>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Level</th>
                <th>Sales range</th>
                <th>Commission rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {levelRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="py-2 font-medium text-slate-900">{rule.level}</td>
                  <td>
                    {rule.minSales} – {rule.maxSales ?? "∞"}
                  </td>
                  <td>{formatPercent(Number(rule.commissionRate))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent level history</h2>
          <div className="mt-4 space-y-3 text-sm">
            {recentHistory.length === 0 ? (
              <p className="text-slate-500">No level changes yet.</p>
            ) : (
              recentHistory.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="font-medium text-slate-900">{entry.seller.user?.name ?? "Seller"}</p>
                  <p className="text-xs text-slate-400">{new Date(entry.changedAt).toLocaleString()}</p>
                  <p className="text-sm text-slate-600">
                    Level {entry.previousLevel} → {entry.newLevel} ({formatPercent(Number(entry.previousRate))} →{" "}
                    {formatPercent(Number(entry.newRate))})
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Seller sales log</h2>
        <p className="text-sm text-slate-500">Quick history to audit who sold what and when.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Date</th>
                <th>Seller</th>
                <th>Course</th>
                <th>Revenue</th>
                <th>Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="py-2">{new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td>{sale.seller?.user?.name ?? "—"}</td>
                  <td>{sale.course.name}</td>
                  <td>{formatCurrency(Number(sale.priceAfterDiscount))}</td>
                  <td>{formatCurrency(Number(sale.sellerCommission))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{helper}</p>
    </div>
  );
}


