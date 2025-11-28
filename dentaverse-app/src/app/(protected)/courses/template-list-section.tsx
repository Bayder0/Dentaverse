"use client";

import { useState } from "react";
import { formatPercent } from "@/lib/format";
import { TemplateEditForm } from "./template-edit-form";

type Bucket = {
  id: string;
  label: string;
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
    bucket: Bucket;
  }>;
};

type Props = {
  templates: Template[];
  buckets: Array<{ id: string; label: string; path: string }>;
};

export function TemplateListSection({ templates, buckets }: Props) {
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const editingTemplate = editingTemplateId 
    ? templates.find(t => t.id === editingTemplateId)
    : null;

  if (editingTemplate) {
    return (
      <div className="rounded-2xl border-2 border-cyan-300 bg-white p-5 shadow-sm">
        <TemplateEditForm
          buckets={buckets}
          template={editingTemplate}
          onCancel={() => setEditingTemplateId(null)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Distribution templates</h2>
      <p className="text-sm text-slate-500">Click "Edit" to modify percentages. Fine tune how every IQD of net profit is routed.</p>
      <div className="mt-4 space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="rounded-lg border border-slate-100 p-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-slate-900">{template.name}</p>
                <p className="text-xs text-slate-400">
                  {template.applicableTo ? `${template.applicableTo} only` : "Any course"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500">{template.allocations.length} buckets</p>
                <button
                  onClick={() => setEditingTemplateId(template.id)}
                  className="rounded px-2 py-1 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 transition"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              {template.allocations.map((allocation) => (
                <div key={allocation.id} className="flex items-center justify-between rounded border border-slate-50 px-2 py-1">
                  <span>{allocation.bucket.label}</span>
                  <span className="font-semibold text-slate-900">
                    {formatPercent(Number(allocation.percentage))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

