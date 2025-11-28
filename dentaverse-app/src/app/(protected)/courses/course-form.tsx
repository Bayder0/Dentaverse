"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCourseAction } from "@/app/actions";
import { FormStatus } from "@/components/form-status";

type TemplateOption = {
  id: string;
  name: string;
};

type Props = {
  templates: TemplateOption[];
  defaultTemplates?: { MINISTERIAL?: string; SUMMER?: string };
};

const initialState = {
  success: "",
  error: "",
};

export function CourseForm({ templates, defaultTemplates }: Props) {
  const [state, action] = useActionState(createCourseAction, initialState);
  const [courseType, setCourseType] = useState("MINISTERIAL");
  const [customTypeName, setCustomTypeName] = useState("");
  
  // Get default template for current course type
  const getDefaultTemplateId = () => {
    if (courseType === "MINISTERIAL" && defaultTemplates?.MINISTERIAL) {
      return defaultTemplates.MINISTERIAL;
    }
    if (courseType === "SUMMER" && defaultTemplates?.SUMMER) {
      return defaultTemplates.SUMMER;
    }
    return "";
  };
  
  const defaultTemplateId = getDefaultTemplateId();
  const defaultTemplateName = defaultTemplateId 
    ? templates.find(t => t.id === defaultTemplateId)?.name 
    : null;

  return (
    <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Create a course</h3>
      <label className="text-sm font-medium text-slate-700">
        Name
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Ministerial Stage 3"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Type
          <select
            name="type"
            value={courseType}
            onChange={(e) => {
              setCourseType(e.target.value);
              if (e.target.value !== "CUSTOM") {
                setCustomTypeName("");
              }
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="MINISTERIAL">Ministerial</option>
            <option value="SUMMER">Summer training</option>
            <option value="CUSTOM">Custom (enter name below)</option>
          </select>
        </label>
        {courseType === "CUSTOM" ? (
          <label className="text-sm font-medium text-slate-700">
            Custom Type Name
            <input
              name="customType"
              value={customTypeName}
              onChange={(e) => setCustomTypeName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Enter custom course type name"
              required
            />
          </label>
        ) : (
          <label className="text-sm font-medium text-slate-700">
            Stage (optional)
            <input
              name="stage"
              type="number"
              min="0"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="3"
            />
          </label>
        )}
      </div>
      {courseType === "CUSTOM" && (
        <input type="hidden" name="type" value={customTypeName} />
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Base price (IQD)
          <input
            name="basePrice"
            type="number"
            step="1000"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="50000"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Platform fee
          <div className="mt-1 flex items-center gap-2">
            <input
              name="platformFeePercent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              defaultValue="13.5"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="13.5"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </label>
      </div>
      <label className="text-sm font-medium text-slate-700">
        Distribution template
        <select 
          name="templateId" 
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          defaultValue={defaultTemplateId}
        >
          {defaultTemplateName ? (
            <option value={defaultTemplateId}>
              {defaultTemplateName} (Default for {courseType})
            </option>
          ) : (
            <option value="">Use default for course type</option>
          )}
          {templates
            .filter(t => t.id !== defaultTemplateId)
            .map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
        </select>
        {defaultTemplateName && (
          <p className="mt-1 text-xs text-slate-500">
            Default template "{defaultTemplateName}" will be used. You can select a different template above.
          </p>
        )}
        {courseType === "CUSTOM" && (
          <p className="mt-1 text-xs text-cyan-600">
            For custom course types, create a distribution template below first, then select it here.
          </p>
        )}
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
      {pending ? "Saving..." : "Save course"}
    </button>
  );
}


