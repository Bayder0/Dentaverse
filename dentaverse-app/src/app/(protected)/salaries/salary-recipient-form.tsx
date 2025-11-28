"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createSalaryRecipientAction } from "@/app/actions";
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

export function SalaryRecipientForm({ buckets }: Props) {
  const [mode, setMode] = useState("PERCENTAGE");
  const [state, action] = useActionState(createSalaryRecipientAction, initialState);

  return (
    <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Add salary recipient</h3>
      <label className="text-sm font-medium text-slate-700">
        Full name
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Ahmed Hassan"
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Role label
        <input
          name="roleLabel"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Owner / PowerPoint designer"
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Bucket
        <select
          name="bucketId"
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
        Pay mode
        <select
          name="mode"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="PERCENTAGE">Percentage of bucket</option>
          <option value="FIXED">Fixed amount</option>
          <option value="UNIT">Per deliverable (unit)</option>
        </select>
      </label>

      {mode === "PERCENTAGE" ? (
        <label className="text-sm font-medium text-slate-700">
          Share (% of bucket)
          <input
            name="percentageShare"
            type="number"
            step="0.1"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g. 40"
          />
        </label>
      ) : null}

      {mode === "FIXED" ? (
        <label className="text-sm font-medium text-slate-700">
          Fixed salary (IQD)
          <input
            name="fixedAmount"
            type="number"
            step="1000"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      ) : null}

      {mode === "UNIT" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Unit name
            <input
              name="unitName"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Slides / Posts"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Rate per unit (IQD)
            <input
              name="unitRate"
              type="number"
              step="1000"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
      ) : null}

      <label className="text-sm font-medium text-slate-700">
        Notes
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Gets 60% of owner share."
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
      {pending ? "Saving..." : "Save recipient"}
    </button>
  );
}


