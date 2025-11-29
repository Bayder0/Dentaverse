
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getBucketTree } from "@/lib/buckets";
import type { BucketNode } from "@/lib/buckets";
import { SalaryRecipientForm } from "./salary-recipient-form";
import { SalaryPaymentForm } from "./salary-payment-form";
import { Wallet, Stethoscope } from "lucide-react";

export const dynamic = 'force-dynamic';

type BucketInfo = {
  id: string;
  path: string;
  remaining: number;
};

export default async function SalariesPage() {
  const [recipients, payments, bucketTree] = await Promise.all([
    prisma.salaryRecipient.findMany({
      orderBy: { createdAt: "desc" },
      include: { bucket: true },
    }),
    prisma.salaryPayment.findMany({
      orderBy: { paidOn: "desc" },
      take: 30,
      include: {
        recipient: true,
        bucket: true,
        paidBy: true,
      },
    }),
    getBucketTree(),
  ]);

  const bucketMap = new Map<string, BucketInfo>();

  const buildPath = (node: BucketNode, ancestors: string[] = []) => {
    const path = [...ancestors, node.label].join(" → ");
    const info = { id: node.id, path, remaining: node.remaining };
    bucketMap.set(node.id, info);
    node.children.forEach((child) => buildPath(child, [...ancestors, node.label]));
  };

  bucketTree.forEach((node) => buildPath(node));

  const bucketOptions = Array.from(bucketMap.values());

  const totalPayroll = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full -mr-32 -mt-32 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-200 rounded-full -ml-24 opacity-15"></div>
      <header className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Wallet className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-base uppercase tracking-[0.3em] font-bold text-cyan-600">Salaries</p>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-cyan-500 opacity-60" />
          <h1 className="text-3xl font-bold text-cyan-900">Pay everyone from the right bucket</h1>
        </div>
        <p className="text-base text-cyan-700 mt-2">Define rules once, then pay with a single click.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <SalaryRecipientForm buckets={bucketOptions} />
        <SalaryPaymentForm
          recipients={recipients.map((recipient) => ({
            id: recipient.id,
            name: recipient.name,
            role: recipient.roleLabel,
            bucketId: recipient.bucketId,
          }))}
          buckets={bucketOptions}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recipients</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Name</th>
                <th>Role</th>
                <th>Bucket</th>
                <th>Mode</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td className="py-2 font-medium text-slate-900">{recipient.name}</td>
                  <td>{recipient.roleLabel}</td>
                  <td>{bucketMap.get(recipient.bucketId)?.path ?? recipient.bucket.label}</td>
                  <td>
                    {recipient.mode === "PERCENTAGE"
                      ? `Share ${recipient.percentageShare ?? 0}%`
                      : recipient.mode === "FIXED"
                        ? `Fixed ${formatCurrency(Number(recipient.fixedAmount ?? 0))}`
                        : `Per ${recipient.unitName ?? "unit"} · ${formatCurrency(Number(recipient.unitRate ?? 0))}`}
                  </td>
                  <td>{recipient.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent salary payments</h2>
        <p className="text-sm text-slate-500">Total paid {formatCurrency(totalPayroll)}.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Date</th>
                <th>Recipient</th>
                <th>Bucket</th>
                <th>Amount</th>
                <th>Period</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="py-2">{new Date(payment.paidOn).toLocaleDateString()}</td>
                  <td>{payment.recipient.name}</td>
                  <td>{bucketMap.get(payment.bucketId)?.path ?? payment.bucket.label}</td>
                  <td>{formatCurrency(Number(payment.amount))}</td>
                  <td>{payment.periodKey}</td>
                  <td>{payment.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


