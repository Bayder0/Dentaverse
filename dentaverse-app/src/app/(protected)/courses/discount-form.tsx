"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createDiscountAction } from "@/app/actions";
import { FormStatus } from "@/components/form-status";

const initialState = {
  success: "",
  error: "",
};

export function DiscountForm() {
  const [state, action] = useActionState(createDiscountAction, initialState);
  const [discountType, setDiscountType] = useState("FLAT");
  
  return (
    <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Add a discount</h3>
      <label className="text-sm font-medium text-slate-700">
        Name
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="5 Friends Discount"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Type
          <select
            name="type"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="FLAT">Fixed amount (IQD)</option>
            <option value="PERCENTAGE">Percentage (%)</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          {discountType === "PERCENTAGE" ? "Percentage" : "Amount"}
          <div className="mt-1 flex items-center gap-2">
            <input
              name="amount"
              type="number"
              step={discountType === "PERCENTAGE" ? "0.1" : "100"}
              min="0"
              max={discountType === "PERCENTAGE" ? "100" : undefined}
              required
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={discountType === "PERCENTAGE" ? "10" : "10000"}
            />
            {discountType === "PERCENTAGE" && (
              <span className="text-sm text-slate-500">%</span>
            )}
          </div>
        </label>
      </div>
      <label className="text-sm font-medium text-slate-700">
        Notes
        <textarea
          name="description"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Only valid when 5 enrollments happen together."
        />
      </label>

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
      disabled={pending}
      className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save discount"}
    </button>
  );
}


