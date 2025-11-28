"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type Props = {
  action: (prev: any, formData: FormData) => Promise<{ success?: string; error?: string }>;
  id: string;
  idFieldName?: string;
  label?: string;
};

export function DeleteButton({ action, id, idFieldName = "id", label = "Delete" }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, { success: "", error: "" });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to ${label.toLowerCase()}? This action cannot be undone.`)) {
      return;
    }

    const formData = new FormData();
    formData.append(idFieldName, id);
    
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <>
      {state.error && (
        <div className="text-red-600 text-xs mb-1">
          {state.error}
        </div>
      )}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
      >
        <Trash2 className="w-3 h-3" />
        {isPending ? "Deleting..." : label}
      </button>
    </>
  );
}

