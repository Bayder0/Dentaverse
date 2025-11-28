"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { recordSalaryPaymentAction } from "@/app/actions";
import { FormStatus } from "@/components/form-status";

type RecipientOption = {
  id: string;
  name: string;
  role: string;
  bucketId: string;
};

type BucketOption = {
  id: string;
  path: string;
  remaining: number;
};

type Props = {
  recipients: RecipientOption[];
  buckets: BucketOption[];
};

const initialState = {
  success: "",
  error: "",
};

export function SalaryPaymentForm({ recipients, buckets }: Props) {
  const [state, action] = useActionState(recordSalaryPaymentAction, initialState);
  return (
    <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Record salary payment</h3>
      <label className="text-sm font-medium text-slate-700">
        Recipient
        <select
          name="recipientId"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          defaultValue={recipients[0]?.id}
        >
          {recipients.map((recipient) => (
            <option key={recipient.id} value={recipient.id}>
              {recipient.name} · {recipient.role}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Bucket
        <select name="bucketId" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {buckets.map((bucket) => (
            <option key={bucket.id} value={bucket.id}>
              {bucket.path} · Available {bucket.remaining.toLocaleString()}
            </option>
          ))}
        </select>
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
          Period (YYYY-MM)
          <input
            name="periodKey"
            defaultValue={new Date().toISOString().slice(0, 7)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-700">
        Units covered (optional)
        <input
          name="unitsCovered"
          type="number"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Notes
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Paid after delivering 5 decks"
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
      {pending ? "Saving..." : "Record payment"}
    </button>
  );
}


