"use client";

import { useMemo, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createDistributionTemplateAction } from "@/app/actions";
import { FormStatus } from "@/components/form-status";

type BucketOption = {
  id: string;
  label: string;
  path: string;
};

type Props = {
  buckets: BucketOption[];
};

const initialState = {
  success: "",
  error: "",
};

export function TemplateForm({ buckets }: Props) {
  const [state, action] = useActionState(createDistributionTemplateAction, initialState);
  const [values, setValues] = useState<Record<string, string>>({});

  const allocationPayload = useMemo(
    () =>
      buckets.map((bucket) => {
        const percent = Number(values[bucket.id] ?? 0);
        if (!percent || percent <= 0) return null;
        return {
          bucketId: bucket.id,
          percentage: percent / 100,
        };
      }),
    [buckets, values]
  );

  const totalPercent = allocationPayload.reduce(
    (sum, allocation) => sum + ((allocation?.percentage ?? 0) * 100),
    0
  );

  return (
    <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Money distribution template</h3>
      <label className="text-sm font-medium text-slate-700">
        Template name
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Ministerial Default"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Applies to
          <select name="applicableTo" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Any course</option>
            <option value="MINISTERIAL">Ministerial</option>
            <option value="SUMMER">Summer training</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Description
          <input
            name="description"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Explain how this split is used"
          />
        </label>
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <p>Allocations</p>
          <p className={Math.round(totalPercent) === 100 ? "text-emerald-600" : "text-red-600"}>
            {Math.round(totalPercent)}% total
          </p>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {buckets.map((bucket) => (
            <label key={bucket.id} className="text-xs font-medium text-slate-600">
              {bucket.path}
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                value={values[bucket.id] ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    [bucket.id]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
      </div>

      <input
        type="hidden"
        name="allocations"
        value={JSON.stringify(allocationPayload.filter((allocation) => allocation !== null))}
      />

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
      {pending ? "Saving..." : "Save template"}
    </button>
  );
}


