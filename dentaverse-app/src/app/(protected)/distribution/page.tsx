import { getBucketTree } from "@/lib/buckets";
import { formatCurrency, formatPercent } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getMonthKey } from "@/lib/date";
import { DollarSign, Stethoscope } from "lucide-react";

type BucketNodeProps = {
  id: string;
  label: string;
  remaining: number;
  inflow: number;
  used: number;
  defaultShare: number | null;
  children: BucketNodeProps[];
};

export default async function DistributionPage() {
  const now = new Date();
  const monthKey = getMonthKey(now);
  const [buckets, monthNet] = await Promise.all([
    getBucketTree(),
    prisma.sale.aggregate({
      where: { monthKey },
      _sum: { netProfit: true },
    }),
  ]);

  const flatBuckets = flatten(buckets);
  const totalInflow = flatBuckets.reduce((sum, bucket) => sum + bucket.inflow, 0);
  const totalUsed = flatBuckets.reduce((sum, bucket) => sum + bucket.used, 0);

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-100 rounded-full -mr-36 -mt-36 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-200 rounded-full -ml-28 opacity-15"></div>
      <header className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-base uppercase tracking-[0.3em] font-bold text-cyan-600">Money Distribution</p>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-cyan-500 opacity-60" />
          <h1 className="text-3xl font-bold text-cyan-900">Where each IQD of profit is stored</h1>
        </div>
        <p className="text-base text-cyan-700 mt-2">
          Total allocated {formatCurrency(totalInflow)} · Used {formatCurrency(totalUsed)}
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        <SummaryCard
          label="Net profit this month"
          value={formatCurrency(Number(monthNet._sum.netProfit ?? 0))}
          helper="Basis for allocations"
        />
        <SummaryCard label="Funds committed" value={formatCurrency(totalUsed)} helper="Expenses + salaries" />
        <SummaryCard label="Available balance" value={formatCurrency(totalInflow - totalUsed)} helper="Across all buckets" />
      </section>

      <section className="rounded-2xl border-2 border-cyan-300 bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-cyan-900">Allocation tree</h2>
        <p className="text-base text-cyan-700">Money distribution across all categories</p>
        <div className="mt-5 space-y-3">
          {buckets.map((bucket) => (
            <BucketRow key={bucket.id} bucket={bucket} level={0} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-cyan-300 bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-cyan-900">Detailed ledger</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-base">
            <thead className="text-left text-sm uppercase font-bold text-cyan-700 bg-cyan-100">
              <tr>
                <th className="py-3 px-4">Bucket</th>
                <th className="px-4">Allocated</th>
                <th className="px-4">Used</th>
                <th className="px-4">Remaining</th>
                <th className="px-4">Default share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-200">
              {flatBuckets.map((bucket) => (
                <tr key={bucket.id} className="hover:bg-cyan-50">
                  <td className="py-3 px-4 font-semibold text-cyan-900">{bucket.label}</td>
                  <td className="px-4 text-cyan-800">{formatCurrency(bucket.inflow)}</td>
                  <td className="px-4 text-cyan-700">{formatCurrency(bucket.used)}</td>
                  <td className="px-4 font-bold text-emerald-600">{formatCurrency(bucket.remaining)}</td>
                  <td className="px-4 text-cyan-700">{bucket.defaultShare ? formatPercent(Number(bucket.defaultShare)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function flatten(nodes: BucketNodeProps[]) {
  const list: BucketNodeProps[] = [];
  for (const node of nodes) {
    list.push(node);
    list.push(...flatten(node.children));
  }
  return list;
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border-2 border-cyan-300 bg-white p-5 shadow-lg">
      <p className="text-base font-semibold text-cyan-700">{label}</p>
      <p className="mt-2 text-3xl font-bold text-cyan-900">{value}</p>
      <p className="mt-1 text-sm text-cyan-600">{helper}</p>
    </div>
  );
}

function BucketRow({ bucket, level }: { bucket: BucketNodeProps; level: number }) {
  return (
    <div className="rounded-lg border-2 border-cyan-200 bg-cyan-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-bold text-cyan-900" style={{ paddingLeft: level * 16 }}>
            {bucket.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(bucket.remaining)}</p>
          <p className="text-sm text-cyan-700">Used {formatCurrency(bucket.used)}</p>
        </div>
      </div>
      {bucket.children.length ? (
        <div className="mt-3 space-y-2">
          {bucket.children.map((child) => (
            <BucketRow key={child.id} bucket={child} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}


