"use client";

type Props = {
  state: {
    error?: string;
    success?: string;
  };
};

export function FormStatus({ state }: Props) {
  if (!state?.error && !state?.success) {
    return null;
  }

  if (state.error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {state.success}
      </p>
    );
  }

  return null;
}









