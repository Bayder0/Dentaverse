"use client";

import { useMemo, useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { updateDistributionTemplateAction } from "@/app/actions";
import { FormStatus } from "@/components/form-status";

type BucketOption = {
  id: string;
  label: string;
  path: string;
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  applicableTo: string | null;
  allocations: Array<{
    id: string;
    bucketId: string;
    percentage: number;
  }>;
};

type Props = {
  buckets: BucketOption[];
  template: Template;
  onCancel: () => void;
};

const initialState = {
  success: "",
  error: "",
};

export function TemplateEditForm({ buckets, template, onCancel }: Props) {
  const [state, action] = useActionState(updateDistributionTemplateAction, initialState);
  const [values, setValues] = useState<Record<string, string>>({});

  // Initialize values from template
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    template.allocations.forEach((allocation) => {
      initialValues[allocation.bucketId] = String(Number(allocation.percentage) * 100);
    });
    setValues(initialValues);
  }, [template]);

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

  if (state.success) {
    setTimeout(() => {
      onCancel();
    }, 1500);
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border-2 border-cyan-300 bg-white p-4 shadow-sm">
      <input type="hidden" name="templateId" value={template.id} />
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-cyan-900">Edit: {template.name}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
      <label className="text-sm font-medium text-slate-700">
        Template name
        <input
          name="name"
          required
          defaultValue={template.name}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Applies to
          <select 
            name="applicableTo" 
            defaultValue={template.applicableTo || ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Any course</option>
            <option value="MINISTERIAL">Ministerial</option>
            <option value="SUMMER">Summer training</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Description
          <input
            name="description"
            defaultValue={template.description || ""}
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
      <div className="flex gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Updating..." : "Update template"}
    </button>
  );
}



