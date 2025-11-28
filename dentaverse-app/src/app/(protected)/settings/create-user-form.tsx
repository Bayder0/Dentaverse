"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createUserAction } from "@/app/actions";
import { FormStatus } from "@/components/form-status";

const initialState = {
  success: "",
  error: "",
};

export function CreateUserForm() {
  const [state, action] = useActionState(createUserAction, initialState);
  return (
    <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Create new user</h3>
      <label className="text-sm font-medium text-slate-700">
        Full name
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Password
        <input
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="At least 6 characters"
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Role
        <select name="role" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required>
          <option value="SELLER">Seller (can add sales, view own statistics)</option>
          <option value="OWNER">Owner (full access)</option>
        </select>
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
      {pending ? "Creating..." : "Create user"}
    </button>
  );
}


