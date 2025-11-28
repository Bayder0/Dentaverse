"use client";

import { useMemo, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { recordSaleAction } from "@/app/actions";
import { FormStatus } from "@/components/form-status";
import { formatCurrency } from "@/lib/format";

type CourseOption = {
  id: string;
  name: string;
  type: string;
  stage: number | null;
  basePrice: number;
  platformFeeRate: number;
};

type DiscountOption = {
  id: string;
  name: string;
  type: string;
  amount: number;
};

type SellerOption = {
  id: string;
  name: string;
  level: number;
  currentCommission: number;
};

type Props = {
  courses: CourseOption[];
  discounts: DiscountOption[];
  sellers: SellerOption[];
};

const initialState = {
  success: "",
  error: "",
};

export function SaleEntryForm({ courses, discounts, sellers }: Props) {
  const [state, formAction] = useActionState(recordSaleAction, initialState);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(courses[0] ?? null);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountOption | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<SellerOption | null>(null);

  const summary = useMemo(() => {
    if (!selectedCourse) return null;
    const revenue = selectedCourse.basePrice;
    let discountValue = 0;
    if (selectedDiscount) {
      discountValue =
        selectedDiscount.type === "PERCENTAGE"
          ? (selectedDiscount.amount / 100) * revenue
          : selectedDiscount.amount;
    }

    const priceAfterDiscount = Math.max(revenue - discountValue, 0);
    const platformFee = Math.round(priceAfterDiscount * 0.135 * 100) / 100;
    const profit = priceAfterDiscount - platformFee;
    const commissionRate = selectedSeller?.currentCommission ?? 0;
    const sellerCommission = Math.round(profit * commissionRate * 100) / 100;
    const netProfit = profit - sellerCommission;

    return {
      revenue,
      discountValue,
      priceAfterDiscount,
      platformFee,
      profit,
      sellerCommission,
      netProfit,
    };
  }, [selectedCourse, selectedDiscount, selectedSeller]);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border-2 border-cyan-300 bg-white p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-cyan-900">Record a sale</h2>

      <label className="block text-base font-semibold text-cyan-900">
        Course
        <select
          name="courseId"
          className="mt-2 w-full rounded-lg border-2 border-cyan-300 bg-white px-4 py-3 text-base text-cyan-900 focus:border-cyan-500 focus:outline-none"
          onChange={(event) => {
            const course = courses.find((item) => item.id === event.target.value) ?? null;
            setSelectedCourse(course);
          }}
          defaultValue={selectedCourse?.id}
          required
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-base font-semibold text-cyan-900">
        Discount
        <select
          name="discountId"
          className="mt-2 w-full rounded-lg border-2 border-cyan-300 bg-white px-4 py-3 text-base text-cyan-900 focus:border-cyan-500 focus:outline-none"
          onChange={(event) => {
            const discount = discounts.find((item) => item.id === event.target.value) ?? null;
            setSelectedDiscount(discount);
          }}
          defaultValue=""
        >
          <option value="">No discount</option>
          {discounts.map((discount) => (
            <option key={discount.id} value={discount.id}>
              {discount.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-base font-semibold text-cyan-900">
        Seller
        <select
          name="sellerId"
          className="mt-2 w-full rounded-lg border-2 border-cyan-300 bg-white px-4 py-3 text-base text-cyan-900 focus:border-cyan-500 focus:outline-none"
          onChange={(event) => {
            const seller = sellers.find((item) => item.id === event.target.value) ?? null;
            setSelectedSeller(seller ?? null);
          }}
          defaultValue=""
        >
          <option value="">No sales rep</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.name} · Level {seller.level} ({Math.round(seller.currentCommission * 100)}%)
            </option>
          ))}
        </select>
      </label>

      <label className="block text-base font-semibold text-cyan-900">
        Sale date
        <input
          type="date"
          name="saleDate"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="mt-2 w-full rounded-lg border-2 border-cyan-300 bg-white px-4 py-3 text-base text-cyan-900 focus:border-cyan-500 focus:outline-none"
        />
      </label>

      <label className="block text-base font-semibold text-cyan-900">
        Note (optional)
        <textarea
          name="note"
          rows={3}
          className="mt-2 w-full rounded-lg border-2 border-cyan-300 bg-white px-4 py-3 text-base text-cyan-900 focus:border-cyan-500 focus:outline-none"
          placeholder="Any additional notes..."
        />
      </label>

      {summary ? (
        <section className="rounded-xl border-2 border-cyan-400 bg-cyan-50 p-6">
          <p className="text-lg font-bold text-cyan-900">Financial Summary</p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-white p-4">
              <div>
                <p className="text-base font-semibold text-cyan-700">Revenue</p>
                <p className="text-xs text-cyan-600">Original course amount</p>
              </div>
              <p className="text-xl font-bold text-cyan-900">{formatCurrency(summary.revenue)}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white p-4">
              <div>
                <p className="text-base font-semibold text-cyan-700">Profit</p>
                <p className="text-xs text-cyan-600">After discount & platform fee (13.5%)</p>
              </div>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.profit)}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white p-4">
              <div>
                <p className="text-base font-semibold text-cyan-700">Net Profit</p>
                <p className="text-xs text-cyan-600">After seller commission</p>
              </div>
              <p className="text-xl font-bold text-cyan-600">{formatCurrency(summary.netProfit)}</p>
            </div>
          </div>
        </section>
      ) : null}

      <FormStatus state={state} />

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded-lg bg-cyan-600 py-4 text-lg font-bold text-white transition hover:bg-cyan-700 active:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Saving sale..." : "Record Sale"}
    </button>
  );
}


