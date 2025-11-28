"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { recordExpenseAction } from "@/app/actions";
import { FormStatus } from "@/components/form-status";

type BucketOption = {
  id: string;
  path: string;
};

type Props = {
  buckets: BucketOption[];
};

const initialState = {
  success: "",
  error: "",
};

export function ExpenseForm({ buckets }: Props) {
  const [state, action] = useActionState(recordExpenseAction, initialState);
  return (
    <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Log an expense</h3>
      <label className="text-sm font-medium text-slate-700">
        Budget bucket
        <select
          name="bucketId"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          defaultValue={buckets[0]?.id}
        >
          {buckets.map((bucket) => (
            <option key={bucket.id} value={bucket.id}>
              {bucket.path}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Description
        <input
          name="description"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="New camera for media team"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Amount (IQD)
          <input
            name="amount"
            type="number"
            step="1000"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Date
          <input
            name="expenseDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

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
      {pending ? "Saving..." : "Save expense"}
    </button>
  );
}


