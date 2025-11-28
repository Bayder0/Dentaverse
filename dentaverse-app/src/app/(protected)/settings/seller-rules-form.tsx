"use client";

import { useMemo, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateSellerRulesAction } from "@/app/actions";
import { FormStatus } from "@/components/form-status";

type Rule = {
  level: number;
  minSales: number;
  maxSales: number | null;
  commissionRate: number;
};

type Props = {
  rules: Rule[];
};

const initialState = {
  success: "",
  error: "",
};

export function SellerRulesForm({ rules }: Props) {
  const [state, action] = useActionState(updateSellerRulesAction, initialState);
  const [draft, setDraft] = useState<Rule[]>(rules);

  const payload = useMemo(() => JSON.stringify(draft), [draft]);

  const updateRule = (index: number, property: keyof Rule, value: string) => {
    setDraft((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (property === "commissionRate") {
        current[property] = Number(value);
      } else if (property === "maxSales") {
        current[property] = value === "" ? null : Number(value);
      } else {
        current[property] = Number(value);
      }
      next[index] = current;
      return next;
    });
  };

  return (
    <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Seller level rules</h3>
      <p className="text-sm text-slate-500">Adjust sales ranges and commission rates. Reset happens automatically.</p>
      <div className="space-y-3">
        {draft.map((rule, index) => (
          <div key={rule.level} className="rounded-lg border border-slate-100 p-3">
            <p className="text-sm font-semibold text-slate-900">Level {rule.level}</p>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <label className="text-xs font-medium text-slate-600">
                Min sales
                <input
                  type="number"
                  value={rule.minSales}
                  onChange={(event) => updateRule(index, "minSales", event.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Max sales
                <input
                  type="number"
                  value={rule.maxSales ?? ""}
                  onChange={(event) => updateRule(index, "maxSales", event.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                  placeholder="∞"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Commission rate (decimal)
                <input
                  type="number"
                  step="0.01"
                  value={rule.commissionRate}
                  onChange={(event) => updateRule(index, "commissionRate", event.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <input type="hidden" name="payload" value={payload} />

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
      {pending ? "Saving..." : "Update rules"}
    </button>
  );
}


