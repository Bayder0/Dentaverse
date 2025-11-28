import { ExpenseForm } from "./expense-form";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { Receipt, Stethoscope } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { deleteExpenseAction } from "@/app/actions";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const session = await getServerSession(authConfig);
  const userRole = session?.user?.role;
  const isOwner = userRole === "OWNER";
  
  // Debug: Show current role (remove this after testing)
  console.log('Expenses page - Session:', { 
    hasSession: !!session, 
    userId: session?.user?.id, 
    userRole: userRole,
    isOwner: isOwner 
  });

  const [expenses, buckets, grouped] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { expenseDate: "desc" },
      take: 40,
      include: {
        bucket: true,
        createdBy: true,
      },
    }),
    prisma.fundBucket.findMany(),
    prisma.expense.groupBy({
      by: ["bucketId"],
      _sum: { amount: true },
    }),
  ]);

  function bucketPath(bucketId: string) {
    const bucket = buckets.find((b) => b.id === bucketId);
    if (!bucket) return "Unknown bucket";
    const parts = [bucket.label];
    let current = bucket;
    while (current.parentId) {
      const parent = buckets.find((b) => b.id === current.parentId);
      if (!parent) break;
      parts.unshift(parent.label);
      current = parent;
    }
    return parts.join(" → ");
  }

  const bucketOptions = buckets
    .filter((bucket) => !buckets.some((child) => child.parentId === bucket.id))
    .map((bucket) => ({
      id: bucket.id,
      path: bucketPath(bucket.id),
    }));

  const spendSummary = grouped
    .map((group) => ({
      bucketId: group.bucketId,
      path: bucketPath(group.bucketId),
      amount: Number(group._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const totalSpend = spendSummary.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full -mr-32 -mt-32 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-200 rounded-full -ml-24 opacity-15"></div>
      <header className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Receipt className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-base uppercase tracking-[0.3em] font-bold text-cyan-600">Expenses</p>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-cyan-500 opacity-60" />
          <h1 className="text-3xl font-bold text-cyan-900">Track operating spend by bucket</h1>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent expenses</h2>
            <div className="flex items-center gap-2">
              {session && (
                <span className="text-xs text-slate-500">
                  Role: <span className="font-semibold">{userRole}</span>
                </span>
              )}
              {isOwner && (
                <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded font-medium">
                  Delete enabled
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Date</th>
                  <th>Bucket</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Logged by</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No expenses recorded yet
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="py-2">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                      <td>{bucketPath(expense.bucketId)}</td>
                      <td>{expense.description}</td>
                      <td>{formatCurrency(Number(expense.amount))}</td>
                      <td>{expense.createdBy?.name ?? "Admin"}</td>
                      {isOwner ? (
                        <td className="text-center">
                          <DeleteButton
                            action={deleteExpenseAction}
                            id={expense.id}
                            idFieldName="expenseId"
                            label="Delete"
                          />
                        </td>
                      ) : (
                        <td className="text-center text-xs text-slate-400">—</td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <ExpenseForm buckets={bucketOptions} />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Top spending buckets</h3>
            <p className="text-xs text-slate-500">Based on logged expenses.</p>
            <div className="mt-3 space-y-3">
              {spendSummary.map((bucket) => (
                <div key={bucket.bucketId}>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{bucket.path}</p>
                    <p>{formatCurrency(bucket.amount)}</p>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-rose-500"
                      style={{
                        width: `${totalSpend === 0 ? 0 : Math.min((bucket.amount / totalSpend) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

