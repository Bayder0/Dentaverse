import { SaleEntryForm } from "./sale-entry-form";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getMonthKey } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { DeleteButton } from "@/components/delete-button";
import { deleteSaleAction } from "@/app/actions";
import { ShoppingCart, Stethoscope } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const session = await getSession();
  const currentUser = session?.user;
  const isOwner = currentUser?.role === "OWNER";
  const isSeller = currentUser?.role === "SELLER";
  const now = new Date();
  const monthKey = getMonthKey(now);

  // If seller, get their seller profile to filter by their sales only
  let sellerProfileId: string | null = null;
  if (isSeller && session?.user?.id) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    sellerProfileId = sellerProfile?.id || null;
  }

  const salesWhere: any = { monthKey };
  const recentSalesWhere: any = {};
  if (isSeller && sellerProfileId) {
    salesWhere.sellerId = sellerProfileId;
    recentSalesWhere.sellerId = sellerProfileId;
  }

  const [courses, discounts, sellers, recentSales, aggregate] = await Promise.all([
    prisma.course.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.discount.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    isOwner ? prisma.sellerProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }) : Promise.resolve([]),
    prisma.sale.findMany({
      where: recentSalesWhere,
      orderBy: { saleDate: "desc" },
      take: 25,
      include: {
        course: true,
        seller: { include: { user: true } },
        discount: true,
      },
    }),
    prisma.sale.aggregate({
      where: salesWhere,
      _sum: {
        priceBefore: true,
        priceAfterDiscount: true,
        netProfit: true,
        sellerCommission: true,
      },
      _count: { _all: true },
    }),
  ]);

  const monthlyRevenue = Number(aggregate._sum.priceAfterDiscount ?? 0);
  const monthlyDiscount = Number(aggregate._sum.priceBefore ?? 0) - monthlyRevenue;
  const monthlyNet = Number(aggregate._sum.netProfit ?? 0);
  const monthlyCommission = Number(aggregate._sum.sellerCommission ?? 0);
  const salesCount = aggregate._count._all ?? 0;

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full -mr-32 -mt-32 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-200 rounded-full -ml-24 opacity-15"></div>
      <header className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-base uppercase tracking-[0.3em] font-bold text-cyan-600">Sales</p>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-cyan-500 opacity-60" />
          <h1 className="text-3xl font-bold text-cyan-900">Capture every enrollment</h1>
        </div>
        <p className="text-base text-cyan-700 mt-2">Month: {monthKey}</p>
      </header>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(monthlyRevenue)} helper={`${salesCount} sales`} />
        <StatCard label="Net profit" value={formatCurrency(monthlyNet)} helper={`Commission ${formatCurrency(monthlyCommission)}`} />
        <StatCard label="Discounts given" value={formatCurrency(monthlyDiscount)} helper="Applied across all courses" />
        <StatCard label="Payouts to sellers" value={formatCurrency(monthlyCommission)} helper="After platform fee" />
      </section>

      <div className="max-w-3xl">
        <SaleEntryForm
          courses={courses.map((course) => ({
            id: course.id,
            name: course.name,
            type: course.type,
            stage: course.stage,
            basePrice: Number(course.basePrice),
            platformFeeRate: Number(course.platformFeeRate),
          }))}
          discounts={discounts.map((discount) => ({
            id: discount.id,
            name: discount.name,
            type: discount.type,
            amount: Number(discount.amount),
          }))}
          sellers={sellers.map((seller) => ({
            id: seller.id,
            name: seller.user?.name ?? "Seller",
            level: seller.level,
            currentCommission: Number(seller.currentCommission),
          }))}
        />
      </div>

      <section className="rounded-2xl border-2 border-cyan-300 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-cyan-900">Recent sales</h2>
            <p className="text-base text-cyan-700">Latest 25 entries</p>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-base">
            <thead className="text-left text-sm uppercase font-bold text-cyan-700 bg-cyan-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="px-4">Course</th>
                <th className="px-4">Seller</th>
                <th className="px-4">Revenue</th>
                <th className="px-4">Net profit</th>
                <th className="px-4">Commission</th>
                <th className="px-4">Discount</th>
                {isOwner && <th className="px-4">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-200">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-cyan-50">
                  <td className="py-3 px-4 font-medium text-cyan-900">{new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td className="px-4">
                    <p className="font-semibold text-cyan-900">{sale.course.name}</p>
                    <p className="text-sm text-cyan-600">{sale.course.type}</p>
                  </td>
                  <td className="px-4 text-cyan-800">{sale.seller?.user?.name ?? "—"}</td>
                  <td className="px-4 font-semibold text-cyan-900">{formatCurrency(Number(sale.priceBefore))}</td>
                  <td className="px-4 font-semibold text-emerald-600">{formatCurrency(Number(sale.netProfit))}</td>
                  <td className="px-4 text-cyan-700">{formatCurrency(Number(sale.sellerCommission))}</td>
                  <td className="px-4 text-cyan-700">{sale.discount?.name ?? "—"}</td>
                  {isOwner && (
                    <td className="px-4">
                      <DeleteButton
                        action={deleteSaleAction}
                        id={sale.id}
                        idFieldName="saleId"
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
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-cyan-300 bg-white p-5 shadow-lg">
      <p className="text-base font-semibold text-cyan-700">{label}</p>
      <p className="mt-2 text-3xl font-bold text-cyan-900">{value}</p>
      <p className="mt-1 text-sm text-cyan-600">{helper}</p>
    </div>
  );
}


